import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaTimes, 
  FaStar, 
  FaCalendarAlt, 
  FaMoneyBillWave,
  FaUser,
  FaClipboardCheck,
  FaThumbsUp
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const ProjectCompletionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  project, 
  freelancerName,
  loading = false 
}) => {
  const [completionNotes, setCompletionNotes] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!completionNotes.trim()) {
      toast.error('Please provide completion notes');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        notes: completionNotes,
        rating,
        projectId: project.id
      });
      onClose();
      setCompletionNotes('');
      setRating(5);
    } catch (error) {
      console.error('Error completing project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Mark Project as Completed
                </h3>
                <p className="text-sm text-gray-500">
                  Finalize and close this project
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          {/* Project Details */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6 border border-blue-100">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <FaClipboardCheck className="mr-2 text-blue-600" />
              {project?.title}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <FaUser className="text-gray-500" />
                <span className="text-gray-600">Freelancer:</span>
                <span className="font-medium">{freelancerName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaMoneyBillWave className="text-gray-500" />
                <span className="text-gray-600">Budget:</span>
                <span className="font-medium">${project?.budget}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaCalendarAlt className="text-gray-500" />
                <span className="text-gray-600">Started:</span>
                <span className="font-medium">
                  {project?.createdAt ? new Date(project.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Completion Form */}
          <div className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate the freelancer&apos;s work
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-colors ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400`}
                  >
                    <FaStar />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {rating} out of 5 stars
                </span>
              </div>
            </div>

            {/* Completion Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Completion Notes *
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Describe the project outcome, quality of work, and any final comments..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                rows={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                These notes will be shared with the freelancer and added to the project history.
              </p>
            </div>

            {/* Completion Checklist */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                <FaThumbsUp className="mr-2 text-green-600" />
                Completion Checklist
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <FaCheckCircle className="text-green-500" />
                  <span>All project deliverables have been received</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaCheckCircle className="text-green-500" />
                  <span>Work quality meets your expectations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaCheckCircle className="text-green-500" />
                  <span>All communications have been resolved</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaCheckCircle className="text-green-500" />
                  <span>Payment will be processed upon completion</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !completionNotes.trim()}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Completing...</span>
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  <span>Complete Project</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectCompletionModal; 