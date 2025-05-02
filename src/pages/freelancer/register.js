import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import FreelancerRegistration from '@/components/FreelancerRegistration';
import { motion } from 'framer-motion';

export default function FreelancerRegister() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Create Your Freelancer Profile
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Complete your profile to start getting hired for projects
          </p>
        </div>
        
        <FreelancerRegistration />
      </div>
    </motion.div>
  );
} 