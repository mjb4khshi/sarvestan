import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { toFaDigits } from '../utils/faDigits';

/**
 * نمودار روند معدل ترم‌به‌ترم (GPA Trend Graph)
 * طراحی مینیمال و روان با SVG، گرادیان اختصاصی تم سرو و نقاط تعاملی
 */
export default function GpaTrendGraph({ terms = [], selectedTermId, onSelectTerm }) {
  // استخراج ترم‌های دارای معدل معتبر (مرتب‌شده از قدیم به جدید برای روند زمانی)
  const validTerms = useMemo(() => {
    return terms
      .map((t, originalIndex) => {
        const raw = String(t.gpa || '')
          .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
          .replace(/٫/g, '.')
          .replace(/,/g, '.')
          .trim();
        const num = parseFloat(raw);
        return {
          ...t,
          originalIndex,
          numGpa: Number.isFinite(num) && num > 0 ? num : null,
        };
      })
      .filter((t) => t.numGpa !== null)
      .reverse(); // معکوس کردن تا از اولین ترم به آخرین ترم رسم شود
  }, [terms]);

  if (validTerms.length < 2) {
    return null; // اگر کمتر از ۲ ترم دارای معدل باشد، نمودار روند لزومی ندارد
  }

  // ابعاد و مقیاس‌های نمودار SVG
  const width = 340;
  const height = 110;
  const paddingX = 24;
  const paddingTop = 22;
  const paddingBottom = 26;

  const minGpa = Math.max(0, Math.floor(Math.min(...validTerms.map((t) => t.numGpa)) - 1));
  const maxGpa = Math.min(20, Math.ceil(Math.max(...validTerms.map((t) => t.numGpa)) + 1));
  const gpaRange = Math.max(maxGpa - minGpa, 2);

  const getX = (index) => {
    if (validTerms.length === 1) return width / 2;
    return paddingX + (index / (validTerms.length - 1)) * (width - 2 * paddingX);
  };

  const getY = (gpa) => {
    const norm = (gpa - minGpa) / gpaRange;
    return height - paddingBottom - norm * (height - paddingTop - paddingBottom);
  };

  // تولید مسیر هموار (Smooth Cubic Bezier curve)
  const points = validTerms.map((t, idx) => ({
    x: getX(idx),
    y: getY(t.numGpa),
    ...t,
  }));

  const buildPath = () => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const linePath = buildPath();
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const bottomY = height - paddingBottom + 6;
  const areaPath = `${linePath} L ${lastPoint.x} ${bottomY} L ${firstPoint.x} ${bottomY} Z`;

  // محاسبه تغییرات کلی معدل (رشد یا افت)
  const firstGpa = validTerms[0].numGpa;
  const latestGpa = validTerms[validTerms.length - 1].numGpa;
  const diff = Math.round((latestGpa - firstGpa) * 100) / 100;

  return (
    <div className="sarv-card p-4 space-y-3 border border-base-500/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-primary-soft text-primary grid place-items-center">
            <TrendingUp className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-[13px] font-bold text-base-content">روند پیشرفت معدل</h3>
            <p className="text-[10px] text-neutral">تغییرات ترم‌به‌ترم در طول دوران تحصیل</p>
          </div>
        </div>

        <span
          className={`text-[10.5px] font-bold px-2 py-0.5 rounded-lg font-mono ${
            diff > 0
              ? 'bg-success-soft text-success'
              : diff < 0
              ? 'bg-danger-soft text-danger'
              : 'bg-base-500/40 text-neutral'
          }`}
        >
          {diff > 0 ? `+${toFaDigits(diff)} رشد` : diff < 0 ? `${toFaDigits(diff)} افت` : 'بدون تغییر'}
        </span>
      </div>

      {/* بستر نمودار تعاملی SVG */}
      <div className="w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id="gpaTrendGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--theme-color-primary, #0066a4)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--theme-color-primary, #0066a4)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* خطوط راهنمای افقی */}
          <line
            x1={paddingX}
            y1={getY(minGpa + gpaRange / 2)}
            x2={width - paddingX}
            y2={getY(minGpa + gpaRange / 2)}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeDasharray="4 4"
          />

          {/* ناحیه سایه زیر نمودار */}
          <motion.path
            d={areaPath}
            fill="url(#gpaTrendGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />

          {/* خط هموار روند */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="var(--theme-color-primary, #0066a4)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />

          {/* نقاط عطف ترم‌ها با عدد نمره و نشانگر انتخابی */}
          {points.map((p) => {
            const isSelected = selectedTermId === p.id;
            return (
              <g
                key={p.id}
                className="cursor-pointer transition-transform"
                onClick={() => onSelectTerm?.(p.id)}
              >
                {/* دایره بیرونی فعال */}
                {isSelected && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="9"
                    fill="var(--theme-color-primary, #0066a4)"
                    fillOpacity="0.2"
                  />
                )}

                {/* دایره نقطه عطف */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? '5' : '3.8'}
                  fill={isSelected ? 'var(--theme-color-primary, #0066a4)' : 'var(--theme-color-base, #000)'}
                  stroke="var(--theme-color-primary, #0066a4)"
                  strokeWidth="2"
                />

                {/* برچسب عدد معدل بالای نقطه */}
                <text
                  x={p.x}
                  y={p.y - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isSelected ? '900' : '700'}
                  fontFamily="'Arad', var(--font-arad), system-ui, sans-serif"
                  fill={isSelected ? 'var(--theme-color-primary, #0066a4)' : 'var(--theme-color-base-content, #fff)'}
                >
                  {toFaDigits(p.numGpa.toFixed(2))}
                </text>

                {/* برچسب نام ترم در پایین */}
                <text
                  x={p.x}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  fontFamily="'Arad', var(--font-arad), system-ui, sans-serif"
                  fill={isSelected ? 'var(--theme-color-primary, #0066a4)' : 'var(--theme-color-neutral, #94a3b8)'}
                >
                  {toFaDigits(p.shortName || p.name?.slice(0, 8))}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
