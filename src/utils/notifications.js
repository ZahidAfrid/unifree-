// utils/notifications.js
import { db } from "@/firebase/firebase.config";
import { addDoc, collection, serverTimestamp, query, where, getDocs, doc, updateDoc, orderBy } from "firebase/firestore";

// Helper function to create notification in database
async function createNotification(notificationData) {
  try {
    // Add timestamp and default read status
    const notification = {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp(),
      delivered: false,
      deliveryAttempts: 0
    };

    // Store in database first
    const docRef = await addDoc(collection(db, "notifications"), notification);
    
    // Update the notification with its ID
    await updateDoc(docRef, { id: docRef.id });
    
    return docRef.id;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}

// Helper function to mark notification as delivered
async function markNotificationAsDelivered(notificationId) {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      delivered: true,
      deliveredAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to mark notification as delivered:", error);
    throw error;
  }
}

export async function sendProposalNotificationToClient(
  clientId,
  freelancerName,
  projectId,
  projectTitle,
  freelancerId,
  proposalId
) {
  try {
    console.log('📨 Sending proposal notification to client:', {
      clientId,
      freelancerName,
      projectId,
      projectTitle,
      freelancerId,
      proposalId
    });

    const notificationId = await createNotification({
      recipientId: clientId,
      recipientType: 'client',
      type: "proposal",
      title: "New Proposal Received",
      message: `${freelancerName} has submitted a proposal for your project "${projectTitle}". Click to view details.`,
      projectId,
      projectTitle,
      freelancerId,
      proposalId,
      freelancerName,
      profileLink: `/freelancers/${freelancerId}`
    });

    // Mark as delivered after successful creation
    await markNotificationAsDelivered(notificationId);
    console.log('✅ Proposal notification sent successfully');
    
    return notificationId;
  } catch (error) {
    console.error("❌ Failed to send proposal notification:", error);
    throw error;
  }
}

export const sendHireNotificationToFreelancer = async (
  freelancerId,
  projectTitle,
  projectId
) => {
  try {
    await addDoc(collection(db, "notifications"), {
      recipientId: freelancerId,
      recipientType: 'freelancer',
      type: 'project_hired',
      title: 'Congratulations! You\'ve been hired',
      message: `You have been hired for the project: ${projectTitle}`,
      projectId,
      projectTitle,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error sending hire notification:', error);
  }
};

export const sendMessageNotification = async (
  receiverId,
  senderName,
  projectTitle,
  conversationId,
  recipientType = 'freelancer'
) => {
  try {
    const notificationId = await createNotification({
      recipientId: receiverId,
      recipientType: recipientType,
      type: "message",
      title: "New Message",
      message: `${senderName} sent you a message about "${projectTitle}".`,
      conversationId
    });

    await markNotificationAsDelivered(notificationId);
    return notificationId;
  } catch (error) {
    console.error("Failed to send message notification:", error);
    throw error;
  }
};

// Send notification when project timeline is updated
export const sendTimelineUpdateNotification = async (
  projectId,
  projectTitle,
  recipientId,
  recipientType,
  updateMessage,
  senderName
) => {
  try {
    const notificationId = await createNotification({
      recipientId,
      recipientType,
      type: 'timeline_update',
      title: 'Project Timeline Updated',
      message: `${senderName} added an update to ${projectTitle}: ${updateMessage}`,
      projectId,
      projectTitle,
      updateMessage,
      senderName
    });

    await markNotificationAsDelivered(notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error sending timeline notification:', error);
    throw error;
  }
};

// Send notification when document is uploaded
export const sendDocumentUploadNotification = async (
  projectId,
  projectTitle,
  recipientId,
  recipientType,
  fileName,
  uploaderName,
  uploaderRole
) => {
  try {
    const notificationId = await createNotification({
      recipientId,
      recipientType,
      type: 'document_upload',
      title: 'New Document Uploaded',
      message: `${uploaderName} (${uploaderRole}) uploaded a new document: ${fileName} for project ${projectTitle}`,
      projectId,
      projectTitle,
      fileName,
      uploaderName,
      uploaderRole
    });

    await markNotificationAsDelivered(notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error sending document notification:', error);
    throw error;
  }
};

// Send notification when project is marked as delivered
export const sendProjectDeliveredNotification = async (
  projectId,
  projectTitle,
  clientId,
  freelancerName
) => {
  try {
    const notificationId = await createNotification({
      recipientId: clientId,
      recipientType: 'client',
      type: 'project_delivered',
      title: 'Project Delivered',
      message: `${freelancerName} has marked the project "${projectTitle}" as delivered. Please review and approve.`,
      projectId,
      projectTitle,
      freelancerName
    });

    await markNotificationAsDelivered(notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error sending delivery notification:', error);
    throw error;
  }
};

// When a project is completed and review is requested
export const requestClientReview = async (
  projectId,
  projectTitle,
  clientId,
  clientName,
  freelancerId,
  freelancerName
) => {
  try {
    return sendClientNotification(
      clientId,
      'review_requested',
      'Review Requested',
      `Please take a moment to review your experience working with ${freelancerName} on "${projectTitle}".`,
      {
        projectId,
        projectTitle,
        freelancerId,
        freelancerName,
        type: 'review_request'
      }
    );
  } catch (error) {
    console.error('Error requesting client review:', error);
    throw error;
  }
};

// When a client submits a review
export const notifyFreelancerAboutReview = async (
  freelancerId,
  clientName,
  projectId,
  projectTitle,
  rating,
  review
) => {
  try {
    return sendFreelancerNotification(
      freelancerId,
      'new_review',
      'New Review Received',
      `${clientName} has left a ${rating}-star review for your work on "${projectTitle}".`,
      {
        projectId,
        projectTitle,
        clientName,
        rating,
        review
      }
    );
  } catch (error) {
    console.error('Error notifying freelancer about review:', error);
    throw error;
  }
};

// Update the project completion notification to include review request
export const notifyProjectCompletion = async (
  projectId,
  projectTitle,
  clientId,
  clientName,
  freelancerId,
  freelancerName
) => {
  try {
    // Notify client about project completion and request review
    await sendClientNotification(
      clientId,
      'project_completed',
      'Project Completed',
      `The project "${projectTitle}" has been completed. Please take a moment to review your experience working with ${freelancerName}.`,
      {
        projectId,
        projectTitle,
        freelancerId,
        freelancerName,
        requiresReview: true
      }
    );

    // Notify freelancer about project completion
    await sendFreelancerNotification(
      freelancerId,
      'project_completed',
      'Project Completed',
      `The project "${projectTitle}" has been completed by ${clientName}. They will be asked to leave a review.`,
      {
        projectId,
        projectTitle,
        clientId,
        clientName
      }
    );

    // Request review from client
    await requestClientReview(
      projectId,
      projectTitle,
      clientId,
      clientName,
      freelancerId,
      freelancerName
    );
  } catch (error) {
    console.error('Error notifying about project completion:', error);
    throw error;
  }
};

// Send notification when project is completed
export const sendProjectCompletedNotification = async (
  projectId,
  projectTitle,
  freelancerId,
  clientName,
  completionNotes = '',
  rating = 5
) => {
  try {
    const notificationId = await createNotification({
      recipientId: freelancerId,
      recipientType: 'freelancer',
      type: 'project_completed',
      title: 'Project Completed',
      message: `${clientName} has marked the project "${projectTitle}" as completed with a ${rating}-star rating. You can now leave a review and payment will be processed.`,
      projectId,
      projectTitle,
      clientName,
      completionNotes,
      rating
    });

    await markNotificationAsDelivered(notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error sending completion notification:', error);
    throw error;
  }
};

// Send notification when project handover is initiated
export const sendProjectHandoverNotification = async (
  projectId,
  projectTitle,
  clientId,
  freelancerName,
  handoverMessage,
  documents = []
) => {
  try {
    const notificationId = await createNotification({
      recipientId: clientId,
      recipientType: 'client',
      type: 'project_handover',
      title: 'Project Handover Initiated',
      message: `${freelancerName} has initiated project handover for "${projectTitle}". ${documents.length > 0 ? `${documents.length} deliverable(s) included.` : ''} Click to view details.`,
      projectId,
      projectTitle,
      freelancerName,
      handoverMessage,
      documents
    });

    await markNotificationAsDelivered(notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error sending handover notification:', error);
    throw error;
  }
};

// Get notifications for a user
export const getUserNotifications = async (userId, userType) => {
  try {
    console.log('🔍 Fetching notifications for:', { userId, userType });
    
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('recipientType', '==', userType),
      orderBy('createdAt', 'desc')
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('✅ Found notifications:', notifications.length);
    return notifications;
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return [];
  }
};

// Client-specific notifications
export const sendClientNotification = async (
  clientId,
  type,
  title,
  message,
  additionalData = {}
) => {
  try {
    const notificationId = await createNotification({
      recipientId: clientId,
      recipientType: 'client',
      type,
      title,
      message,
      ...additionalData
    });

    await markNotificationAsDelivered(notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error sending client notification:', error);
    throw error;
  }
};

// Freelancer-specific notifications
export const sendFreelancerNotification = async (
  freelancerId,
  type,
  title,
  message,
  additionalData = {}
) => {
  try {
    const notificationId = await createNotification({
      recipientId: freelancerId,
      recipientType: 'freelancer',
      type,
      title,
      message,
      ...additionalData
    });

    await markNotificationAsDelivered(notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error sending freelancer notification:', error);
    throw error;
  }
};

// Enhanced notification functions for specific scenarios

// When a client posts a new project
export const notifyFreelancersAboutNewProject = async (
  projectId,
  projectTitle,
  projectBudget,
  projectCategory,
  clientName
) => {
  try {
    // Get all freelancers in the project category
    const freelancersQuery = query(
      collection(db, 'users'),
      where('type', '==', 'freelancer'),
      where('categories', 'array-contains', projectCategory)
    );
    
    const freelancersSnapshot = await getDocs(freelancersQuery);
    
    // Send notification to each matching freelancer
    const notifications = freelancersSnapshot.docs.map(async (freelancerDoc) => {
      const freelancerId = freelancerDoc.id;
      return sendFreelancerNotification(
        freelancerId,
        'new_project',
        'New Project Available',
        `A new project "${projectTitle}" has been posted in your category with a budget of $${projectBudget}.`,
        {
          projectId,
          projectTitle,
          projectBudget,
          projectCategory,
          clientName
        }
      );
    });

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error notifying freelancers about new project:', error);
    throw error;
  }
};

// When a freelancer submits a proposal
export const notifyClientAboutProposal = async (
  clientId,
  freelancerId,
  freelancerName,
  projectId,
  projectTitle,
  proposalAmount
) => {
  try {
    return sendClientNotification(
      clientId,
      'new_proposal',
      'New Proposal Received',
      `${freelancerName} has submitted a proposal for your project "${projectTitle}" with a bid of $${proposalAmount}.`,
      {
        projectId,
        projectTitle,
        freelancerId,
        freelancerName,
        proposalAmount
      }
    );
  } catch (error) {
    console.error('Error notifying client about proposal:', error);
    throw error;
  }
};

// When a client accepts a proposal
export const notifyFreelancerAboutProposalAcceptance = async (
  freelancerId,
  clientName,
  projectId,
  projectTitle,
  proposalAmount
) => {
  try {
    return sendFreelancerNotification(
      freelancerId,
      'proposal_accepted',
      'Proposal Accepted',
      `${clientName} has accepted your proposal for "${projectTitle}" with a budget of $${proposalAmount}.`,
      {
        projectId,
        projectTitle,
        clientName,
        proposalAmount
      }
    );
  } catch (error) {
    console.error('Error notifying freelancer about proposal acceptance:', error);
    throw error;
  }
};

// When a client rejects a proposal
export const notifyFreelancerAboutProposalRejection = async (
  freelancerId,
  clientName,
  projectId,
  projectTitle,
  rejectionReason = ''
) => {
  try {
    return sendFreelancerNotification(
      freelancerId,
      'proposal_rejected',
      'Proposal Not Selected',
      `${clientName} has not selected your proposal for "${projectTitle}".${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
      {
        projectId,
        projectTitle,
        clientName,
        rejectionReason
      }
    );
  } catch (error) {
    console.error('Error notifying freelancer about proposal rejection:', error);
    throw error;
  }
};

// When a freelancer completes a milestone
export const notifyClientAboutMilestoneCompletion = async (
  clientId,
  freelancerName,
  projectId,
  projectTitle,
  milestoneName
) => {
  try {
    return sendClientNotification(
      clientId,
      'milestone_completed',
      'Milestone Completed',
      `${freelancerName} has completed the milestone "${milestoneName}" for project "${projectTitle}".`,
      {
        projectId,
        projectTitle,
        freelancerName,
        milestoneName
      }
    );
  } catch (error) {
    console.error('Error notifying client about milestone completion:', error);
    throw error;
  }
};

// When a client approves a milestone
export const notifyFreelancerAboutMilestoneApproval = async (
  freelancerId,
  clientName,
  projectId,
  projectTitle,
  milestoneName,
  paymentAmount
) => {
  try {
    return sendFreelancerNotification(
      freelancerId,
      'milestone_approved',
      'Milestone Approved',
      `${clientName} has approved your milestone "${milestoneName}" for project "${projectTitle}". Payment of $${paymentAmount} will be processed.`,
      {
        projectId,
        projectTitle,
        clientName,
        milestoneName,
        paymentAmount
      }
    );
  } catch (error) {
    console.error('Error notifying freelancer about milestone approval:', error);
    throw error;
  }
};

// When a client requests a revision
export const notifyFreelancerAboutRevisionRequest = async (
  freelancerId,
  clientName,
  projectId,
  projectTitle,
  revisionNotes
) => {
  try {
    return sendFreelancerNotification(
      freelancerId,
      'revision_requested',
      'Revision Requested',
      `${clientName} has requested revisions for project "${projectTitle}". Notes: ${revisionNotes}`,
      {
        projectId,
        projectTitle,
        clientName,
        revisionNotes
      }
    );
  } catch (error) {
    console.error('Error notifying freelancer about revision request:', error);
    throw error;
  }
};
