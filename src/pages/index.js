"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardNavigation } from "@/components/DashboardRedirect";
import illustration from "../assets/images/Image2.png";
import Enhancing from "../assets/images/img4.png";
import {
  FiSearch,
  FiArrowRight,
  FiStar,
  FiUsers,
  FiBriefcase,
  FiAward,
  FiCheckCircle,
  FiTrendingUp,
  FiZap,
  FiGlobe,
  FiUser,
} from "react-icons/fi";
import { FaStarHalfAlt, FaRegStar } from "react-icons/fa";

import {
  FaRocket,
  FaLightbulb,
  FaHandshake,
  FaChartLine,
  FaUserGraduate,
  FaCode,
  FaPaintBrush,
  FaCamera,
  FaVideo,
  FaMusic,
  FaPen,
  FaBriefcase,
  FaStar,
  FaCheckCircle,
} from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import Lenis from "@studio-freight/lenis";
import Head from "next/head";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase.config";

const heroWords = [
  "Freelancers",
  "Creatives",
  "Innovators",
  "Developers",
  "Designers",
];

export default function Home() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const scrollRef = useRef(null);
  const router = useRouter();
  const { user } = useAuth();
  const navigateToDashboard = useDashboardNavigation();
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [topFreelancers, setTopFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const freelancerSnap = await getDocs(
          collection(db, "freelancer_profiles")
        );
        const freelancerList = freelancerSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          profileImage: doc.data().profileImage || "/images/default-avatar.png",
          rating: 4.5,
        }));
        setTopFreelancers(freelancerList);

        const projectsSnap = await getDocs(
          query(
            collection(db, "projects"),
            where("visibility", "==", "public"),
            orderBy("createdAt", "desc")
          )
        );
        const projectList = projectsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          budget: `$${doc.data().budget || 0}`,
        }));
        setFeaturedProjects(projectList);
        setLoading(false);
      } catch (err) {
        console.error("Error loading homepage data:", err);
      }
    };

    fetchHomeData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % heroWords.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const features = [
    {
      icon: <FaUserGraduate className="w-8 h-8" />,
      title: "University Student Talent",
      description:
        "Connect with talented university students from top institutions worldwide.",
    },
    {
      icon: <FaBriefcase className="w-8 h-8" />,
      title: "Project Showcase",
      description:
        "Browse through student portfolios and find the perfect talent for your project.",
    },
    {
      icon: <FaStar className="w-8 h-8" />,
      title: "Quality Work",
      description:
        "Get high-quality work from students who are passionate about their fields.",
    },
    {
      icon: <FaCheckCircle className="w-8 h-8" />,
      title: "Verified Profiles",
      description:
        "All student profiles are verified through their university email addresses.",
    },
  ];

  const benefits = [
    {
      icon: <FaRocket className="w-6 h-6" />,
      title: "Fast Turnaround",
      description:
        "Get your projects completed quickly with our efficient workflow.",
    },
    {
      icon: <FaLightbulb className="w-6 h-6" />,
      title: "Fresh Perspectives",
      description:
        "Benefit from innovative ideas and creative solutions from young talent.",
    },
    {
      icon: <FaHandshake className="w-6 h-6" />,
      title: "Secure Payments",
      description:
        "Our platform ensures safe and secure transactions for all parties.",
    },
    {
      icon: <FaChartLine className="w-6 h-6" />,
      title: "Growth Opportunities",
      description:
        "Build your portfolio and gain real-world experience while studying.",
    },
  ];

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
      return <FiZap className="mr-2" />;
    }
  };
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />);
      }
    }

    return stars;
  };

  return (
    <>
      <Head>
        <title>
          Student Freelance Platform | Connect with University Talent
        </title>
        <meta
          name="description"
          content="Connect with talented university students for your projects or find freelance opportunities as a student."
        />
      </Head>
      <div ref={scrollRef} className="overflow-hidden">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-between relative z-10">
            <div className="max-w-lg md:w-1/2 text-center md:text-left">
              <motion.h1
                className="text-4xl md:text-6xl font-bold flex flex-wrap items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Empowering Student
                <span className="relative inline-block text-yellow-300 ml-2 min-w-[340px] md:min-w-[360px] h-[40px] md:h-[50px] overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentWordIndex}
                      className="absolute w-full text-left min-w-max"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.6 }}
                    >
                      {heroWords[currentWordIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </motion.h1>
              <motion.p
                className="text-lg md:text-xl mt-4 opacity-90"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Find the best freelance projects & unlock your full potential.
              </motion.p>

              <motion.form
                onSubmit={handleSearch}
                className="mt-8 flex items-center bg-white/10 backdrop-blur-md rounded-full shadow-lg overflow-hidden border border-white/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <input
                  type="text"
                  placeholder="Search for projects, skills, or freelancers..."
                  className="w-full px-6 py-4 text-white placeholder-white/70 focus:outline-none text-sm md:text-base bg-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-yellow-400 text-gray-900 font-semibold px-6 py-4 rounded-r-full hover:bg-yellow-500 transition text-sm md:text-base flex items-center"
                >
                  <FiSearch className="mr-2" />
                  Search
                </button>
              </motion.form>

              <motion.div
                className="mt-8 flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                {user ? (
                  <button
                    onClick={navigateToDashboard}
                    className="bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-yellow-500 transition text-sm md:text-base w-full sm:w-auto flex items-center justify-center"
                  >
                    <FiTrendingUp className="mr-2" />
                    Go to Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => router.push("/signup")}
                      className="bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-yellow-500 transition text-sm md:text-base w-full sm:w-auto flex items-center justify-center"
                    >
                      <FaRocket className="mr-2" />
                      Sign Up
                    </button>
                    <button
                      onClick={() => router.push("/login")}
                      className="bg-transparent border-2 border-white text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-white hover:text-indigo-700 transition text-sm md:text-base w-full sm:w-auto flex items-center justify-center"
                    >
                      <FiUser className="mr-2" />
                      Login
                    </button>
                  </>
                )}
              </motion.div>
            </div>

            <motion.div
              className="relative w-full md:w-[450px] mt-10 md:mt-0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <Image
                src={illustration}
                alt="Hero illustration"
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Why Choose Our Platform
              </h2>
              <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                The best way to connect university students with clients
                worldwide
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 flex flex-col items-center text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Project Showcase Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Featured Projects
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Latest opportunities from clients
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading
                ? // Loading skeletons
                  [...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl shadow-md p-6 animate-pulse"
                    >
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))
                : featuredProjects.slice(0, 6).map((project, index) => (
                    <Link href={`/projects/${project.id}`} key={project.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow group cursor-pointer"
                      >
                        <div className="p-6">
                          <div className="flex items-center mb-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                              <FiBriefcase />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {project.title}
                            </h3>
                          </div>
                          <p className="text-gray-600 line-clamp-3 mb-4">
                            {project.description}
                          </p>
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <span className="text-indigo-600 font-semibold">
                              {project.budget}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
            </div>

            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Link
                href="/explore?tab=projects"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md"
              >
                View All Projects
                <FiArrowRight className="ml-2" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Enhance Your Skills Section */}
        <section className="py-16 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <motion.div
                className="md:w-1/2 text-left"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold">
                  Enhance Your Skills
                </h2>
                <p className="text-lg mt-4">
                  Access expert-led tutorials, exclusive resources, and
                  mentorship programs.
                </p>
                <button className="mt-8 px-6 py-3 bg-indigo-800 text-white font-semibold rounded-full shadow-lg hover:bg-indigo-900 transition text-base flex items-center">
                  <FiZap className="mr-2" />
                  Sign Up for Free
                </button>
              </motion.div>

              <motion.div
                className="md:w-1/2 flex justify-end mt-8 md:mt-0"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <Image
                    src={Enhancing}
                    alt="Enhancing illustration"
                    width={600}
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Our Key Features
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Everything you need to succeed in the freelance world
              </p>
            </motion.div>

            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow"
                >
                  <div className="text-indigo-600 mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Top Freelancers Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="flex justify-between items-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900">
                  Top Freelancers
                </h2>
                <p className="mt-2 text-xl text-gray-600">
                  Meet our most successful student freelancers
                </p>
              </div>
              <Link
                href="/explore?tab=freelancers"
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
              >
                View All Freelancers
                <FiArrowRight className="ml-2" />
              </Link>
            </motion.div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-md p-6 animate-pulse"
                  >
                    <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <Swiper
                spaceBetween={16}
                slidesPerView={1.2}
                breakpoints={{
                  640: { slidesPerView: 2.2 },
                  1024: { slidesPerView: 3.2 },
                  1280: { slidesPerView: 4 },
                }}
              >
                {topFreelancers.slice(0, 6).map((freelancer) => (
                  <SwiperSlide key={freelancer.id}>
                    <div className="bg-white rounded-xl shadow-md p-6 text-center group hover:shadow-xl transition-shadow">
                      <Image
                        src={
                          freelancer.profileImage ||
                          "/images/default-avatar.png"
                        }
                        alt={freelancer.name}
                        width={96}
                        height={96}
                        className="h-24 w-24 rounded-full mx-auto border-4 border-white shadow-md object-cover"
                      />
                      <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                        {freelancer.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {freelancer.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {freelancer.university}
                      </p>
                      <div className="mt-2 flex justify-center">
                        {renderStars(freelancer.rating)}
                      </div>
                      <Link
                        href={`/freelancers/${freelancer.id}`}
                        className="mt-4 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        View Profile <FiArrowRight className="ml-1" />
                      </Link>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Ready to Get Started?
              </h2>
              <p className="mt-4 text-xl text-indigo-100">
                Join our platform today and connect with talented university
                students or find your next project.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-indigo-600 bg-white hover:bg-indigo-50 transition-colors shadow-lg"
                >
                  <FaRocket className="mr-2" />
                  Sign Up Now
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-full text-white hover:bg-indigo-700 transition-colors"
                >
                  <FiGlobe className="mr-2" />
                  Contact Us
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
