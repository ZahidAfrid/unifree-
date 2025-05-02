import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Setup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tablesCreated, setTablesCreated] = useState(false);
  const [error, setError] = useState(null);

  const createTables = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create profiles table
      const { error: profilesError } = await supabase.rpc('create_profiles_table');
      if (profilesError) throw profilesError;
      
      // Create freelancer_profiles table
      const { error: freelancerProfilesError } = await supabase.rpc('create_freelancer_profiles_table');
      if (freelancerProfilesError) throw freelancerProfilesError;
      
      // Create freelancer_education table
      const { error: educationError } = await supabase.rpc('create_freelancer_education_table');
      if (educationError) throw educationError;
      
      // Create freelancer_skills table
      const { error: skillsError } = await supabase.rpc('create_freelancer_skills_table');
      if (skillsError) throw skillsError;
      
      // Try to create storage bucket
      try {
        await supabase.storage.createBucket('profile-images', {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
        });
      } catch (bucketError) {
        console.log('Storage bucket might already exist:', bucketError);
      }
      
      setTablesCreated(true);
      toast.success('Database tables created successfully');
      
      // Redirect after a delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating tables:', error);
      setError(error.message || 'Failed to create database tables');
      toast.error(error.message || 'Failed to create database tables');
    } finally {
      setLoading(false);
    }
  };

  // Try to create tables when the page loads
  useEffect(() => {
    createTables();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-700 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Setting Up Your Account
          </h2>
          <p className="text-gray-600">
            We're preparing your database tables
          </p>
        </div>
        
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <svg className="animate-spin mx-auto h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-lg text-gray-700">Creating database tables...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-4 text-lg text-gray-700">Error: {error}</p>
              <button
                onClick={createTables}
                className="mt-4 px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : tablesCreated ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-4 text-lg text-gray-700">Setup completed successfully!</p>
              <p className="mt-2 text-sm text-gray-500">Redirecting you to your dashboard...</p>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
} 