import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaRegStar, FaUser, FaUserTie, FaThumbsUp, FaComment } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/firebase.config';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

const ReviewSystem = ({ projectId, targetUserId, targetUserType, onReviewSubmitted }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  useEffect(() => {
    checkExistingReview();
  }, [projectId, user?.uid]);

  const checkExistingReview = async () => {
    if (!user?.uid || !projectId) return;

    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('projectId', '==', projectId),
        where('reviewerId', '==', user.uid),
        where('revieweeId', '==', targetUserId)
      );
      
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      if (!reviewsSnapshot.empty) {
        const review = reviewsSnapshot.docs[0].data();
        setExistingReview(review);
        setHasReviewed(true);
        setRating(review.rating);
        setComment(review.comment);
      }
    } catch (error) {
      console.error('Error checking existing review:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user?.uid) {
      toast.error('You must be logged in to submit a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      toast.error('Please provide a detailed review (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData = {
        projectId,
        reviewerId: user.uid,
        reviewerName: user.displayName || 'Anonymous',
        reviewerType: targetUserType === 'freelancer' ? 'client' : 'freelancer',
        revieweeId: targetUserId,
        revieweeType: targetUserType,
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'reviews'), reviewData);
      
      setHasReviewed(true);
      toast.success('Review submitted successfully!');
      
      if (onReviewSubmitted) {
        onReviewSubmitted(reviewData);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (currentRating, interactive = false) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive || hasReviewed}
            onClick={() => interactive && !hasReviewed && setRating(star)}
            onMouseEnter={() => interactive && !hasReviewed && setHoverRating(star)}
            onMouseLeave={() => interactive && !hasReviewed && setHoverRating(0)}
            className={`text-2xl transition-colors ${
              interactive && !hasReviewed ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            }`}
          >
            {star <= (hoverRating || currentRating) ? (
              <FaStar className="text-yellow-400" />
            ) : (
              <FaRegStar className="text-gray-300" />
            )}
          </button>
        ))}
      </div>
    );
  };

  if (hasReviewed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 border border-green-200 rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
            <FaThumbsUp className="text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-800">Review Submitted</h3>
            <p className="text-sm text-green-600">Thank you for your feedback!</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {targetUserType === 'freelancer' ? (
                <FaUser className="text-green-600" />
              ) : (
                <FaUserTie className="text-blue-600" />
              )}
              <span className="font-medium text-gray-900">
                Your review for this {targetUserType}
              </span>
            </div>
            {renderStars(rating, false)}
          </div>
          <p className="text-gray-700 text-sm">{comment}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-full">
          <FaComment className="text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Leave a Review</h3>
          <p className="text-sm text-gray-600">
            Share your experience working with this {targetUserType}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-4">
            {renderStars(rating, true)}
            <span className="text-sm text-gray-600">
              {rating > 0 && (
                <>
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Comment <span className="text-red-500">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Share your experience working with this ${targetUserType}...`}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            rows="4"
            maxLength="500"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              Minimum 10 characters required
            </p>
            <p className="text-xs text-gray-500">
              {comment.length}/500
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmitReview}
            disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              isSubmitting || rating === 0 || comment.trim().length < 10
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </div>
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewSystem; 