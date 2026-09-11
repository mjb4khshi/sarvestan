import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  ExternalLink,
  CheckCircle,
  Sparkles,
  Info,
  Building
} from 'lucide-react';
import SarvButton from './sarv/SarvButton';
import SarvBadge from './sarv/SarvBadge';
import { BEHESTAN_PROFILE, REAL_FINANCIAL_REPORT_2563, REPORT_1965_PAYMENTS } from '../services/behestanData';
import liveSync from '../services/behestanLiveSync';

export default function NativeBehestanPaymentView({ onBackToSarvestan, initialAmount = '0' }) {
  const [payAmount, setPayAmount] = useState(initialAmount);
  const [selectedBank, setSelectedBank] = useState('saman');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleProceedToBank = () => {
    setIsRedirecting(true);
    // فراخوانی رله مستقیم به سرور بهستان جهت ایجاد توکن و هدایت به شاپرک
    liveSync.switchToNativeBehestanPayment(payAmount);
  };

  return (
    <div className="min-h-screen bg-[#e8ecf1] text-[#111111] font-sans text-right select-text p-4 sm:p-6 space-y-4">
      
      {/* Top Floating Bridge Header: Return to Sarvestan */}
      <div className="max-w-4xl mx-auto p-3.5 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-800 to-blue-900 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-blue-400/30">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <span className="font-bold">نمای امن و بومی سامانه بهستان (فرم ۲۷۵۷۰)</span>
            <span className="opacity-80 block text-[11px]">
              جهت پیشگیری از تداخل با توکن‌های امنیتی شاپرک، پرداخت در بستر رسمی بهستان انجام می‌شود.
            </span>
          </div>
        </div>

        <button
          onClick={onBackToSarvestan}
          className="px-4 py-2 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 ml-1" />
          بازگشت به داشبورد مدرن سروستان
        </button>
      </div>

      {/* Authentic Behestan Form Window Frame */}
      <div className="max-w-4xl mx-auto bg-white border border-[#99b4d1] shadow-lg rounded-sm overflow-hidden text-xs">
        
        {/* Behestan Window Titlebar */}
        <div className="bg-[#b9cde3] border-b border-[#7f9db9] p-2 flex items-center justify-between font-bold text-[#002255]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] bg-[#dbe8f5] px-1.5 py-0.5 border border-[#9bb5cf]">
              فرم ۲۷۵۷۰
            </span>
            <span>سامانه جامع دانشگاهی بهستان - پرداخت الکترونیکی شهریه و بدهی دانشجو</span>
          </div>
          <span className="text-[11px] text-[#446688]">دانشگاه صنعتی خواجه نصیرالدین طوسی</span>
        </div>

        {/* Student Identification Bar */}
        <div className="p-3 bg-[#f3f7fb] border-b border-[#d0dbe5] grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
          <div>
            <span className="text-[#555555]">شماره دانشجو: </span>
            <span className="font-bold font-mono text-[#003366]">{BEHESTAN_PROFILE.studentId}</span>
          </div>
          <div>
            <span className="text-[#555555]">نام و نام خانوادگی: </span>
            <span className="font-bold text-[#003366]">{BEHESTAN_PROFILE.fullName}</span>
          </div>
          <div>
            <span className="text-[#555555]">دانشکده: </span>
            <span className="font-bold text-[#003366]">{BEHESTAN_PROFILE.faculty}</span>
          </div>
          <div>
            <span className="text-[#555555]">مقطع / دوره: </span>
            <span className="font-bold text-[#003366]">{BEHESTAN_PROFILE.degree} (نوبت دوم)</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-4">
          
          {/* Official Notice */}
          <div className="p-3 bg-[#fffde7] border border-[#fff59d] text-[#6d4c41] rounded text-[11px] flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 text-[#fbc02d] shrink-0" />
            <div>
              <strong>تذکر مهم امور مالی دانشگاه: </strong>
              پرداخت شهریه صرفاً از طریق درگاه‌های متصل به شبکه شاپرک مجاز بوده و پس از تکمیل پرداخت، شناسه رهگیری بانکی به صورت خودکار در کارنامه مالی و فرم ۲۷۵۷۰ ثبت خواهد گردید.
            </div>
          </div>

          {/* Tuition Breakdown Table */}
          <div className="border border-[#b0c4de]">
            <div className="bg-[#e4ebf2] p-1.5 font-bold border-b border-[#b0c4de] text-[#003366]">
              وضعیت بدهی و شهریه دانشجو بر اساس آخرین ثبت‌نام
            </div>
            <table className="w-full text-right border-collapse text-[11px]">
              <thead className="bg-[#f0f4f8] text-[#333333] border-b border-[#b0c4de]">
                <tr>
                  <th className="p-2 border-l border-[#b0c4de]">ردیف</th>
                  <th className="p-2 border-l border-[#b0c4de]">نیم‌سال</th>
                  <th className="p-2 border-l border-[#b0c4de]">شرح بدهی</th>
                  <th className="p-2 border-l border-[#b0c4de] text-left">مبلغ بدهی (ریال)</th>
                  <th className="p-2 border-l border-[#b0c4de] text-left">پرداختی (ریال)</th>
                  <th className="p-2 text-center">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0dbe5]">
                {REPORT_1965_PAYMENTS.rows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-[#666666]">
                      اطلاعات بدهی و صورت‌حساب در انتظار بارگذاری از سرور بهستان می‌باشد (بدون بدهی ثبت‌شده)
                    </td>
                  </tr>
                ) : (
                  REPORT_1965_PAYMENTS.rows.map((row, idx) => (
                    <tr key={row.radif || idx} className={row.debitRial > 0 ? "bg-[#fff9f9]" : "bg-[#fcfcfc]"}>
                      <td className="p-2 border-l border-[#d0dbe5] font-mono">{idx + 1}</td>
                      <td className="p-2 border-l border-[#d0dbe5] font-mono">{row.trmNo}</td>
                      <td className="p-2 border-l border-[#d0dbe5] font-bold">
                        {row.step}
                      </td>
                      <td className="p-2 border-l border-[#d0dbe5] text-left font-mono font-bold text-[#b71c1c]">
                        {row.debitRial.toLocaleString('fa-IR')}
                      </td>
                      <td className="p-2 border-l border-[#d0dbe5] text-left font-mono text-[#2e7d32]">
                        {row.paidRial.toLocaleString('fa-IR')}
                      </td>
                      <td className="p-2 text-center font-bold">
                        {row.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Payment Amount & Gateway Input Area */}
          <div className="p-4 bg-[#f8fafc] border border-[#cbd5e1] rounded space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="font-bold text-[#1e293b]">مبلغ مورد نظر جهت پرداخت:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="px-3 py-1.5 border border-[#94a3b8] rounded font-mono font-bold text-[#0f172a] text-left w-48 focus:outline-blue-600"
                  dir="ltr"
                />
                <span className="text-[#64748b] text-[11px]">تومان</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#e2e8f0] pt-3">
              <label className="font-bold text-[#1e293b]">انتخاب درگاه پرداخت شاپرک:</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bank"
                    value="saman"
                    checked={selectedBank === 'saman'}
                    onChange={() => setSelectedBank('saman')}
                  />
                  <span>بانک سامان (سپ)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bank"
                    value="mellat"
                    checked={selectedBank === 'mellat'}
                    onChange={() => setSelectedBank('mellat')}
                  />
                  <span>بانک ملت (به‌پرداخت)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bank"
                    value="tejarat"
                    checked={selectedBank === 'tejarat'}
                    onChange={() => setSelectedBank('tejarat')}
                  />
                  <span>بانک تجارت</span>
                </label>
              </div>
            </div>
          </div>

          {/* Buttons Area (Traditional Behestan Style) */}
          <div className="flex items-center justify-between pt-3 border-t border-[#cbd5e1]">
            <button
              type="button"
              onClick={onBackToSarvestan}
              className="px-4 py-2 border border-[#94a3b8] bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] rounded text-xs font-bold cursor-pointer transition-colors"
            >
              انصراف و بازگشت
            </button>

            <button
              type="button"
              disabled={isRedirecting}
              onClick={handleProceedToBank}
              className="px-6 py-2.5 bg-[#0052cc] hover:bg-[#003d99] text-white rounded text-xs font-bold shadow flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              {isRedirecting ? (
                <span>در حال انتقال به درگاه شاپرک...</span>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>تأیید و اتصال به درگاه پرداخت اینترنتی شاپرک</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
