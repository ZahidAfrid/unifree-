import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBell, 
  FaFile, 
  FaProjectDiagram, 
  FaCheckCircle, 
  FaHandshake,
  FaClock,
  FaTimes,
  FaEye,
  FaEnvelope,
  FaUser
} from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { getUserNotifications } from '@/utils/notifications';
import { db } from '@/firebase/firebase.config';
import { doc, updateDoc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { formatDistanceToNow } from 'date-fns';

const NotificationCenter = ({ userType }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buttonRect, setButtonRect] = useState(null);
  const unsubscribeRef = useRef(null);
  const buttonRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to notifications
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'notifications'),
        where('recipientId', '==', user.uid),
        where('recipientType', '==', userType),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const newNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(newNotifications);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
      }
    );

    return () => unsubscribe();
  }, [user, userType]);

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.read) {
        await updateDoc(doc(db, 'notifications', notification.id), {
          read: true
        });
      }

      // Handle different notification types
      switch (notification.type) {
        case 'project_hired':
          router.push(`/projects/${notification.projectId}`);
          break;
        case 'document_shared':
          // Open document in new tab
          if (notification.documentUrl) {
            window.open(notification.documentUrl, '_blank');
          }
          break;
        case 'message_received':
          router.push(`/messages/${notification.senderId}`);
          break;
        case 'project_completed':
          router.push(`/projects/${notification.projectId}`);
          break;
        default:
          // For other types, just show the notification details
          setSelectedNotification(notification);
          setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleToggle = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonRect(rect);
    }
    setIsOpen(!isOpen);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'proposal':
        return <FaUser className="text-blue-500" />;
      case 'project_hired':
        return <FaProjectDiagram className="text-green-500" />;
      case 'timeline_update':
        return <FaClock className="text-blue-500" />;
      case 'document_upload':
        return <FaFile className="text-purple-500" />;
      case 'project_delivered':
        return <FaCheckCircle className="text-orange-500" />;
      case 'project_completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'project_handover':
        return <FaHandshake className="text-indigo-500" />;
      case 'message':
        return <FaEnvelope className="text-pink-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <FaBell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="ml-2">
                          <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {isModalOpen && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{selectedNotification.title}</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedNotification(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">{selectedNotification.message}</p>
            {selectedNotification.documentUrl && (
              <div className="mb-4">
                <a
                  href={selectedNotification.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  View Document
                </a>
              </div>
            )}
            <div className="text-sm text-gray-500">
              {formatDistanceToNow(selectedNotification.createdAt.toDate(), { addSuffix: true })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter; 