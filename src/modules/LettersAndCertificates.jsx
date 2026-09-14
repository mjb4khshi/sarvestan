import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  ExternalLink,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Info
} from 'lucide-react';
import SarvButton from '../components/sarv/SarvButton';
import SarvBadge from '../components/sarv/SarvBadge';
import { BEHESTAN_PROFILE, REAL_WORKFLOW_REQUESTS, subscribeToData } from '../services/behestanData';
import liveSync from '../services/behestanLiveSync';
import { toFaDigits } from '../utils/faDigits';

const LETTER_RE = /نامه|گواهي|گواهی|مکاتب|مکاتبات|استعلام|اشتغال|توصيه|توصیه|معرفی|معرفينامه/i;

function mapLetter(w) {
  const type = [w.type, w.subject, w.category].filter(Boolean).join(' · ') || 'نامه / گواهی اداری';
  const desc = [w.description, w.status].filter(Boolean).join(' — ') || '—';
  const done = /صادر|تصویب|تاييد|تایید|ارسال شده/i.test(desc + type);
  return {
    id: w.workflowId || 'نامه',
    type,
    desc,
    date: w.date || '—',
    done
  };
}

export default function LettersAndCertificates() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeToData(() => setTick(t => t + 1));
    return unsub;
  }, []);

  const letters = useMemo(() => {
    const all = [...(REAL_WORKFLOW_REQUESTS || [])].map(mapLetter);
    const letterish = all.filter(l => LETTER_RE.test(l.type + ' ' + l.desc));
    return letterish.length ? letterish : all;
  }, []);

  const openBehestanPortal = () => {
    if (liveSync?.openBehestanLogin) {
      liveSync.openBehestanLogin();
    } else {
      window.open('https://behestan.kntu.ac.ir/', '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28 }}
      className="space-y-6 text-right"
    >
      {/* Header Banner */}
      <div className="sarv-card p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <SarvBadge variant="info" soft size="sm">سامانه بهستان</SarvBadge>
              <SarvBadge variant="primary" soft size="sm">فرم ۱۱۱۲۲</SarvBadge>
              <h2 className="text-xl sm:text-2xl font-bold text-base-content flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                نامه‌ها و گواهی‌های اداری
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral max-w-2xl leading-relaxed">
              کلیه استعلامات رسمی، صدور گواهی اشتغال به تحصیل با کد صحت الکترونیکی سازمان امور دانشجویان و مکاتبات اداری باید مستقیماً در سامانه جامع بهستان ثبت و پیگیری گردند.
            </p>
          </div>

          <SarvButton
            variant="primary"
            size="md"
            onClick={openBehestanPortal}
            className="shrink-0"
          >
            <ExternalLink className="w-4 h-4 ml-2" />
            ورود به پیشخوان بهستان
          </SarvButton>
        </div>
      </div>

      {/* Referral Info Card */}
      <div className="sarv-card p-6 border border-info/30 bg-info/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-info/15 text-info">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-base-content">
              نحوه دریافت گواهی اشتغال به تحصیل و نامه‌های رسمی در بهستان
            </h3>
            <p className="text-xs text-neutral mt-0.5">
              مسیر دسترسی: منوی پیشخوان خدمت ← درخواست‌های آموزشی ← درخواست گواهی اشتغال به تحصیل
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-base-500/30 border border-base-500/40 space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>کد صحت الکترونیکی</span>
            </div>
            <p className="text-[11px] text-neutral leading-relaxed">
              گواهی‌های صادره شامل QR Code و بارکد سازمان امور دانشجویان (سجاد) هستند.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-base-500/30 border border-base-500/40 space-y-1.5">
            <div className="flex items-center gap-2 text-success font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>بدون نیاز به مراجعه حضوری</span>
            </div>
            <p className="text-[11px] text-neutral leading-relaxed">
              تأییدیه آموزش کل به صورت خودکار و الکترونیکی روی فایل PDF درج می‌شود.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-base-500/30 border border-base-500/40 space-y-1.5">
            <div className="flex items-center gap-2 text-warn font-semibold text-xs">
              <Clock className="w-4 h-4" />
              <span>تسویه مالی الزامی</span>
            </div>
            <p className="text-[11px] text-neutral leading-relaxed">
              طبق مقررات دانشگاه، صدور گواهی منوط به عدم وجود مانده بدهی شهریه است.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-base-500/30">
          <div className="text-xs text-neutral flex items-center gap-1.5">
            <Info className="w-4 h-4 text-info shrink-0" />
            <span>دانشجو: {BEHESTAN_PROFILE.fullName} ({toFaDigits(BEHESTAN_PROFILE.studentId)}) · {BEHESTAN_PROFILE.major}</span>
          </div>
          <SarvButton
            variant="primary"
            styleType="outline"
            size="sm"
            onClick={openBehestanPortal}
          >
            <ArrowUpRight className="w-4 h-4 ml-1" />
            ثبت درخواست در فرم ۱۱۱۲۲
          </SarvButton>
        </div>
      </div>

      {/* Tracked records if any */}
      {letters.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-base-content">
              سوابق پرونده‌های همگام‌شده از نشست بهستان
            </h3>
            <SarvBadge variant="neutral" soft size="sm">
              {toFaDigits(letters.length)} پرونده
            </SarvBadge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {letters.map((ltr, i) => (
              <motion.div
                key={`${ltr.id}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="sarv-chip p-4 space-y-2 text-right"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-primary font-semibold truncate">
                    {toFaDigits(ltr.id)}
                  </span>
                  <SarvBadge variant={ltr.done ? 'success' : 'warn'} soft size="sm">
                    {ltr.done ? 'صادرشده' : 'در جریان'}
                  </SarvBadge>
                </div>
                <h4 className="text-sm font-semibold text-base-content line-clamp-2">{ltr.type}</h4>
                <p className="text-[11px] text-neutral line-clamp-3">{ltr.desc}</p>
                <div className="text-[10px] text-neutral/70 font-mono pt-1 border-t border-base-500/30">
                  {toFaDigits(ltr.date)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Official Footnote */}
      <div className="p-4 rounded-[var(--radius-button,0.75rem)] bg-base-500/20 border border-base-500/40 flex items-start gap-3 text-xs text-neutral leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span>
          افزونه سروستان صرفاً یک پوسته دسترسی سریع به اطلاعات سامانه بهستان دانشگاه صنعتی خواجه نصیرالدین طوسی است و امور دارای بار حقوقی نظیر صدور مدارک دانشنامه و گواهی اشتغال به تحصیل منحصراً از درگاه رسمی بهستان انجام می‌شود.
        </span>
      </div>
    </motion.div>
  );
}
