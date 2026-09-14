import { motion } from 'framer-motion';
import {
  Wallet,
  Receipt,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import PrinterReceipt from '../components/PrinterReceipt';
import { getViewModel } from '../data/viewModel';
import { toFaDigits } from '../utils/faDigits';

export default function FinanceScreen({ onNavigate }) {
  const vm = getViewModel();
  const FINANCE = vm.finance;
  const STUDENT = vm.student;
  const faNum = (n) => {
    const x = Number(n || 0);
    return Number.isFinite(x) ? x.toLocaleString('fa-IR') : '۰';
  };
  return (
    <div className="px-4 pt-4 space-y-4 mobile-pad-bottom">
      {/* ۱. چاپگر و رسید رسمی مالی سرو — در بالاترین موقعیت با انیمیشن چاپ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="sarv-card p-4 flex flex-col items-center border border-primary/20"
      >
        <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-base-500/30">
          <h3 className="text-[13.5px] font-bold text-base-content flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-primary" />
            رسید رسمی مالی سرو
          </h3>
          <span className="text-[10px] text-neutral px-2 py-0.5 rounded-full bg-base-500/40 font-bold">
            گزارش ۲۵۶۳
          </span>
        </div>

        <PrinterReceipt
          studentName={STUDENT.fullName}
          studentId={STUDENT.studentId}
          major={STUDENT.major}
          billRial={FINANCE.totalBillRial}
          paidRial={FINANCE.totalPaidRial}
          debtToman={FINANCE.debtToman}
          isPaid={FINANCE.isPaid}
          dateLabel={FINANCE.dateLabel}
          timeLabel={FINANCE.timeLabel}
          onOpenBehestan={() => window.open('https://behestan.kntu.ac.ir/', '_blank')}
        />
      </motion.section>

      {/* ۲. کارت وضعیت حساب و بدهی دانشجویی */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="sarv-card p-5 relative overflow-hidden border border-success-soft"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-success text-success-content grid place-items-center shadow-md">
              <Wallet className="w-5 h-5" />
            </span>
            <div>
              <p className="text-[11.5px] text-success font-bold">{FINANCE.balanceLabel}</p>
              <h2 className="text-[26px] font-black text-base-content mt-0.5 font-mono">
                {FINANCE.balance}{' '}
                <span className="text-[12px] text-neutral font-sans font-bold">{FINANCE.currency}</span>
              </h2>
            </div>
          </div>

          <span className="text-[10.5px] font-black px-2.5 py-1 rounded-xl bg-success-soft text-success border border-success-soft">
            وضعیت مالی
          </span>
        </div>

        {/* اطلاعات تفکیکی مالی */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-base-500/30 border border-base-500/50 p-3 text-center">
            <p className="text-[10.5px] text-neutral font-bold">کل صورت‌حساب (ریال)</p>
            <p className="text-[14px] font-black text-base-content mt-1 font-mono">
              {FINANCE.totalBillRial.toLocaleString('fa-IR')}
            </p>
          </div>
          <div className="rounded-2xl bg-success-soft border border-success-soft p-3 text-center">
            <p className="text-[10.5px] text-success font-bold">مجموع واریزی</p>
            <p className="text-[14px] font-black text-success mt-1 font-mono">
              {FINANCE.totalPaidRial.toLocaleString('fa-IR')}
            </p>
          </div>
        </div>

        {/* دکمه پرداخت الکترونیک بهستان */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => window.open('https://behestan.kntu.ac.ir/', '_blank')}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-content font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
          >
            <CreditCard className="w-4 h-4" />
            پرداخت آنلاین در بهستان رسمی
            <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </motion.section>

      {/* ۳. اقلام صورت‌حساب */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[13.5px] font-bold text-base-content flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            اقلام صورت‌حساب نیمسال
          </h3>
          <span className="text-[11px] text-neutral font-mono font-bold">
            {toFaDigits(FINANCE.items.length)} ردیف
          </span>
        </div>

        {FINANCE.items.map((item, i) => (
          <motion.article
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i }}
            className={`sarv-card p-3.5 flex items-center justify-between gap-3 hover:border-primary transition-colors border-r-4 ${
              item.color === 'success'
                ? 'border-r-success'
                : item.color === 'danger'
                ? 'border-r-danger'
                : 'border-r-warn'
            }`}
          >
            <div className="min-w-0 flex items-center gap-3">
              <span
                className={`w-8 h-8 rounded-xl grid place-items-center text-xs font-black shrink-0 ${
                  item.color === 'success'
                    ? 'bg-success text-success-content'
                    : item.color === 'danger'
                    ? 'bg-danger text-danger-content'
                    : 'bg-warn text-warn-content'
                }`}
              >
                {item.color === 'success' || item.status === 'تسویه' || item.status === 'تسویه کامل' ? '✓' : '!'}
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-base-content truncate">{item.title}</p>
                <p
                  className={`text-[11px] mt-0.5 font-bold ${
                    item.color === 'success'
                      ? 'text-success'
                      : item.color === 'danger'
                      ? 'text-danger'
                      : 'text-warn'
                  }`}
                >
                  {item.status}
                </p>
                {item.breakdown?.length ? (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {item.breakdown.map((b) => (
                      <span
                        key={b.label}
                        className="text-[9.5px] text-neutral bg-base-500/30 px-1.5 py-0.5 rounded-md border border-base-500/40 whitespace-nowrap"
                      >
                        {b.label}:{' '}
                        <span className="font-mono text-base-content">{faNum(b.rial)}</span>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <p className="text-[14px] font-black text-base-content font-mono shrink-0">
              {item.amount} <span className="text-[10px] text-neutral font-sans font-normal">تومان</span>
            </p>
          </motion.article>
        ))}
      </section>
    </div>
  );
}
