import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, ExternalLink, AlertTriangle } from 'lucide-react';
import SarvButton from './sarv/SarvButton';
import SarvBadge from './sarv/SarvBadge';
import { toFaDigits } from '../utils/faDigits';

/**
 * چاپگر حرارتی: کاغذ مرحله‌به‌مرحله از شیار بیرون می‌آید
 */
export default function PrinterReceipt({
  studentName,
  studentId,
  major,
  billRial,
  paidRial,
  debtToman,
  isPaid,
  dateLabel,
  timeLabel,
  onOpenBehestan
}) {
  const fmt = (v) => toFaDigits(Number(v || 0).toLocaleString('fa-IR'));
  const [printStep, setPrintStep] = useState(0); // 0 idle → printing → done

  useEffect(() => {
    // کاغذ آرام‌آرام بیرون می‌آید
    const t1 = setTimeout(() => setPrintStep(1), 200);
    const t2 = setTimeout(() => setPrintStep(2), 700);
    const t3 = setTimeout(() => setPrintStep(3), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const isPrinting = printStep < 3;

  return (
    <div className="flex flex-col items-center w-full">
      {/* بدنه پرینتر */}
      <div className="relative z-10 w-full max-w-[300px] mx-auto">
        <div
          className="rounded-t-[var(--radius-button,1rem)] border border-base-500/50 border-b-0 px-5 pt-3.5 pb-2 shadow-md"
          style={{
            background:
              'linear-gradient(180deg, color-mix(in oklab, var(--theme-color-base-500) 55%, var(--theme-color-base)) 0%, color-mix(in oklab, var(--theme-color-base-500) 30%, var(--theme-color-base)) 100%)'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <motion.div
                animate={isPrinting ? { rotate: [0, -8, 8, 0] } : { rotate: 0 }}
                transition={{ repeat: isPrinting ? Infinity : 0, duration: 0.55 }}
              >
                <Printer className="w-4 h-4 text-primary" />
              </motion.div>
              <span className="text-[10px] font-semibold text-base-content">رسیدگر سرو</span>
            </div>
            <div className="flex items-center gap-1.5">
              <motion.span
                className="w-1.5 h-1.5 rounded-full"
                animate={{
                  backgroundColor: isPrinting
                    ? ['var(--theme-color-warn)', 'var(--theme-color-success)', 'var(--theme-color-warn)']
                    : 'var(--theme-color-success)'
                }}
                transition={{ repeat: isPrinting ? Infinity : 0, duration: 0.8 }}
              />
              <span className="text-[9px] text-neutral font-mono">
                {isPrinting ? 'PRINT' : 'READY'}
              </span>
            </div>
          </div>

          {/* شیار خروج + انیمیشن ساطع شدن نور پرینت */}
          <div className="relative h-2.5 rounded-[3px] mx-1 mb-0 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, var(--theme-color-base) 0%, color-mix(in oklab, var(--theme-color-base-500) 80%, #000) 100%)',
                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5)'
              }}
            />
            <motion.div
              className="absolute top-0 bottom-0 w-8"
              style={{
                background:
                  'linear-gradient(90deg, transparent, color-mix(in oklab, var(--theme-color-primary) 55%, transparent), transparent)'
              }}
              animate={isPrinting ? { x: ['-40%', '280%'] } : { x: '-40%', opacity: 0 }}
              transition={{ repeat: isPrinting ? Infinity : 0, duration: 0.7, ease: 'linear' }}
            />
          </div>

          <div className="flex justify-center mt-2.5">
            <SarvButton
              variant="primary"
              styleType={isPrinting ? 'solid' : 'flat'}
              size="sm"
              className="!py-1 !px-3 text-[11px]"
              onClick={() => {
                setPrintStep(0);
                setTimeout(() => setPrintStep(1), 100);
                setTimeout(() => setPrintStep(2), 650);
                setTimeout(() => setPrintStep(3), 1500);
                setTimeout(() => window.print(), 1800);
              }}
              disabled={isPrinting}
            >
              <Printer className="w-3 h-3 ml-1" />
              {isPrinting ? 'در حال چاپ…' : 'چاپ رسید'}
            </SarvButton>
          </div>
        </div>
      </div>

      {/* کاغذ */}
      <div className="relative w-full max-w-[300px] mx-auto">
        <AnimatePresence>
          {printStep >= 1 && (
            <motion.div
              key="paper"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 1.45, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              {/* لبه بالای پارگی */}
              <div
                className="h-1.5 w-full"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, var(--theme-color-base) 0 5px, color-mix(in oklab, var(--theme-color-base-500) 40%, var(--theme-color-base)) 5px 10px)'
                }}
              />

              <motion.div
                initial={{ y: -40 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.25, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="print-receipt relative border-x border-b border-dashed border-base-500/45 px-4 py-3 space-y-2 text-right"
                style={{ borderRadius: '0 0 var(--radius-button,0.75rem) var(--radius-button,0.75rem)' }}
              >
                {/* خط پرینت متحرک روی کاغذ هنگام خروج */}
                {printStep < 3 && (
                  <motion.div
                    className="absolute left-0 right-0 h-[2px] pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, var(--theme-color-primary), transparent)'
                    }}
                    initial={{ top: 0, opacity: 0.9 }}
                    animate={{ top: '100%', opacity: 0 }}
                    transition={{ duration: 1.3, delay: 0.3, ease: 'linear' }}
                  />
                )}

                <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-base-500/40">
                  <div className="text-[11px] font-bold">سروستان</div>
                  <div className="text-[10px] text-neutral">گواهی وضعیت مالی</div>
                  <div className="text-[9px] text-neutral/85 font-mono">
                    {dateLabel} · {timeLabel}
                  </div>
                </div>

                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral">نام</span>
                    <span className="font-semibold text-base-content truncate max-w-[150px]">
                      {studentName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral">دانشجو</span>
                    <span className="font-mono font-semibold text-base-content">{studentId}</span>
                  </div>
                  {major && (
                    <div className="flex justify-between gap-2">
                      <span className="text-neutral">رشته</span>
                      <span className="text-base-content truncate max-w-[120px]">{major}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral">صورت‌حساب</span>
                    <span className="font-mono text-base-content">{fmt(billRial)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral">پرداخت</span>
                    <span className="font-mono text-success">{fmt(paidRial)}</span>
                  </div>
                  <div className="flex justify-between gap-2 pt-1.5 border-t border-dashed border-base-500/40">
                    <span className="font-bold text-base-content">مانده</span>
                    <span className={`font-mono font-bold ${isPaid ? 'text-success' : 'text-danger'}`}>
                      {fmt(debtToman)} تومان
                    </span>
                  </div>
                </div>

                <div className="flex justify-center pt-0.5">
                  <SarvBadge variant={isPaid ? 'success' : 'warn'} size="sm">
                    {isPaid ? 'تسویه کامل' : 'در انتظار تسویه'}
                  </SarvBadge>
                </div>

                <div className="pt-2 flex flex-col items-center gap-1 border-t border-dashed border-base-500/40">
                  <div
                    className="h-7 w-3/4 opacity-60"
                    style={{
                      background:
                        'repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 4px, currentColor 4px 5px, transparent 5px 9px)'
                    }}
                  />
                  <span className="text-[8px] font-mono text-neutral tracking-wider">
                    {toFaDigits(studentId || '')}-SARVESTAN-2563
                  </span>
                </div>

                <p className="text-[8px] text-neutral/80 text-center leading-relaxed">
                  فقط اطلاع/حسابداری · سند پرداخت بانکی نیست
                </p>
              </motion.div>

              {/* لبه دندانه‌ای پایین */}
              <div
                className="h-2.5 w-full -mt-px"
                style={{
                  background:
                    'linear-gradient(-45deg, var(--theme-color-base) 25%, transparent 25%), linear-gradient(45deg, var(--theme-color-base) 25%, transparent 25%)',
                  backgroundSize: '8px 8px'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-[320px] mx-auto mt-4 space-y-2.5">
        <div className="p-3 rounded-[var(--radius-button,0.75rem)] bg-warn/10 border border-warn/25 flex items-start gap-2 text-[11px] text-warn leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            پرداخت صرفاً در <strong>بهستان رسمی</strong>. این رسید فقط وضعیت را نشان می‌دهد.
          </span>
        </div>
        <SarvButton variant="primary" className="w-full" onClick={onOpenBehestan}>
          <ExternalLink className="w-4 h-4 ml-1.5" />
          رفتن به بهستان برای پرداخت
        </SarvButton>
      </div>
    </div>
  );
}
