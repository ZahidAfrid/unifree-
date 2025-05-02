import { motion } from "framer-motion";

export default function FreelancerCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <motion.div
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700"
          />
          <div className="flex-1">
            <motion.div
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"
            />
            <motion.div
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"
            />
          </div>
        </div>

        <motion.div
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"
        />

        <div className="flex flex-wrap gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"
            />
          ))}
        </div>

        <motion.div
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"
        />
      </div>
    </div>
  );
} 