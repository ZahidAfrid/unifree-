import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase.config";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FaPlus,
  FaBriefcase,
  FaUser,
  FaEnvelope,
  FaBell,
  FaUserEdit,
  FaCog,
  FaEye,
  FaEdit,
  FaTrash,
  FaCode,
  FaGlobe,
  FaStar,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaGraduationCap,
  FaCalendarAlt,
  FaSearch,
  FaChartLine,
  FaRegClock,
  FaRegCheckCircle,
  FaRegHourglass,
  FaLightbulb,
  FaTrophy,
  FaCheckCircle,
  FaExclamationCircle,
  FaInbox,
  FaRegCalendarAlt,
  FaUniversity,
  FaHandshake,
  FaClock,
  FaUsers,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import {
  FiAward,
  FiCheckCircle,
  FiMessageCircle,
  FiUser,
  FiArrowRight,
  FiZap,
} from "react-icons/fi";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  getDoc,
  doc,
  deleteDoc,
  Timestamp,
  limit,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import Head from "next/head";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [acceptedProposals, setAcceptedProposals] = useState([]);
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    totalEarnings: 0,
    pendingPayments: 0,
    averageRating: 0,
  });
  const [availability, setAvailability] = useState("available");
  const [settings, setSettings] = useState({
    emailNotifications: true,
    profileVisibility: "public",
    language: "english",
  });

  // Updated chart data with real-time data
  const [chartData, setChartData] = useState({
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Earnings",
        data: [0, 0, 0, 0, 0, 0],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
      {
        label: "Projects Completed",
        data: [0, 0, 0, 0, 0, 0],
        borderColor: "rgb(255, 99, 132)",
        tension: 0.1,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Earnings & Projects Overview",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

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

  // Fetch freelancer data and accepted proposals
  useEffect(() => {
    const fetchFreelancerData = async () => {
      if (!user?.uid) {
        console.log("No user UID available");
        return;
      }

      try {
        setLoading(true);
        console.log("Starting to fetch freelancer data for user:", user.uid);

        // Fetch profile data
        const freelancerProfileDoc = await getDoc(
          doc(db, "freelancer_profiles", user.uid)
        );

        if (freelancerProfileDoc.exists()) {
          const data = freelancerProfileDoc.data();
          console.log("Freelancer profile data:", data);
          setProfileData(data);
          setAvailability(data.availability || "available");

          // Set up real-time listener for accepted proposals
          const proposalsQuery = query(
            collection(db, "accepted_proposals"),
            where("freelancerId", "==", user.uid),
            orderBy("acceptedAt", "desc")
          );

          console.log("Setting up accepted proposals listener with query:", proposalsQuery);

          const unsubscribe = onSnapshot(proposalsQuery, async (snapshot) => {
            console.log("Accepted proposals snapshot received:", snapshot.size, "documents");
            
            const proposalsList = await Promise.all(
              snapshot.docs.map(async (proposalDoc) => {
                const proposalData = proposalDoc.data();
                console.log("Processing accepted proposal:", proposalDoc.id, proposalData);
                
                // Get the associated project for each proposal
                let projectData = null;
                if (proposalData.projectId) {
                  console.log("Fetching project data for proposal:", proposalData.projectId);
                  const projectDoc = await getDoc(
                    doc(db, "projects", proposalData.projectId)
                  );
                  if (projectDoc.exists()) {
                    projectData = projectDoc.data();
                    console.log("Project data found:", projectData);
                  } else {
                    console.log("Project not found for ID:", proposalData.projectId);
                  }
                }

                return {
                  id: proposalDoc.id,
                  ...proposalData,
                  project: projectData,
                };
              })
            );

            console.log("Final accepted proposals list:", proposalsList);
            setAcceptedProposals(proposalsList);

            // Calculate stats
            const totalEarnings = proposalsList.reduce((sum, p) => {
              return sum + (parseFloat(p.bid) || 0);
            }, 0);

            setStats({
              activeProjects: proposalsList.length,
              completedProjects: 0, // Update this when you add completion status
              totalEarnings,
              pendingPayments: totalEarnings,
              averageRating: data.averageRating || 0,
            });

            // Update chart data with new accepted proposals
            const currentMonth = new Date().getMonth();
            const monthlyEarnings = Array(6).fill(0);
            const monthlyProjects = Array(6).fill(0);

            proposalsList.forEach((proposal) => {
              if (proposal.acceptedAt) {
                const acceptedDate = proposal.acceptedAt.toDate();
                const monthDiff = currentMonth - acceptedDate.getMonth();
                if (monthDiff >= 0 && monthDiff < 6) {
                  monthlyEarnings[monthDiff] += parseFloat(proposal.bid) || 0;
                  monthlyProjects[monthDiff]++;
                }
              }
            });

            setChartData({
              labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
              datasets: [
                {
                  label: "Earnings",
                  data: monthlyEarnings,
                  borderColor: "rgb(75, 192, 192)",
                  tension: 0.1,
                },
                {
                  label: "Projects Completed",
                  data: monthlyProjects,
                  borderColor: "rgb(255, 99, 132)",
                  tension: 0.1,
                },
              ],
            });
          });

          return () => {
            console.log("Cleaning up accepted proposals listener");
            unsubscribe();
          };
        } else {
          console.log("No freelancer profile found, redirecting to registration");
          router.push("/freelancer-registration");
          return;
        }
      } catch (error) {
        console.error("Error in fetchFreelancerData:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user?.uid) {
      console.log("Starting data fetch for user:", user.uid);
      fetchFreelancerData();
    } else {
      console.log("Waiting for auth to complete or user to be available");
    }
  }, [authLoading, user, router]);

  const handleAvailabilityToggle = async () => {
    if (!user?.uid) return;

    const newAvailability =
      availability === "available" ? "unavailable" : "available";
    try {
      const docRef = doc(db, "freelancer_profiles", user.uid);
      await updateDoc(docRef, {
        availability: newAvailability,
        lastUpdated: new Date().toISOString(),
      });
      setAvailability(newAvailability);
      toast.success(`You are now ${newAvailability}`);
    } catch (error) {
      console.error("Error updating availability:", error);
      console.warn("Failed to update availability");
    }
  };

  const handleSettingsChange = async (setting, value) => {
    try {
      const docRef = doc(db, "freelancer_profiles", user.uid);
      await updateDoc(docRef, {
        [`settings.${setting}`]: value,
        lastUpdated: new Date().toISOString(),
      });
      setSettings((prev) => ({
        ...prev,
        [setting]: value,
      }));
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
      console.warn("Failed to update settings");
    }
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-10 bg-white rounded-xl shadow-xl">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if profile data is available before rendering
  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-10 bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="text-center">
            <FaExclamationCircle className="mx-auto h-16 w-16 text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Profile Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              Please complete your freelancer profile to access the dashboard.
            </p>
            <button
              onClick={() => router.push("/freelancer-registration")}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              Complete Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleDeleteProposal = async (proposalId) => {
    if (confirm("Are you sure you want to delete this proposal?")) {
      try {
        await deleteDoc(doc(db, "proposals", proposalId));
        toast.success("Proposal deleted successfully");
        setAcceptedProposals(
          acceptedProposals.filter((proposal) => proposal.id !== proposalId)
        );
      } catch (error) {
        console.error("Error deleting proposal:", error);
        console.warn("Failed to delete proposal");
      }
    }
  };

  const handleEditProfile = () => {
    router.push("/edit-freelancer-profile");
  };

  const handleViewProposal = (proposalId) => {
    router.push(`/proposals/${proposalId}`);
  };

  const handleEditProposal = (proposalId) => {
    router.push(`/proposals/edit/${proposalId}`);
  };

  const handleBrowseProjects = () => {
    router.push("/projects");
  };

  return (
    <>
      <Head>
        <title>Dashboard | Student Freelance Platform</title>
      </Head>

      <div className=" min-h-screen bg-gray-50 pb-12">
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
                    {profileData?.professionalTitle || "Professional Title"}
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
                  onClick={() => router.push("/messages")}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600"
                >
                  <FaEnvelope className="mr-2" />
                  Messages
                </button>
                <button
                  onClick={() => router.push("/explore")}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600"
                >
                  <FaSearch className="mr-2" />
                  Find Projects
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
                      <span className="text-gray-600">Active Projects</span>
                      <span className="font-semibold">
                        {stats.activeProjects}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Completed Projects</span>
                      <span className="font-semibold">
                        {stats.completedProjects}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Earnings</span>
                      <span className="font-semibold">
                        ${stats.totalEarnings.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Pending Payments</span>
                      <span className="font-semibold">
                        ${stats.pendingPayments.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Client Rating</span>
                      <span className="font-semibold">
                        {stats.averageRating.toFixed(1)}/5.0
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Availability
                  </h2>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <button
                      onClick={handleAvailabilityToggle}
                      className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700"
                    >
                      {availability === "available" ? (
                        <>
                          <FaToggleOn className="text-2xl" />
                          <span>Available</span>
                        </>
                      ) : (
                        <>
                          <FaToggleOff className="text-2xl" />
                          <span>Unavailable</span>
                        </>
                      )}
                    </button>
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
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                          Earnings & Projects Overview
                        </h2>
                        <div className="h-80">
                          <Line data={chartData} options={chartOptions} />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                          Recent Activity
                        </h2>
                        <div className="space-y-4">
                          {acceptedProposals.map((proposal) => (
                            <div
                              key={proposal.id}
                              className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <FaBriefcase className="text-indigo-600" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  Project "{proposal.projectTitle}" was accepted
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(proposal.acceptedAt.toDate()).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                          {acceptedProposals.length === 0 && (
                            <p className="text-gray-500 text-center py-4">
                              No recent activity
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "projects" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Active Projects
                        </h2>
                        <button
                          onClick={() => router.push("/projects")}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <FaSearch className="mr-2" />
                          Find Projects
                        </button>
                      </div>
                      <div className="space-y-4">
                        {acceptedProposals.map((proposal) => (
                          <div
                            key={proposal.id}
                            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                  {proposal.projectTitle}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  Client: {proposal.clientName}
                                </p>
                              </div>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                {proposal.status}
                              </span>
                            </div>
                            <div className="mt-4">
                              <p className="text-gray-600">
                                {proposal.projectDescription}
                              </p>
                              <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <FaMoneyBillWave className="mr-1" />$
                                    {proposal.bid}
                                  </div>
                                  <div className="flex items-center">
                                    <FaRegCalendarAlt className="mr-1" />
                                    {new Date(proposal.acceptedAt.toDate()).toLocaleDateString()}
                                  </div>
                                </div>
                                <button
                                  onClick={() => router.push(`/projects/${proposal.projectId}`)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <FaEye className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {acceptedProposals.length === 0 && (
                          <div className="text-center py-8">
                            <FaInbox className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No active projects</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              You don&apos;t have any active projects at the moment.
                            </p>
                            <div className="mt-6">
                              <button
                                onClick={() => router.push("/projects")}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                              >
                                <FaSearch className="mr-2" />
                                Find Projects
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "proposals" && (
                    <div className="space-y-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Recent Proposals
                      </h2>
                      <div className="space-y-4">
                        {[1, 2, 3].map((proposal) => (
                          <div
                            key={proposal}
                            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                  Proposal for Project {proposal}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  Submitted: Dec 15, 2023 • Budget: $500
                                </p>
                              </div>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            </div>
                            <p className="mt-4 text-gray-600">
                              Lorem ipsum dolor sit amet, consectetur adipiscing
                              elit. Sed do eiusmod tempor incididunt ut labore
                              et dolore magna aliqua.
                            </p>
                          </div>
                        ))}
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
                          <label className="block text-sm font-medium text-gray-700">
                            Email Notifications
                          </label>
                          <div className="mt-2">
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-indigo-600"
                                checked={settings.emailNotifications}
                                onChange={(e) =>
                                  handleSettingsChange(
                                    "emailNotifications",
                                    e.target.checked
                                  )
                                }
                              />
                              <span className="ml-2 text-gray-700">
                                Receive email notifications
                              </span>
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Profile Visibility
                          </label>
                          <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            value={settings.profileVisibility}
                            onChange={(e) =>
                              handleSettingsChange(
                                "profileVisibility",
                                e.target.value
                              )
                            }
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="friends">Friends Only</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Language
                          </label>
                          <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            value={settings.language}
                            onChange={(e) =>
                              handleSettingsChange("language", e.target.value)
                            }
                          >
                            <option value="english">English</option>
                            <option value="spanish">Spanish</option>
                            <option value="french">French</option>
                          </select>
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
