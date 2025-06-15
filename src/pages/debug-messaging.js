import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserConversations,
  getOrCreateConversation,
  sendMessage,
  subscribeToUserConversations
} from '@/utils/messaging';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';

export default function DebugMessaging() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [allConversations, setAllConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (message) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Load all conversations from database
  const loadAllConversations = async () => {
    try {
      setLoading(true);
      const conversationsRef = collection(db, 'conversations');
      const snapshot = await getDocs(conversationsRef);
      const allConvs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllConversations(allConvs);
      addTestResult(`Found ${allConvs.length} total conversations in database`);
    } catch (error) {
      addTestResult(`Error loading all conversations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load user conversations
  const loadUserConversations = async () => {
    if (!user?.uid) {
      addTestResult("No user logged in");
      return;
    }

    try {
      setLoading(true);
      const userConvs = await getUserConversations(user.uid);
      setConversations(userConvs);
      addTestResult(`Found ${userConvs.length} conversations for user ${user.uid}`);
    } catch (error) {
      addTestResult(`Error loading user conversations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test conversation creation
  const testCreateConversation = async () => {
    if (!user?.uid) {
      addTestResult("No user logged in");
      return;
    }

    try {
      setLoading(true);
      const testFreelancerId = "test-freelancer-" + Date.now();
      
      addTestResult(`Creating conversation between ${user.uid} and ${testFreelancerId}`);
      
      const conversation = await getOrCreateConversation(
        user.uid,
        testFreelancerId,
        "test-project-123",
        "Test Project"
      );
      
      addTestResult(`Conversation created: ${conversation.id}`);
      
      // Send a test message
      await sendMessage(
        conversation.id,
        user.uid,
        "Test User",
        "This is a test message",
        "test-project-123",
        "Test Project"
      );
      
      addTestResult("Test message sent successfully");
      
      // Reload conversations
      await loadUserConversations();
      
    } catch (error) {
      addTestResult(`Error creating test conversation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time listener
  const setupRealTimeListener = () => {
    if (!user?.uid) {
      addTestResult("No user logged in");
      return;
    }

    addTestResult("Setting up real-time listener...");
    
    const unsubscribe = subscribeToUserConversations(
      user.uid,
      (updatedConversations) => {
        addTestResult(`Real-time update: ${updatedConversations.length} conversations`);
        setConversations(updatedConversations);
      }
    );

    // Clean up after 30 seconds
    setTimeout(() => {
      unsubscribe();
      addTestResult("Real-time listener cleaned up");
    }, 30000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Messaging System Debug</h1>
        
        {user ? (
          <div className="bg-green-100 p-4 rounded-lg mb-6">
            <p><strong>Logged in as:</strong> {user.uid}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        ) : (
          <div className="bg-red-100 p-4 rounded-lg mb-6">
            <p>Not logged in</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Controls</h2>
            <div className="space-y-3">
              <button
                onClick={loadAllConversations}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Load All Conversations
              </button>
              <button
                onClick={loadUserConversations}
                disabled={loading || !user}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                Load User Conversations
              </button>
              <button
                onClick={testCreateConversation}
                disabled={loading || !user}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
              >
                Create Test Conversation
              </button>
              <button
                onClick={setupRealTimeListener}
                disabled={loading || !user}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
              >
                Setup Real-time Listener
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="bg-gray-100 p-4 rounded max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">No test results yet</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm mb-1 font-mono">
                    {result}
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setTestResults([])}
              className="mt-2 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* All Conversations */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">All Conversations ({allConversations.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Participants</th>
                  <th className="text-left p-2">Last Message</th>
                  <th className="text-left p-2">Created At</th>
                </tr>
              </thead>
              <tbody>
                {allConversations.map(conv => (
                  <tr key={conv.id} className="border-b">
                    <td className="p-2 font-mono text-xs">{conv.id}</td>
                    <td className="p-2">{conv.participants?.join(', ')}</td>
                    <td className="p-2">{conv.lastMessage || 'No messages'}</td>
                    <td className="p-2">{conv.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Conversations */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">User Conversations ({conversations.length})</h2>
          <div className="space-y-4">
            {conversations.map(conv => (
              <div key={conv.id} className="border p-4 rounded">
                <p><strong>ID:</strong> {conv.id}</p>
                <p><strong>Other User:</strong> {conv.otherUser?.name} ({conv.otherUser?.userType})</p>
                <p><strong>Last Message:</strong> {conv.lastMessage || 'No messages'}</p>
                <p><strong>Unread Count:</strong> {conv.unreadCount}</p>
                <p><strong>Project:</strong> {conv.currentProject?.title || 'No project'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 