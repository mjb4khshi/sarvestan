import React, { useState } from 'react';

/**
 * SarvAvatar - Modern, elegant user avatar with monogram fallback
 * Shows the user's authentic photo from Behestan if available,
 * or generates a beautiful, theme-harmonized monogram from Persian initials (e.g. "م‌ب" or "س").
 */

export function getInitials(name) {
  if (!name || name.includes('میهمان') || name.includes('کاربر')) return 'س';
  const clean = name.replace(/^(آقای|خانم|دکتر|مهندس|دانشجو)\s+/, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'س';
  if (parts.length === 1) return parts[0].charAt(0);
  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return `${first}‌${last}`;
}

/** پاک‌سازی src عکس — تگ PHOTO یا base64 خراب را قبول نمی‌کند */
export function sanitizePhotoSrc(photo) {
  if (!photo || typeof photo !== 'string') return null;
  let s = photo.trim();
  if (!s) return null;
  if (/blank-profile-picture|avatar-placeholder|PHOTO/i.test(s)) return null;
  if (s.startsWith('data:image/')) {
    // اگر بعد از base64 تگ یا کاراکتر غیرمجاز مانده، ترمیم
    const m = s.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.*)$/is);
    if (!m) return null;
    const b64 = m[2].replace(/[^A-Za-z0-9+/=]/g, '');
    if (b64.length < 80) return null;
    const mime = m[1] === 'png' || b64.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${b64}`;
  }
  if (/^https?:\/\//i.test(s)) return s;
  return null;
}

export default function SarvAvatar({
  photo,
  fullName = 'دانشجوی میهمان',
  size = 'md',
  isLoggedIn = false,
  className = ''
}) {
  const [imgError, setImgError] = useState(false);
  const [key, setKey] = useState(0);

  // Size definitions
  const sizeMap = {
    xs: { box: 'w-7 h-7 text-[11px]', dot: 'w-2 h-2 -bottom-0.5 -right-0.5' },
    sm: { box: 'w-8 h-8 text-xs', dot: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5' },
    md: { box: 'w-10 h-10 text-sm font-bold', dot: 'w-3 h-3 -bottom-0.5 -right-0.5' },
    lg: { box: 'w-14 h-14 text-lg font-bold', dot: 'w-3.5 h-3.5 bottom-0 right-0' },
    xl: { box: 'w-20 h-20 text-2xl font-black', dot: 'w-4 h-4 bottom-0.5 right-0.5' }
  };

  const selectedSize = sizeMap[size] || sizeMap.md;
  const initials = getInitials(fullName);
  const safePhoto = sanitizePhotoSrc(photo);
  const hasPhoto = Boolean(safePhoto && !imgError);

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}>
      {hasPhoto ? (
        <img
          key={`${key}-${(safePhoto || '').slice(-24)}`}
          src={safePhoto}
          alt={fullName}
          onError={() => setImgError(true)}
          className={`${selectedSize.box} rounded-[var(--radius-button,0.75rem)] object-cover ring-2 ring-primary/25 shadow-sm transition-all`}
        />
      ) : (
        <div
          className={`${selectedSize.box} rounded-[var(--radius-button,0.75rem)] flex items-center justify-center text-white font-bold tracking-tight shadow-md ring-2 ring-primary/20 transition-transform`}
          style={{
            background: 'var(--theme-color-primary, #0066a4)',
          }}
          title={fullName}
        >
          <span>{initials}</span>
        </div>
      )}

      {/* Online / Behestan Sync Status Dot */}
      <span
        className={`absolute rounded-full ring-2 ring-base ${selectedSize.dot} ${
          isLoggedIn
            ? 'bg-success'
            : 'bg-amber-400 animate-pulse'
        }`}
        title={isLoggedIn ? 'متصل به سامانه بهستان' : 'در انتظار ورود به بهستان'}
      />
    </div>
  );
}
