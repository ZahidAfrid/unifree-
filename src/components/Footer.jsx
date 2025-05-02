// Create a responsive footer component using next.js and Tailwind CSS
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <motion.footer 
      className={`${styles.footer} bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-12 px-8`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Company Info */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">UniFree</h3>
          <p className="text-gray-300">
            Empowering students with free educational resources and opportunities.
          </p>
          <div className={`${styles.socialLinks} flex space-x-4`}>
            <a href="#" className="hover:text-yellow-300 transition-colors">
              <i className="fab fa-twitter text-xl"></i>
            </a>
            <a href="#" className="hover:text-yellow-300 transition-colors">
              <i className="fab fa-facebook text-xl"></i>
            </a>
            <a href="#" className="hover:text-yellow-300 transition-colors">
              <i className="fab fa-instagram text-xl"></i>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h4 className="text-xl font-semibold">Quick Links</h4>
          <ul className={`${styles.quickLinks} space-y-2`}>
            <li>
              <Link href="/" className="hover:text-yellow-300 transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-yellow-300 transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-yellow-300 transition-colors">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-yellow-300 transition-colors">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h4 className="text-xl font-semibold">Contact Us</h4>
          <div className={`${styles.contactInfo} space-y-2`}>
            <p>
              <i className="fas fa-envelope mr-2"></i>
              info@unifree.edu
            </p>
            <p>
              <i className="fas fa-phone mr-2"></i>
              +1 (555) 123-4567
            </p>
            <p>
              <i className="fas fa-map-marker-alt mr-2"></i>
              123 Education Street
              <br />
              Learning City, ED 12345
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={`${styles.bottomBar} border-t border-gray-600 mt-8 pt-8 text-center`}>
        <p className="text-gray-300">
          © {new Date().getFullYear()} UniFree. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
};

export default Footer;
