import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase.config";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { format } from "date-fns";
import NewConversation from "./NewConversation";

export default function ConversationList({
  onSelectConversation,
  selectedConversationId,
}) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [participantProfiles, setParticipantProfiles] = useState({});
  const [otherUsers, setOtherUsers] = useState({});
  const [showNewConversation, setShowNewConversation] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);

    // Query conversations where the current user is a participant
    const conversationsQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageTimestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      async (snapshot) => {
        try {
          const conversationList = [];

          // Process each conversation
          for (const doc of snapshot.docs) {
            const conversationData = { id: doc.id, ...doc.data() };

            // Find the other participant's ID
            const otherUserId = conversationData.participants.find(
              (id) => id !== user.uid
            );

            // Add the conversation to our list
            conversationList.push({
              ...conversationData,
              otherUserId,
            });

            // Fetch user data if we don't have it yet
            if (otherUserId && !otherUsers[otherUserId]) {
              fetchUserData(otherUserId);
            }
          }

          setConversations(conversationList);
          setLoading(false);
        } catch (err) {
          console.error("Error processing conversations:", err);
          setError("Failed to load conversations");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error fetching conversations:", err);
        setError("Failed to load conversations");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Fetch user data for each conversation participant
  const fetchUserData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      const freelancerDoc = await getDoc(doc(db, "freelancers", userId));

      // Combine user and freelancer data
      let userData = userDoc.exists() ? userDoc.data() : {};
      if (freelancerDoc.exists()) {
        userData = { ...userData, ...freelancerDoc.data() };
      }

      setOtherUsers((prev) => ({
        ...prev,
        [userId]: userData,
      }));
    } catch (err) {
      console.error(`Error fetching user data for ${userId}:`, err);
    }
  };

  const getUnreadCount = (conversation) => {
    if (
      !conversation.lastReadTimestamps ||
      !conversation.lastReadTimestamps[user.uid]
    ) {
      return conversation.messages?.length || 0;
    }

    const lastReadTime = conversation.lastReadTimestamps[user.uid];
    let unreadCount = 0;

    if (conversation.messages) {
      unreadCount = conversation.messages.filter(
        (msg) => msg.timestamp > lastReadTime && msg.sender !== user.uid
      ).length;
    }

    return unreadCount;
  };

  // Filter conversations based on search term
  const filteredConversations = conversations.filter((conversation) => {
    if (!searchTerm) return true;

    const otherParticipant = otherUsers[conversation.otherUserId] || {};
    if (!otherParticipant) return false;

    const fullName = `${otherParticipant.firstName || ""} ${
      otherParticipant.lastName || ""
    }`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Handle new conversation created
  const handleNewConversationCreated = (newConversation) => {
    // Add the other user's data to our cache
    setOtherUsers((prev) => ({
      ...prev,
      [newConversation.otherUserId]: newConversation.otherUserData,
    }));

    // Select the newly created conversation
    onSelectConversation(newConversation);

    // Close the new conversation form
    setShowNewConversation(false);
  };

  if (showNewConversation) {
    return (
      <NewConversation
        onConversationCreated={handleNewConversationCreated}
        onCancel={() => setShowNewConversation(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="h-full flex justify-center items-center p-4">
        <div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex justify-center items-center p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="h-full flex justify-center items-center flex-col p-4">
        <p className="text-gray-500 text-center">No conversations yet</p>
        <p className="text-gray-400 text-sm text-center mt-2">
          When you connect with freelancers or clients, your conversations will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Conversations</h2>
          <button
            onClick={() => setShowNewConversation(true)}
            className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            title="New conversation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto flex-grow">
        {filteredConversations.map((conversation) => {
          const otherUser = otherUsers[conversation.otherUserId] || {};
          const unreadCount = getUnreadCount(conversation);
          const isSelected = selectedConversationId === conversation.id;

          return (
            <div
              key={conversation.id}
              className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors flex items-center ${
                isSelected ? "bg-blue-50" : ""
              }`}
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="relative flex-shrink-0">
                {otherUser.profileImageUrl ? (
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
                      {(otherUser.displayName || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {otherUser.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                )}
              </div>

              <div className="ml-3 flex-grow overflow-hidden">
                <div className="flex justify-between">
                  <h3 className="font-medium truncate">
                    {otherUser.displayName || "User"}
                  </h3>
                  {conversation.lastMessageTimestamp && (
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(
                        conversation.lastMessageTimestamp.toDate(),
                        { addSuffix: true }
                      )}
                    </span>
                  )}
                </div>

                <div className="flex justify-between mt-1">
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage || "No messages yet"}
                  </p>

                  {unreadCount > 0 && (
                    <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
