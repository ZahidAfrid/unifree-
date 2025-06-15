import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  FiCalendar,
  FiDollarSign,
  FiTag,
  FiDownload,
  FiSend,
  FiMessageSquare,
  FiBriefcase,
  FiUser,
  FiEdit,
  FiTrash2,
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  FaUser,
  FaClock as FaClockIcon,
  FaDollarSign as FaDollarSignIcon,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaTrash,
  FaPaperPlane,
  FaExclamationTriangle,
} from "react-icons/fa";
import Head from "next/head";
import { db } from "@/firebase/firebase.config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { sendProposalNotificationToClient } from "@/utils/notifications";

export default function ProjectDetails() {
  const router = useRouter();
  const projectId = Array.isArray(router.query.id)
    ? router.query.id[0]
    : router.query.id;
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [proposal, setProposal] = useState("");
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [bid, setBid] = useState("");

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);

      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);
      if (!projectSnap.exists()) {
        throw new Error(`No project found with ID: ${projectId}`);
      }

      const projectData = { id: projectSnap.id, ...projectSnap.data() };
      setProject(projectData);

      if (projectData.clientId) {
        const clientRef = doc(db, "client_registration", projectData.clientId);
        const clientSnap = await getDoc(clientRef);
        setClient(clientSnap.exists() ? clientSnap.data() : null);
      }
      console.log("Fetched project data:", projectData);

      if (user?.uid === projectData.clientId) {
        const proposalsQuery = query(
          collection(db, "proposals"),
          where("projectId", "==", projectId)
        );
        const proposalSnaps = await getDocs(proposalsQuery);
        const proposalsData = await Promise.all(
          proposalSnaps.docs.map(async (doc) => {
            const proposalData = doc.data();
            let freelancer = null;
            if (proposalData.freelancerId) {
              const freelancerSnap = await getDoc(
                doc(db, "users", proposalData.freelancerId)
              );
              if (freelancerSnap.exists()) {
                freelancer = freelancerSnap.data();
              }
            }
            return { id: doc.id, ...proposalData, freelancer };
          })
        );
        setProposals(proposalsData);
      }
    } catch (error) {
      console.error("❌ Project Load Error:", error.message);
      console.warn("Failed to load project details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  // Fetch project details and proposals when the component mounts or when projectId changes
  useEffect(() => {
    if (!router.isReady || !projectId) return;
    fetchProject();
  }, [router.isReady, projectId, fetchProject]);

  const checkIfApplied = useCallback(async () => {
    try {
      if (!user || !projectId) return;

      const proposalsQuery = query(
        collection(db, "proposals"),
        where("projectId", "==", projectId),
        where("freelancerId", "==", user.uid)
      );

      const proposalsSnapshot = await getDocs(proposalsQuery);
      setHasApplied(!proposalsSnapshot.empty);
    } catch (error) {
      console.error("Error checking if user has applied:", error);
    }
  }, [projectId, user]);

  useEffect(() => {
    if (!router.isReady || !projectId || !user) return;
    checkIfApplied();
  }, [router.isReady, projectId, user, checkIfApplied]);

  const handleDelete = async () => {
    if (!user || !project || user.uid !== project.clientId) {
      console.warn("You don't have permission to delete this project");
      return;
    }

    try {
      setDeleting(true);

      // Delete the project
      await deleteDoc(doc(db, "projects", projectId));

      // Delete associated proposals
      const proposalsQuery = query(
        collection(db, "proposals"),
        where("projectId", "==", projectId)
      );

      const proposalsSnapshot = await getDocs(proposalsQuery);
      const deletePromises = proposalsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);

      toast.success("Project deleted successfully");
      router.push("/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
      console.warn("Failed to delete project");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to submit a proposal");
      router.push("/login");
      return;
    }

    if (!proposal.trim()) {
      toast.error("Please write a proposal");
      return;
    }

    try {
      setSubmittingProposal(true);

      // Get freelancer name first
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const freelancerName = userSnap.exists()
        ? userSnap.data().fullName || user.displayName || "A freelancer"
        : user.displayName || "A freelancer";

      // Save the proposal with freelancer name
      const proposalRef = await addDoc(collection(db, "proposals"), {
        projectId: project.id,
        freelancerId: user.uid,
        freelancerName: freelancerName,
        content: proposal.trim(),
        bid: parseFloat(bid) || 0,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Send notification
      await sendProposalNotificationToClient(
        project.clientId,
        freelancerName,
        project.id,
        project.title,
        user.uid,
        proposalRef.id
      );

      toast.success("Proposal submitted successfully");
      setProposal("");
      setBid("");
      setHasApplied(true);
    } catch (error) {
      console.error("Error submitting proposal:", error);
      toast.error("Failed to submit proposal");
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleProposalAction = async (proposalId, action) => {
    try {
      const proposalRef = doc(db, "proposals", proposalId);
      await updateDoc(proposalRef, {
        status: action,
      });

      if (action === "accepted") {
        const selectedProposal = proposals.find((p) => p.id === proposalId);

        if (selectedProposal) {
          const projectRef = doc(db, "projects", projectId); // ✅ Fix: it was 'id' before, should be 'projectId'
          await updateDoc(projectRef, {
            status: "in-progress",
            freelancerId: selectedProposal.freelancerId,
            updatedAt: serverTimestamp(),
          });

          // ✅ Send hire notification to the freelancer
          await sendHireNotificationToFreelancer(
            selectedProposal.freelancerId,
            project.title,
            project.id
          );
        }
      }

      toast.success(`Proposal ${action}`);
      fetchProject();
    } catch (error) {
      console.error("Error updating proposal:", error);
      toast.error("Failed to update proposal");
    }
  };

  // Format date (handling Firebase Timestamp)
  const formatDate = (timestamp) => {
    if (!timestamp) return "Not specified";

    if (timestamp.toDate) {
      // Firebase timestamp
      return timestamp.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    // Regular date string
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12">
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

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Project not found
            </h2>
            <p className="mt-2 text-gray-600">
              The project you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
            <Link
              href="/explore"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Explore
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.uid === project.clientId;
  const canSubmitProposal =
    !isOwner && !hasApplied && project.status === "open";

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <>
      <Head>
        <title>
          {project?.title || "Project Details"} | Student Freelance Platform
        </title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-40">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="p-6 ">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {project.title}
                    </h1>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <FaUser className="mr-1" />
                      <span>
                        Posted by {client?.fullName || "Anonymous Client"}
                      </span>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
                      <Link
                        href={`/projects/edit/${projectId}`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FiEdit className="mr-2" />
                        Edit Project
                      </Link>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        disabled={deleting}
                      >
                        <FiTrash2 className="mr-2" />
                        {deleting ? "Deleting..." : "Delete Project"}
                      </button>
                    </div>
                  )}

                  {!isOwner && (
                    <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
                      {user ? (
                        <Link
                          href={`/messages?recipient=${project.clientId}`}
                          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <FiMessageSquare className="mr-2" />
                          Message Client
                        </Link>
                      ) : (
                        <Link
                          href={`/login?redirect=/projects/${id}`}
                          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <FiUser className="mr-2" />
                          Login to Contact Client
                        </Link>
                      )}
                      {user && canSubmitProposal && (
                        <button
                          onClick={() =>
                            document
                              .getElementById("proposal-form")
                              .scrollIntoView({ behavior: "smooth" })
                          }
                          className="inline-flex items-center justify-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md shadow-sm text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <FiBriefcase className="mr-2" />
                          Apply Now
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status || "Open"}
                  </span>
                </div>

                <div className="mt-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      Project Description
                    </h2>
                    <p className="mt-2 text-gray-600 whitespace-pre-line">
                      {project.description}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Project Details
                    </h3>
                    <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <FiDollarSign className="mr-1 text-indigo-500" />
                          Budget
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {project.budget
                            ? `$${project.budget}`
                            : "Not specified"}
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <FiCalendar className="mr-1 text-indigo-500" />
                          Timeline
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {project.duration || "Not specified"}
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <FiTag className="mr-1 text-indigo-500" />
                          Posted On
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {project.createdAt
                            ? formatDate(project.createdAt)
                            : "Recently"}
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">
                          Category
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {project.category || "Not specified"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {project.skills && project.skills.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Required Skills
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {project.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {isOwner && proposals.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Proposals ({proposals.length})
                      </h3>
                      <div className="mt-2 space-y-4">
                        {proposals.map((proposal) => (
                          <div
                            key={proposal.id}
                            className="bg-gray-50 p-4 rounded-lg"
                          >
                            <div className="flex justify-between">
                              <div className="font-medium">
                                {proposal.freelancer?.fullName ||
                                  "Anonymous Freelancer"}
                              </div>
                              <div className="text-lg font-bold text-indigo-600">
                                ${proposal.bid}
                              </div>
                            </div>
                            <p className="mt-2 text-gray-600">
                              {proposal.content}
                            </p>
                            <div className="mt-4 flex justify-between items-center">
                              <div className="text-sm text-gray-500">
                                {proposal.createdAt
                                  ? formatDate(proposal.createdAt)
                                  : "Recently"}
                              </div>
                              {proposal.status === "pending" && (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() =>
                                      handleProposalAction(
                                        proposal.id,
                                        "accepted"
                                      )
                                    }
                                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700"
                                  >
                                    <FaCheckCircle className="mr-1" />
                                    Accept
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleProposalAction(
                                        proposal.id,
                                        "rejected"
                                      )
                                    }
                                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700"
                                  >
                                    <FaTimesCircle className="mr-1" />
                                    Reject
                                  </button>
                                </div>
                              )}
                              {proposal.status === "accepted" && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <FaCheckCircle className="mr-1" />
                                  Accepted
                                </span>
                              )}
                              {proposal.status === "rejected" && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <FaTimesCircle className="mr-1" />
                                  Rejected
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {canSubmitProposal && (
                    <div
                      id="proposal-form"
                      className="border-t border-gray-200 pt-6"
                    >
                      <h3 className="text-lg font-medium text-gray-900">
                        Submit a Proposal
                      </h3>
                      <form
                        onSubmit={handleSubmitProposal}
                        className="mt-4 space-y-4"
                      >
                        <div>
                          <label
                            htmlFor="bid"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Your Bid (USD)
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">
                                $
                              </span>
                            </div>
                            <input
                              type="number"
                              name="bid"
                              id="bid"
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                              placeholder="0.00"
                              min="1"
                              step="0.01"
                              value={bid}
                              onChange={(e) => setBid(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="proposal"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Your Proposal
                          </label>
                          <div className="mt-1">
                            <textarea
                              id="proposal"
                              name="proposal"
                              rows={4}
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="Explain why you're the best fit for this project..."
                              value={proposal}
                              onChange={(e) => setProposal(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <button
                            type="submit"
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            disabled={submittingProposal}
                          >
                            {submittingProposal ? (
                              <>Submitting...</>
                            ) : (
                              <>
                                <FiSend className="mr-2" />
                                Submit Proposal
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {hasApplied && (
                    <div className="border-t border-gray-200 pt-6 text-center">
                      <div className="bg-green-50 p-4 rounded-md">
                        <div className="flex justify-center">
                          <FaCheckCircle className="h-6 w-6 text-green-400" />
                        </div>
                        <h3 className="mt-2 text-lg font-medium text-green-800">
                          Proposal Submitted
                        </h3>
                        <p className="mt-1 text-sm text-green-700">
                          You have already submitted a proposal for this
                          project. The client will review your application.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            <div className="mt-4 text-center">
              <Link
                href="/explore"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Explore
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="text-center">
                  <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-500" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    Delete Project
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Are you sure you want to delete this project? This action
                    cannot be undone. All proposals related to this project will
                    also be deleted.
                  </p>
                </div>
                <div className="mt-6 flex justify-center space-x-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
