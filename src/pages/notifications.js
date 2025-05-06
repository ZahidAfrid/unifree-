import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/firebase.config";
import { useAuth } from "@/contexts/AuthContext";
import {
  FiBell,
  FiCheck,
  FiX,
  FiMessageSquare,
  FiBriefcase,
  FiTrash2,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, read

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications, router]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Set up real-time subscription
    const subscription = {};

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]); // Only depend on user.id

  const fetchNotifications = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      let q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      let data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (filter === "unread") {
        data = data.filter((n) => !n.read);
      } else if (filter === "read") {
        data = data.filter((n) => n.read);
      }

      setNotifications(data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      toast.success("Marked as read");
    } catch (err) {
      console.error("Failed to mark as read", err);
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        where("read", "==", false)
      );
      const snapshot = await getDocs(q);

      await Promise.all(
        snapshot.docs.map((docSnap) => updateDoc(docSnap.ref, { read: true }))
      );

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All marked as read");
    } catch (err) {
      console.error("Failed to mark all as read", err);
      toast.error("Error marking all as read");
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(db, "notifications", notificationId));
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success("Notification deleted");
    } catch (err) {
      console.error("Error deleting", err);
      toast.error("Failed to delete notification");
    }
  };

  const clearAllNotifications = async () => {
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));

      setNotifications([]);
      toast.success("All notifications cleared");
    } catch (err) {
      console.error("Error clearing all", err);
      toast.error("Failed to clear notifications");
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if unread
      if (!notification.read) {
        await markAsRead(notification.id);
      }

      // Navigate based on notification type
      switch (notification.type) {
        case "message":
          router.push("/messages");
          break;
        case "proposal":
        case "proposal_accepted":
        case "proposal_rejected":
          if (notification.project_id) {
            router.push(`/projects/${notification.project_id}`);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error handling notification:", error);
      toast.error("Failed to process notification");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "message":
        return <FiMessageSquare className="h-5 w-5 text-blue-500" />;
      case "proposal":
        return <FiBriefcase className="h-5 w-5 text-green-500" />;
      case "proposal_accepted":
        return <FiCheck className="h-5 w-5 text-green-500" />;
      case "proposal_rejected":
        return <FiX className="h-5 w-5 text-red-500" />;
      default:
        return <FiBell className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                Notifications
              </h1>
              <div className="flex items-center space-x-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <FiTrash2 className="mr-1" />
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="mt-8 text-center py-12">
                <FiBell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No notifications
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  You&apos;re all caught up! No new notifications.
                </p>
              </div>
            ) : (
              <div className="mt-6 divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`py-4 ${!notification.read ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <span>
                            {new Date(
                              notification.createAt?.toDate?.() ||
                                notification.createdAt
                            ).toLocaleDateString()}
                          </span>
                          {notification.project && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="flex items-center">
                                <FiBriefcase className="mr-1" />
                                {notification.project.title}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="mt-2">
                          <button
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
