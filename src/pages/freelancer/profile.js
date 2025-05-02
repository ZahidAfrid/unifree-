import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase.config";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Image from "next/image";

export default function FreelancerProfile() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchUserProfile();
      fetchFreelancerProfile();
      fetchFreelancerSkills();
    }
  }, [
    user,
    fetchUserProfile,
    fetchFreelancerProfile,
    fetchFreelancerSkills,
    router,
  ]);

  // Fetch User Profile
  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Error loading profile.");
        return;
      }

      setProfile(data);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Freelancer Profile
  const fetchFreelancerProfile = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("freelancer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching freelancer profile:", error);
        toast.error("Error loading freelancer profile.");
        return;
      }

      setFreelancerProfile(data);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Freelancer Skills
  const fetchFreelancerSkills = async () => {
    try {
      const { data, error } = await supabase
        .from("freelancer_skills")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching skills:", error);
        toast.error("Error loading skills.");
        return;
      }

      setSkills(data || []);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Something went wrong while fetching your skills.");
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center pt-24 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full max-w-3xl p-6">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
              <Image
                src={profile?.avatar_url || "/images/default-avatar.png"}
                alt={profile?.full_name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                {profile?.full_name || "No Name"}
              </h1>
              <p className="text-gray-500">
                {freelancerProfile?.title || "No title added"}
              </p>
            </div>
          </div>

          {/* Edit Profile Button */}
          <div className="ml-auto">
            <button
              onClick={() => router.push("/freelancer/edit-profile")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Freelancer Details */}
        <div className="mt-6 border-t pt-4">
          <h2 className="text-lg font-semibold mb-4">Professional Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <p>
              <strong>Hourly Rate:</strong>{" "}
              {freelancerProfile?.hourly_rate
                ? `$${freelancerProfile.hourly_rate}`
                : "Not specified"}
            </p>
            <p>
              <strong>Experience Level:</strong>{" "}
              {freelancerProfile?.experience_level || "Not specified"}
            </p>
            <p>
              <strong>University:</strong>{" "}
              {freelancerProfile?.university || "Not specified"}
            </p>
            <p>
              <strong>Department:</strong>{" "}
              {freelancerProfile?.department || "Not specified"}
            </p>
            <p>
              <strong>Graduation Year:</strong>{" "}
              {freelancerProfile?.graduation_year || "Not specified"}
            </p>
          </div>
        </div>

        {/* Skills Section */}
        <div className="mt-6 border-t pt-4">
          <h2 className="text-lg font-semibold mb-4">Skills</h2>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {skill.skill_name} - {skill.skill_level}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No skills added yet.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
