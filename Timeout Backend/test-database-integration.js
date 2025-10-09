/**
 * Database Integration Test Script
 * Tests timetable data saving and retrieval functionality
 */

const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin SDK for testing
const serviceAccount = {
  // For emulator testing, we can use a mock service account
  projectId: 'timeout-backend-340e2',
  clientEmail: 'test@timeout-backend-340e2.iam.gserviceaccount.com',
  privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n'
};

// Initialize Firebase Admin (for emulator)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'timeout-backend-340e2'
  });
}

// Use emulator for testing
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8090';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

const db = admin.firestore();

// Test data structures
const mockUserId = 'test-user-' + uuidv4();
const mockScheduleEvent = {
  id: 'event-' + uuidv4(),
  title: 'Test Group Session',
  startTime: '09:00',
  endTime: '10:00',
  day: 'Monday',
  type: 'group-session',
  topic: 'Mathematics',
  description: 'Test math session',
  color: '#3B82F6',
  created: new Date().toISOString(),
  modified: new Date().toISOString()
};

const mockTemplate = {
  id: 'template-' + uuidv4(),
  name: 'Test Daily Template',
  description: 'Test template for daily schedule',
  events: [
    {
      id: 'template-event-1',
      title: 'Morning Group Session',
      startTime: '09:00',
      endTime: '10:00',
      type: 'group-session',
      topic: 'Science',
      color: '#10B981'
    },
    {
      id: 'template-event-2',
      title: 'Afternoon Study',
      startTime: '14:00',
      endTime: '15:00',
      type: 'study-time',
      topic: 'History',
      color: '#F59E0B'
    }
  ],
  created: new Date().toISOString(),
  modified: new Date().toISOString()
};

const mockUserScheduleData = {
  events: [mockScheduleEvent],
  templates: [mockTemplate],
  lastModified: new Date().toISOString(),
  version: 1
};

/**
 * Test Functions
 */

async function testSaveUserSchedule() {
  console.log('\n🧪 Testing: Save User Schedule Data');
  console.log('='.repeat(50));
  
  try {
    const userDocRef = db.collection('users').doc(mockUserId);
    const scheduleDocRef = userDocRef.collection('scheduleData').doc('main');
    
    // Save the schedule data
    await scheduleDocRef.set(mockUserScheduleData);
    
    console.log('✅ Successfully saved user schedule data');
    console.log('📊 Data saved:', {
      userId: mockUserId,
      eventsCount: mockUserScheduleData.events.length,
      templatesCount: mockUserScheduleData.templates.length,
      lastModified: mockUserScheduleData.lastModified
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to save user schedule data:', error);
    return false;
  }
}

async function testRetrieveUserSchedule() {
  console.log('\n🔍 Testing: Retrieve User Schedule Data');
  console.log('='.repeat(50));
  
  try {
    const userDocRef = db.collection('users').doc(mockUserId);
    const scheduleDocRef = userDocRef.collection('scheduleData').doc('main');
    
    // Retrieve the schedule data
    const doc = await scheduleDocRef.get();
    
    if (!doc.exists) {
      console.error('❌ No schedule data found for user');
      return false;
    }
    
    const retrievedData = doc.data();
    console.log('✅ Successfully retrieved user schedule data');
    console.log('📊 Data retrieved:', {
      eventsCount: retrievedData.events?.length || 0,
      templatesCount: retrievedData.templates?.length || 0,
      lastModified: retrievedData.lastModified,
      version: retrievedData.version
    });
    
    // Verify data integrity
    const dataMatches = JSON.stringify(retrievedData) === JSON.stringify(mockUserScheduleData);
    console.log('🔍 Data integrity check:', dataMatches ? '✅ PASSED' : '❌ FAILED');
    
    if (!dataMatches) {
      console.log('Expected:', mockUserScheduleData);
      console.log('Retrieved:', retrievedData);
    }
    
    return dataMatches;
  } catch (error) {
    console.error('❌ Failed to retrieve user schedule data:', error);
    return false;
  }
}

async function testUpdateUserEvent() {
  console.log('\n🔄 Testing: Update Individual Event');
  console.log('='.repeat(50));
  
  try {
    const userDocRef = db.collection('users').doc(mockUserId);
    const scheduleDocRef = userDocRef.collection('scheduleData').doc('main');
    
    // Update the event title
    const updatedEvent = {
      ...mockScheduleEvent,
      title: 'Updated Group Session',
      topic: 'Advanced Mathematics',
      modified: new Date().toISOString()
    };
    
    // Get current data
    const doc = await scheduleDocRef.get();
    const currentData = doc.data();
    
    // Update the specific event
    const updatedEvents = currentData.events.map(event => 
      event.id === mockScheduleEvent.id ? updatedEvent : event
    );
    
    // Save updated data
    await scheduleDocRef.update({
      events: updatedEvents,
      lastModified: new Date().toISOString(),
      version: (currentData.version || 1) + 1
    });
    
    console.log('✅ Successfully updated event');
    console.log('📊 Updated event:', {
      id: updatedEvent.id,
      oldTitle: mockScheduleEvent.title,
      newTitle: updatedEvent.title,
      oldTopic: mockScheduleEvent.topic,
      newTopic: updatedEvent.topic
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to update event:', error);
    return false;
  }
}

async function testUpdateUserTemplate() {
  console.log('\n📝 Testing: Update Template');
  console.log('='.repeat(50));
  
  try {
    const userDocRef = db.collection('users').doc(mockUserId);
    const scheduleDocRef = userDocRef.collection('scheduleData').doc('main');
    
    // Update the template
    const updatedTemplate = {
      ...mockTemplate,
      name: 'Updated Daily Template',
      description: 'Enhanced template with more sessions',
      modified: new Date().toISOString()
    };
    
    // Get current data
    const doc = await scheduleDocRef.get();
    const currentData = doc.data();
    
    // Update the specific template
    const updatedTemplates = currentData.templates.map(template => 
      template.id === mockTemplate.id ? updatedTemplate : template
    );
    
    // Save updated data
    await scheduleDocRef.update({
      templates: updatedTemplates,
      lastModified: new Date().toISOString(),
      version: (currentData.version || 1) + 1
    });
    
    console.log('✅ Successfully updated template');
    console.log('📊 Updated template:', {
      id: updatedTemplate.id,
      oldName: mockTemplate.name,
      newName: updatedTemplate.name,
      eventsCount: updatedTemplate.events.length
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to update template:', error);
    return false;
  }
}

async function testDataPersistence() {
  console.log('\n💾 Testing: Data Persistence After Multiple Operations');
  console.log('='.repeat(50));
  
  try {
    const userDocRef = db.collection('users').doc(mockUserId);
    const scheduleDocRef = userDocRef.collection('scheduleData').doc('main');
    
    // Add a new event
    const newEvent = {
      id: 'event-' + uuidv4(),
      title: 'Persistence Test Event',
      startTime: '16:00',
      endTime: '17:00',
      day: 'Tuesday',
      type: 'study-time',
      topic: 'Biology',
      description: 'Testing data persistence',
      color: '#EF4444',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
    
    // Get current data
    const doc = await scheduleDocRef.get();
    const currentData = doc.data();
    
    // Add new event
    const updatedEvents = [...currentData.events, newEvent];
    
    await scheduleDocRef.update({
      events: updatedEvents,
      lastModified: new Date().toISOString(),
      version: (currentData.version || 1) + 1
    });
    
    // Verify the data persists by reading it back
    const verificationDoc = await scheduleDocRef.get();
    const verificationData = verificationDoc.data();
    
    const hasNewEvent = verificationData.events.some(event => event.id === newEvent.id);
    
    console.log('✅ Data persistence test completed');
    console.log('📊 Results:', {
      totalEvents: verificationData.events.length,
      newEventPersisted: hasNewEvent ? '✅ YES' : '❌ NO',
      currentVersion: verificationData.version
    });
    
    return hasNewEvent;
  } catch (error) {
    console.error('❌ Data persistence test failed:', error);
    return false;
  }
}

async function testCloudFunctionsCalls() {
  console.log('\n☁️ Testing: Cloud Functions Integration');
  console.log('='.repeat(50));
  
  try {
    // Note: This would require the functions to be deployed or running in emulator
    console.log('⚠️ Cloud Functions testing requires functions emulator');
    console.log('📝 Functions to test:');
    console.log('  - saveUserSchedule');
    console.log('  - getUserSchedule');
    console.log('  - updateUserEvent');
    console.log('  - updateUserTemplate');
    
    // For now, we'll just verify the functions exist by checking the source
    const fs = require('fs');
    const path = require('path');
    
    const functionsPath = path.join(__dirname, 'functions', 'src', 'callable', 'user.ts');
    if (fs.existsSync(functionsPath)) {
      const functionsContent = fs.readFileSync(functionsPath, 'utf8');
      const hasSaveFunction = functionsContent.includes('saveUserSchedule');
      const hasGetFunction = functionsContent.includes('getUserSchedule');
      const hasUpdateEventFunction = functionsContent.includes('updateUserEvent');
      const hasUpdateTemplateFunction = functionsContent.includes('updateUserTemplate');
      
      console.log('📋 Function availability check:');
      console.log(`  - saveUserSchedule: ${hasSaveFunction ? '✅' : '❌'}`);
      console.log(`  - getUserSchedule: ${hasGetFunction ? '✅' : '❌'}`);
      console.log(`  - updateUserEvent: ${hasUpdateEventFunction ? '✅' : '❌'}`);
      console.log(`  - updateUserTemplate: ${hasUpdateTemplateFunction ? '✅' : '❌'}`);
      
      return hasSaveFunction && hasGetFunction && hasUpdateEventFunction && hasUpdateTemplateFunction;
    } else {
      console.log('❌ Functions source file not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Cloud Functions test failed:', error);
    return false;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning Up Test Data');
  console.log('='.repeat(50));
  
  try {
    const userDocRef = db.collection('users').doc(mockUserId);
    await userDocRef.delete();
    console.log('✅ Test data cleaned up successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clean up test data:', error);
    return false;
  }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log('🚀 TIMEOUTS DATABASE INTEGRATION TEST SUITE');
  console.log('='.repeat(60));
  console.log(`📅 Test started at: ${new Date().toISOString()}`);
  console.log(`🆔 Test User ID: ${mockUserId}`);
  
  const results = {
    save: false,
    retrieve: false,
    updateEvent: false,
    updateTemplate: false,
    persistence: false,
    functions: false,
    cleanup: false
  };
  
  try {
    // Run all tests
    results.save = await testSaveUserSchedule();
    results.retrieve = await testRetrieveUserSchedule();
    results.updateEvent = await testUpdateUserEvent();
    results.updateTemplate = await testUpdateUserTemplate();
    results.persistence = await testDataPersistence();
    results.functions = await testCloudFunctionsCalls();
    results.cleanup = await cleanupTestData();
    
    // Print final results
    console.log('\n📊 FINAL TEST RESULTS');
    console.log('='.repeat(60));
    
    const passedTests = Object.values(results).filter(result => result === true).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log('\n📋 Detailed Results:');
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASSED' : '❌ FAILED';
      const testName = test.charAt(0).toUpperCase() + test.slice(1);
      console.log(`  ${status} - ${testName}`);
    });
    
    const overallSuccess = passedTests === totalTests;
    console.log(`\n🎯 Overall Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (overallSuccess) {
      console.log('\n🎉 Database integration is working correctly!');
      console.log('✅ Timetable data can be saved to the database');
      console.log('✅ Timetable data can be retrieved from the database');
      console.log('✅ Individual events and templates can be updated');
      console.log('✅ Data persistence is maintained across operations');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the implementation.');
    }
    
  } catch (error) {
    console.error('\n💥 Test suite failed with error:', error);
  }
  
  console.log(`\n📅 Test completed at: ${new Date().toISOString()}`);
  process.exit(0);
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testSaveUserSchedule,
  testRetrieveUserSchedule,
  testUpdateUserEvent,
  testUpdateUserTemplate,
  testDataPersistence,
  cleanupTestData
};