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

  // Filter states
  const [skillFilter, setSkillFilter] = useState("");
  const [universityFilter, setUniversityFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [budgetFilter, setBudgetFilter] = useState({ min: 0, max: Infinity });
  const [deadlineFilter, setDeadlineFilter] = useState("");

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
    if (tab === "projects" || tab === "freelancers") {
      setActiveTab(tab);
    }
  }, [router.query.tab]);

  // Fetch real data from Firebase

  useEffect(() => {
    setLoading(true);
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Fetch all freelancer profiles directly
        const freelancersRef = collection(db, "freelancer_profiles");
        const freelancersSnapshot = await getDocs(freelancersRef);

        const validFreelancers = freelancersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.fullName || "Unnamed Freelancer",
            university: data.education || "University not specified",
            skills: data.skills || [],
            rating: 4.5,
            profileImage: data.profileImage || "/placeholder.jpg",
            title: data.professionalTitle || "",
            hourlyRate: Number(data.hourlyRate) || 0,
            experienceLevel: data.experienceYears || "Beginner",
          };
        });

        if (isMounted) {
          setFreelancers(validFreelancers);
        }

        // Fetch all public projects directly
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
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        if (isMounted) {
          setError("Failed to load content. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setDataFetched(true);
        }
      }
    };

    const timer = setTimeout(fetchData, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

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
    const matchesRating = ratingFilter
      ? freelancer.rating >= ratingFilter
      : true;
    const matchesSearch = searchQuery
      ? freelancer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        freelancer.title?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesSkill && matchesUniversity && matchesRating && matchesSearch;
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
    <div className="min-h-screen bg-white py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto mt-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Explore Opportunities
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-600">
            Connect with talented freelancers or discover exciting projects
          </p>
        </motion.div>

        {/* Tabs - Mobile Friendly */}
        <div className="mb-8">
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="block w-full rounded-lg border-blue-300 bg-white text-blue-700 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm shadow-md"
            >
              <option value="freelancers">👨‍💻 Freelancers</option>
              <option value="projects">🚀 Projects</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <div className="flex justify-center">
              <span className="relative z-0 inline-flex shadow-lg rounded-lg overflow-hidden">
                <button
                  onClick={() => setActiveTab("freelancers")}
                  className={`relative inline-flex items-center px-6 sm:px-8 py-2 sm:py-3 rounded-l-lg border text-sm font-medium transition-all duration-200 ${
                    activeTab === "freelancers"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FiUsers className="mr-2 h-5 w-5" />
                  Freelancers
                </button>
                <button
                  onClick={() => setActiveTab("projects")}
                  className={`relative inline-flex items-center px-6 sm:px-8 py-2 sm:py-3 rounded-r-lg border text-sm font-medium -ml-px transition-all duration-200 ${
                    activeTab === "projects"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
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
        <div className="mb-8 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-xl shadow-xl p-4 sm:p-6 text-white">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-grow max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-blue-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-lg leading-5 bg-white placeholder-blue-300 focus:outline-none focus:placeholder-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 transition-all duration-200 shadow-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              {activeTab === "freelancers" ? (
                <>
                  <div className="w-full sm:w-auto">
                    <FilterDropdown
                      label="Skill"
                      options={allSkills}
                      value={skillFilter}
                      onChange={setSkillFilter}
                      icon={<FiFilter />}
                    />
                  </div>
                  <div className="w-full sm:w-auto">
                    <FilterDropdown
                      label="University"
                      options={universities}
                      value={universityFilter}
                      onChange={setUniversityFilter}
                      icon={<FiFilter />}
                    />
                  </div>
                  <div className="w-full sm:w-auto">
                    <select
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(Number(e.target.value))}
                      className="block w-full pl-10 pr-10 py-2 text-base border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-white text-gray-900 transition-all duration-200 shadow-sm"
                    >
                      <option value={0}>All Ratings</option>
                      <option value={4}>4+ Stars</option>
                      <option value={4.5}>4.5+ Stars</option>
                      <option value={5}>5 Stars</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full sm:w-auto">
                    <FilterDropdown
                      label="Skill"
                      options={allSkills}
                      value={skillFilter}
                      onChange={setSkillFilter}
                      icon={<FiFilter />}
                    />
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
                      className="block w-full pl-10 pr-10 py-2 text-base border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-white text-gray-900 transition-all duration-200 shadow-sm"
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
                      className="block w-full pl-10 pr-10 py-2 text-base border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-white text-gray-900 transition-all duration-200 shadow-sm"
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
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-white rounded-xl shadow-xl border border-blue-100"
                >
                  <svg
                    className="mx-auto h-16 w-16 text-blue-400"
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
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    No freelancers found
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Try adjusting your filters or search criteria
                  </p>
                  <button
                    onClick={() => {
                      setSkillFilter("");
                      setUniversityFilter("");
                      setRatingFilter(0);
                      setSearchQuery("");
                    }}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-md text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear Filters
                  </button>
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
                <div className="text-center mb-6 py-3 px-4 bg-red-50 text-red-700 rounded-lg">
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
                <div className="text-center py-12">
                  <FiBriefcase className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    No projects found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your filters or search query.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
