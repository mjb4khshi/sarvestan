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

const BADGE_MAP = {
  solid: {
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    accent: 'badge-accent',
    success: 'badge-success',
    warn: 'badge-warn',
    danger: 'badge-danger',
    info: 'badge-info',
    neutral: 'badge-neutral',
  },
  soft: {
    primary: 'badge-soft-primary',
    secondary: 'badge-soft-secondary',
    accent: 'badge-soft-accent',
    success: 'badge-soft-success',
    warn: 'badge-soft-warn',
    danger: 'badge-soft-danger',
    info: 'badge-soft-info',
    neutral: 'badge-soft-neutral',
  },
  outline: {
    primary: 'badge-outline-primary',
    secondary: 'badge-outline-secondary',
    accent: 'badge-outline-accent',
    success: 'badge-outline-success',
    warn: 'badge-outline-warn',
    danger: 'badge-outline-danger',
    info: 'badge-outline-info',
    neutral: 'badge-outline-neutral',
  },
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
  const styleKey = outline ? 'outline' : soft ? 'soft' : 'solid';
  const variantClass = BADGE_MAP[styleKey]?.[base] || BADGE_MAP[styleKey].primary;

  let badgeClass = `badge ${variantClass}`;

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
