import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import ConversationList from "@/components/messaging/ConversationList";
import MessageThread from "@/components/messaging/MessageThread";
import Head from "next/head";
import Meta from '@/components/Meta';
import { motion } from 'framer-motion';

export default function Messaging() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/messaging');
    }
  }, [user, authLoading, router]);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    // Initial check
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    
    if (isMobileView) {
      setShowMessages(true);
    }
  };

  // Handle back button for mobile view
  const handleBack = () => {
    setShowMessages(false);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <>
      <Meta title="Messages | FreeLanTalent" />
      
      <Layout>
        <Head>
          <title>Messages | FreelanceHub</title>
        </Head>
        
        <motion.div 
          className="container mx-auto px-4 py-8 max-w-5xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold mb-6">Messages</h1>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden h-[calc(100vh-10rem)]">
            <div className="flex h-full">
              {/* Conversation List - Hidden on mobile when showing messages */}
              <div 
                className={`
                  ${isMobileView && showMessages ? 'hidden' : 'block'} 
                  w-full md:w-1/3 border-r border-gray-200
                `}
              >
                <ConversationList 
                  onSelectConversation={handleSelectConversation}
                  selectedConversationId={selectedConversation?.id}
                />
              </div>
              
              {/* Message Thread - Hidden on mobile when showing conversation list */}
              <div 
                className={`
                  ${isMobileView && !showMessages ? 'hidden' : 'block'} 
                  w-full md:w-2/3
                `}
              >
                <MessageThread 
                  conversation={selectedConversation}
                  onBack={handleBack}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </Layout>
    </>
  );
} 