import React from 'react';
import { Coins, TrendingUp, Award, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokenDisplayProps {
  amount: number;
  variant?: 'default' | 'compact' | 'large' | 'minimal';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
  animated?: boolean;
}

export const TokenDisplay: React.FC<TokenDisplayProps> = ({
  amount,
  variant = 'default',
  showIcon = true,
  showLabel = true,
  className,
  animated = false
}) => {
  const formatAmount = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          container: 'flex items-center space-x-1 text-sm',
          icon: 'h-3 w-3',
          text: 'text-sm font-medium'
        };
      case 'large':
        return {
          container: 'flex items-center space-x-3 text-lg',
          icon: 'h-6 w-6',
          text: 'text-2xl font-bold'
        };
      case 'minimal':
        return {
          container: 'flex items-center space-x-1',
          icon: 'h-4 w-4',
          text: 'text-base font-semibold'
        };
      default:
        return {
          container: 'flex items-center space-x-2',
          icon: 'h-4 w-4',
          text: 'text-base font-semibold'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={cn(
      styles.container,
      animated && 'transition-all duration-300 hover:scale-105',
      className
    )}>
      {showIcon && (
        <Zap className={cn(
          styles.icon,
          'text-yellow-500',
          animated && 'animate-pulse'
        )} />
      )}
      <span className={cn(styles.text, 'text-foreground')}>
        {formatAmount(amount)}
      </span>
      {showLabel && variant !== 'compact' && (
        <span className="text-xs text-muted-foreground">FP</span>
      )}
    </div>
  );
};

interface TokenChangeProps {
  amount: number;
  type: 'earned' | 'spent';
  reason?: string;
  visible: boolean;
  onAnimationEnd: () => void;
}

export const TokenChangeAnimation: React.FC<TokenChangeProps> = ({
  amount,
  type,
  reason,
  visible,
  onAnimationEnd
}) => {
  if (!visible) return null;

  return (
    <div 
      className={cn(
        'fixed top-20 right-6 z-50 flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg border',
        'animate-in slide-in-from-right-5 duration-500',
        type === 'earned' 
          ? 'bg-green-50 border-green-200 text-green-800' 
          : 'bg-red-50 border-red-200 text-red-800'
      )}
      onAnimationEnd={() => setTimeout(onAnimationEnd, 2000)}
    >
      <Zap className="h-4 w-4 text-yellow-500" />
      <span className="font-semibold">
        {type === 'earned' ? '+' : '-'}{amount} FP
      </span>
      {reason && (
        <span className="text-sm opacity-75">• {reason}</span>
      )}
    </div>
  );
};

interface TokenStatsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const TokenStatsCard: React.FC<TokenStatsCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className
}) => {
  return (
    <div className={cn(
      'p-4 bg-card rounded-lg border border-border shadow-sm',
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <TokenDisplay 
              amount={value} 
              variant="minimal" 
              showLabel={false}
              className="text-foreground"
            />
          </div>
        </div>
        {trend && (
          <div className={cn(
            'flex items-center space-x-1 text-sm',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            <TrendingUp className={cn(
              'h-3 w-3',
              !trend.isPositive && 'rotate-180'
            )} />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  );
};