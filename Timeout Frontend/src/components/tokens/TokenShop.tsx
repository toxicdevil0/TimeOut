import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ShoppingBag, 
  Palette, 
  Crown, 
  Star, 
  Zap,
  Check,
  Lock
} from 'lucide-react';
import { useTokens } from '@/contexts/TokenContext';
import { TokenDisplay } from './TokenDisplay';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'theme' | 'avatar' | 'feature' | 'badge';
  icon: React.ComponentType<{ className?: string }>;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  owned?: boolean;
}

const shopItems: ShopItem[] = [
  {
    id: 'forest-theme',
    name: 'Forest Theme',
    description: 'Calming green theme for deep focus',
    price: 200,
    category: 'theme',
    icon: Palette,
    rarity: 'common'
  },
  {
    id: 'night-theme',
    name: 'Night Mode Pro',
    description: 'Premium dark theme with animations',
    price: 500,
    category: 'theme',
    icon: Palette,
    rarity: 'rare'
  },
  {
    id: 'crown-frame',
    name: 'Golden Crown',
    description: 'Show your focus mastery',
    price: 800,
    category: 'avatar',
    icon: Crown,
    rarity: 'epic'
  },
  {
    id: 'focus-master',
    name: 'Focus Master Badge',
    description: 'Elite status symbol',
    price: 1000,
    category: 'badge',
    icon: Star,
    rarity: 'legendary'
  },
  {
    id: 'analytics-pro',
    name: 'Advanced Analytics',
    description: 'Detailed focus insights',
    price: 300,
    category: 'feature',
    icon: Zap,
    rarity: 'rare'
  }
];

export const TokenShop: React.FC = () => {
  const { tokens, spendTokens, canAfford } = useTokens();
  const [ownedItems, setOwnedItems] = useState<Set<string>>(new Set(['forest-theme'])); // Mock owned items

  const getRarityColor = (rarity: ShopItem['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
    }
  };

  const getRarityBadgeColor = (rarity: ShopItem['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-700';
      case 'rare': return 'bg-blue-100 text-blue-700';
      case 'epic': return 'bg-purple-100 text-purple-700';
      case 'legendary': return 'bg-yellow-100 text-yellow-700';
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    if (canAfford(item.price) && !ownedItems.has(item.id)) {
      try {
        const success = await spendTokens(item.price, `Purchased ${item.name}`, 'shop');
        if (success) {
          setOwnedItems(prev => new Set([...prev, item.id]));
        }
      } catch (error) {
        console.error('Failed to purchase item:', error);
      }
    }
  };

  const categorizedItems = shopItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShopItem[]>);

  const CategoryTitle = ({ category }: { category: string }) => {
    const titles = {
      theme: 'Themes & Colors',
      avatar: 'Avatar Frames',
      feature: 'Premium Features',
      badge: 'Status Badges'
    };
    return <h3 className="text-lg font-semibold mb-3 capitalize">{titles[category] || category}</h3>;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="space-x-2">
          <ShoppingBag className="h-4 w-4" />
          <span>Token Shop</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5" />
            <span>Focus Points Shop</span>
          </DialogTitle>
          <DialogDescription>
            Spend your earned Focus Points on themes, features, and cosmetic upgrades
          </DialogDescription>
        </DialogHeader>

        {/* Current Balance */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Available Balance</p>
                <TokenDisplay 
                  amount={tokens.availableTokens} 
                  variant="large" 
                  animated={true}
                />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-lg font-semibold">{tokens.totalTokens.toLocaleString()} FP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shop Categories */}
        <div className="space-y-6">
          {Object.entries(categorizedItems).map(([category, items]) => (
            <div key={category}>
              <CategoryTitle category={category} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => {
                  const isOwned = ownedItems.has(item.id);
                  const canBuy = canAfford(item.price) && !isOwned;
                  
                  return (
                    <Card 
                      key={item.id} 
                      className={`${getRarityColor(item.rarity)} transition-all duration-200 hover:shadow-md ${
                        isOwned ? 'opacity-75' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <item.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm">{item.name}</h4>
                              <Badge className={`text-xs ${getRarityBadgeColor(item.rarity)}`}>
                                {item.rarity}
                              </Badge>
                            </div>
                          </div>
                          {isOwned && (
                            <Check className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {item.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <TokenDisplay 
                            amount={item.price} 
                            variant="compact"
                            className="text-sm"
                          />
                          
                          {isOwned ? (
                            <Badge variant="outline" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Owned
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant={canBuy ? "default" : "outline"}
                              disabled={!canBuy}
                              onClick={() => handlePurchase(item)}
                              className="text-xs h-8"
                            >
                              {canBuy ? (
                                <>
                                  <ShoppingBag className="h-3 w-3 mr-1" />
                                  Buy
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3 mr-1" />
                                  {canAfford(item.price) ? 'Owned' : 'Insufficient FP'}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <Card className="bg-accent/20">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold mb-2">💡 Earning Tips</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Complete focus sessions to earn 25-60 FP each</li>
              <li>• Maintain daily streaks for bonus rewards</li>
              <li>• Participate in group sessions for extra tokens</li>
              <li>• Share templates to earn passive income</li>
            </ul>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};