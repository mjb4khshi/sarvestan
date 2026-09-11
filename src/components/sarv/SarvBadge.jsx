import React from 'react';

// variantهای رسمی Sarv UI
const VARIANTS = new Set(['primary', 'success', 'warn', 'danger', 'secondary', 'info', 'accent', 'neutral']);

// نگاشت نام‌های قدیمی → variant استاندارد
const ALIAS = {
  sunset: 'warn',
  emerald: 'success',
  duration: 'accent',
  rose: 'danger',
  royal: 'primary',
};

export default function SarvBadge({
  children,
  variant = 'primary',
  soft = false,
  outline = false,
  size = 'md',
  className = '',
  icon = null,
  dot = false,
  ...props
}) {
  const base = ALIAS[variant] || (VARIANTS.has(variant) ? variant : 'primary');

  // کلاس‌های رسمی Sarv UI: badge-soft-primary / badge-outline-info / badge-success
  let badgeClass = 'badge';
  if (outline) {
    badgeClass += ` badge-outline-${base}`;
  } else if (soft) {
    badgeClass += ` badge-soft-${base}`;
  } else {
    badgeClass += ` badge-${base}`;
  }

  if (size === 'sm') badgeClass += ' text-[10px] px-1.5 py-0.5';
  if (size === 'xs') badgeClass += ' text-[9px] px-1 py-0';

  return (
    <span
      className={`${badgeClass} ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center' }}
      {...props}
    >
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full ml-1.5 animate-pulse"
          style={{ background: 'currentColor' }}
        />
      )}
      {icon && <span className="inline-flex items-center text-xs ml-1">{icon}</span>}
      {children}
    </span>
  );
}
