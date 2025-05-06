// utils/notifications.js
import { db } from "@/firebase/firebase.config";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export async function sendProposalNotificationToClient(
  clientId,
  freelancerName,
  projectId,
  projectTitle,
  freelancerId
) {
  try {
    await addDoc(collection(db, "notifications"), {
      userId: clientId,
      type: "proposal",
      title: "New Proposal Received",
      message: `${freelancerName} is interested in your project "${projectTitle}".`,
      projectId,
      freelancerId,
      profileLink: `/freelancers/${freelancerId}`,
      seen: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to send proposal notification:", error);
  }
}

export const sendHireNotificationToFreelancer = async (
  freelancerId,
  projectTitle,
  projectId
) => {
  try {
    await addDoc(collection(db, "notifications"), {
      userId: freelancerId,
      type: "proposal_accepted",
      message: `You have been hired for "${projectTitle}"!`,
      project_id: projectId,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to notify freelancer:", error);
  }
};
