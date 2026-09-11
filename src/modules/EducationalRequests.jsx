import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck2,
  Clock,
  ExternalLink,
  Inbox,
  ChevronLeft,
  Filter
} from 'lucide-react';
import SarvButton from '../components/sarv/SarvButton';
import SarvBadge from '../components/sarv/SarvBadge';
import SarvSelect from '../components/sarv/SarvSelect';
import SarvEmptyState from '../components/sarv/SarvEmptyState';
import { REAL_WORKFLOW_REQUESTS, BEHESTAN_PROFILE, subscribeToData } from '../services/behestanData';
import liveSync from '../services/behestanLiveSync';
import { toFaDigits } from '../utils/faDigits';

function normalizeWorkflow(w) {
  const id = String(w.workflowId || w.id || '').trim() || 'درخواست';
  const type = [w.type, w.subject, w.category].filter(Boolean).join(' · ') || 'درخواست آموزشی';
  const desc = [w.description, w.status, w.note].filter(Boolean).join(' — ') || 'در حال بررسی';
  const done = /صادر|تصویب|تایید شده|پایان|تسویه|بسته/i.test(desc + type);
  return {
    id,
    type,
    desc,
    date: w.date || '—',
    done,
    raw: w
  };
}

export default function EducationalRequests() {
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeToData(() => setTick(t => t + 1));
    return unsub;
  }, []);

  const items = useMemo(() => {
    const list = [...(REAL_WORKFLOW_REQUESTS || [])].map(normalizeWorkflow);
    return list.sort((a, b) => (b.done ? 0 : 1) - (a.done ? 0 : 1));
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'open') return items.filter(i => !i.done);
    if (filter === 'closed') return items.filter(i => i.done);
    return items;
  }, [items, filter]);

  const selected = items.find(i => i.id === selectedId) || filtered[0] || null;

  if (items.length === 0) {
    return (
      <SarvEmptyState
        icon={Inbox}
        title="پیشخوان خدمت و گردش‌کارها"
        description="درخواست‌های ثبت‌شده شما پس از همگام‌سازی با بهستان (فرم ۲۱۱۲۲ / F6524) در اینجا نمایش داده می‌شود. هیچ داده ساختگی نمایش داده نمی‌شود."
      >
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <SarvButton variant="primary" onClick={() => liveSync.openBehestanLogin()}>
            <ExternalLink className="w-4 h-4 ml-1.5" />
            باز کردن بهستان
          </SarvButton>
        </div>
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
              <SarvBadge variant="primary" soft size="sm">فرم ۲۱۱۲۲</SarvBadge>
              <SarvBadge variant="info" soft size="sm">F6524</SarvBadge>
              <h2 className="text-lg sm:text-xl font-bold">پیشخوان خدمت</h2>
            </div>
            <p className="text-xs text-neutral">
              گردش‌کارهای واقعی بهستان · {toFaDigits(items.length)} پرونده
            </p>
          </div>
          <SarvButton
            variant="primary"
            styleType="outline"
            size="sm"
            onClick={() => liveSync.openBehestanLogin()}
          >
            <ExternalLink className="w-4 h-4 ml-1.5" />
            ثبت جدید در بهستان
          </SarvButton>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-44">
          <SarvSelect
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'همه پرونده‌ها' },
              { value: 'open', label: 'در جریان' },
              { value: 'closed', label: 'خاتمه‌یافته' }
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          {filtered.map((req, i) => {
            const isActive = selected?.id === req.id;
            return (
              <motion.button
                key={req.id}
                type="button"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedId(req.id)}
                className={`sarv-chip p-4 text-right w-full text-left ${isActive ? 'sarv-chip-primary' : ''}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-xs text-primary font-semibold truncate">
                    {toFaDigits(req.id)}
                  </span>
                  <SarvBadge variant={req.done ? 'success' : 'warn'} soft size="sm">
                    {req.done ? 'خاتمه' : 'در جریان'}
                  </SarvBadge>
                </div>
                <h4 className="text-sm font-semibold text-base-content line-clamp-1">{req.type}</h4>
                <p className="text-[11px] text-neutral line-clamp-2 mt-0.5">{req.desc}</p>
                <div className="text-[10px] text-neutral/70 mt-1.5 font-mono">{toFaDigits(req.date)}</div>
              </motion.button>
            );
          })}
        </div>

        <div className="lg:col-span-2">
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="sarv-card p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3 border-b border-base-500/40 pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <SarvBadge variant="primary" outline size="sm" className="font-mono">
                      {toFaDigits(selected.id)}
                    </SarvBadge>
                    <SarvBadge variant={selected.done ? 'success' : 'warn'} soft size="sm" dot={!selected.done}>
                      {selected.done ? 'خاتمه‌یافته' : 'در جریان'}
                    </SarvBadge>
                  </div>
                  <h3 className="text-sm font-semibold text-base-content">{selected.type}</h3>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-neutral">شرح وضعیت</span>
                  <span className="text-base-content font-medium text-left flex-1">{selected.desc}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-neutral">تاریخ</span>
                  <span className="font-mono text-base-content">{toFaDigits(selected.date)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-neutral">دانشجو</span>
                  <span className="text-base-content">
                    {BEHESTAN_PROFILE.fullName} · {toFaDigits(BEHESTAN_PROFILE.studentId)}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-[var(--radius-button,0.75rem)] bg-info/10 border border-info/25 text-[11px] text-info leading-relaxed flex items-start gap-2">
                <FileCheck2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  جزئیات کامل، ضمائم و امضای دیجیتال فقط در سامانه بهستان قابل مشاهده است.
                </span>
              </div>

              <SarvButton
                variant="primary"
                onClick={() => liveSync.openBehestanLogin()}
                className="w-full sm:w-auto"
              >
                <ExternalLink className="w-4 h-4 ml-1.5" />
                پیگیری در بهستان
              </SarvButton>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
