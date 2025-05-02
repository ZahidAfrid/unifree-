import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { db } from "@/firebase/firebase.config"; // Adjust the import based on your Firebase setup
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  addDoc,
  orderBy,
} from "firebase/firestore";

import { useAuth } from "@/contexts/AuthContext";
import { FiCheck, FiX, FiMessageSquare, FiStar } from "react-icons/fi";
import toast from "react-hot-toast";

export default function ProjectProposals() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (id && user) {
      fetchProject();
      fetchProposals();
    }
  }, [id, user]);

  const fetchProject = async () => {
    try {
      const projectRef = doc(db, "projects", id);
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) {
        toast.error("Project not found");
        router.push("/projects");
        return;
      }

      const projectData = projectSnap.data();

      // Check if the current user is the project owner
      if (projectData.client_id !== user.id) {
        router.push("/projects");
        return;
      }

      setProject({ id: projectSnap.id, ...projectData });
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to load project details");
      router.push("/projects");
    }
  };

  const fetchProposals = async () => {
    try {
      const q = query(
        collection(db, "proposals"),
        where("project_id", "==", id),
        orderBy("created_at", "desc")
      );
      const querySnapshot = await getDocs(q);

      const results = [];

      for (const docSnap of querySnapshot.docs) {
        const proposalData = docSnap.data();

        // Fetch freelancer profile
        const profileRef = doc(db, "profiles", proposalData.freelancer_id);
        const profileSnap = await getDoc(profileRef);
        const profileData = profileSnap.exists() ? profileSnap.data() : null;

        results.push({
          id: docSnap.id,
          ...proposalData,
          profiles: profileData,
        });
      }

      setProposals(results);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      toast.error("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    try {
      const proposalRef = doc(db, "proposals", proposalId);
      await updateDoc(proposalRef, { status: "accepted" });

      const projectRef = doc(db, "projects", id);
      await updateDoc(projectRef, { status: "in_progress" });

      toast.success("Proposal accepted successfully!");
      fetchProposals();
    } catch (error) {
      console.error("Error accepting proposal:", error);
      toast.error("Failed to accept proposal");
    }
  };

  const handleRejectProposal = async (proposalId) => {
    try {
      const proposalRef = doc(db, "proposals", proposalId);
      await updateDoc(proposalRef, { status: "rejected" });

      toast.success("Proposal rejected");
      fetchProposals();
    } catch (error) {
      console.error("Error rejecting proposal:", error);
      toast.error("Failed to reject proposal");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await addDoc(collection(db, "messages"), {
        project_id: id,
        sender_id: user.id,
        receiver_id: selectedProposal.freelancer_id,
        content: message,
        created_at: new Date(),
      });

      toast.success("Message sent successfully!");
      setMessage("");
      setSelectedProposal(null);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">
                Proposals for {project?.title}
              </h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {proposals.length} proposals
              </span>
            </div>

            {proposals.length === 0 ? (
              <div className="mt-8 text-center py-12">
                <p className="text-gray-600">No proposals received yet.</p>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                {proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <img
                          className="h-12 w-12 rounded-full"
                          src={
                            proposal.profiles?.avatar_url ||
                            "/images/default-avatar.png"
                          }
                          alt={proposal.profiles?.full_name}
                        />
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {proposal.profiles?.full_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {proposal.profiles?.university}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center text-yellow-400">
                          <FiStar className="mr-1" />
                          {proposal.profiles?.rating?.toFixed(1) || "New"}
                        </span>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            proposal.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : proposal.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {proposal.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900">
                        Proposal
                      </h4>
                      <p className="mt-2 text-gray-600 whitespace-pre-wrap">
                        {proposal.proposal}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {proposal.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleAcceptProposal(proposal.id)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <FiCheck className="mr-2" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectProposal(proposal.id)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <FiX className="mr-2" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedProposal(proposal)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700"
                      >
                        <FiMessageSquare className="mr-2" />
                        Send Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Message Modal */}
        {selectedProposal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Send Message to {selectedProposal.profiles?.full_name}
              </h3>
              <form onSubmit={handleSendMessage}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Type your message..."
                />
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProposal(null);
                      setMessage("");
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
