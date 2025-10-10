import { Timestamp } from 'firebase-admin/firestore';

// Token transaction interface
export interface TokenTransaction {
  id: string;
  type: 'earned' | 'spent' | 'penalty';
  amount: number;
  reason: string;
  category: 'focus' | 'goal' | 'streak' | 'social' | 'achievement' | 'shop';
  timestamp: Timestamp;
  metadata?: {
    sessionId?: string;
    duration?: number;
    multiplier?: number;
  };
}

// Token stats interface
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
  lastUpdated: Timestamp;
}

// Request/Response interfaces
export interface SaveTokensRequest {
  tokenStats: Omit<TokenStats, 'lastUpdated'>;
  transactions: (Omit<TokenTransaction, 'timestamp'> & { timestamp: string | Date })[];
}

export interface TokenTransactionRequest {
  amount: number;
  reason: string;
  category: TokenTransaction['category'];
  type?: TokenTransaction['type'];
  metadata?: TokenTransaction['metadata'];
}

export interface UpdateBalanceRequest {
  amount: number;
  reason: string;
  type?: 'earned' | 'spent';
}