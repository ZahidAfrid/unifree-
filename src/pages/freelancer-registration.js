"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import FreelancerRegistrationForm from "@/components/registration/FreelancerRegistrationForm";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import toast from "react-hot-toast";

export default function FreelancerRegistration() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First, retrieve the selected user type (if any) and clear the selection flag
    const selectedUserType = sessionStorage.getItem('selectedUserType');
    console.log("Retrieved selected user type from session:", selectedUserType);
    
    // Clear selection flags once we've loaded this page
    sessionStorage.removeItem('selectingUserType');
    sessionStorage.removeItem('selectedUserType');
    
    // Check if user is logged in
    if (!authLoading) {
      if (!user) {
        console.log("No user found, redirecting to login");
        router.push("/login?redirect=freelancer-registration");
      } else {
        console.log("User authenticated for freelancer registration:", user);
        console.log("User type:", user.userType);
        
        // If user type is not yet set in database but was selected in the previous screen,
        // we'll proceed with registration without redirection
        if (selectedUserType === "freelancer") {
          setLoading(false);
          return;
        }
        
        // If user has a type set in the database and it's not "freelancer", redirect
        if (user.userType && user.userType !== "freelancer") {
          console.log(`User is a ${user.userType}, not a freelancer. Showing warning.`);
          toast.error("You're registered as a client. Please use the client registration form instead.");
          // Minor delay before redirecting to ensure toast is visible
          setTimeout(() => {
            router.push("/client-registration");
          }, 2000);
        } else {
          // User is a freelancer or has no type yet, allow them to proceed
          setLoading(false);
        }
      }
    }
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-100">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-100 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-6 py-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Complete Your Freelancer Profile</h1>
            <p className="text-blue-100 mt-2">
              Showcase your skills and experience to attract potential clients
            </p>
          </div>

          <FreelancerRegistrationForm />
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-sm text-gray-600 text-center">
              Need help? Contact our support team at <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-800">support@example.com</a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 