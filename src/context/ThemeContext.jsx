import React, { createContext, useContext, useState, useEffect } from 'react';

export const SARV_THEMES = [
  {
    id: 'persian-dark',
    name: 'Persian Dark',
    persianName: 'پرشین دارک (اصیل)',
    icon: '🌙',
    mode: 'dark',
    primary: '#0066a4',
    base: '#000000',
    description: 'تم استاندارد تیره با کنتراست متعادل و فیروزه‌ای آرامش‌بخش'
  },
  {
    id: 'persian-light',
    name: 'Persian Light',
    persianName: 'پرشین لایت (روشن)',
    icon: '☀️',
    mode: 'light',
    primary: '#0066a4',
    base: '#ffffff',
    description: 'پالت سفید گرم، تمیز و خوانا برای محیط‌های روشن'
  },
  {
    id: 'persian-dark-sharp',
    name: 'Persian Dark Sharp',
    persianName: 'پرشین دارک شارپ (زاویه‌دار)',
    icon: '📐',
    mode: 'dark',
    primary: '#0066a4',
    base: '#000000',
    description: 'نسخه بدون انحنا (Border Radius: 0) با سبک نئو بروتالیسم مدرن'
  },
  {
    id: 'persian-light-sharp',
    name: 'Persian Light Sharp',
    persianName: 'پرشین لایت شارپ',
    icon: '📐',
    mode: 'light',
    primary: '#0066a4',
    base: '#ffffff',
    description: 'نسخه زاویه‌دار روشن با لبه‌های تیز صنعتی'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    persianName: 'سایبرپانک نئون',
    icon: '⚡',
    mode: 'dark',
    primary: '#00f0ff',
    base: '#08090d',
    description: 'کنتراست شدید مشکی کربنی با نئون فیروزه‌ای و زرد ولتاژ بالا'
  },
  {
    id: 'tokyo-midnight',
    name: 'Tokyo Midnight',
    persianName: 'توکیو نیمه‌شب',
    icon: '🌃',
    mode: 'dark',
    primary: '#8b5cf6',
    base: '#090a16',
    description: 'شب‌های درخشان توکیو با بنفش نئونی و درخشش ارغوانی'
  },
  {
    id: 'ocean-abyss',
    name: 'Ocean Abyss',
    persianName: 'اعماق اقیانوس',
    icon: '🌊',
    mode: 'dark',
    primary: '#06b6d4',
    base: '#060d17',
    description: 'آبی اقیانوسی عمیق با نور ساطع فیروزه‌ای مرجانی'
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    persianName: 'زمرد کهنسال',
    icon: '🌲',
    mode: 'dark',
    primary: '#10b981',
    base: '#06130b',
    description: 'سبزهای پر رمز و راز جنگل با هایلایت نعنایی زنده'
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    persianName: 'بنفش سلطنتی',
    icon: '🔮',
    mode: 'dark',
    primary: '#a855f7',
    base: '#0d0718',
    description: 'ارغوانی لوکس سلطنتی با حس نجومی و سحرآمیز'
  },
  {
    id: 'crimson',
    name: 'Crimson Velvet',
    persianName: 'زرشکی و یاقوت',
    icon: '🔥',
    mode: 'dark',
    primary: '#f43f5e',
    base: '#110507',
    description: 'قرمز یاقوتی چشم‌نواز با گرمای شعله‌های سرخ'
  },
  {
    id: 'coffee-roast',
    name: 'Coffee Roast',
    persianName: 'اسپرسو و کهربا',
    icon: '☕',
    mode: 'dark',
    primary: '#d97706',
    base: '#120d09',
    description: 'رنگ‌های گرم قهوه برشته و مس سوخته برای شب‌های طولانی مطالعه'
  },
  {
    id: 'sunset',
    name: 'Sunset Terracotta',
    persianName: 'غروب کویر (روشن)',
    icon: '🌅',
    mode: 'light',
    primary: '#ff5e36',
    base: '#fffbf7',
    description: 'رنگ‌های گرم آجری، خامه و درخشش طلایی خورشید غروب'
  },
  {
    id: 'matcha',
    name: 'Matcha Blossom',
    persianName: 'چای ماچا (روشن)',
    icon: '🍵',
    mode: 'light',
    primary: '#15803d',
    base: '#fbfdfa',
    description: 'تم ملایم چای سبز با انرژی طبیعی و حسی ارگانیک و دلپذیر'
  },
  {
    id: 'nordic',
    name: 'Nordic Glacier',
    persianName: 'یخسار نوردیک (روشن)',
    icon: '❄️',
    mode: 'light',
    primary: '#0284c7',
    base: '#f8fafc',
    description: 'سفید و نقره‌ای یخچال‌های طبیعی اسکاندیناوی، سرد و با طراوت'
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    persianName: 'رز گلد براق (روشن)',
    icon: '🌸',
    mode: 'light',
    primary: '#e11d48',
    base: '#fff8f9',
    description: 'ترکیب لوکس صورتی ملایم، مرواریدی و متالیک شیک'
  }
];

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('sarvestan_theme') || 'persian-dark';
  });

  useEffect(() => {
    // Apply both datatheme and data-theme to support all Sarv UI variants
    document.documentElement.setAttribute('datatheme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
    const meta = SARV_THEMES.find(t => t.id === currentTheme);
    document.documentElement.setAttribute('data-theme-mode', meta?.mode || 'dark');
    localStorage.setItem('sarvestan_theme', currentTheme);
  }, [currentTheme]);

  const activeThemeMeta = SARV_THEMES.find(t => t.id === currentTheme) || SARV_THEMES[0];

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      setTheme: setCurrentTheme,
      themes: SARV_THEMES,
      activeThemeMeta,
      isDark: activeThemeMeta.mode === 'dark'
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
