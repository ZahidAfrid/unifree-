// Test file to verify Firestore rules
import { db } from './src/firebase/firebase.config.js';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// Test notification creation
async function testNotificationCreation() {
  try {
    console.log('Testing notification creation...');
    
    const testNotification = {
      recipientId: 'test-user-id',
      recipientType: 'freelancer',
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification',
      read: false,
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'notifications'), testNotification);
    console.log('✅ Notification created successfully with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    return null;
  }
}

// Test document upload
async function testDocumentUpload() {
  try {
    console.log('Testing document upload...');
    
    const testDocument = {
      projectId: 'test-project-id',
      fileName: 'test-document.pdf',
      fileSize: 1024,
      fileType: 'application/pdf',
      downloadURL: 'https://example.com/test.pdf',
      uploadedBy: 'test-user-id',
      uploaderName: 'Test User',
      uploaderRole: 'freelancer',
      uploadedAt: new Date(),
      storagePath: 'test/path'
    };

    const docRef = await addDoc(collection(db, 'project_documents'), testDocument);
    console.log('✅ Document uploaded successfully with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error uploading document:', error);
    return null;
  }
}

// Test review creation
async function testReviewCreation() {
  try {
    console.log('Testing review creation...');
    
    const testReview = {
      projectId: 'test-project-id',
      reviewerId: 'test-reviewer-id',
      revieweeId: 'test-reviewee-id',
      revieweeType: 'freelancer',
      rating: 5,
      comment: 'Great work!',
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'reviews'), testReview);
    console.log('✅ Review created successfully with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating review:', error);
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Starting Firestore rules tests...\n');
  
  await testNotificationCreation();
  await testDocumentUpload();
  await testReviewCreation();
  
  console.log('\n✅ All tests completed!');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testFirestore = runTests;
}

export { runTests }; 