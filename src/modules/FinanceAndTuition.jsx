import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ShieldCheck,
  Receipt,
  Printer,
  ExternalLink,
  Building2,
  Calendar
} from 'lucide-react';
import SarvButton from '../components/sarv/SarvButton';
import SarvBadge from '../components/sarv/SarvBadge';
import SarvTabs from '../components/sarv/SarvTabs';
import PrinterReceipt from '../components/PrinterReceipt';
import {
  REAL_FINANCIAL_REPORT_2563,
  REPORT_1965_PAYMENTS,
  BEHESTAN_PROFILE,
  subscribeToData
} from '../services/behestanData';
import liveSync from '../services/behestanLiveSync';
import { toFaDigits } from '../utils/faDigits';

export default function FinanceAndTuition() {
  const [activeTab, setActiveTab] = useState('current');
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeToData(() => setTick(t => t + 1));
    const unsubSync = liveSync?.subscribe?.(() => setTick(t => t + 1));
    return () => {
      unsub();
      if (unsubSync) unsubSync();
    };
  }, []);

  const n = (v) => {
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string') {
      const parsed = Number(v.replace(/[^\d.-]/g, ''));
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const fmt = (v) => toFaDigits(n(v).toLocaleString('fa-IR'));

  const totalDebtRial = n(REAL_FINANCIAL_REPORT_2563.totalDebtRial);
  const totalDebtToman = Math.floor(totalDebtRial / 10);

  const termsList = Array.isArray(REAL_FINANCIAL_REPORT_2563.termsSummary)
    ? REAL_FINANCIAL_REPORT_2563.termsSummary
    : [];

  const rawTerm = termsList.length > 0 ? termsList[0] : null;

  const currentTermFinancial = {
    fixedTuitionRial:    n(rawTerm?.fixedTuitionRial),
    variableTuitionRial: n(rawTerm?.variableTuitionRial),
    insuranceRial:       n(rawTerm?.insuranceRial),
    totalBillRial:       n(rawTerm?.totalBillRial),
    totalPaidRial:       n(rawTerm?.totalPaidRial),
    debtRial:            n(rawTerm?.debtRial || totalDebtRial),
    debtToman:           Math.floor(n(rawTerm?.debtRial || totalDebtRial) / 10),
    status:              rawTerm?.status || (totalDebtRial > 0 ? 'بدهکار' : 'تسویه کامل')
  };

  const receiptDate = new Date().toLocaleDateString('fa-IR');
  const receiptTime = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28 }}
      className="space-y-6 text-right"
    >
      {/* Header */}
      <div className="sarv-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <SarvBadge variant="primary" soft size="sm">امور مالی</SarvBadge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-base-content flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-primary" />
              امور مالی و شهریه
            </h2>
            <p className="text-xs sm:text-sm text-neutral mt-1">
              ریزتراز نیم‌سال‌ها، شهریه ثابت/متغیر و پیگیری وضعیت تسویه از بهستان
            </p>
          </div>

          <div className={`sarv-chip p-4 flex items-center gap-3 ${totalDebtRial > 0 ? 'sarv-chip-danger' : 'sarv-chip-success'}`}>
            <div className={`p-3 rounded-[var(--radius-button,0.75rem)] ${totalDebtRial > 0 ? 'text-danger' : 'text-success'}`}>
              {totalDebtRial > 0 ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div>
              <div className="text-[11px] text-neutral font-semibold">مانده قابل پرداخت</div>
              <div className={`text-xl font-bold ${totalDebtRial > 0 ? 'text-danger' : 'text-success'}`}>
                {fmt(totalDebtRial)}
                <span className="text-xs font-normal mr-1 text-neutral">ریال</span>
              </div>
              <div className="text-[10px] text-neutral mt-0.5">
                {totalDebtRial > 0 ? `معادل ${fmt(totalDebtToman)} تومان` : 'حساب تسویه است'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <SarvTabs
        layoutId="financeTabs"
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { id: 'current', label: 'ترم جاری', icon: Receipt },
          { id: 'ledger', label: 'ریزتراز ۲۵۶۳', icon: FileSpreadsheet }
        ]}
      />

      {/* Tab 1: Current Semester Financial Breakdown */}
      {activeTab === 'current' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Detailed Breakdown Card */}
          <div className="lg:col-span-2 sarv-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-base-500 pb-4">
              <h3 className="text-base font-bold text-base-content flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                تفکیک هزینه‌های نیم‌سال تحصیلی
              </h3>
              <SarvBadge variant={totalDebtRial > 0 ? 'warn' : 'success'} soft={totalDebtRial === 0}>
                {totalDebtRial > 0 ? 'در انتظار تسویه' : 'تسویه کامل'}
              </SarvBadge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-base-500/30 border border-base-500">
                <span className="text-xs text-neutral block mb-1">شهریه ثابت مصوب هیات امنا</span>
                <span className="text-lg font-bold text-base-content">
                  {fmt(currentTermFinancial.fixedTuitionRial)}
                  <span className="text-xs font-normal text-neutral mr-1">ریال</span>
                </span>
              </div>

              <div className="p-4 rounded-xl bg-base-500/30 border border-base-500">
                <span className="text-xs text-neutral block mb-1">شهریه متغیر (واحدهای تخصصی و آزمایشگاهی)</span>
                <span className="text-lg font-bold text-base-content">
                  {fmt(currentTermFinancial.variableTuitionRial)}
                  <span className="text-xs font-normal text-neutral mr-1">ریال</span>
                </span>
              </div>

              <div className="p-4 rounded-xl bg-base-500/30 border border-base-500">
                <span className="text-xs text-neutral block mb-1">خدمات آموزشی و بیمه حوادث دانشجویی</span>
                <span className="text-lg font-bold text-base-content">
                  {fmt(currentTermFinancial.insuranceRial)}
                  <span className="text-xs font-normal text-neutral mr-1">ریال</span>
                </span>
              </div>

              <div className="p-4 rounded-xl bg-base-500/30 border border-base-500">
                <span className="text-xs text-neutral block mb-1">کل صورت‌حساب صادره ترم</span>
                <span className="text-lg font-black text-primary">
                  {fmt(currentTermFinancial.totalBillRial)}
                  <span className="text-xs font-normal text-neutral mr-1">ریال</span>
                </span>
              </div>
            </div>

            {/* Payment Progress Bar */}
            <div className="p-4 rounded-xl bg-base-500/20 border border-base-500 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-base-content">نسبت تسویه حساب شهریه:</span>
                <span className="text-neutral">
                  پرداخت شده: {fmt(currentTermFinancial.totalPaidRial)} ریال
                </span>
              </div>
              <div className="w-full h-3 bg-base-500/60 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-success transition-all"
                  style={{
                    width: currentTermFinancial.totalBillRial > 0
                      ? `${Math.min(100, (currentTermFinancial.totalPaidRial / currentTermFinancial.totalBillRial) * 100)}%`
                      : '100%'
                  }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral pt-1">
                <span className="text-success flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تسویه شده
                </span>
                <span className={totalDebtRial > 0 ? "text-danger flex items-center gap-1 font-bold" : "text-success flex items-center gap-1"}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {totalDebtRial > 0 ? `مانده بدهی: ${fmt(totalDebtToman)} تومان` : 'بدون بدهی معوق (تسویه کامل)'}
                </span>
              </div>
            </div>

            {/* Important Notice */}
            <div className="p-4 rounded-xl bg-warn/10 border border-warn/25 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warn shrink-0 mt-0.5" />
              <div className="text-xs text-base-content leading-relaxed">
                <strong className="block mb-1 text-warn">تذکر مهم آموزش کل دانشگاه صنعتی خواجه نصیر:</strong>
                طبق آیین‌نامه مالی بهستان، دریافت کارت ورود به جلسه امتحانات پایان‌ترم (گزارش ۴۲۸) و ثبت اعتراض به نمرات، منوط به تسویه کامل مانده بدهی شهریه می‌باشد.
              </div>
            </div>
          </div>

          {/* Thermal Printer + Receipt */}
          <div className="sarv-card p-5 flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-base-500/30">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                چاپگر رسید مالی
              </h3>
              <SarvBadge variant="neutral" outline size="sm">فقط اطلاع</SarvBadge>
            </div>

            <PrinterReceipt
              studentName={BEHESTAN_PROFILE.fullName}
              studentId={toFaDigits(BEHESTAN_PROFILE.studentId)}
              major={BEHESTAN_PROFILE.major}
              billRial={currentTermFinancial.totalBillRial}
              paidRial={currentTermFinancial.totalPaidRial}
              debtToman={totalDebtToman}
              isPaid={totalDebtRial === 0}
              dateLabel={receiptDate}
              timeLabel={receiptTime}
              onOpenBehestan={() => window.open('https://behestan.kntu.ac.ir/', '_blank')}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Ledger History (Report 2563) */}
      {activeTab === 'ledger' && (
        <div className="sarv-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-500 pb-4">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                سوابق تراز مالی و پرداختی‌های ترم‌های تحصیلی (گزارش ۲۵۶۳)
              </h3>
              <p className="text-xs text-neutral mt-0.5">
                ریز تراکنش‌ها، پرداخت‌های موفق و تاییدیه امور مالی دانشگاه
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-base-500 text-neutral font-bold">
                  <th className="py-3 px-3">ردیف</th>
                  <th className="py-3 px-3">کد ترم</th>
                  <th className="py-3 px-3">عنوان نیم‌سال</th>
                  <th className="py-3 px-3 text-left">شهریه ثابت (ریال)</th>
                  <th className="py-3 px-3 text-left">شهریه متغیر (ریال)</th>
                  <th className="py-3 px-3 text-left">جمع کل (ریال)</th>
                  <th className="py-3 px-3 text-left">پرداختی (ریال)</th>
                  <th className="py-3 px-3 text-left">مانده حساب</th>
                  <th className="py-3 px-3 text-center">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-500/50">
                {termsList.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-neutral text-xs">
                      اطلاعات ریزتراز مالی به صورت زنده پس از اتصال به نشست بهستان فراخوانی خواهد شد.
                    </td>
                  </tr>
                ) : (
                  termsList.map((term, idx) => (
                    <tr key={term.termId || idx} className="hover:bg-base-500/20 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-neutral font-mono">{toFaDigits(idx + 1)}</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-primary">{toFaDigits(term.termId)}</td>
                      <td className="py-3.5 px-3 font-medium text-base-content">{term.termTitle}</td>
                      <td className="py-3.5 px-3 text-left font-mono">{fmt(term.fixedTuitionRial)}</td>
                      <td className="py-3.5 px-3 text-left font-mono">{fmt(term.variableTuitionRial)}</td>
                      <td className="py-3.5 px-3 text-left font-mono font-bold">{fmt(term.totalBillRial)}</td>
                      <td className="py-3.5 px-3 text-left font-mono text-success font-bold">{fmt(term.totalPaidRial)}</td>
                      <td className="py-3.5 px-3 text-left font-mono font-bold">
                        {n(term.debtRial) > 0 ? (
                          <span className="text-danger">{fmt(term.debtRial)} بدهکار</span>
                        ) : (
                          <span className="text-success">۰</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <SarvBadge variant={n(term.debtRial) > 0 ? 'warn' : 'success'} soft size="sm">
                          {n(term.debtRial) > 0 ? (term.status || 'بدهکار') : 'تسویه کامل'}
                        </SarvBadge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Report 1965 Payment Records */}
          <div className="pt-4 border-t border-base-500 space-y-3">
            <h4 className="text-sm font-bold text-base-content flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              رسید پرداخت‌های الکترونیکی ثبت‌شده (فرم ۲۷۵۷۰)
            </h4>
            {(!REPORT_1965_PAYMENTS.rows || REPORT_1965_PAYMENTS.rows.length === 0) ? (
              <div className="p-6 rounded-xl bg-base-500/20 border border-base-500/40 text-center text-neutral text-xs">
                رسید پرداخت‌های ثبت‌شده پس از همگام‌سازی با سامانه بهستان در این قسمت نمایش می‌یابد.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {REPORT_1965_PAYMENTS.rows.map((r, idx) => (
                  <div key={r.radif || idx} className="p-4 rounded-xl bg-base-500/20 border border-base-500 space-y-2">
                    <div className="flex items-center justify-between">
                      <SarvBadge variant={n(r.debitRial) > 0 ? 'warn' : 'success'} soft size="sm">
                        {r.status || 'موفق'}
                      </SarvBadge>
                      <span className="text-[11px] text-neutral font-mono">{toFaDigits(r.payDate || 'ـ')}</span>
                    </div>
                    <div className="text-xs font-bold text-base-content line-clamp-2">
                      {r.step || 'پرداخت شهریه دانشجو'}
                    </div>
                    <div className="text-xs text-neutral flex justify-between pt-1 border-t border-base-500/50">
                      <span>مبلغ پرداخت شده:</span>
                      <span className="font-mono font-bold text-base-content">
                        {fmt(Math.floor(n(r.paidRial) / 10))} تومان
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </motion.div>
  );
}
