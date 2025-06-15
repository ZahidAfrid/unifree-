import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiFilter,
  FiStar,
  FiCalendar,
  FiDollarSign,
  FiUsers,
  FiBriefcase,
} from "react-icons/fi";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import FreelancerCard from "@/components/FreelancerCard";
import ProjectCard from "@/components/ProjectCard";
import FilterDropdown from "@/components/FilterDropdown";
import SkeletonLoader from "@/components/SkeletonLoader";
import { db } from "@/firebase/firebase.config"; // Adjust the import path as necessary
import {
  collection,
  query,
  getDocs,
  orderBy,
  limit,
  where,
  getDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { useRouter } from "next/router";

// Available skills for filtering
const allSkills = [
  "React",
  "Next.js",
  "Tailwind",
  "Flutter",
  "Firebase",
  "UI/UX",
  "Python",
  "Machine Learning",
  "Data Science",
  "Graphic Design",
  "Illustration",
  "Branding",
  "Android",
  "Kotlin",
  "Content Writing",
  "SEO",
  "Social Media",
  "OpenAI",
  "React Native",
  "Supabase",
  "Figma",
  "Web Development",
  "D3.js",
  "Data Analysis",
  "Node.js",
  "MongoDB",
  "Video Streaming",
  "API Integration",
  "Automation",
];

// Available universities for filtering
const universities = [
  "CECOS University",
  "FAST NUCES",
  "NUST",
  "LUMS",
  "GIKI",
  "IBA",
  "All Universities",
];

export default function Explore() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("freelancers");
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [freelancers, setFreelancers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [freelancerReviews, setFreelancerReviews] = useState({});

  // Filter states
  const [skillFilter, setSkillFilter] = useState("");
  const [universityFilter, setUniversityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [budgetFilter, setBudgetFilter] = useState({ min: 0, max: Infinity });
  const [deadlineFilter, setDeadlineFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all"); // New availability filter

  // Function to fetch reviews for all freelancers
  const fetchFreelancerReviews = async () => {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('reviewedRole', '==', 'freelancer')
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      const reviewsByFreelancer = {};
      reviewsSnapshot.docs.forEach(doc => {
        const review = doc.data();
        const freelancerId = review.reviewedId;
        
        if (!reviewsByFreelancer[freelancerId]) {
          reviewsByFreelancer[freelancerId] = [];
        }
        reviewsByFreelancer[freelancerId].push({
          id: doc.id,
          ...review
        });
      });
      
      setFreelancerReviews(reviewsByFreelancer);
    } catch (error) {
      console.error('Error fetching freelancer reviews:', error);
    }
  };

  // Function to calculate average rating for a freelancer
  const calculateFreelancerRating = (freelancerId) => {
    const reviews = freelancerReviews[freelancerId] || [];
    if (reviews.length === 0) return 0;
    
    const totalRating = reviews.reduce((sum, review) => sum + review.overall, 0);
    return (totalRating / reviews.length).toFixed(1);
  };

  // Function to get review count for a freelancer
  const getReviewCount = (freelancerId) => {
    return freelancerReviews[freelancerId]?.length || 0;
  };

  // Helper function to check if user exists in the users collection
  async function userExists(userId) {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      return userDoc.exists();
    } catch (error) {
      console.error("Error checking if user exists:", error);
      return false;
    }
  }

  // Check if multiple users exist (batch check)
  async function filterValidUsers(userIds) {
    const validUsers = new Set();

    for (const userId of userIds) {
      if (await userExists(userId)) {
        validUsers.add(userId);
      }
    }

    return validUsers;
  }

  useEffect(() => {
    const tab = router.query.tab;
    const skill = router.query.skill;
    
    if (tab === "projects" || tab === "freelancers") {
      setActiveTab(tab);
    }
    
    // Set skill filter if provided in URL
    if (skill) {
      setSkillFilter(skill);
    }

    // Fetch reviews when component mounts
    fetchFreelancerReviews();
  }, [router.query.tab, router.query.skill]);

  // Fetch real data from Firebase
  useEffect(() => {
    setLoading(true);
    let isMounted = true;
    let unsubscribe = null;

    const fetchData = async () => {
      try {
        if (activeTab === "freelancers") {
          // Use real-time listener for freelancers
          const freelancersRef = collection(db, "freelancer_profiles");
          
          unsubscribe = onSnapshot(freelancersRef, (snapshot) => {
            const validFreelancers = snapshot.docs.map((doc) => {
              const data = doc.data();
              const freelancerId = doc.id;
              
              return {
                id: freelancerId,
                name: data.fullName || "Unknown",
                university: data.education || "Not specified",
                skills: data.skills || [],
                rating: parseFloat(calculateFreelancerRating(freelancerId)) || 0,
                reviewCount: getReviewCount(freelancerId),
                profileImage: data.profileImage || "/placeholder.jpg",
                title: data.professionalTitle || "",
                hourlyRate: Number(data.hourlyRate) || 0,
                isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
              };
            });

            if (isMounted) {
              setFreelancers(validFreelancers);
              setError(null);
              setDataFetched(true);
              setLoading(false);
            }
          }, (error) => {
            console.error("Error fetching freelancers:", error);
            if (isMounted) {
              setError("Failed to load freelancers. Please try again later.");
              setLoading(false);
            }
          });
        }

        if (activeTab === "projects") {
          const projectsQuery = query(
            collection(db, "projects"),
            orderBy("createdAt", "desc")
          );
          const projectsSnapshot = await getDocs(projectsQuery);

          const validProjects = projectsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title || "Untitled Project",
              description: data.description || "No description provided.",
              skills: data.skills || [],
              budget: data.budget ? `$${data.budget}` : "Budget not specified",
              deadline: data.duration || "Deadline not specified",
              clientName: data.clientName || "Anonymous Client",
              clientId: data.clientId,
              status: data.status || "open",
              createdAt: data.createdAt,
            };
          });

          if (isMounted) {
            setProjects(validProjects);
            setError(null);
            setDataFetched(true);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isMounted) {
          setError("Failed to load data. Please try again later.");
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [activeTab, freelancerReviews]);

  // Filter freelancers
  const filteredFreelancers = freelancers.filter((freelancer) => {
    const matchesSkill = skillFilter
      ? freelancer.skills.some((skill) =>
          skill.toLowerCase().includes(skillFilter.toLowerCase())
        )
      : true;
    const matchesUniversity =
      universityFilter && universityFilter !== "All Universities"
        ? freelancer.university
            ?.toLowerCase()
            .includes(universityFilter.toLowerCase())
        : true;

    const matchesSearch = searchQuery
      ? freelancer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        freelancer.title?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesAvailability = 
      availabilityFilter === "all" ? true :
      availabilityFilter === "available" ? freelancer.isAvailable !== false :
      availabilityFilter === "unavailable" ? freelancer.isAvailable === false :
      true;

    return matchesSkill && matchesUniversity && matchesSearch && matchesAvailability;
  });

  // Filter projects - update to handle real project data
  const filteredProjects = projects.filter((project) => {
    const matchesSkill = skillFilter
      ? project.skills.includes(skillFilter)
      : true;

    // Handle budget filtering safely
    const projectBudget =
      typeof project.budget === "string"
        ? parseInt(project.budget.replace(/\D/g, "")) || 0
        : typeof project.budget === "number"
        ? project.budget
        : 0;

    const matchesBudget =
      projectBudget >= budgetFilter.min && projectBudget <= budgetFilter.max;

    // Handle deadline filtering
    const matchesDeadline = deadlineFilter
      ? typeof project.deadline === "string" &&
        project.deadline <= deadlineFilter
      : true;

    // Handle search filtering
    const matchesSearch = searchQuery
      ? project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesSkill && matchesBudget && matchesDeadline && matchesSearch;
  });

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />);
      }
    }

    return stars;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto mt-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 drop-shadow-sm">
            Explore Opportunities
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-700 font-medium">
            Connect with talented freelancers or discover exciting projects
          </p>
        </motion.div>

        {/* Tabs - Mobile Friendly */}
        <div className="mb-8">
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="block w-full rounded-lg border-indigo-300 bg-white text-indigo-700 py-3 pl-4 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm shadow-lg font-medium"
            >
              <option value="freelancers">Freelancers</option>
              <option value="projects">Projects</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <div className="flex justify-center">
              <span className="relative z-0 inline-flex shadow-xl rounded-xl overflow-hidden backdrop-blur-sm">
                <button
                  onClick={() => setActiveTab("freelancers")}
                  className={`relative inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 rounded-l-xl border text-sm font-semibold transition-all duration-300 ${
                    activeTab === "freelancers"
                      ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white border-indigo-600 shadow-lg"
                      : "border-gray-300 bg-white/80 text-gray-700 hover:bg-white hover:shadow-md backdrop-blur-sm"
                  }`}
                >
                  <FiUsers className="mr-2 h-5 w-5" />
                  Freelancers
                </button>
                <button
                  onClick={() => setActiveTab("projects")}
                  className={`relative inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 rounded-r-xl border text-sm font-semibold -ml-px transition-all duration-300 ${
                    activeTab === "projects"
                      ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white border-indigo-600 shadow-lg"
                      : "border-gray-300 bg-white/80 text-gray-700 hover:bg-white hover:shadow-md backdrop-blur-sm"
                  }`}
                >
                  <FiBriefcase className="mr-2 h-5 w-5" />
                  Projects
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* Filters - Mobile Responsive */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-xl"></div>
          <div className="absolute inset-0 bg-black/20 rounded-xl"></div>
          <div className="relative bg-transparent rounded-xl shadow-xl p-4 sm:p-6 text-white backdrop-blur-sm">
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-grow max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-indigo-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search for talent or projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-white/20 rounded-lg leading-5 bg-white/90 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-white sm:text-sm text-gray-900 transition-all duration-200 shadow-lg backdrop-blur-sm font-medium"
                />
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                {activeTab === "freelancers" ? (
                  <>
                    <div className="w-full sm:w-auto">
                      <select
                        value={availabilityFilter}
                        onChange={(e) => setAvailabilityFilter(e.target.value)}
                        className="block w-full px-4 py-3 text-base border border-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:border-white sm:text-sm rounded-lg bg-white/90 text-gray-900 transition-all duration-200 shadow-lg backdrop-blur-sm font-medium"
                      >
                        <option value="all">All Freelancers</option>
                        <option value="available">Available Only</option>
                        <option value="unavailable">Unavailable Only</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full sm:w-auto">
                      <select
                        value={skillFilter}
                        onChange={(e) => setSkillFilter(e.target.value)}
                        className="block w-full px-4 py-3 text-base border border-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:border-white sm:text-sm rounded-lg bg-white/90 text-gray-900 transition-all duration-200 shadow-lg backdrop-blur-sm font-medium"
                      >
                        <option value="">All Skills</option>
                        {allSkills.map((skill) => (
                          <option key={skill} value={skill}>
                            {skill}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full sm:w-auto">
                      <select
                        value={budgetFilter.max}
                        onChange={(e) => {
                          const value =
                            e.target.value === "any"
                              ? Infinity
                              : Number(e.target.value);
                          setBudgetFilter({
                            ...budgetFilter,
                            max: value,
                          });
                        }}
                        className="block w-full px-4 py-3 text-base border border-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:border-white sm:text-sm rounded-lg bg-white/90 text-gray-900 transition-all duration-200 shadow-lg backdrop-blur-sm font-medium"
                      >
                        <option value="any">Any Budget</option>
                        <option value={100}>Under $100</option>
                        <option value={200}>Under $200</option>
                        <option value={500}>Under $500</option>
                      </select>
                    </div>
                    <div className="w-full sm:w-auto">
                      <select
                        value={deadlineFilter}
                        onChange={(e) => setDeadlineFilter(e.target.value)}
                        className="block w-full px-4 py-3 text-base border border-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:border-white sm:text-sm rounded-lg bg-white/90 text-gray-900 transition-all duration-200 shadow-lg backdrop-blur-sm font-medium"
                      >
                        <option value="">Any Deadline</option>
                        <option value="2025-04-30">Before April 30</option>
                        <option value="2025-05-15">Before May 15</option>
                        <option value="2025-05-31">Before May 31</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid - Responsive */}
        <AnimatePresence mode="wait">
          {activeTab === "freelancers" ? (
            <motion.div
              key="freelancers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {!dataFetched ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <SkeletonLoader key={i} type="freelancer" />
                  ))}
                </div>
              ) : loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <SkeletonLoader key={i} type="freelancer" />
                  ))}
                </div>
              ) : filteredFreelancers.length > 0 ? (
                <>
                  {/* Availability Summary */}
                  <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-md border border-white/20">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                          <span className="text-sm font-medium text-gray-700">
                            {filteredFreelancers.filter(f => f.isAvailable !== false).length} Available
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                          <span className="text-sm font-medium text-gray-700">
                            {filteredFreelancers.filter(f => f.isAvailable === false).length} Unavailable
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Total: {filteredFreelancers.length} freelancers
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        <span className="text-xs text-blue-600 font-medium">Live Updates</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 xl:gap-8">
                    {filteredFreelancers.map((freelancer) => (
                      <motion.div
                        key={freelancer.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                        className="transform transition-all duration-200"
                      >
                        <Link
                          href={`/freelancers/${freelancer.id}`}
                          className="block h-full"
                        >
                          <FreelancerCard freelancer={freelancer} />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative text-center py-16 rounded-xl shadow-xl border border-white/20 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"></div>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="relative z-10">
                    <svg
                      className="mx-auto h-16 w-16 text-white/80"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="mt-4 text-lg font-bold text-white drop-shadow-md">
                      No freelancers found
                    </h3>
                    <p className="mt-2 text-sm text-white/90 font-medium drop-shadow-sm">
                      Try adjusting your filters or search criteria
                    </p>
                    <button
                      onClick={() => {
                        setSkillFilter("");
                        setUniversityFilter("");
                        setSearchQuery("");
                      }}
                      className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-lg text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
                    >
                      Clear Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {error && (
                <div className="text-center mb-6 py-4 px-6 bg-red-50 text-red-700 rounded-xl border border-red-200 shadow-lg">
                  {error}
                </div>
              )}

              {!dataFetched ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <SkeletonLoader key={index} type="project" />
                  ))}
                </div>
              ) : loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <SkeletonLoader key={index} type="project" />
                  ))}
                </div>
              ) : filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative text-center py-16 rounded-xl shadow-xl border border-white/20 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"></div>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="relative z-10">
                    <FiBriefcase className="mx-auto h-16 w-16 text-white/80" />
                    <h3 className="mt-4 text-lg font-bold text-white drop-shadow-md">
                      No projects found
                    </h3>
                    <p className="mt-2 text-sm text-white/90 font-medium drop-shadow-sm">
                      Try adjusting your filters or search query.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
