import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiFile, 
  FiImage, 
  FiVideo, 
  FiMusic, 
  FiFileText, 
  FiDownload,
  FiEye,
  FiX
} from 'react-icons/fi';

// Helper function to get file icon based on file type
const getFileIcon = (fileType) => {
  if (fileType.startsWith('image/')) return FiImage;
  if (fileType.startsWith('video/')) return FiVideo;
  if (fileType.startsWith('audio/')) return FiMusic;
  if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) return FiFileText;
  return FiFile;
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to check if file is an image
const isImage = (fileType) => fileType.startsWith('image/');

// Helper function to check if file is a video
const isVideo = (fileType) => fileType.startsWith('video/');

export default function FileAttachment({ attachment, isOwnMessage }) {
  const [showPreview, setShowPreview] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!attachment) return null;

  const { url, name, size, type } = attachment;
  const FileIcon = getFileIcon(type);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = () => {
    if (isImage(type) || isVideo(type)) {
      setShowPreview(true);
    } else {
      window.open(url, '_blank');
    }
  };

  // Image/Video preview component
  if (isImage(type)) {
    return (
      <>
        <div className="relative group cursor-pointer" onClick={handlePreview}>
          <img
            src={url}
            alt={name}
            className="max-w-xs max-h-48 rounded-lg object-cover"
            onLoad={() => setImageLoaded(true)}
          />
          {imageLoaded && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview();
                  }}
                  className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                >
                  <FiEye size={16} className="text-gray-700" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                >
                  <FiDownload size={16} className="text-gray-700" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-2 text-xs opacity-75">
          <p className="truncate">{name}</p>
          <p>{formatFileSize(size)}</p>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setShowPreview(false)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 p-2"
              >
                <FiX size={24} />
              </button>
              <img
                src={url}
                alt={name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 rounded-b-lg">
                <p className="font-medium">{name}</p>
                <p className="text-sm opacity-75">{formatFileSize(size)}</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Video preview component
  if (isVideo(type)) {
    return (
      <>
        <div className="relative group">
          <video
            src={url}
            controls
            className="max-w-xs max-h-48 rounded-lg"
            preload="metadata"
          />
        </div>
        
        <div className="mt-2 text-xs opacity-75">
          <p className="truncate">{name}</p>
          <p>{formatFileSize(size)}</p>
        </div>
      </>
    );
  }

  // Generic file component
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center space-x-3 p-3 rounded-lg border max-w-xs ${
        isOwnMessage 
          ? 'bg-white bg-opacity-20 border-white border-opacity-30' 
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className={`p-2 rounded-lg ${
        isOwnMessage ? 'bg-white bg-opacity-30' : 'bg-indigo-100'
      }`}>
        <FileIcon 
          size={20} 
          className={isOwnMessage ? 'text-white' : 'text-indigo-600'} 
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          isOwnMessage ? 'text-white' : 'text-gray-900'
        }`}>
          {name}
        </p>
        <p className={`text-xs ${
          isOwnMessage ? 'text-white text-opacity-75' : 'text-gray-500'
        }`}>
          {formatFileSize(size)}
        </p>
      </div>
      
      <div className="flex space-x-1">
        <button
          onClick={handlePreview}
          className={`p-1.5 rounded-lg transition-colors ${
            isOwnMessage 
              ? 'hover:bg-white hover:bg-opacity-20 text-white' 
              : 'hover:bg-gray-200 text-gray-600'
          }`}
          title="Preview"
        >
          <FiEye size={14} />
        </button>
        <button
          onClick={handleDownload}
          className={`p-1.5 rounded-lg transition-colors ${
            isOwnMessage 
              ? 'hover:bg-white hover:bg-opacity-20 text-white' 
              : 'hover:bg-gray-200 text-gray-600'
          }`}
          title="Download"
        >
          <FiDownload size={14} />
        </button>
      </div>
    </motion.div>
  );
} 