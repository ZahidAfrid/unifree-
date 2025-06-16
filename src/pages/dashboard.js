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
  FaFile,
  FaDownload,
  FaFilePdf,
  FaFileImage,
  FaFileWord,
  FaFileExcel,
} from "react-icons/fa";
import {
  FiAward,
  FiCheckCircle,
  FiMessageCircle,
  FiUser,
  FiArrowRight,
  FiZap,
  FiTrendingUp,
  FiDollarSign,
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
  serverTimestamp,
} from "firebase/firestore";
import Head from "next/head";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  RadialBarChart,
  RadialBar,
} from "recharts";
import ProjectTimeline from "@/components/ProjectTimeline";
import ReviewSystem from "@/components/ReviewSystem";
import DocumentUpload from "@/components/DocumentUpload";
import { sendProjectDeliveredNotification, sendProjectHandoverNotification } from "@/utils/notifications";
import NotificationCenter from "@/components/NotificationCenter";
import ProjectHistory from "@/components/ProjectHistory";
import ProjectHandoverModal from "@/components/ProjectHandoverModal";
import NotificationDetailModal from "@/components/NotificationDetailModal";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  getBlob
} from 'firebase/storage';
import { storage } from '@/firebase/firebase.config';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading, getDashboardRoute } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [acceptedProposals, setAcceptedProposals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    totalEarnings: 0,
    pendingPayments: 0,
    averageRating: 0,
  });
  const [availability, setAvailability] = useState(true);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    profileVisibility: "public",
    language: "english",
  });

  // Modern chart data with better structure
  const [earningsData, setEarningsData] = useState([
    { month: "Jan", earnings: 0, projects: 0 },
    { month: "Feb", earnings: 0, projects: 0 },
    { month: "Mar", earnings: 0, projects: 0 },
    { month: "Apr", earnings: 0, projects: 0 },
    { month: "May", earnings: 0, projects: 0 },
    { month: "Jun", earnings: 0, projects: 0 },
  ]);

  const [skillsData, setSkillsData] = useState([]);

  const [performanceData, setPerformanceData] = useState([
    { name: "Completion Rate", value: 95, fill: "#8884d8" },
    { name: "Client Satisfaction", value: 88, fill: "#82ca9d" },
    { name: "On-Time Delivery", value: 92, fill: "#ffc658" },
  ]);

  // Modal states
  const [handoverModal, setHandoverModal] = useState({
    isOpen: false,
    project: null,
    clientName: ''
  });
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    notification: null
  });

  // Add notifications state
  const [notifications, setNotifications] = useState([]);

  // Add documents state
  const [projectDocuments, setProjectDocuments] = useState({});

  // Add getFileIcon function
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FaFilePdf className="text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FaFileImage className="text-green-500" />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FaFileExcel className="text-green-600" />;
      default:
        return <FaFile className="text-gray-500" />;
    }
  };

  // Add formatFileSize function
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Add function to fetch documents for all projects
  const fetchAllProjectDocuments = async () => {
    if (!acceptedProposals.length) return;

    try {
      const documentsByProject = {};
      
      for (const proposal of acceptedProposals) {
        const documentsQuery = query(
          collection(db, 'project_documents'),
          where('projectId', '==', proposal.projectId)
        );
        const documentsSnapshot = await getDocs(documentsQuery);
        const documents = documentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        documentsByProject[proposal.projectId] = {
          documents,
          projectTitle: proposal.projectTitle,
          clientName: proposal.clientName
        };
      }
      
      setProjectDocuments(documentsByProject);
    } catch (error) {
      console.error('Error fetching project documents:', error);
      toast.error('Failed to load project documents');
    }
  };

  // Add useEffect to fetch documents when proposals change
  useEffect(() => {
    if (acceptedProposals.length > 0) {
      fetchAllProjectDocuments();
    }
  }, [acceptedProposals]);

  // Add notifications state
  useEffect(() => {
    if (!user?.uid) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      where('recipientType', '==', 'freelancer'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(newNotifications);
    }, (error) => {
      console.error('Error fetching notifications:', error);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Add notification click handler
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await updateDoc(doc(db, 'notifications', notification.id), {
          read: true,
          readAt: new Date()
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    setNotificationModal({
      isOpen: true,
      notification
    });
  };

  // Add manual refresh function for debugging
  const handleManualRefresh = async () => {
    console.log("🔄 Manual refresh triggered");
    console.log("Current user:", user);
    console.log("Auth loading:", authLoading);
    console.log("Profile data:", profileData);
    
    if (!user?.uid) {
      console.log("❌ No user UID available for manual refresh");
      toast.error("No user logged in");
      return;
    }

    try {
      setLoading(true);
      console.log("🔍 Manual refresh: Checking accepted proposals...");
      
      // Try simple query first
      const simpleQuery = query(
        collection(db, "accepted_proposals"),
        where("freelancerId", "==", user.uid)
      );
      
      const snapshot = await getDocs(simpleQuery);
      console.log("Manual refresh result:", snapshot.size, "proposals found");
      
      if (!snapshot.empty) {
        snapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`${index + 1}. ${data.projectTitle || 'Untitled'} - Status: ${data.status}`);
        });
      } else {
        console.log("❌ No proposals found in manual refresh");
        
        // Check if any proposals exist at all
        const allProposalsSnapshot = await getDocs(collection(db, "accepted_proposals"));
        console.log("Total proposals in database:", allProposalsSnapshot.size);
      }
      
      toast.success(`Manual refresh complete. Found ${snapshot.size} proposals.`);
    } catch (error) {
      console.error("❌ Manual refresh failed:", error);
      toast.error("Manual refresh failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Custom colors for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

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

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Fetch freelancer data and accepted proposals
  useEffect(() => {
    // Handle URL query parameters for tab navigation
    if (router.query.tab) {
      setActiveTab(router.query.tab);
    }
  }, [router.query.tab]);

  // Check user type and redirect if necessary
  useEffect(() => {
    if (!authLoading && user?.uid) {
      console.log("🔍 Checking user type for dashboard access:", user.userType);
      
      // Add a small delay to ensure user data is fully loaded
      const checkUserType = setTimeout(() => {
        // If user is a client, redirect to client dashboard
        if (user.userType === "client") {
          console.log("👤 User is a client, redirecting to client dashboard");
          router.push("/client-dashboard");
          return;
        }
        
        // If user has no type set, redirect to user type selection
        if (!user.userType) {
          console.log("❓ User has no type set, redirecting to user type selection");
          router.push("/select-user-type");
          return;
        }
        
        // If user is not a freelancer, redirect to appropriate route
        if (user.userType !== "freelancer") {
          console.log("⚠️ User type is not freelancer:", user.userType);
          getDashboardRoute().then((correctRoute) => {
            console.log("🔄 Redirecting to correct route:", correctRoute);
            router.push(correctRoute);
          });
          return;
        }
        
        console.log("✅ User is a freelancer, proceeding with freelancer dashboard");
      }, 100); // Small delay to ensure user data is loaded

      return () => clearTimeout(checkUserType);
    }
  }, [authLoading, user?.uid, user?.userType, router, getDashboardRoute]);

  useEffect(() => {
    console.log("🔄 useEffect triggered with:", {
      authLoading,
      userUid: user?.uid,
      userEmail: user?.email,
      userType: user?.userType,
      profileData: !!profileData
    });

    const fetchFreelancerData = async () => {
      if (!user?.uid) {
        console.log("❌ No user UID available, user object:", user);
        return;
      }

      try {
        setLoading(true);
        console.log("🚀 Starting to fetch freelancer data for user:", user.uid);
        console.log("📊 User details:", {
          uid: user.uid,
          email: user.email,
          userType: user.userType,
          displayName: user.displayName
        });

        // Fetch profile data
        console.log("📄 Fetching freelancer profile...");
        const freelancerProfileDoc = await getDoc(
          doc(db, "freelancer_profiles", user.uid)
        );

        console.log("📄 Profile document exists:", freelancerProfileDoc.exists());
        
        if (freelancerProfileDoc.exists()) {
          const data = freelancerProfileDoc.data();
          console.log("✅ Freelancer profile data loaded:", {
            fullName: data.fullName,
            skills: data.skills?.length || 0,
            isAvailable: data.isAvailable
          });
          setProfileData(data);
          setAvailability(data.isAvailable !== undefined ? data.isAvailable : true);

          // Set up real-time listener for reviews
          console.log("📝 Setting up real-time reviews listener...");
          const reviewsQuery = query(
            collection(db, "reviews"),
            where("reviewedId", "==", user.uid),
            where("reviewedRole", "==", "freelancer")
          );
          
          const reviewsUnsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
            console.log("📨 Reviews snapshot received:");
            console.log("  - Size:", snapshot.size, "documents");
            console.log("  - From cache:", snapshot.metadata.fromCache);
            
            const reviewsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            })).sort((a, b) => {
              // Sort by createdAt in descending order (newest first)
              const aTime = a.createdAt?.seconds || 0;
              const bTime = b.createdAt?.seconds || 0;
              return bTime - aTime;
            });
            
            console.log("📝 Reviews updated:", reviewsList.length);
          setReviews(reviewsList);
          }, (error) => {
            console.error("❌ Error in reviews listener:", error);
          });

          // Set up real-time listener for accepted proposals
          console.log("🔍 Setting up accepted proposals query for user:", user.uid);
          console.log("📊 Query details:");
          console.log("  - Collection: accepted_proposals");
          console.log("  - Where: freelancerId ==", user.uid);
          console.log("  - OrderBy: acceptedAt desc");

          try {
            // First try with orderBy
            let proposalsQuery = query(
              collection(db, "accepted_proposals"),
              where("freelancerId", "==", user.uid),
              orderBy("acceptedAt", "desc")
            );

            console.log("📡 Setting up real-time listener with orderBy...");
            const unsubscribe = onSnapshot(proposalsQuery, async (snapshot) => {
              console.log("📨 Accepted proposals snapshot received:");
              console.log("  - Size:", snapshot.size, "documents");
              console.log("  - Empty:", snapshot.empty);
              console.log("  - Metadata:", snapshot.metadata);
              console.log("  - From cache:", snapshot.metadata.fromCache);
              console.log("  - Has pending writes:", snapshot.metadata.hasPendingWrites);
              
              if (snapshot.empty) {
                console.log("❌ No accepted proposals found for user:", user.uid);
                console.log("🔍 Debugging suggestions:");
                console.log("  1. Check if proposals were accepted by client");
                console.log("  2. Verify freelancerId field in accepted_proposals collection");
                console.log("  3. Check Firestore rules for read access");
                console.log("  4. Verify acceptedAt field exists for orderBy");
                
                // Let's try a manual query without orderBy to see if that works
                console.log("🧪 Trying manual query without orderBy...");
                try {
                  const manualQuery = query(
                    collection(db, "accepted_proposals"),
                    where("freelancerId", "==", user.uid)
                  );
                  const manualSnapshot = await getDocs(manualQuery);
                  console.log("Manual query result:", manualSnapshot.size, "documents");
                  
                  if (!manualSnapshot.empty) {
                    console.log("✅ Manual query found proposals! The issue might be with orderBy or real-time listener");
                    manualSnapshot.docs.forEach((doc, index) => {
                      const data = doc.data();
                      console.log(`  ${index + 1}. ${data.projectTitle || 'Untitled'} - $${data.bid} - ${data.status}`);
                    });
                  } else {
                    console.log("❌ Manual query also found no proposals");
                    
                    // Let's check if there are any accepted proposals at all
                    console.log("🔍 Checking if any accepted proposals exist...");
                    const allProposalsSnapshot = await getDocs(collection(db, "accepted_proposals"));
                    console.log("Total accepted proposals in collection:", allProposalsSnapshot.size);
                    
                    if (!allProposalsSnapshot.empty) {
                      console.log("Sample accepted proposals:");
                      allProposalsSnapshot.docs.slice(0, 3).forEach((doc, index) => {
                        const data = doc.data();
                        console.log(`  ${index + 1}. FreelancerId: ${data.freelancerId}, ProjectTitle: ${data.projectTitle}`);
                      });
                    }
                  }
                } catch (manualError) {
                  console.error("❌ Manual query failed:", manualError);
                }
                
                setAcceptedProposals([]);
                setStats({
                  activeProjects: 0,
                  completedProjects: 0,
                  totalEarnings: 0,
                  pendingPayments: 0,
                  averageRating: data.averageRating || 0,
                });
                return;
              }
              
              console.log("✅ Processing", snapshot.size, "accepted proposals...");
              
              const proposalsList = await Promise.all(
                snapshot.docs.map(async (proposalDoc, index) => {
                  const proposalData = proposalDoc.data();
                  console.log(`📄 Processing proposal ${index + 1}/${snapshot.size}:`);
                  console.log("  - ID:", proposalDoc.id);
                  console.log("  - FreelancerId:", proposalData.freelancerId);
                  console.log("  - ProjectId:", proposalData.projectId);
                  console.log("  - ProjectTitle:", proposalData.projectTitle);
                  console.log("  - Status:", proposalData.status);
                  console.log("  - AcceptedAt:", proposalData.acceptedAt);
                  console.log("  - Bid:", proposalData.bid);
                  
                  // Get the associated project for each proposal
                  let projectData = null;
                  if (proposalData.projectId) {
                    console.log("  🔍 Fetching project data for:", proposalData.projectId);
                    try {
                      const projectDoc = await getDoc(
                        doc(db, "projects", proposalData.projectId)
                      );
                      if (projectDoc.exists()) {
                        projectData = projectDoc.data();
                        console.log("  ✅ Project data found:", projectData.title);
                      } else {
                        console.log("  ❌ Project not found for ID:", proposalData.projectId);
                      }
                    } catch (projectError) {
                      console.error("  ❌ Error fetching project:", projectError);
                    }
                  } else {
                    console.log("  ⚠️ No projectId in proposal data");
                  }

                  return {
                    id: proposalDoc.id,
                    ...proposalData,
                    project: projectData,
                  };
                })
              );

              console.log("📋 Final accepted proposals list:");
              console.log("  - Count:", proposalsList.length);
              proposalsList.forEach((proposal, index) => {
                console.log(`  ${index + 1}. ${proposal.projectTitle || 'Untitled'} - $${proposal.bid} - ${proposal.status}`);
              });
              
              setAcceptedProposals(proposalsList);

              // Calculate stats
              const totalEarnings = proposalsList.reduce((sum, p) => {
                return sum + (parseFloat(p.bid) || 0);
              }, 0);

              const completedProjects = proposalsList.filter(p => p.status === 'completed').length;
              const activeProjects = proposalsList.filter(p => 
                p.status === 'accepted' || p.status === 'delivered' || p.status === 'handover'
              ).length;

              console.log("📊 Calculated stats:", {
                activeProjects,
                completedProjects,
                totalEarnings
              });

              setStats({
                activeProjects,
                completedProjects,
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
                  try {
                    const acceptedDate = proposal.acceptedAt.toDate();
                    const monthDiff = currentMonth - acceptedDate.getMonth();
                    if (monthDiff >= 0 && monthDiff < 6) {
                      monthlyEarnings[5 - monthDiff] += parseFloat(proposal.bid) || 0;
                      monthlyProjects[5 - monthDiff]++;
                    }
                  } catch (dateError) {
                    console.error("Error processing accepted date:", dateError);
                  }
                }
              });

              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const last6Months = [];
              for (let i = 5; i >= 0; i--) {
                const monthIndex = (currentMonth - i + 12) % 12;
                last6Months.push({
                  month: monthNames[monthIndex],
                  earnings: monthlyEarnings[5 - i],
                  projects: monthlyProjects[5 - i]
                });
              }

              setEarningsData(last6Months);

              // Update skills data based on freelancer's actual skills
              if (data.skills && data.skills.length > 0) {
                const skillsChartData = data.skills.slice(0, 5).map((skill, index) => ({
                  skill: skill,
                  projects: proposalsList.filter(p => 
                    p.projectSkills && p.projectSkills.includes(skill)
                  ).length || 1, // Default to 1 if no projects found
                  fill: COLORS[index % COLORS.length]
                }));
                setSkillsData(skillsChartData);
              }

              // Calculate real performance data
              const totalProjects = proposalsList.length;
              const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
              
              // Calculate average rating from reviews
              const avgRating = reviews.length > 0 
                ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 20 
                : 85; // Default value

              setPerformanceData([
                { name: "Completion Rate", value: Math.round(completionRate), fill: "#8884d8" },
                { name: "Client Satisfaction", value: Math.round(avgRating), fill: "#82ca9d" },
                { name: "On-Time Delivery", value: 92, fill: "#ffc658" }, // This could be calculated based on delivery dates
              ]);
            }, (error) => {
              console.error("❌ Error in accepted proposals listener:", error);
              console.error("Error code:", error.code);
              console.error("Error message:", error.message);
              
              if (error.code === 'failed-precondition') {
                console.log("🔄 Index missing, trying fallback query without orderBy...");
                
                // Fallback to query without orderBy
                const fallbackQuery = query(
                  collection(db, "accepted_proposals"),
                  where("freelancerId", "==", user.uid)
                );
                
                const fallbackUnsubscribe = onSnapshot(fallbackQuery, async (fallbackSnapshot) => {
                  console.log("📨 Fallback query snapshot received:", fallbackSnapshot.size, "documents");
                  
                  if (!fallbackSnapshot.empty) {
                    // Process the data the same way but without ordering
                    const proposalsList = await Promise.all(
                      fallbackSnapshot.docs.map(async (proposalDoc) => {
                        const proposalData = proposalDoc.data();
                        
                        // Get the associated project for each proposal
                        let projectData = null;
                        if (proposalData.projectId) {
                          try {
                            const projectDoc = await getDoc(
                              doc(db, "projects", proposalData.projectId)
                            );
                            if (projectDoc.exists()) {
                              projectData = projectDoc.data();
                            }
                          } catch (projectError) {
                            console.error("Error fetching project:", projectError);
                          }
                        }

                        return {
                          id: proposalDoc.id,
                          ...proposalData,
                          project: projectData,
                        };
                      })
                    );

                    // Sort manually by acceptedAt
                    proposalsList.sort((a, b) => {
                      if (!a.acceptedAt || !b.acceptedAt) return 0;
                      return b.acceptedAt.toDate() - a.acceptedAt.toDate();
                    });
                    
                    setAcceptedProposals(proposalsList);
                    
                    // Calculate stats
                    const totalEarnings = proposalsList.reduce((sum, p) => {
                      return sum + (parseFloat(p.bid) || 0);
                    }, 0);

                    const completedProjects = proposalsList.filter(p => p.status === 'completed').length;
                    const activeProjects = proposalsList.filter(p => 
                      p.status === 'accepted' || p.status === 'delivered' || p.status === 'handover'
                    ).length;

                    setStats({
                      activeProjects,
                      completedProjects,
                      totalEarnings,
                      pendingPayments: totalEarnings,
                      averageRating: data.averageRating || 0,
                    });
                    
                    toast.success("Data loaded successfully (fallback mode)");
                  } else {
                    setAcceptedProposals([]);
                    setStats({
                      activeProjects: 0,
                      completedProjects: 0,
                      totalEarnings: 0,
                      pendingPayments: 0,
                      averageRating: data.averageRating || 0,
                    });
                  }
                }, (fallbackError) => {
                  console.error("❌ Fallback query also failed:", fallbackError);
                  toast.error("Failed to load data even with fallback query");
                });
                
                return () => {
                  console.log("🧹 Cleaning up fallback proposals listener");
                  fallbackUnsubscribe();
                  console.log("🧹 Cleaning up reviews listener");
                  reviewsUnsubscribe();
                };
              } else if (error.code === 'permission-denied') {
                console.error("Permission denied - check Firestore rules");
                toast.error("Permission denied. Please check your access rights.");
              } else {
                toast.error("Failed to load accepted proposals: " + error.message);
              }
            });

            // Return cleanup function that handles both listeners
            return () => {
              console.log("🧹 Cleaning up proposals listener");
              unsubscribe();
              console.log("🧹 Cleaning up reviews listener");
              reviewsUnsubscribe();
            };
          } catch (queryError) {
            console.error("❌ Error setting up proposals query:", queryError);
            toast.error("Failed to set up data listener: " + queryError.message);
            return null;
          }
        } else {
          console.log("❌ No freelancer profile found, redirecting to registration");
          router.push("/freelancer-registration");
          return;
        }
      } catch (error) {
        console.error("❌ Error in fetchFreelancerData:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        toast.error("Failed to load dashboard data: " + error.message);
      } finally {
        setLoading(false);
      }
    };

        if (!authLoading && user?.uid && user?.userType === "freelancer") {
      console.log("✅ Starting freelancer data fetch for user:", user.uid);
      const cleanup = fetchFreelancerData();
      
      // Return cleanup function for useEffect
      return () => {
        if (cleanup && typeof cleanup === 'function') {
          console.log("🧹 Cleaning up accepted proposals listener");
          cleanup();
        }
      };
    } else {
      console.log("⏳ Waiting for auth to complete or user to be available", {
        authLoading,
        hasUser: !!user,
        userUid: user?.uid,
        userType: user?.userType
      });
    }
  }, [authLoading, user?.uid, user?.userType, router]);

  // Recalculate stats when proposals or reviews change
  useEffect(() => {
    if (acceptedProposals.length >= 0) { // Allow for 0 proposals
      console.log("📊 Recalculating stats...");
      console.log("  - Proposals:", acceptedProposals.length);
      console.log("  - Reviews:", reviews.length);
      
      // Calculate project stats
      const totalEarnings = acceptedProposals.reduce((sum, p) => {
        return sum + (parseFloat(p.bid) || 0);
      }, 0);

      const completedProjects = acceptedProposals.filter(p => p.status === 'completed').length;
      const activeProjects = acceptedProposals.filter(p => 
        p.status === 'accepted' || p.status === 'delivered' || p.status === 'handover'
      ).length;

      // Calculate average rating from reviews
      let averageRating = 0;
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + (review.overall || review.rating || 0), 0);
        averageRating = parseFloat((totalRating / reviews.length).toFixed(1));
      }

      const newStats = {
        activeProjects,
        completedProjects,
        totalEarnings,
        pendingPayments: totalEarnings,
        averageRating
      };

      console.log("📊 New stats calculated:", newStats);
      setStats(newStats);
    }
  }, [acceptedProposals, reviews]);

  const handleAvailabilityToggle = async () => {
    if (!user?.uid) return;

    const newAvailability = !availability;
    try {
      const docRef = doc(db, "freelancer_profiles", user.uid);
      await updateDoc(docRef, {
        isAvailable: newAvailability,
        lastUpdated: new Date().toISOString(),
      });
      setAvailability(newAvailability);
      toast.success(`You are now ${newAvailability ? "Available" : "Unavailable"}`);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-10 bg-white rounded-xl shadow-xl">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if profile data is available before rendering
  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-10 bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="text-center">
            <FaExclamationCircle className="mx-auto h-16 w-16 text-indigo-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Profile Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              Please complete your freelancer profile to access the dashboard.
            </p>
            <button
              onClick={() => router.push("/freelancer-registration")}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 shadow-md font-semibold"
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
    // Get freelancer's skills for filtering
    const freelancerSkills = profileData?.skills || [];
    const primarySkill = freelancerSkills.length > 0 ? freelancerSkills[0] : '';
    
    // Navigate to explore page with projects tab and skill filter
    const queryParams = new URLSearchParams({
      tab: 'projects',
      ...(primarySkill && { skill: primarySkill })
    });
    
    router.push(`/explore?${queryParams.toString()}`);
  };

  const handleMarkAsDelivered = async (proposalId, projectId) => {
    if (confirm("Are you sure you want to mark this project as delivered?")) {
      try {
        // Update the accepted proposal status
        await updateDoc(doc(db, "accepted_proposals", proposalId), {
          status: "delivered",
          deliveredAt: serverTimestamp(),
        });

        // Update the project status to pending review
        await updateDoc(doc(db, "projects", projectId), {
          status: "pending-review",
          updatedAt: serverTimestamp(),
        });

        toast.success("Project marked as delivered! Waiting for client approval.");
        
        // Update local state
        setAcceptedProposals(prevProposals => 
          prevProposals.map(p => 
            p.id === proposalId ? { ...p, status: "delivered" } : p
          )
        );

        // Send project delivered notification
        const proposal = acceptedProposals.find(p => p.id === proposalId);
        if (proposal) {
          await sendProjectDeliveredNotification(
            projectId,
            proposal.projectTitle || 'Your Project',
            proposal.clientId,
            profileData?.fullName || 'Freelancer'
          );
        }
      } catch (error) {
        console.error("Error marking project as delivered:", error);
        toast.error("Failed to mark project as delivered. Please try again.");
      }
    }
  };

  const handleProjectHandover = async (proposalId, projectId) => {
    const proposal = acceptedProposals.find(p => p.id === proposalId);
    if (!proposal) return;

    setHandoverModal({
      isOpen: true,
      project: {
        id: projectId,
        title: proposal.projectTitle,
        budget: proposal.bid,
        createdAt: proposal.acceptedAt
      },
      clientName: proposal.clientName
    });
  };

  const handleProjectHandoverSubmit = async ({ message, documents, projectId }) => {
    try {
      const proposal = acceptedProposals.find(p => p.projectId === projectId);
      if (!proposal) throw new Error('Proposal not found');

      // Update the accepted proposal status
      await updateDoc(doc(db, "accepted_proposals", proposal.id), {
        status: "handover",
        handoverMessage: message,
        handoverDocuments: documents,
        handoverAt: serverTimestamp(),
      });

      toast.success("Project handover initiated successfully!");
      
      // Update local state
      setAcceptedProposals(prevProposals => 
        prevProposals.map(p => 
          p.id === proposal.id ? { 
            ...p, 
            status: "handover", 
            handoverMessage: message,
            handoverDocuments: documents
          } : p
        )
      );

      // Send enhanced project handover notification
      await sendProjectHandoverNotification(
        projectId,
        proposal.projectTitle || 'Your Project',
        proposal.clientId,
        profileData?.fullName || 'Freelancer',
        message,
        documents
      );
    } catch (error) {
      console.error("Error initiating project handover:", error);
      toast.error("Failed to initiate project handover. Please try again.");
      throw error;
    }
  };

  // Update download handler function
  const handleDownload = (fileDoc) => {
  try {
    // This automatically opens the link and lets the browser handle download
    const link = document.createElement('a');
    link.href = fileDoc.downloadURL; // must include the token (as yours already does)
    link.setAttribute('download', fileDoc.fileName);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');

    // Append to body, click, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Download started!");
  } catch (error) {
    console.error("❌ Error downloading file:", error);
    toast.error("Download failed");
  }
};


  return (
    <>
      <Head>
        <title>Dashboard | Student Freelance Platform</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pb-12">
        {/* Header */}
        <div className="relative overflow-hidden pt-20 pb-8 md:pt-32 md:pb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500"></div>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center md:flex-row md:items-center md:justify-between md:text-left">
              <div className="flex flex-col items-center md:flex-row md:items-center md:space-x-4">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white p-1 shadow-lg mb-3 md:mb-0">
                  <img
                    src={profileData?.profileImage || "/default-avatar.png"}
                    alt="Profile"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow-md mb-1">
                    {profileData?.fullName || "Your Name"}
                  </h1>
                  <p className="text-sm md:text-base text-white/90 font-medium drop-shadow-sm">
                    {profileData?.professionalTitle || "Professional Title"}
                  </p>
                </div>
              </div>
              <div className="mt-6 md:mt-0 w-full md:w-auto">
                <div className="flex justify-center md:justify-end mb-3 md:mb-0">
                  <NotificationCenter userType="freelancer" />
                </div>
                <div className="grid grid-cols-4 gap-2 max-w-xs sm:max-w-sm md:max-w-none mx-auto">
                  <button
                    onClick={handleEditProfile}
                    className="inline-flex items-center justify-center px-2 sm:px-3 md:px-4 py-2 sm:py-3 border border-transparent text-xs sm:text-sm font-semibold rounded-lg text-indigo-700 bg-white hover:bg-indigo-50 shadow-lg transition-all duration-200"
                  >
                    <FaEdit className="text-sm sm:mr-1 md:mr-2" />
                    <span className="hidden sm:inline ml-1">Edit Profile</span>
                    <span className="sm:hidden sr-only">Edit</span>
                  </button>
                  <button
                    onClick={() => router.push("/messages")}
                    className="inline-flex items-center justify-center px-2 sm:px-3 md:px-4 py-2 sm:py-3 border border-white/20 text-xs sm:text-sm font-semibold rounded-lg text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200"
                  >
                    <FaEnvelope className="text-sm sm:mr-1 md:mr-2" />
                    <span className="hidden sm:inline ml-1">Messages</span>
                    <span className="sm:hidden sr-only">Msg</span>
                  </button>
                  <button
                    onClick={() => router.push("/explore")}
                    className="inline-flex items-center justify-center px-2 sm:px-3 md:px-4 py-2 sm:py-3 border border-white/20 text-xs sm:text-sm font-semibold rounded-lg text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200"
                  >
                    <FaSearch className="text-sm sm:mr-1 md:mr-2" />
                    <span className="hidden sm:inline ml-1">Find Projects</span>
                    <span className="sm:hidden sr-only">Find</span>
                  </button>
                  <button
                    onClick={handleManualRefresh}
                    className="inline-flex items-center justify-center px-2 sm:px-3 md:px-4 py-2 sm:py-3 border border-white/20 text-xs sm:text-sm font-semibold rounded-lg text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200"
                    disabled={loading}
                  >
                    <FaRegClock className="text-sm sm:mr-1 md:mr-2" />
                    <span className="hidden sm:inline ml-1">{loading ? "Refreshing..." : "Refresh"}</span>
                    <span className="sm:hidden sr-only">{loading ? "..." : "Refresh"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-white/20">
                <div className="p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <FiTrendingUp className="mr-2 text-indigo-600 text-sm sm:text-base" />
                    Quick Stats
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                      <span className="text-xs sm:text-sm text-gray-700 font-medium mb-1 lg:mb-0">Active Projects</span>
                      <span className="font-bold text-indigo-600 text-lg sm:text-xl">
                        {stats.activeProjects}
                      </span>
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <span className="text-xs sm:text-sm text-gray-700 font-medium mb-1 lg:mb-0">Completed</span>
                      <span className="font-bold text-green-600 text-lg sm:text-xl">
                        {stats.completedProjects}
                      </span>
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                      <span className="text-xs sm:text-sm text-gray-700 font-medium mb-1 lg:mb-0">Total Earnings</span>
                      <span className="font-bold text-orange-600 text-base sm:text-lg">
                        ${stats.totalEarnings.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <span className="text-xs sm:text-sm text-gray-700 font-medium mb-1 lg:mb-0">Pending</span>
                      <span className="font-bold text-purple-600 text-base sm:text-lg">
                        ${stats.pendingPayments.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg col-span-2 lg:col-span-1">
                      <span className="text-xs sm:text-sm text-gray-700 font-medium mb-1 lg:mb-0">Client Rating</span>
                      <span className="font-bold text-blue-600 text-base sm:text-lg flex items-center">
                        <FaStar className="mr-1 text-yellow-400 text-sm" />
                        {stats.averageRating.toFixed(1)}/5.0
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 lg:mt-6 bg-white rounded-xl shadow-lg overflow-hidden border border-white/20">
                <div className="p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <FiZap className="mr-2 text-green-600 text-sm sm:text-base" />
                    Availability
                  </h2>
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base text-gray-700 font-medium">Status</span>
                    <button
                      onClick={handleAvailabilityToggle}
                      className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      {availability ? (
                        <>
                          <FaToggleOn className="text-xl sm:text-2xl text-green-500" />
                          <span className="font-semibold text-green-600 text-sm sm:text-base">Available</span>
                        </>
                      ) : (
                        <>
                          <FaToggleOff className="text-xl sm:text-2xl text-gray-400" />
                          <span className="font-semibold text-gray-500 text-sm sm:text-base">Unavailable</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              {/* Tabs */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4 lg:mb-8 border border-white/20">
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px overflow-x-auto scrollbar-hide px-1 sm:px-0">
                    {["overview", "projects", "proposals", "reviews", "history", "settings", "documents"].map(
                      (tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`${
                            activeTab === tab
                              ? "border-indigo-500 text-indigo-600 bg-indigo-50"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                          } whitespace-nowrap py-3 px-2 sm:px-4 md:px-6 border-b-2 font-semibold text-xs sm:text-sm capitalize transition-all duration-200 flex-shrink-0 min-w-0`}
                        >
                          {tab === "settings" ? (
                            <span className="flex items-center justify-center">
                              <FaCog className="text-sm sm:mr-1 md:mr-2" />
                              <span className="hidden sm:inline ml-1">{tab}</span>
                            </span>
                          ) : (
                            <span className="text-center">
                              <span className="sm:hidden text-xs">
                                {tab === "overview" ? "Home" : 
                                 tab === "projects" ? "Projects" :
                                 tab === "proposals" ? "Proposals" :
                                 tab === "reviews" ? "Reviews" :
                                 tab === "history" ? "History" :
                                 tab === "documents" ? "Docs" : tab}
                              </span>
                              <span className="hidden sm:inline">{tab}</span>
                            </span>
                          )}
                        </button>
                      )
                    )}
                  </nav>
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-white/20">
                <div className="p-4 sm:p-6">
                  {activeTab === "overview" && (
                    <div className="space-y-8">
                      {/* Modern Charts Grid */}
                      <div className="grid grid-cols-1 gap-4 sm:gap-6">
                        {/* Earnings Trend Chart */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-indigo-100"
                        >
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                            <FiDollarSign className="mr-2 text-indigo-600 text-sm sm:text-base" />
                            Earnings Trend
                          </h3>
                          <div className="h-48 sm:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={earningsData}>
                                <defs>
                                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                                <XAxis dataKey="month" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                  type="monotone"
                                  dataKey="earnings"
                                  stroke="#8884d8"
                                  fillOpacity={1}
                                  fill="url(#colorEarnings)"
                                  strokeWidth={3}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </motion.div>

                        {/* Projects Completion Chart */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-green-100"
                        >
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                            <FaBriefcase className="mr-2 text-green-600 text-sm sm:text-base" />
                            Monthly Projects
                          </h3>
                          <div className="h-48 sm:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={earningsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                                <XAxis dataKey="month" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="projects" fill="#10b981" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </motion.div>

                        {/* Skills Distribution */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100"
                        >
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <FaCode className="mr-2 text-orange-600" />
                            Skills Distribution
                          </h3>
                          <div className="h-48 sm:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={skillsData}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  dataKey="projects"
                                  label={({ skill, percent }) => `${skill} ${(percent * 100).toFixed(0)}%`}
                                >
                                  {skillsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </motion.div>

                        {/* Performance Metrics */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100"
                        >
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <FaTrophy className="mr-2 text-purple-600" />
                            Performance Metrics
                          </h3>
                          <div className="h-48 sm:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={performanceData}>
                                <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                              </RadialBarChart>
                            </ResponsiveContainer>
                          </div>
                        </motion.div>
                      </div>

                      {/* Recent Activity */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100"
                      >
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <FaBell className="mr-2 text-blue-600" />
                          Recent Activity
                        </h2>
                        <div className="space-y-4">
                          {acceptedProposals.map((proposal) => (
                            <div
                              key={proposal.id}
                              className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm border border-blue-100"
                            >
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                                  <FaBriefcase className="text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">
                                  Project {proposal.projectTitle} was accepted
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(proposal.acceptedAt.toDate()).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                          {acceptedProposals.length === 0 && (
                            <p className="text-gray-500 text-center py-4 font-medium">
                              No recent activity
                            </p>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {activeTab === "projects" && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                          Active Projects
                        </h2>
                        <div className="flex">
                          <button
                            onClick={() => router.push("/projects")}
                            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:shadow-lg transition-all duration-200 w-full sm:w-auto"
                          >
                            <FaSearch className="mr-2 text-sm" />
                            Find Projects
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {acceptedProposals.map((proposal) => (
                          <div
                            key={proposal.id}
                            className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-white to-gray-50"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {proposal.projectTitle}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 font-medium">
                                  Client: {proposal.clientName}
                                </p>
                              </div>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                                {proposal.status}
                              </span>
                            </div>
                            <div className="mt-4">
                              <p className="text-gray-600 font-medium">
                                {proposal.projectDescription}
                              </p>
                              <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center bg-green-50 px-3 py-1 rounded-lg">
                                    <FaMoneyBillWave className="mr-1 text-green-600" />
                                    <span className="font-semibold">${proposal.bid}</span>
                                  </div>
                                  <div className="flex items-center bg-blue-50 px-3 py-1 rounded-lg">
                                    <FaRegCalendarAlt className="mr-1 text-blue-600" />
                                    <span className="font-medium">{new Date(proposal.acceptedAt.toDate()).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                  {proposal.status === "accepted" && (
                                    <button
                                      onClick={() => handleMarkAsDelivered(proposal.id, proposal.projectId)}
                                      className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs sm:text-sm font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-md w-full sm:w-auto"
                                    >
                                      <FaCheckCircle className="mr-1 sm:mr-2 text-xs sm:text-sm" />
                                      <span className="hidden sm:inline">Mark as Delivered</span>
                                      <span className="sm:hidden">Delivered</span>
                                    </button>
                                  )}
                                  {(proposal.status === "accepted" || proposal.status === "delivered") && (
                                    <button
                                      onClick={() => handleProjectHandover(proposal.id, proposal.projectId)}
                                      className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs sm:text-sm font-semibold rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-all duration-200 shadow-md w-full sm:w-auto"
                                    >
                                      <FaHandshake className="mr-1 sm:mr-2 text-xs sm:text-sm" />
                                      <span className="hidden sm:inline">Handover Project</span>
                                      <span className="sm:hidden">Handover</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => router.push(`/projects/${proposal.projectId}`)}
                                    className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all duration-200 w-full sm:w-auto"
                                  >
                                    <FaEye className="mr-1 sm:mr-2 text-xs sm:text-sm" />
                                    View
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {acceptedProposals.length === 0 && (
                          <div className="text-center py-12 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                            <FaInbox className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-semibold text-gray-900">No active projects</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              You don&apos;t have any active projects at the moment.
                            </p>
                            <div className="mt-6">
                              <button
                                onClick={() => router.push("/projects")}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:shadow-lg transition-all duration-200"
                              >
                                <FaSearch className="mr-2" />
                                Find Projects
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Project Timeline for Active Projects */}
                      {acceptedProposals.length > 0 && (
                        <div className="mt-8">
                          <ProjectTimeline 
                            projectId={acceptedProposals[0]?.projectId} 
                            userRole="freelancer"
                            projectData={acceptedProposals[0]}
                          />
                        </div>
                      )}

                      {/* Documents Section */}
                      {acceptedProposals.length > 0 && (
                        <div className="mt-8">
                          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                  <FaFile className="mr-2 text-indigo-500" />
                                  Project Documents
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  Upload and manage project documents
                                </p>
                              </div>
                            </div>

                            {/* Document Upload Component */}
                          <DocumentUpload
                            projectId={acceptedProposals[0]?.projectId}
                            userRole="freelancer"
                            onDocumentUploaded={(documentData) => {
                              console.log('Document uploaded:', documentData);
                              toast.success('Document uploaded successfully!');
                            }}
                              projectData={acceptedProposals[0]}
                          />
                          </div>
                        </div>
                      )}

                      {/* Review System for Completed Projects */}
                      {acceptedProposals.length > 0 && acceptedProposals[0]?.status === 'completed' && (
                        <div className="mt-8">
                          <ReviewSystem
                            projectId={acceptedProposals[0]?.projectId}
                            targetUserId={acceptedProposals[0]?.clientId}
                            targetUserType="client"
                            onReviewSubmitted={(reviewData) => {
                              console.log('Review submitted:', reviewData);
                              toast.success('Thank you for your review!');
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "proposals" && (
                    <div className="space-y-4 sm:space-y-6">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        Recent Proposals
                      </h2>
                      <div className="space-y-4">
                        {[1, 2, 3].map((proposal) => (
                          <div
                            key={proposal}
                            className="border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-white to-gray-50"
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                              <div className="flex-1">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                  Proposal for Project {proposal}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
                                  Submitted: Dec 15, 2023 • Budget: $500
                                </p>
                              </div>
                              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200 self-start">
                                Pending
                              </span>
                            </div>
                            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 font-medium">
                              Lorem ipsum dolor sit amet, consectetur adipiscing
                              elit. Sed do eiusmod tempor incididunt ut labore
                              et dolore magna aliqua.
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "reviews" && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                              <FaStar className="mr-2 text-yellow-400 text-sm sm:text-base" />
                              Client Reviews
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                              Reviews and ratings from your clients
                            </p>
                          </div>
                          {reviews.length > 0 && (
                            <div className="text-right">
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center">
                                  {(() => {
                                    const avgRating = reviews.length > 0 
                                      ? reviews.reduce((sum, review) => sum + (review.overall || review.rating || 0), 0) / reviews.length 
                                      : 0;
                                    const stars = [];
                                    const fullStars = Math.floor(avgRating);
                                    const hasHalfStar = avgRating % 1 !== 0;

                                    for (let i = 0; i < fullStars; i++) {
                                      stars.push(<FaStar key={i} className="text-yellow-400" />);
                                    }
                                    if (hasHalfStar) {
                                      stars.push(<FaStar key="half" className="text-yellow-400 opacity-50" />);
                                    }
                                    const emptyStars = 5 - Math.ceil(avgRating);
                                    for (let i = 0; i < emptyStars; i++) {
                                      stars.push(<FaStar key={`empty-${i}`} className="text-gray-300" />);
                                    }
                                    return stars;
                                  })()}
                                </div>
                                <span className="text-lg font-bold text-gray-900">
                                  {reviews.length > 0 
                                    ? (reviews.reduce((sum, review) => sum + (review.overall || review.rating || 0), 0) / reviews.length).toFixed(1)
                                    : '0.0'
                                  }
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">
                                {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          )}
                        </div>

                        {reviews.length > 0 ? (
                          <div className="space-y-4">
                            {reviews.map((review) => (
                            <div
                              key={review.id}
                                className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                            >
                                <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-semibold text-gray-900">
                                      {review.reviewerName || 'Client'}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      Project: {review.projectId}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                                  </p>
                                </div>
                                  <div className="text-right">
                                    <div className="flex items-center space-x-1 mb-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FaStar
                                      key={star}
                                          className={`w-4 h-4 ${star <= (review.overall || review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                                    <span className="text-sm font-medium text-gray-700">
                                      {review.overall || review.rating || 0}/5
                                    </span>
                              </div>
                                </div>

                                {(review.quality || review.communication || review.timeliness) && (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    {review.quality && (
                                      <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Quality</p>
                                        <div className="flex items-center justify-center space-x-1">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <FaStar
                                              key={star}
                                              className={`w-3 h-3 ${star <= review.quality ? 'text-yellow-400' : 'text-gray-300'}`}
                                            />
                                          ))}
                                        </div>
                                        <span className="text-xs text-gray-600">{review.quality}/5</span>
                                      </div>
                                    )}
                                    {review.communication && (
                                      <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Communication</p>
                                        <div className="flex items-center justify-center space-x-1">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <FaStar
                                              key={star}
                                              className={`w-3 h-3 ${star <= review.communication ? 'text-yellow-400' : 'text-gray-300'}`}
                                            />
                                          ))}
                                        </div>
                                        <span className="text-xs text-gray-600">{review.communication}/5</span>
                                      </div>
                                    )}
                                    {review.timeliness && (
                                      <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Timeliness</p>
                                        <div className="flex items-center justify-center space-x-1">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <FaStar
                                              key={star}
                                              className={`w-3 h-3 ${star <= review.timeliness ? 'text-yellow-400' : 'text-gray-300'}`}
                                            />
                                          ))}
                                        </div>
                                        <span className="text-xs text-gray-600">{review.timeliness}/5</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {review.comment && (
                                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <p className="text-gray-700 italic">&quot;{review.comment}&quot;</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <FaStar className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Complete projects to start receiving reviews from clients.
                              </p>
                            </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "history" && (
                    <ProjectHistory userType="freelancer" />
                  )}

                  {activeTab === "settings" && (
                    <div className="space-y-4 sm:space-y-6">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                        Account Settings
                      </h2>
                      <div className="space-y-4 sm:space-y-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-100">
                          <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-3">
                            Email Notifications
                          </label>
                          <div className="mt-2">
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                                checked={settings.emailNotifications}
                                onChange={(e) =>
                                  handleSettingsChange(
                                    "emailNotifications",
                                    e.target.checked
                                  )
                                }
                              />
                              <span className="ml-3 text-xs sm:text-sm text-gray-700 font-medium">
                                Receive email notifications
                              </span>
                            </label>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-green-100">
                          <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-3">
                            Profile Visibility
                          </label>
                          <select
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-medium text-xs sm:text-sm py-2 sm:py-3"
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
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 border border-purple-100">
                          <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-3">
                            Language
                          </label>
                          <select
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-medium text-xs sm:text-sm py-2 sm:py-3"
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

                  {activeTab === "documents" && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                              <FaFile className="mr-2 text-indigo-500" />
                              Project Documents
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              View and manage documents from all your projects
                            </p>
                </div>
              </div>

                        {Object.entries(projectDocuments).map(([projectId, projectData]) => (
                          <div key={projectId} className="mb-8 last:mb-0">
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {projectData.projectTitle}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Client: {projectData.clientName}
                              </p>
            </div>

                            {projectData.documents.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {projectData.documents.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center space-x-3">
                                        {getFileIcon(doc.fileName)}
                                        <div>
                                          <p className="font-medium text-gray-900">{doc.fileName}</p>
                                          <p className="text-sm text-gray-500">
                                            {formatFileSize(doc.fileSize)}
                                          </p>
                                          <p className="text-xs text-gray-400 mt-1">
                                            Uploaded by: {doc.uploaderName}
                                          </p>
                                          <p className="text-xs text-gray-400">
                                            {new Date(doc.uploadedAt?.seconds * 1000).toLocaleDateString()}
                                          </p>
          </div>
        </div>
                                      <div className="flex space-x-2">
                                        <a
                                          href={doc.downloadURL}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                          title="View"
                                        >
                                          <FaEye />
                                        </a>
                                        <button
                                          onClick={() => handleDownload(doc)}
                                          className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded-lg transition-colors"
                                          title="Download"
                                        >
                                          <FaDownload />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <FaFile className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                  No documents have been shared for this project yet.
                                </p>
                              </div>
                            )}
                          </div>
                        ))}

                        {Object.keys(projectDocuments).length === 0 && (
                          <div className="text-center py-12">
                            <FaFile className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              You don&apos;t have any active projects with documents.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Handover Modal */}
      {handoverModal.isOpen && (
        <ProjectHandoverModal
          isOpen={handoverModal.isOpen}
          onClose={() => setHandoverModal({ isOpen: false, project: null, clientName: '' })}
          onSubmit={handleProjectHandoverSubmit}
          project={handoverModal.project}
          clientName={handoverModal.clientName}
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

      {/* Notification Center */}
      <NotificationCenter
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        userType="freelancer"
      />
    </>
  );
}
