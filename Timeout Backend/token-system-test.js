#!/usr/bin/env node

/**
 * TimeOut Token System Integration Test
 * Tests both backend Firebase functions and frontend integration
 * 
 * Usage: node token-system-test.js
 */

const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable, connectFunctionsEmulator } = require('firebase/functions');
const { getAuth, signInAnonymously } = require('firebase/auth');

// Color codes for console output
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

// Test configuration
const TEST_CONFIG = {
  useEmulator: true,
  emulatorHost: 'localhost',
  functionsPort: 5001,
  firestorePort: 8090,
  projectId: 'timeout-backend-340e2',
  testUserId: `test-user-${Date.now()}`,
  
  // Test scenarios
  testCases: {
    backend: [
      {
        name: 'Save Mock Token Data',
        type: 'saveUserTokens',
        data: {
          tokenStats: {
            totalTokens: 1500,
            availableTokens: 1200,
            todayTokens: 300,
            weeklyTokens: 800,
            currentStreak: 5,
            longestStreak: 12,
            rank: { daily: 25, weekly: 45, allTime: 120 },
            achievements: ['first_session', 'streak_keeper']
          },
          transactions: [
            {
              id: 'test-txn-1',
              type: 'earned',
              amount: 50,
              reason: 'Focus session completed',
              category: 'focus',
              timestamp: new Date().toISOString(),
              metadata: { duration: 25, sessionId: 'session-123' }
            },
            {
              id: 'test-txn-2',
              type: 'spent',
              amount: 100,
              reason: 'Purchased forest theme',
              category: 'shop',
              timestamp: new Date(Date.now() - 3600000).toISOString()
            }
          ]
        }
      },
      {
        name: 'Get Token Data',
        type: 'getUserTokens',
        data: {}
      },
      {
        name: 'Add Token Transaction',
        type: 'addTokenTransaction',
        data: {
          amount: 75,
          reason: 'Daily goal achieved',
          category: 'goal',
          type: 'earned',
          metadata: { multiplier: 1.5 }
        }
      },
      {
        name: 'Update Token Balance',
        type: 'updateTokenBalance',
        data: {
          amount: 25,
          reason: 'Streak bonus',
          type: 'earned'
        }
      }
    ]
  }
};

class TokenSystemTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.adminApp = null;
    this.clientApp = null;
    this.functions = null;
    this.db = null;
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async initialize() {
    this.log('\n🚀 Initializing Token System Test Suite...', 'bright');
    
    try {
      // Initialize Firebase Admin (for direct database access)
      if (TEST_CONFIG.useEmulator) {
        process.env.FIRESTORE_EMULATOR_HOST = `${TEST_CONFIG.emulatorHost}:${TEST_CONFIG.firestorePort}`;
        this.log(`📡 Using Firestore emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`, 'yellow');
      }

      this.adminApp = admin.initializeApp({
        projectId: TEST_CONFIG.projectId
      }, 'admin-app');
      
      this.db = admin.firestore();
      
      // Initialize Firebase Client (for function calls)
      this.clientApp = initializeApp({
        projectId: TEST_CONFIG.projectId
      });

      this.functions = getFunctions(this.clientApp);
      
      if (TEST_CONFIG.useEmulator) {
        connectFunctionsEmulator(this.functions, TEST_CONFIG.emulatorHost, TEST_CONFIG.functionsPort);
        this.log(`📡 Using Functions emulator: ${TEST_CONFIG.emulatorHost}:${TEST_CONFIG.functionsPort}`, 'yellow');
      }

      this.log('✅ Firebase initialization completed', 'green');
      
      // Clean up any existing test data
      await this.cleanupTestData();
      
    } catch (error) {
      this.log(`❌ Initialization failed: ${error.message}`, 'red');
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
      this.log('🧹 Test data cleaned up', 'cyan');
    } catch (error) {
      // Ignore cleanup errors as data might not exist
      this.log('ℹ️ No existing test data to clean up', 'yellow');
    }
  }

  async testBackendFunction(testCase) {
    const { name, type, data } = testCase;
    this.log(`\n🧪 Testing: ${name}`, 'blue');
    
    try {
      // Create authenticated context for function calls
      const callable = httpsCallable(this.functions, type);
      
      // Mock authentication by setting a custom auth token
      // Note: In real production, this would be handled by Firebase Auth
      const result = await callable(data);
      
      this.log(`✅ ${name} - SUCCESS`, 'green');
      this.log(`📊 Response: ${JSON.stringify(result.data, null, 2)}`, 'cyan');
      
      this.testResults.passed++;
      return result.data;
      
    } catch (error) {
      this.log(`❌ ${name} - FAILED`, 'red');
      this.log(`💥 Error: ${error.message}`, 'red');
      
      this.testResults.failed++;
      this.testResults.errors.push({
        test: name,
        error: error.message,
        code: error.code || 'unknown'
      });
      
      return null;
    }
  }

  async testDatabaseDirectAccess() {
    this.log('\n🗄️ Testing Direct Database Access...', 'blue');
    
    try {
      // Test writing directly to Firestore
      const testData = {
        totalTokens: 500,
        availableTokens: 400,
        todayTokens: 100,
        lastUpdated: new Date()
      };
      
      await this.db
        .collection('users')
        .doc(TEST_CONFIG.testUserId)
        .collection('tokens')
        .doc('stats')
        .set(testData);
      
      // Test reading from Firestore
      const doc = await this.db
        .collection('users')
        .doc(TEST_CONFIG.testUserId)
        .collection('tokens')
        .doc('stats')
        .get();
      
      if (doc.exists) {
        const data = doc.data();
        this.log('✅ Direct Database Access - SUCCESS', 'green');
        this.log(`📊 Data: ${JSON.stringify(data, null, 2)}`, 'cyan');
        this.testResults.passed++;
      } else {
        throw new Error('Document was not found after creation');
      }
      
    } catch (error) {
      this.log('❌ Direct Database Access - FAILED', 'red');
      this.log(`💥 Error: ${error.message}`, 'red');
      this.testResults.failed++;
      this.testResults.errors.push({
        test: 'Direct Database Access',
        error: error.message
      });
    }
  }

  async testFrontendIntegration() {
    this.log('\n🌐 Testing Frontend Integration Patterns...', 'blue');
    
    try {
      // Simulate frontend token operations
      const frontendOperations = [
        {
          name: 'Award Tokens (Frontend Pattern)',
          operation: async () => {
            // This simulates what happens in TokenContext.awardTokens()
            const transaction = {
              id: `frontend-test-${Date.now()}`,
              type: 'earned',
              amount: 50,
              reason: 'Frontend integration test',
              category: 'focus',
              timestamp: new Date().toISOString(),
              metadata: { testRun: true }
            };
            
            // Call backend function (simulating frontend API call)
            const addTransaction = httpsCallable(this.functions, 'addTokenTransaction');
            const result = await addTransaction({
              amount: transaction.amount,
              reason: transaction.reason,
              category: transaction.category,
              type: transaction.type,
              metadata: transaction.metadata
            });
            
            return result.data;
          }
        },
        {
          name: 'Spend Tokens (Frontend Pattern)',
          operation: async () => {
            // This simulates what happens in TokenContext.spendTokens()
            const updateBalance = httpsCallable(this.functions, 'updateTokenBalance');
            const result = await updateBalance({
              amount: 25,
              reason: 'Frontend spend test',
              type: 'spent'
            });
            
            return result.data;
          }
        },
        {
          name: 'Load Token Data (Frontend Pattern)',
          operation: async () => {
            // This simulates what happens in TokenContext.loadFromDatabase()
            const getUserTokens = httpsCallable(this.functions, 'getUserTokens');
            const result = await getUserTokens({});
            
            return result.data;
          }
        }
      ];
      
      for (const { name, operation } of frontendOperations) {
        try {
          const result = await operation();
          this.log(`✅ ${name} - SUCCESS`, 'green');
          this.log(`📊 Result: ${JSON.stringify(result, null, 2)}`, 'cyan');
          this.testResults.passed++;
        } catch (error) {
          this.log(`❌ ${name} - FAILED`, 'red');
          this.log(`💥 Error: ${error.message}`, 'red');
          this.testResults.failed++;
          this.testResults.errors.push({
            test: name,
            error: error.message
          });
        }
      }
      
    } catch (error) {
      this.log('❌ Frontend Integration Test - FAILED', 'red');
      this.log(`💥 Error: ${error.message}`, 'red');
      this.testResults.failed++;
    }
  }

  async testDataPersistence() {
    this.log('\n💾 Testing Data Persistence...', 'blue');
    
    try {
      // Test that data persists across function calls
      const saveTokens = httpsCallable(this.functions, 'saveUserTokens');
      const getUserTokens = httpsCallable(this.functions, 'getUserTokens');
      
      const testData = {
        tokenStats: {
          totalTokens: 2000,
          availableTokens: 1800,
          todayTokens: 200,
          weeklyTokens: 500,
          currentStreak: 7,
          longestStreak: 15,
          rank: { daily: 10, weekly: 25, allTime: 50 },
          achievements: ['persistence_test']
        },
        transactions: [
          {
            id: 'persistence-test-1',
            type: 'earned',
            amount: 100,
            reason: 'Persistence test transaction',
            category: 'focus',
            timestamp: new Date().toISOString()
          }
        ]
      };
      
      // Save data
      await saveTokens(testData);
      this.log('✅ Data saved successfully', 'green');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Retrieve data
      const result = await getUserTokens({});
      const retrievedData = result.data;
      
      if (retrievedData && retrievedData.success) {
        this.log('✅ Data retrieved successfully', 'green');
        this.log(`📊 Retrieved: ${JSON.stringify(retrievedData.data.tokenStats, null, 2)}`, 'cyan');
        
        // Verify data integrity
        const saved = testData.tokenStats;
        const retrieved = retrievedData.data.tokenStats;
        
        const isMatch = saved.totalTokens === retrieved.totalTokens &&
                       saved.availableTokens === retrieved.availableTokens &&
                       saved.todayTokens === retrieved.todayTokens;
        
        if (isMatch) {
          this.log('✅ Data Persistence - SUCCESS', 'green');
          this.testResults.passed++;
        } else {
          throw new Error('Retrieved data does not match saved data');
        }
      } else {
        throw new Error('Failed to retrieve saved data');
      }
      
    } catch (error) {
      this.log('❌ Data Persistence - FAILED', 'red');
      this.log(`💥 Error: ${error.message}`, 'red');
      this.testResults.failed++;
      this.testResults.errors.push({
        test: 'Data Persistence',
        error: error.message
      });
    }
  }

  async runAllTests() {
    this.log('\n🎯 Starting Comprehensive Token System Tests...', 'bright');
    
    try {
      await this.initialize();
      
      // Test backend functions
      this.log('\n📋 BACKEND FUNCTION TESTS', 'magenta');
      for (const testCase of TEST_CONFIG.testCases.backend) {
        await this.testBackendFunction(testCase);
      }
      
      // Test direct database access
      await this.testDatabaseDirectAccess();
      
      // Test frontend integration patterns
      await this.testFrontendIntegration();
      
      // Test data persistence
      await this.testDataPersistence();
      
      // Generate test report
      await this.generateTestReport();
      
    } catch (error) {
      this.log(`💥 Test suite failed: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  async generateTestReport() {
    this.log('\n📊 TEST RESULTS SUMMARY', 'bright');
    this.log('═'.repeat(50), 'cyan');
    
    const total = this.testResults.passed + this.testResults.failed;
    const successRate = total > 0 ? ((this.testResults.passed / total) * 100).toFixed(1) : 0;
    
    this.log(`Total Tests: ${total}`, 'blue');
    this.log(`Passed: ${this.testResults.passed}`, 'green');
    this.log(`Failed: ${this.testResults.failed}`, this.testResults.failed > 0 ? 'red' : 'green');
    this.log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
    
    if (this.testResults.errors.length > 0) {
      this.log('\n❌ FAILED TESTS:', 'red');
      this.testResults.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error.test}`, 'red');
        this.log(`   Error: ${error.error}`, 'red');
        if (error.code) {
          this.log(`   Code: ${error.code}`, 'red');
        }
      });
    }
    
    this.log('\n🏁 Test Suite Completed!', 'bright');
    
    // Cleanup
    await this.cleanupTestData();
    
    if (this.testResults.failed === 0) {
      this.log('🎉 All tests passed! Token system is working correctly.', 'green');
      process.exit(0);
    } else {
      this.log('⚠️ Some tests failed. Please review the errors above.', 'yellow');
      process.exit(1);
    }
  }
}

// Run the test suite
if (require.main === module) {
  const tester = new TokenSystemTester();
  tester.runAllTests().catch(error => {
    console.error(`💥 Test suite crashed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = TokenSystemTester;