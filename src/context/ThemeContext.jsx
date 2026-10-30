import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'netflix',
    name: 'Netflix Crimson',
    badge: 'Classic',
    desc: 'Deep obsidian black with signature crimson red glow.',
    colors: {
      background: '#09090b',
      surface: '#18181b',
      surfaceCard: '#27272a',
      accent: '#e50914',
      accentHover: '#b80710',
      accentGlow: 'rgba(229, 9, 20, 0.35)',
      accentRgb: '229, 9, 20',
      text: '#f4f4f5'
    },
    swatch: ['#09090b', '#18181b', '#e50914']
  },
  {
    id: 'friends',
    name: 'F·R·I·E·N·D·S Sitcom',
    badge: 'Sitcom OST',
    desc: 'Central Perk espresso, Monica’s door purple & the iconic "I\'ll Be There for You" theme song.',
    colors: {
      background: '#0e0b12',
      surface: '#1b1424',
      surfaceCard: '#2b1f3a',
      accent: '#a855f7',
      accentHover: '#9333ea',
      accentGlow: 'rgba(168, 85, 247, 0.35)',
      accentRgb: '168, 85, 247',
      text: '#faf5ff'
    },
    swatch: ['#0e0b12', '#1b1424', '#a855f7']
  },
  {
    id: 'polaroid',
    name: 'Retro Polaroid (35mm)',
    badge: 'Warm Vintage',
    desc: 'Dark roasted sepia, cozy hazels & golden-hour sunset amber.',
    colors: {
      background: '#120f0d',
      surface: '#1f1915',
      surfaceCard: '#2e241e',
      accent: '#f59e0b',
      accentHover: '#d97706',
      accentGlow: 'rgba(245, 158, 11, 0.35)',
      accentRgb: '245, 158, 11',
      text: '#fef3c7'
    },
    swatch: ['#120f0d', '#1f1915', '#f59e0b']
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Arcade',
    badge: 'Arcade',
    desc: 'Midnight navy with electric cyan neon & photo booth energy.',
    colors: {
      background: '#070b14',
      surface: '#0f172a',
      surfaceCard: '#1e293b',
      accent: '#06b6d4',
      accentHover: '#0891b2',
      accentGlow: 'rgba(6, 182, 212, 0.35)',
      accentRgb: '6, 182, 212',
      text: '#ecfeff'
    },
    swatch: ['#070b14', '#0f172a', '#06b6d4']
  },
  {
    id: 'emerald',
    name: 'Udaipur Emerald',
    badge: 'Heritage',
    desc: 'Deep forest onyx with royal jade & serene lake palace emerald.',
    colors: {
      background: '#05140f',
      surface: '#0c241c',
      surfaceCard: '#133529',
      accent: '#10b981',
      accentHover: '#059669',
      accentGlow: 'rgba(16, 185, 129, 0.35)',
      accentRgb: '16, 185, 129',
      text: '#ecfdf5'
    },
    swatch: ['#05140f', '#0c241c', '#10b981']
  },
  {
    id: 'lofi',
    name: 'Midnight Lo-Fi',
    badge: 'Minimal OLED',
    desc: 'Pitch OLED black with crisp mint green accents for night sessions.',
    colors: {
      background: '#000000',
      surface: '#121212',
      surfaceCard: '#1e1e1e',
      accent: '#22c55e',
      accentHover: '#16a34a',
      accentGlow: 'rgba(34, 197, 94, 0.35)',
      accentRgb: '34, 197, 94',
      text: '#f0fdf4'
    },
    swatch: ['#000000', '#121212', '#22c55e']
  }
];

const ThemeContext = createContext({
  currentTheme: THEMES[0],
  setTheme: () => {},
  themes: THEMES
});

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem('dostflix_theme') || 'netflix';
  });

  const currentTheme = THEMES.find(t => t.id === themeId) || THEMES[0];

  useEffect(() => {
    localStorage.setItem('dostflix_theme', currentTheme.id);

    const root = document.documentElement;
    root.setAttribute('data-theme', currentTheme.id);

    // Update CSS variables
    root.style.setProperty('--background', currentTheme.colors.background);
    root.style.setProperty('--surface', currentTheme.colors.surface);
    root.style.setProperty('--surface-card', currentTheme.colors.surfaceCard);
    root.style.setProperty('--accent', currentTheme.colors.accent);
    root.style.setProperty('--accent-hover', currentTheme.colors.accentHover);
    root.style.setProperty('--accent-glow', currentTheme.colors.accentGlow);
    root.style.setProperty('--accent-rgb', currentTheme.colors.accentRgb);
  }, [currentTheme]);

  const changeTheme = (newId) => {
    setThemeId(newId);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme: changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
