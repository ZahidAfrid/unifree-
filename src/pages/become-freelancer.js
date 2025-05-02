import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import FreelancerRegistration from '@/components/FreelancerRegistration';
import { motion } from 'framer-motion';
import styles from '@/styles/BecomeFreelancer.module.css';

export default function BecomeFreelancer() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Become a Freelancer</h1>
        <p>Join our community of talented university students and showcase your skills to potential clients.</p>
      </motion.div>

      <div className={styles.content}>
        <div className={styles.infoSection}>
          <motion.div 
            className={styles.infoCard}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className={styles.iconWrapper}>
              <i className="fas fa-graduation-cap"></i>
            </div>
            <h2>For University Students</h2>
            <p>Our platform is exclusively designed for university students looking to gain real-world experience and earn while they learn.</p>
          </motion.div>

          <motion.div 
            className={styles.infoCard}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className={styles.iconWrapper}>
              <i className="fas fa-laptop-code"></i>
            </div>
            <h2>Showcase Your Skills</h2>
            <p>Create a professional profile highlighting your education, skills, and experience to stand out to potential clients.</p>
          </motion.div>

          <motion.div 
            className={styles.infoCard}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className={styles.iconWrapper}>
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <h2>Earn Money</h2>
            <p>Set your own rates and work on projects that match your skills and schedule, providing you with valuable income during your studies.</p>
          </motion.div>
        </div>

        <div className={styles.registrationSection}>
          <FreelancerRegistration />
        </div>
      </div>
    </div>
  );
} 