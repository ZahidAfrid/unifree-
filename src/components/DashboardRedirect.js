import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, loading: authLoading, getDashboardRoute } = useAuth();

  useEffect(() => {
    const handleRedirect = async () => {
      if (!authLoading && user?.uid) {
        console.log("🔍 DashboardRedirect: Checking user type:", user.userType);
        
        try {
          const correctRoute = await getDashboardRoute();
          console.log("🔄 DashboardRedirect: Redirecting to:", correctRoute);
          
          // Only redirect if we're not already on the correct route
          if (router.asPath !== correctRoute) {
            router.push(correctRoute);
          }
        } catch (error) {
          console.error("❌ DashboardRedirect: Error getting dashboard route:", error);
          // Fallback logic
          if (user.userType === "client") {
            router.push("/client-dashboard");
          } else if (user.userType === "freelancer") {
            router.push("/dashboard");
          } else {
            router.push("/select-user-type");
          }
        }
      }
    };

    // Add a small delay to ensure user data is fully loaded
    const timer = setTimeout(handleRedirect, 200);
    return () => clearTimeout(timer);
  }, [authLoading, user?.uid, user?.userType, router, getDashboardRoute]);

  return null; // This component doesn't render anything
}

export const useDashboardNavigation = () => {
  const router = useRouter();
  const { user, getDashboardRoute } = useAuth();

  const navigateToDashboard = async () => {
    try {
      const dashboardRoute = await getDashboardRoute();
      router.push(dashboardRoute);
    } catch (error) {
      console.error('Error getting dashboard route:', error);
      // Fallback logic
      if (user?.userType === "client") {
        router.push("/client-dashboard");
      } else if (user?.userType === "freelancer") {
        router.push("/dashboard");
      } else {
        router.push("/select-user-type");
      }
    }
  };

  return navigateToDashboard;
}; 