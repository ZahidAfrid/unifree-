import { motion } from "framer-motion";

export default function ProjectCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <motion.div
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"
        />

        <motion.div
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"
        />

        <motion.div
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6"
        />

        <div className="flex flex-wrap gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"
            />
          ))}
        </div>

        <div className="flex justify-between items-center">
          <motion.div
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"
          />
          <motion.div
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"
          />
        </div>
      </div>
    </div>
  );
} 