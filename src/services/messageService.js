import { db, storage } from "@/firebase/firebase.config";
import { 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc, 
  serverTimestamp,
  arrayUnion,
  onSnapshot
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Message and conversation service for handling communication between users
 */
const messageService = {
  /**
   * Get all conversations for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} - Array of conversations
   */
  async getUserConversations(userId) {
    try {
      const q = query(
        collection(db, "conversations"),
        where("participantIds", "array-contains", userId),
        orderBy("updatedAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting conversations:", error);
      throw error;
    }
  },

  /**
   * Get or create a conversation between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @param {object} user1Info - First user information (name, image, etc.)
   * @param {object} user2Info - Second user information (name, image, etc.)
   * @param {string} projectId - Optional project ID if conversation is related to a project
   * @returns {Promise<string>} - Conversation ID
   */
  async getOrCreateConversation(userId1, userId2, user1Info, user2Info, projectId = null) {
    try {
      // Check if a conversation already exists
      const q = query(
        collection(db, "conversations"),
        where("participantIds", "array-contains", userId1)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Find conversation that contains both users
      const existingConversation = querySnapshot.docs.find(doc => {
        const data = doc.data();
        return data.participantIds.includes(userId2);
      });
      
      if (existingConversation) {
        return existingConversation.id;
      }
      
      // Create a new conversation
      const participantInfo = {};
      participantInfo[userId1] = user1Info;
      participantInfo[userId2] = user2Info;
      
      const conversationData = {
        participantIds: [userId1, userId2],
        participantInfo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
        unreadCount: {
          [userId1]: 0,
          [userId2]: 0
        }
      };
      
      // Add project ID if provided
      if (projectId) {
        conversationData.projectId = projectId;
      }
      
      const docRef = await addDoc(collection(db, "conversations"), conversationData);
      return docRef.id;
    } catch (error) {
      console.error("Error getting or creating conversation:", error);
      throw error;
    }
  },

  /**
   * Send a message in a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} senderId - Sender user ID
   * @param {string} text - Message text
   * @param {Array} attachments - Optional attachments
   * @param {string} bidId - Optional bid ID if this message is related to a bid
   * @returns {Promise<string>} - Message ID
   */
  async sendMessage(conversationId, senderId, text, attachments = [], bidId = null) {
    try {
      // Get the conversation to determine the recipient
      const conversationRef = doc(db, "conversations", conversationId);
      const conversationSnap = await getDoc(conversationRef);
      
      if (!conversationSnap.exists()) {
        throw new Error("Conversation not found");
      }
      
      const conversationData = conversationSnap.data();
      
      // Find the recipient ID (the other participant)
      const recipientId = conversationData.participantIds.find(id => id !== senderId);
      
      if (!recipientId) {
        throw new Error("Recipient not found in conversation");
      }
      
      // Create the message
      const messageData = {
        conversationId,
        senderId,
        text,
        attachments,
        sentAt: serverTimestamp(),
        readAt: null,
        isSystemMessage: false
      };
      
      // Add bid ID if provided
      if (bidId) {
        messageData.bidId = bidId;
      }
      
      // Save the message
      const docRef = await addDoc(collection(db, "messages"), messageData);
      
      // Update the conversation with last message info
      const unreadUpdate = {};
      unreadUpdate[`unreadCount.${recipientId}`] = conversationData.unreadCount[recipientId] + 1;
      
      await updateDoc(conversationRef, {
        lastMessage: {
          text,
          sentAt: serverTimestamp(),
          sentBy: senderId
        },
        updatedAt: serverTimestamp(),
        ...unreadUpdate
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  /**
   * Get messages for a conversation
   * @param {string} conversationId - Conversation ID
   * @param {number} limit - Number of messages to retrieve
   * @returns {Promise<Array>} - Array of messages
   */
  async getMessages(conversationId, messageLimit = 50) {
    try {
      const q = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId),
        orderBy("sentAt", "desc"),
        limit(messageLimit)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Return messages in chronological order (oldest first)
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .reverse();
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  },

  /**
   * Mark messages as read
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID who is reading the messages
   * @returns {Promise<void>}
   */
  async markMessagesAsRead(conversationId, userId) {
    try {
      // Get unread messages sent to the user
      const q = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId),
        where("senderId", "!=", userId),
        where("readAt", "==", null)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Update each message
      const updatePromises = querySnapshot.docs.map(doc => {
        return updateDoc(doc.ref, {
          readAt: serverTimestamp()
        });
      });
      
      await Promise.all(updatePromises);
      
      // Reset unread count in the conversation
      const conversationRef = doc(db, "conversations", conversationId);
      const update = {};
      update[`unreadCount.${userId}`] = 0;
      
      await updateDoc(conversationRef, update);
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  },

  /**
   * Upload message attachment
   * @param {File} file - File to upload
   * @param {string} senderId - Sender user ID
   * @returns {Promise<object>} - Attachment object
   */
  async uploadAttachment(file, senderId) {
    try {
      // Create a reference to the file location
      const fileExtension = file.name.split('.').pop();
      const fileName = `${senderId}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `message-attachments/${fileName}`);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Determine file type
      const isImage = file.type.startsWith('image/');
      
      return {
        type: isImage ? 'image' : 'file',
        url: downloadUrl,
        name: file.name,
        size: file.size
      };
    } catch (error) {
      console.error("Error uploading attachment:", error);
      throw error;
    }
  },

  /**
   * Subscribe to new messages in a conversation
   * @param {string} conversationId - Conversation ID
   * @param {function} callback - Callback function to receive messages
   * @returns {function} - Unsubscribe function
   */
  subscribeToMessages(conversationId, callback) {
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("sentAt", "desc"),
      limit(1)
    );
    
    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          callback({
            id: change.doc.id,
            ...change.doc.data()
          });
        }
      });
    });
  },

  /**
   * Submit a bid on a project
   * @param {object} bidData - Bid data
   * @returns {Promise<string>} - Bid ID
   */
  async submitBid(bidData) {
    try {
      // Add timestamp
      const fullBidData = {
        ...bidData,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "pending"
      };
      
      // Save the bid
      const docRef = await addDoc(collection(db, "project_bids"), fullBidData);
      
      // Create or get conversation between client and freelancer
      const conversationId = await this.getOrCreateConversation(
        bidData.clientId, 
        bidData.freelancerId,
        bidData.clientInfo,
        bidData.freelancerInfo,
        bidData.projectId
      );
      
      // Send a message about the bid
      const bidMessage = `A new bid has been submitted for project: ${bidData.projectTitle}`;
      await this.sendMessage(conversationId, bidData.freelancerId, bidMessage, [], docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error("Error submitting bid:", error);
      throw error;
    }
  },

  /**
   * Get bids for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - Array of bids
   */
  async getProjectBids(projectId) {
    try {
      const q = query(
        collection(db, "project_bids"),
        where("projectId", "==", projectId),
        orderBy("submittedAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting project bids:", error);
      throw error;
    }
  },

  /**
   * Update bid status
   * @param {string} bidId - Bid ID
   * @param {string} status - New status (accepted, rejected, countered, withdrawn)
   * @param {object} updateData - Additional data for updates
   * @returns {Promise<void>}
   */
  async updateBidStatus(bidId, status, updateData = {}) {
    try {
      const bidRef = doc(db, "project_bids", bidId);
      const bidSnap = await getDoc(bidRef);
      
      if (!bidSnap.exists()) {
        throw new Error("Bid not found");
      }
      
      const bid = bidSnap.data();
      
      await updateDoc(bidRef, {
        status,
        updatedAt: serverTimestamp(),
        ...updateData
      });
      
      // Get conversation between client and freelancer
      const q = query(
        collection(db, "conversations"),
        where("participantIds", "array-contains", bid.clientId),
        where("projectId", "==", bid.projectId)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Find conversation that contains both client and freelancer
      const conversation = querySnapshot.docs.find(doc => {
        const data = doc.data();
        return data.participantIds.includes(bid.freelancerId);
      });
      
      if (conversation) {
        // Send a system message about the bid status update
        let statusMessage;
        
        switch (status) {
          case 'accepted':
            statusMessage = "The bid has been accepted! You can now start working on the project.";
            break;
          case 'rejected':
            statusMessage = "The bid has been rejected.";
            break;
          case 'countered':
            statusMessage = "A counter offer has been made for this bid.";
            break;
          case 'withdrawn':
            statusMessage = "The bid has been withdrawn.";
            break;
          default:
            statusMessage = `The bid status has been updated to: ${status}`;
        }
        
        // Create the system message
        const messageData = {
          conversationId: conversation.id,
          senderId: bid.clientId, // System messages come from the client
          text: statusMessage,
          sentAt: serverTimestamp(),
          readAt: null,
          bidId: bidId,
          isSystemMessage: true
        };
        
        await addDoc(collection(db, "messages"), messageData);
      }
    } catch (error) {
      console.error("Error updating bid status:", error);
      throw error;
    }
  }
};

export default messageService; 