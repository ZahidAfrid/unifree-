import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function SelectUserType() {
  const router = useRouter();
  const { updateUserType } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // ✅ Extract userId safely
  useEffect(() => {
    if (router.isReady) {
      const { userId } = router.query;
      if (userId) {
        setUserId(userId);
      } else {
        router.push("/signup"); // Redirect if missing
      }
    }
  }, [router.isReady, router.query]);

  const handleUserTypeSelection = async (userType) => {
    if (!userId) return;

    setLoading(true);
    try {
      await updateUserType(userId, userType);
      toast.success(`Welcome as a ${userType}!`);

      // ✅ Redirect based on user type
      router.push(userType === "client" ? "/client-profile" : "/setup-profile");
    } catch (error) {
      console.error("Error setting user type:", error);
      toast.error(error.message || "Error setting up your profile");
    } finally {
      setLoading(false);
    }
  };

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
        </div>

        <div className="space-y-6">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleUserTypeSelection("freelancer")}
            className="w-full py-5 px-6 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700"
          >
            Work as a Freelancer
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleUserTypeSelection("client")}
            className="w-full py-5 px-6 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700"
          >
            Hire Freelancers
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
