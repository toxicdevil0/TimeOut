export interface AnimeTheme {
  id: string;
  name: string;
  description: string;
  backgroundImage: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
  };
  effects: {
    animations: string[];
    particles?: boolean;
    glow?: boolean;
    customCursor?: boolean;
  };
  price: number;
  rarity: 'rare' | 'epic' | 'legendary';
}

export const animeThemes: Record<string, AnimeTheme> = {
  'demon-slayer-theme': {
    id: 'demon-slayer-theme',
    name: 'Demon Slayer Theme',
    description: 'Immerse yourself in the world of Tanjiro with traditional Japanese aesthetics, breathing technique animations, and Nichirin blade color schemes',
    backgroundImage: '/themes-images/tanjiro-kamado-de-kimetsu-no-yaiba_3840x2160_xtrafondos.com.jpg',
    colorScheme: {
      primary: '#E67E22', // Orange for Hinokami Kagura
      secondary: '#C0392B', // Deep red
      accent: '#F39C12', // Golden yellow
      background: '#1A1A1A', // Dark background
      foreground: '#ECF0F1', // Light text
      muted: '#95A5A6' // Muted gray
    },
    effects: {
      animations: ['breathing-glow', 'flame-particles', 'sword-slash'],
      particles: true,
      glow: true,
      customCursor: true
    },
    price: 800,
    rarity: 'epic'
  },
  
  'naruto-theme': {
    id: 'naruto-theme',
    name: 'Naruto Theme',
    description: 'Channel the power of the Sharingan with Uchiha-inspired red and black color palette, ninja scroll animations, and chakra flow effects',
    backgroundImage: '/themes-images/itachi-uchiha-fondo-rojo-tinto_5120x2880_xtrafondos.com.jpg',
    colorScheme: {
      primary: '#E74C3C', // Sharingan red
      secondary: '#2C3E50', // Dark blue-gray
      accent: '#F1C40F', // Ninja scroll gold
      background: '#1A1A1A', // Deep black
      foreground: '#ECF0F1', // Light text
      muted: '#7F8C8D' // Muted gray
    },
    effects: {
      animations: ['sharingan-spin', 'chakra-flow', 'ninja-scroll-unfurl'],
      particles: true,
      glow: true,
      customCursor: true
    },
    price: 1200,
    rarity: 'legendary'
  },
  
  'dandadan-theme': {
    id: 'dandadan-theme',
    name: 'Dandadan Theme',
    description: 'Embrace the supernatural with psychic power effects, alien-inspired UI elements, and vibrant otherworldly color combinations',
    backgroundImage: '/themes-images/wp14821497-dandadan-wallpapers.webp',
    colorScheme: {
      primary: '#FFFFFF', // Pure White for primary text & icons
      secondary: '#000000', // Pure Black for cards/panels (used with transparency)
      accent: '#A8E4E3', // Pale Cyan/Mint for active/accent elements
      background: 'rgba(0, 0, 0, 0.7)', // Semi-transparent Black for cards & panels
      foreground: '#FFFFFF', // Pure White for high contrast text
      muted: '#C0C0C0' // Light Gray for secondary text & hints
    },
    effects: {
      animations: ['psychic-waves', 'alien-glitch', 'supernatural-aura'],
      particles: true,
      glow: true,
      customCursor: true
    },
    price: 600,
    rarity: 'rare'
  }
};

export const getThemeById = (id: string): AnimeTheme | undefined => {
  return animeThemes[id];
};

export const getAllAnimeThemes = (): AnimeTheme[] => {
  return Object.values(animeThemes);
};

// CSS variables for each theme
export const getThemeCSSVariables = (themeId: string): Record<string, string> => {
  const theme = getThemeById(themeId);
  if (!theme) return {};

  return {
    '--anime-primary': theme.colorScheme.primary,
    '--anime-secondary': theme.colorScheme.secondary,
    '--anime-accent': theme.colorScheme.accent,
    '--anime-background': theme.colorScheme.background,
    '--anime-foreground': theme.colorScheme.foreground,
    '--anime-muted': theme.colorScheme.muted,
    '--anime-bg-image': `url(${theme.backgroundImage})`
  };
};

// Animation keyframes for each theme
export const getThemeAnimations = (themeId: string): string => {
  const theme = getThemeById(themeId);
  if (!theme) return '';

  switch (themeId) {
    case 'demon-slayer-theme':
      return `
        @keyframes breathing-glow {
          0%, 100% { box-shadow: 0 0 5px rgba(230, 126, 34, 0.5); }
          50% { box-shadow: 0 0 20px rgba(230, 126, 34, 0.8), 0 0 30px rgba(192, 57, 43, 0.6); }
        }
        
        @keyframes flame-particles {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-50px) scale(0.5); }
        }
        
        @keyframes sword-slash {
          0% { transform: translateX(-100%) rotate(-45deg); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100%) rotate(-45deg); opacity: 0; }
        }
      `;
      
    case 'naruto-theme':
      return `
        @keyframes sharingan-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes chakra-flow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes ninja-scroll-unfurl {
          0% { height: 0; opacity: 0; }
          100% { height: auto; opacity: 1; }
        }
      `;
      
    case 'dandadan-theme':
      return `
        @keyframes psychic-waves {
          0%, 100% { 
            transform: scale(1) rotate(0deg); 
            filter: hue-rotate(0deg);
            box-shadow: 0 0 10px rgba(168, 228, 227, 0.3);
          }
          33% { 
            transform: scale(1.05) rotate(120deg); 
            filter: hue-rotate(120deg);
            box-shadow: 0 0 20px rgba(168, 228, 227, 0.5);
          }
          66% { 
            transform: scale(0.95) rotate(240deg); 
            filter: hue-rotate(240deg);
            box-shadow: 0 0 15px rgba(168, 228, 227, 0.4);
          }
        }
        
        @keyframes alien-glitch {
          0%, 100% { transform: translateX(0); opacity: 1; }
          20% { transform: translateX(-2px); opacity: 0.9; }
          40% { transform: translateX(2px); opacity: 1; }
          60% { transform: translateX(-1px); opacity: 0.95; }
          80% { transform: translateX(1px); opacity: 1; }
        }
        
        @keyframes supernatural-aura {
          0%, 100% { 
            box-shadow: 0 0 10px rgba(168, 228, 227, 0.3), 0 0 20px rgba(168, 228, 227, 0.1);
          }
          50% { 
            box-shadow: 0 0 25px rgba(168, 228, 227, 0.6), 0 0 35px rgba(168, 228, 227, 0.3), 0 0 45px rgba(168, 228, 227, 0.1);
          }
        }
      `;
      
    default:
      return '';
  }
};