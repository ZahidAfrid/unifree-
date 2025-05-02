"use client";
import { useEffect, useRef } from "react";
import Lenis from "@studio-freight/lenis";
import { motion } from "framer-motion";
import styles from "./about.module.css";
import {
  FiUsers,
  FiBook,
  FiGlobe,
  FiTarget,
  FiAward,
  FiCheckCircle,
  FiTrendingUp,
  FiZap,
} from "react-icons/fi";
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
import Image from "next/image";

// Smooth scrolling with Lenis
const useSmoothScroll = () => {
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
};

export default function About() {
  useSmoothScroll(); // Activate smooth scrolling

  const stats = [
    {
      label: "Active Students",
      value: "10,000+",
      icon: <FaUserGraduate className="w-8 h-8" />,
    },
    {
      label: "Completed Projects",
      value: "5,000+",
      icon: <FaBriefcase className="w-8 h-8" />,
    },
    {
      label: "Client Satisfaction",
      value: "98%",
      icon: <FaStar className="w-8 h-8" />,
    },
    {
      label: "Universities",
      value: "500+",
      icon: <FiGlobe className="w-8 h-8" />,
    },
  ];

  const values = [
    {
      icon: <FaUserGraduate className="w-8 h-8" />,
      title: "Student-First Approach",
      description:
        "We prioritize the growth and success of university students, providing them with real-world opportunities.",
    },
    {
      icon: <FaBriefcase className="w-8 h-8" />,
      title: "Academic Excellence",
      description:
        "Our platform connects clients with students from top universities, ensuring high-quality work.",
    },
    {
      icon: <FiGlobe className="w-8 h-8" />,
      title: "Global Reach",
      description:
        "We connect students and clients from around the world, fostering international collaboration.",
    },
    {
      icon: <FiTarget className="w-8 h-8" />,
      title: "Innovation Focus",
      description:
        "We encourage innovative solutions and creative thinking in all projects.",
    },
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "Founder & CEO",
      image: "/images/team/placeholder-1.jpg",
      bio: "Former university professor with 15 years of experience in education and technology.",
    },
    {
      name: "Michael Chen",
      role: "CTO",
      image: "/images/team/placeholder-2.jpg",
      bio: "Tech entrepreneur and former student freelancer with a passion for connecting talent with opportunity.",
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Student Success",
      image: "/images/team/placeholder-3.jpg",
      bio: "Career counselor specializing in student development and professional growth.",
    },
  ];

  return (
    <motion.div
      className={`${styles.aboutContainer} p-8 min-h-screen flex flex-col items-center justify-center text-center`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {/* Hero Section */}
      <section className="relative w-full py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            className="text-5xl md:text-6xl font-extrabold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            About <span className="text-yellow-400">UniFree</span>
          </motion.h1>
          <motion.p
            className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            UniFree is a next-generation freelancing platform built exclusively
            for university students. We help talented students connect with
            potential clients, build real-world experience, and earn money while
            they study.
          </motion.p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-xl transition-shadow"
              >
                <div className="text-indigo-600 mb-4 flex justify-center">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-indigo-700">
                  {stat.value}
                </div>
                <div className="mt-2 text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Our Mission
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              We&apos;re on a mission to connect talented students with exciting
              opportunities. Whether you&apos;re looking to hire or be hired,
              we&apos;ve got you covered.
            </p>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="text-indigo-600 mb-4">{value.icon}</div>
                <h3 className="text-lg font-medium text-gray-900">
                  {value.title}
                </h3>
                <p className="mt-2 text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
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
              Meet Our Team
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              The passionate people behind UniFree
            </p>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-64">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="100%"
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-medium text-gray-900">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm text-indigo-600">{member.role}</p>
                  <p className="mt-4 text-gray-600">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
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
              Join Our Community
            </h2>
            <p className="mt-4 text-xl text-indigo-100">
              Whether you are a student looking for opportunities or a client
              seeking talent, we did love to have you on board.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <motion.a
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-indigo-600 bg-white hover:bg-indigo-50 transition-colors shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaRocket className="mr-2" />
                Get Started
              </motion.a>
              <motion.a
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-full text-white hover:bg-indigo-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiGlobe className="mr-2" />
                Contact Us
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
