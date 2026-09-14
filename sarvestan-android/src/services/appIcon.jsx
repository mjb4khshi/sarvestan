import React, { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

export const APP_ICONS = [
  {
    id: 'default',
    name: 'زمرد اصیل',
    badge: 'پیش‌فرض',
    desc: 'رنگ اصیل سروستان، برگ سبز زمردی روی زمینه سپید برفی',
    leaf: '#0D9275',
    bg: '#FFFFFF',
    border: '#E2E8F0',
    isDark: false,
  },
  {
    id: 'dark',
    name: 'دارک اونیکس',
    badge: 'محبوب',
    desc: 'حالت شب پرطرفدار با کنتراست عمیق و برگ زمردی نئون',
    leaf: '#10B981',
    bg: '#121212',
    border: '#27272A',
    isDark: true,
  },
  {
    id: 'sapphire',
    name: 'آبی بهستان',
    badge: 'دانشگاهی',
    desc: 'آبی یاقوتی دانشگاهی با هویت رسمی سامانه بهستان',
    leaf: '#38BDF8',
    bg: '#0A192F',
    border: '#1E293B',
    isDark: true,
  },
  {
    id: 'cyberpunk',
    name: 'سایبر نئون',
    badge: 'نئونی',
    desc: 'استایل سایبرپانک با رنگ فیروزه‌ای تابناک و مدرن',
    leaf: '#00F0FF',
    bg: '#08090D',
    border: '#00F0FF44',
    isDark: true,
  },
  {
    id: 'gold',
    name: 'طلای شاهانه',
    badge: 'لوکس',
    desc: 'جلوهٔ طلایی متالیک روی پس‌زمینه تیتانیوم دودی',
    leaf: '#F59E0B',
    bg: '#18181B',
    border: '#F59E0B44',
    isDark: true,
  },
  {
    id: 'crimson',
    name: 'یاقوت سرخ',
    badge: 'ویژه',
    desc: 'قرمز یاقوتی درخشان با انرژی بالا و تمایز چشم‌نواز',
    leaf: '#F43F5E',
    bg: '#1A0A0E',
    border: '#F43F5E44',
    isDark: true,
  },
  {
    id: 'violet',
    name: 'بنفش کیهانی',
    badge: 'مدرن',
    desc: 'بنفش ارغوانی فضایی با حس نوآوری و آینده‌نگری',
    leaf: '#C084FC',
    bg: '#130924',
    border: '#C084FC44',
    isDark: true,
  },
  {
    id: 'sunset',
    name: 'غروب پاییزی',
    badge: 'گرم',
    desc: 'ترکیب دلنشین پرتقالی آتشین و کویر پاییزی',
    leaf: '#FB923C',
    bg: '#1F100A',
    border: '#FB923C44',
    isDark: true,
  },
  {
    id: 'matcha',
    name: 'چای ماچا',
    badge: 'طبیعت',
    desc: 'تم آرامش‌بخش ماچا و طبیعت سبز روشن و ملایم',
    leaf: '#15803D',
    bg: '#F2F9F2',
    border: '#DCFCE7',
    isDark: false,
  },
  {
    id: 'rose',
    name: 'رز گلد',
    badge: 'فانتزی',
    desc: 'طراحی شیک صورتی مرواریدی و رز درخشان',
    leaf: '#E11D48',
    bg: '#FFF1F4',
    border: '#FFE4E6',
    isDark: false,
  },
  {
    id: 'nordic',
    name: 'یخسار نوردیک',
    badge: 'کریستال',
    desc: 'آبی خنک قطبی روی زمینه نقره‌ای کریستالی و روشن',
    leaf: '#0284C7',
    bg: '#F0F9FF',
    border: '#E0F2FE',
    isDark: false,
  },
  {
    id: 'stealth',
    name: 'استلث تیتانیوم',
    badge: 'مینیمال',
    desc: 'طراحی مونوکروم و ارگونومیک خاکستری و تیتانیوم مات',
    leaf: '#E2E8F0',
    bg: '#0F172A',
    border: '#334155',
    isDark: true,
  },
];

const STORAGE_KEY = 'sarvestan_app_icon';

export function getCurrentIconId() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'default';
  } catch {
    return 'default';
  }
}

export function getIconMeta(id) {
  return APP_ICONS.find((icon) => icon.id === id) || APP_ICONS[0];
}

/**
 * تغییر آیکون لانچر در اندروید و ذخیره در تنظیمات محلی
 */
export async function setAppIcon(iconId) {
  const meta = getIconMeta(iconId);
  try {
    localStorage.setItem(STORAGE_KEY, meta.id);
  } catch {}

  // اطلاع‌رسانی به کامپوننت‌های فرانت‌اند
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sarvestan-icon-change', { detail: meta.id }));
  }

  // تغییر آیکون لانچر نیتیو در اندروید
  if (Capacitor.isNativePlatform()) {
    try {
      const { Plugins } = Capacitor;
      if (Plugins && Plugins.SarvestanIcon) {
        await Plugins.SarvestanIcon.setIcon({ iconId: meta.id });
      }
    } catch (err) {
      console.warn('[appIcon] Native setIcon error:', err);
    }
  }

  return meta;
}

/**
 * هوک ری‌اکت برای مشاهده و تغییر آیکون فعال
 */
export function useAppIcon() {
  const [currentIconId, setCurrentIconId] = useState(getCurrentIconId);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // در بدو لود روی اندروید، وضعیت واقعی لانچر را استعلام کن
    if (Capacitor.isNativePlatform()) {
      const { Plugins } = Capacitor;
      if (Plugins && Plugins.SarvestanIcon) {
        Plugins.SarvestanIcon.getIcon()
          .then((res) => {
            if (res && res.iconId && res.iconId !== currentIconId) {
              setCurrentIconId(res.iconId);
              try {
                localStorage.setItem(STORAGE_KEY, res.iconId);
              } catch {}
            }
          })
          .catch(() => {});
      }
    }

    const handler = (e) => {
      if (e.detail) {
        setCurrentIconId(e.detail);
      }
    };
    window.addEventListener('sarvestan-icon-change', handler);
    return () => window.removeEventListener('sarvestan-icon-change', handler);
  }, []);

  const changeIcon = useCallback(async (iconId) => {
    setIsChanging(true);
    try {
      const res = await setAppIcon(iconId);
      setCurrentIconId(res.id);
      return res;
    } finally {
      setIsChanging(false);
    }
  }, []);

  return {
    currentIconId,
    currentIcon: getIconMeta(currentIconId),
    setAppIcon: changeIcon,
    icons: APP_ICONS,
    isChanging,
  };
}

/**
 * کامپوننت رندر زنده SVG آیکون سروستان
 */
export function SarvIconSvg({
  iconId = 'default',
  size = 48,
  className = '',
  rounded = true,
  shadow = true,
}) {
  const meta = getIconMeta(iconId);
  const rx = rounded ? 260 : 0;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${
        shadow ? 'shadow-md' : ''
      } ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? Math.round(size * 0.24) : 0,
        backgroundColor: meta.bg,
        boxShadow: shadow
          ? `0 ${Math.max(2, Math.round(size * 0.06))}px ${Math.max(4, Math.round(size * 0.16))}px rgba(0,0,0,0.18)`
          : 'none',
        border: `1px solid ${meta.border}`,
      }}
    >
      <svg
        viewBox="0 0 1080 1080"
        width="100%"
        height="100%"
        className="w-full h-full block"
        aria-label={meta.name}
      >
        <path
          d="M540,301.33 C540,301.33 330.88,778.67 540,778.67 C749.12,778.67 540,301.33 540,301.33 Z"
          fill={meta.leaf}
        />
      </svg>
    </div>
  );
}
