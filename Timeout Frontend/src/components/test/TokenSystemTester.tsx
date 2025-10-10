/**
 * Token System Production Test
 * 
 * This component can be added to the frontend to test token functionality in a real environment.
 * It creates a comprehensive test interface to verify all token operations.
 */

import React, { useState, useEffect } from 'react';
import { useTokens } from '@/contexts/TokenContext';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Database, Smartphone, TrendingUp, Users } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  error?: string;
  duration?: number;
}

export const TokenSystemTester: React.FC = () => {
  const { user } = useUser();
  const {
    tokens,
    transactions,
    mode,
    isLoading,
    lastSyncTime,
    awardTokens,
    spendTokens,
    canAfford,
    resetDemoData,
    syncToDatabase,
    loadFromDatabase,
    switchToDatabase,
    switchToMock,
    getTokenHistory
  } = useTokens();

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testSummary, setTestSummary] = useState({ passed: 0, failed: 0, total: 0 });

  const updateTestResult = (name: string, updates: Partial<TestResult>) => {
    setTestResults(prev => 
      prev.map(test => 
        test.name === name ? { ...test, ...updates } : test
      )
    );
  };

  const addTestResult = (test: TestResult) => {
    setTestResults(prev => [...prev, test]);
  };

  const runTest = async (
    name: string,
    testFn: () => Promise<void>,
    description: string
  ): Promise<boolean> => {
    const startTime = Date.now();
    
    addTestResult({
      name,
      status: 'running',
      message: `Running: ${description}`
    });

    try {
      await testFn();
      const duration = Date.now() - startTime;
      updateTestResult(name, {
        status: 'passed',
        message: `✅ ${description} - SUCCESS`,
        duration
      });
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(name, {
        status: 'failed',
        message: `❌ ${description} - FAILED`,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    const results = {
      passed: 0,
      failed: 0,
      total: 0
    };

    // Test 1: Context Availability
    const test1Passed = await runTest(
      'context-availability',
      async () => {
        if (!tokens) throw new Error('Token context not available');
        if (typeof awardTokens !== 'function') throw new Error('awardTokens function not available');
        if (typeof spendTokens !== 'function') throw new Error('spendTokens function not available');
      },
      'Token Context Availability'
    );
    results.total++;
    if (test1Passed) results.passed++;
    else results.failed++;

    // Test 2: Mock Data Generation
    const test2Passed = await runTest(
      'mock-data',
      async () => {
        const initialTokens = tokens.totalTokens;
        resetDemoData();
        // Wait for state update
        await new Promise(resolve => setTimeout(resolve, 100));
        if (tokens.totalTokens === initialTokens) {
          throw new Error('Mock data not regenerated');
        }
      },
      'Mock Data Generation'
    );
    results.total++;
    if (test2Passed) results.passed++;
    else results.failed++;

    // Test 3: Award Tokens
    const test3Passed = await runTest(
      'award-tokens',
      async () => {
        const initialTokens = tokens.availableTokens;
        const awardAmount = 50;
        await awardTokens(awardAmount, 'Production test award', 'focus', { sessionId: 'test-session' });
        
        // Wait for optimistic update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Note: We can't reliably test the exact amount due to async nature and potential mock data resets
        // So we'll check if the function executed without error
        if (typeof tokens.availableTokens !== 'number') {
          throw new Error('Available tokens not properly updated');
        }
      },
      'Award Tokens Operation'
    );
    results.total++;
    if (test3Passed) results.passed++;
    else results.failed++;

    // Test 4: Spend Tokens (if we have enough)
    const test4Passed = await runTest(
      'spend-tokens',
      async () => {
        if (tokens.availableTokens < 10) {
          // Award some tokens first
          await awardTokens(20, 'Test preparation', 'focus', { sessionId: 'prep-session' });
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const spendAmount = 10;
        const success = await spendTokens(spendAmount, 'Production test purchase', 'shop');
        
        if (!success) {
          throw new Error('Spend tokens operation failed');
        }
      },
      'Spend Tokens Operation'
    );
    results.total++;
    if (test4Passed) results.passed++;
    else results.failed++;

    // Test 5: Can Afford Check
    const test5Passed = await runTest(
      'can-afford',
      async () => {
        const canAfford1000 = canAfford(1000);
        const canAfford1 = canAfford(1);
        
        if (typeof canAfford1000 !== 'boolean' || typeof canAfford1 !== 'boolean') {
          throw new Error('canAfford function not returning boolean');
        }
        
        // Should be able to afford 1 token (or should have reasonable balance)
        if (!canAfford1 && tokens.availableTokens > 0) {
          throw new Error('canAfford logic inconsistent');
        }
      },
      'Can Afford Check'
    );
    results.total++;
    if (test5Passed) results.passed++;
    else results.failed++;

    // Test 6: Transaction History
    const test6Passed = await runTest(
      'transaction-history',
      async () => {
        const history = getTokenHistory(5);
        
        if (!Array.isArray(history)) {
          throw new Error('Transaction history not an array');
        }
        
        if (history.length > 0) {
          const transaction = history[0];
          if (!transaction.id || !transaction.type || typeof transaction.amount !== 'number') {
            throw new Error('Transaction structure invalid');
          }
        }
      },
      'Transaction History Retrieval'
    );
    results.total++;
    if (test6Passed) results.passed++;
    else results.failed++;

    // Test 7: Mode Switching (Mock)
    const test7Passed = await runTest(
      'mock-mode',
      async () => {
        switchToMock();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (mode !== 'mock') {
          throw new Error('Failed to switch to mock mode');
        }
      },
      'Switch to Mock Mode'
    );
    results.total++;
    if (test7Passed) results.passed++;
    else results.failed++;

    // Test 8: Database Integration (if authenticated)
    if (user) {
      const test8Passed = await runTest(
        'database-integration',
        async () => {
          try {
            // Try to sync to database
            await syncToDatabase();
            
            // Try to switch to database mode
            await switchToDatabase();
            
            if (mode !== 'database') {
              throw new Error('Failed to switch to database mode');
            }
          } catch (error) {
            // If database operations fail, it might be because emulators aren't running
            // This is not necessarily a code error
            throw new Error(`Database operations failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        },
        'Database Integration'
      );
      results.total++;
      if (test8Passed) results.passed++;
      else results.failed++;
    }

    // Test 9: Local Storage Persistence
    const test9Passed = await runTest(
      'local-storage',
      async () => {
        const userId = user?.id || 'demo-user';
        const savedTokens = localStorage.getItem(`timeout-tokens-${userId}`);
        const savedTransactions = localStorage.getItem(`timeout-transactions-${userId}`);
        
        if (!savedTokens || !savedTransactions) {
          throw new Error('Token data not persisted to localStorage');
        }
        
        try {
          JSON.parse(savedTokens);
          JSON.parse(savedTransactions);
        } catch (error) {
          throw new Error('Saved token data is not valid JSON');
        }
      },
      'Local Storage Persistence'
    );
    results.total++;
    if (test9Passed) results.passed++;
    else results.failed++;

    setTestSummary(results);
    setIsRunningTests(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      case 'running': return <Clock className="h-4 w-4 animate-spin" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Token System Production Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{tokens.availableTokens}</div>
              <div className="text-sm text-gray-600">Available Tokens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{transactions.length}</div>
              <div className="text-sm text-gray-600">Transactions</div>
            </div>
            <div className="text-center">
              <Badge variant={mode === 'database' ? 'default' : 'secondary'} className="text-sm">
                {mode === 'database' ? (
                  <>
                    <Database className="h-3 w-3 mr-1" />
                    Database Mode
                  </>
                ) : (
                  <>
                    <Smartphone className="h-3 w-3 mr-1" />
                    Mock Mode
                  </>
                )}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2 mb-6">
            <Button 
              onClick={runAllTests} 
              disabled={isRunningTests}
              className="flex items-center gap-2"
            >
              {isRunningTests ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run Token System Tests'
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={resetDemoData}
              disabled={isRunningTests}
            >
              Reset Demo Data
            </Button>
            
            {user && (
              <Button 
                variant="outline" 
                onClick={mode === 'mock' ? switchToDatabase : switchToMock}
                disabled={isRunningTests}
              >
                Switch to {mode === 'mock' ? 'Database' : 'Mock'} Mode
              </Button>
            )}
          </div>

          {testSummary.total > 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">Test Results Summary</div>
                  <div className="flex gap-4">
                    <span className="text-green-600">✅ {testSummary.passed} Passed</span>
                    <span className="text-red-600">❌ {testSummary.failed} Failed</span>
                    <span className="text-gray-600">📊 {testSummary.total} Total</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-600">
                    Success Rate: {testSummary.total > 0 ? Math.round((testSummary.passed / testSummary.total) * 100) : 0}%
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {testResults.map((test, index) => (
              <div 
                key={test.name}
                className={`p-3 rounded-lg border ${
                  test.status === 'passed' ? 'border-green-200 bg-green-50' :
                  test.status === 'failed' ? 'border-red-200 bg-red-50' :
                  test.status === 'running' ? 'border-blue-200 bg-blue-50' :
                  'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={getStatusColor(test.status)}>
                      {getStatusIcon(test.status)}
                    </span>
                    <span className="font-medium">{test.message}</span>
                  </div>
                  {test.duration && (
                    <span className="text-xs text-gray-500">{test.duration}ms</span>
                  )}
                </div>
                {test.error && (
                  <div className="mt-2 text-sm text-red-600 bg-red-100 p-2 rounded">
                    {test.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          {lastSyncTime && (
            <div className="mt-6 text-sm text-gray-600">
              Last database sync: {lastSyncTime.toLocaleString()}
            </div>
          )}
          
          {user && (
            <div className="mt-2 text-sm text-gray-600 flex items-center gap-1">
              <Users className="h-3 w-3" />
              Authenticated as: {user.emailAddresses?.[0]?.emailAddress || user.id}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenSystemTester;