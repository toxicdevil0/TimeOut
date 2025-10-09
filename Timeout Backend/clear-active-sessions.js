const admin = require('firebase-admin');

// For emulator, we can use a simple project ID without credentials
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'timeout-backend-340e2'
  });
}

// Connect to EMULATOR
const db = admin.firestore();
db.settings({
  host: 'localhost:8090',
  ssl: false
});

async function clearActiveSessions() {
  console.log('🧹 CLEARING ACTIVE FOCUS SESSIONS FROM EMULATOR\n');
  console.log('=' * 60);
  
  try {
    // Get all active focus sessions
    const activeSessionsQuery = db.collection('focusSessions').where('status', '==', 'active');
    const activeSessionsSnapshot = await activeSessionsQuery.get();
    
    if (activeSessionsSnapshot.empty) {
      console.log('✅ No active sessions found - database is clean!');
      return;
    }
    
    console.log(`⚠️  Found ${activeSessionsSnapshot.size} active session(s) to clean up:`);
    
    // Show what we're about to delete
    activeSessionsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   📄 Session ${doc.id}:`);
      console.log(`      - User ID: ${data.userId}`);
      console.log(`      - Type: ${data.sessionType}`);
      console.log(`      - Duration: ${data.duration} minutes`);
      console.log(`      - Start Time: ${data.startTime ? data.startTime.toDate() : 'Unknown'}`);
      console.log(`      - Status: ${data.status}`);
      console.log('');
    });
    
    // Batch delete all active sessions
    const batch = db.batch();
    activeSessionsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`✅ Successfully cleared ${activeSessionsSnapshot.size} active session(s)!`);
    console.log('🎉 Database is now ready for new sessions.');
    
  } catch (error) {
    console.error('❌ Error clearing active sessions:', error);
    console.error('Make sure Firebase emulators are running!');
  }
}

// Also provide a function to check session status
async function checkSessionStatus() {
  console.log('🔍 CHECKING FOCUS SESSION STATUS\n');
  console.log('=' * 50);
  
  try {
    const allSessionsSnapshot = await db.collection('focusSessions').get();
    
    if (allSessionsSnapshot.empty) {
      console.log('📭 No focus sessions found in database');
      return;
    }
    
    const statusCounts = {};
    allSessionsSnapshot.forEach((doc) => {
      const data = doc.data();
      const status = data.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log(`📊 Total sessions: ${allSessionsSnapshot.size}`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      const emoji = status === 'active' ? '🟡' : status === 'completed' ? '✅' : status === 'interrupted' ? '❌' : '❓';
      console.log(`   ${emoji} ${status}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking session status:', error);
  }
}

// Run the script
async function main() {
  await checkSessionStatus();
  console.log('\n');
  await clearActiveSessions();
  console.log('\n');
  await checkSessionStatus();
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { clearActiveSessions, checkSessionStatus };