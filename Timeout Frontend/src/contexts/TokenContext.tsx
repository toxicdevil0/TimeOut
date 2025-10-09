import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';
import { 
  saveUserTokens as saveTokensToDatabase, 
  getUserTokens as getTokensFromDatabase,
  addTokenTransaction as addTransactionToDatabase 
} from '@/config/tokenFirebase';

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
}

export interface TokenContextType {
  tokens: TokenStats;
  transactions: TokenTransaction[];
  mode: 'mock' | 'database';
  isLoading: boolean;
  lastSyncTime: Date | null;
  awardTokens: (amount: number, reason: string, category: TokenTransaction['category'], metadata?: TokenTransaction['metadata']) => Promise<void>;
  spendTokens: (amount: number, reason: string, category: TokenTransaction['category']) => Promise<boolean>;
  getTokenHistory: (limit?: number) => TokenTransaction[];
  canAfford: (amount: number) => boolean;
  resetDemoData: () => void;
  syncToDatabase: () => Promise<void>;
  loadFromDatabase: () => Promise<boolean>;
  switchToDatabase: () => Promise<void>;
  switchToMock: () => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

// Generate mock data based on user ID for consistency
const generateMockData = (userId: string = 'demo'): { stats: TokenStats; transactions: TokenTransaction[] } => {
  const seed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Set seed for consistent mock data
  Math.random = (() => {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  })();

  const now = new Date();
  const transactions: TokenTransaction[] = [];
  
  // Generate mock transaction history (last 7 days)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Daily focus sessions
    const sessionsCount = random(2, 5);
    for (let j = 0; j < sessionsCount; j++) {
      transactions.push({
        id: `${date.getTime()}-session-${j}`,
        type: 'earned',
        amount: random(25, 60),
        reason: `Focus session completed (${random(20, 45)} min)`,
        category: 'focus',
        timestamp: new Date(date.getTime() + j * 2 * 60 * 60 * 1000),
        metadata: { duration: random(20, 45), sessionId: `session-${date.getTime()}-${j}` }
      });
    }
    
    // Daily goal bonus
    if (random(1, 10) > 3) {
      transactions.push({
        id: `${date.getTime()}-daily-goal`,
        type: 'earned',
        amount: 50,
        reason: 'Daily study goal achieved',
        category: 'goal',
        timestamp: new Date(date.getTime() + 20 * 60 * 60 * 1000)
      });
    }
    
    // Streak bonus (every 3 days)
    if (i % 3 === 0 && i > 0) {
      transactions.push({
        id: `${date.getTime()}-streak`,
        type: 'earned',
        amount: random(100, 300),
        reason: `${3 + (6 - i)} day streak bonus`,
        category: 'streak',
        timestamp: new Date(date.getTime() + 21 * 60 * 60 * 1000)
      });
    }
  }
  
  // Some spending transactions
  transactions.push({
    id: `${now.getTime()}-spend-1`,
    type: 'spent',
    amount: 200,
    reason: 'Purchased forest theme',
    category: 'shop',
    timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  });
  
  transactions.push({
    id: `${now.getTime()}-spend-2`,
    type: 'spent',
    amount: 100,
    reason: 'Custom avatar frame',
    category: 'shop',
    timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
  });

  // Calculate stats from transactions
  const totalEarned = transactions.filter(t => t.type === 'earned').reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = transactions.filter(t => t.type === 'spent').reduce((sum, t) => sum + t.amount, 0);
  const todayTransactions = transactions.filter(t => 
    t.timestamp.toDateString() === now.toDateString() && t.type === 'earned'
  );
  const weekTransactions = transactions.filter(t => {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return t.timestamp >= weekAgo && t.type === 'earned';
  });

  const stats: TokenStats = {
    totalTokens: totalEarned,
    availableTokens: totalEarned - totalSpent,
    todayTokens: todayTransactions.reduce((sum, t) => sum + t.amount, 0),
    weeklyTokens: weekTransactions.reduce((sum, t) => sum + t.amount, 0),
    currentStreak: random(3, 15),
    longestStreak: random(15, 45),
    rank: {
      daily: random(15, 150),
      weekly: random(50, 500),
      allTime: random(100, 1000)
    },
    achievements: [
      'first_session',
      'week_warrior',
      'focus_master',
      'streak_keeper'
    ]
  };

  return { stats, transactions: transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) };
};

export const TokenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [mode, setMode] = useState<'mock' | 'database'>('mock');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [tokens, setTokens] = useState<TokenStats>({
    totalTokens: 0,
    availableTokens: 0,
    todayTokens: 0,
    weeklyTokens: 0,
    currentStreak: 0,
    longestStreak: 0,
    rank: { daily: 0, weekly: 0, allTime: 0 },
    achievements: []
  });
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);

  // Initialize data when user loads
  useEffect(() => {
    const userId = user?.id || 'demo-user';
    
    // Check saved mode preference
    const savedMode = localStorage.getItem(`timeout-token-mode-${userId}`) as 'mock' | 'database' | null;
    if (savedMode && savedMode !== mode) {
      setMode(savedMode);
    }
    
    // Initialize mock data first
    const mockData = generateMockData(userId);
    
    // Try to load from localStorage first
    const savedTokens = localStorage.getItem(`timeout-tokens-${userId}`);
    const savedTransactions = localStorage.getItem(`timeout-transactions-${userId}`);
    
    if (savedTokens && savedTransactions) {
      try {
        const parsedTokens = JSON.parse(savedTokens);
        const parsedTransactions = JSON.parse(savedTransactions).map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp)
        }));
        
        setTokens(parsedTokens);
        setTransactions(parsedTransactions);
      } catch (error) {
        console.error('Error loading saved token data:', error);
        setTokens(mockData.stats);
        setTransactions(mockData.transactions);
      }
    } else {
      setTokens(mockData.stats);
      setTransactions(mockData.transactions);
    }

    // If database mode is preferred, try to load from database
    if (savedMode === 'database' && user?.id) {
      loadFromDatabase().catch(error => {
        console.error('Failed to load from database on startup, falling back to mock:', error);
        setMode('mock');
      });
    }
  }, [user?.id]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    const userId = user?.id || 'demo-user';
    localStorage.setItem(`timeout-tokens-${userId}`, JSON.stringify(tokens));
    localStorage.setItem(`timeout-transactions-${userId}`, JSON.stringify(transactions));
  }, [tokens, transactions, user?.id]);

  const awardTokens = async (
    amount: number, 
    reason: string, 
    category: TokenTransaction['category'],
    metadata?: TokenTransaction['metadata']
  ) => {
    const transaction: TokenTransaction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'earned',
      amount,
      reason,
      category,
      timestamp: new Date(),
      metadata
    };

    // Update local state immediately (optimistic update)
    setTransactions(prev => [transaction, ...prev]);
    setTokens(prev => ({
      ...prev,
      totalTokens: prev.totalTokens + amount,
      availableTokens: prev.availableTokens + amount,
      todayTokens: prev.todayTokens + amount,
      weeklyTokens: prev.weeklyTokens + amount
    }));

    console.log(`🪙 Earned ${amount} Focus Points: ${reason}`);

    // If in database mode, also save to backend
    if (mode === 'database') {
      try {
        await addTransactionToDatabase(amount, reason, category, 'earned', metadata);
        console.log('✅ Token transaction synced to database');
      } catch (error) {
        console.error('❌ Failed to sync token transaction to database:', error);
        // Note: We don't revert the local state as it's better to keep the earned tokens
      }
    }
  };

  const spendTokens = async (
    amount: number, 
    reason: string, 
    category: TokenTransaction['category']
  ): Promise<boolean> => {
    if (tokens.availableTokens < amount) {
      console.log(`❌ Insufficient tokens: ${tokens.availableTokens} < ${amount}`);
      return false;
    }

    const transaction: TokenTransaction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'spent',
      amount,
      reason,
      category,
      timestamp: new Date()
    };

    // Update local state immediately (optimistic update)
    setTransactions(prev => [transaction, ...prev]);
    setTokens(prev => ({
      ...prev,
      availableTokens: prev.availableTokens - amount
    }));

    console.log(`💸 Spent ${amount} Focus Points: ${reason}`);

    // If in database mode, also save to backend
    if (mode === 'database') {
      try {
        await addTransactionToDatabase(amount, reason, category, 'spent');
        console.log('✅ Token transaction synced to database');
      } catch (error) {
        console.error('❌ Failed to sync token transaction to database:', error);
        // Revert the local state if database operation failed
        setTransactions(prev => prev.filter(t => t.id !== transaction.id));
        setTokens(prev => ({
          ...prev,
          availableTokens: prev.availableTokens + amount
        }));
        return false;
      }
    }

    return true;
  };

  const getTokenHistory = (limit?: number): TokenTransaction[] => {
    return limit ? transactions.slice(0, limit) : transactions;
  };

  const canAfford = (amount: number): boolean => {
    return tokens.availableTokens >= amount;
  };

  const resetDemoData = () => {
    const userId = user?.id || 'demo-user';
    const mockData = generateMockData(userId);
    setTokens(mockData.stats);
    setTransactions(mockData.transactions);
  };

  const syncToDatabase = async () => {
    if (!user?.id) {
      throw new Error('User must be authenticated to sync to database');
    }

    setIsLoading(true);
    try {
      console.log('🔄 Syncing token data to database...');
      await saveTokensToDatabase(tokens, transactions);
      setLastSyncTime(new Date());
      console.log('✅ Token data synced to database successfully');
    } catch (error) {
      console.error('❌ Failed to sync token data to database:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromDatabase = async () => {
    if (!user?.id) {
      throw new Error('User must be authenticated to load from database');
    }

    setIsLoading(true);
    try {
      console.log('📥 Loading token data from database...');
      const data = await getTokensFromDatabase();
      
      if (data) {
        setTokens(data.tokenStats);
        setTransactions(data.transactions);
        setLastSyncTime(new Date());
        console.log('✅ Token data loaded from database successfully');
      } else {
        console.log('ℹ️ No token data found in database');
      }
      
      return data !== null;
    } catch (error) {
      console.error('❌ Failed to load token data from database:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const switchToDatabase = async () => {
    try {
      // First try to load existing data from database
      const hasData = await loadFromDatabase();
      
      if (!hasData) {
        // If no data exists, sync current mock data to database
        await syncToDatabase();
      }
      
      setMode('database');
      
      // Save mode preference
      const userId = user?.id || 'demo-user';
      localStorage.setItem(`timeout-token-mode-${userId}`, 'database');
      
      console.log('✅ Switched to database mode');
    } catch (error) {
      console.error('❌ Failed to switch to database mode:', error);
      throw error;
    }
  };

  const switchToMock = () => {
    setMode('mock');
    
    // Save mode preference
    const userId = user?.id || 'demo-user';
    localStorage.setItem(`timeout-token-mode-${userId}`, 'mock');
    
    console.log('✅ Switched to mock mode');
  };

  const contextValue: TokenContextType = {
    tokens,
    transactions,
    mode,
    isLoading,
    lastSyncTime,
    awardTokens,
    spendTokens,
    getTokenHistory,
    canAfford,
    resetDemoData,
    syncToDatabase,
    loadFromDatabase,
    switchToDatabase,
    switchToMock
  };

  return (
    <TokenContext.Provider value={contextValue}>
      {children}
    </TokenContext.Provider>
  );
};

export const useTokens = (): TokenContextType => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokens must be used within a TokenProvider');
  }
  return context;
};