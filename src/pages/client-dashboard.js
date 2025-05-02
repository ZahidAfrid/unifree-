import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/firebase/firebase.config";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
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
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Link from "next/link";

export default function ClientDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

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
    if (!timestamp) return "Unknown";

    try {
      if (timestamp instanceof Timestamp) {
        return new Date(timestamp.toDate()).toLocaleDateString();
      } else if (timestamp.toDate && typeof timestamp.toDate === "function") {
        return new Date(timestamp.toDate()).toLocaleDateString();
      } else if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      } else if (typeof timestamp === "string") {
        return new Date(timestamp).toLocaleDateString();
      }
      return "Unknown date format";
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
        console.log("Fetching client profile for user:", user.uid);

        // Fetch client profile data
        const clientProfileDoc = await getDoc(
          doc(db, "client_registration", user.uid)
        );

        if (clientProfileDoc.exists()) {
          const data = clientProfileDoc.data();
          console.log("Client profile data:", data);
          setProfileData(data);

          // Initialize notification settings from database or use defaults
          if (data.notificationSettings) {
            setNotificationSettings(data.notificationSettings);
          }

          // Initialize privacy settings from database or use defaults
          if (data.privacySettings) {
            setPrivacySettings(data.privacySettings);
          }
        } else {
          console.log("No client profile found, redirecting to registration");
          console.warn("Please complete your client profile first");
          router.push("/client-registration");
          return;
        }

        // Fetch projects created by the client
        const projectsQuery = query(
          collection(db, "projects"),
          where("clientId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsList = projectsSnapshot.docs.map((doc) => {
          const data = doc.data();
          // Safely handle Firestore timestamps
          if (data.createdAt && typeof data.createdAt.toDate === "function") {
            data.createdAt = data.createdAt;
          }
          return {
            id: doc.id,
            ...data,
          };
        });

        console.log("Projects data:", projectsList);
        setProjects(projectsList);

        // Fetch proposals for client's projects
        const projectIds = projectsList.map((project) => project.id);
        let allProposals = [];

        if (projectIds.length > 0) {
          // For each project, fetch its proposals
          for (const projectId of projectIds) {
            const proposalsQuery = query(
              collection(db, "proposals"),
              where("projectId", "==", projectId),
              orderBy("createdAt", "desc")
            );

            const proposalsSnapshot = await getDocs(proposalsQuery);
            const projectProposals = proposalsSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              project: projectsList.find((p) => p.id === projectId),
            }));

            allProposals = [...allProposals, ...projectProposals];
          }
        }

        console.log("All proposals data:", allProposals);
        setProposals(allProposals);

        // Calculate client stats
        const activeProjects = projectsList.filter(
          (p) => p.status === "open" || p.status === "in-progress"
        ).length;
        const pendingProposals = allProposals.filter(
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
        console.warn("Failed to load client data");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user?.uid) {
      fetchClientData();
    } else {
      console.log("Auth loading or no user UID");
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

  console.log("Rendering dashboard with profile data:", profileData);

  return (
    <div className="min-h-screen bg-gray-50 mt-50">
      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex flex-col items-center justify-center w-1/4 ${
              activeTab === "overview" ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <FaChartLine className="h-5 w-5" />
            <span className="text-xs mt-1">Overview</span>
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`flex flex-col items-center justify-center w-1/4 ${
              activeTab === "projects" ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <FaProjectDiagram className="h-5 w-5" />
            <span className="text-xs mt-1">Projects</span>
          </button>
          <button
            onClick={() => setActiveTab("proposals")}
            className={`flex flex-col items-center justify-center w-1/4 ${
              activeTab === "proposals" ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <FaUsers className="h-5 w-5" />
            <span className="text-xs mt-1">Proposals</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center justify-center w-1/4 ${
              activeTab === "settings" ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <FaCog className="h-5 w-5" />
            <span className="text-xs mt-1">Settings</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar - Hidden on Mobile */}
        <div className="hidden lg:block w-64 bg-white border-r border-gray-200 fixed h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={profileData?.profileImage || "/placeholder.jpg"}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <button
                  onClick={handleStartEditProfile}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-colors"
                >
                  <FaUserEdit className="w-3 h-3" />
                </button>
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">
                  {profileData?.fullName}
                </h2>
                <p className="text-sm text-gray-500">Client</p>
              </div>
            </div>
          </div>

          <nav className="mt-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center w-full px-6 py-3 text-sm font-medium ${
                activeTab === "overview"
                  ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FaChartLine className="w-5 h-5 mr-3" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex items-center w-full px-6 py-3 text-sm font-medium ${
                activeTab === "projects"
                  ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FaProjectDiagram className="w-5 h-5 mr-3" />
              Projects
            </button>
            <button
              onClick={() => setActiveTab("proposals")}
              className={`flex items-center w-full px-6 py-3 text-sm font-medium ${
                activeTab === "proposals"
                  ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FaUsers className="w-5 h-5 mr-3" />
              Proposals
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center w-full px-6 py-3 text-sm font-medium ${
                activeTab === "settings"
                  ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FaCog className="w-5 h-5 mr-3" />
              Settings
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-64 pb-16 lg:pb-0">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        <FaProjectDiagram className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">
                          Total Projects
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {stats.totalProjects}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-green-100 text-green-600">
                        <FaRegCheckCircle className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">
                          Active Projects
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {stats.activeProjects}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                        <FaMoneyBillWave className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">
                          Total Spent
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          ${stats.totalSpent}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                        <FaRegClock className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">
                          Pending Proposals
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {stats.pendingProposals}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Projects */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Recent Projects
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {projects.slice(0, 5).map((project) => (
                      <div
                        key={project.id}
                        className="p-4 sm:p-6 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {project.title}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {project.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                project.status === "open"
                                  ? "bg-green-100 text-green-800"
                                  : project.status === "in-progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {project.status}
                            </span>
                            <button
                              onClick={() => handleViewProject(project.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <FaEye className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === "projects" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    My Projects
                  </h2>
                  <button
                    onClick={handleCreateProject}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaPlusCircle className="w-5 h-5 mr-2" />
                    Create Project
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white rounded-xl shadow-sm overflow-hidden"
                    >
                      <div className="p-4 sm:p-6">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {project.title}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
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
                        <p className="mt-2 text-sm text-gray-500">
                          {project.description}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {project.skills?.map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end space-x-2">
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
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FaTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proposals Tab */}
            {activeTab === "proposals" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Project Proposals
                </h2>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {proposals.map((proposal) => (
                      <div
                        key={proposal.id}
                        className="p-4 sm:p-6 hover:bg-gray-50"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {proposal.project?.title}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {proposal.message}
                            </p>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <FaRegCalendarAlt className="w-4 h-4 mr-1" />
                              {formatDate(proposal.createdAt)}
                            </div>
                          </div>
                          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                proposal.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : proposal.status === "accepted"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {proposal.status}
                            </span>
                            <button
                              onClick={() => handleViewProposal(proposal.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <FaEye className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

                {/* Notification Settings */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Notification Settings
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6 space-y-4">
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
                                .replace(/^./, (str) => str.toUpperCase())}
                            </label>
                            <p className="text-sm text-gray-500">
                              Receive notifications for{" "}
                              {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleNotificationToggle(key)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              value ? "bg-blue-600" : "bg-gray-200"
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${
                                value ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Privacy Settings
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6 space-y-4">
                    {Object.entries(privacySettings).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
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
                              value ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
