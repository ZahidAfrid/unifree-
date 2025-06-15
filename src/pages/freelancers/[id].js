// pages/freelancers/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { db } from "@/firebase/firebase.config";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import Head from "next/head";
import {
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaDollarSign,
  FaUniversity,
  FaBriefcase,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaLink,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaHandshake,
  FaClock,
  FaUsers,
} from "react-icons/fa";
import { HiOutlineDocumentText } from "react-icons/hi";
import {
  FiAward,
  FiCheckCircle,
  FiMessageCircle,
  FiUser,
  FiArrowRight,
  FiZap,
} from "react-icons/fi";
import {
  FaCode,
  FaPaintBrush,
  FaCamera,
  FaVideo,
  FaMusic,
  FaPen,
} from "react-icons/fa";
import LoadingSpinner from "@/components/LoadingSpinner"; // ✅ no curly braces
import MessageFreelancerButton from "@/components/MessageFreelancerButton";

export default function FreelancerDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [freelancer, setFreelancer] = useState(null);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchFreelancerData = async () => {
      if (!id) return;
      setLoading(true);

      try {
        // Fetch freelancer profile
        const docRef = doc(db, "freelancer_profiles", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          console.error("Freelancer not found");
          router.push("/explore");
          return;
        }

        const freelancerData = {
          id: docSnap.id,
          ...docSnap.data(),
        };

        // Fetch user data to get additional info
        try {
          const userDocRef = doc(db, "users", id);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.email) freelancerData.email = userData.email;
            if (userData.fullName) freelancerData.fullName = userData.fullName;
            if (userData.photoURL) freelancerData.avatarUrl = userData.photoURL;
          }
        } catch (err) {
          console.warn("No user data found for freelancer:", err.message);
        }

        setFreelancer(freelancerData);

        // Debug logging
        console.log("Freelancer data loaded:", freelancerData);
        console.log("Skills from freelancer data:", freelancerData.skills);
        console.log("Availability status:", freelancerData.isAvailable);
        console.log("Work availability:", freelancerData.availability);

        // Skills are stored directly in the freelancer profile, not in a separate collection
        // Convert skills array to the expected format for the UI
        const skillsData = (freelancerData.skills || []).map((skill, index) => ({
          id: `skill-${index}`,
          name: skill,
          skillName: skill, // For backward compatibility
        }));
        console.log("Processed skills data:", skillsData);
        setSkills(skillsData);

        // Fetch reviews for this freelancer
        const reviewsQuery = query(
          collection(db, "reviews"),
          where("reviewedId", "==", id),
          where("reviewedRole", "==", "freelancer")
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReviews(reviewsData);

        console.log("Reviews fetched:", reviewsData);

        // Fetch completed projects
        const projectsQuery = query(
          collection(db, "projects"),
          where("freelancerId", "==", id),
          where("status", "==", "completed")
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching freelancer data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFreelancerData();
    }
  }, [id, router]);

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />);
      }
    }

    return (
      <div className="flex">
        {stars}
        <span className="ml-1 text-gray-600">{rating || "No ratings yet"}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Freelancer not found
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{`${
          freelancer.fullName || "Freelancer"
        } | Student Freelance Platform`}</title>
        <meta
          name="description"
          content={`${freelancer.professionalTitle || "Freelancer"} profile - ${
            freelancer.bio?.substring(0, 100) || ""
          }`}
        />
      </Head>

      <div className="bg-gray-50 min-h-screen pb-12">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 text-white relative overflow-hidden pt-32">
          {/* Adding background pattern for better aesthetics */}
          <div className="absolute inset-0 opacity-10 bg-[url('/images/pattern.svg')]"></div>
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
            <div className="lg:flex items-center justify-between">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative h-28 w-28 md:h-36 md:w-36 overflow-hidden rounded-full border-4 border-white shadow-lg flex-shrink-0"
                >
                  <Image
                    src={
                      freelancer.avatarUrl ||
                      freelancer.profileImage ||
                      "https://via.placeholder.com/300?text=No+Image"
                    }
                    alt={freelancer.fullName || "Freelancer"}
                    fill
                    sizes="(max-width: 768px) 112px, 144px"
                    className="object-cover"
                    priority
                  />
                </motion.div>
                <div className="text-center sm:text-left">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-2 ${
                      freelancer.isAvailable !== false
                        ? "bg-green-800 bg-opacity-50 text-white" 
                        : "bg-red-800 bg-opacity-50 text-white"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      freelancer.isAvailable !== false ? "bg-green-400" : "bg-red-400"
                    }`}></span>
                    {freelancer.isAvailable !== false ? "Available for work" : "Currently unavailable"}
                  </motion.div>
                  <motion.h1
                    className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-100"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    {freelancer.fullName}
                  </motion.h1>
                  <motion.p
                    className="text-xl text-indigo-100 mt-1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    {freelancer.professionalTitle ||
                      freelancer.title ||
                      "Freelance Professional"}
                  </motion.p>
                  <motion.div
                    className="flex items-center justify-center sm:justify-start mt-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    {renderStars(freelancer.rating)}
                  </motion.div>
                </div>
              </div>
              <motion.div
                className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <MessageFreelancerButton 
                  freelancerId={freelancer.id}
                  freelancerName={freelancer.fullName}
                  className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-6 py-3 rounded-lg shadow-md flex items-center justify-center transition-all hover:scale-105"
                />
                <Link 
                  href="/projects"
                  className="btn bg-gradient-to-r from-indigo-800 to-purple-800 hover:from-indigo-900 hover:to-purple-900 text-white font-semibold px-6 py-3 rounded-lg shadow-md flex items-center justify-center transition-all hover:scale-105"
                >
                  <FaHandshake className="mr-2" /> View Projects
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar - Stats and Contact Info */}
            <div className="lg:w-1/3 space-y-6">
              {/* Quick Stats */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <FiAward className="text-indigo-500 mr-2" />
                  Quick Stats
                </h3>
                <div className="space-y-6">
                  <motion.div
                    className="flex items-center"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-600 rounded-full shadow-sm mr-4">
                      <FaDollarSign size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">
                        ${freelancer.hourlyRate || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500">Hourly Rate</p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    className="flex items-center"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 text-green-600 rounded-full shadow-sm mr-4">
                      <FaUniversity size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg line-clamp-1">
                        {freelancer.education || freelancer.university || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500">University</p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    className="flex items-center"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 rounded-full shadow-sm mr-4">
                      <FiCheckCircle size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">
                        {projects.length || 0}
                      </p>
                      <p className="text-sm text-gray-500">Completed Projects</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Contact Info Card */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FiMessageCircle className="text-indigo-500 mr-2" />
                  Contact Information
                </h3>
                <ul className="space-y-4">
                  {freelancer.email && (
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                        <FaEnvelope />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-500">Email</p>
                        <a
                          href={`mailto:${freelancer.email}`}
                          className="text-gray-900 hover:text-indigo-600 transition-colors break-all"
                        >
                          {freelancer.email}
                        </a>
                      </div>
                    </li>
                  )}
                  {freelancer.location && (
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                        <FaMapMarkerAlt />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="text-gray-900">{freelancer.location}</p>
                      </div>
                    </li>
                  )}
                  {freelancer.website && (
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                        <FaGlobe />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-500">Website</p>
                        <a
                          href={freelancer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 transition-colors break-all"
                        >
                          {freelancer.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    </li>
                  )}
                </ul>
                <div className="mt-6">
                  <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-sm flex items-center justify-center">
                    <FiMessageCircle className="mr-2" /> Contact Freelancer
                  </button>
                </div>
              </motion.div>

              {/* Availability Card */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FaClock className="text-green-500 mr-2" />
                  Availability
                </h3>
                <div className="p-4 bg-green-50 rounded-lg mb-4">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        freelancer.isAvailable !== false ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <p className="text-gray-700 font-medium">
                      {freelancer.isAvailable !== false
                        ? "Available for work"
                        : "Currently unavailable"}
                    </p>
                  </div>
                  {freelancer.isAvailable !== false && (
                    <p className="text-gray-600 text-sm mt-2">
                      Status: Available for work
                      {freelancer.availability && (
                        <span className="block mt-1">
                          Work preference: {freelancer.availability.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Response Time</span>
                    <span className="font-medium text-gray-900">
                      {freelancer.responseTime || "Within 24 hours"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">
                      Acceptance Rate
                    </span>
                    <span className="font-medium text-gray-900">
                      {freelancer.acceptanceRate || "New freelancer"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Last Active</span>
                    <span className="font-medium text-gray-900">
                      {freelancer.lastActive ? 
                        new Date(freelancer.lastActive.seconds * 1000).toLocaleDateString() : 
                        "Recently"
                      }
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Similar Freelancers */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FaUsers className="text-purple-500 mr-2" />
                  Similar Freelancers
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Discover more freelancers with similar skills
                </p>
                <Link
                  href="/explore"
                  className="block text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Explore More Freelancers
                </Link>
              </motion.div>
            </div>

            {/* Right Column - Main Content */}
            <div className="lg:w-2/3">
              {/* Tabs */}
              <div className="bg-white rounded-t-xl shadow-md border-b">
                <div className="flex flex-wrap space-x-2 sm:space-x-4 px-4 sm:px-6 overflow-x-auto">
                  {[
                    {
                      id: "overview",
                      label: "Overview",
                      icon: <FiCheckCircle className="mr-1 sm:mr-2" />,
                    },
                    {
                      id: "reviews",
                      label: "Reviews",
                      icon: <FaStar className="mr-1 sm:mr-2" />,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      className={`py-3 sm:py-4 px-2 sm:px-3 font-medium border-b-2 transition-colors flex items-center text-sm sm:text-base whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-indigo-600 text-indigo-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-b-xl shadow-md p-6">
                {activeTab === "overview" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full mr-2">
                          <FiUser className="w-4 h-4" />
                        </span>
                        About Me
                      </h2>
                      <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                        <p className="text-gray-700 whitespace-pre-line">
                          {freelancer.bio || "No biography provided."}
                        </p>
                      </div>
                    </div>

                    {/* Skills Section */}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full mr-2">
                          <FiAward className="w-4 h-4" />
                        </span>
                        Skills & Expertise
                      </h2>
                      <div className="bg-gray-50 rounded-lg p-4 sm:p-5 border border-gray-100">
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {skills && skills.length > 0 ? (
                            skills.map((skill) => (
                              <div key={skill.id} className="relative group">
                                <span className="px-3 sm:px-4 py-2 bg-white border border-indigo-100 text-indigo-700 rounded-full text-sm font-medium shadow-sm group-hover:shadow-md transition-all flex items-center">
                                  {getSkillIcon(skill.name || skill.skillName)}
                                  <span className="truncate max-w-[120px] sm:max-w-none">
                                    {skill.name || skill.skillName}
                                  </span>
                                  {skill.level && (
                                    <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs hidden sm:inline">
                                      {skill.level}
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="w-full text-center py-8">
                              <div className="text-gray-400 mb-3">
                                <FiAward className="mx-auto h-12 w-12" />
                              </div>
                              <p className="text-gray-500 font-medium">No skills added yet</p>
                              <p className="text-gray-400 text-sm mt-1">
                                This freelancer hasn&apos;t added their skills to their profile yet.
                              </p>
                              {freelancer.professionalTitle && (
                                <div className="mt-4">
                                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                                    {freelancer.professionalTitle}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Education */}
                    {freelancer.education && (
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                          <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mr-2">
                            <FaUniversity className="w-4 h-4" />
                          </span>
                          Education
                        </h2>
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                              <FaUniversity className="text-xl" />
                            </div>
                            <div className="ml-4">
                              <h4 className="text-lg font-medium text-gray-900">
                                {freelancer.education || freelancer.university}
                              </h4>
                              {freelancer.department && (
                                <p className="text-gray-600 mt-1">
                                  {freelancer.department}
                                </p>
                              )}
                              {freelancer.graduationYear && (
                                <div className="flex items-center text-gray-500 text-sm mt-2">
                                  <FaCalendarAlt className="mr-1" />
                                  Expected graduation:{" "}
                                  {freelancer.graduationYear}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Languages (if available) */}
                    {freelancer.languages &&
                      freelancer.languages.length > 0 && (
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full mr-2">
                              <FaGlobe className="w-4 h-4" />
                            </span>
                            Languages
                          </h2>
                          <div className="bg-gray-50 p-4 sm:p-5 rounded-lg border border-gray-100">
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                              {freelancer.languages.map((language, index) => (
                                <span
                                  key={index}
                                  className="px-3 sm:px-4 py-2 bg-white border border-purple-100 text-gray-700 rounded-full text-sm font-medium"
                                >
                                  <span className="truncate max-w-[100px] sm:max-w-none">
                                    {language.name}
                                  </span>
                                  {language.level && (
                                    <span className="ml-1 text-xs text-purple-700 hidden sm:inline">
                                      {" "}
                                      - {language.level}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                  </motion.div>
                )}

                {activeTab === "reviews" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <span className="w-8 h-8 flex items-center justify-center bg-yellow-100 text-yellow-600 rounded-full mr-2">
                          <FaStar className="w-4 h-4" />
                        </span>
                        Reviews
                      </h2>
                      <div className="flex items-center bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-1.5 rounded-full">
                        <div className="flex mr-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              className={`w-4 h-4 ${
                                freelancer.rating &&
                                star <= Math.round(freelancer.rating)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {freelancer.rating || "Not rated"}
                        </span>
                      </div>
                    </div>

                    {/* Reviews section */}
                    <div className="space-y-6">
                      {reviews.length > 0 ? (
                        reviews.map((review) => (
                          <div key={review.id} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                  {review.reviewerName ? review.reviewerName.substring(0, 2).toUpperCase() : 'CL'}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {review.reviewerName || 'Client'}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center space-x-1 mb-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FaStar
                                      key={star}
                                      className={`w-4 h-4 ${star <= (review.overall || review.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                  {review.overall || review.rating}/5
                                </span>
                              </div>
                            </div>

                            {/* Detailed ratings */}
                            {(review.quality || review.communication || review.timeliness) && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
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

                            {/* Review comment */}
                            {review.comment && (
                              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <p className="text-gray-700 italic">
                                  &quot;{review.comment}&quot;
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
                          <FaStar className="mx-auto h-16 w-16 text-gray-300" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900">
                            No reviews yet
                          </h3>
                          <p className="mt-2 text-gray-500 max-w-md mx-auto">
                            This freelancer hasn&apos;t received any reviews yet.
                            Be the first to work with them and leave a review!
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper function to get skill icon
const getSkillIcon = (skill) => {
  if (!skill) return null;

  const skillName = skill.toLowerCase();

  if (
    skillName.includes("web") ||
    skillName.includes("code") ||
    skillName.includes("programming") ||
    skillName.includes("developer")
  ) {
    return <FaCode className="mr-1 sm:mr-2 text-blue-500" />;
  } else if (
    skillName.includes("design") ||
    skillName.includes("ui") ||
    skillName.includes("ux")
  ) {
    return <FaPaintBrush className="mr-1 sm:mr-2 text-pink-500" />;
  } else if (skillName.includes("photo") || skillName.includes("image")) {
    return <FaCamera className="mr-1 sm:mr-2 text-green-500" />;
  } else if (skillName.includes("video") || skillName.includes("film")) {
    return <FaVideo className="mr-1 sm:mr-2 text-red-500" />;
  } else if (skillName.includes("music") || skillName.includes("audio")) {
    return <FaMusic className="mr-1 sm:mr-2 text-yellow-500" />;
  } else if (skillName.includes("write") || skillName.includes("content")) {
    return <FaPen className="mr-1 sm:mr-2 text-indigo-500" />;
  } else {
    return <FiZap className="mr-1 sm:mr-2 text-purple-500" />;
  }
};