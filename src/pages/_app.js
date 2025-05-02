import "@/styles/globals.css";
import Layout from "@/components/Layout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Set up global loading spinner based on router events
  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
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
    hasCompletedFreelancerRegistration 
  } = useAuth();
  const [isSelectionInProgress, setIsSelectionInProgress] = useState(false);

  // Check if user is in the middle of selecting a user type
  useEffect(() => {
    const checkSelectionStatus = () => {
      const selectingType = sessionStorage.getItem('selectingUserType') === 'true';
      setIsSelectionInProgress(selectingType);
    };
    
    checkSelectionStatus();
    
    // Listen for storage changes in case the selection status changes
    window.addEventListener('storage', checkSelectionStatus);
    return () => window.removeEventListener('storage', checkSelectionStatus);
  }, []);

  useEffect(() => {
    // Redirect logic for authenticated users
    const handleRouting = async () => {
      // Skip redirection logic if user is actively selecting a user type
      if (isSelectionInProgress) {
        console.log("User is selecting user type - skipping redirects");
        return;
      }
      
      // Skip if still loading or no user
      if (authLoading || !user) {
        return;
      }
      
      console.log("Checking routing with user type:", user.userType);
      
      // Only apply redirects on public paths, not when already in a registration flow
      const publicPaths = ['/', '/login', '/signup', '/select-user-type'];
      const currentPath = router.pathname;
      
      // Check if user is on a public path that should trigger a redirect
      const shouldRedirect = publicPaths.includes(currentPath);
      
      // Important: Don't redirect if already on a registration or type-specific page
      const isAlreadyOnRegistration = 
        currentPath.includes('registration') || 
        currentPath.includes('client-') || 
        currentPath.includes('freelancer-');
      
      // For debugging
      console.log({
        userType: user.userType,
        currentPath,
        shouldRedirect,
        isAlreadyOnRegistration,
        isSelectionInProgress
      });
        
      // Only redirect if needed and not already on a type-specific page
      if (shouldRedirect && !isAlreadyOnRegistration) {
        if (user.userType === 'client') {
          const isClientComplete = await hasCompletedClientRegistration();
          // Ensure we don't redirect to freelancer registration for clients
          const targetPath = isClientComplete ? '/client-dashboard' : '/client-registration';
          console.log(`Client user: redirecting to ${targetPath}`);
          router.push(targetPath);
        } else if (user.userType === 'freelancer') {
          const isFreelancerComplete = await hasCompletedFreelancerRegistration();
          console.log(`Freelancer user: redirecting to ${isFreelancerComplete ? '/dashboard' : '/freelancer-registration'}`);
          router.push(isFreelancerComplete ? '/dashboard' : '/freelancer-registration');
        } else {
          // No user type selected yet
          console.log("No user type: redirecting to select-user-type");
          router.push('/select-user-type');
        }
      }
    };
    
    handleRouting();
  }, [authLoading, user, router, hasCompletedClientRegistration, hasCompletedFreelancerRegistration, isSelectionInProgress]);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}