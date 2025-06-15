// Debug script to check messaging data
import { db } from './src/firebase/firebase.config.js';
import { collection, getDocs, query, where } from 'firebase/firestore';

const debugMessaging = async () => {
  try {
    console.log("🔍 Debugging messaging system...");
    
    // Check accepted_proposals collection
    console.log("\n📊 Checking accepted_proposals collection:");
    const acceptedProposalsSnapshot = await getDocs(collection(db, "accepted_proposals"));
    console.log("Total accepted proposals:", acceptedProposalsSnapshot.size);
    
    if (!acceptedProposalsSnapshot.empty) {
      console.log("\n📋 Accepted proposals details:");
      acceptedProposalsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n${index + 1}. Document ID: ${doc.id}`);
        console.log(`   Project ID: ${data.projectId}`);
        console.log(`   Project Title: ${data.projectTitle}`);
        console.log(`   Freelancer ID: ${data.freelancerId}`);
        console.log(`   Freelancer Name: ${data.freelancerName}`);
        console.log(`   Client ID: ${data.clientId}`);
        console.log(`   Client Name: ${data.clientName}`);
        console.log(`   Participants: ${JSON.stringify(data.participants)}`);
        console.log(`   Status: ${data.status}`);
        console.log(`   Accepted At: ${data.acceptedAt}`);
        console.log(`   Last Message: ${data.lastMessage || 'None'}`);
      });
    } else {
      console.log("❌ No accepted proposals found!");
      
      // Check if there are any proposals at all
      console.log("\n🔍 Checking proposals collection:");
      const proposalsSnapshot = await getDocs(collection(db, "proposals"));
      console.log("Total proposals:", proposalsSnapshot.size);
      
      if (!proposalsSnapshot.empty) {
        console.log("\n📋 Sample proposals:");
        proposalsSnapshot.docs.slice(0, 3).forEach((doc, index) => {
          const data = doc.data();
          console.log(`\n${index + 1}. Document ID: ${doc.id}`);
          console.log(`   Project ID: ${data.projectId}`);
          console.log(`   Freelancer ID: ${data.freelancerId}`);
          console.log(`   Status: ${data.status}`);
          console.log(`   Content: ${data.content?.substring(0, 50)}...`);
        });
      }
    }
    
    // Check messages collection
    console.log("\n📨 Checking messages collection:");
    const messagesSnapshot = await getDocs(collection(db, "messages"));
    console.log("Total messages:", messagesSnapshot.size);
    
    if (!messagesSnapshot.empty) {
      console.log("\n📋 Sample messages:");
      messagesSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n${index + 1}. Document ID: ${doc.id}`);
        console.log(`   Conversation ID: ${data.conversationId}`);
        console.log(`   Sender ID: ${data.senderId}`);
        console.log(`   Receiver ID: ${data.receiverId}`);
        console.log(`   Content: ${data.content?.substring(0, 50)}...`);
      });
    }
    
  } catch (error) {
    console.error("❌ Debug error:", error);
  }
};

// Run the debug function
debugMessaging(); 