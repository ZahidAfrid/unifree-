import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  FaCode,
  FaGraduationCap,
  FaDollarSign,
  FaMapMarkerAlt,
  FaRegClock,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase.config";

// Options for dropdown fields
import { categoryOptions, availabilityOptions } from "@/utils/formOptions";

export default function FreelancerRegistrationForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.displayName || "",
    professionalTitle: "",
    skills: "",
    primaryCategory: "web-development",
    education: "",
    hourlyRate: "",
    location: "",
    availability: "full-time",
    bio: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to create a profile");
      return;
    }

    console.log("🚀 Starting freelancer registration process...");
    console.log("📊 User details:", {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      currentUserType: user.userType
    });
    console.log("📝 Form data:", formData);

    setIsLoading(true);

    try {
      // Format skills as an array from comma-separated string
      const skillsArray = formData.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill !== "");

      console.log("📋 Processed skills array:", skillsArray);

      // First, ensure the user type is set correctly in the users collection
      console.log("👤 Updating user type in users collection...");
      await setDoc(doc(db, "users", user.uid), {
        userType: "freelancer",
        userTypeUpdatedAt: new Date().toISOString()
      }, { merge: true });
      console.log("✅ User type updated successfully");

      // Save to Firestore in the freelancer_profiles collection
      console.log("📄 Creating freelancer profile...");
      const profileData = {
        ...formData,
        userId: user.uid,
        email: user.email,
        skills: skillsArray,
        userType: "freelancer",
        freelancerProfileCompleted: true,
        primaryCategory: formData.primaryCategory,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      console.log("📄 Profile data to save:", profileData);
      
      await setDoc(doc(db, "freelancer_profiles", user.uid), profileData);
      console.log("✅ Freelancer profile created successfully");

      toast.success("Your freelancer profile has been created!");
      
      console.log("🔄 Redirecting to dashboard...");
      // Add a small delay to ensure the database updates are complete
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("❌ Error creating freelancer profile:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      toast.error("Failed to create profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="space-y-6">
        {/* Basic Information Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FaCode className="mr-2 text-blue-500" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Professional Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="professionalTitle"
                value={formData.professionalTitle}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Senior Web Developer"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="JavaScript, React, Node.js, UI/UX Design (comma separated)"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate skills with commas
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Service Category <span className="text-red-500">*</span>
              </label>
              <select
                name="primaryCategory"
                value={formData.primaryCategory}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Professional Details Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FaGraduationCap className="mr-2 text-blue-500" />
            Professional Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Education
              </label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Bachelor's in Computer Science"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <FaMapMarkerAlt className="mr-1 text-green-600" />
                  Location
                </div>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="New York, NY"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <FaDollarSign className="mr-1 text-green-600" />
                  Hourly Rate (USD)
                </div>
              </label>
              <input
                type="text"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="45"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <FaRegClock className="mr-1 text-blue-500" />
                  Availability <span className="text-red-500">*</span>
                </div>
              </label>
              <select
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {availabilityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Professional Bio <span className="text-red-500">*</span>
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows="5"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tell potential clients about your experience, approach to projects, and what makes you unique..."
            required
          ></textarea>
          <p className="mt-1 text-xs text-gray-500">
            Minimum 50 characters recommended
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <motion.button
            type="submit"
            disabled={isLoading}
            className={`w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-md shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            whileHover={{ scale: isLoading ? 1 : 1.03 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating profile...
              </div>
            ) : (
              "Complete Registration"
            )}
          </motion.button>
        </div>
      </div>
    </form>
  );
}
