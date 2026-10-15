import React, { useState, useEffect, useCallback } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

const SarvestanIcon = registerPlugin('SarvestanIcon');

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
  {
    id: 'batman',
    name: 'شوالیه تاریکی (بتمن)',
    badge: 'ایستر اگ',
    desc: 'نشان اصیل خفاش زرین بتمن بر فراز آسمان سیاه گاتهام',
    leaf: '#FFE600',
    bg: '#000000',
    border: '#FFE60055',
    isDark: true,
    isBatman: true,
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
      const plugin = SarvestanIcon || Capacitor.Plugins?.SarvestanIcon;
      if (plugin?.setIcon) {
        await plugin.setIcon({ iconId: meta.id });
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
      const plugin = SarvestanIcon || Capacitor.Plugins?.SarvestanIcon;
      if (plugin?.getIcon) {
        plugin.getIcon()
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
      {meta.id === 'batman' ? (
        <svg
          viewBox="0 0 122.13 69.89"
          className="w-[84%] h-[84%] block"
          aria-label={meta.name}
        >
          <path
            fill="#f7dd30"
            d="M121.06,35c0,18.71-26.86,33.88-60,33.88S1.06,53.66,1.06,35s26.87-33.89,60-33.89,60,15.17,60,33.89Z"
          />
          <path
            fill="#000000"
            d="M51.72,24.46c-14.49,5.37-21.86-8-14.49-15.74-11.75,3-30.86,11.49-30.86,25.63,0,12.83,12.49,20.09,21.49,23.22-8.68-10.74,3.25-19.16,13.7-7.41C49.69,35.73,59.28,56.44,61,59.58h0c1.71-3.14,11.31-23.85,19.44-9.42,10.45-11.75,22.38-3.33,13.7,7.41,9-3.13,21.49-10.39,21.49-23.22,0-14.14-19.11-22.63-30.86-25.63,7.37,7.74,0,21.11-14.49,15.74-1.67-2-2.75-6.11-2.75-18.24-1.94,1.26-3.33,5.71-3.45,6a12,12,0,0,0-6.15,0c-.12-.32-1.51-4.77-3.45-6,0,12.13-1.08,16.25-2.75,18.24ZM122.13,35c0,9.76-6.93,18.56-18.12,24.88-11,6.22-26.2,10.06-42.95,10.06S29.13,66.05,18.12,59.83C6.92,53.51,0,44.71,0,35S6.92,16.39,18.12,10.07C29.13,3.85,44.32,0,61.06,0S93,3.85,104,10.07C115.2,16.39,122.13,25.18,122.13,35ZM103,58c10.52-5.94,17-14.09,17-23s-6.51-17.1-17-23c-10.7-6-25.52-9.78-41.91-9.78s-31.2,3.74-41.9,9.78C8.64,17.85,2.13,26,2.13,35S8.64,52,19.16,58c10.7,6.05,25.52,9.79,41.9,9.79S92.27,64,103,58Z"
          />
        </svg>
      ) : (
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
      )}
    </div>
  );
}
