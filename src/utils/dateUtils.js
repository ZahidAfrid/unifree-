export const formatDate = (timestamp) => {
  if (!timestamp) return "Unknown date";
  
  try {
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    } else if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    } else if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleDateString();
    }
    return "Invalid date";
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

export const formatDateTime = (timestamp) => {
  if (!timestamp) return "Unknown date";
  
  try {
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    } else if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    } else if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleString();
    }
    return "Invalid date";
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

export const getRelativeTime = (timestamp) => {
  if (!timestamp) return "Unknown time";
  
  try {
    let date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return "Invalid time";
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (error) {
    console.error("Error getting relative time:", error);
    return "Invalid time";
  }
}; 