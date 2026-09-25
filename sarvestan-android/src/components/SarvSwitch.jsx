import { motion } from 'framer-motion';

/**
 * کامپوننت اختصاصی سوییچ سروستان (SarvSwitch)
 * - رفع کامل پرش و انحراف دایره لغزان به کمک انیمیشن خالص translateX محور افقی
 * - سخت‌افزار شتاب‌یافته (GPU Hardware Accelerated با translateZ)
 * - سازگار با تغییرات ارتفاع، ورود نوتیفیکیشن‌ها و انیمیشن‌های بیرون از سوییچ بدون تداخل FLIP
 */
export default function SarvSwitch({
  checked,
  onChange,
  disabled = false,
  size = 'md', // 'sm' | 'md'
  variant = 'primary',
  className = '',
  'aria-label': ariaLabel,
}) {
  const isSm = size === 'sm';
  // ابعاد پیل بر حسب پیکسل
  // md: عرض 48px, ارتفاع 26px, دایره 20px, پدینگ 3px -> جابجایی دایره: 22px
  // sm: عرض 40px, ارتفاع 22px, دایره 16px, پدینگ 3px -> جابجایی دایره: 18px
  const travelX = isSm ? 18 : 22;

  const bgVariants = {
    primary: checked ? 'bg-primary' : 'bg-base-500/45',
    warning: checked ? 'bg-warning' : 'bg-base-500/45',
    success: checked ? 'bg-success' : 'bg-base-500/45',
  };

  const bgClass = bgVariants[variant] || bgVariants.primary;

  return (
    <button
      type="button"
      role="switch"
      dir="ltr"
      aria-checked={Boolean(checked)}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && onChange) {
          onChange(!checked);
        }
      }}
      className={`relative inline-flex items-center shrink-0 cursor-pointer select-none rounded-full transition-colors duration-200 focus:outline-none ${bgClass} ${
        isSm ? 'w-10 h-[22px] px-[3px]' : 'w-12 h-[26px] px-[3px]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'} ${className}`}
      style={{
        transform: 'translateZ(0)',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      <motion.span
        initial={false}
        animate={{
          x: checked ? travelX : 0,
        }}
        transition={{
          type: 'tween',
          duration: 0.18,
          ease: [0.2, 0.8, 0.2, 1],
        }}
        className={`block rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35)] pointer-events-none will-change-transform ${
          isSm ? 'w-4 h-4' : 'w-5 h-5'
        }`}
        style={{
          transform: 'translateZ(0)',
        }}
      />
    </button>
  );
}
