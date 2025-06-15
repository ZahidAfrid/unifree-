import { motion } from 'framer-motion';
import { 
  FaTimes, 
  FaCheckCircle, 
  FaHandshake, 
  FaFileAlt, 
  FaDownload,
  FaUser,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaClipboardCheck,
  FaStar,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { useState } from 'react';

const NotificationDetailModal = ({ 
  isOpen, 
  onClose, 
  notification,
  onMarkAsRead,
  onNavigate 
}) => {
  const [isDownloading, setIsDownloading] = useState({});

  const handleDownload = async (document, index) => {
    setIsDownloading(prev => ({ ...prev, [index]: true }));
    try {
      const link = document.createElement('a');
      link.href = document.url;
      link.download = document.name;
      link.click();
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(prev => ({ ...prev, [index]: false }));
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    try {
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString();
      } else if (timestamp instanceof Date) {
        return timestamp.toLocaleString();
      }
      return 'Unknown date';
    } catch (error) {
      return 'Unknown date';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'project_completed':
        return <FaCheckCircle className="text-green-600 text-2xl" />;
      case 'project_handover':
        return <FaHandshake className="text-purple-600 text-2xl" />;
      case 'document_upload':
        return <FaFileAlt className="text-blue-600 text-2xl" />;
      default:
        return <FaClipboardCheck className="text-indigo-600 text-2xl" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'project_completed':
        return 'from-green-50 to-emerald-50 border-green-100';
      case 'project_handover':
        return 'from-purple-50 to-indigo-50 border-purple-100';
      case 'document_upload':
        return 'from-blue-50 to-cyan-50 border-blue-100';
      default:
        return 'from-gray-50 to-slate-50 border-gray-100';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen || !notification) return null;

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
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-full">
                {getNotificationIcon(notification.type)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {notification.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDate(notification.createdAt)}
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

          {/* Notification Content */}
          <div className={`bg-gradient-to-r ${getNotificationColor(notification.type)} p-4 rounded-lg mb-6 border`}>
            <p className="text-gray-800 leading-relaxed">
              {notification.message}
            </p>
          </div>

          {/* Project Details */}
          {notification.projectTitle && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <FaClipboardCheck className="mr-2 text-gray-600" />
                Project: {notification.projectTitle}
              </h4>
              {notification.projectId && (
                <button
                  onClick={() => onNavigate && onNavigate(`/projects/${notification.projectId}`)}
                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <FaExternalLinkAlt className="mr-1" />
                  View Project Details
                </button>
              )}
            </div>
          )}

          {/* Handover Specific Content */}
          {notification.type === 'project_handover' && notification.handoverMessage && (
            <div className="mb-6">
              <h5 className="font-medium text-gray-900 mb-2">Handover Message:</h5>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-gray-800 italic">
                  &quot;{notification.handoverMessage}&quot;
                </p>
              </div>
            </div>
          )}

          {/* Documents Section for Handover */}
          {notification.type === 'project_handover' && notification.documents && notification.documents.length > 0 && (
            <div className="mb-6">
              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                <FaFileAlt className="mr-2 text-purple-600" />
                Project Deliverables ({notification.documents.length})
              </h5>
              <div className="space-y-2">
                {notification.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                    <div className="flex items-center space-x-3">
                      <FaFileAlt className="text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.size)} • {doc.type}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(doc, index)}
                      disabled={isDownloading[index]}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isDownloading[index] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <>
                          <FaDownload className="mr-1" />
                          Download
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completion Details */}
          {notification.type === 'project_completed' && (
            <div className="mb-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                  <FaCheckCircle className="mr-2 text-green-600" />
                  Project Completed Successfully
                </h5>
                <p className="text-sm text-gray-700">
                  The client has marked this project as completed. You can now leave a review and the payment will be processed.
                </p>
                {notification.completionNotes && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-sm text-gray-800">
                      <strong>Client Notes:</strong> {notification.completionNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Information */}
          {(notification.freelancerName || notification.clientName) && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-center space-x-2">
                <FaUser className="text-gray-500" />
                <span className="text-sm text-gray-600">From:</span>
                <span className="text-sm font-medium text-gray-900">
                  {notification.freelancerName || notification.clientName}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="flex space-x-3">
              {!notification.read && (
                <button
                  onClick={() => onMarkAsRead && onMarkAsRead(notification.id)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <FaCheckCircle className="mr-2" />
                  Mark as Read
                </button>
              )}
              
              {notification.projectId && (
                <button
                  onClick={() => onNavigate && onNavigate(`/projects/${notification.projectId}`)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  <FaExternalLinkAlt className="mr-2" />
                  View Project
                </button>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotificationDetailModal; 