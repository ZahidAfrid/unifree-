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
  
  // Determine status color
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 h-full flex flex-col"
    >
      <div className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          {status && (
            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
              {status}
            </span>
          )}
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow line-clamp-3">{description}</p>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {skills && skills.length > 0 ? skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
              >
                {skill}
              </span>
            )) : (
              <span className="text-xs text-gray-500">No skills specified</span>
            )}
          </div>
        </div>
        
        <div className="mt-auto space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <FiUser className="mr-2 text-indigo-500" />
            <span className="text-sm">{clientName || "Anonymous Client"}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <FiDollarSign className="mr-1 text-indigo-500" />
              <span className="font-medium">{budget}</span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <FiCalendar className="mr-1 text-indigo-500" />
              <span className="text-sm">{formatDate(deadline)}</span>
            </div>
          </div>
          
          <div className="flex items-center text-gray-500 text-xs">
            <FiTag className="mr-1" />
            <span>Posted: {formatPostedDate(createdAt)}</span>
          </div>
        </div>
        
        <div className="mt-6">
          <Link 
            href={`/projects/${id}`}
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
} 