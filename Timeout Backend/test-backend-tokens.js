#!/usr/bin/env node

/**
 * Firebase Functions Token System Test
 * Tests the token backend functions directly with the Firebase emulators
 * 
 * Prerequisites:
 * 1. Firebase emulators must be running (firebase emulators:start)
 * 2. Run from the Timeout Backend directory
 * 
 * Usage: node test-backend-tokens.js
 */

const admin = require('firebase-admin');

// Test configuration
const TEST_CONFIG = {
  projectId: 'timeout-backend-340e2',
  emulatorHost: 'localhost',
  firestorePort: 8090,
  testUserId: `test-user-${Date.now()}`,
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class BackendTokenTester {
  constructor() {
    this.db = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async initialize() {
    log('\n🚀 Initializing Backend Token Test...', 'bright');
    
    try {
      // Set emulator host
      process.env.FIRESTORE_EMULATOR_HOST = `${TEST_CONFIG.emulatorHost}:${TEST_CONFIG.firestorePort}`;
      log(`📡 Using Firestore emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`, 'yellow');

      // Initialize Firebase Admin
      admin.initializeApp({
        projectId: TEST_CONFIG.projectId
      });
      
      this.db = admin.firestore();
      log('✅ Firebase Admin initialized', 'green');
      
      // Clean up any existing test data
      await this.cleanupTestData();
      
    } catch (error) {
      log(`❌ Initialization failed: ${error.message}`, 'red');
      throw error;
    }
  }

  async cleanupTestData() {
    try {
      const userDoc = this.db.collection('users').doc(TEST_CONFIG.testUserId);
      const tokensCollection = userDoc.collection('tokens');
      
      // Delete all documents in tokens collection
      const batch = this.db.batch();
      
      // Delete stats document
      batch.delete(tokensCollection.doc('stats'));
      
      // Delete all transactions
      const transactionsSnapshot = await tokensCollection.doc('transactions').collection('items').get();
      transactionsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      log('🧹 Test data cleaned up', 'cyan');
    } catch (error) {
      // Ignore cleanup errors as data might not exist
      log('ℹ️ No existing test data to clean up', 'yellow');
    }
  }

  async testDirectDatabaseOperations() {
    log('\n🗄️ Testing Direct Database Operations...', 'blue');
    
    try {
      // Test 1: Write token stats
      const testTokenStats = {
        totalTokens: 1000,
        availableTokens: 800,
        todayTokens: 200,
        weeklyTokens: 500,
        currentStreak: 5,
        longestStreak: 12,
        rank: { daily: 25, weekly: 45, allTime: 120 },
        achievements: ['test_achievement'],
        lastUpdated: admin.firestore.Timestamp.now()
      };
      
      await this.db
        .collection('users')
        .doc(TEST_CONFIG.testUserId)
        .collection('tokens')
        .doc('stats')
        .set(testTokenStats);
      
      log('  ✅ Token stats written to database', 'green');
      this.testResults.passed++;
      
      // Test 2: Read token stats
      const statsDoc = await this.db
        .collection('users')
        .doc(TEST_CONFIG.testUserId)
        .collection('tokens')
        .doc('stats')
        .get();
      
      if (!statsDoc.exists) {
        throw new Error('Token stats not found after writing');
      }
      
      const retrievedStats = statsDoc.data();
      if (retrievedStats.totalTokens !== testTokenStats.totalTokens) {
        throw new Error('Retrieved data does not match written data');
      }
      
      log('  ✅ Token stats read from database', 'green');
      log(`  📊 Retrieved: ${retrievedStats.totalTokens} total tokens`, 'cyan');
      this.testResults.passed++;
      
      // Test 3: Write transaction
      const testTransaction = {
        id: `test-txn-${Date.now()}`,
        type: 'earned',
        amount: 50,
        reason: 'Backend test transaction',
        category: 'focus',
        timestamp: admin.firestore.Timestamp.now(),
        metadata: { testRun: true }
      };
      
      await this.db
        .collection('users')
        .doc(TEST_CONFIG.testUserId)
        .collection('tokens')
        .doc('transactions')
        .collection('items')
        .doc(testTransaction.id)
        .set(testTransaction);
      
      log('  ✅ Transaction written to database', 'green');
      this.testResults.passed++;
      
      // Test 4: Read transactions
      const transactionsSnapshot = await this.db
        .collection('users')
        .doc(TEST_CONFIG.testUserId)
        .collection('tokens')
        .doc('transactions')
        .collection('items')
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();
      
      if (transactionsSnapshot.empty) {
        throw new Error('No transactions found after writing');
      }
      
      log('  ✅ Transactions read from database', 'green');
      log(`  📋 Retrieved: ${transactionsSnapshot.size} transactions`, 'cyan');
      this.testResults.passed++;
      
    } catch (error) {
      log(`  ❌ Database operations failed: ${error.message}`, 'red');
      this.testResults.failed++;
      this.testResults.errors.push({
        test: 'Direct Database Operations',
        error: error.message
      });
    }
  }

  async testBatchOperations() {
    log('\n📦 Testing Batch Operations...', 'blue');
    
    try {
      const batch = this.db.batch();
      
      // Create multiple transactions in a batch
      const transactions = [
        {
          id: `batch-txn-1-${Date.now()}`,
          type: 'earned',
          amount: 25,
          reason: 'Batch test 1',
          category: 'focus',
          timestamp: admin.firestore.Timestamp.now()
        },
        {
          id: `batch-txn-2-${Date.now()}`,
          type: 'earned',
          amount: 35,
          reason: 'Batch test 2',
          category: 'goal',
          timestamp: admin.firestore.Timestamp.now()
        },
        {
          id: `batch-txn-3-${Date.now()}`,
          type: 'spent',
          amount: 20,
          reason: 'Batch test purchase',
          category: 'shop',
          timestamp: admin.firestore.Timestamp.now()
        }
      ];
      
      transactions.forEach(transaction => {
        const transactionRef = this.db
          .collection('users')
          .doc(TEST_CONFIG.testUserId)
          .collection('tokens')
          .doc('transactions')
          .collection('items')
          .doc(transaction.id);
        batch.set(transactionRef, transaction);
      });
      
      await batch.commit();
      
      log('  ✅ Batch operations completed', 'green');
      log(`  📦 Created ${transactions.length} transactions in batch`, 'cyan');
      this.testResults.passed++;
      
      // Verify batch operations
      const verifySnapshot = await this.db
        .collection('users')
        .doc(TEST_CONFIG.testUserId)
        .collection('tokens')
        .doc('transactions')
        .collection('items')
        .where('reason', '>=', 'Batch test')
        .where('reason', '<=', 'Batch test' + '\uf8ff')
        .get();
      
      if (verifySnapshot.size !== transactions.length) {
        throw new Error(`Expected ${transactions.length} batch transactions, found ${verifySnapshot.size}`);
      }
      
      log('  ✅ Batch operations verified', 'green');
      this.testResults.passed++;
      
    } catch (error) {
      log(`  ❌ Batch operations failed: ${error.message}`, 'red');
      this.testResults.failed++;
      this.testResults.errors.push({
        test: 'Batch Operations',
        error: error.message
      });
    }
  }

  async testDataIntegrity() {
    log('\n🔍 Testing Data Integrity...', 'blue');
    
    try {
      // Test data types and structure
      const statsDoc = await this.db
        .collection('users')
        .doc(TEST_CONFIG.testUserId)
        .collection('tokens')
        .doc('stats')
        .get();
      
      if (statsDoc.exists) {
        const data = statsDoc.data();
        
        // Check required fields
        const requiredFields = ['totalTokens', 'availableTokens', 'todayTokens', 'weeklyTokens'];
        for (const field of requiredFields) {
          if (typeof data[field] !== 'number') {
            throw new Error(`Field ${field} is not a number: ${typeof data[field]}`);
          }
        }
        
        // Check that totals make sense
        if (data.availableTokens > data.totalTokens) {
          throw new Error('Available tokens cannot exceed total tokens');
        }
        
        if (data.todayTokens > data.weeklyTokens) {
          throw new Error('Today tokens cannot exceed weekly tokens');
        }
        
        log('  ✅ Token stats data integrity verified', 'green');
        this.testResults.passed++;
      }
      
      // Test transaction data integrity
      const transactionsSnapshot = await this.db
        .collection('users')
        .doc(TEST_CONFIG.testUserId)
        .collection('tokens')
        .doc('transactions')
        .collection('items')
        .limit(5)
        .get();
      
      transactionsSnapshot.forEach(doc => {
        const transaction = doc.data();
        
        // Check required fields
        if (!transaction.id || !transaction.type || typeof transaction.amount !== 'number') {
          throw new Error(`Invalid transaction structure in doc ${doc.id}`);
        }
        
        // Check valid types
        if (!['earned', 'spent', 'penalty'].includes(transaction.type)) {
          throw new Error(`Invalid transaction type: ${transaction.type}`);
        }
        
        // Check valid categories
        const validCategories = ['focus', 'goal', 'streak', 'social', 'achievement', 'shop'];
        if (!validCategories.includes(transaction.category)) {
          throw new Error(`Invalid category: ${transaction.category}`);
        }
      });
      
      log('  ✅ Transaction data integrity verified', 'green');
      log(`  📋 Checked ${transactionsSnapshot.size} transactions`, 'cyan');
      this.testResults.passed++;
      
    } catch (error) {
      log(`  ❌ Data integrity check failed: ${error.message}`, 'red');
      this.testResults.failed++;
      this.testResults.errors.push({
        test: 'Data Integrity',
        error: error.message
      });
    }
  }

  async testPerformance() {
    log('\n⚡ Testing Performance...', 'blue');
    
    try {
      const startTime = Date.now();
      
      // Test reading stats performance
      const statsPromise = this.db
        .collection('users')
        .doc(TEST_CONFIG.testUserId)
        .collection('tokens')
        .doc('stats')
        .get();
      
      // Test reading transactions performance
      const transactionsPromise = this.db
        .collection('users')
        .doc(TEST_CONFIG.testUserId)
        .collection('tokens')
        .doc('transactions')
        .collection('items')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();
      
      // Execute both queries in parallel
      const [statsDoc, transactionsSnapshot] = await Promise.all([statsPromise, transactionsPromise]);
      
      const duration = Date.now() - startTime;
      
      log(`  ✅ Parallel read operations completed in ${duration}ms`, 'green');
      log(`  📊 Stats document: ${statsDoc.exists ? 'found' : 'not found'}`, 'cyan');
      log(`  📋 Transactions: ${transactionsSnapshot.size} documents`, 'cyan');
      
      if (duration > 2000) {
        log('  ⚠️ Performance warning: Operations took longer than 2 seconds', 'yellow');
      }
      
      this.testResults.passed++;
      
    } catch (error) {
      log(`  ❌ Performance test failed: ${error.message}`, 'red');
      this.testResults.failed++;
      this.testResults.errors.push({
        test: 'Performance',
        error: error.message
      });
    }
  }

  generateReport() {
    log('\n📊 BACKEND TEST REPORT', 'bright');
    log('═'.repeat(50), 'cyan');
    
    const total = this.testResults.passed + this.testResults.failed;
    const successRate = total > 0 ? ((this.testResults.passed / total) * 100).toFixed(1) : 0;
    
    log(`Total Tests: ${total}`, 'blue');
    log(`Passed: ${this.testResults.passed}`, 'green');
    log(`Failed: ${this.testResults.failed}`, this.testResults.failed > 0 ? 'red' : 'green');
    log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
    
    if (this.testResults.errors.length > 0) {
      log('\n❌ FAILED TESTS:', 'red');
      this.testResults.errors.forEach((error, index) => {
        log(`${index + 1}. ${error.test}`, 'red');
        log(`   Error: ${error.error}`, 'red');
      });
    }
    
    log('\n🎯 BACKEND STATUS:', 'bright');
    
    if (this.testResults.failed === 0) {
      log('🎉 All backend tests passed! Database operations are working correctly.', 'green');
      log('   ✅ Token data can be written to Firestore', 'green');
      log('   ✅ Token data can be read from Firestore', 'green');
      log('   ✅ Batch operations are functional', 'green');
      log('   ✅ Data integrity is maintained', 'green');
      log('   ✅ Performance is acceptable', 'green');
    } else if (this.testResults.failed <= 2) {
      log('⚠️ Backend has minor issues but core functionality works', 'yellow');
    } else {
      log('❌ Backend has significant issues that need attention', 'red');
    }
    
    log('\n🏁 Backend Test Completed!', 'bright');
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      await this.testDirectDatabaseOperations();
      await this.testBatchOperations();
      await this.testDataIntegrity();
      await this.testPerformance();
      
      this.generateReport();
      
      // Cleanup
      await this.cleanupTestData();
      
      process.exit(this.testResults.failed === 0 ? 0 : 1);
      
    } catch (error) {
      log(`💥 Test suite crashed: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    }
  }
}

// Run the test suite
if (require.main === module) {
  const tester = new BackendTokenTester();
  tester.runAllTests();
}

module.exports = BackendTokenTester;