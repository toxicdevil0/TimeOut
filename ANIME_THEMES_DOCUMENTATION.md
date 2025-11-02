# Anime Themes Feature Documentation

## Overview
Added three premium anime-inspired themes to the TimeOut Focus Points Shop that users can unlock and purchase using Focus Points (FP). Each theme provides a unique visual experience with custom animations, color schemes, and UI effects.

## Available Themes

### 1. Demon Slayer Theme (800 FP - Epic)
- **Design Style**: Traditional Japanese aesthetics inspired by Kimetsu no Yaiba
- **Color Palette**: 
  - Primary: Orange (#E67E22) - Hinokami Kagura flames
  - Secondary: Deep red (#C0392B) 
  - Accent: Golden yellow (#F39C12) - Nichirin blade glow
- **Visual Effects**:
  - Breathing glow animations on focus cards
  - Flame particle effects
  - Sword slash transitions
  - Traditional UI elements with Japanese-inspired styling
- **Background**: Tanjiro Kamado artwork
- **Experience**: Creates a focused, traditional atmosphere perfect for deep concentration

### 2. Naruto Theme (1,200 FP - Legendary)
- **Design Style**: Uchiha clan-inspired with ninja aesthetics
- **Color Palette**:
  - Primary: Sharingan red (#E74C3C)
  - Secondary: Dark blue-gray (#2C3E50)
  - Accent: Ninja scroll gold (#F1C40F)
- **Visual Effects**:
  - Sharingan spinning animations
  - Chakra flow gradients
  - Ninja scroll unfurling transitions
  - Dark, powerful aesthetic
- **Background**: Itachi Uchiha artwork
- **Experience**: Intense, focused energy for serious study sessions

### 3. Dandadan Theme (600 FP - Rare)
- **Design Style**: Supernatural/psychic powers with alien elements
- **Color Palette**:
  - Primary: Psychic purple (#9B59B6)
  - Secondary: Electric blue (#3498DB)
  - Accent: Cyan (#1ABC9C)
- **Visual Effects**:
  - Psychic wave animations
  - Alien glitch effects
  - Supernatural aura glows
  - Otherworldly UI elements
- **Background**: Okarun and Turbo Granny artwork
- **Experience**: Creative, energetic atmosphere for dynamic learning

## Technical Implementation

### File Structure
```
src/
├── components/tokens/
│   ├── TokenShop.tsx (updated with anime themes)
│   └── ThemePreview.tsx (new demo component)
├── contexts/
│   └── ThemeContext.tsx (theme management)
├── config/
│   └── animeThemes.ts (theme definitions)
├── styles/
│   └── animeThemes.css (theme-specific styles)
└── public/themes-images/
    ├── tanjiro-kamado-de-kimetsu-no-yaiba_3840x2160_xtrafondos.com.jpg
    ├── itachi-uchiha-fondo-rojo-tinto_5120x2880_xtrafondos.com.jpg
    └── okarun-turbo-granny-de-dandadan_3840x2160_xtrafondos.com.jpg
```

### Key Features

#### Theme Management
- **ThemeContext**: Manages theme switching, ownership, and persistence
- **Local Storage**: Saves user preferences and owned themes
- **CSS Variables**: Dynamic theme application using CSS custom properties
- **Animation System**: Keyframe animations specific to each theme

#### Shop Integration
- **Special Section**: Dedicated "Anime Collection" section in Token Shop
- **Enhanced Cards**: Theme previews with background images and gradient overlays
- **Feature Lists**: Detailed descriptions of theme-specific effects
- **Auto-Switch**: Automatically applies purchased anime themes

#### Visual Enhancements
- **Background Images**: Subtle themed backgrounds (5% opacity)
- **Gradient Overlays**: Theme-specific color gradients
- **Icon Styling**: Custom themed icon containers
- **Hover Effects**: Enhanced animations and transitions

### Pricing Strategy
- **Dandadan**: 600 FP (Entry-level anime theme)
- **Demon Slayer**: 800 FP (Mid-tier with traditional aesthetics)
- **Naruto**: 1,200 FP (Premium tier with advanced effects)

### User Experience Improvements

#### Enhanced Shop Interface
- Organized anime themes in dedicated section
- "Limited Edition" badge for exclusivity
- Feature descriptions for each theme
- Visual previews with theme colors

#### Accessibility Considerations
- Respects `prefers-reduced-motion` for users sensitive to animations
- High contrast mode adjustments
- Mobile-optimized (disabled particles for performance)
- Smooth theme transitions

#### Performance Optimizations
- Efficient CSS animations using transforms
- Conditional particle systems
- Background image optimization
- Minimal JavaScript overhead

## Usage Instructions

### For Users
1. **Earn Focus Points**: Complete focus sessions to earn 25-60 FP each
2. **Visit Token Shop**: Click "Token Shop" button to browse themes
3. **Browse Anime Collection**: View the dedicated anime themes section
4. **Purchase Theme**: Spend FP to unlock desired anime theme
5. **Auto-Apply**: Theme automatically applies after purchase
6. **Switch Themes**: Use Theme Preview component to switch between owned themes

### For Developers
1. **Adding New Themes**: Update `animeThemes.ts` configuration
2. **Custom Animations**: Add keyframes to `animeThemes.css`
3. **Theme Integration**: Use `useTheme()` hook in components
4. **Styling**: Apply theme classes and CSS variables

## Future Enhancements

### Potential Additions
- Sound effects for theme switches
- More detailed particle systems
- Seasonal/limited-time themes
- Theme customization options
- Community-created themes

### Technical Improvements
- WebGL-based effects for premium themes
- Theme preview animations
- Advanced particle physics
- Dynamic theme generation

## Success Metrics
- User engagement with theme purchasing
- Focus session completion rates with anime themes
- User retention after theme purchases
- Community feedback and theme requests

This feature adds significant value to the Focus Points economy while providing users with personalized, immersive study environments that reflect their interests in anime culture.