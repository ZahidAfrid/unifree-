"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import ClientRegistrationForm from "@/components/registration/ClientRegistrationForm";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import toast from "react-hot-toast";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase.config";

export default function ClientRegistration() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      if (authLoading) return;

      try {
        // Check if user is authenticated
        if (!user) {
          router.replace("/login?redirect=client-registration");
          return;
        }

        // Check if user is a client
        if (user.userType && user.userType !== "client") {
          toast.error("You're registered as a freelancer. Please use the freelancer registration form instead.");
          router.replace("/freelancer-registration");
          return;
        }

        // Check if client profile already exists
        const clientDoc = await getDoc(doc(db, "client_registration", user.uid));
        if (clientDoc.exists()) {
          router.replace("/client-dashboard");
          return;
        }

        setLoading(false);
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing page:", error);
        toast.error("An error occurred. Please try again.");
      }
    };

    initializePage();
  }, [user, authLoading, router]);

  if (loading || authLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <LoadingSpinner size="large" />
        <div className="mt-4 text-sm text-gray-500">
          Loading client registration...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Complete Your Client Profile
            </h1>
            <p className="text-indigo-100 mt-2">
              Tell us about your company and project needs to find the perfect
              freelancers
            </p>
          </div>

          <ClientRegistrationForm />

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-sm text-gray-600 text-center">
              Need help? Contact our support team at{" "}
              <a
                href="mailto:support@example.com"
                className="text-indigo-600 hover:text-indigo-800"
              >
                support@example.com
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
