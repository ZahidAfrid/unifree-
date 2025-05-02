import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import { FiSearch, FiFilter, FiStar, FiBriefcase } from "react-icons/fi";
import {
  FaCode,
  FaPaintBrush,
  FaCamera,
  FaVideo,
  FaMusic,
  FaPen,
} from "react-icons/fa";
import { db } from "@/firebase/firebase.config";

export default function Search() {
  const router = useRouter();
  const { q } = router.query;
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "all",
    category: "all",
    sortBy: "recent",
  });

  useEffect(() => {
    if (q) {
      performSearch();
    }
  }, [q, filters]);

  const performSearch = async () => {
    setLoading(true);
    try {
      let query = supabase.from("projects").select(`
        *,
        profiles:client_id (username, full_name, avatar_url)
      `);

      if (filters.type === "projects") {
        query = query.eq("status", "open");
      }

      if (filters.category !== "all") {
        query = query.eq("category", filters.category);
      }

      if (q) {
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
      }

      switch (filters.sortBy) {
        case "recent":
          query = query.order("created_at", { ascending: false });
          break;
        case "budget-high":
          query = query.order("budget", { ascending: false });
          break;
        case "budget-low":
          query = query.order("budget", { ascending: true });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error performing search:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSkillIcon = (skill) => {
    const lowerSkill = skill.toLowerCase();
    if (
      lowerSkill.includes("web") ||
      lowerSkill.includes("code") ||
      lowerSkill.includes("programming")
    ) {
      return <FaCode className="mr-2" />;
    } else if (
      lowerSkill.includes("design") ||
      lowerSkill.includes("ui") ||
      lowerSkill.includes("ux")
    ) {
      return <FaPaintBrush className="mr-2" />;
    } else if (lowerSkill.includes("photo") || lowerSkill.includes("image")) {
      return <FaCamera className="mr-2" />;
    } else if (lowerSkill.includes("video") || lowerSkill.includes("film")) {
      return <FaVideo className="mr-2" />;
    } else if (lowerSkill.includes("music") || lowerSkill.includes("audio")) {
      return <FaMusic className="mr-2" />;
    } else if (lowerSkill.includes("write") || lowerSkill.includes("content")) {
      return <FaPen className="mr-2" />;
    }
    return null;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Search Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
              Search Results
            </h1>
            <p className="text-xl text-gray-600">
              {q ? `Showing results for "${q}"` : "Browse all projects"}
            </p>
          </motion.div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value })
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="all">All</option>
                  <option value="projects">Projects</option>
                  <option value="freelancers">Freelancers</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="all">All Categories</option>
                  <option value="web">Web Development</option>
                  <option value="design">Design</option>
                  <option value="writing">Writing</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters({ ...filters, sortBy: e.target.value })
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="recent">Most Recent</option>
                  <option value="budget-high">Highest Budget</option>
                  <option value="budget-low">Lowest Budget</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {result.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {result.description}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-indigo-600 font-semibold">
                        ${result.budget}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {new Date(result.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.skills?.map((skill, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                        >
                          {getSkillIcon(skill)}
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                No results found. Try adjusting your search criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
