import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AnimeTheme, getThemeById, getThemeCSSVariables, getThemeAnimations } from '@/config/animeThemes';

interface ThemeContextType {
  currentTheme: string | null;
  ownedThemes: Set<string>;
  activeAnimeTheme: AnimeTheme | null;
  switchTheme: (themeId: string, bypassOwnershipCheck?: boolean) => boolean;
  addOwnedTheme: (themeId: string) => void;
  isThemeOwned: (themeId: string) => boolean;
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);
  const [ownedThemes, setOwnedThemes] = useState<Set<string>>(new Set(['forest-theme']));
  const [activeAnimeTheme, setActiveAnimeTheme] = useState<AnimeTheme | null>(null);

  // Load theme preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('timeout-active-theme');
    const savedOwnedThemes = localStorage.getItem('timeout-owned-themes');
    
    if (savedOwnedThemes) {
      try {
        const themes = JSON.parse(savedOwnedThemes);
        setOwnedThemes(new Set(themes));
      } catch (error) {
        console.error('Error loading owned themes:', error);
      }
    }
    
    if (savedTheme && savedTheme !== 'default') {
      const theme = getThemeById(savedTheme);
      if (theme) {
        setCurrentTheme(savedTheme);
        setActiveAnimeTheme(theme);
        applyTheme(theme);
      }
    }
  }, []);

  // Save theme preferences to localStorage
  useEffect(() => {
    localStorage.setItem('timeout-active-theme', currentTheme || 'default');
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem('timeout-owned-themes', JSON.stringify(Array.from(ownedThemes)));
  }, [ownedThemes]);

  const applyTheme = (theme: AnimeTheme) => {
    const root = document.documentElement;
    const cssVariables = getThemeCSSVariables(theme.id);
    
    // Apply CSS variables
    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Add theme animations to document head
    const animationId = `anime-theme-${theme.id}`;
    let existingStyle = document.getElementById(animationId);
    
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = animationId;
    styleElement.textContent = getThemeAnimations(theme.id);
    document.head.appendChild(styleElement);
    
    // Add theme class to body
    document.body.classList.remove('theme-demon-slayer', 'theme-naruto', 'theme-dandadan');
    document.body.classList.add(`theme-${theme.id.replace('-theme', '')}`);
    
    // Add anime theme active class for background image
    document.body.classList.add('anime-theme-active');
    
    console.log(`🎨 Applied ${theme.name} theme`);
  };

  const removeTheme = () => {
    const root = document.documentElement;
    
    // Remove anime theme variables
    const animeVars = ['--anime-primary', '--anime-secondary', '--anime-accent', 
                       '--anime-background', '--anime-foreground', '--anime-muted', '--anime-bg-image'];
    
    animeVars.forEach(variable => {
      root.style.removeProperty(variable);
    });
    
    // Remove theme animations
    const existingStyles = document.querySelectorAll('[id^="anime-theme-"]');
    existingStyles.forEach(style => style.remove());
    
    // Remove theme classes
    document.body.classList.remove('theme-demon-slayer', 'theme-naruto', 'theme-dandadan', 'anime-theme-active');
    
    console.log('🎨 Reset to default theme');
  };

  const switchTheme = (themeId: string, bypassOwnershipCheck?: boolean): boolean => {
    if (themeId === 'default') {
      removeTheme();
      setCurrentTheme(null);
      setActiveAnimeTheme(null);
      return true;
    }
    
    if (!bypassOwnershipCheck && !ownedThemes.has(themeId)) {
      console.log(`❌ Theme ${themeId} is not owned`);
      return false;
    }
    
    const theme = getThemeById(themeId);
    if (!theme) {
      console.log(`❌ Theme ${themeId} not found`);
      return false;
    }
    
    applyTheme(theme);
    setCurrentTheme(themeId);
    setActiveAnimeTheme(theme);
    console.log(`🎨 Successfully switched to ${theme.name}`);
    return true;
  };

  const addOwnedTheme = (themeId: string) => {
    setOwnedThemes(prev => {
      const newSet = new Set([...prev, themeId]);
      console.log(`✅ Added ${themeId} to owned themes`);
      return newSet;
    });
  };

  const isThemeOwned = (themeId: string): boolean => {
    return ownedThemes.has(themeId);
  };

  const resetToDefault = () => {
    switchTheme('default');
  };

  const contextValue: ThemeContextType = {
    currentTheme,
    ownedThemes,
    activeAnimeTheme,
    switchTheme,
    addOwnedTheme,
    isThemeOwned,
    resetToDefault
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook to get current theme info for UI display
export const useCurrentThemeInfo = () => {
  const { currentTheme, activeAnimeTheme } = useTheme();
  
  return {
    isAnimeTheme: activeAnimeTheme !== null,
    themeName: activeAnimeTheme?.name || 'Default Theme',
    themeId: currentTheme,
    themeData: activeAnimeTheme
  };
};