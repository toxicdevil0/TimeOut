import { useState, useCallback } from 'react';

interface TokenNotification {
  id: string;
  amount: number;
  type: 'earned' | 'spent';
  reason: string;
  visible: boolean;
}

export const useTokenNotifications = () => {
  const [notifications, setNotifications] = useState<TokenNotification[]>([]);

  const showNotification = useCallback((
    amount: number, 
    type: 'earned' | 'spent', 
    reason: string
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification: TokenNotification = {
      id,
      amount,
      type,
      reason,
      visible: true
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, visible: false } : n)
    );
  }, []);

  return {
    notifications,
    showNotification,
    hideNotification
  };
};