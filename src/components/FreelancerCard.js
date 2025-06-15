import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { FaStar, FaRegStar, FaStarHalfAlt, FaDollarSign } from "react-icons/fa";

export default function FreelancerCard({ freelancer }) {
  const {
    id,
    name,
    university,
    skills,
    rating,
    reviewCount,
    profileImage,
    title,
    hourlyRate,
    isAvailable,
  } = freelancer;

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
      whileHover={{
        y: -5,
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white rounded-xl shadow-md overflow-hidden border border-white/10"
    >
      {/* Semi-transparent overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 rounded-xl"></div>
      
      <div className="relative z-10 p-6">
        {/* Availability Status Badge */}
        <div className="absolute top-4 right-4">
          <div
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
              isAvailable !== false
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full mr-1 ${
                isAvailable !== false ? "bg-green-200" : "bg-red-200"
              }`}
            ></span>
            {isAvailable !== false ? "Available" : "Unavailable"}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
            <Image
              src={profileImage}
              alt={name}
              fill
              sizes="64px"
              className="rounded-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white drop-shadow-md">{name}</h3>
            {title && (
              <p className="text-sm text-yellow-300 font-semibold drop-shadow-sm">{title}</p>
            )}
            <p className="text-sm text-white font-medium drop-shadow-sm">{university}</p>
            <div className="flex items-center mt-1">
              {renderStars(rating)}
              <span className="ml-1 text-sm text-white font-medium drop-shadow-sm">
                {rating > 0 ? rating : 'No rating'}
              </span>
              {reviewCount > 0 && (
                <span className="ml-1 text-xs text-white/80 drop-shadow-sm">
                  ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                </span>
              )}
            </div>
          </div>
        </div>

        {hourlyRate && (
          <div className="mt-4 flex items-center">
            <FaDollarSign className="text-green-300 drop-shadow-sm" />
            <span className="text-sm font-semibold ml-1 text-white drop-shadow-sm">
              ${hourlyRate}/hour
            </span>
          </div>
        )}

        <div className="mt-4">
          <h4 className="text-sm font-bold text-white mb-2 drop-shadow-sm">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {skills && skills.length > 0 ? (
              skills.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/30 text-white border border-white/20"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-white font-medium drop-shadow-sm">No skills listed</span>
            )}
            {skills && skills.length > 3 && (
              <span className="text-xs text-white font-medium drop-shadow-sm">
                +{skills.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="mt-6">
          <Link
            href={`/freelancers/${id}`}
            className="w-full flex justify-center items-center px-4 py-2.5 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
          >
            View Profile
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
