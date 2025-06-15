// Debug script for freelancer dashboard accepted proposals issue
import { db } from './src/firebase/firebase.config.js';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

// Function to debug accepted proposals for freelancer dashboard
async function debugFreelancerAcceptedProposals(freelancerId) {
  try {
    console.log('🔍 Debugging freelancer accepted proposals...');
    console.log('Freelancer ID:', freelancerId);
    console.log('');

    // Test 1: Get all accepted proposals (no filters)
    console.log('1️⃣ Testing: Get ALL accepted proposals');
    const allProposalsSnapshot = await getDocs(collection(db, 'accepted_proposals'));
    console.log('Total accepted proposals in collection:', allProposalsSnapshot.size);
    
    if (!allProposalsSnapshot.empty) {
      console.log('Sample accepted proposals:');
      allProposalsSnapshot.docs.slice(0, 5).forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ID: ${doc.id}`);
        console.log(`     FreelancerId: ${data.freelancerId}`);
        console.log(`     ClientId: ${data.clientId}`);
        console.log(`     ProjectId: ${data.projectId}`);
        console.log(`     ProjectTitle: ${data.projectTitle}`);
        console.log(`     Status: ${data.status}`);
        console.log(`     AcceptedAt: ${data.acceptedAt}`);
        console.log(`     Bid: $${data.bid}`);
        console.log('');
      });
    }

    // Test 2: Query by freelancerId (without orderBy)
    console.log('2️⃣ Testing: Query by freelancerId (no orderBy)');
    const freelancerQuery = query(
      collection(db, 'accepted_proposals'),
      where('freelancerId', '==', freelancerId)
    );
    const freelancerSnapshot = await getDocs(freelancerQuery);
    console.log('Proposals for this freelancer (no orderBy):', freelancerSnapshot.size);

    if (!freelancerSnapshot.empty) {
      console.log('Found proposals for freelancer:');
      freelancerSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ${data.projectTitle || 'Untitled'} - $${data.bid} - ${data.status}`);
        console.log(`     Accepted: ${data.acceptedAt ? new Date(data.acceptedAt.seconds * 1000).toLocaleDateString() : 'Unknown'}`);
      });
    }

    // Test 3: Query by freelancerId with orderBy
    console.log('');
    console.log('3️⃣ Testing: Query by freelancerId (with orderBy)');
    try {
      const freelancerOrderedQuery = query(
        collection(db, 'accepted_proposals'),
        where('freelancerId', '==', freelancerId),
        orderBy('acceptedAt', 'desc')
      );
      const freelancerOrderedSnapshot = await getDocs(freelancerOrderedQuery);
      console.log('Proposals for this freelancer (with orderBy):', freelancerOrderedSnapshot.size);
      
      if (!freelancerOrderedSnapshot.empty) {
        console.log('Found proposals (ordered):');
        freelancerOrderedSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`  ${index + 1}. ${data.projectTitle || 'Untitled'} - $${data.bid} - ${data.status}`);
        });
      }
    } catch (orderByError) {
      console.error('❌ Error with orderBy query:', orderByError);
      console.log('This might be a missing index issue. The query without orderBy should still work.');
    }

    // Test 4: Check for any proposals where user is involved as client
    console.log('');
    console.log('4️⃣ Testing: Check if user is in any proposals as client');
    const clientQuery = query(
      collection(db, 'accepted_proposals'),
      where('clientId', '==', freelancerId)
    );
    const clientSnapshot = await getDocs(clientQuery);
    console.log('Proposals where user is client:', clientSnapshot.size);

    // Test 5: Check specific field values
    console.log('');
    console.log('5️⃣ Testing: Field analysis');
    if (!allProposalsSnapshot.empty) {
      const sampleDoc = allProposalsSnapshot.docs[0];
      const sampleData = sampleDoc.data();
      console.log('Sample document fields:');
      Object.keys(sampleData).forEach(key => {
        console.log(`  - ${key}: ${typeof sampleData[key]} = ${sampleData[key]}`);
      });
    }

    return {
      totalProposals: allProposalsSnapshot.size,
      freelancerProposals: freelancerSnapshot.size,
      success: true
    };

  } catch (error) {
    console.error('❌ Error in debug:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return {
      error: error.message,
      success: false
    };
  }
}

// Function to test notifications
async function debugNotifications(userId, userType) {
  try {
    console.log('🔔 Debugging notifications...');
    console.log('User ID:', userId);
    console.log('User Type:', userType);
    console.log('');

    // Test 1: Get all notifications
    console.log('1️⃣ Testing: Get ALL notifications');
    const allNotificationsSnapshot = await getDocs(collection(db, 'notifications'));
    console.log('Total notifications in collection:', allNotificationsSnapshot.size);

    if (!allNotificationsSnapshot.empty) {
      console.log('Sample notifications:');
      allNotificationsSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ID: ${doc.id}`);
        console.log(`     RecipientId: ${data.recipientId}`);
        console.log(`     RecipientType: ${data.recipientType}`);
        console.log(`     Type: ${data.type}`);
        console.log(`     Title: ${data.title}`);
        console.log(`     Read: ${data.read}`);
        console.log('');
      });
    }

    // Test 2: Query by recipientId and recipientType
    console.log('2️⃣ Testing: Query by recipientId and recipientType');
    const userNotificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('recipientType', '==', userType)
    );
    const userNotificationsSnapshot = await getDocs(userNotificationsQuery);
    console.log('Notifications for this user:', userNotificationsSnapshot.size);

    return {
      totalNotifications: allNotificationsSnapshot.size,
      userNotifications: userNotificationsSnapshot.size,
      success: true
    };

  } catch (error) {
    console.error('❌ Error debugging notifications:', error);
    return {
      error: error.message,
      success: false
    };
  }
}

// Main debug function
async function runFreelancerDashboardDebug() {
  console.log('🚀 Starting freelancer dashboard debugging...\n');
  
  // You need to replace these with actual values
  const testFreelancerId = 'REPLACE_WITH_ACTUAL_FREELANCER_ID';
  const testUserId = 'REPLACE_WITH_ACTUAL_USER_ID';
  
  console.log('⚠️  IMPORTANT: Replace the test IDs with actual values from your database');
  console.log('Test Freelancer ID:', testFreelancerId);
  console.log('Test User ID:', testUserId);
  console.log('');
  
  if (testFreelancerId === 'REPLACE_WITH_ACTUAL_FREELANCER_ID') {
    console.log('❌ Please update the test IDs in the script before running');
    return;
  }
  
  // Debug accepted proposals
  console.log('=' .repeat(60));
  console.log('DEBUGGING ACCEPTED PROPOSALS');
  console.log('=' .repeat(60));
  const proposalsResult = await debugFreelancerAcceptedProposals(testFreelancerId);
  
  console.log('\n' + '=' .repeat(60));
  console.log('DEBUGGING NOTIFICATIONS');
  console.log('=' .repeat(60));
  const notificationsResult = await debugNotifications(testUserId, 'freelancer');
  
  console.log('\n' + '=' .repeat(60));
  console.log('SUMMARY');
  console.log('=' .repeat(60));
  console.log('Accepted Proposals:', proposalsResult.success ? '✅ Success' : '❌ Failed');
  console.log('Notifications:', notificationsResult.success ? '✅ Success' : '❌ Failed');
  
  if (proposalsResult.success) {
    console.log(`Found ${proposalsResult.freelancerProposals} proposals for freelancer out of ${proposalsResult.totalProposals} total`);
  }
  
  if (notificationsResult.success) {
    console.log(`Found ${notificationsResult.userNotifications} notifications for user out of ${notificationsResult.totalNotifications} total`);
  }
  
  console.log('\n✅ Debug completed!');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.debugFreelancerDashboard = runFreelancerDashboardDebug;
  window.debugAcceptedProposals = debugFreelancerAcceptedProposals;
  window.debugNotifications = debugNotifications;
}

export { runFreelancerDashboardDebug, debugFreelancerAcceptedProposals, debugNotifications }; 