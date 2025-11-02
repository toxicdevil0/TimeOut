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
  Lock,
  Sword,
  Eye,
  Sparkles
} from 'lucide-react';
import { useTokens } from '@/contexts/TokenContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  // Anime Themes
  {
    id: 'demon-slayer-theme',
    name: 'Demon Slayer Theme',
    description: 'Immerse yourself in the world of Tanjiro with traditional Japanese aesthetics, breathing technique animations, and Nichirin blade color schemes',
    price: 800,
    category: 'theme',
    icon: Sword,
    rarity: 'epic'
  },
  {
    id: 'naruto-theme',
    name: 'Naruto Theme',
    description: 'Channel the power of the Sharingan with Uchiha-inspired red and black color palette, ninja scroll animations, and chakra flow effects',
    price: 1200,
    category: 'theme',
    icon: Eye,
    rarity: 'legendary'
  },
  {
    id: 'dandadan-theme',
    name: 'Dandadan Theme',
    description: 'Embrace the supernatural with psychic power effects, alien-inspired UI elements, and vibrant otherworldly color combinations',
    price: 600,
    category: 'theme',
    icon: Sparkles,
    rarity: 'rare'
  },
  // Regular Themes
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
  
  // Safely get theme context, with fallback if provider not available
  let themeContext;
  try {
    themeContext = useTheme();
  } catch (error) {
    console.warn('ThemeProvider not available, using fallback theme functionality');
    themeContext = {
      ownedThemes: new Set(['forest-theme']),
      addOwnedTheme: () => {},
      isThemeOwned: (id: string) => id === 'forest-theme',
      switchTheme: () => false
    };
  }
  
  const { ownedThemes, addOwnedTheme, isThemeOwned, switchTheme } = themeContext;
  const [ownedItems, setOwnedItems] = useState<Set<string>>(new Set(['forest-theme'])); // Mock owned items for non-theme items

  const getThemePreview = (themeId: string): string | null => {
    const themeImages: Record<string, string> = {
      'demon-slayer-theme': '/themes-images/tanjiro-kamado-de-kimetsu-no-yaiba_3840x2160_xtrafondos.com.jpg',
      'naruto-theme': '/themes-images/itachi-uchiha-fondo-rojo-tinto_5120x2880_xtrafondos.com.jpg',
      'dandadan-theme': '/themes-images/wp14821497-dandadan-wallpapers.webp'
    };
    return themeImages[themeId] || null;
  };

  const getThemeColors = (themeId: string) => {
    const themeColors: Record<string, { primary: string; secondary: string; accent: string }> = {
      'demon-slayer-theme': {
        primary: 'from-orange-600 to-red-600',
        secondary: 'from-slate-800 to-slate-900',
        accent: 'border-orange-500/50'
      },
      'naruto-theme': {
        primary: 'from-red-700 to-black',
        secondary: 'from-red-900/20 to-black/40',
        accent: 'border-red-500/60'
      },
      'dandadan-theme': {
        primary: 'from-cyan-400 to-teal-300',
        secondary: 'from-black/80 to-black/60',
        accent: 'border-cyan-400/50'
      }
    };
    return themeColors[themeId] || { primary: '', secondary: '', accent: '' };
  };

  const getRarityColor = (rarity: ShopItem['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-gray-500/50 bg-gray-900/20 shadow-sm';
      case 'rare': return 'border-blue-500/50 bg-blue-900/20 shadow-blue-500/10 shadow-lg';
      case 'epic': return 'border-purple-500/50 bg-purple-900/20 shadow-purple-500/10 shadow-lg';
      case 'legendary': return 'border-yellow-500/50 bg-yellow-900/20 shadow-yellow-500/10 shadow-lg';
    }
  };

  const getRarityBadgeColor = (rarity: ShopItem['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-800/80 text-gray-200 border border-gray-600/50';
      case 'rare': return 'bg-blue-800/80 text-blue-200 border border-blue-600/50';
      case 'epic': return 'bg-purple-800/80 text-purple-200 border border-purple-600/50';
      case 'legendary': return 'bg-yellow-800/80 text-yellow-200 border border-yellow-600/50';
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    const isTheme = item.category === 'theme';
    const isOwned = isTheme ? isThemeOwned(item.id) : ownedItems.has(item.id);
    
    if (canAfford(item.price) && !isOwned) {
      try {
        const success = await spendTokens(item.price, `Purchased ${item.name}`, 'shop');
        if (success) {
          if (isTheme) {
            addOwnedTheme(item.id);
            // Auto-switch to the newly purchased anime theme with bypass check
            if (['demon-slayer-theme', 'naruto-theme', 'dandadan-theme'].includes(item.id)) {
              switchTheme(item.id, true); // Bypass ownership check since we just added it
            }
          } else {
            setOwnedItems(prev => new Set([...prev, item.id]));
          }
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
    
    const icons = {
      theme: Palette,
      avatar: Crown,
      feature: Zap,
      badge: Star
    };
    
    const IconComponent = icons[category] || Palette;
    
    return (
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground capitalize flex items-center space-x-3">
          <IconComponent className="h-5 w-5 text-primary" />
          <span>{titles[category] || category}</span>
          <div className="flex-1 h-px bg-border/50"></div>
        </h3>
      </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="space-x-2">
          <ShoppingBag className="h-4 w-4" />
          <span>Token Shop</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-background border border-border/50 shadow-2xl">
        <DialogHeader className="border-b border-border/30 pb-4">
          <DialogTitle className="flex items-center space-x-2 text-foreground">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <span>Focus Points Shop</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Spend your earned Focus Points on themes, features, and cosmetic upgrades
          </DialogDescription>
        </DialogHeader>

        {/* Current Balance */}
        <Card className="bg-primary/10 border-primary/30 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/80 mb-1">Available Balance</p>
                <TokenDisplay 
                  amount={tokens.availableTokens} 
                  variant="large" 
                  animated={true}
                />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
                <p className="text-lg font-semibold text-foreground">{tokens.totalTokens.toLocaleString()} FP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shop Categories */}
        <div className="space-y-6">
          {/* Anime Themes Section */}
          <div>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-foreground flex items-center space-x-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span>Anime Collection</span>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
                  Limited Edition
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Transform your focus experience with authentic anime-inspired themes
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shopItems.filter(item => ['demon-slayer-theme', 'naruto-theme', 'dandadan-theme'].includes(item.id)).map((item) => {
                const isOwned = isThemeOwned(item.id);
                const canBuy = canAfford(item.price) && !isOwned;
                const themePreview = getThemePreview(item.id);
                const themeColors = getThemeColors(item.id);
                const isAnimeTheme = true;
                
                return (
                  <Card 
                    key={item.id} 
                    className={`${getRarityColor(item.rarity)} transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 relative overflow-hidden ${
                      isOwned ? 'opacity-75' : ''
                    } ${themeColors.accent}`}
                  >
                    {/* Anime Theme Preview Background */}
                    {themePreview && (
                      <div 
                        className="absolute inset-0 opacity-10 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${themePreview})` }}
                      />
                    )}
                    
                    {/* Anime Theme Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${themeColors.secondary} opacity-20`} />
                    
                    <CardContent className="p-4 relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`p-3 backdrop-blur-sm rounded-lg shadow-md border border-border/50 bg-gradient-to-br ${themeColors.primary} text-white`}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{item.name}</h4>
                            <Badge className={`text-xs ${getRarityBadgeColor(item.rarity)}`}>
                              {item.rarity}
                            </Badge>
                          </div>
                        </div>
                        {isOwned && (
                          <div className="p-1 bg-green-500/20 rounded-full border border-green-500/50">
                            <Check className="h-4 w-4 text-green-400" />
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-3 leading-relaxed overflow-hidden text-ellipsis" style={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical' 
                      }}>
                        {item.description}
                      </p>
                      
                      {/* Anime Theme Features */}
                      <div className="mb-3 p-2 bg-black/20 rounded-lg border border-white/10">
                        <div className="flex items-center space-x-1 mb-1">
                          <Sparkles className="h-3 w-3 text-yellow-400" />
                          <span className="text-xs font-medium text-foreground">Theme Features:</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.id === 'demon-slayer-theme' && 'Breathing animations • Nichirin blade effects • Traditional UI'}
                          {item.id === 'naruto-theme' && 'Sharingan animations • Chakra effects • Ninja scroll UI'}
                          {item.id === 'dandadan-theme' && 'Psychic effects • Supernatural animations • Full Dandadan wallpaper'}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <TokenDisplay 
                          amount={item.price} 
                          variant="compact"
                          className="text-sm"
                        />
                        
                        {isOwned ? (
                          <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-400">
                            <Check className="h-3 w-3 mr-1" />
                            Owned
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant={canBuy ? "default" : "outline"}
                            disabled={!canBuy}
                            onClick={() => handlePurchase(item)}
                            className={`text-xs h-8 transition-all duration-200 ${
                              canBuy ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'opacity-60'
                            }`}
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

          {/* Regular Categories */}
          {Object.entries(categorizedItems).filter(([category]) => category !== 'theme' || 
            !categorizedItems[category].some(item => ['demon-slayer-theme', 'naruto-theme', 'dandadan-theme'].includes(item.id))
          ).map(([category, items]) => {
            // Filter out anime themes from regular theme category
            const filteredItems = category === 'theme' 
              ? items.filter(item => !['demon-slayer-theme', 'naruto-theme', 'dandadan-theme'].includes(item.id))
              : items;
              
            if (filteredItems.length === 0) return null;
            
            return (
              <div key={category}>
                <CategoryTitle category={category} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map((item) => {
                    const isTheme = item.category === 'theme';
                    const isOwned = isTheme ? isThemeOwned(item.id) : ownedItems.has(item.id);
                    const canBuy = canAfford(item.price) && !isOwned;
                    const themePreview = getThemePreview(item.id);
                    const themeColors = getThemeColors(item.id);
                    const isAnimeTheme = false;
                    
                    return (
                      <Card 
                        key={item.id} 
                        className={`${getRarityColor(item.rarity)} transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 relative overflow-hidden ${
                          isOwned ? 'opacity-75' : ''
                        }`}
                      >
                        <CardContent className="p-4 relative z-10">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="p-3 bg-card/90 backdrop-blur-sm rounded-lg shadow-md border border-border/50 text-primary">
                                <item.icon className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-foreground">{item.name}</h4>
                                <Badge className={`text-xs ${getRarityBadgeColor(item.rarity)}`}>
                                  {item.rarity}
                                </Badge>
                              </div>
                            </div>
                            {isOwned && (
                              <div className="p-1 bg-green-500/20 rounded-full border border-green-500/50">
                                <Check className="h-4 w-4 text-green-400" />
                              </div>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-3 leading-relaxed overflow-hidden text-ellipsis" style={{ 
                            display: '-webkit-box', 
                            WebkitLineClamp: 2, 
                            WebkitBoxOrient: 'vertical' 
                          }}>
                            {item.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <TokenDisplay 
                              amount={item.price} 
                              variant="compact"
                              className="text-sm"
                            />
                            
                            {isOwned ? (
                              <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-400">
                                <Check className="h-3 w-3 mr-1" />
                                Owned
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant={canBuy ? "default" : "outline"}
                                disabled={!canBuy}
                                onClick={() => handlePurchase(item)}
                                className={`text-xs h-8 transition-all duration-200 ${
                                  canBuy ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'opacity-60'
                                }`}
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
            );
          })}
        </div>

        {/* Tips */}
        <Card className="bg-accent/20 border-accent/30 shadow-md">
          <CardContent className="p-6">
            <h4 className="text-sm font-semibold mb-3 text-foreground flex items-center space-x-2">
              <span>💡</span>
              <span>Earning Tips</span>
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2 mb-4">
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span>Complete focus sessions to earn 25-60 FP each</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span>Maintain daily streaks for bonus rewards</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span>Participate in group sessions for extra tokens</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span>Share templates to earn passive income</span>
              </li>
            </ul>
            
            <div className="border-t border-border/30 pt-4">
              <h5 className="text-sm font-semibold mb-2 text-foreground flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                <span>Anime Theme Collection</span>
              </h5>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>🥷 <strong>Naruto Theme (1,200 FP)</strong> - Legendary tier with Sharingan animations</p>
                <p>⚔️ <strong>Demon Slayer Theme (800 FP)</strong> - Epic tier with breathing effects</p>
                <p>👻 <strong>Dandadan Theme (600 FP)</strong> - Rare tier with full wallpaper background</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};