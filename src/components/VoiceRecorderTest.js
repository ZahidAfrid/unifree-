import { useState } from 'react';
import VoiceRecorder from './VoiceRecorder';
import toast from 'react-hot-toast';

export default function VoiceRecorderTest() {
  const [showRecorder, setShowRecorder] = useState(false);
  const [lastRecording, setLastRecording] = useState(null);

  const handleSendVoiceMessage = async (audioBlob, duration) => {
    console.log('📤 Test: Received voice message', {
      size: audioBlob.size,
      type: audioBlob.type,
      duration: duration
    });
    
    // Create a temporary URL to test playback
    const url = URL.createObjectURL(audioBlob);
    console.log('🎵 Test: Audio URL created:', url);
    
    // Store the recording for testing
    setLastRecording({
      url,
      size: audioBlob.size,
      type: audioBlob.type,
      duration
    });
    
    toast.success(`Voice message received! Duration: ${duration}s, Size: ${audioBlob.size} bytes`);
    
    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Test: Voice message "sent" successfully');
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Voice Recorder Test</h2>
      
      <div className="space-y-4">
        <button
          onClick={() => {
            console.log('🎤 Test: Toggle recorder, current state:', showRecorder);
            setShowRecorder(!showRecorder);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          {showRecorder ? 'Close' : 'Open'} Voice Recorder
        </button>
        
        <div className="relative">
          <VoiceRecorder
            isOpen={showRecorder}
            onClose={() => {
              console.log('🎤 Test: Closing recorder');
              setShowRecorder(false);
            }}
            onSendVoiceMessage={handleSendVoiceMessage}
          />
        </div>
        
        {lastRecording && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Last Recording:</h3>
            <div className="text-sm space-y-1">
              <p>Duration: {lastRecording.duration}s</p>
              <p>Size: {lastRecording.size} bytes</p>
              <p>Type: {lastRecording.type}</p>
            </div>
            <audio controls src={lastRecording.url} className="mt-2 w-full" />
            <button
              onClick={() => {
                URL.revokeObjectURL(lastRecording.url);
                setLastRecording(null);
              }}
              className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded"
            >
              Clear
            </button>
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p>• Click &quot;Open Voice Recorder&quot; to test</p>
          <p>• Check browser console for debug info</p>
          <p>• Make sure to allow microphone access</p>
          <p>• Test the microphone first before recording</p>
        </div>
      </div>
    </div>
  );
} 