/**
 * Database schema for messaging system
 * 
 * Collections:
 * 1. conversations - Stores conversation metadata
 * 2. messages - Stores individual messages within conversations
 * 3. project_bids - Stores bid information for projects
 */

/**
 * Conversation schema
 * 
 * Collection: conversations
 * Document ID: auto-generated
 */
const conversationSchema = {
  participantIds: ["user1_id", "user2_id"], // Array of user IDs in the conversation
  participantInfo: {
    // Metadata for quick access without additional queries
    "user1_id": {
      displayName: "User Name",
      profileImage: "/path/to/image.jpg",
      userType: "client" // or "freelancer"
    },
    "user2_id": {
      displayName: "User Name",
      profileImage: "/path/to/image.jpg",
      userType: "freelancer" // or "client"
    }
  },
  lastMessage: {
    text: "Last message preview",
    sentAt: "2023-06-15T10:30:00Z",
    sentBy: "user1_id"
  },
  createdAt: "2023-06-15T10:00:00Z",
  updatedAt: "2023-06-15T10:30:00Z",
  projectId: "project_id", // Optional, if the conversation is related to a specific project
  status: "active", // or "archived"
  unreadCount: {
    "user1_id": 0,
    "user2_id": 1
  }
};

/**
 * Message schema
 * 
 * Collection: messages
 * Document ID: auto-generated
 */
const messageSchema = {
  conversationId: "conversation_id",
  senderId: "user1_id",
  text: "Message content",
  attachments: [
    {
      type: "image", // or "file"
      url: "/path/to/attachment.jpg",
      name: "attachment.jpg",
      size: 25600 // in bytes
    }
  ],
  sentAt: "2023-06-15T10:30:00Z",
  readAt: "2023-06-15T10:35:00Z", // Null if unread
  bidId: "bid_id", // Optional, if this message contains a bid
  isSystemMessage: false // True for system-generated messages
};

/**
 * Project Bid schema
 * 
 * Collection: project_bids
 * Document ID: auto-generated
 */
const projectBidSchema = {
  projectId: "project_id",
  freelancerId: "freelancer_id",
  clientId: "client_id",
  amount: 500, // Bid amount
  currency: "USD",
  proposedTimeframe: {
    value: 2,
    unit: "weeks" // or "days", "months"
  },
  status: "pending", // or "accepted", "rejected", "countered", "withdrawn"
  message: "I can complete this project with the following approach...",
  submittedAt: "2023-06-15T10:30:00Z",
  updatedAt: "2023-06-15T10:30:00Z",
  milestones: [
    {
      title: "Initial design",
      description: "Complete the initial design mockups",
      amount: 100, // Amount for this milestone
      dueDate: "2023-06-22T10:30:00Z",
      status: "pending" // or "completed", "in-progress"
    }
  ],
  attachments: [
    {
      type: "file",
      url: "/path/to/proposal.pdf",
      name: "project_proposal.pdf",
      size: 102400 // in bytes
    }
  ]
};

// Export the schemas for reference
export { conversationSchema, messageSchema, projectBidSchema }; 