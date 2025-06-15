import { useState, useRef, useEffect } from 'react';
import { FiPlay, FiPause, FiDownload, FiMic } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function VoiceMessage({ voiceUrl, duration, timestamp, isOwn }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  };

  const downloadVoice = () => {
    const link = document.createElement('a');
    link.href = voiceUrl;
    link.download = `voice-message-${timestamp}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center space-x-3 p-3 rounded-lg max-w-xs ${
        isOwn 
          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white ml-auto' 
          : 'bg-gray-100 text-gray-800'
      }`}
    >
      <audio ref={audioRef} src={voiceUrl} preload="metadata" />
      
      {/* Voice Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isOwn ? 'bg-white/20' : 'bg-indigo-100'
      }`}>
        <FiMic size={16} className={isOwn ? 'text-white' : 'text-indigo-600'} />
      </div>

      {/* Voice Controls */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            disabled={isLoading}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isOwn 
                ? 'bg-white/20 hover:bg-white/30 text-white' 
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <FiPause size={14} />
            ) : (
              <FiPlay size={14} />
            )}
          </button>

          {/* Duration */}
          <span className={`text-xs font-mono ${isOwn ? 'text-white/80' : 'text-gray-600'}`}>
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className={`w-full h-1 rounded-full ${isOwn ? 'bg-white/20' : 'bg-gray-300'}`}>
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOwn ? 'bg-white' : 'bg-indigo-500'
            }`}
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={downloadVoice}
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
          isOwn 
            ? 'hover:bg-white/20 text-white/80 hover:text-white' 
            : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
        }`}
        title="Download voice message"
      >
        <FiDownload size={12} />
      </button>
    </motion.div>
  );
} 