import { createContext, useContext, useState, useEffect } from 'react';

export const SARV_THEMES = [
  {
    id: 'persian-light',
    name: 'Persian Light',
    persianName: 'ایرانی روشن',
    icon: '☀️',
    mode: 'light',
    primary: '#0066a4',
    base: '#ffffff',
    accent: '#fe28a2',
  },
  {
    id: 'persian-dark',
    name: 'Persian Dark',
    persianName: 'ایرانی تاریک',
    icon: '🌙',
    mode: 'dark',
    primary: '#0077c2',
    base: '#000000',
    accent: '#fe28a2',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    persianName: 'سایبرپانک نئون',
    icon: '⚡',
    mode: 'dark',
    primary: '#00f0ff',
    base: '#08090d',
    accent: '#ff007f',
  },
  {
    id: 'tokyo-midnight',
    name: 'Karaj Midnight',
    persianName: 'کرج نیمه‌شب',
    icon: '🌃',
    mode: 'dark',
    primary: '#8b5cf6',
    base: '#090a16',
    accent: '#06b6d4',
  },
  {
    id: 'ocean-abyss',
    name: 'Persian Gulf',
    persianName: 'خلیج فارس',
    icon: '🌊',
    mode: 'dark',
    primary: '#06b6d4',
    base: '#060d17',
    accent: '#38bdf8',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    persianName: 'زمرد کهنسال',
    icon: '🌲',
    mode: 'dark',
    primary: '#10b981',
    base: '#06130b',
    accent: '#34d399',
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    persianName: 'بنفش سلطنتی',
    icon: '🔮',
    mode: 'dark',
    primary: '#a855f7',
    base: '#0d0718',
    accent: '#ec4899',
  },
  {
    id: 'crimson',
    name: 'Crimson Velvet',
    persianName: 'زرشکی و یاقوت',
    icon: '🔥',
    mode: 'dark',
    primary: '#f43f5e',
    base: '#110507',
    accent: '#fb7185',
  },
  {
    id: 'coffee-roast',
    name: 'Coffee Roast',
    persianName: 'اسپرسو و کهربا',
    icon: '☕',
    mode: 'dark',
    primary: '#d97706',
    base: '#120d09',
    accent: '#f59e0b',
  },
  {
    id: 'sunset',
    name: 'Robat Karim Sunset',
    persianName: 'غروب رباط کریم',
    icon: '🌅',
    mode: 'light',
    primary: '#ff5e36',
    base: '#fffbf7',
    accent: '#e11d48',
  },
  {
    id: 'matcha',
    name: 'Matcha Blossom',
    persianName: 'چای ماچا (روشن)',
    icon: '🍵',
    mode: 'light',
    primary: '#15803d',
    base: '#fbfdfa',
    accent: '#65a30d',
  },
  {
    id: 'nordic',
    name: 'Nordic Glacier',
    persianName: 'یخسار نوردیک (روشن)',
    icon: '❄️',
    mode: 'light',
    primary: '#0284c7',
    base: '#f8fafc',
    accent: '#0ea5e9',
  },
  {
    id: 'batman',
    name: 'The Dark Knight',
    persianName: 'بتمن (شوالیه تاریکی)',
    icon: '🦇',
    mode: 'dark',
    primary: '#ffe600',
    base: '#000000',
    accent: '#ef4444',
  },
  {
    id: 'monochrome',
    name: 'Noir Monochrome',
    persianName: 'سیاه و سفید (تاریک)',
    icon: '🖤',
    mode: 'dark',
    primary: '#ffffff',
    base: '#000000',
    accent: '#71717a',
  },
  {
    id: 'monochrome-light',
    name: 'Paper Monochrome',
    persianName: 'سیاه و سفید (روشن)',
    icon: '🤍',
    mode: 'light',
    primary: '#000000',
    base: '#f8f8f8',
    accent: '#71717a',
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

  // واکنش خودکار به تغییر تم/حالت شب و روز در تنظیمات گوشی (Mobile Settings)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      const saved = localStorage.getItem('sarvestan_theme');
      if (!saved || saved === 'persian-light' || saved === 'persian-dark') {
        const next = e.matches ? 'persian-dark' : 'persian-light';
        setCurrentTheme(next);
      }
    };
    try {
      media.addEventListener('change', handleSystemChange);
      return () => media.removeEventListener('change', handleSystemChange);
    } catch {
      media.addListener(handleSystemChange);
      return () => media.removeListener(handleSystemChange);
    }
  }, []);

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
