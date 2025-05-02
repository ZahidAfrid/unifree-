import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase.config";
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
  limit,
  arrayUnion,
} from "firebase/firestore";
import Image from "next/image";
import { formatDistanceToNow, format } from "date-fns";
import { FaPaperclip, FaPaperPlane } from "react-icons/fa";

export default function MessageThread({ conversation, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);

  // Scroll to the most recent message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Set up messages listener
  useEffect(() => {
    if (!conversation?.id || !user) return;

    setLoading(true);

    // Get messages for this conversation
    const messagesQuery = query(
      collection(db, `conversations/${conversation.id}/messages`),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        try {
          const messageList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setMessages(messageList);
          setLoading(false);

          // Mark messages as read
          updateReadStatus(conversation.id);

          // Scroll to bottom on new messages
          setTimeout(scrollToBottom, 100);
        } catch (err) {
          console.error("Error processing messages:", err);
          setError("Failed to load messages");
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching messages:", error);
        setError("Failed to load messages");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [conversation, user]);

  // Fetch the other user's data
  useEffect(() => {
    if (!conversation?.otherUserId) return;

    const fetchOtherUser = async () => {
      try {
        // Check if the user data is passed with the conversation
        if (conversation.otherUserData) {
          setOtherUser(conversation.otherUserData);
          return;
        }

        // Otherwise fetch from Firestore
        const userDoc = await getDoc(
          doc(db, "users", conversation.otherUserId)
        );
        const freelancerDoc = await getDoc(
          doc(db, "freelancers", conversation.otherUserId)
        );

        let userData = userDoc.exists() ? userDoc.data() : {};
        if (freelancerDoc.exists()) {
          userData = { ...userData, ...freelancerDoc.data() };
        }

        setOtherUser(userData);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchOtherUser();
  }, [conversation?.otherUserId]);

  // Update read status when viewing conversation
  const updateReadStatus = async (conversationId) => {
    if (!user?.uid) return;

    try {
      const conversationRef = doc(db, "conversations", conversationId);

      await updateDoc(conversationRef, {
        [`lastReadTimestamps.${user.uid}`]: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error updating read status:", err);
    }
  };

  // Send a new message
  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !conversation?.id || !user) return;

    setSending(true);

    try {
      const messageData = {
        text: newMessage.trim(),
        sender: user.uid,
        timestamp: serverTimestamp(),
        read: false,
      };

      // Add message to the messages subcollection
      await addDoc(
        collection(db, `conversations/${conversation.id}/messages`),
        messageData
      );

      // Update conversation with last message
      await updateDoc(doc(db, "conversations", conversation.id), {
        lastMessage: newMessage.trim(),
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSender: user.uid,
      });

      // Clear input
      setNewMessage("");

      // Focus back on input
      inputRef.current?.focus();
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="h-full flex justify-center items-center">
        <div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex justify-center items-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="h-full flex justify-center items-center flex-col p-4">
        <p className="text-gray-500 text-center">Select a conversation</p>
        <p className="text-gray-400 text-sm text-center mt-2">
          Choose a conversation from the list to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center">
        <button onClick={onBack} className="mr-3 md:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex items-center">
          <div className="relative">
            {otherUser?.profileImageUrl ? (
              <Image
                src={otherUser.profileImageUrl}
                alt={otherUser.displayName || "User"}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600">
                  {(otherUser?.displayName || "U").charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {otherUser?.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            )}
          </div>

          <div className="ml-3">
            <h3 className="font-medium">{otherUser?.displayName || "User"}</h3>
            <p className="text-xs text-gray-500">
              {otherUser?.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex justify-center items-center flex-col">
            <p className="text-gray-500 text-center">No messages yet</p>
            <p className="text-gray-400 text-sm text-center mt-2">
              Start the conversation by sending a message
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.sender === user.uid;
            const showDate =
              index === 0 ||
              (messages[index - 1].timestamp &&
                message.timestamp &&
                new Date(
                  messages[index - 1].timestamp.toDate()
                ).toDateString() !==
                  new Date(message.timestamp.toDate()).toDateString());

            return (
              <div key={message.id}>
                {showDate && message.timestamp && (
                  <div className="text-center my-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {format(message.timestamp.toDate(), "MMMM d, yyyy")}
                    </span>
                  </div>
                )}

                <div
                  className={`flex mb-3 ${
                    isCurrentUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`
                      max-w-[75%] rounded-lg px-4 py-2 
                      ${
                        isCurrentUser
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-gray-200 text-gray-800 rounded-bl-none"
                      }
                    `}
                  >
                    <p>{message.text}</p>
                    {message.timestamp && (
                      <div
                        className={`text-xs mt-1 ${
                          isCurrentUser ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {format(message.timestamp.toDate(), "h:mm a")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <form onSubmit={sendMessage} className="flex items-center">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-l-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            ref={inputRef}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`
              bg-blue-500 text-white py-2 px-4 rounded-r-md
              ${
                !newMessage.trim() || sending
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-600"
              }
            `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
