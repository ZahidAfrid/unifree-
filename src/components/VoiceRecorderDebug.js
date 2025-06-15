import { useState, useEffect } from 'react';
import VoiceRecorder from './VoiceRecorder';
import toast from 'react-hot-toast';

export default function VoiceRecorderDebug() {
  const [showRecorder, setShowRecorder] = useState(false);
  const [lastRecording, setLastRecording] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]);

  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-20), `[${timestamp}] ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  const handleSendVoiceMessage = async (audioBlob, duration) => {
    addDebugLog(`📤 Received voice message: ${audioBlob.size} bytes, ${duration}s`);
    
    try {
      // Create a temporary URL to test playback
      const url = URL.createObjectURL(audioBlob);
      addDebugLog(`🎵 Audio URL created: ${url.substring(0, 50)}...`);
      
      // Store the recording for testing
      setLastRecording({
        url,
        size: audioBlob.size,
        type: audioBlob.type,
        duration,
        timestamp: new Date().toISOString()
      });
      
      // Simulate processing delay
      addDebugLog('⏳ Simulating message processing...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addDebugLog('✅ Voice message processed successfully');
      toast.success(`Voice message received! Duration: ${duration}s, Size: ${audioBlob.size} bytes`);
      
      return { success: true, messageId: 'test-' + Date.now() };
    } catch (error) {
      addDebugLog(`❌ Error processing voice message: ${error.message}`);
      throw error;
    }
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  const clearRecording = () => {
    if (lastRecording?.url) {
      URL.revokeObjectURL(lastRecording.url);
    }
    setLastRecording(null);
    addDebugLog('🗑️ Recording cleared');
  };

  useEffect(() => {
    addDebugLog('🚀 VoiceRecorderDebug component mounted');
    return () => {
      if (lastRecording?.url) {
        URL.revokeObjectURL(lastRecording.url);
      }
    };
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Voice Recorder Debug Console</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Controls</h3>
            
            <button
              onClick={() => {
                const newState = !showRecorder;
                addDebugLog(`🎤 Toggle recorder: ${showRecorder} -> ${newState}`);
                setShowRecorder(newState);
              }}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                showRecorder 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {showRecorder ? '🔴 Close Voice Recorder' : '🎤 Open Voice Recorder'}
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={clearLogs}
                className="flex-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm"
              >
                Clear Logs
              </button>
              <button
                onClick={clearRecording}
                disabled={!lastRecording}
                className="flex-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear Recording
              </button>
            </div>
            
            {/* Voice Recorder */}
            <div className="relative">
              <VoiceRecorder
                isOpen={showRecorder}
                onClose={() => {
                  addDebugLog('🎤 Closing recorder via onClose');
                  setShowRecorder(false);
                }}
                onSendVoiceMessage={handleSendVoiceMessage}
              />
            </div>
          </div>
          
          {/* Last Recording */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Last Recording</h3>
            
            {lastRecording ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm space-y-2">
                  <p><strong>Duration:</strong> {lastRecording.duration}s</p>
                  <p><strong>Size:</strong> {lastRecording.size} bytes</p>
                  <p><strong>Type:</strong> {lastRecording.type}</p>
                  <p><strong>Recorded:</strong> {new Date(lastRecording.timestamp).toLocaleTimeString()}</p>
                </div>
                <audio controls src={lastRecording.url} className="mt-3 w-full" />
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
                No recording yet
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Debug Logs */}
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Debug Logs</h3>
          <span className="text-sm text-gray-400">{debugLogs.length} entries</span>
        </div>
        
        <div className="bg-black rounded p-3 h-64 overflow-y-auto font-mono text-sm">
          {debugLogs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index} className="text-green-400 mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Testing Instructions</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Click &quot;Open Voice Recorder&quot; to show the recorder</li>
          <li>Click &quot;🎤 Test Microphone&quot; first to verify permissions</li>
          <li>Click the red microphone button to start recording</li>
          <li>Watch the timer - it should count up every second</li>
          <li>Click the gray stop button to stop recording</li>
          <li>Click &quot;Send Voice Message&quot; to test the sending process</li>
          <li>Check the debug logs and console for any errors</li>
        </ol>
      </div>
    </div>
  );
} 