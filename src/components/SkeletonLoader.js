import { motion } from 'framer-motion';

export default function SkeletonLoader({ className = "", count = 1 }) {
  const shimmerVariants = {
    initial: { opacity: 0.5 },
    animate: { opacity: 0.8 },
    exit: { opacity: 0.5 }
  };

  const shimmerTransition = {
    duration: 1,
    repeat: Infinity,
    repeatType: "reverse"
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <motion.div
          key={index}
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={shimmerTransition}
          className={`bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}
        />
      ))}
    </>
  );
} 