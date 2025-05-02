import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function InitialProfileSetup() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    university: '',
    department: '',
    degree: '',
    graduationYear: '',
    skills: [],
    bio: '',
    hourlyRate: '',
    portfolioUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    profileImage: null,
    imagePreview: null
  });

  // Check if user is freelancer
  useEffect(() => {
    if (user && user.user_metadata?.user_type === 'freelancer') {
      setIsFreelancer(true);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profileImage: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addSkill = (e) => {
    e.preventDefault();
    const skill = e.target.skill.value.trim();
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
      e.target.skill.value = '';
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        toast.error('Please fill in your name');
        return false;
      }
    } else if (step === 2) {
      if (isFreelancer && (!formData.university.trim() || !formData.department.trim() || 
          !formData.degree.trim() || !formData.graduationYear)) {
        toast.error('Please fill in all education details');
        return false;
      }
    } else if (step === 3) {
      if (isFreelancer && formData.skills.length === 0) {
        toast.error('Please add at least one skill');
        return false;
      }
    }
    return true;
  };

  const getTotalSteps = () => {
    return isFreelancer ? 3 : 1;
  };

  const nextStep = () => {
    if (validateStep()) {
      if (step < getTotalSteps()) {
        setStep(step + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    try {
      // Create storage bucket if it doesn't exist
      try {
        const { data: bucketData, error: bucketCheckError } = await supabase.storage.getBucket('profile-images');
        
        if (bucketCheckError && bucketCheckError.code === '404') {
          console.log('Creating profile-images bucket...');
          await supabase.storage.createBucket('profile-images', {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
          });
        }
      } catch (bucketError) {
        console.log('Bucket operation error:', bucketError);
        // Continue anyway - will fail later if critical
      }

      // Upload profile image if exists
      let avatarUrl = null;
      if (formData.profileImage) {
        const fileExt = formData.profileImage.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        console.log('Uploading profile image:', filePath);
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('profile-images')
          .upload(filePath, formData.profileImage);

        if (uploadError) {
          console.error('Profile image upload error:', uploadError);
          toast.error('Failed to upload profile image: ' + uploadError.message);
        } else {
          const { data } = supabase.storage
            .from('profile-images')
            .getPublicUrl(filePath);

          avatarUrl = data.publicUrl;
          console.log('Profile image uploaded successfully:', avatarUrl);
        }
      }

      // Prepare username for freelancers
      const normalizedFirstName = formData.firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedLastName = formData.lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const username = `${normalizedFirstName}-${normalizedLastName}-${Math.floor(Math.random() * 1000)}`;

      // Create unified profile data object for consistency
      const profileData = {
        id: user.id,
        full_name: `${formData.firstName} ${formData.lastName}`,
        avatar_url: avatarUrl,
        bio: formData.bio,
        updated_at: new Date().toISOString()
      };

      console.log('Updating user metadata...');
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          full_name: `${formData.firstName} ${formData.lastName}`,
          avatar_url: avatarUrl,
          profile_completed: true
        }
      });

      if (updateError) {
        console.error('User metadata update error:', updateError);
        toast.error('Failed to update user metadata: ' + updateError.message);
        throw updateError;
      }

      console.log('Creating/updating profile record...');
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        
        // If the table doesn't exist, try to redirect to setup
        if (profileError.message && (
          profileError.message.includes("table doesn't exist") || 
          profileError.message.includes("relation") || 
          profileError.message.includes("does not exist")
        )) {
          toast.error('Database tables need to be set up first');
          router.push('/setup');
          return;
        }
        
        throw profileError;
      }

      // If user is a freelancer, create freelancer profile
      let freelancerUsername = null;
      if (isFreelancer) {
        console.log('Creating freelancer profile record...');
        // Create freelancer profile record
        const freelancerData = {
          user_id: user.id,
          username: username,
          hourly_rate: formData.hourlyRate || 0,
          portfolio_url: formData.portfolioUrl,
          linkedin_url: formData.linkedinUrl,
          github_url: formData.githubUrl,
          bio: formData.bio, // Ensure bio is also stored in freelancer profile for consistency
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: freelancerProfile, error: freelancerProfileError } = await supabase
          .from('freelancer_profiles')
          .upsert(freelancerData)
          .select('username')
          .single();

        if (freelancerProfileError) {
          console.error('Freelancer profile creation error:', freelancerProfileError);
          
          // If the table doesn't exist, try to redirect to setup
          if (freelancerProfileError.message && (
            freelancerProfileError.message.includes("table doesn't exist") || 
            freelancerProfileError.message.includes("relation") || 
            freelancerProfileError.message.includes("does not exist")
          )) {
            toast.error('Database tables need to be set up first');
            router.push('/setup');
            return;
          }
          
          toast.error('Could not create freelancer profile: ' + freelancerProfileError.message);
        } else {
          freelancerUsername = freelancerProfile?.username || username;
          console.log('Freelancer profile created with username:', freelancerUsername);
        }

        // Create education record
        if (formData.university) {
          console.log('Creating education record...');
          const educationData = {
            user_id: user.id,
            institution: formData.university,
            department: formData.department,
            degree: formData.degree,
            graduation_year: formData.graduationYear,
            is_current: true
          };
          
          const { error: educationError } = await supabase
            .from('freelancer_education')
            .insert(educationData);

          if (educationError) {
            console.error('Education record creation error:', educationError);
            
            // If the table doesn't exist, try to redirect to setup
            if (educationError.message && (
              educationError.message.includes("table doesn't exist") || 
              educationError.message.includes("relation") || 
              educationError.message.includes("does not exist")
            )) {
              toast.error('Database tables need to be set up first');
              router.push('/setup');
              return;
            }
            
            toast.error('Could not save education details: ' + educationError.message);
          }
        }

        // Add skills
        if (formData.skills.length > 0) {
          console.log('Adding skills:', formData.skills);
          let skillsError = false;
          for (const skill of formData.skills) {
            const skillData = {
              user_id: user.id,
              skill_name: skill
            };
            
            const { error: skillError } = await supabase
              .from('freelancer_skills')
              .insert(skillData);
              
            if (skillError) {
              console.error('Skill addition error:', skillError);
              skillsError = true;
              
              // If the table doesn't exist, try to redirect to setup
              if (skillError.message && (
                skillError.message.includes("table doesn't exist") || 
                skillError.message.includes("relation") || 
                skillError.message.includes("does not exist")
              )) {
                toast.error('Database tables need to be set up first');
                router.push('/setup');
                return;
              }
            }
          }
          
          if (skillsError) {
            toast.error('Some skills could not be saved');
          }
        }
      }

      // Refresh the auth session to ensure metadata changes take effect
      await supabase.auth.refreshSession();
      
      toast.success('Profile setup completed!');
      
      // Redirect to appropriate page
      if (isFreelancer) {
        const profileUrl = `/freelancer/${freelancerUsername || username || user.id}`;
        console.log('Redirecting to freelancer profile:', profileUrl);
        router.push(profileUrl);
      } else {
        console.log('Redirecting to dashboard');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error setting up profile:', error);
      toast.error(`Failed to complete profile setup: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <motion.h1 
            className="text-3xl font-extrabold text-gray-900 mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Complete Your Profile
          </motion.h1>
          <motion.p 
            className="mt-2 text-lg text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {isFreelancer 
              ? "Let's showcase your skills to potential clients"
              : "Just a few details to get you started"}
          </motion.p>
        </div>

        <motion.div 
          className="bg-white shadow-xl rounded-xl p-8 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Progress Steps */}
          {isFreelancer && (
            <div className="flex justify-between mb-8">
              {[1, 2, 3].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`flex items-center ${
                    stepNumber < 3 ? 'flex-1' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step >= stepNumber
                        ? 'bg-blue-600 text-white font-medium'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()}>
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-blue-900 mb-2">Personal Information</h2>
                    <p className="text-blue-700">Tell us about yourself</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profile Picture
                    </label>
                    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                      {formData.imagePreview ? (
                        <div className="relative h-28 w-28 rounded-full overflow-hidden bg-gray-100 border-2 border-blue-300">
                          <Image
                            src={formData.imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-28 w-28 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          id="profile-photo"
                          className="sr-only"
                        />
                        <label
                          htmlFor="profile-photo"
                          className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md cursor-pointer hover:bg-blue-200 transition"
                        >
                          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Choose Photo
                        </label>
                        <p className="mt-1 text-xs text-gray-500">JPG, PNG or GIF up to 5MB</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio <span className="text-gray-500 font-normal">(optional)</span>
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Tell potential clients about yourself"
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Education (Freelancers Only) */}
            {step === 2 && isFreelancer && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-blue-900 mb-2">Educational Background</h2>
                    <p className="text-blue-700">Share your academic achievements</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      University / College
                    </label>
                    <input
                      type="text"
                      name="university"
                      value={formData.university}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Degree
                      </label>
                      <input
                        type="text"
                        name="degree"
                        value={formData.degree}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Graduation Year
                    </label>
                    <input
                      type="number"
                      name="graduationYear"
                      value={formData.graduationYear}
                      onChange={handleChange}
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 10}
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Skills & External Links (Freelancers Only) */}
            {step === 3 && isFreelancer && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-blue-900 mb-2">Skills & External Profiles</h2>
                    <p className="text-blue-700">Showcase your abilities and connect your online presence</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills <span className="text-red-500">*</span>
                    </label>
                    <div className="mb-4">
                      <form onSubmit={addSkill} className="flex space-x-2">
                        <input
                          type="text"
                          name="skill"
                          placeholder="e.g., Web Development, Graphic Design"
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Add
                        </button>
                      </form>
                    </div>
                    
                    {formData.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        {formData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="ml-2 text-blue-700 hover:text-blue-900 focus:outline-none"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No skills added yet</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hourly Rate (USD) <span className="text-gray-500 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input
                        type="number"
                        name="hourlyRate"
                        value={formData.hourlyRate}
                        onChange={handleChange}
                        placeholder="25"
                        min="0"
                        className="block w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Portfolio URL <span className="text-gray-500 font-normal">(optional)</span>
                      </label>
                      <input
                        type="url"
                        name="portfolioUrl"
                        value={formData.portfolioUrl}
                        onChange={handleChange}
                        placeholder="https://yourportfolio.com"
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn <span className="text-gray-500 font-normal">(optional)</span>
                      </label>
                      <input
                        type="url"
                        name="linkedinUrl"
                        value={formData.linkedinUrl}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/username"
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GitHub <span className="text-gray-500 font-normal">(optional)</span>
                      </label>
                      <input
                        type="url"
                        name="githubUrl"
                        value={formData.githubUrl}
                        onChange={handleChange}
                        placeholder="https://github.com/username"
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              {step > 1 && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="flex items-center">
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Previous
                  </span>
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={nextStep}
                disabled={loading}
                className={`${step > 1 ? 'ml-auto' : 'w-full'} px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-lg`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    {step < getTotalSteps() ? (
                      <>
                        Next
                        <svg className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </>
                    ) : (
                      'Complete Setup'
                    )}
                  </span>
                )}
              </motion.button>
            </div>
          </form>
          
          {/* Progress Indicator */}
          {isFreelancer && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Step {step} of {getTotalSteps()}
              </p>
            </div>
          )}
          
          {/* Troubleshooting Help */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Having trouble setting up your profile?{' '}
              <button
                onClick={() => router.push('/troubleshoot')}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Run diagnostics
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 