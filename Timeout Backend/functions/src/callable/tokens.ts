import { 
  onCall, 
  CallableRequest, 
  HttpsError 
} from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { 
  TokenTransaction, 
  TokenStats, 
  SaveTokensRequest, 
  TokenTransactionRequest, 
  UpdateBalanceRequest 
} from '../types/tokens';

const db = getFirestore();

/**
 * Get authenticated user ID from Firebase Auth
 */
function getAuthenticatedUserId(request: CallableRequest): string {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  return request.auth.uid;
}

// Save user token stats
export const saveUserTokens = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      const userId = getAuthenticatedUserId(request);
      const { tokenStats, transactions } = request.data as SaveTokensRequest;

      console.log('💾 Saving token data for user:', userId);
      console.log('📊 Token stats:', tokenStats);
      console.log('📋 Transactions count:', transactions.length);

      // Save token stats
      const statsWithTimestamp: TokenStats = {
        ...tokenStats,
        lastUpdated: Timestamp.now()
      };

      await db.collection('users').doc(userId).collection('tokens').doc('stats').set(statsWithTimestamp);

      // Save transactions in batch
      const batch = db.batch();
      transactions.forEach(transaction => {
        const transactionWithTimestamp: TokenTransaction = {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          reason: transaction.reason,
          category: transaction.category,
          timestamp: Timestamp.fromDate(new Date(transaction.timestamp)),
          metadata: transaction.metadata
        };
        const transactionRef = db.collection('users').doc(userId).collection('tokens').doc('transactions').collection('items').doc(transaction.id);
        batch.set(transactionRef, transactionWithTimestamp);
      });

      await batch.commit();

      console.log('✅ Token data saved successfully');

      return {
        success: true,
        message: 'Token data saved successfully',
        savedAt: Timestamp.now()
      };

    } catch (error) {
      console.error('❌ Error saving token data:', error);
      throw new HttpsError('internal', 'Failed to save token data');
    }
  }
);

// Get user token data
export const getUserTokens = onCall(
  {
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      const userId = getAuthenticatedUserId(request);

      console.log('📥 Loading token data for user:', userId);

      // Get token stats
      const statsDoc = await db.collection('users').doc(userId).collection('tokens').doc('stats').get();
      
      if (!statsDoc.exists) {
        console.log('ℹ️ No token data found for user');
        return {
          success: false,
          message: 'No token data found',
          data: null
        };
      }

      const tokenStats = statsDoc.data() as TokenStats;

      // Get transactions
      const transactionsSnapshot = await db.collection('users').doc(userId)
        .collection('tokens').doc('transactions').collection('items')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      const transactions: TokenTransaction[] = [];
      transactionsSnapshot.forEach(doc => {
        transactions.push(doc.data() as TokenTransaction);
      });

      console.log('✅ Token data loaded successfully');
      console.log('📊 Stats:', tokenStats);
      console.log('📋 Transactions:', transactions.length);

      return {
        success: true,
        data: {
          tokenStats,
          transactions
        }
      };

    } catch (error) {
      console.error('❌ Error loading token data:', error);
      throw new HttpsError('internal', 'Failed to load token data');
    }
  }
);

// Add a single token transaction
export const addTokenTransaction = onCall(
  {
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      const userId = getAuthenticatedUserId(request);
      const { 
        amount, 
        reason, 
        category, 
        type = 'earned',
        metadata 
      } = request.data as TokenTransactionRequest;

      console.log('💰 Adding token transaction for user:', userId);
      console.log('📝 Transaction:', { amount, reason, category, type });

      const transactionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const transaction: TokenTransaction = {
        id: transactionId,
        type,
        amount,
        reason,
        category,
        timestamp: Timestamp.now(),
        metadata
      };

      // Save transaction
      await db.collection('users').doc(userId)
        .collection('tokens').doc('transactions').collection('items')
        .doc(transactionId)
        .set(transaction);

      // Update token stats
      const statsRef = db.collection('users').doc(userId).collection('tokens').doc('stats');
      const statsDoc = await statsRef.get();

      if (statsDoc.exists) {
        const currentStats = statsDoc.data() as TokenStats;
        const now = new Date();
        const today = now.toDateString();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));

        let updatedStats: Partial<TokenStats> = {
          lastUpdated: Timestamp.now()
        };

        if (type === 'earned') {
          updatedStats.totalTokens = currentStats.totalTokens + amount;
          updatedStats.availableTokens = currentStats.availableTokens + amount;
          
          // Update daily tokens if transaction is from today
          if (transaction.timestamp.toDate().toDateString() === today) {
            updatedStats.todayTokens = currentStats.todayTokens + amount;
          }
          
          // Update weekly tokens if transaction is from this week
          if (transaction.timestamp.toDate() >= weekStart) {
            updatedStats.weeklyTokens = currentStats.weeklyTokens + amount;
          }
        } else if (type === 'spent') {
          updatedStats.availableTokens = Math.max(0, currentStats.availableTokens - amount);
        }

        await statsRef.update(updatedStats);
      }

      console.log('✅ Token transaction added successfully');

      return {
        success: true,
        transaction,
        message: 'Transaction added successfully'
      };

    } catch (error) {
      console.error('❌ Error adding token transaction:', error);
      throw new HttpsError('internal', 'Failed to add token transaction');
    }
  }
);

// Update token balance (direct balance modification)
export const updateTokenBalance = onCall(
  {
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      const userId = getAuthenticatedUserId(request);
      const { 
        amount, 
        reason,
        type = 'earned'
      } = request.data as UpdateBalanceRequest;

      console.log('⚡ Updating token balance for user:', userId);
      console.log('💱 Balance update:', { amount, reason, type });

      const statsRef = db.collection('users').doc(userId).collection('tokens').doc('stats');
      
      // Use a transaction to ensure consistency
      await db.runTransaction(async (transaction) => {
        const statsDoc = await transaction.get(statsRef);
        
        if (!statsDoc.exists) {
          throw new HttpsError('not-found', 'User token stats not found');
        }

        const currentStats = statsDoc.data() as TokenStats;
        let updatedStats: Partial<TokenStats> = {
          lastUpdated: Timestamp.now()
        };

        if (type === 'earned') {
          updatedStats.totalTokens = currentStats.totalTokens + amount;
          updatedStats.availableTokens = currentStats.availableTokens + amount;
          updatedStats.todayTokens = currentStats.todayTokens + amount;
          updatedStats.weeklyTokens = currentStats.weeklyTokens + amount;
        } else if (type === 'spent') {
          if (currentStats.availableTokens < amount) {
            throw new HttpsError('failed-precondition', 'Insufficient token balance');
          }
          updatedStats.availableTokens = currentStats.availableTokens - amount;
        }

        transaction.update(statsRef, updatedStats);
      });

      console.log('✅ Token balance updated successfully');

      return {
        success: true,
        message: 'Token balance updated successfully'
      };

    } catch (error) {
      console.error('❌ Error updating token balance:', error);
      throw new HttpsError('internal', 'Failed to update token balance');
    }
  }
);