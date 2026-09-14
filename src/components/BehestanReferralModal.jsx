import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ShieldCheck, FileCheck2, FileText, ArrowUpRight } from 'lucide-react';
import SarvButton from './sarv/SarvButton';
import SarvBadge from './sarv/SarvBadge';
import liveSync from '../services/behestanLiveSync';
import { BEHESTAN_PROFILE } from '../services/behestanData';
import { toFaDigits } from '../utils/faDigits';

export default function BehestanReferralModal({ type, onClose }) {
  if (!type) return null;

  const isRequests = type === 'requests';

  const title = isRequests
    ? 'پیشخوان خدمت و گردش‌کارها'
    : 'نامه‌ها و گواهی‌های اداری';

  const formCode = isRequests ? '۲۱۱۲۲' : '۱۱۱۲۲';
  const Icon = isRequests ? FileCheck2 : FileText;

  const description = isRequests
    ? 'کلیه گردش‌کارها، درخواست‌های آموزشی و دانشجویی (نظیر مرخصی تحصیلی، حذف ترم، معافیت، درخواست‌های شورای آموزش و بررسی مصوبات) منحصراً در پیشخوان سامانه بهستان دانشگاه انجام و پیگیری می‌شوند.'
    : 'صدور گواهی اشتغال به تحصیل دارای کد صحت الکترونیکی وزارت عتف، بارکد سجاد و استعلامات اداری و نظام وظیفه، منحصراً از طریق پیشخوان اداری بهستان صادر و اعتبارسنجی می‌گردد.';

  const handleOpenBehestan = () => {
    if (liveSync?.openBehestanLogin) {
      liveSync.openBehestanLogin();
    } else {
      window.open('https://behestan.kntu.ac.ir/', '_blank');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="sarv-card p-6 w-full max-w-md space-y-5 shadow-2xl text-right border border-info/30"
        >
          {/* Top Bar */}
          <div className="flex items-start justify-between gap-3 border-b border-base-500/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-info/15 text-info shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <SarvBadge variant="info" soft size="sm">سامانه بهستان</SarvBadge>
                  <SarvBadge variant="primary" soft size="sm">فرم {toFaDigits(formCode)}</SarvBadge>
                </div>
                <h3 className="text-base font-bold text-base-content mt-1">
                  {title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral hover:text-base-content hover:bg-base-500/40 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-neutral leading-relaxed">
            {description}
          </p>

          {/* Notice Card */}
          <div className="p-3.5 rounded-xl bg-base-500/25 border border-base-500/40 flex items-start gap-2.5 text-xs text-base-content leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-info shrink-0 mt-0.5" />
            <span>
              به دلیل الزامات حقوقی و امنیتی دانشگاه خواجه نصیر، ثبت، امضای دیجیتال و صدور این فرم‌ها مستقیماً در درگاه اصلی بهستان انجام می‌گیرد.
            </span>
          </div>

          {/* User info if available */}
          {BEHESTAN_PROFILE.studentId && BEHESTAN_PROFILE.studentId !== 'ـ' && (
            <div className="text-[11px] text-neutral/80 bg-base-500/15 p-2 rounded-lg text-center font-mono">
              دانشجو: {BEHESTAN_PROFILE.fullName} · {toFaDigits(BEHESTAN_PROFILE.studentId)}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <SarvButton
              variant="primary"
              className="flex-1"
              onClick={handleOpenBehestan}
            >
              <ExternalLink className="w-4 h-4 ml-1.5" />
              ورود به سامانه بهستان
            </SarvButton>
            <SarvButton
              variant="primary"
              styleType="flat"
              onClick={onClose}
            >
              انصراف
            </SarvButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
