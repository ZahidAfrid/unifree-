"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "@studio-freight/lenis";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

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

    return () => {
      lenis.destroy();
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const fullName = user.user_metadata?.full_name || "";
    if (fullName) {
      const nameParts = fullName.split(" ");
      return nameParts.length > 1
        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
        : nameParts[0][0].toUpperCase();
    }
    return user.email ? user.email.charAt(0).toUpperCase() : "U";
  };

  if (!isClient) return null;

  return (
    <motion.nav
      className="bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg text-white fixed top-0 left-0 w-full z-50 px-8 py-5 flex justify-between items-center transition-all duration-300"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Logo */}
      <motion.div
        className="text-3xl font-bold tracking-widest"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <Link href="/">UniFree</Link>
      </motion.div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex space-x-6">
        <Link href="/" className="text-lg hover:text-gray-300 transition duration-200">
          Home
        </Link>
        <Link href="/about" className="text-lg hover:text-gray-300 transition duration-200">
          About Us
        </Link>
        <Link href="/explore" className="text-lg hover:text-gray-300 transition duration-200">
          Explore
        </Link>
        {user && (
          <Link href="/messaging" className="text-lg hover:text-gray-300 transition duration-200">
            Messages
          </Link>
        )}
      </div>

      {/* User Profile Dropdown (Desktop) */}
      <div className="hidden md:flex items-center relative">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-10 h-10 flex items-center justify-center bg-yellow-400 text-gray-900 font-bold rounded-full hover:bg-yellow-500 transition duration-200"
            >
              {getUserInitials()}
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  className="absolute right-0 mt-2 w-48 bg-white text-gray-900 rounded-lg shadow-lg overflow-hidden"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href="/dashboard" className="block px-4 py-2 hover:bg-gray-200 transition duration-200">
                    Dashboard
                  </Link>
                  <Link href="/messaging" className="block px-4 py-2 hover:bg-gray-200 transition duration-200">
                    Messages
                  </Link>
                  <Link href="/settings" className="block px-4 py-2 hover:bg-gray-200 transition duration-200">
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-100 transition duration-200"
                  >
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <>
            <Link href="/login">
              <button className="py-2 px-5 rounded-full bg-yellow-300 text-gray-900 shadow-lg hover:bg-yellow-500 transition duration-200 transform hover:scale-110">
                Log in
              </button>
            </Link>
            <Link href="/signup">
              <button className="py-2 px-5 rounded-full bg-yellow-400 text-gray-900 shadow-lg hover:bg-yellow-500 transition duration-200 hover:scale-110">
                Sign up
              </button>
            </Link>
          </>
        )}
      </div>

      {/* Hamburger Menu for Mobile */}
      <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden focus:outline-none">
        <div className={`w-6 h-0.5 bg-white mb-1 transition-all ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
        <div className={`w-6 h-0.5 bg-white mb-1 transition-all ${isMenuOpen ? "opacity-0" : ""}`} />
        <div className={`w-6 h-0.5 bg-white transition-all ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="absolute top-full left-0 w-full bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg flex flex-col items-center space-y-4 py-6 z-50 md:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/" className="text-lg hover:text-gray-300 transition duration-200">
              Home
            </Link>
            <Link href="/about" className="text-lg hover:text-gray-300 transition duration-200">
              About Us
            </Link>
            <Link href="/explore" className="text-lg hover:text-gray-300 transition duration-200">
              Explore
            </Link>
            {user && (
              <Link href="/messaging" className="text-lg hover:text-gray-300 transition duration-200">
                Messages
              </Link>
            )}
            {user ? (
              <>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-10 h-10 flex items-center justify-center bg-yellow-400 text-gray-900 font-bold rounded-full hover:bg-yellow-500 transition duration-200"
                >
                  {getUserInitials()}
                </button>

                {isDropdownOpen && (
                  <motion.div
                    className="mt-2 w-48 bg-white text-gray-900 rounded-lg shadow-lg overflow-hidden"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link href="/dashboard" className="block px-4 py-2 hover:bg-gray-200">
                      Dashboard
                    </Link>
                    <Link href="/messaging" className="block px-4 py-2 hover:bg-gray-200">
                      Messages
                    </Link>
                    <Link href="/settings" className="block px-4 py-2 hover:bg-gray-200">
                      Settings
                    </Link>
                    <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-100">
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </>
            ) : (
              <>
                <Link href="/login" className="text-lg hover:text-gray-300 transition duration-200">
                  Log in
                </Link>
                <Link href="/signup" className="text-lg hover:text-gray-300 transition duration-200">
                  Sign up
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
