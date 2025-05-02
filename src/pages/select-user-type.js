import SelectUserType from '@/components/SelectUserType';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function SelectUserTypePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check if we're in the middle of a user type selection
    const isSelecting = sessionStorage.getItem('selectingUserType') === 'true';
    const selectedType = sessionStorage.getItem('selectedUserType');
    
    console.log('Select user type page loaded. Current status:', {
      isUserLoading: loading,
      userExists: !!user,
      isSelecting,
      selectedType
    });
    
    // If currently selecting a type, don't redirect
    if (isSelecting || selectedType) {
      console.log('User is in the selection process, skipping redirects');
      return;
    }
    
    // If user is not logged in, redirect to login
    if (!loading && !user) {
      console.log('No user found, redirecting to login');
      router.push('/login');
      return;
    }
    
    // If user already has a type and it's set in the profile, redirect to appropriate page
    if (!loading && user?.userType) {
      console.log('User already has type:', user.userType);
      setIsProcessing(true);
      
      if (user.userType === 'freelancer') {
        if (user.freelancerProfileCompleted) {
          console.log('Freelancer profile is complete, redirecting to dashboard');
          router.push('/dashboard');
        } else {
          console.log('Freelancer profile is incomplete, redirecting to registration');
          router.push('/freelancer-registration');
        }
      } else if (user.userType === 'client') {
        if (user.clientProfileCompleted) {
          console.log('Client profile is complete, redirecting to client dashboard');
          router.push('/client-dashboard');
        } else {
          console.log('Client profile is incomplete, redirecting to client registration');
          router.push('/client-registration');
        }
      }
    }
  }, [user, loading, router]);

  if (loading || isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return <SelectUserType />;
} 