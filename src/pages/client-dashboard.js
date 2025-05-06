import { useState, useEffect } from "react";
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
} from "recharts";
import { sendHireNotificationToFreelancer } from "@/utils/notifications";

export default function ClientDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalSpent: 0,
    pendingProposals: 0,
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
    const fetchClientData = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);

        // Fetch client profile
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
        console.log("Fetched projects:", projectsList);
        setProjects(projectsList);

        // Fetch proposals for all projects
        const proposalsList = [];
        console.log("Starting to fetch proposals for projects:", projectsList.map(p => p.id));

        for (const project of projectsList) {
          console.log(`Fetching proposals for project: ${project.id}`);
          const proposalsQuery = query(
            collection(db, "proposals"),
            where("projectId", "==", project.id),
            orderBy("createdAt", "desc")
          );

          const proposalsSnapshot = await getDocs(proposalsQuery);
          console.log(`Found ${proposalsSnapshot.size} proposals for project ${project.id}`);

          for (const proposalDoc of proposalsSnapshot.docs) {
            const proposalData = proposalDoc.data();
            console.log("Processing proposal:", proposalData);

            // Format the timestamp
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

        console.log("Final proposals list:", proposalsList);
        setProposals(proposalsList);

        // Stats calc
        const activeProjects = projectsList.filter(
          (p) => p.status === "open" || p.status === "in-progress"
        ).length;

        const pendingProposals = proposalsList.filter(
          (p) => p.status === "pending"
        ).length;

        const totalSpent = projectsList.reduce((sum, project) => {
          return project.status === "completed"
            ? sum + parseFloat(project.budget || 0)
            : sum;
        }, 0);

        setStats({
          totalProjects: projectsList.length,
          activeProjects,
          totalSpent,
          pendingProposals,
        });
      } catch (error) {
        console.error("Error fetching client data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user?.uid) {
      fetchClientData();
    }
  }, [authLoading, user, router]);

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

      // First verify the project belongs to the current user
      const projectRef = doc(db, "projects", proposal.projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error("Project not found");
      }

      const projectData = projectDoc.data();
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

      // Send notification to freelancer
      await sendHireNotificationToFreelancer(
        proposal.freelancerId,
        projectData.title || "Your Project",
        proposal.projectId
      );

      toast.success("Proposal accepted successfully!");
      
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
      if (error.message === "You don't have permission to accept this proposal") {
        toast.error("You don't have permission to accept this proposal");
      } else if (error.message === "Project not found") {
        toast.error("Project not found");
      } else if (error.code === "permission-denied") {
        toast.error("You don't have permission to perform this action");
      } else {
        toast.error("Failed to accept proposal. Please try again.");
      }
    } finally {
      setLoading(false);
    }
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

  return (
    <>
      <Head>
        <title>Client Dashboard | Student Freelance Platform</title>
      </Head>

      <div className="min-h-screen bg-gray-50 pb-12">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 text-white relative overflow-hidden pt-32 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full bg-white p-1">
                  <img
                    src={profileData?.profileImage || "/default-avatar.png"}
                    alt="Profile"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {profileData?.fullName || "Your Name"}
                  </h1>
                  <p className="text-indigo-100">
                    {profileData?.companyName || "Company Name"}
                  </p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-4">
                <button
                  onClick={handleEditProfile}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
                >
                  <FaEdit className="mr-2" />
                  Edit Profile
                </button>
                <button
                  onClick={handleCreateProject}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600"
                >
                  <FaPlusCircle className="mr-2" />
                  New Project
                </button>
                <button
                  onClick={() => router.push("/messages")}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600"
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
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Stats
                  </h2>
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
                    {["overview", "projects", "proposals", "settings"].map(
                      (tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`${
                            activeTab === tab
                              ? "border-indigo-500 text-indigo-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm capitalize`}
                        >
                          {tab === "settings" ? (
                            <span className="flex items-center">
                              <FaCog className="mr-2" />
                              {tab}
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
                          className="bg-white rounded-xl shadow-sm p-6"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Project Timeline
                          </h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={[
                                  { name: "Jan", projects: 2 },
                                  { name: "Feb", projects: 4 },
                                  { name: "Mar", projects: 3 },
                                  { name: "Apr", projects: 5 },
                                  { name: "May", projects: 4 },
                                  { name: "Jun", projects: 6 },
                                ]}
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="projects"
                                  stroke="#3B82F6"
                                  activeDot={{ r: 8 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </motion.div>

                        {/* Project Status Distribution */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="bg-white rounded-xl shadow-sm p-6"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Project Status Distribution
                          </h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    {
                                      name: "Active",
                                      value: stats.activeProjects,
                                    },
                                    {
                                      name: "Completed",
                                      value:
                                        stats.totalProjects -
                                        stats.activeProjects,
                                    },
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  label={({ name, percent }) =>
                                    `${name} ${(percent * 100).toFixed(0)}%`
                                  }
                                >
                                  <Cell fill="#3B82F6" />
                                  <Cell fill="#10B981" />
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
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
                                  <FaMoneyBillWave className="mr-1" />$
                                  {project.budget}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewProject(project.id)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <FaEye className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleEditProject(project.id)}
                                  className="text-gray-600 hover:text-gray-700"
                                >
                                  <FaEdit className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteProject(project.id)
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <FaTrash className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
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
                                      <button
                                        onClick={() => handleAcceptProposal(proposal)}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                      >
                                        <FaCheckCircle className="mr-1" />
                                        Accept
                                      </button>
                                    )}
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
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </div>
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
    </>
  );
}
