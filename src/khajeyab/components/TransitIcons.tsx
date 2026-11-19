import {useId} from 'react';
import kntuLogoUrl from '../assets/logos/kntu-logo.png';
import type {BrtLineId, MetroLineId} from '../data/tehranTransit';
import {TEHRAN_BRT_LINES, TEHRAN_METRO_LINES} from '../data/tehranTransit';

interface IconProps {
  className?: string;
}

export const TEHRAN_METRO_OUTER_PATH =
  'M 342.94 84.36 Q 344.00 82.00 346.59 82.00 L 735.46 82.00 Q 742.00 82.00 743.30 88.41 L 900.24 863.65 Q 908.00 902.00 868.87 902.00 L 124.00 902.00 Q 92.00 902.00 92.00 870.00 L 92.00 683.59 Q 92.00 682.00 92.61 680.53 L 288.47 207.70 Q 290.00 204.00 294.01 204.00 L 624.00 204.00 Q 626.00 204.00 626.00 206.00 L 626.00 294.00 Q 626.00 296.00 624.00 296.00 L 336.63 296.00 Q 334.00 296.00 332.96 298.42 L 172.80 670.84 Q 168.00 682.00 180.15 682.00 L 405.22 682.00 Q 432.00 682.00 436.72 708.36 L 450.98 787.99 Q 456.00 816.00 484.45 816.00 L 806.74 816.00 Q 824.00 816.00 820.44 799.11 L 687.00 166.76 Q 686.00 162.00 681.13 162.00 L 314.19 162.00 Q 308.00 162.00 310.54 156.36 Z';

export const TEHRAN_METRO_INNER_PATH =
  'M 482.00 536.00 Q 482.00 502.00 516.00 502.00 L 681.02 502.00 Q 710.00 502.00 716.19 530.31 L 756.97 716.73 Q 766.00 758.00 723.76 758.00 L 516.00 758.00 Q 482.00 758.00 482.00 724.00 Z';

/**
 * لوگوی رسمی و برداری متروی تهران (تولیدشده با اسکریپت پایتون)
 */
export function TehranMetroLogo({className = 'w-5 h-5'}: IconProps) {
  return (
    <svg
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="0" y="0" width="1000" height="1000" rx="110" fill="#0A0A0A" />
      <rect x="58" y="58" width="884" height="884" rx="52" fill="#FAD116" />
      <path d={TEHRAN_METRO_OUTER_PATH} fill="#0A0A0A" />
      <path d={TEHRAN_METRO_INNER_PATH} fill="#0A0A0A" />
    </svg>
  );
}

/**
 * آیکون وکتور اتوبوس تندرو BRT تهران
 */
export function TehranBrtLogo({className = 'w-5 h-5'}: IconProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="4"
        y="3.5"
        width="20"
        height="18"
        rx="4"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path d="M4.5 13H23.5" stroke="currentColor" strokeWidth="2" />
      <path d="M9 7.5H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="17.2" r="1.4" fill="currentColor" />
      <circle cx="19" cy="17.2" r="1.4" fill="currentColor" />
      <path
        d="M8 21.5V24.5M20 21.5V24.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * لوگوی واقعی پروژه سروستان (برگرفته از favicon.svg مخزن mjb4khshi/sarvestan)
 */
export function SarvMark({className = 'w-6 h-6'}: IconProps) {
  return (
    <img
      src="./sarv-logo.png"
      alt="سروستان"
      className={`object-contain shrink-0 ${className}`}
    />
  );
}

/**
 * لوگوی رسمی دانشگاه صنعتی خواجه نصیرالدین طوسی (KNTU)
 */
export function KntuLogo({
  className = 'w-7 h-7',
  withFrame = true,
}: IconProps & {withFrame?: boolean}) {
  if (!withFrame) {
    return (
      <img
        src={kntuLogoUrl}
        alt="لوگوی دانشگاه صنعتی خواجه نصیرالدین طوسی"
        className={`object-contain shrink-0 ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-white/95 p-0.5 border border-slate-200/80 shadow-xs shrink-0 ${className}`}
    >
      <img
        src={kntuLogoUrl}
        alt="لوگوی دانشگاه صنعتی خواجه نصیرالدین طوسی"
        className="w-full h-full object-contain"
      />
    </span>
  );
}

/**
 * نشانگر رسمی شماره و رنگ خط متروی تهران (تابلوی ایستگاهی)
 */
export function MetroLineShield({
  lineId,
  showLabel = false,
  compact = false,
}: {
  lineId: MetroLineId;
  showLabel?: boolean;
  compact?: boolean;
}) {
  const line = TEHRAN_METRO_LINES[lineId];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
      <span
        className={`inline-flex items-center justify-center font-bold tabular-nums rounded-md ${
          compact ? 'w-5 h-5 text-[11px]' : 'w-6 h-6 text-xs'
        }`}
        style={{backgroundColor: line.color, color: line.textColor}}
        title={line.name}
      >
        {line.code}
      </span>
      {showLabel && (
        <span className="text-xs font-semibold text-[var(--sarv-text)]">
          خط {line.code}
        </span>
      )}
    </span>
  );
}

/**
 * نشانگر رسمی خط اتوبوس تندرو BRT تهران
 */
export function BrtLineShield({
  lineId,
  showLabel = false,
}: {
  lineId: BrtLineId;
  showLabel?: boolean;
}) {
  const line = TEHRAN_BRT_LINES[lineId];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
      <span
        className="inline-flex items-center justify-center px-1.5 h-6 text-[11px] font-bold tabular-nums rounded-md"
        style={{backgroundColor: line.color, color: line.textColor}}
        title={line.name}
      >
        BRT {line.code}
      </span>
      {showLabel && (
        <span className="text-xs font-medium text-[var(--sarv-text-muted)]">
          {line.routeLabel}
        </span>
      )}
    </span>
  );
}
