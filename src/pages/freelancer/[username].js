import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase.config";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FaStar,
  FaMapMarkerAlt,
  FaGlobe,
  FaEnvelope,
  FaPhone,
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaCheckCircle,
  FaCode,
  FaLaptopCode,
  FaPaintBrush,
  FaCamera,
  FaVideo,
  FaMusic,
  FaPen,
} from "react-icons/fa";
import {
  FiMessageSquare,
  FiBriefcase,
  FiUser,
  FiDownload,
  FiExternalLink,
  FiAward,
  FiTrendingUp,
} from "react-icons/fi";
import Head from "next/head";
import Image from "next/image";

export default function FreelancerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const router = useRouter();
  const { username } = router.query;
  const { user } = useAuth();

  useEffect(() => {
    if (username) {
      fetchProfile();
      fetchPortfolio();
    }
  }, [username, fetchProfile, fetchPortfolio]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (error) throw error;
      if (!data) {
        setError("Profile not found");
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .eq("user_id", profile?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPortfolio(data || []);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    }
  };

  const getSkillIcon = (skill) => {
    const lowerSkill = skill.toLowerCase();
    if (
      lowerSkill.includes("web") ||
      lowerSkill.includes("code") ||
      lowerSkill.includes("programming") ||
      lowerSkill.includes("developer")
    ) {
      return <FaCode className="mr-2" />;
    } else if (
      lowerSkill.includes("design") ||
      lowerSkill.includes("ui") ||
      lowerSkill.includes("ux")
    ) {
      return <FaPaintBrush className="mr-2" />;
    } else if (lowerSkill.includes("photo") || lowerSkill.includes("image")) {
      return <FaCamera className="mr-2" />;
    } else if (lowerSkill.includes("video") || lowerSkill.includes("film")) {
      return <FaVideo className="mr-2" />;
    } else if (lowerSkill.includes("music") || lowerSkill.includes("audio")) {
      return <FaMusic className="mr-2" />;
    } else if (lowerSkill.includes("write") || lowerSkill.includes("content")) {
      return <FaPen className="mr-2" />;
    } else {
      return <FaLaptopCode className="mr-2" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{error}</h1>
        <Link href="/" className="text-indigo-600 hover:text-indigo-800">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{profile?.full_name} | Freelancer Profile</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white shadow rounded-lg overflow-hidden"
          >
            {/* Profile Header */}
            <div className="relative h-48 bg-gradient-to-r from-indigo-500 to-purple-600">
              <div className="absolute -bottom-16 left-8">
                <div className="h-32 w-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                  <Image
                    src={profile.avatar_url || "/images/default-avatar.png"}
                    alt={profile.full_name}
                    width={150}
                    height={150}
                    className="rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="pt-20 pb-8 px-8">
              <div className="flex flex-col md:flex-row justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profile.full_name}
                  </h1>
                  <p className="text-xl text-indigo-600">{profile.title}</p>
                  <div className="mt-2 flex items-center space-x-4">
                    {profile.location && (
                      <div className="flex items-center text-gray-500">
                        <FaMapMarkerAlt className="mr-1" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center text-gray-500">
                        <FaGlobe className="mr-1" />
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-indigo-600"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
                  {user && user.id !== profile.id && (
                    <>
                      <Link
                        href={`/messages/${profile.username}`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FiMessageSquare className="mr-2" />
                        Message
                      </Link>
                      <Link
                        href={`/projects/new?freelancer=${profile.username}`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md shadow-sm text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FiBriefcase className="mr-2" />
                        Hire for Project
                      </Link>
                    </>
                  )}
                  {!user && (
                    <>
                      <Link
                        href="/login"
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FiMessageSquare className="mr-2" />
                        Login to Contact
                      </Link>
                      <Link
                        href="/signup"
                        className="inline-flex items-center justify-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md shadow-sm text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FiUser className="mr-2" />
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FiAward className="mr-2 text-indigo-500" />
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                    >
                      {getSkillIcon(skill)}
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* About */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FiTrendingUp className="mr-2 text-indigo-500" />
                  About
                </h2>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {profile.bio}
                </p>
              </div>

              {/* Portfolio */}
              {portfolio.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FaStar className="mr-2 text-indigo-500" />
                    Portfolio
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {portfolio.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        {item.image_url && (
                          <div className="h-48 overflow-hidden">
                            <Image
                              src={
                                item.image_url || "/images/default-project.png"
                              }
                              alt={item.title}
                              width={300}
                              height={200}
                              className="rounded-lg object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {item.description}
                          </p>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              <FiExternalLink className="mr-1" />
                              View Project
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FaEnvelope className="mr-2 text-indigo-500" />
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.email && (
                    <div className="flex items-center text-gray-600">
                      <FaEnvelope className="mr-2" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center text-gray-600">
                      <FaPhone className="mr-2" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FaGlobe className="mr-2 text-indigo-500" />
                  Social Links
                </h2>
                <div className="flex space-x-4">
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <FaLinkedin className="h-6 w-6" />
                    </a>
                  )}
                  {profile.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      <FaGithub className="h-6 w-6" />
                    </a>
                  )}
                  {profile.twitter_url && (
                    <a
                      href={profile.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-indigo-400 transition-colors"
                    >
                      <FaTwitter className="h-6 w-6" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
