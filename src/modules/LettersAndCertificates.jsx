import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  ExternalLink,
  Inbox,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import SarvButton from '../components/sarv/SarvButton';
import SarvBadge from '../components/sarv/SarvBadge';
import SarvEmptyState from '../components/sarv/SarvEmptyState';
import { BEHESTAN_PROFILE, REAL_WORKFLOW_REQUESTS, subscribeToData } from '../services/behestanData';
import liveSync from '../services/behestanLiveSync';
import { toFaDigits } from '../utils/faDigits';

const LETTER_RE = /نامه|گواهي|گواهی|مکاتب|مکاتبات|استعلام|اشتغال|توصيه|توصیه|معرفی|معرفينامه/i;

function mapLetter(w) {
  const type = [w.type, w.subject, w.category].filter(Boolean).join(' · ') || 'نامه / گواهی';
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
    // اگر نامه‌ای فیلتر نشد، همه گردش‌کارها را نشان بده (بخش نامه زیرمجموعه پیشخوان است)
    const letterish = all.filter(l => LETTER_RE.test(l.type + ' ' + l.desc));
    return letterish.length ? letterish : all;
  }, []);

  if (letters.length === 0) {
    return (
      <SarvEmptyState
        icon={Inbox}
        title="نامه‌ها و گواهی‌ها"
        description="گواهی اشتغال به تحصیل و مکاتبات رسمی پس از ثبت در بهستان (فرم ۱۱۱۲۲) در اینجا دیده می‌شود. این بخش بدون داده ساختگی است."
      >
        <SarvButton variant="primary" onClick={() => liveSync.openBehestanLogin()}>
          <ExternalLink className="w-4 h-4 ml-1.5" />
          باز کردن بهستان
        </SarvButton>
      </SarvEmptyState>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28 }}
      className="space-y-5 text-right"
    >
      <div className="sarv-card p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <SarvBadge variant="primary" soft size="sm">فرم ۱۱۱۲۲</SarvBadge>
              <h2 className="text-lg sm:text-xl font-bold">نامه‌ها و گواهی‌ها</h2>
            </div>
            <p className="text-xs text-neutral">
              {BEHESTAN_PROFILE.major} · {toFaDigits(letters.length)} پرونده از بهستان
            </p>
          </div>
          <SarvButton
            variant="primary"
            styleType="outline"
            size="sm"
            onClick={() => liveSync.openBehestanLogin()}
          >
            <ExternalLink className="w-4 h-4 ml-1.5" />
            درخواست جدید در بهستان
          </SarvButton>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {letters.map((ltr, i) => (
          <motion.div
            key={`${ltr.id}-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="sarv-chip p-4 space-y-2"
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

      <div className="p-4 rounded-[var(--radius-button,0.75rem)] bg-info/10 border border-info/25 flex items-start gap-2.5 text-xs text-info leading-relaxed">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          صدور الکترونیکی گواهی و استعلام QR فقط از طریق سامانه رسمی بهستان انجام می‌شود؛
          سروستان وضعیت و پیگیری را نمایش می‌دهد.
        </span>
      </div>
    </motion.div>
  );
}
