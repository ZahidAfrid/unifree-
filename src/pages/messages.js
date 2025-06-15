import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/firebase/firebase.config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  limit,
} from "firebase/firestore";

import { useAuth } from "@/contexts/AuthContext";
import {
  FiMessageSquare,
  FiSend,
  FiSearch,
  FiUser,
  FiBriefcase,
  FiPaperclip,
  FiSmile,
  FiImage,
  FiX,
  FiArrowLeft,
  FiUpload,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Head from "next/head";
import Image from "next/image";
import { sendMessageNotification } from "@/utils/notifications";
import { 
  subscribeToUserConversations,
  subscribeToMessages,
  sendMessage,
  sendMessageWithFile,
  markMessagesAsRead
} from '@/utils/messaging';
import { FaSpinner } from 'react-icons/fa';
import FileAttachment from '@/components/FileAttachment';
import EmojiPicker from '@/components/EmojiPicker';

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConversationList, setShowConversationList] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Real-time listeners cleanup functions
  const conversationsUnsubscribe = useRef(null);
  const messagesUnsubscribe = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations with real-time updates
  useEffect(() => {
    console.log("🔄 useEffect triggered, user:", user);
    
    if (!user?.uid) {
      console.log("❌ No user UID, skipping conversations setup");
      setLoading(false);
      return;
    }

    console.log("🔄 Setting up conversations listener for user:", user.uid);
    
    // Set up real-time listener for conversations
    conversationsUnsubscribe.current = subscribeToUserConversations(
      user.uid,
      (updatedConversations) => {
        console.log("📨 Conversations callback triggered with:", updatedConversations.length, "conversations");
        console.log("📨 Conversations data:", updatedConversations);
        setConversations(updatedConversations);
        setLoading(false);
      }
    );

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up conversations listener");
      if (conversationsUnsubscribe.current) {
        conversationsUnsubscribe.current();
      }
    };
  }, [user?.uid]);

  // Set up real-time messages listener when conversation is selected
  useEffect(() => {
    if (!selectedConversation?.id) {
      setMessages([]);
      return;
    }

    console.log("🔄 Setting up messages listener for:", selectedConversation.id);
    
    // Clean up previous messages listener
    if (messagesUnsubscribe.current) {
      messagesUnsubscribe.current();
    }

    // Set up new messages listener
    messagesUnsubscribe.current = subscribeToMessages(
      selectedConversation.id,
      (updatedMessages) => {
        console.log("📨 Messages updated:", updatedMessages.length);
        setMessages(updatedMessages);
      }
    );

    // Mark messages as read when conversation is opened
    if (user?.uid) {
      markMessagesAsRead(selectedConversation.id, user.uid);
    }

    // Cleanup function
    return () => {
      if (messagesUnsubscribe.current) {
        messagesUnsubscribe.current();
      }
    };
  }, [selectedConversation?.id, user?.uid]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.lastMessage?.toLowerCase().includes(searchLower) ||
      conv.otherUser?.name?.toLowerCase().includes(searchLower) ||
      conv.currentProject?.title?.toLowerCase().includes(searchLower)
    );
  });

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      await sendMessage(
        selectedConversation.id,
        user.uid,
        user.displayName || 'User',
        newMessage.trim(),
        selectedConversation.currentProject?.id,
        selectedConversation.currentProject?.title
      );
      
      // Send notification to receiver
      try {
        await sendMessageNotification(
          selectedConversation.otherUser.id,
          selectedConversation.participantInfo[user.uid]?.name || 'Someone',
          selectedConversation.currentProject?.title || 'General Chat',
          selectedConversation.id
        );
      } catch (error) {
        console.error("Error sending message notification:", error);
        // Don't fail the message send if notification fails
      }

      setNewMessage("");
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedConversation || !user) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    try {
      await sendMessageWithFile(
        selectedConversation.id,
        user.uid,
        user.displayName || 'User',
        file,
        '',
        selectedConversation.currentProject?.id,
        selectedConversation.currentProject?.title
      );
      
      // Send notification to receiver
      try {
        await sendMessageNotification(
          selectedConversation.otherUser.id,
          selectedConversation.participantInfo[user.uid]?.name || 'Someone',
          selectedConversation.currentProject?.title || 'General Chat',
          selectedConversation.id
        );
      } catch (error) {
        console.error("Error sending message notification:", error);
      }

      toast.success("File sent successfully!");
      
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to send file");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };



  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker) {
        const target = event.target;
        const isEmojiButton = target.closest('[title="Add emoji"]');
        const isEmojiPicker = target.closest('.emoji-picker');
        
        if (!isEmojiButton && !isEmojiPicker && showEmojiPicker) {
          setShowEmojiPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);



  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // If message is from today, show time only
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // If message is from this week, show day name
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Otherwise show full date
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return "";
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60 * 1000) return "Just now";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
    
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Messages | Student Freelance Platform</title>
        <style jsx>{`
          .messages-scroll {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 #f1f5f9;
          }
          .messages-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .messages-scroll::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
          }
          .messages-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }
          .messages-scroll::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>
      </Head>
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-20 pb-4 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-white/20 h-full flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-3 flex-1 min-h-0">
              {/* Conversations List */}
              <AnimatePresence>
                {(showConversationList || window.innerWidth >= 768) && (
                  <motion.div
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-r border-gray-200 md:block bg-gradient-to-b from-gray-50 to-white flex flex-col h-full min-h-0"
                  >
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-white drop-shadow-md">
                          Messages
                        </h1>
                        {typeof window !== 'undefined' && window.innerWidth < 768 && selectedConversation && (
                          <button
                            onClick={() => setShowConversationList(false)}
                            className="md:hidden text-white/80 hover:text-white"
                          >
                            <FiX size={24} />
                          </button>
                        )}
                      </div>
                      <div className="mt-4 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiSearch className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-white/20 rounded-lg leading-5 bg-white/90 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-white sm:text-sm backdrop-blur-sm"
                          placeholder="Search conversations..."
                        />
                      </div>
                    </div>
                    <div className="divide-y divide-gray-200 flex-1 overflow-y-auto messages-scroll">
                      {filteredConversations.length === 0 ? (
                        <div className="p-8 text-center">
                          <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                          <p className="text-gray-500 text-sm mb-4">
                            Start messaging with freelancers or clients to see conversations here.
                          </p>
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
                            <h4 className="font-semibold text-indigo-900 mb-2">How messaging works:</h4>
                            <ul className="text-sm text-indigo-700 space-y-1 text-left">
                              <li>• <strong>Clients:</strong> Message freelancers directly from their profiles</li>
                              <li>• <strong>Freelancers:</strong> Respond to client messages</li>
                              <li>• <strong>Project-based:</strong> Conversations continue when proposals are accepted</li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        filteredConversations.map((conversation) => {
                          return (
                            <motion.div
                              key={conversation.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ backgroundColor: "#f9fafb" }}
                              onClick={() => {
                                setSelectedConversation(conversation);
                                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                  setShowConversationList(false);
                                }
                              }}
                              className={`p-4 cursor-pointer transition-all duration-200 ${
                                selectedConversation?.id === conversation.id
                                  ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-r-4 border-indigo-500"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center">
                                <div className="relative">
                                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-lg">
                                    {conversation.otherUser?.profileImageUrl ? (
                                      <Image
                                        src={conversation.otherUser.profileImageUrl}
                                        alt={conversation.otherUser.name || "User"}
                                        width={48}
                                        height={48}
                                        className="rounded-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-lg">
                                        {(conversation.otherUser?.name || "U").charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  {conversation.unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-lg">
                                      {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                                    </span>
                                  )}
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                      {conversation.otherUser?.name || "Unknown User"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatLastMessageTime(conversation.lastMessageAt)}
                                    </p>
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <span className={`text-xs px-2 py-1 rounded-full mr-2 ${
                                      conversation.otherUser?.userType === 'freelancer' 
                                        ? 'bg-green-100 text-green-600' 
                                        : 'bg-blue-100 text-blue-600'
                                    }`}>
                                      {conversation.otherUser?.userType === 'freelancer' ? 'Freelancer' : 'Client'}
                                    </span>
                                  </div>
                                  {conversation.currentProject && (
                                    <p className="text-xs text-indigo-600 flex items-center mt-1 font-medium">
                                      <FiBriefcase className="mr-1" />
                                      {conversation.currentProject.title}
                                    </p>
                                  )}
                                  {conversation.lastMessage && (
                                    <p className="text-xs text-gray-500 truncate mt-1">
                                      {conversation.lastMessage}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages Area */}
              <div className="md:col-span-2 flex flex-col h-full min-h-0">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50 flex-shrink-0">
                      <div className="flex items-center">
                        {typeof window !== 'undefined' && window.innerWidth < 768 && (
                          <button
                            onClick={() => setShowConversationList(true)}
                            className="mr-3 text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
                          >
                            <FiArrowLeft size={20} />
                          </button>
                        )}
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-md">
                          {selectedConversation.otherUser?.profileImageUrl ? (
                            <Image
                              src={selectedConversation.otherUser.profileImageUrl}
                              alt={selectedConversation.otherUser.name || "User"}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <span>
                              {(selectedConversation.otherUser?.name || "U").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-gray-900">
                            {selectedConversation.otherUser?.name || "Unknown User"}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              selectedConversation.otherUser?.userType === 'freelancer' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              {selectedConversation.otherUser?.userType === 'freelancer' ? 'Freelancer' : 'Client'}
                            </span>
                            {selectedConversation.currentProject && (
                              <p className="text-xs text-indigo-600 flex items-center font-medium">
                                <FiBriefcase className="mr-1" />
                                {selectedConversation.currentProject.title}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white min-h-0 messages-scroll">
                      {messages.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center">
                            <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start the conversation</h3>
                            <p className="text-sm text-gray-500">
                              Send a message to begin discussing {selectedConversation.currentProject ? 'the project details' : 'with this user'}.
                            </p>
                          </div>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex ${
                              message.senderId === user?.uid
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div className="space-y-2">
                              {/* File Attachment */}
                              {message.type === 'file' && message.attachmentData && (
                                <FileAttachment
                                  file={message.attachmentData}
                                  isOwn={message.senderId === user?.uid}
                                />
                              )}
                              
                              {/* Regular Text Message */}
                              {(!message.type || message.type === 'text') && (
                                <div
                                  className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                                    message.senderId === user?.uid
                                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                      : message.senderId === 'system'
                                      ? "bg-gradient-to-r from-green-100 to-blue-100 text-gray-800 border border-green-200"
                                      : "bg-white text-gray-900 border border-gray-200"
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed">{message.content}</p>
                                  <p className={`text-xs mt-2 ${
                                    message.senderId === user?.uid ? "text-white/70" : 
                                    message.senderId === 'system' ? "text-gray-600" : "text-gray-500"
                                  }`}>
                                    {formatMessageTime(message.createdAt)}
                                  </p>
                                </div>
                              )}
                              
                              {/* File message with text */}
                              {message.type === 'file' && message.content && !message.content.startsWith('Sent a file:') && (
                                <div
                                  className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                                    message.senderId === user?.uid
                                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                      : "bg-white text-gray-900 border border-gray-200"
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed">{message.content}</p>
                                  <p className={`text-xs mt-2 ${
                                    message.senderId === user?.uid ? "text-white/70" : "text-gray-500"
                                  }`}>
                                    {formatMessageTime(message.createdAt)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0 relative">

                      
                      {/* Emoji Picker */}
                      {showEmojiPicker && (
                        <div className="absolute bottom-full right-0 mb-2 z-50">
                          <EmojiPicker
                            onEmojiSelect={handleEmojiSelect}
                            onClose={() => setShowEmojiPicker(false)}
                          />
                        </div>
                      )}
                      
                      <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                        <div className="flex-1 flex items-center bg-gray-100 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                          {/* File Upload Button */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="text-gray-500 hover:text-gray-700 mr-3 p-1 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            title="Attach file"
                          >
                            {isUploading ? (
                              <FaSpinner className="animate-spin" size={18} />
                            ) : (
                              <FiPaperclip size={18} />
                            )}
                          </button>
                          
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 bg-transparent border-0 focus:ring-0 text-sm placeholder-gray-500"
                            placeholder="Type your message..."
                          />
                          
                          {/* Emoji Button */}
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="text-gray-500 hover:text-gray-700 mx-2 p-1 rounded-lg hover:bg-gray-200 transition-colors"
                            title="Add emoji"
                          >
                            <FiSmile size={18} />
                          </button>
                          

                          
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept="*/*"
                          />
                        </div>
                        
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || isUploading}
                          className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                        >
                          <FiSend className="mr-2" />
                          Send
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50/50 to-white">
                    <div className="text-center">
                      <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mb-6">
                        <FiMessageSquare className="h-12 w-12 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-gray-500 max-w-sm">
                        Choose a conversation from the list to start messaging with your clients or freelancers.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
