import { motion } from 'framer-motion';
import { toFaDigits } from '../utils/faDigits';

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function SingleDigitWheel({ char, height = 36, startFromZero = false }) {
  const isDigit = /[۰-۹0-9]/.test(char);
  if (!isDigit) {
    const isColon = char === ':';
    return (
      <span
        style={{ height: `${height}px`, lineHeight: `${height}px` }}
        className={`inline-flex items-center justify-center select-none text-center font-mono opacity-80 ${
          isColon ? 'px-[3px] scale-95' : 'px-[1px]'
        }`}
      >
        {char}
      </span>
    );
  }

  // پیدا کردن ایندکس عدد ۰ تا ۹
  const digitStr = toFaDigits(char);
  const digitIndex = FA_DIGITS.indexOf(digitStr);
  const activeIdx = digitIndex >= 0 ? digitIndex : 0;

  return (
    <span
      className="inline-block overflow-hidden relative select-none tabular-nums"
      style={{ height: `${height}px`, lineHeight: `${height}px`, width: '0.62em' }}
    >
      <motion.span
        className="flex flex-col text-center w-full tabular-nums"
        initial={startFromZero ? { y: 0 } : false}
        animate={{ y: -activeIdx * height }}
        transition={{
          type: 'spring',
          stiffness: 240,
          damping: 24,
        }}
      >
        {FA_DIGITS.map((d) => (
          <span
            key={d}
            style={{ height: `${height}px`, lineHeight: `${height}px` }}
            className="block select-none w-full text-center tabular-nums font-mono"
          >
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * مؤلفه نمایش عدد به سبک کیلومترشمار مکانیکی و کرنومتر دستی آنالوگ با فاصله‌گذاری فشرده و tabular
 */
export default function OdometerNumber({ value, height = 36, className = '', startFromZero = false }) {
  const str = toFaDigits(value);
  const chars = str.split('');

  return (
    <span
      dir="ltr"
      className={`inline-flex items-center font-mono font-black tracking-tight tabular-nums select-none ${className}`}
      style={{ height: `${height}px`, fontVariantNumeric: 'tabular-nums' }}
    >
      {chars.map((c, i) => (
        <SingleDigitWheel key={i} char={c} height={height} startFromZero={startFromZero} />
      ))}
    </span>
  );
}
