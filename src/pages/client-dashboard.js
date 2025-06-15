import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/firebase/firebase.config";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Head from "next/head";
import {
  FaUserEdit,
  FaProjectDiagram,
  FaCog,
  FaPlusCircle,
  FaEye,
  FaEdit,
  FaTrash,
  FaBuilding,
  FaGlobe,
  FaBriefcase,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaCcamera,
  FaSave,
  FaTimes,
  FaChartLine,
  FaUsers,
  FaBell,
  FaRegClock,
  FaRegCheckCircle,
  FaEnvelope,
  FaRegEnvelope,
  FaCalendarAlt,
  FaUser,
  FaShieldAlt,
  FaExclamationCircle,
  FaCheckCircle,
  FaInbox,
  FaList,
  FaRegCalendarAlt,
  FaChartBar,
  FaChartPie,
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaStar,
} from "react-icons/fa";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc,
  Timestamp,
  updateDoc,
  limit,
  onSnapshot,
  serverTimestamp,
  setDoc,
  addDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { sendHireNotificationToFreelancer } from "@/utils/notifications";
import ReviewSystem from "@/components/ReviewSystem";
import DocumentUpload from "@/components/DocumentUpload";
import NotificationCenter from "@/components/NotificationCenter";
import ProjectHistory from "@/components/ProjectHistory";
import ProjectCompletionModal from "@/components/ProjectCompletionModal";
import NotificationDetailModal from "@/components/NotificationDetailModal";
import ReviewModal from '@/components/ReviewModal';

// Create a separate ReviewModal component to prevent re-rendering issues
const ReviewModalComponent = ({ isOpen, project, reviewData, setReviewData, onClose, onSubmit }) => {
  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Review for Freelancer
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Project: {project.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality of Work
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={reviewData.quality}
                    onChange={(e) => setReviewData(prev => ({
                      ...prev,
                      quality: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                  <span className="text-sm font-medium text-indigo-600">
                    {reviewData.quality}/5
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={reviewData.communication}
                    onChange={(e) => setReviewData(prev => ({
                      ...prev,
                      communication: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                  <span className="text-sm font-medium text-indigo-600">
                    {reviewData.communication}/5
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeliness
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={reviewData.timeliness}
                    onChange={(e) => setReviewData(prev => ({
                      ...prev,
                      timeliness: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                  <span className="text-sm font-medium text-indigo-600">
                    {reviewData.timeliness}/5
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={reviewData.overall}
                    onChange={(e) => setReviewData(prev => ({
                      ...prev,
                      overall: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                  <span className="text-sm font-medium text-indigo-600">
                    {reviewData.overall}/5
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review
            </label>
            <textarea
              value={reviewData.comment}
              onChange={(e) => setReviewData(prev => ({
                ...prev,
                comment: e.target.value
              }))}
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Share your experience working with this freelancer. What went well? What could be improved?"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ClientDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalSpent: 0,
    pendingProposals: 0,
    completedProjects: 0,
  });

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Settings state
  const [notificationSettings, setNotificationSettings] = useState({
    newProposals: true,
    messages: true,
    projectUpdates: true,
    platformAnnouncements: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    allowFreelancersContact: true,
    makeProfilePublic: true,
    allowEmailNotifications: true,
  });

  // Modal states
  const [completionModal, setCompletionModal] = useState({
    isOpen: false,
    project: null,
    freelancerName: ''
  });
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    notification: null
  });

  // Add state for review modal
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    project: null,
    freelancer: null
  });

  // Add state for review form
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
    quality: 5,
    communication: 5,
    timeliness: 5,
    overall: 5
  });

  // Function to safely format dates
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    
    try {
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      } else if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
      }
      return "Invalid date";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // ✅ Always call hooks before return
  useEffect(() => {
    // Handle URL query parameters for tab navigation
    if (router.query.tab) {
      setActiveTab(router.query.tab);
    }
  }, [router.query.tab]);

  useEffect(() => {
    if (!user?.uid || authLoading) return;

    setLoading(true);

    // Fetch client profile (one-time)
    const fetchProfile = async () => {
      try {
        const clientProfileDoc = await getDoc(
          doc(db, "client_registration", user.uid)
        );
        if (!clientProfileDoc.exists()) {
          router.push("/client-registration");
          return;
        }

        const data = clientProfileDoc.data();
        setProfileData(data);
        setNotificationSettings(data.notificationSettings || {});
        setPrivacySettings(data.privacySettings || {});
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();

    // Set up real-time listener for projects and their proposals
    const projectsQuery = query(
      collection(db, "projects"),
      where("clientId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    // We need to fetch proposals for each project since proposals are linked by projectId
    let allUnsubscribeProposals = [];
    
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("📊 Projects updated:", projectsList.length);
      setProjects(projectsList);

      // Clean up existing proposal listeners
      allUnsubscribeProposals.forEach(unsub => unsub());
      allUnsubscribeProposals = [];

      // Set up proposal listeners for each project
      if (projectsList.length > 0) {
        const allProposals = [];
        let completedProjects = 0;

        projectsList.forEach((project) => {
          const proposalsQuery = query(
            collection(db, "proposals"),
            where("projectId", "==", project.id),
            orderBy("createdAt", "desc")
          );

          const unsubscribeProposal = onSnapshot(proposalsQuery, (proposalSnapshot) => {
            const projectProposals = proposalSnapshot.docs.map((doc) => {
              const proposalData = doc.data();
              const createdAt = proposalData.createdAt 
                ? new Date(proposalData.createdAt.seconds * 1000)
                : new Date();

              return {
                id: doc.id,
                ...proposalData,
                createdAt,
                project: {
                  id: project.id,
                  title: project.title,
                  description: project.description,
                },
              };
            });

            // Update the proposals for this specific project
            allProposals.splice(
              allProposals.findIndex(p => p.project?.id === project.id),
              allProposals.filter(p => p.project?.id === project.id).length,
              ...projectProposals
            );

            completedProjects++;
            if (completedProjects === projectsList.length) {
              console.log("📊 All proposals updated:", allProposals.length);
              setProposals([...allProposals]);
            }
          });

          allUnsubscribeProposals.push(unsubscribeProposal);
        });
      } else {
        setProposals([]);
      }
    });

    // Set up real-time listener for reviews
    const reviewsQuery = query(
      collection(db, "reviews"),
      where("revieweeId", "==", user.uid),
      where("revieweeType", "==", "client")
    );

    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
      const reviewsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("📊 Reviews updated:", reviewsList.length);
      setReviews(reviewsList);
    });

    setLoading(false);

    // Cleanup listeners
    return () => {
      unsubscribeProjects();
      allUnsubscribeProposals.forEach(unsub => unsub());
      unsubscribeReviews();
    };
  }, [authLoading, user?.uid]);

  // Calculate stats whenever projects or proposals change
  useEffect(() => {
    console.log("🔄 Recalculating client stats...");
    console.log("  - Projects:", projects.length);
    console.log("  - Proposals:", proposals.length);
    
    const activeProjects = projects.filter(
      (p) => p.status === "open" || p.status === "in-progress"
    ).length;

    const completedProjects = projects.filter(
      (p) => p.status === "completed"
    );

    const pendingProposals = proposals.filter(
      (p) => p.status === "pending"
    ).length;

    console.log("  - Active projects:", activeProjects);
    console.log("  - Completed projects:", completedProjects.length);
    console.log("  - Pending proposals:", pendingProposals);

    // Calculate total spent from completed projects and accepted proposals
    let totalSpent = 0;
    
    // Calculate total spent based on accepted proposals for completed projects
    const acceptedProposals = proposals.filter(p => p.status === "accepted");
    console.log("🔄 Calculating total spent:");
    console.log("  - Accepted proposals:", acceptedProposals.length);
    console.log("  - Completed projects:", completedProjects.length);
    
    // For each accepted proposal, check if the project is completed and add the bid amount
    acceptedProposals.forEach(proposal => {
      const project = projects.find(p => p.id === proposal.projectId);
      if (project && project.status === "completed") {
        const bidAmount = parseFloat(proposal.bid || 0);
        totalSpent += bidAmount;
        console.log(`  ✅ Added $${bidAmount} from completed project: ${project.title}`);
      }
    });

    // Also check for completed projects that might not have accepted proposals in the proposals collection
    // but might have been completed through other means - use project budget as fallback
    const completedProjectsWithoutAcceptedProposals = completedProjects.filter(project => {
      const hasAcceptedProposal = acceptedProposals.some(proposal => 
        proposal.projectId === project.id
      );
      return !hasAcceptedProposal;
    });

    // Add budget from completed projects that don't have accepted proposals
    completedProjectsWithoutAcceptedProposals.forEach(project => {
      const budgetAmount = parseFloat(project.budget || 0);
      totalSpent += budgetAmount;
      console.log(`  💰 Added $${budgetAmount} from project budget: ${project.title}`);
    });

    console.log(`  📈 Total spent calculated: $${totalSpent}`);

    setStats({
      totalProjects: projects.length,
      activeProjects,
      totalSpent,
      pendingProposals,
      completedProjects: completedProjects.length,
    });
  }, [projects, proposals]); // Recalculate when projects or proposals change

  // Fix the review submission to handle missing freelancer data
  const handleReviewSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!reviewModal.project) return;

    try {
      // Get freelancer data from accepted proposal
      const proposalsQuery = query(
        collection(db, 'proposals'),
        where('projectId', '==', reviewModal.project.id),
        where('status', '==', 'accepted')
      );
      const proposalsSnapshot = await getDocs(proposalsQuery);
      
      let freelancerData = null;
      if (!proposalsSnapshot.empty) {
        const acceptedProposal = proposalsSnapshot.docs[0].data();
        freelancerData = {
          id: acceptedProposal.freelancerId,
          name: acceptedProposal.freelancerName
        };
      }

      if (!freelancerData) {
        toast.error('Unable to find freelancer information for this project');
        return;
      }

      // Create review document
      const reviewRef = await addDoc(collection(db, 'reviews'), {
        projectId: reviewModal.project.id,
        reviewerId: user.uid,
        reviewerName: user.displayName || 'Client',
        reviewerRole: 'client',
        reviewedId: freelancerData.id,
        reviewedName: freelancerData.name,
        reviewedRole: 'freelancer',
        rating: reviewData.overall,
        comment: reviewData.comment,
        quality: reviewData.quality,
        communication: reviewData.communication,
        timeliness: reviewData.timeliness,
        overall: reviewData.overall,
        createdAt: serverTimestamp()
      });

      // Update project to mark review as given
      await updateDoc(doc(db, 'projects', reviewModal.project.id), {
        clientReviewGiven: true
      });

      toast.success('Review submitted successfully!');
      setReviewModal({ isOpen: false, project: null, freelancer: null });
      setReviewData({
        rating: 5,
        comment: '',
        quality: 5,
        communication: 5,
        timeliness: 5,
        overall: 5
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  }, [reviewModal.project, reviewData, user]);

  // ✅ Only return JSX after all hooks have been defined
  if (authLoading || !user || !user.uid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  const handleDeleteProject = async (projectId) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteDoc(doc(db, "projects", projectId));
        toast.success("Project deleted successfully");
        setProjects(projects.filter((project) => project.id !== projectId));
      } catch (error) {
        console.error("Error deleting project:", error);
        console.warn("Failed to delete project");
      }
    }
  };

  const handleProposalAction = async (proposalId, action) => {
    try {
      const proposalRef = doc(db, "proposals", proposalId);
      await updateDoc(proposalRef, {
        status: action,
      });

      toast.success(`Proposal ${action}`);

      // Refresh proposals
      setProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status: action } : p))
      );
    } catch (error) {
      console.error(`Failed to ${action} proposal:`, error);
      toast.error("Action failed. Try again.");
    }
  };

  const handleEditProfile = () => {
    router.push("/edit-client-profile");
  };

  const handleCreateProject = () => {
    router.push("/projects/new");
  };

  const handleViewProject = (projectId) => {
    router.push(`/projects/${projectId}`);
  };

  const handleEditProject = (projectId) => {
    router.push(`/edit-project/${projectId}`);
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle profile edits
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Start editing profile
  const handleStartEditProfile = () => {
    setEditedProfile({ ...profileData });
    setIsEditingProfile(true);
    setImagePreview(profileData.profileImageUrl || null);
  };

  // Cancel editing profile
  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);
    setEditedProfile(null);
    setProfileImage(null);
    setImagePreview(null);
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      // Upload image if there's a new one
      let profileImageUrl = editedProfile.profileImageUrl;

      if (profileImage) {
        setUploadingImage(true);
        const storageRef = ref(storage, `profile_images/${user.uid}`);
        const uploadTask = uploadBytesResumable(storageRef, profileImage);

        // Wait for upload to complete
        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              // Track upload progress if needed
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log("Upload is " + progress + "% done");
            },
            (error) => {
              console.error("Error uploading image:", error);
              reject(error);
            },
            async () => {
              // Upload completed successfully
              profileImageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });

        setUploadingImage(false);
      }

      // Update profile in Firestore
      const profileRef = doc(db, "client_registration", user.uid);

      await updateDoc(profileRef, {
        ...editedProfile,
        profileImageUrl,
        updatedAt: Timestamp.now(),
      });

      // Update local state
      setProfileData({
        ...editedProfile,
        profileImageUrl,
      });

      setIsEditingProfile(false);
      setProfileImage(null);

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      console.warn("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update notification settings
  const handleNotificationToggle = (settingName) => {
    setNotificationSettings((prev) => {
      const newSettings = {
        ...prev,
        [settingName]: !prev[settingName],
      };

      return newSettings;
    });
  };

  // Update privacy settings
  const handlePrivacyToggle = (settingName) => {
    setPrivacySettings((prev) => {
      const newSettings = {
        ...prev,
        [settingName]: !prev[settingName],
      };

      return newSettings;
    });
  };

  // Save notification settings to Firebase
  const saveNotificationSettings = async () => {
    if (!user?.uid) return;

    try {
      const profileRef = doc(db, "client_registration", user.uid);

      await updateDoc(profileRef, {
        notificationSettings,
        updatedAt: Timestamp.now(),
      });

      toast.success("Notification preferences saved!");
    } catch (error) {
      console.error("Error saving notification settings:", error);
      console.warn("Failed to save notification preferences");
    }
  };

  // Save privacy settings to Firebase
  const savePrivacySettings = async () => {
    if (!user?.uid) return;
    console.log("Logged-in client UID:", user?.uid);
    try {
      const profileRef = doc(db, "client_registration", user.uid);

      await updateDoc(profileRef, {
        privacySettings,
        updatedAt: Timestamp.now(),
      });

      toast.success("Privacy settings saved!");
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      console.warn("Failed to save privacy settings");
    }
  };

  // Add this function to handle proposal removal
  const handleRemoveProposal = async (proposalId) => {
    if (confirm("Are you sure you want to remove this proposal?")) {
      try {
        await deleteDoc(doc(db, "proposals", proposalId));
        toast.success("Proposal removed successfully");
        setProposals((prev) => prev.filter((p) => p.id !== proposalId));
      } catch (error) {
        console.error("Error removing proposal:", error);
        toast.error("Failed to remove proposal");
      }
    }
  };

  const handleAcceptProposal = async (proposal) => {
    if (!proposal || !proposal.id || !proposal.projectId || !proposal.freelancerId) {
      console.error("Invalid proposal data:", proposal);
      toast.error("Invalid proposal data");
      return;
    }

    try {
      setLoading(true);
      console.log("Accepting proposal:", proposal);
      console.log("Proposal duration:", proposal.duration, typeof proposal.duration);

      // First verify the project belongs to the current user
      const projectRef = doc(db, "projects", proposal.projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error("Project not found");
      }

      const projectData = projectDoc.data();
      console.log("Project data:", projectData);
      
      if (projectData.clientId !== user.uid) {
        throw new Error("You don't have permission to accept this proposal");
      }

      // Update proposal status
      const proposalRef = doc(db, "proposals", proposal.id);
      await updateDoc(proposalRef, {
        status: "accepted",
        acceptedAt: serverTimestamp(),
        clientId: user.uid // Add clientId to the proposal
      });

      // Update project status and assign freelancer
      await updateDoc(projectRef, {
        status: "in-progress",
        freelancerId: proposal.freelancerId,
        updatedAt: serverTimestamp(),
        acceptedProposalId: proposal.id // Add accepted proposal ID to project
      });

      // Create conversation entry in accepted_proposals collection for messaging
      const conversationData = {
        id: proposal.id, // Use proposal ID as conversation ID
        projectId: proposal.projectId,
        projectTitle: projectData.title || "",
        projectDescription: projectData.description || "",
        freelancerId: proposal.freelancerId,
        freelancerName: proposal.freelancerName || "",
        clientId: user.uid,
        clientName: profileData?.fullName || "Client",
        bid: proposal.bid || 0,
        status: "accepted",
        acceptedAt: serverTimestamp(),
        participants: [user.uid, proposal.freelancerId], // Array for easy querying
        lastMessageAt: serverTimestamp(),
        lastMessage: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Add additional fields that freelancer dashboard expects
        content: proposal.content || "",
        projectBudget: projectData.budget || 0,
        projectCategory: projectData.category || "",
        projectSkills: projectData.skills || []
      };

      // Only add duration if it's a valid value
      if (proposal.duration !== undefined && proposal.duration !== null && proposal.duration !== "") {
        conversationData.duration = proposal.duration;
      }

      // Filter out any undefined, null, or empty values to prevent Firestore errors
      const cleanedData = Object.fromEntries(
        Object.entries(conversationData).filter(([key, value]) => {
          const isValid = value !== undefined && value !== null;
          if (!isValid) {
            console.log(`Filtering out invalid field: ${key} = ${value}`);
          }
          return isValid;
        })
      );

      console.log("Final cleaned conversation data:", cleanedData);

      // Validate that all required fields are present
      const requiredFields = ['id', 'projectId', 'freelancerId', 'clientId', 'status'];
      const missingFields = requiredFields.filter(field => !cleanedData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Add to accepted_proposals collection (this will be used for messaging)
      await setDoc(doc(db, "accepted_proposals", proposal.id), cleanedData);

      // Create unified conversation for messaging
      try {
        const { createConversationFromAcceptedProposal } = await import('@/utils/messaging');
        await createConversationFromAcceptedProposal(proposal, projectData, { uid: user.uid, ...profileData });
      } catch (error) {
        console.error('Error creating unified conversation:', error);
        // Don't fail the proposal acceptance if conversation creation fails
      }

      // Send notification to freelancer
      await sendHireNotificationToFreelancer(
        proposal.freelancerId,
        projectData.title || "Your Project",
        proposal.projectId
      );

      toast.success("Proposal accepted successfully! You can now message the freelancer.");
      
      // Update local state
      setProposals(prevProposals => 
        prevProposals.map(p => 
          p.id === proposal.id ? { ...p, status: "accepted" } : p
        )
      );

      // Update projects list
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === proposal.projectId
            ? { ...p, status: "in-progress", freelancerId: proposal.freelancerId }
            : p
        )
      );
    } catch (error) {
      console.error("Error accepting proposal:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      if (error.message === "You don't have permission to accept this proposal") {
        toast.error("You don't have permission to accept this proposal");
      } else if (error.message === "Project not found") {
        toast.error("Project not found");
      } else if (error.code === "permission-denied") {
        toast.error("You don't have permission to perform this action");
      } else if (error.message.includes("invalid data")) {
        toast.error("Invalid data detected. Please check the proposal details.");
      } else if (error.message.includes("Missing required fields")) {
        toast.error(`Missing required data: ${error.message}`);
      } else {
        toast.error("Failed to accept proposal. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProject = async (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Find the freelancer name from accepted proposals
    const acceptedProposal = proposals.find(p => 
      p.projectId === projectId && p.status === "accepted"
    );
    
    const freelancerName = acceptedProposal?.freelancerName || 'Freelancer';

    setCompletionModal({
      isOpen: true,
      project,
      freelancerName
    });
  };

  const handleProjectCompletion = async ({ notes, rating, projectId }) => {
    try {
      // Update project status
      await updateDoc(doc(db, "projects", projectId), {
        status: "completed",
        updatedAt: serverTimestamp(),
        completedAt: serverTimestamp(),
        completionNotes: notes,
        clientRating: rating,
      });

      // Find and update the accepted proposal for this project
      const proposalsQuery = query(
        collection(db, "accepted_proposals"),
        where("projectId", "==", projectId)
      );
      const proposalsSnapshot = await getDocs(proposalsQuery);
      
      if (!proposalsSnapshot.empty) {
        const proposalDoc = proposalsSnapshot.docs[0];
        const proposalData = proposalDoc.data();
        
        // Update proposal status to completed
        await updateDoc(doc(db, "accepted_proposals", proposalDoc.id), {
          status: "completed",
          completedAt: serverTimestamp(),
          completionNotes: notes,
          clientRating: rating,
        });

        // Send enhanced notification to freelancer
        const { sendProjectCompletedNotification } = await import("@/utils/notifications");
        await sendProjectCompletedNotification(
          projectId,
          projects.find(p => p.id === projectId)?.title || 'Your Project',
          proposalData.freelancerId,
          profileData?.fullName || 'Client',
          notes,
          rating
        );
      }

      toast.success("Project marked as completed!");
      
      // Update local state immediately
      const updatedProjects = projects.map(project =>
        project.id === projectId ? { 
          ...project, 
          status: "completed", 
          completedAt: new Date(),
          completionNotes: notes,
          clientRating: rating
        } : project
      );
      setProjects(updatedProjects);

      // Update stats immediately
      const completedProject = projects.find(p => p.id === projectId);
      if (completedProject) {
        // Find the accepted proposal for this project to get the actual amount spent
        const acceptedProposal = proposals.find(p => 
          p.projectId === projectId && p.status === "accepted"
        );
        
        const amountSpent = acceptedProposal 
          ? parseFloat(acceptedProposal.bid || 0)
          : parseFloat(completedProject.budget || 0); // Fallback to project budget if no accepted proposal found

        setStats(prevStats => ({
          ...prevStats,
          activeProjects: prevStats.activeProjects - 1,
          completedProjects: prevStats.completedProjects + 1,
          totalSpent: prevStats.totalSpent + amountSpent
        }));
      }
    } catch (error) {
      console.error("Error marking project as completed:", error);
      toast.error("Failed to mark project as completed. Please try again.");
      throw error;
    }
  };

  const handleRefreshData = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // Re-fetch all data
      const clientProfileDoc = await getDoc(
        doc(db, "client_registration", user.uid)
      );
      
      if (clientProfileDoc.exists()) {
        const data = clientProfileDoc.data();
        setProfileData(data);
        
        // Fetch projects
        const projectsQuery = query(
          collection(db, "projects"),
          where("clientId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsList = projectsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectsList);

        // Fetch proposals
        const proposalsList = [];
        for (const project of projectsList) {
          const proposalsQuery = query(
            collection(db, "proposals"),
            where("projectId", "==", project.id),
            orderBy("createdAt", "desc")
          );
          const proposalsSnapshot = await getDocs(proposalsQuery);
          
          for (const proposalDoc of proposalsSnapshot.docs) {
            const proposalData = proposalDoc.data();
            const createdAt = proposalData.createdAt 
              ? new Date(proposalData.createdAt.seconds * 1000)
              : new Date();

            proposalsList.push({
              id: proposalDoc.id,
              ...proposalData,
              createdAt,
              project: {
                id: project.id,
                title: project.title,
                description: project.description,
              },
            });
          }
        }
        setProposals(proposalsList);

        // Update stats
        const activeProjects = projectsList.filter(
          (p) => p.status === "open" || p.status === "in-progress"
        ).length;

        const completedProjects = projectsList.filter(
          (p) => p.status === "completed"
        );

        const pendingProposals = proposalsList.filter(
          (p) => p.status === "pending"
        ).length;

        let totalSpent = 0;
        
        // Calculate total spent based on accepted proposals for completed projects
        const acceptedProposals = proposalsList.filter(p => p.status === "accepted");
        
        // For each accepted proposal, check if the project is completed and add the bid amount
        acceptedProposals.forEach(proposal => {
          const project = projectsList.find(p => p.id === proposal.projectId);
          if (project && project.status === "completed") {
            const bidAmount = parseFloat(proposal.bid || 0);
            totalSpent += bidAmount;
            console.log(`  ✅ Added $${bidAmount} from completed project: ${project.title}`);
          }
        });

        // Also check for completed projects that might not have accepted proposals in the proposals collection
        // but might have been completed through other means - use project budget as fallback
        const completedProjectsWithoutAcceptedProposals = completedProjects.filter(project => {
          const hasAcceptedProposal = acceptedProposals.some(proposal => 
            proposal.projectId === project.id
          );
          return !hasAcceptedProposal;
        });

        // Add budget from completed projects that don't have accepted proposals
        completedProjectsWithoutAcceptedProposals.forEach(project => {
          const budgetAmount = parseFloat(project.budget || 0);
          totalSpent += budgetAmount;
          console.log(`  💰 Added $${budgetAmount} from project budget: ${project.title}`);
        });

        console.log(`  📈 Total spent calculated: $${totalSpent}`);

        setStats({
          totalProjects: projectsList.length,
          activeProjects,
          totalSpent,
          pendingProposals,
          completedProjects: completedProjects.length,
        });

        toast.success("Data refreshed successfully!");
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  // Add this function to handle review requests
  const handleReviewRequest = (notification) => {
    if (notification.type === 'review_requested' || 
        (notification.type === 'project_completed' && notification.requiresReview)) {
      setReviewModal({
        isOpen: true,
        project: {
          id: notification.projectId,
          title: notification.projectTitle,
          clientId: user.uid,
          clientName: user.displayName
        },
        freelancer: {
          id: notification.freelancerId,
          name: notification.freelancerName
        }
      });
    }
  };

  // Update the notification click handler
  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Handle review requests
    if (notification.type === 'review_requested' || 
        (notification.type === 'project_completed' && notification.requiresReview)) {
      handleReviewRequest(notification);
      return;
    }

    // ... rest of the existing notification click handling ...
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if profile data is available before rendering
  if (!profileData) {
    console.log("No profile data available for rendering");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">Profile data not found</div>
          <button
            onClick={() => router.push("/client-registration")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Complete Registration
          </button>
        </div>
      </div>
    );
  }

  // Add Review Modal component
  const ReviewModal = () => {
    if (!reviewModal.isOpen || !reviewModal.project) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Review for {reviewModal.project.freelancerName}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Project: {reviewModal.project.title}
              </p>
            </div>
            <button
              onClick={() => setReviewModal({ isOpen: false, project: null, freelancer: null })}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleReviewSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality of Work
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={reviewData.quality}
                      onChange={(e) => setReviewData(prev => ({
                        ...prev,
                        quality: parseInt(e.target.value)
                      }))}
                      className="w-full"
                    />
                    <span className="text-sm font-medium text-indigo-600">
                      {reviewData.quality}/5
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Communication
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={reviewData.communication}
                      onChange={(e) => setReviewData(prev => ({
                        ...prev,
                        communication: parseInt(e.target.value)
                      }))}
                      className="w-full"
                    />
                    <span className="text-sm font-medium text-indigo-600">
                      {reviewData.communication}/5
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeliness
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={reviewData.timeliness}
                      onChange={(e) => setReviewData(prev => ({
                        ...prev,
                        timeliness: parseInt(e.target.value)
                      }))}
                      className="w-full"
                    />
                    <span className="text-sm font-medium text-indigo-600">
                      {reviewData.timeliness}/5
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Rating
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={reviewData.overall}
                      onChange={(e) => setReviewData(prev => ({
                        ...prev,
                        overall: parseInt(e.target.value)
                      }))}
                      className="w-full"
                    />
                    <span className="text-sm font-medium text-indigo-600">
                      {reviewData.overall}/5
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review
              </label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData(prev => ({
                  ...prev,
                  comment: e.target.value
                }))}
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Share your experience working with this freelancer. What went well? What could be improved?"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setReviewModal({ isOpen: false, project: null, freelancer: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Submit Review
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Update the project card to include the review button
  const renderProjectCard = (project) => {
    return (
      <motion.div
        key={project.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {project.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {project.description}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              project.status === "open"
                ? "bg-green-100 text-green-800"
                : project.status === "in-progress"
                ? "bg-blue-100 text-blue-800"
                : project.status === "completed"
                ? "bg-purple-100 text-purple-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {project.status}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <FaRegCalendarAlt className="mr-1" />
              {formatDate(project.createdAt)}
            </div>
            <div className="flex items-center">
              <FaMoneyBillWave className="mr-1" />${project.budget}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleViewProject(project.id)}
              className="text-blue-600 hover:text-blue-700"
              title="View Project"
            >
              <FaEye className="w-5 h-5" />
            </button>
            {project.status === "in-progress" && (
              <button
                onClick={() => handleCompleteProject(project.id)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                title="Mark as Complete"
              >
                <FaCheckCircle className="mr-1" />
                Mark Complete
              </button>
            )}
            {!project.clientReviewGiven && (
              <button
                onClick={() => {
                  setReviewModal({
                    isOpen: true,
                    project: project,
                    freelancer: project.freelancer
                  });
                }}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                title="Leave Review"
              >
                <FaStar className="mr-1" />
                Review
              </button>
            )}
            {project.clientReviewGiven && (
              <div className="inline-flex items-center px-3 py-1 border border-gray-200 text-sm font-medium rounded-md text-gray-700 bg-gray-50">
                <FaCheckCircle className="mr-1 text-green-500" />
                Reviewed
              </div>
            )}
            <button
              onClick={() => handleDeleteProject(project.id)}
              className="text-red-600 hover:text-red-700"
              title="Delete Project"
            >
              <FaTrash className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <Head>
        <title>Client Dashboard | Student Freelance Platform</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pb-12">
        {/* Header */}
        <div className="relative overflow-hidden pt-32 pb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500"></div>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full bg-white p-1 shadow-lg">
                  <img
                    src={profileData?.profileImage || "/default-avatar.png"}
                    alt="Profile"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white drop-shadow-md">
                    {profileData?.fullName || "Your Name"}
                  </h1>
                  <p className="text-white/90 font-medium drop-shadow-sm">
                    {profileData?.companyName || "Company Name"}
                  </p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-4">
                <NotificationCenter userType="client" />
                <button
                  onClick={handleEditProfile}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-indigo-700 bg-white hover:bg-indigo-50 shadow-lg transition-all duration-200"
                >
                  <FaEdit className="mr-2" />
                  Edit Profile
                </button>
                <button
                  onClick={handleCreateProject}
                  className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-semibold rounded-lg text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200"
                >
                  <FaPlusCircle className="mr-2" />
                  New Project
                </button>
                <button
                  onClick={() => router.push("/messages")}
                  className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-semibold rounded-lg text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200"
                >
                  <FaEnvelope className="mr-2" />
                  Messages
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Quick Stats
                    </h2>
                    <button
                      onClick={handleRefreshData}
                      disabled={loading}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Refresh data"
                    >
                      <FaSearch className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Projects</span>
                      <span className="font-semibold">
                        {stats.totalProjects}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Active Projects</span>
                      <span className="font-semibold">
                        {stats.activeProjects}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Spent</span>
                      <span className="font-semibold">${stats.totalSpent}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Pending Proposals</span>
                      <span className="font-semibold">
                        {stats.pendingProposals}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Activity
                  </h2>
                  <div className="space-y-4">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start space-x-3"
                      >
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <FaBell className="text-indigo-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {/* Tabs */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    {["overview", "projects", "proposals", "reviews", "history", "settings"].map(
                      (tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`${
                            activeTab === tab
                              ? "border-indigo-500 text-indigo-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm capitalize relative`}
                        >
                          {tab === "settings" ? (
                            <span className="flex items-center">
                              <FaCog className="mr-2" />
                              {tab}
                            </span>
                          ) : tab === "proposals" ? (
                            <span className="flex items-center">
                              {tab}
                              {stats.pendingProposals > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                  {stats.pendingProposals > 10 ? "10+" : stats.pendingProposals}
                                </span>
                              )}
                            </span>
                          ) : (
                            tab
                          )}
                        </button>
                      )
                    )}
                  </nav>
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  {activeTab === "overview" && (
                    <div className="space-y-8">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-500">
                                Total Projects
                              </p>
                              <p className="text-2xl font-semibold text-gray-900 mt-1">
                                {stats.totalProjects}
                              </p>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                              <FaProjectDiagram className="w-6 h-6" />
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-500">
                                Active Projects
                              </p>
                              <p className="text-2xl font-semibold text-gray-900 mt-1">
                                {stats.activeProjects}
                              </p>
                            </div>
                            <div className="p-3 rounded-full bg-green-100 text-green-600">
                              <FaRegCheckCircle className="w-6 h-6" />
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-500">
                                Total Spent
                              </p>
                              <p className="text-2xl font-semibold text-gray-900 mt-1">
                                ${stats.totalSpent}
                              </p>
                            </div>
                            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                              <FaMoneyBillWave className="w-6 h-6" />
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-500">
                                Pending Proposals
                              </p>
                              <p className="text-2xl font-semibold text-gray-900 mt-1">
                                {stats.pendingProposals}
                              </p>
                            </div>
                            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                              <FaRegClock className="w-6 h-6" />
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Charts Section */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Project Timeline Chart */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 border border-indigo-100"
                        >
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <FaChartLine className="mr-2 text-indigo-600" />
                            Project Timeline
                          </h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={[
                                  { name: "Jan", projects: 2, budget: 1200 },
                                  { name: "Feb", projects: 4, budget: 2400 },
                                  { name: "Mar", projects: 3, budget: 1800 },
                                  { name: "Apr", projects: 5, budget: 3000 },
                                  { name: "May", projects: 4, budget: 2400 },
                                  { name: "Jun", projects: 6, budget: 3600 },
                                ]}
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <defs>
                                  <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                                <XAxis dataKey="name" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                  }}
                                />
                                <Legend />
                                <Area
                                  type="monotone"
                                  dataKey="projects"
                                  stroke="#3B82F6"
                                  fillOpacity={1}
                                  fill="url(#colorProjects)"
                                  strokeWidth={3}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </motion.div>

                        {/* Budget Distribution Chart */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-100"
                        >
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <FaMoneyBillWave className="mr-2 text-green-600" />
                            Budget Distribution
                          </h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: "Web Development", value: 45, fill: "#3B82F6" },
                                    { name: "Mobile Apps", value: 30, fill: "#10B981" },
                                    { name: "UI/UX Design", value: 15, fill: "#F59E0B" },
                                    { name: "Content Writing", value: 10, fill: "#EF4444" },
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={100}
                                  dataKey="value"
                                  label={({ name, percent }) =>
                                    `${name} ${(percent * 100).toFixed(0)}%`
                                  }
                                >
                                </Pie>
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                  }}
                                />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </motion.div>

                        {/* Monthly Spending Chart */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                          className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-lg p-6 border border-yellow-100"
                        >
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <FaChartBar className="mr-2 text-orange-600" />
                            Monthly Spending
                          </h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={[
                                  { month: "Jan", spending: 1200 },
                                  { month: "Feb", spending: 2400 },
                                  { month: "Mar", spending: 1800 },
                                  { month: "Apr", spending: 3000 },
                                  { month: "May", spending: 2400 },
                                  { month: "Jun", spending: 3600 },
                                ]}
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" />
                                <XAxis dataKey="month" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                  }}
                                />
                                <Legend />
                                <Bar 
                                  dataKey="spending" 
                                  fill="#F59E0B" 
                                  radius={[4, 4, 0, 0]}
                                  name="Monthly Spending ($)"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </motion.div>

                        {/* Project Success Rate */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-purple-100"
                        >
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <FaChartPie className="mr-2 text-purple-600" />
                            Project Success Rate
                          </h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadialBarChart 
                                cx="50%" 
                                cy="50%" 
                                innerRadius="20%" 
                                outerRadius="90%" 
                                data={[
                                  { name: "Completed", value: 85, fill: "#10B981" },
                                  { name: "In Progress", value: 65, fill: "#3B82F6" },
                                  { name: "On Hold", value: 25, fill: "#F59E0B" },
                                ]}
                              >
                                <RadialBar 
                                  dataKey="value" 
                                  cornerRadius={10} 
                                  label={{ position: 'insideStart', fill: '#fff' }}
                                />
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                  }}
                                />
                                <Legend />
                              </RadialBarChart>
                            </ResponsiveContainer>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  )}

                  {activeTab === "projects" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">
                          My Projects
                        </h2>
                        <button
                          onClick={handleCreateProject}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <FaPlusCircle className="mr-2" />
                          New Project
                        </button>
                      </div>
                      <div className="space-y-4">
                        {projects.map((project) => (
                          <div key={project.id}>
                            {renderProjectCard(project)}
                          </div>
                        ))}
                      </div>
                      
                      {/* Document Upload for Active Projects */}
                      {projects.filter(p => p.status === 'in-progress').length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Project Documents
                          </h3>
                          {projects.filter(p => p.status === 'in-progress').map((project) => (
                            <div key={`docs-${project.id}`} className="mb-6">
                              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <h4 className="font-medium text-gray-900">{project.title}</h4>
                                <p className="text-sm text-gray-600">Upload and manage project documents</p>
                              </div>
                              <DocumentUpload
                                projectId={project.id}
                                userRole="client"
                                projectData={project}
                                onDocumentUploaded={(documentData) => {
                                  console.log('Document uploaded:', documentData);
                                  toast.success('Document uploaded successfully!');
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "proposals" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Project Proposals
                        </h2>
                        <div className="text-m text-gray-500">
                          Total Proposals: {proposals.length}
                        </div>
                      </div>
                      <div className="space-y-4">
                        {proposals.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="text-gray-500">
                              <FaInbox className="mx-auto h-12 w-12" />
                              <h3 className="mt-2 text-sm font-medium">No proposals yet</h3>
                              <p className="mt-1 text-sm text-gray-500">
                                You haven&apos;t received any proposals for your projects.
                              </p>
                            </div>
                          </div>
                        ) : (
                          proposals.map((proposal) => {
                            console.log("Rendering proposal:", proposal); // Debug log
                            return (
                              <motion.div
                                key={proposal.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-900">
                                      {proposal.project?.title || "Untitled Project"}
                                    </h3>
                                    <div className="mt-1 flex items-center text-sm text-gray-500">
                                      <FaUser className="mr-1" />
                                      {proposal.freelancerName || "Freelancer Profile"}
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600">
                                      {proposal.content}
                                    </p>
                                  </div>
                                  <span
                                    className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                                      proposal.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : proposal.status === "accepted"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {proposal.status}
                                  </span>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <div className="flex items-center">
                                      <FaRegCalendarAlt className="mr-1" />
                                      {formatDate(proposal.createdAt)}
                                    </div>
                                    <div className="flex items-center">
                                      <FaMoneyBillWave className="mr-1" />$
                                      {proposal.bid || 0}
                                    </div>
                                    <div className="flex items-center">
                                      <FaRegClock className="mr-1" />
                                      {proposal.duration || "Not specified"} days
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {proposal.status === "pending" && (
                                      <>
                                        <button
                                          onClick={() => handleAcceptProposal(proposal)}
                                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                        >
                                          <FaCheckCircle className="mr-1" />
                                          Accept
                                        </button>
                                        <button
                                          onClick={() => router.push(`/freelancers/${proposal.freelancerId}`)}
                                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                          <FaEye className="mr-1" />
                                          See Profile
                                        </button>
                                        <button
                                          onClick={() => handleRemoveProposal(proposal.id)}
                                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                        >
                                          <FaTrash className="mr-1" />
                                          Remove
                                        </button>
                                      </>
                                    )}
                                    {proposal.status === "accepted" && (
                                      <button
                                        onClick={() => router.push("/messages")}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                      >
                                        <FaEnvelope className="mr-1" />
                                        Message
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "reviews" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Project Reviews
                        </h2>
                        <div className="text-m text-gray-500">
                          Total Reviews: {reviews.length}
                        </div>
                      </div>
                      <div className="space-y-4">
                        {reviews.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="text-gray-500">
                              <FaInbox className="mx-auto h-12 w-12" />
                              <h3 className="mt-2 text-sm font-medium">No reviews yet</h3>
                              <p className="mt-1 text-sm text-gray-500">
                                You haven&apos;t received any reviews for your projects.
                              </p>
                            </div>
                          </div>
                        ) : (
                          reviews.map((review) => (
                            <motion.div
                              key={review.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h3 className="text-lg font-medium text-gray-900">
                                    {review.projectTitle}
                                  </h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {review.content}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => router.push(`/projects/${review.projectId}`)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <FaEye className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "history" && (
                    <ProjectHistory userType="client" />
                  )}

                  {activeTab === "settings" && (
                    <div className="space-y-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Account Settings
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-md font-medium text-gray-900 mb-2">
                            Notification Settings
                          </h3>
                          <div className="space-y-4">
                            {Object.entries(notificationSettings).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="flex items-center justify-between"
                                >
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">
                                      {key
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, (str) =>
                                          str.toUpperCase()
                                        )}
                                    </label>
                                    <p className="text-sm text-gray-500">
                                      Receive notifications for{" "}
                                      {key
                                        .replace(/([A-Z])/g, " $1")
                                        .toLowerCase()}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleNotificationToggle(key)
                                    }
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                      value ? "bg-blue-600" : "bg-gray-200"
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${
                                        value
                                          ? "translate-x-5"
                                          : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-md font-medium text-gray-900 mb-2">
                            Privacy Settings
                          </h3>
                          <div className="space-y-4">
                            {Object.entries(privacySettings).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="flex items-center justify-between"
                                >
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">
                                      {key
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, (str) =>
                                          str.toUpperCase()
                                        )}
                                    </label>
                                    <p className="text-sm text-gray-500">
                                      {key === "allowFreelancersContact"
                                        ? "Allow freelancers to contact you directly"
                                        : key === "makeProfilePublic"
                                        ? "Make your profile visible to other users"
                                        : "Receive email notifications"}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handlePrivacyToggle(key)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                      value ? "bg-blue-600" : "bg-gray-200"
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${
                                        value
                                          ? "translate-x-5"
                                          : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Completion Modal */}
      {completionModal.isOpen && (
        <ProjectCompletionModal
          isOpen={completionModal.isOpen}
          onClose={() => setCompletionModal({ isOpen: false, project: null, freelancerName: '' })}
          onConfirm={handleProjectCompletion}
          project={completionModal.project}
          freelancerName={completionModal.freelancerName}
        />
      )}

      {/* Notification Detail Modal */}
      {notificationModal.isOpen && (
        <NotificationDetailModal
          isOpen={notificationModal.isOpen}
          onClose={() => setNotificationModal({ isOpen: false, notification: null })}
          notification={notificationModal.notification}
          onMarkAsRead={(notificationId) => {
            // Handle mark as read
            console.log('Mark as read:', notificationId);
          }}
          onNavigate={(path) => {
            router.push(path);
            setNotificationModal({ isOpen: false, notification: null });
          }}
        />
      )}

      {/* Add Review Modal */}
      <ReviewModalComponent
        isOpen={reviewModal.isOpen}
        project={reviewModal.project}
        reviewData={reviewData}
        setReviewData={setReviewData}
        onClose={() => setReviewModal({ isOpen: false, project: null, freelancer: null })}
        onSubmit={handleReviewSubmit}
      />
    </>
  );
}
