import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// Type definitions for token operations
export interface TokenTransaction {
  id: string;
  type: 'earned' | 'spent' | 'penalty';
  amount: number;
  reason: string;
  category: 'focus' | 'goal' | 'streak' | 'social' | 'achievement' | 'shop';
  timestamp: Date;
  metadata?: {
    sessionId?: string;
    duration?: number;
    multiplier?: number;
  };
}

export interface TokenStats {
  totalTokens: number;
  availableTokens: number;
  todayTokens: number;
  weeklyTokens: number;
  currentStreak: number;
  longestStreak: number;
  rank: {
    daily: number;
    weekly: number;
    allTime: number;
  };
  achievements: string[];
  lastUpdated: Date;
}

// Firebase callable functions
const saveUserTokensCallable = httpsCallable(functions, 'saveUserTokens');
const getUserTokensCallable = httpsCallable(functions, 'getUserTokens');
const addTokenTransactionCallable = httpsCallable(functions, 'addTokenTransaction');
const updateTokenBalanceCallable = httpsCallable(functions, 'updateTokenBalance');

/**
 * Save user token data to database
 */
export const saveUserTokens = async (tokenStats: Omit<TokenStats, 'lastUpdated'>, transactions: TokenTransaction[]) => {
  try {
    console.log('💾 Saving token data to database...', { tokenStats, transactionCount: transactions.length });
    
    const result = await saveUserTokensCallable({
      tokenStats,
      transactions: transactions.map(t => ({
        ...t,
        timestamp: t.timestamp.toISOString()
      }))
    });
    
    console.log('✅ Token data saved successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error saving token data:', error);
    throw error;
  }
};

/**
 * Get user token data from database
 */
export const getUserTokens = async (): Promise<{ tokenStats: TokenStats; transactions: TokenTransaction[] } | null> => {
  try {
    console.log('📥 Loading token data from database...');
    
    const result = await getUserTokensCallable({});
    const responseData = result.data as any;
    
    if (!responseData.success) {
      console.log('ℹ️ No token data found in database');
      return null;
    }
    
    const data = responseData.data;
    
    // Convert Firestore timestamps back to Date objects
    const tokenStats: TokenStats = {
      ...data.tokenStats,
      lastUpdated: new Date(data.tokenStats.lastUpdated.seconds * 1000)
    };
    
    const transactions: TokenTransaction[] = data.transactions.map((t: any) => ({
      ...t,
      timestamp: new Date(t.timestamp.seconds * 1000)
    }));
    
    console.log('✅ Token data loaded successfully:', { tokenStats, transactionCount: transactions.length });
    return { tokenStats, transactions };
  } catch (error) {
    console.error('❌ Error loading token data:', error);
    throw error;
  }
};

/**
 * Add a single token transaction
 */
export const addTokenTransaction = async (
  amount: number,
  reason: string,
  category: TokenTransaction['category'],
  type: TokenTransaction['type'] = 'earned',
  metadata?: TokenTransaction['metadata']
) => {
  try {
    console.log('💰 Adding token transaction to database...', { amount, reason, category, type });
    
    const result = await addTokenTransactionCallable({
      amount,
      reason,
      category,
      type,
      metadata
    });
    
    console.log('✅ Token transaction added successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error adding token transaction:', error);
    throw error;
  }
};

/**
 * Update token balance directly
 */
export const updateTokenBalance = async (
  amount: number,
  reason: string,
  type: 'earned' | 'spent' = 'earned'
) => {
  try {
    console.log('⚡ Updating token balance in database...', { amount, reason, type });
    
    const result = await updateTokenBalanceCallable({
      amount,
      reason,
      type
    });
    
    console.log('✅ Token balance updated successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error updating token balance:', error);
    throw error;
  }
};