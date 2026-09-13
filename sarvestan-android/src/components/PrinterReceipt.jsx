import { motion } from 'framer-motion';
import { Printer, ExternalLink, AlertTriangle } from 'lucide-react';

const fmt = (v) => Number(v || 0).toLocaleString('fa-IR');

/** رسید حرارتی — طراحی فلت، بدون گرادیان و کاملاً مطابق استایل رسمی سرو */
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
  onOpenBehestan,
}) {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative z-10 w-full max-w-[300px] mx-auto">
        <div className="rounded-t-2xl border border-base-500/60 border-b-0 px-5 pt-3.5 pb-2.5 bg-base-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-primary" />
              <span className="text-[11px] font-bold text-base-content">رسیدگر مالی سرو</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[9px] text-success font-mono font-bold">READY</span>
            </div>
          </div>

          {/* شیار خروج کاغذ رسید — با نور نشانگر چاپ */}
          <div className="relative h-2 rounded-md mx-1 bg-base-500/80 border border-base-500 shadow-inner overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: 1, duration: 0.9, ease: 'easeInOut' }}
              className="absolute inset-y-0 w-8 bg-primary/40 blur-xs"
            />
          </div>
        </div>
      </div>

      <div className="relative w-full max-w-[300px] mx-auto overflow-hidden">
        {/* انیمیشن رول‌شدن و بیرون‌آمدن کاغذ از دستگاه چاپ */}
        <motion.div
          initial={{ y: -60, scaleY: 0.3, opacity: 0 }}
          animate={{ y: 0, scaleY: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 130, damping: 18, delay: 0.1 }}
          style={{ transformOrigin: 'top center' }}
          className="print-receipt relative border border-dashed border-base-500/60 bg-base px-4 py-3.5 space-y-2 text-right rounded-b-2xl shadow-md"
        >
          <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-base-500/50">
            <div className="text-[12px] font-bold text-base-content">دانشگاه صنعتی خواجه نصیر طوسی</div>
            <div className="text-[10px] text-neutral font-medium">گواهی وضعیت حسابداری و شهریه</div>
            <div className="text-[9px] text-neutral font-mono mt-0.5">
              {dateLabel} · {timeLabel}
            </div>
          </div>

          <div className="space-y-1 text-[11px] py-1 border-b border-dashed border-base-500/50">
            <div className="flex justify-between">
              <span className="text-neutral">دانشجو:</span>
              <span className="font-bold text-base-content">{studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral">شماره دانشجویی:</span>
              <span className="font-mono font-bold text-base-content">{studentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral">رشته:</span>
              <span className="text-base-content truncate max-w-[170px]">{major}</span>
            </div>
          </div>

          <div className="space-y-1 text-[11px] py-1 border-b border-dashed border-base-500/50">
            <div className="flex justify-between">
              <span className="text-neutral">کل صورت‌حساب:</span>
              <span className="font-mono text-base-content">{fmt(billRial)} ریال</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral">پرداخت‌شده:</span>
              <span className="font-mono text-success font-bold">{fmt(paidRial)} ریال</span>
            </div>
          </div>

          <div className="flex justify-between items-center py-1 text-[12px] font-bold">
            <span>مانده بدهی:</span>
            <span className="font-mono text-warn text-[13px]">
              {fmt(debtToman)} تومان
            </span>
          </div>

          <div className="text-center py-1 bg-base-500/20 rounded-lg">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isPaid ? 'text-success bg-success-soft' : 'text-warn bg-warn-soft'
              }`}
            >
              {isPaid ? 'تسویه کامل' : 'در انتظار تسویه در بهستان'}
            </span>
          </div>

          <p className="text-[8.5px] text-neutral text-center leading-relaxed pt-1">
            صرفاً جهت اطلاع دانشجو · فاقد ارزش به عنوان رسید بانکی رسمی
          </p>
        </motion.div>
      </div>

      <div className="w-full max-w-[320px] mx-auto mt-4 space-y-2">
        <div className="p-3 rounded-xl bg-warn-soft border border-warn-soft flex items-start gap-2 text-[11px] text-warn leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            پرداخت شهریه صرفاً در <strong>پرتال بهستان</strong> انجام می‌شود.
          </span>
        </div>
        <button
          type="button"
          className="w-full py-2.5 rounded-xl bg-primary text-primary-content text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
          onClick={onOpenBehestan}
        >
          <ExternalLink className="w-4 h-4" />
          ورود به درگاه پرداخت بهستان
        </button>
      </div>
    </div>
  );
}
