import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { FaStar, FaRegStar, FaStarHalfAlt, FaDollarSign } from "react-icons/fa";

export default function FreelancerCard({ freelancer }) {
  const { id, name, university, skills, rating, profileImage, title, hourlyRate, experienceLevel } = freelancer;

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
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      <div className="p-6">
        <div className="flex items-center space-x-4">
          <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-indigo-500">
            <Image
              src={profileImage}
              alt={name}
              fill
              sizes="64px"
              className="rounded-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{name}</h3>
            {title && <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">{title}</p>}
            <p className="text-sm text-gray-500 dark:text-gray-400">{university}</p>
            <div className="flex items-center mt-1">
              {renderStars(rating)}
              <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">{rating}</span>
            </div>
          </div>
        </div>
        
        {hourlyRate && (
          <div className="mt-4 flex items-center">
            <FaDollarSign className="text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">${hourlyRate}/hour</span>
            {experienceLevel && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {experienceLevel}
              </span>
            )}
          </div>
        )}
        
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {skills && skills.length > 0 ? (
              skills.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500">No skills listed</span>
            )}
            {skills && skills.length > 3 && (
              <span className="text-xs text-gray-500">+{skills.length - 3} more</span>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <Link 
            href={`/freelancers/${id}`}
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>
    </motion.div>
  );
} 