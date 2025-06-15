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
  const { user, loading: authLoading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!router.isReady || authLoading) return;

    const handleRouting = async () => {
      try {
        // Public paths that don't require authentication
        const publicPaths = ["/", "/explore", "/contact", "/about", "/login", "/signup"];
        if (publicPaths.includes(router.pathname)) {
          setIsInitialized(true);
          return;
        }

        // If not authenticated and not on a public path, redirect to login
        if (!user) {
          const returnUrl = encodeURIComponent(router.asPath);
          router.replace(`/login?redirect=${returnUrl}`);
          return;
        }

        // Protected routes handling
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
            if (!user.clientProfileCompleted && router.pathname !== "/client-registration") {
              router.replace("/client-registration");
              return;
            }
          } else if (user.userType === "freelancer") {
            if (!user.freelancerProfileCompleted && router.pathname !== "/freelancer-registration") {
              router.replace("/freelancer-registration");
              return;
            }
          } else if (router.pathname !== "/select-user-type") {
            router.replace("/select-user-type");
            return;
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error in routing:", error);
        setIsInitialized(true);
      }
    };

    handleRouting();
  }, [router.isReady, authLoading, user, router]);

  if (!isInitialized || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
