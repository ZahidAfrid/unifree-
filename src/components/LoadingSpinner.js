import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = 'md', text = 'Loading...', textPosition = 'bottom', className = '' }) {
  // Size variants
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  // Get spinner size class based on prop
  const sizeClass = sizes[size] || sizes.md;
  
  // Container classes based on text position
  const containerClass = textPosition === 'right' 
    ? 'flex items-center justify-center'
    : 'flex flex-col items-center justify-center';

  return (
    <div className={`${containerClass} ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
        className={`${sizeClass} rounded-full border-gray-300 border-t-indigo-600`}
      />
      
      {text && (
        <span className={`text-gray-600 dark:text-gray-300 font-medium ${textPosition === 'right' ? 'ml-3' : 'mt-3'}`}>
          {text}
        </span>
      )}
    </div>
  );
} 