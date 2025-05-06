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
} from "react-icons/fi";
import toast from "react-hot-toast";
import Head from "next/head";
import Image from "next/image";

export default function Messages() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showConversationList, setShowConversationList] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchUnreadCounts();
    } else {
      router.push("/login");
    }
  }, [user, fetchConversations, fetchUnreadCounts, router]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      markMessagesAsRead();
    }
  }, [
    selectedConversation,
    fetchMessages,
    markMessagesAsRead,
    typingTimeout,
    user?.id,
  ]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = conversations.filter((conv) => {
        const otherUser = conv.user1_id === user?.id ? conv.user2 : conv.user1;
        return (
          otherUser.full_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (conv.project?.title || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      });
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchTerm, conversations, user]);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const q = query(
        collection(db, "messages"),
        where("receiver_id", "==", user.uid),
        where("read", "==", false)
      );
      const snapshot = await getDocs(q);

      const counts = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const convId = data.conversation_id;
        counts[convId] = (counts[convId] || 0) + 1;
      });

      setUnreadCounts(counts);
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  }, [user]);

  const fetchConversations = useCallback(async () => {
    try {
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.uid),
        orderBy("updated_at", "desc")
      );
      const snapshot = await getDocs(q);
      const results = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const otherUserId =
          data.user1_id === user.uid ? data.user2_id : data.user1_id;

        const otherUserRef = doc(db, "profiles", otherUserId);
        const otherUserSnap = await getDoc(otherUserRef);
        const otherUserData = otherUserSnap.exists()
          ? otherUserSnap.data()
          : {};

        const projectRef = doc(db, "projects", data.project_id);
        const projectSnap = await getDoc(projectRef);
        const projectData = projectSnap.exists() ? projectSnap.data() : {};

        results.push({
          id: docSnap.id,
          ...data,
          user1: data.user1_id === user.uid ? user : otherUserData,
          user2: data.user2_id === user.uid ? user : otherUserData,
          project: projectData,
        });
      }

      setConversations(results);
      setFilteredConversations(results);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async () => {
    try {
      const q = query(
        collection(db, "messages"),
        where("conversation_id", "==", selectedConversation.id),
        orderBy("created_at", "asc")
      );
      const snapshot = await getDocs(q);
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [selectedConversation]);

  const markMessagesAsRead = useCallback(async () => {
    try {
      const q = query(
        collection(db, "messages"),
        where("conversation_id", "==", selectedConversation.id),
        where("receiver_id", "==", user.uid),
        where("read", "==", false)
      );
      const unreadSnap = await getDocs(q);

      for (const docSnap of unreadSnap.docs) {
        await updateDoc(doc(db, "messages", docSnap.id), { read: true });
      }

      setUnreadCounts((prev) => ({
        ...prev,
        [selectedConversation.id]: 0,
      }));
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [selectedConversation, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const otherUser = getOtherUser(selectedConversation);
      await addDoc(collection(db, "messages"), {
        conversation_id: selectedConversation.id,
        sender_id: user.uid,
        receiver_id: otherUser.id,
        content: newMessage,
        read: false,
        created_at: new Date(),
      });

      await updateDoc(doc(db, "conversations", selectedConversation.id), {
        updated_at: new Date(),
      });

      setNewMessage("");
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleTyping = () => {
    // (Optional) You can implement this later using Firestore or Firebase Realtime DB
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Handle file upload logic here
    toast.success("File upload feature coming soon!");
  };

  const getOtherUser = (conversation) => {
    return conversation.user1_id === user?.id
      ? conversation.user2
      : conversation.user1;
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Messages | Student Freelance Platform</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-12rem)]">
              {/* Conversations List */}
              <AnimatePresence>
                {(showConversationList || window.innerWidth >= 768) && (
                  <motion.div
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-r border-gray-200 overflow-y-auto md:block"
                  >
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">
                          Messages
                        </h1>
                        {window.innerWidth < 768 && selectedConversation && (
                          <button
                            onClick={() => setShowConversationList(false)}
                            className="md:hidden text-gray-500 hover:text-gray-700"
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
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Search conversations..."
                        />
                      </div>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {filteredConversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No conversations found
                        </div>
                      ) : (
                        filteredConversations.map((conversation) => {
                          const otherUser = getOtherUser(conversation);
                          const unreadCount =
                            unreadCounts[conversation.id] || 0;

                          return (
                            <div
                              key={conversation.id}
                              onClick={() => {
                                setSelectedConversation(conversation);
                                if (window.innerWidth < 768) {
                                  setShowConversationList(false);
                                }
                              }}
                              className={`p-4 cursor-pointer hover:bg-gray-50 ${
                                selectedConversation?.id === conversation.id
                                  ? "bg-blue-50"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center">
                                <div className="relative">
                                  <Image
                                    src={
                                      otherUser.avatar_url ||
                                      "/images/default-avatar.png"
                                    }
                                    alt={otherUser.full_name}
                                    width={40}
                                    height={40}
                                    className="rounded-full"
                                  />
                                  {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                      {unreadCount}
                                    </span>
                                  )}
                                </div>
                                <div className="ml-3 flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900">
                                      {otherUser.full_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(
                                        conversation.updated_at
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {conversation.project && (
                                    <p className="text-xs text-gray-500 flex items-center">
                                      <FiBriefcase className="mr-1" />
                                      {conversation.project.title}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages Area */}
              <div className="md:col-span-2 flex flex-col">
                {selectedConversation ? (
                  <>
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center">
                        {window.innerWidth < 768 && (
                          <button
                            onClick={() => setShowConversationList(true)}
                            className="mr-3 text-gray-500 hover:text-gray-700"
                          >
                            <FiX size={24} />
                          </button>
                        )}
                        <Image
                          src={
                            getOtherUser(selectedConversation).avatar_url ||
                            "/images/default-avatar.png"
                          }
                          alt={getOtherUser(selectedConversation).full_name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {getOtherUser(selectedConversation).full_name}
                          </p>
                          {selectedConversation.project && (
                            <p className="text-xs text-gray-500 flex items-center">
                              <FiBriefcase className="mr-1" />
                              {selectedConversation.project.title}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex ${
                            message.sender_id === user?.id
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                              message.sender_id === user?.id
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {formatMessageTime(message.created_at)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                            <p className="text-sm italic">Typing...</p>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t border-gray-200">
                      <form
                        onSubmit={handleSendMessage}
                        className="flex items-center"
                      >
                        <div className="flex-1 flex items-center bg-gray-100 rounded-lg px-3 py-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-gray-500 hover:text-gray-700 mr-2"
                          >
                            <FiPaperclip size={20} />
                          </button>
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => {
                              setNewMessage(e.target.value);
                              handleTyping();
                            }}
                            className="flex-1 bg-transparent border-0 focus:ring-0 text-sm"
                            placeholder="Type a message..."
                          />
                          <button
                            type="button"
                            className="text-gray-500 hover:text-gray-700 mx-2"
                          >
                            <FiSmile size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <FiImage size={20} />
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                        <button
                          type="submit"
                          className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FiSend className="mr-2" />
                          Send
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No conversation selected
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Select a conversation from the list to start messaging
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
