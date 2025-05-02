import "@/styles/globals.css";
import Layout from "@/components/Layout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Set up global loading spinner based on router events
  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  return (
    <AuthProvider>
      {/* Global loading spinner */}
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading page..." />
        </div>
      )}

      {/* Toaster for notifications */}
      <Toaster position="top-right" />

      <ThemeProvider>
        <AppContent Component={Component} pageProps={pageProps} />
      </ThemeProvider>
    </AuthProvider>
  );
}

// Separate component to use hooks within the context providers
function AppContent({ Component, pageProps }) {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    hasCompletedClientRegistration,
    hasCompletedFreelancerRegistration,
  } = useAuth();
  const [isSelectionInProgress, setIsSelectionInProgress] = useState(false);

  // Check if user is in the middle of selecting a user type
  useEffect(() => {
    const checkSelectionStatus = () => {
      const selectingType =
        sessionStorage.getItem("selectingUserType") === "true";
      setIsSelectionInProgress(selectingType);
    };

    checkSelectionStatus();

    // Listen for storage changes in case the selection status changes
    window.addEventListener("storage", checkSelectionStatus);
    return () => window.removeEventListener("storage", checkSelectionStatus);
  }, []);

  useEffect(() => {
    // Redirect logic for authenticated users
    const handleRouting = async () => {
      if (authLoading || !user) return;

      const publicPaths = ["/", "/explore", "/contact", "/about"];
      if (publicPaths.includes(router.pathname)) return; // ✅ EXIT EARLY

      const protectedPaths = [
        "/client-dashboard",
        "/client-registration",
        "/freelancer-registration",
        "/dashboard",
        "/messages",
        "/settings",
      ];

      const isProtectedRoute = protectedPaths.some((path) =>
        router.pathname.startsWith(path)
      );

      if (isProtectedRoute) {
        if (user.userType === "client") {
          const isClientComplete = await hasCompletedClientRegistration();
          if (!isClientComplete) {
            router.push("/client-registration");
          }
        } else if (user.userType === "freelancer") {
          const isFreelancerComplete =
            await hasCompletedFreelancerRegistration();
          if (!isFreelancerComplete) {
            router.push("/freelancer-registration");
          }
        } else {
          router.push("/select-user-type");
        }
      }
    };

    handleRouting();
  }, [
    authLoading,
    user,
    router,
    hasCompletedClientRegistration,
    hasCompletedFreelancerRegistration,
    isSelectionInProgress,
  ]);

  // Only redirect if needed and not already on a type-specific page

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
