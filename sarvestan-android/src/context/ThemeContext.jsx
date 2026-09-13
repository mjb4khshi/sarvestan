import { createContext, useContext, useState, useEffect } from 'react';

export const SARV_THEMES = [
  {
    id: 'persian-dark',
    name: 'Persian Dark',
    persianName: 'پرشین دارک (اصیل)',
    icon: '🌙',
    mode: 'dark',
    primary: '#0066a4',
    base: '#000000',
  },
  {
    id: 'persian-light',
    name: 'Persian Light',
    persianName: 'پرشین لایت (روشن)',
    icon: '☀️',
    mode: 'light',
    primary: '#0066a4',
    base: '#ffffff',
  },
  {
    id: 'persian-dark-sharp',
    name: 'Persian Dark Sharp',
    persianName: 'پرشین دارک شارپ',
    icon: '📐',
    mode: 'dark',
    primary: '#0066a4',
    base: '#000000',
  },
  {
    id: 'persian-light-sharp',
    name: 'Persian Light Sharp',
    persianName: 'پرشین لایت شارپ',
    icon: '📐',
    mode: 'light',
    primary: '#0066a4',
    base: '#ffffff',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    persianName: 'سایبرپانک نئون',
    icon: '⚡',
    mode: 'dark',
    primary: '#00f0ff',
    base: '#08090d',
  },
  {
    id: 'tokyo-midnight',
    name: 'Tokyo Midnight',
    persianName: 'توکیو نیمه‌شب',
    icon: '🌃',
    mode: 'dark',
    primary: '#8b5cf6',
    base: '#090a16',
  },
  {
    id: 'ocean-abyss',
    name: 'Ocean Abyss',
    persianName: 'اعماق اقیانوس',
    icon: '🌊',
    mode: 'dark',
    primary: '#06b6d4',
    base: '#060d17',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    persianName: 'زمرد کهنسال',
    icon: '🌲',
    mode: 'dark',
    primary: '#10b981',
    base: '#06130b',
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    persianName: 'بنفش سلطنتی',
    icon: '🔮',
    mode: 'dark',
    primary: '#a855f7',
    base: '#0d0718',
  },
  {
    id: 'crimson',
    name: 'Crimson Velvet',
    persianName: 'زرشکی و یاقوت',
    icon: '🔥',
    mode: 'dark',
    primary: '#f43f5e',
    base: '#110507',
  },
  {
    id: 'coffee-roast',
    name: 'Coffee Roast',
    persianName: 'اسپرسو و کهربا',
    icon: '☕',
    mode: 'dark',
    primary: '#d97706',
    base: '#120d09',
  },
  {
    id: 'sunset',
    name: 'Sunset Terracotta',
    persianName: 'غروب کویر (روشن)',
    icon: '🌅',
    mode: 'light',
    primary: '#ff5e36',
    base: '#fffbf7',
  },
  {
    id: 'matcha',
    name: 'Matcha Blossom',
    persianName: 'چای ماچا (روشن)',
    icon: '🍵',
    mode: 'light',
    primary: '#15803d',
    base: '#fbfdfa',
  },
  {
    id: 'nordic',
    name: 'Nordic Glacier',
    persianName: 'یخسار نوردیک (روشن)',
    icon: '❄️',
    mode: 'light',
    primary: '#0284c7',
    base: '#f8fafc',
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    persianName: 'رز گلد براق (روشن)',
    icon: '🌸',
    mode: 'light',
    primary: '#e11d48',
    base: '#fff8f9',
  },
];

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(
    () => localStorage.getItem('sarvestan_theme') || 'persian-light',
  );

  useEffect(() => {
    document.documentElement.setAttribute('datatheme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
    const meta = SARV_THEMES.find((t) => t.id === currentTheme);
    document.documentElement.setAttribute('data-theme-mode', meta?.mode || 'dark');
    localStorage.setItem('sarvestan_theme', currentTheme);
  }, [currentTheme]);

  const activeThemeMeta =
    SARV_THEMES.find((t) => t.id === currentTheme) || SARV_THEMES[0];

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme: setCurrentTheme,
        themes: SARV_THEMES,
        activeThemeMeta,
        isDark: activeThemeMeta.mode === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
