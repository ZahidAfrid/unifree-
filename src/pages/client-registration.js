"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import ClientRegistrationForm from "@/components/registration/ClientRegistrationForm";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import toast from "react-hot-toast";

export default function ClientRegistration() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    console.log("============ CLIENT REGISTRATION PAGE LOADED ============");

    // First, retrieve the selected user type (if any) and clear the selection flag
    const selectedUserType = sessionStorage.getItem("selectedUserType");
    const isSelecting = sessionStorage.getItem("selectingUserType") === "true";

    console.log("User selection state:", {
      selectedType: selectedUserType,
      isSelecting,
      currentUrl: window.location.href,
    });

    // Store debug info for display
    setDebugInfo({
      selectedUserType,
      isSelecting,
      currentTime: new Date().toISOString(),
      userLoadingState: authLoading,
      hasUser: !!user,
      userType: user?.userType || "unknown",
    });

    // Allow this page to run without clearing flags
    // This will let us see the full user state for debugging

    // Check if user is logged in
    if (!authLoading) {
      // Log full user object (with sensitive info removed)
      console.log("User object:", {
        ...user,
        uid: user?.uid ? "[PRESENT]" : "[MISSING]",
        email: user?.email ? "[PRESENT]" : "[MISSING]",
        userType: user?.userType,
        clientProfileCompleted: user?.clientProfileCompleted,
        freelancerProfileCompleted: user?.freelancerProfileCompleted,
      });

      if (!user) {
        console.log("No user found, redirecting to login");
        router.push("/login?redirect=client-registration&reason=no_user");
      } else {
        console.log("User authenticated for client registration");

        // At this point, if we have a selectedUserType from session and it's "client",
        // we'll ALLOW the registration regardless of what's in the database
        if (selectedUserType === "client") {
          console.log(
            "Selected type from session is client - proceeding with registration"
          );
          setLoading(false);
          return;
        }

        // If the user has a type in the database and it's not client, we'll redirect
        if (user.userType && user.userType !== "client") {
          console.log(
            `User type in database is ${user.userType}, not client - redirecting`
          );
          toast.error(
            "You're registered as a freelancer. Please use the freelancer registration form instead."
          );

          // Minor delay before redirecting
          setTimeout(() => {
            router.push("/freelancer-registration");
          }, 2000);
        } else {
          // User is either a client or has no type yet
          console.log("User can proceed with client registration");
          setLoading(false);
        }
      }
    }
  }, [user, authLoading, router]);

  // Now safely clear these flags AFTER we've had a chance to use them
  useEffect(() => {
    return () => {
      // Only clear on unmount, not during render
      console.log("Cleaning up selection flags on client registration unmount");
      sessionStorage.removeItem("selectingUserType");
      sessionStorage.removeItem("selectedUserType");
    };
  }, []);

  if (loading || authLoading) {
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
