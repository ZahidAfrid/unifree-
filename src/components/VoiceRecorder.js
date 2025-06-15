import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiMicOff, FiPlay, FiPause, FiSend, FiX, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function VoiceRecorder({ onSendVoiceMessage, onClose, isOpen }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // idle, requesting, recording, stopping
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Check browser support on mount
  useEffect(() => {
    const checkSupport = () => {
      console.log('🎤 Checking browser support...');
      console.log('🎤 navigator.mediaDevices:', !!navigator.mediaDevices);
      console.log('🎤 getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
      console.log('🎤 MediaRecorder:', !!window.MediaRecorder);
      console.log('🎤 HTTPS:', location.protocol === 'https:' || location.hostname === 'localhost');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('❌ getUserMedia not supported');
        setIsSupported(false);
        toast.error('Voice recording is not supported in this browser');
        return false;
      }
      if (!window.MediaRecorder) {
        console.log('❌ MediaRecorder not supported');
        setIsSupported(false);
        toast.error('MediaRecorder is not supported in this browser');
        return false;
      }
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        console.log('❌ HTTPS required for microphone access');
        setIsSupported(false);
        toast.error('Voice recording requires HTTPS connection');
        return false;
      }
      
      console.log('✅ Browser support check passed');
      return true;
    };
    
    checkSupport();
  }, []);

  // Timer effect for recording
  useEffect(() => {
    let interval = null;
    if (isRecording && recordingStatus === 'recording') {
      console.log('⏱️ Starting timer effect');
      interval = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          console.log('⏱️ Timer effect update:', prev, '->', newTime);
          return newTime;
        });
      }, 1000);
    } else if (!isRecording && interval) {
      console.log('⏱️ Clearing timer effect');
      clearInterval(interval);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, recordingStatus]);

  // Audio level monitoring effect
  useEffect(() => {
    let animationFrame = null;
    
    const monitorAudioLevel = () => {
      if (analyserRef.current && isRecording) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average audio level
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const level = Math.round(average);
        setAudioLevel(level);
        
        if (level > 5) {
          console.log('🎵 Audio detected, level:', level);
        }
        
        animationFrame = requestAnimationFrame(monitorAudioLevel);
      }
    };
    
    if (isRecording && analyserRef.current) {
      console.log('🎵 Starting audio level monitoring');
      monitorAudioLevel();
    } else {
      setAudioLevel(0);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Stop recording if active
      if (mediaRecorderRef.current && isRecording) {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.warn('Error stopping recording on cleanup:', error);
        }
      }
      
      // Stop media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Revoke audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      // Cleanup audio monitoring
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (error) {
          console.warn('Error closing audio context:', error);
        }
      }
    };
  }, [isRecording, audioUrl]);

  const startRecording = async () => {
    console.log('🎤 startRecording called - isSupported:', isSupported, 'status:', recordingStatus);
    
    if (!isSupported) {
      console.log('🎤 Recording not supported, showing error');
      toast.error('Voice recording is not supported');
      return;
    }

    if (recordingStatus !== 'idle') {
      console.log('🎤 Already recording or processing');
      return;
    }

    setRecordingStatus('requesting');

    try {
      console.log('🎤 Requesting microphone access...');
      
      // First try with basic constraints
      let stream;
      try {
        console.log('🎤 Requesting getUserMedia with basic constraints...');
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true
        });
      } catch (basicError) {
        console.log('🎤 Basic constraints failed, trying with advanced constraints...');
        // Try with more specific constraints if basic fails
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
      }
      
      console.log('✅ Microphone access granted, stream:', stream);
      console.log('✅ Audio tracks:', stream.getAudioTracks());
      
      // Check if we actually have audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks available');
      }
      
      // Check if the track is enabled and ready
      const audioTrack = audioTracks[0];
      console.log('🎤 Audio track state:', audioTrack.readyState, 'enabled:', audioTrack.enabled);
      
      if (audioTrack.readyState !== 'live') {
        throw new Error('Audio track is not live');
      }
      
      streamRef.current = stream;

      // Set up audio level monitoring
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        microphone.connect(analyser);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        
        console.log('🎵 Audio level monitoring set up');
      } catch (error) {
        console.warn('⚠️ Could not set up audio level monitoring:', error);
      }

      // Check MediaRecorder support with different MIME types
      let mimeType = '';
      let options = {};
      
      // Try different MIME types in order of preference
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg'
      ];
      
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          options = { mimeType: type };
          break;
        }
      }
      
      if (!mimeType) {
        console.log('🎤 No supported MIME type found, using browser default');
        options = {};
      }

      console.log('🎤 Using MIME type:', mimeType || 'browser default');
      console.log('🎤 MediaRecorder options:', options);

      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
        console.log('✅ MediaRecorder created successfully');
      } catch (error) {
        console.warn('⚠️ Failed to create MediaRecorder with options, trying without options:', error);
        mediaRecorder = new MediaRecorder(stream);
        console.log('✅ MediaRecorder created without options');
      }
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('📊 Data available event fired:', {
          dataSize: event.data.size,
          dataType: event.data.type,
          timestamp: new Date().toISOString()
        });
        
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('📊 Audio chunk added:', {
            chunkSize: event.data.size,
            totalChunks: chunksRef.current.length,
            totalSize: chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)
          });
        } else {
          console.log('⚠️ Empty or invalid data chunk:', event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🛑 Recording stopped, creating blob...');
        console.log('🛑 Chunks collected:', chunksRef.current.length);
        
        if (chunksRef.current.length === 0) {
          console.log('❌ No audio data collected');
          toast.error('No audio data recorded. Please try again.');
          setRecordingStatus('idle');
          return;
        }
        
        const blob = new Blob(chunksRef.current, { 
          type: mediaRecorderRef.current?.mimeType || mimeType || 'audio/webm' 
        });
        console.log('✅ Blob created:', blob.size, 'bytes', 'type:', blob.type);
        
        if (blob.size === 0) {
          console.log('❌ Empty blob created');
          toast.error('Recording failed - empty audio data');
          setRecordingStatus('idle');
          return;
        }
        
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordingStatus('idle');
        
        console.log('✅ Audio URL created:', url);
        
        // Stop all tracks and cleanup audio monitoring
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
            console.log('🛑 Stopped track:', track.kind);
          });
          streamRef.current = null;
        }
        
        // Cleanup audio monitoring
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          try {
            audioContextRef.current.close();
          } catch (error) {
            console.warn('Error closing audio context:', error);
          }
          audioContextRef.current = null;
        }
        analyserRef.current = null;
        setAudioLevel(0);
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event.error);
        toast.error('Recording error: ' + event.error.message);
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorder.onstart = () => {
        console.log('🎤 Recording started');
        console.log('🎤 MediaRecorder state after start:', mediaRecorder.state);
        toast.success('Recording started');
        
        // Force data collection every 500ms to ensure we get data
        const forceDataCollection = setInterval(() => {
          if (mediaRecorder.state === 'recording') {
            console.log('🔄 Requesting data from MediaRecorder');
            try {
              mediaRecorder.requestData();
            } catch (error) {
              console.warn('⚠️ Error requesting data:', error);
            }
          } else {
            clearInterval(forceDataCollection);
          }
        }, 500);
      };

      // Start recording with data collection every 100ms for better capture
      console.log('🎤 Starting MediaRecorder...');
      console.log('🎤 MediaRecorder state before start:', mediaRecorder.state);
      console.log('🎤 Stream active:', stream.active);
      console.log('🎤 Audio tracks active:', stream.getAudioTracks().map(track => ({
        id: track.id,
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState,
        muted: track.muted
      })));
      
      // Start with smaller intervals to capture more data
      mediaRecorder.start(100);
      console.log('🎤 MediaRecorder.start(100) called');
      
      // Wait a moment and check state
      setTimeout(() => {
        console.log('🎤 MediaRecorder state after 100ms:', mediaRecorder.state);
        console.log('🎤 Stream still active:', stream.active);
        console.log('🎤 Audio tracks still live:', stream.getAudioTracks().map(t => t.readyState));
      }, 100);
      
      setIsRecording(true);
      setRecordingStatus('recording');
      setRecordingTime(0);
      
      console.log('⏱️ Recording started, timer will be handled by useEffect');

    } catch (error) {
      console.error('❌ Error starting recording:', error);
      
      let errorMessage = 'Could not access microphone';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Voice recording is not supported in this browser.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is already in use by another application.';
      }
      
      toast.error(errorMessage);
      setIsRecording(false);
      setRecordingStatus('idle');
    }
  };

  const stopRecording = () => {
    console.log('🛑 Stopping recording...', 'status:', recordingStatus);
    
    if (recordingStatus !== 'recording') {
      console.log('🛑 Not currently recording');
      return;
    }

    setRecordingStatus('stopping');
    
    if (mediaRecorderRef.current && isRecording) {
      try {
        console.log('🛑 MediaRecorder state:', mediaRecorderRef.current.state);
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          console.log('🛑 MediaRecorder.stop() called');
        }
      } catch (error) {
        console.error('Error stopping MediaRecorder:', error);
      }
    }
    
    setIsRecording(false);
    
    // Cleanup audio monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);
    
    console.log('⏱️ Recording stopped, timer will be cleared by useEffect');
    toast.success('Recording completed');
  };

  const sendVoiceMessage = async () => {
    console.log('📤 sendVoiceMessage called');
    console.log('📤 audioBlob:', audioBlob);
    console.log('📤 recordingTime:', recordingTime);
    console.log('📤 onSendVoiceMessage function:', typeof onSendVoiceMessage);
    
    if (!audioBlob) {
      console.log('❌ No audioBlob available');
      toast.error('No recording to send');
      return;
    }

    if (!onSendVoiceMessage) {
      console.log('❌ onSendVoiceMessage function not provided');
      toast.error('Voice message handler not available');
      return;
    }

    try {
      console.log('📤 Sending voice message...', audioBlob.size, 'bytes');
      console.log('📤 Calling onSendVoiceMessage with:', { 
        blobSize: audioBlob.size, 
        blobType: audioBlob.type, 
        duration: recordingTime 
      });
      
      console.log('📤 About to call onSendVoiceMessage...');
      const result = await onSendVoiceMessage(audioBlob, recordingTime);
      console.log('📤 onSendVoiceMessage returned:', result);
      
      console.log('✅ Voice message sent successfully');
      toast.success('Voice message sent!');
      
      // Clean up
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      onClose();
      
    } catch (error) {
      console.error('❌ Error sending voice message:', error);
      console.error('❌ Error details:', error.message, error.stack);
      toast.error(`Failed to send voice message: ${error.message}`);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    toast.success('Recording deleted');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  console.log('🎤 VoiceRecorder render - isOpen:', isOpen, 'isSupported:', isSupported, 'recordingTime:', recordingTime, 'isRecording:', isRecording);

  if (!isOpen) {
    console.log('🎤 VoiceRecorder not rendering - isOpen is false');
    return null;
  }

  console.log('🎤 VoiceRecorder rendering...');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-2xl border-2 border-indigo-200 w-80 p-4 z-50 voice-recorder"
      style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Voice Message</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={16} />
        </button>
      </div>

      {!isSupported && (
        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm text-red-600">
            Voice recording is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
          </p>
        </div>
      )}

      {/* Microphone Permission and Test Section */}
      {isSupported && (
        <div className="mb-4 space-y-2">
          <button
            onClick={async () => {
              console.log('🎤 Testing microphone access...');
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('✅ Microphone access granted!');
                
                // Test if we can actually get audio data
                const audioTracks = stream.getAudioTracks();
                if (audioTracks.length > 0) {
                  const track = audioTracks[0];
                  console.log('🎤 Audio track details:', {
                    label: track.label,
                    enabled: track.enabled,
                    readyState: track.readyState,
                    kind: track.kind,
                    muted: track.muted
                  });
                  
                  if (track.readyState === 'live' && !track.muted) {
                    // Test MediaRecorder quickly
                    try {
                      const testRecorder = new MediaRecorder(stream);
                      console.log('✅ MediaRecorder test successful');
                      toast.success('Microphone and MediaRecorder working correctly!');
                    } catch (recorderError) {
                      console.error('❌ MediaRecorder test failed:', recorderError);
                      toast.error('MediaRecorder not supported');
                    }
                  } else if (track.muted) {
                    toast.error('Microphone is muted. Please unmute your microphone.');
                  } else {
                    toast.error('Microphone is not ready. Please check your device.');
                  }
                } else {
                  toast.error('No microphone detected.');
                }
                
                stream.getTracks().forEach(track => track.stop());
              } catch (error) {
                console.error('❌ Microphone test failed:', error);
                let errorMsg = 'Microphone test failed';
                
                if (error.name === 'NotAllowedError') {
                  errorMsg = 'Microphone access denied. Please allow microphone access in your browser settings.';
                } else if (error.name === 'NotFoundError') {
                  errorMsg = 'No microphone found. Please connect a microphone.';
                } else if (error.name === 'NotReadableError') {
                  errorMsg = 'Microphone is being used by another application.';
                } else {
                  errorMsg = `Microphone error: ${error.message}`;
                }
                
                toast.error(errorMsg);
              }
            }}
            className="w-full px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            🎤 Test Microphone & MediaRecorder
          </button>
          
          <div className="text-xs text-gray-500 text-center">
            Click &quot;Test Microphone&quot; first to ensure your microphone is working
          </div>
        </div>
      )}

      {!audioBlob && isSupported && (
        <div className="text-center">
            <div className="text-2xl font-mono text-gray-800 mb-2">
              {formatTime(recordingTime)}
            </div>
            
            {/* Recording Status */}
            <div className="text-sm text-gray-600 mb-4">
              Status: <span className={`font-semibold ${
                recordingStatus === 'recording' ? 'text-red-600' :
                recordingStatus === 'requesting' ? 'text-yellow-600' :
                recordingStatus === 'stopping' ? 'text-blue-600' :
                'text-gray-600'
              }`}>
                {recordingStatus === 'requesting' ? 'Requesting microphone access...' :
                 recordingStatus === 'recording' ? 'Recording in progress' :
                 recordingStatus === 'stopping' ? 'Stopping recording...' :
                 'Ready to record'}
              </span>
            </div>
          
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={!isSupported}
              className={`w-16 h-16 text-white rounded-full flex items-center justify-center mx-auto transition-colors ${
                isSupported 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <FiMic size={24} />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-16 h-16 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center mx-auto"
            >
              <FiMicOff size={24} />
            </button>
          )}
          
          {isRecording && (
            <div className="mt-3 space-y-2">
              <div className="text-red-500 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block mr-2"></div>
                Recording...
              </div>
              
              {/* Audio Level Indicator */}
              <div className="text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <span>Audio Level:</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-100 ${
                        audioLevel > 20 ? 'bg-green-500' : 
                        audioLevel > 10 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono w-8">{audioLevel}</span>
                </div>
                {audioLevel === 0 && (
                  <div className="text-red-500 text-xs mt-1">
                    ⚠️ No audio detected - speak into microphone
                  </div>
                )}
              </div>
            </div>
          )}
          
          {!isRecording && !audioBlob && isSupported && (
            <div className="mt-3 text-gray-500 text-xs text-center space-y-1">
              <p>Click the microphone to start recording</p>
              <p>You may need to allow microphone access</p>
              <div className="mt-2 p-2 bg-gray-50 rounded text-left">
                <p className="font-semibold text-gray-700 mb-1">Troubleshooting:</p>
                <ul className="text-xs space-y-1">
                  <li>• Check if microphone is connected</li>
                  <li>• Allow microphone access in browser</li>
                  <li>• Close other apps using microphone</li>
                  <li>• Try refreshing the page</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {audioBlob && (
        <div className="space-y-4">
          <audio ref={audioRef} src={audioUrl} />
          
          <div className="text-center">
            <div className="text-lg font-mono text-gray-800 mb-2">
              {formatTime(recordingTime)}
            </div>
          </div>

          <div className="flex justify-center space-x-3">
            <button
              onClick={() => audioRef.current?.play()}
              className="w-12 h-12 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center"
            >
              <FiPlay size={20} />
            </button>
            <button
              onClick={deleteRecording}
              className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
            >
              <FiTrash2 size={20} />
            </button>
          </div>

          <button
            onClick={sendVoiceMessage}
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium"
          >
            <FiSend className="mr-2" />
            Send Voice Message
          </button>
        </div>
      )}
    </motion.div>
  );
} 