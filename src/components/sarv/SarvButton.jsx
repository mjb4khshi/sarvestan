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

  let classes = 'btn';
  if (style === 'soft') classes += ` btn-soft btn-${color}`;
  else if (style === 'outline') classes += ` btn-outline btn-${color}`;
  else if (style === 'flat') classes += ` btn-flat btn-${color}`;
  else classes += ` btn-${color}`;

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
