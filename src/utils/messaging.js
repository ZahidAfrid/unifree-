import { db, storage } from '@/firebase/firebase.config';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  setDoc,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Upload file to Firebase Storage
export const uploadMessageFile = async (file, conversationId, senderId) => {
  try {
    console.log("📁 Uploading file:", file.name);
    
    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `message_attachments/${conversationId}/${fileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, filePath);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    console.log("✅ File uploaded successfully");
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("✅ Download URL obtained:", downloadURL);
    
    return {
      url: downloadURL,
      name: file.name,
      size: file.size,
      type: file.type,
      path: filePath
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Upload voice message to Firebase Storage
export const uploadVoiceMessage = async (audioBlob, conversationId, senderId) => {
  try {
    console.log("🎤 Uploading voice message");
    
    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `voice_${timestamp}.webm`;
    const filePath = `voice_messages/${conversationId}/${fileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, filePath);
    
    // Upload audio blob
    const snapshot = await uploadBytes(storageRef, audioBlob);
    console.log("✅ Voice message uploaded successfully");
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("✅ Voice message URL obtained:", downloadURL);
    
    return {
      url: downloadURL,
      size: audioBlob.size,
      type: audioBlob.type,
      path: filePath
    };
  } catch (error) {
    console.error('Error uploading voice message:', error);
    throw error;
  }
};

// Send a voice message
export const sendVoiceMessage = async (
  conversationId,
  senderId,
  senderName,
  audioBlob,
  duration,
  projectId = null,
  projectTitle = null
) => {
  try {
    console.log("🎤 Sending voice message");
    
    // Upload voice message first
    const voiceData = await uploadVoiceMessage(audioBlob, conversationId, senderId);
    
    // Add duration to voice data
    voiceData.duration = duration;
    
    // Send message with voice attachment
    return await sendMessage(
      conversationId,
      senderId,
      senderName,
      'Voice message',
      projectId,
      projectTitle,
      'voice',
      voiceData
    );
  } catch (error) {
    console.error('Error sending voice message:', error);
    throw error;
  }
};

// Send a message with file attachment
export const sendMessageWithFile = async (
  conversationId,
  senderId,
  senderName,
  file,
  message = '',
  projectId = null,
  projectTitle = null
) => {
  try {
    console.log("📤 Sending message with file attachment");
    
    // Upload file first
    const fileData = await uploadMessageFile(file, conversationId, senderId);
    
    // Send message with file attachment
    return await sendMessage(
      conversationId,
      senderId,
      senderName,
      message || `Sent a file: ${file.name}`,
      projectId,
      projectTitle,
      'file',
      fileData
    );
  } catch (error) {
    console.error('Error sending message with file:', error);
    throw error;
  }
};

// Create or get unified conversation between client and freelancer
export const getOrCreateConversation = async (clientId, freelancerId, projectId = null, projectTitle = null) => {
  try {
    console.log("🔍 Getting/creating conversation between:", clientId, "and", freelancerId, "for project:", projectId);
    
    // Check if conversation already exists between these two users
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', clientId)
    );

    const querySnapshot = await getDocs(q);
    
    // Find conversation that contains both users
    let existingConversation = null;
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      if (data.participants.includes(freelancerId)) {
        existingConversation = {
          id: docSnap.id,
          ...data
        };
        break;
      }
    }
    
    if (existingConversation) {
      console.log("✅ Found existing conversation:", existingConversation.id);
      
      // If this is for a new project, add it to associated projects
      if (projectId && !existingConversation.associatedProjects?.includes(projectId)) {
        await updateDoc(doc(db, 'conversations', existingConversation.id), {
          associatedProjects: [...(existingConversation.associatedProjects || []), projectId]
        });
      }
      
      return existingConversation;
    }

    // Get user profiles for conversation metadata
    let clientData = {};
    let freelancerData = {};
    
    try {
      const clientDoc = await getDoc(doc(db, 'client_registration', clientId));
      if (clientDoc.exists()) {
        clientData = clientDoc.data();
      } else {
        // Try users collection as fallback
        const userDoc = await getDoc(doc(db, 'users', clientId));
        if (userDoc.exists()) {
          clientData = userDoc.data();
        }
      }
    } catch (error) {
      console.warn("Could not fetch client data:", error);
    }

    try {
      const freelancerDoc = await getDoc(doc(db, 'freelancer_profiles', freelancerId));
      if (freelancerDoc.exists()) {
        freelancerData = freelancerDoc.data();
      } else {
        // Try users collection as fallback
        const userDoc = await getDoc(doc(db, 'users', freelancerId));
        if (userDoc.exists()) {
          freelancerData = userDoc.data();
        }
      }
    } catch (error) {
      console.warn("Could not fetch freelancer data:", error);
    }

    // Create new unified conversation
    const newConversation = {
      participants: [clientId, freelancerId],
      participantInfo: {
        [clientId]: {
          name: clientData.fullName || clientData.displayName || clientData.name || 'Client',
          profileImageUrl: clientData.profileImageUrl || clientData.photoURL || null,
          userType: 'client'
        },
        [freelancerId]: {
          name: freelancerData.fullName || freelancerData.displayName || freelancerData.name || 'Freelancer',
          profileImageUrl: freelancerData.profileImageUrl || freelancerData.photoURL || null,
          userType: 'freelancer'
        }
      },
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      lastMessage: null,
      lastMessageSender: null,
      unreadCount: {
        [clientId]: 0,
        [freelancerId]: 0
      },
      // Track associated projects (can be multiple)
      associatedProjects: projectId ? [projectId] : [],
      // Store current project context if provided
      currentProject: projectId ? {
        id: projectId,
        title: projectTitle || 'Project'
      } : null
    };

    const conversationRef = await addDoc(conversationsRef, newConversation);
    
    console.log("✅ Created new conversation:", conversationRef.id);
    console.log("✅ New conversation data:", newConversation);
    
    // Verify the conversation was created by reading it back
    const createdDoc = await getDoc(conversationRef);
    console.log("✅ Verified conversation exists:", createdDoc.exists(), createdDoc.data());
    
    return {
      id: conversationRef.id,
      ...newConversation
    };
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    throw error;
  }
};

// Send a message with real-time updates
export const sendMessage = async (
  conversationId,
  senderId,
  senderName,
  message,
  projectId = null,
  projectTitle = null,
  messageType = 'text',
  attachmentData = null
) => {
  try {
    console.log("📤 Sending message to conversation:", conversationId);
    
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      throw new Error('Conversation not found');
    }

    const conversation = conversationDoc.data();
    const receiverId = conversation.participants.find(id => id !== senderId);

    // Add message to messages collection (unified)
    const messageData = {
      conversationId,
      senderId,
      senderName,
      receiverId,
      content: message,
      createdAt: serverTimestamp(),
      read: false,
      projectId,
      projectTitle,
      type: messageType,
      attachment: attachmentData
    };

    const messageRef = await addDoc(collection(db, 'messages'), messageData);
    console.log("✅ Message created with ID:", messageRef.id);

    // Update conversation with last message info
    const conversationUpdate = {
      lastMessage: message,
      lastMessageAt: serverTimestamp(),
      lastMessageSender: senderId,
      [`unreadCount.${receiverId}`]: (conversation.unreadCount?.[receiverId] || 0) + 1
    };
    
    console.log("📝 Updating conversation with:", conversationUpdate);
    await updateDoc(conversationRef, conversationUpdate);

    console.log("✅ Message sent successfully");
    return {
      id: messageRef.id,
      ...messageData
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Get messages for a conversation with real-time listener
export const subscribeToMessages = (conversationId, callback) => {
  try {
    console.log("👂 Setting up real-time message listener for:", conversationId);
    
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      console.log("📨 Messages updated:", messages.length);
      callback(messages);
    }, (error) => {
      console.error('Error in messages listener:', error);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up messages listener:', error);
    throw error;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (conversationId, userId) => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    
    // Update unread count in conversation
    await updateDoc(conversationRef, {
      [`unreadCount.${userId}`]: 0
    });

    // Mark all unread messages as read
    const unreadQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      where('receiverId', '==', userId),
      where('read', '==', false)
    );

    const unreadSnapshot = await getDocs(unreadQuery);
    
    const updatePromises = unreadSnapshot.docs.map(docSnap =>
      updateDoc(doc(db, 'messages', docSnap.id), { read: true })
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

// Get user's conversations with real-time updates
export const getUserConversations = async (userId) => {
  try {
    console.log("🔍 getUserConversations called for userId:", userId);
    
    // Look in conversations collection for unified conversations
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );

    console.log("📡 Executing query on conversations...");
    const querySnapshot = await getDocs(q);
    console.log("📊 Query results:", querySnapshot.size, "conversations found");
    
    if (querySnapshot.empty) {
      console.log("❌ No conversations found for user:", userId);
      return [];
    }

    const conversations = [];

    for (const docSnap of querySnapshot.docs) {
      const conversationData = docSnap.data();
      console.log("📄 Processing conversation:", docSnap.id, conversationData);
      
      // Find the other participant
      const otherUserId = conversationData.participants.find(id => id !== userId);
      console.log("👤 Other user ID:", otherUserId);
      
      // Get other user info from conversation metadata
      const otherUser = conversationData.participantInfo?.[otherUserId] || {
        id: otherUserId,
        name: 'Unknown User',
        userType: 'unknown'
      };

      console.log("👤 Other user info:", otherUser);

      conversations.push({
        id: docSnap.id,
        ...conversationData,
        otherUser: {
          id: otherUserId,
          ...otherUser
        },
        lastMessageAt: conversationData.lastMessageAt?.toDate() || new Date(),
        unreadCount: conversationData.unreadCount?.[userId] || 0
      });
    }

    console.log("✅ Returning", conversations.length, "conversations:", conversations);
    return conversations;
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw error;
  }
};

// Subscribe to user's conversations with real-time updates
export const subscribeToUserConversations = (userId, callback) => {
  try {
    console.log("👂 Setting up real-time conversations listener for:", userId);
    
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log("📨 Conversations updated:", snapshot.size);
      console.log("📨 Snapshot docs:", snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
      
      const conversations = [];

      for (const docSnap of snapshot.docs) {
        const conversationData = docSnap.data();
        console.log("📄 Processing real-time conversation:", docSnap.id, conversationData);
        
        // Find the other participant
        const otherUserId = conversationData.participants.find(id => id !== userId);
        console.log("👤 Other user ID in real-time:", otherUserId);
        
        // Get other user info from conversation metadata
        const otherUser = conversationData.participantInfo?.[otherUserId] || {
          id: otherUserId,
          name: 'Unknown User',
          userType: 'unknown'
        };

        console.log("👤 Other user info in real-time:", otherUser);

        conversations.push({
          id: docSnap.id,
          ...conversationData,
          otherUser: {
            id: otherUserId,
            ...otherUser
          },
          lastMessageAt: conversationData.lastMessageAt?.toDate() || new Date(),
          unreadCount: conversationData.unreadCount?.[userId] || 0
        });
      }

      console.log("📨 Calling callback with conversations:", conversations);
      callback(conversations);
    }, (error) => {
      console.error('Error in conversations listener:', error);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up conversations listener:', error);
    throw error;
  }
};

// Create conversation when proposal is accepted
export const createConversationFromAcceptedProposal = async (proposalData, projectData, clientData) => {
  try {
    console.log("🤝 Creating conversation from accepted proposal");
    
    // Create or get conversation
    const conversation = await getOrCreateConversation(
      proposalData.clientId || clientData.uid,
      proposalData.freelancerId,
      proposalData.projectId,
      projectData.title
    );

    // Send initial system message
    const welcomeMessage = `🎉 Congratulations! Your proposal for "${projectData.title}" has been accepted. You can now discuss project details here.`;
    
    await sendMessage(
      conversation.id,
      'system',
      'System',
      welcomeMessage,
      proposalData.projectId,
      projectData.title
    );

    return conversation;
  } catch (error) {
    console.error('Error creating conversation from accepted proposal:', error);
    throw error;
  }
};

// Allow clients to message freelancers before project acceptance
export const startConversationWithFreelancer = async (clientId, freelancerId, initialMessage, projectId = null, projectTitle = null) => {
  try {
    console.log("💬 Starting conversation with freelancer");
    console.log("💬 Parameters:", { clientId, freelancerId, initialMessage, projectId, projectTitle });
    
    // Create or get conversation
    const conversation = await getOrCreateConversation(
      clientId,
      freelancerId,
      projectId,
      projectTitle
    );

    console.log("💬 Conversation created/retrieved:", conversation);

    // Send initial message
    let clientName = 'Client';
    try {
      const clientDoc = await getDoc(doc(db, 'client_registration', clientId));
      if (clientDoc.exists()) {
        const clientData = clientDoc.data();
        clientName = clientData.fullName || clientData.displayName || clientData.name || 'Client';
      } else {
        // Try users collection as fallback
        const userDoc = await getDoc(doc(db, 'users', clientId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          clientName = userData.fullName || userData.displayName || userData.name || 'Client';
        }
      }
    } catch (error) {
      console.warn("Could not fetch client name:", error);
    }

    console.log("💬 Client name:", clientName);

    const messageResult = await sendMessage(
      conversation.id,
      clientId,
      clientName,
      initialMessage,
      projectId,
      projectTitle
    );

    console.log("💬 Message sent:", messageResult);

    return conversation;
  } catch (error) {
    console.error('Error starting conversation with freelancer:', error);
    throw error;
  }
}; 