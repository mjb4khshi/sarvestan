import React from 'react';
import { motion } from 'framer-motion';

const VARIANTS = new Set(['primary', 'success', 'warn', 'danger', 'secondary', 'info', 'accent', 'neutral']);

/**
 * دکمه‌ی رسمی Sarv UI
 * - variant: رنگ (primary, secondary, ...)
 * - styleType: solid (پیش‌فرض) | soft | outline | flat
 * - size: sm | md | lg | icon
 *
 * برای سازگاری قدیمی: اگر variant="flat|outline|soft" بود، آن را styleType در نظر می‌گیریم.
 */
const BUTTON_MAP = {
  solid: {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    accent: 'btn-accent',
    success: 'btn-success',
    warn: 'btn-warn',
    danger: 'btn-danger',
    info: 'btn-info',
    neutral: 'btn-neutral',
  },
  soft: {
    primary: 'btn-soft-primary',
    secondary: 'btn-soft-secondary',
    accent: 'btn-soft-accent',
    success: 'btn-soft-success',
    warn: 'btn-soft-warn',
    danger: 'btn-soft-danger',
    info: 'btn-soft-info',
    neutral: 'btn-soft-neutral',
  },
  outline: {
    primary: 'btn-outline-primary',
    secondary: 'btn-outline-secondary',
    accent: 'btn-outline-accent',
    success: 'btn-outline-success',
    warn: 'btn-outline-warn',
    danger: 'btn-outline-danger',
    info: 'btn-outline-info',
    neutral: 'btn-outline-neutral',
  },
  flat: {
    primary: 'btn-flat-primary',
    secondary: 'btn-flat-secondary',
    accent: 'btn-flat-accent',
    success: 'btn-flat-success',
    warn: 'btn-flat-warn',
    danger: 'btn-flat-danger',
    info: 'btn-flat-info',
    neutral: 'btn-flat-neutral',
  },
};

export default function SarvButton({
  children,
  variant = 'primary',
  styleType, // optional override
  size = 'md',
  className = '',
  icon = null,
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  let color = variant;
  let style = styleType;

  // سازگاری با کدهای قدیمی: variant="flat" / "outline" / "soft"
  if (!styleType && ['flat', 'outline', 'soft', 'solid'].includes(variant)) {
    style = variant === 'solid' ? 'solid' : variant;
    color = 'primary';
  }
  if (!VARIANTS.has(color)) color = 'primary';
  if (!style) style = 'solid';

  const styleGroup = BUTTON_MAP[style] || BUTTON_MAP.solid;
  const variantClass = styleGroup[color] || styleGroup.primary;
  let classes = `btn ${variantClass}`;

  if (size === 'sm') classes += ' text-xs';
  if (size === 'lg') classes += ' text-base';
  if (size === 'icon') {
    classes += ' p-2.5 aspect-square rounded-full flex items-center justify-center';
  }

  return (
    <motion.button
      type={type}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      disabled={disabled}
      onClick={onClick}
      className={`${classes} ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
      {...props}
    >
      {icon && (
        <span className={children ? 'ml-2 inline-flex items-center' : 'inline-flex items-center'}>
          {icon}
        </span>
      )}
      {children}
    </motion.button>
  );
}
