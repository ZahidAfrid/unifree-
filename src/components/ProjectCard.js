import { motion } from "framer-motion";
import Link from "next/link";
import { FiCalendar, FiDollarSign, FiUser, FiTag } from "react-icons/fi";

export default function ProjectCard({ project }) {
  const { id, title, description, skills, budget, deadline, status, clientName, createdAt } = project;

  // Format deadline date
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "No deadline specified";
      
      // Check if it's a Firebase timestamp
      if (dateString && typeof dateString.toDate === 'function') {
        return new Date(dateString.toDate()).toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric'
        });
      }
      
      // If it's a regular date string
      if (typeof dateString === 'string') {
        return dateString;
      }
      
      return "Deadline not specified";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };
  
  // Format posted date from Firebase timestamp
  const formatPostedDate = (timestamp) => {
    try {
      if (!timestamp) return "Recently";
      
      // Check if it's a Firebase timestamp
      if (timestamp && typeof timestamp.toDate === 'function') {
        return new Date(timestamp.toDate()).toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric'
        });
      }
      
      return "Recently";
    } catch (error) {
      console.error("Error formatting posted date:", error);
      return "Recently";
    }
  };
  
  // Determine status color for gradient background
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'open':
        return 'bg-green-400/30 text-green-100 border-green-300/30';
      case 'in-progress':
        return 'bg-blue-400/30 text-blue-100 border-blue-300/30';
      case 'completed':
        return 'bg-gray-400/30 text-gray-100 border-gray-300/30';
      case 'closed':
        return 'bg-red-400/30 text-red-100 border-red-300/30';
      default:
        return 'bg-green-400/30 text-green-100 border-green-300/30';
    }
  };

  return (
    <motion.div
      whileHover={{
        y: -5,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white rounded-xl shadow-md overflow-hidden border border-white/10 h-full flex flex-col"
    >
      {/* Semi-transparent overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 rounded-xl"></div>
      
      <div className="relative z-10 p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-white drop-shadow-md">{title}</h3>
          {status && (
            <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm border ${getStatusColor(status)}`}>
              {status}
            </span>
          )}
        </div>
        
        <p className="text-white/95 mb-4 flex-grow line-clamp-3 font-medium drop-shadow-sm">{description}</p>
        
        <div className="mb-4">
          <h4 className="text-sm font-bold text-white mb-2 drop-shadow-sm">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {skills && skills.length > 0 ? skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/30 text-white border border-white/20"
              >
                {skill}
              </span>
            )) : (
              <span className="text-xs text-white font-medium drop-shadow-sm">No skills specified</span>
            )}
            {skills && skills.length > 4 && (
              <span className="text-xs text-white font-medium drop-shadow-sm">
                +{skills.length - 4} more
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-auto space-y-3 pt-4 border-t border-white/20">
          <div className="flex items-center text-white">
            <FiUser className="mr-2 text-yellow-300 drop-shadow-sm" />
            <span className="text-sm font-medium drop-shadow-sm">{clientName || "Anonymous Client"}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-white">
              <FiDollarSign className="mr-1 text-green-300 drop-shadow-sm" />
              <span className="font-semibold drop-shadow-sm">{budget}</span>
            </div>
            <div className="flex items-center text-white">
              <FiCalendar className="mr-1 text-blue-300 drop-shadow-sm" />
              <span className="text-sm font-medium drop-shadow-sm">{formatDate(deadline)}</span>
            </div>
          </div>
          
          <div className="flex items-center text-white/90 text-xs">
            <FiTag className="mr-1 drop-shadow-sm" />
            <span className="font-medium drop-shadow-sm">Posted: {formatPostedDate(createdAt)}</span>
          </div>
        </div>
        
        <div className="mt-6">
          <Link 
            href={`/projects/${id}`}
            className="w-full flex justify-center items-center px-4 py-2.5 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
} 