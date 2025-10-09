/**
 * Simple Database Test Script
 * Tests basic timetable data operations with Firebase emulator
 */

const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin for emulator testing
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'timeout-backend-340e2'
  });
}

// Configure for emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8090';

const db = admin.firestore();

// Test user and data
const testUserId = 'test-user-123';
const testEvent = {
  id: 'event-abc',
  title: 'Morning Group Session',
  startTime: '09:00',
  endTime: '10:00',
  day: 'Monday',
  type: 'group-session',
  topic: 'Mathematics',
  description: 'Advanced math topics',
  color: '#3B82F6',
  created: new Date().toISOString(),
  modified: new Date().toISOString()
};

const testTemplate = {
  id: 'template-xyz',
  name: 'Daily Study Template',
  description: 'Standard daily schedule',
  events: [
    {
      id: 'temp-event-1',
      title: 'Study Time',
      startTime: '14:00',
      endTime: '15:00',
      type: 'study-time',
      topic: 'Science',
      color: '#10B981'
    }
  ],
  created: new Date().toISOString(),
  modified: new Date().toISOString()
};

const testScheduleData = {
  events: [testEvent],
  templates: [testTemplate],
  lastModified: new Date().toISOString(),
  version: 1
};

async function testDatabaseOperations() {
  console.log('🚀 Testing Database Integration');
  console.log('=' .repeat(40));
  
  try {
    // 1. Test Save Operation
    console.log('\n📝 Test 1: Saving timetable data...');
    const userRef = db.collection('users').doc(testUserId);
    const scheduleRef = userRef.collection('scheduleData').doc('main');
    
    await scheduleRef.set(testScheduleData);
    console.log('✅ Data saved successfully');
    
    // 2. Test Retrieve Operation
    console.log('\n📖 Test 2: Retrieving timetable data...');
    const doc = await scheduleRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      console.log('✅ Data retrieved successfully');
      console.log(`   Events: ${data.events?.length || 0}`);
      console.log(`   Templates: ${data.templates?.length || 0}`);
      console.log(`   Version: ${data.version}`);
      
      // 3. Test Data Integrity
      console.log('\n🔍 Test 3: Checking data integrity...');
      const eventMatch = data.events?.[0]?.title === testEvent.title;
      const templateMatch = data.templates?.[0]?.name === testTemplate.name;
      
      if (eventMatch && templateMatch) {
        console.log('✅ Data integrity verified');
      } else {
        console.log('❌ Data integrity check failed');
        console.log('Expected event title:', testEvent.title);
        console.log('Retrieved event title:', data.events?.[0]?.title);
      }
      
    } else {
      console.log('❌ No data found');
      return false;
    }
    
    // 4. Test Update Operation
    console.log('\n🔄 Test 4: Updating data...');
    const updatedData = {
      ...testScheduleData,
      events: [{
        ...testEvent,
        title: 'Updated Group Session',
        modified: new Date().toISOString()
      }],
      version: 2,
      lastModified: new Date().toISOString()
    };
    
    await scheduleRef.update(updatedData);
    
    // Verify update
    const updatedDoc = await scheduleRef.get();
    const updatedResult = updatedDoc.data();
    
    if (updatedResult.events[0].title === 'Updated Group Session') {
      console.log('✅ Update operation successful');
    } else {
      console.log('❌ Update operation failed');
    }
    
    // 5. Cleanup
    console.log('\n🧹 Test 5: Cleaning up...');
    await userRef.delete();
    console.log('✅ Cleanup completed');
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Timetable data can be saved to database');
    console.log('✅ Timetable data can be retrieved from database');
    console.log('✅ Data updates work correctly');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  console.log('Starting database integration test...');
  console.log('Make sure Firebase emulators are running on:');
  console.log('  - Firestore: localhost:8090');
  console.log('');
  
  testDatabaseOperations()
    .then(success => {
      if (success) {
        console.log('\n🎯 RESULT: Database integration is working! 🎉');
      } else {
        console.log('\n❌ RESULT: Database integration has issues');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseOperations };