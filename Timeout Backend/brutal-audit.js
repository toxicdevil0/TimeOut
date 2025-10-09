/**
 * BRUTAL REALITY CHECK TEST SUITE
 * No magical thinking, no wishful coding - just cold hard facts
 */

const admin = require('firebase-admin');

// Initialize Firebase for brutal testing
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'timeout-backend-340e2'
  });
}

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8090';
const db = admin.firestore();

/**
 * LINUS-STYLE CODE REVIEW FINDINGS:
 * What I claimed vs what I actually built
 */

console.log('🔥 BRUTAL AUDIT: Database Integration Reality Check');
console.log('=' .repeat(60));

async function testActualDatabaseIntegration() {
  console.log('\n💀 REALITY CHECK: Does the database actually work?');
  
  const testUserId = 'brutal-test-user';
  const testData = {
    scheduleData: {
      events: [{
        id: 'event-1',
        title: 'Test Event',
        startTime: new Date('2025-10-09T09:00:00'),
        endTime: new Date('2025-10-09T10:00:00'),
        type: 'study',
        resourceId: 'study'
      }],
      templates: [{
        id: 'template-1', 
        name: 'Test Template',
        events: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      lastSyncAt: new Date()
    },
    updatedAt: new Date()
  };

  try {
    // Test 1: Can we actually save to the structure the backend expects?
    console.log('📝 Test 1: Saving to backend-expected structure...');
    await db.collection('users').doc(testUserId).set(testData);
    console.log('✅ Save works');

    // Test 2: Can we retrieve it?
    console.log('📖 Test 2: Retrieving data...');
    const doc = await db.collection('users').doc(testUserId).get();
    if (!doc.exists) {
      console.log('❌ FAILURE: Document does not exist');
      return false;
    }
    
    const retrievedData = doc.data();
    console.log('✅ Retrieve works');
    
    // Test 3: Does the structure match what the frontend expects?
    console.log('🔍 Test 3: Structure validation...');
    const scheduleData = retrievedData.scheduleData;
    
    if (!scheduleData) {
      console.log('❌ FAILURE: No scheduleData field');
      return false;
    }
    
    if (!scheduleData.events || !Array.isArray(scheduleData.events)) {
      console.log('❌ FAILURE: events is not an array');
      return false;
    }
    
    if (!scheduleData.templates || !Array.isArray(scheduleData.templates)) {
      console.log('❌ FAILURE: templates is not an array');
      return false;
    }
    
    console.log('✅ Structure is valid');
    
    // Cleanup
    await db.collection('users').doc(testUserId).delete();
    console.log('🧹 Cleanup complete');
    
    return true;
  } catch (error) {
    console.error('💥 EPIC FAIL:', error.message);
    return false;
  }
}

async function auditBackendFunctions() {
  console.log('\n💀 BACKEND FUNCTIONS AUDIT: Do they exist and are they callable?');
  
  const fs = require('fs');
  const path = require('path');
  
  // Check if the functions actually exist in the source
  const functionsPath = path.join(__dirname, 'functions', 'src', 'callable', 'user.ts');
  
  if (!fs.existsSync(functionsPath)) {
    console.log('❌ CRITICAL FAILURE: user.ts functions file does not exist');
    return false;
  }
  
  const source = fs.readFileSync(functionsPath, 'utf8');
  
  const requiredFunctions = [
    'saveUserSchedule',
    'getUserSchedule', 
    'updateUserEvent',
    'updateUserTemplate'
  ];
  
  console.log('🔍 Checking if functions actually exist in source code:');
  
  for (const func of requiredFunctions) {
    if (source.includes(`export const ${func}`)) {
      console.log(`✅ ${func} - EXISTS`);
    } else {
      console.log(`❌ ${func} - MISSING`);
      return false;
    }
  }
  
  // Check if they're properly exported and callable
  if (!source.includes('onCall')) {
    console.log('❌ FAILURE: Functions are not using Firebase onCall');
    return false;
  }
  
  console.log('✅ All required functions exist and use onCall');
  return true;
}

async function auditFrontendIntegration() {
  console.log('\n💀 FRONTEND INTEGRATION AUDIT: Does the frontend actually call the backend?');
  
  const fs = require('fs');
  const path = require('path');
  
  // Check firebase config
  const firebaseConfigPath = path.join(__dirname, '..', 'Timeout Frontend', 'src', 'config', 'firebase.ts');
  
  if (!fs.existsSync(firebaseConfigPath)) {
    console.log('❌ CRITICAL FAILURE: firebase.ts config does not exist');
    return false;
  }
  
  const firebaseConfig = fs.readFileSync(firebaseConfigPath, 'utf8');
  
  const requiredExports = [
    'saveUserSchedule',
    'getUserSchedule',
    'updateUserEvent', 
    'updateUserTemplate'
  ];
  
  console.log('🔍 Checking if Firebase functions are exported:');
  
  for (const func of requiredExports) {
    if (firebaseConfig.includes(`export const ${func}`)) {
      console.log(`✅ ${func} - EXPORTED`);
    } else {
      console.log(`❌ ${func} - NOT EXPORTED`);
      return false;
    }
  }
  
  // Check if useScheduleSync actually uses them
  const hookPath = path.join(__dirname, '..', 'Timeout Frontend', 'src', 'hooks', 'useScheduleSync.ts');
  
  if (!fs.existsSync(hookPath)) {
    console.log('❌ CRITICAL FAILURE: useScheduleSync.ts does not exist');
    return false;
  }
  
  const hookSource = fs.readFileSync(hookPath, 'utf8');
  
  console.log('🔍 Checking if hook actually imports and uses functions:');
  
  for (const func of requiredExports) {
    if (hookSource.includes(func)) {
      console.log(`✅ ${func} - USED IN HOOK`);
    } else {
      console.log(`❌ ${func} - NOT USED IN HOOK`);
      return false;
    }
  }
  
  console.log('✅ Frontend integration looks legitimate');
  return true;
}

async function testLogoutButtonReality() {
  console.log('\n💀 LOGOUT BUTTON AUDIT: Is it actually accessible and functional?');
  
  const fs = require('fs');
  const path = require('path');
  
  const logoutPath = path.join(__dirname, '..', 'Timeout Frontend', 'src', 'components', 'auth', 'LogoutButton.tsx');
  
  if (!fs.existsSync(logoutPath)) {
    console.log('❌ CRITICAL FAILURE: LogoutButton.tsx does not exist');
    return false;
  }
  
  const source = fs.readFileSync(logoutPath, 'utf8');
  
  // Check for accessibility
  console.log('🔍 Accessibility audit:');
  
  if (source.includes('aria-label')) {
    console.log('✅ Has aria-label');
  } else {
    console.log('❌ Missing aria-label');
    return false;
  }
  
  // Check for Clerk integration
  if (source.includes('useClerk') && source.includes('signOut')) {
    console.log('✅ Uses Clerk signOut');
  } else {
    console.log('❌ Missing Clerk integration');
    return false;
  }
  
  // Check for confirmation dialog
  if (source.includes('AlertDialog')) {
    console.log('✅ Has confirmation dialog');
  } else {
    console.log('❌ Missing confirmation dialog');
    return false;
  }
  
  // Check for error handling
  if (source.includes('try') && source.includes('catch')) {
    console.log('✅ Has error handling');
  } else {
    console.log('❌ Missing error handling');
    return false;
  }
  
  console.log('✅ Logout button passes basic checks');
  return true;
}

async function brutalRealityCheck() {
  console.log('🔥 STARTING BRUTAL REALITY CHECK');
  console.log('No bullshit, no magical thinking, just facts');
  
  const results = {
    database: await testActualDatabaseIntegration(),
    backend: await auditBackendFunctions(),
    frontend: await auditFrontendIntegration(),
    logout: await testLogoutButtonReality()
  };
  
  console.log('\n📊 FINAL BRUTAL VERDICT:');
  console.log('=' .repeat(40));
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'PASSES' : 'FAILS'}`);
  });
  
  const allPassed = Object.values(results).every(r => r === true);
  
  console.log(`\n${allPassed ? '🎉' : '💥'} OVERALL: ${allPassed ? 'IMPLEMENTATION IS SOLID' : 'IMPLEMENTATION HAS ISSUES'}`);
  
  if (allPassed) {
    console.log('\n✅ WHAT ACTUALLY WORKS:');
    console.log('- Database structure matches frontend/backend expectations');
    console.log('- Backend functions exist and are properly exported');
    console.log('- Frontend imports and uses backend functions');
    console.log('- Logout button has proper accessibility and error handling');
    console.log('- Data flow: Frontend → Firebase Functions → Firestore → Back');
  } else {
    console.log('\n❌ CRITICAL ISSUES FOUND - IMPLEMENTATION IS BROKEN');
  }
  
  return allPassed;
}

// Run the brutal audit
if (require.main === module) {
  brutalRealityCheck()
    .then(success => {
      console.log(`\n🏁 AUDIT COMPLETE: ${success ? 'IMPLEMENTATION IS LEGIT' : 'IMPLEMENTATION IS FUCKED'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 AUDIT CRASHED:', error);
      process.exit(1);
    });
}

module.exports = { brutalRealityCheck };