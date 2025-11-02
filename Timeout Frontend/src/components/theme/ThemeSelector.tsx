import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, Crown, Sword, Eye, Sparkles, RotateCcw } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeById } from '@/config/animeThemes';

export const ThemeSelector: React.FC = () => {
  const { currentTheme, ownedThemes, switchTheme, activeAnimeTheme } = useTheme();

  const availableThemes = [
    {
      id: 'default',
      name: 'Default Theme',
      description: 'Standard TimeOut experience',
      icon: Palette,
      rarity: 'default' as const,
      owned: true
    },
    {
      id: 'dandadan-theme',
      name: 'Dandadan Theme',
      description: 'Supernatural wallpaper experience',
      icon: Sparkles,
      rarity: 'rare' as const,
      owned: ownedThemes.has('dandadan-theme')
    },
    {
      id: 'demon-slayer-theme',
      name: 'Demon Slayer Theme',
      description: 'Traditional Japanese aesthetics',
      icon: Sword,
      rarity: 'epic' as const,
      owned: ownedThemes.has('demon-slayer-theme')
    },
    {
      id: 'naruto-theme',
      name: 'Naruto Theme',
      description: 'Sharingan power experience',
      icon: Eye,
      rarity: 'legendary' as const,
      owned: ownedThemes.has('naruto-theme')
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'default': return 'bg-gray-100/10 text-gray-200 border-gray-500/30';
      case 'rare': return 'bg-blue-100/10 text-blue-300 border-blue-500/30';
      case 'epic': return 'bg-purple-100/10 text-purple-300 border-purple-500/30';
      case 'legendary': return 'bg-yellow-100/10 text-yellow-300 border-yellow-500/30';
      default: return 'bg-gray-100/10 text-gray-200 border-gray-500/30';
    }
  };

  const handleThemeChange = (themeId: string) => {
    if (themeId === 'default' || ownedThemes.has(themeId)) {
      switchTheme(themeId);
    }
  };

  const resetToDefault = () => {
    switchTheme('default');
  };

  const getCurrentThemeInfo = () => {
    if (!currentTheme || currentTheme === 'default') {
      return availableThemes.find(t => t.id === 'default');
    }
    return availableThemes.find(t => t.id === currentTheme) || availableThemes[0];
  };

  const currentThemeInfo = getCurrentThemeInfo();

  return (
    <div className="flex items-center space-x-3">
      {/* Theme Selector Dropdown */}
      <div className="min-w-[200px]">
        <Select
          value={currentTheme || 'default'}
          onValueChange={handleThemeChange}
        >
          <SelectTrigger className="w-full bg-card border border-border hover:bg-accent/50 transition-colors">
            <SelectValue placeholder="Select theme">
              <div className="flex items-center space-x-2">
                {currentThemeInfo && (
                  <>
                    <currentThemeInfo.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{currentThemeInfo.name}</span>
                  </>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-card border border-border shadow-lg min-w-[280px]">
            {availableThemes.map((theme) => {
              const IconComponent = theme.icon;
              const isActive = (currentTheme || 'default') === theme.id;
              
              return (
                <SelectItem
                  key={theme.id}
                  value={theme.id}
                  disabled={!theme.owned}
                  className={`p-3 ${isActive ? 'bg-accent' : ''} ${
                    !theme.owned ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                        <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-foreground">{theme.name}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getRarityColor(theme.rarity)}`}
                          >
                            {theme.rarity}
                          </Badge>
                        </div>
                        <span className="text-xs text-foreground/80">{theme.description}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isActive && (
                        <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                          Active
                        </Badge>
                      )}
                      {!theme.owned && (
                        <Badge variant="outline" className="text-xs text-foreground/70 bg-background/50 border-border">
                          Locked
                        </Badge>
                      )}
                      {theme.owned && !isActive && (
                        <Badge variant="outline" className="text-xs bg-green-100/10 text-green-300 border-green-500/30">
                          Owned
                        </Badge>
                      )}
                    </div>
                  </div>
                </SelectItem>
              );
            })}
            
            {/* Separator and reset option */}
            <div className="border-t border-border my-1" />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToDefault}
                className="w-full justify-start text-foreground/70 hover:text-foreground hover:bg-accent/50"
                disabled={currentTheme === 'default' || !currentTheme}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </div>
          </SelectContent>
        </Select>
      </div>

      {/* Current Theme Status */}
      {activeAnimeTheme && (
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-foreground/80 font-medium">
            {activeAnimeTheme.name} Active
          </span>
        </div>
      )}
    </div>
  );
};

// Mini version for compact spaces
export const ThemeSelectorMini: React.FC = () => {
  const { currentTheme, switchTheme, activeAnimeTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => switchTheme(currentTheme === 'dandadan-theme' ? 'default' : 'dandadan-theme')}
        className="text-xs"
        disabled={!currentTheme}
      >
        <Sparkles className="h-3 w-3 mr-1" />
        {currentTheme === 'dandadan-theme' ? 'Default' : 'Dandadan'}
      </Button>
      
      {activeAnimeTheme && (
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      )}
    </div>
  );
};