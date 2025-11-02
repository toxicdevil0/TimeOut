import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme, useCurrentThemeInfo } from '@/contexts/ThemeContext';
import { Palette, Eye, Sword, Sparkles, RotateCcw } from 'lucide-react';

export const ThemePreview: React.FC = () => {
  const { switchTheme, isThemeOwned, currentTheme } = useTheme();
  const { isAnimeTheme, themeName, themeData } = useCurrentThemeInfo();

  const demoThemes = [
    {
      id: 'demon-slayer-theme',
      name: 'Demon Slayer',
      icon: Sword,
      description: 'Traditional Japanese aesthetics with breathing animations',
      color: 'from-orange-600 to-red-600'
    },
    {
      id: 'naruto-theme',
      name: 'Naruto',
      icon: Eye,
      description: 'Sharingan-inspired with chakra flow effects',
      color: 'from-red-700 to-black'
    },
    {
      id: 'dandadan-theme',
      name: 'Dandadan',
      icon: Sparkles,
      description: 'Supernatural theme with psychic powers',
      color: 'from-purple-600 to-cyan-500'
    }
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Palette className="h-5 w-5" />
          <span>Anime Theme Preview</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Theme Status */}
        <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
          <div>
            <h3 className="font-semibold text-foreground">Current Theme</h3>
            <p className="text-sm text-muted-foreground">{themeName}</p>
            {isAnimeTheme && themeData && (
              <Badge className="mt-1 text-xs">
                {themeData.rarity} • {themeData.price} FP
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => switchTheme('default')}
            disabled={!currentTheme}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demoThemes.map((theme) => {
            const isOwned = isThemeOwned(theme.id);
            const isActive = currentTheme === theme.id;
            
            return (
              <Card 
                key={theme.id}
                className={`transition-all duration-200 hover:shadow-lg ${
                  isActive ? 'ring-2 ring-primary' : ''
                } ${isOwned ? '' : 'opacity-60'}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.color}`}>
                      <theme.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{theme.name}</h4>
                      <p className="text-xs text-muted-foreground">{theme.description}</p>
                    </div>
                  </div>
                  
                  {isOwned ? (
                    <Button
                      size="sm"
                      variant={isActive ? "secondary" : "default"}
                      onClick={() => switchTheme(theme.id)}
                      disabled={isActive}
                      className="w-full"
                    >
                      {isActive ? 'Active' : 'Apply Theme'}
                    </Button>
                  ) : (
                    <div className="text-center py-2">
                      <Badge variant="outline" className="text-xs">
                        Purchase in Token Shop
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Demo Effects */}
        {isAnimeTheme && (
          <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
            <h4 className="font-semibold mb-2 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <span>Active Theme Effects</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-card rounded-lg breathing-effect">
                <p className="font-medium">Breathing Effect</p>
                <p className="text-xs text-muted-foreground">Subtle glow animation</p>
              </div>
              <div className="p-3 bg-card rounded-lg sharingan-effect">
                <p className="font-medium">Rotation Effect</p>
                <p className="text-xs text-muted-foreground">Spinning animation</p>
              </div>
              <div className="p-3 bg-card rounded-lg supernatural-aura">
                <p className="font-medium">Aura Effect</p>
                <p className="text-xs text-muted-foreground">Color-shifting glow</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};