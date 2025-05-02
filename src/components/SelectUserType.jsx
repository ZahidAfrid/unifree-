import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function SelectUserType() {
  const router = useRouter();
  const { user, updateUserType } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [error, setError] = useState(null);

  const handleUserTypeSelection = async (userType) => {
    if (!user) {
      toast.error("Please log in first");
      router.push("/login");
      return;
    }

    // Save selected type to prevent redirection issues
    setSelectedType(userType);
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Setting user type to: ${userType}`);
      
      // Store current selection in session storage before async operation
      sessionStorage.setItem('selectedUserType', userType);
      
      // Update user type in Firebase
      await updateUserType(user.uid, userType);
      
      // Log the selection for debugging
      console.log(`User type updated successfully to: ${userType}`);
      
      toast.success(`Welcome as a ${userType}!`);

      // Force a small delay to ensure the database update completes
      setTimeout(() => {
        if (userType === "client") {
          console.log("Redirecting to client registration");
          // Direct navigation instead of router.push to force a clean page load
          window.location.href = "/client-registration";
        } else if (userType === "freelancer") {
          console.log("Redirecting to freelancer registration");
          window.location.href = "/freelancer-registration";
        }
      }, 500);
    } catch (error) {
      console.error("Error setting user type:", error);
      setError(error.message || "Error setting up your profile");
      toast.error(error.message || "Error setting up your profile");
      setLoading(false);
      // Clean up session storage on error
      sessionStorage.removeItem('selectedUserType');
    }
  };

  // This effect prevents unwanted redirects while the user is selecting their type
  useEffect(() => {
    // Set a flag in sessionStorage to indicate we're in the user type selection flow
    sessionStorage.setItem('selectingUserType', 'true');
    
    return () => {
      // Only clear the selection flag if we're not in the middle of redirecting
      if (!sessionStorage.getItem('selectedUserType')) {
        sessionStorage.removeItem('selectingUserType');
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-700 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Choose Your Path</h2>
          <p className="text-gray-600 mb-8">Select how you want to use the platform</p>
          {error && (
            <p className="text-sm text-red-600 mb-4 p-2 bg-red-50 rounded">
              Error: {error}. Please try again.
            </p>
          )}
        </div>

        <div className="space-y-6">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleUserTypeSelection("freelancer")}
            disabled={loading}
            className={`relative w-full flex flex-col justify-center py-5 px-6 border border-transparent rounded-lg shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-70 ${selectedType === "freelancer" && loading ? "opacity-90 ring-2 ring-blue-400" : ""}`}
          >
            <h3 className="text-lg font-semibold text-white">
              {loading && selectedType === "freelancer" ? "Processing..." : "Work as a Freelancer"}
            </h3>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleUserTypeSelection("client")}
            disabled={loading}
            className={`relative w-full flex flex-col justify-center py-5 px-6 border border-transparent rounded-lg shadow-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-70 ${selectedType === "client" && loading ? "opacity-90 ring-2 ring-green-400" : ""}`}
          >
            <h3 className="text-lg font-semibold text-white">
              {loading && selectedType === "client" ? "Processing..." : "Hire Freelancers"}
            </h3>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
