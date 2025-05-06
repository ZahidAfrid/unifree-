import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase.config";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  or,
  and,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import Image from "next/image";

export default function NewConversation({ onConversationCreated, onCancel }) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Search for users
  const searchUsers = async (term) => {
    if (!term.trim() || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      // Search in users collection
      const usersQuery = query(
        collection(db, "users"),
        or(
          where("displayName", ">=", term),
          where("displayName", "<=", term + "\uf8ff"),
          where("email", ">=", term),
          where("email", "<=", term + "\uf8ff")
        )
      );

      // Search in freelancers collection
      const freelancersQuery = query(
        collection(db, "freelancers"),
        or(
          where("fullName", ">=", term),
          where("fullName", "<=", term + "\uf8ff"),
          where("skills", "array-contains", term)
        )
      );

      const [usersSnapshot, freelancersSnapshot] = await Promise.all([
        getDocs(usersQuery),
        getDocs(freelancersQuery),
      ]);

      // Combine and format results
      const users = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: "user",
      }));

      const freelancers = freelancersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: "freelancer",
      }));

      // Merge results and remove duplicates (user might be both a regular user and a freelancer)
      const combinedResults = [...users];

      freelancers.forEach((freelancer) => {
        const existingIndex = combinedResults.findIndex(
          (user) => user.id === freelancer.id
        );

        if (existingIndex === -1) {
          combinedResults.push(freelancer);
        } else {
          combinedResults[existingIndex] = {
            ...combinedResults[existingIndex],
            ...freelancer,
            type: "both",
          };
        }
      });

      // Filter out current user
      const filteredResults = combinedResults.filter(
        (result) => result.id !== user.uid
      );

      setSearchResults(filteredResults);
    } catch (err) {
      console.error("Error searching users:", err);
      setError("Failed to search users. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  // Handle search input changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchUsers(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Create a new conversation and send first message
  const startConversation = async (e) => {
    e.preventDefault();

    if (!selectedUser || !message.trim() || !user) return;

    setSending(true);
    setError(null);

    try {
      // Check if conversation already exists
      const conversationsQuery = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.uid)
      );

      const conversationsSnapshot = await getDocs(conversationsQuery);
      const existingConversation = conversationsSnapshot.docs.find((doc) => {
        const participants = doc.data().participants || [];
        return (
          participants.length === 2 &&
          participants.includes(user.uid) &&
          participants.includes(selectedUser.id)
        );
      });

      let conversationId;

      if (existingConversation) {
        // Use existing conversation
        conversationId = existingConversation.id;
      } else {
        // Create new conversation
        const conversationData = {
          participants: [user.uid, selectedUser.id],
          createdAt: serverTimestamp(),
          lastMessageTimestamp: serverTimestamp(),
          lastMessage: message.trim(),
          lastMessageSender: user.uid,
          lastReadTimestamps: {
            [user.uid]: serverTimestamp(),
          },
        };

        const conversationRef = await addDoc(
          collection(db, "conversations"),
          conversationData
        );
        conversationId = conversationRef.id;
      }

      // Add first message
      await addDoc(collection(db, `conversations/${conversationId}/messages`), {
        text: message.trim(),
        sender: user.uid,
        timestamp: serverTimestamp(),
        read: false,
      });

      // Create full conversation object to return
      const newConversation = {
        id: conversationId,
        participants: [user.uid, selectedUser.id],
        otherUserId: selectedUser.id,
        otherUserData: selectedUser,
        lastMessage: message.trim(),
        lastMessageSender: user.uid,
        unreadCount: 0,
      };

      // Clear form
      setSelectedUser(null);
      setMessage("");
      setSearchTerm("");
      setSearchResults([]);

      // Notify parent
      onConversationCreated(newConversation);
    } catch (err) {
      console.error("Error creating conversation:", err);
      setError("Failed to create conversation. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Format user display name based on available data
  const getUserDisplayName = (userData) => {
    if (userData.displayName) return userData.displayName;
    if (userData.fullName) return userData.fullName;
    if (userData.firstName && userData.lastName)
      return `${userData.firstName} ${userData.lastName}`;
    if (userData.email) return userData.email.split("@")[0];
    return "User";
  };

  // Get user avatar
  const getUserAvatar = (userData) => {
    return userData.profileImageUrl || userData.photoURL || null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 flex items-center">
        <button onClick={onCancel} className="mr-3">
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
        <h3 className="font-medium">New Conversation</h3>
      </div>

      <div className="p-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          )}
        </div>

        {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
      </div>

      {selectedUser ? (
        <div className="flex-grow p-3">
          <div className="mb-4 p-3 border border-gray-200 rounded-md flex items-center">
            <div className="relative">
              {getUserAvatar(selectedUser) ? (
                <Image
                  src={getUserAvatar(selectedUser)}
                  alt={getUserDisplayName(selectedUser)}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600">
                    {getUserDisplayName(selectedUser).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="ml-3 flex-grow">
              <h4 className="font-medium">
                {getUserDisplayName(selectedUser)}
              </h4>
              {selectedUser.type === "freelancer" && (
                <p className="text-xs text-gray-500">Freelancer</p>
              )}
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={startConversation}>
            <div className="mb-3">
              <textarea
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                required
              />
            </div>

            <button
              type="submit"
              disabled={!message.trim() || sending}
              className={`
                w-full py-2 px-4 rounded-md text-white
                ${
                  !message.trim() || sending
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }
              `}
            >
              {sending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                "Start Conversation"
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto">
          {searchResults.length === 0 && searchTerm.length > 1 && !searching ? (
            <div className="p-4 text-center text-gray-500">
              <p>No users found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : searchTerm.length < 2 ? (
            <div className="p-4 text-center text-gray-500">
              <p>Search for users to start a conversation</p>
              <p className="text-sm mt-1">Enter at least 2 characters</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {searchResults.map((result) => (
                <li key={result.id}>
                  <button
                    onClick={() => setSelectedUser(result)}
                    className="w-full p-3 flex items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative">
                      {getUserAvatar(result) ? (
                        <Image
                          src={getUserAvatar(result)}
                          alt={getUserDisplayName(result)}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600">
                            {getUserDisplayName(result).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="ml-3 text-left">
                      <h4 className="font-medium">
                        {getUserDisplayName(result)}
                      </h4>
                      {result.type === "freelancer" && (
                        <p className="text-xs text-gray-500">Freelancer</p>
                      )}
                      {result.skills && result.skills.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Skills: {result.skills.slice(0, 3).join(", ")}
                          {result.skills.length > 3 && "..."}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
