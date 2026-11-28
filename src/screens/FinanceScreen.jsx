import { useState } from 'react';
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
import { getUniversityOrigin } from '../services/behestan/session';

const FINANCE_CURRENCY_KEY = 'sarvestan_finance_currency';

export default function FinanceScreen({ onNavigate }) {
  const [currencyMode, setCurrencyMode] = useState(() => {
    try {
      return localStorage.getItem(FINANCE_CURRENCY_KEY) || 'toman';
    } catch {
      return 'toman';
    }
  });
  const handleCurrencyChange = (mode) => {
    setCurrencyMode(mode);
    try {
      localStorage.setItem(FINANCE_CURRENCY_KEY, mode);
    } catch {}
  };
  const isRial = currencyMode === 'rial';
  const formatMoney = (tomanVal, rialVal = null) => {
    const num = isRial
      ? (rialVal != null ? Number(rialVal) : Number(tomanVal || 0) * 10)
      : (tomanVal != null ? Number(tomanVal) : Math.round(Number(rialVal || 0) / 10));
    return Number.isFinite(num) ? num.toLocaleString('fa-IR') : '۰';
  };
  const currencyLabel = isRial ? 'ریال' : 'تومان';
  const vm = getViewModel();
  const FINANCE = vm?.finance || {
    isPaid: true,
    debtToman: 0,
    balance: '۰',
    currency: 'تومان',
    totalBillRial: 0,
    totalPaidRial: 0,
    items: [],
  };
  const STUDENT = vm?.student || {
    fullName: '',
    studentId: '',
    major: '',
  };
  const faNum = (n) => {
    const x = Number(n || 0);
    return Number.isFinite(x) ? x.toLocaleString('fa-IR') : '۰';
  };

  const isDebtor =
    !FINANCE.isPaid ||
    ((FINANCE.debtToman || 0) > 0) ||
    (FINANCE.balance && FINANCE.balance !== '۰' && FINANCE.balance !== '0');

  const statusTone = isDebtor
    ? {
        cardBorder: 'border-danger-soft',
        iconBg: 'bg-danger text-danger-content',
        text: 'text-danger',
        label: FINANCE.balanceLabel || 'بدهی جاری',
        badge: 'bg-danger-soft text-danger border-danger-soft',
        badgeText: 'بدهکار',
      }
    : {
        cardBorder: 'border-success-soft',
        iconBg: 'bg-success text-success-content',
        text: 'text-success',
        label: 'تسویه حساب',
        badge: 'bg-success-soft text-success border-success-soft',
        badgeText: 'تسویه کامل',
      };

  return (
    <div className="px-4 pt-4 space-y-4 mobile-pad-bottom">
      {/* ۱. هرم معکوس: کارت وضعیت حساب، مانده کل و سوییچ واحد پول در بالاترین نقطه */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`sarv-card p-5 relative overflow-hidden border ${statusTone.cardBorder}`}
      >
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-base-500/25">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl border ${statusTone.badge}`}>
              {statusTone.badgeText}
            </span>
            <span className="text-[11.5px] font-bold text-neutral">{statusTone.label}</span>
          </div>
          <div className="sarv-seg !p-0.5 text-[10.5px]">
            <button
              type="button"
              onClick={() => handleCurrencyChange('toman')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition ${
                !isRial ? 'bg-primary text-primary-content' : 'text-neutral'
              }`}
            >
              تومان
            </button>
            <button
              type="button"
              onClick={() => handleCurrencyChange('rial')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition ${
                isRial ? 'bg-primary text-primary-content' : 'text-neutral'
              }`}
            >
              ریال
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] text-neutral block">مانده / تراز قابل پرداخت</span>
            <p className={`text-2xl font-black font-mono mt-0.5 sarv-privacy ${statusTone.text}`}>
              {formatMoney(FINANCE.debtToman)} <span className="text-xs font-bold">{currencyLabel}</span>
            </p>
          </div>
          <div className={`w-11 h-11 rounded-2xl grid place-items-center ${statusTone.iconBg}`}>
            {isDebtor ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-base-500/25 text-xs">
          <div className="p-2.5 rounded-xl bg-base-500/15">
            <span className="text-[10.5px] text-neutral block">کل بدهی / شهریه</span>
            <span className="font-black font-mono text-base-content sarv-privacy">
              {formatMoney(null, FINANCE.totalBillRial)} {currencyLabel}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-base-500/15">
            <span className="text-[10.5px] text-neutral block">کل پرداخت‌شده</span>
            <span className="font-black font-mono text-success sarv-privacy">
              {formatMoney(null, FINANCE.totalPaidRial)} {currencyLabel}
            </span>
          </div>
        </div>
      </motion.section>

      {/* ۲. چاپگر و رسید رسمی مالی سرو */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
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
          onOpenBehestan={() => window.open(getUniversityOrigin() + '/', '_blank')}
        />
      </motion.section>

      {/* ۳. دکمه پرداخت و جزئیات اقلام */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="sarv-card p-4 space-y-3 border border-base-500/30"
      >
        {/* دکمه پرداخت الکترونیک بهستان */}
        <div>
          <button
            type="button"
            onClick={() => window.open(getUniversityOrigin() + '/', '_blank')}
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
            {toFaDigits((FINANCE.items || []).length)} ردیف
          </span>
        </div>

        {(FINANCE.items || []).map((item, i) => (
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
