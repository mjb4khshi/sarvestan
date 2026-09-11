import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  CreditCard,
  CalendarDays,
  Inbox
} from 'lucide-react';
import SarvBadge from './sarv/SarvBadge';
import { BEHESTAN_PROFILE, REAL_FINANCIAL_REPORT_2563, REAL_WORKFLOW_REQUESTS, getSchedules } from '../services/behestanData';
import { toFaDigits } from '../utils/faDigits';

export default function NotificationsDrawer({ isOpen, onClose }) {
  const notifications = useMemo(() => {
    const list = [];
    const debt = Number(REAL_FINANCIAL_REPORT_2563.totalDebtRial || 0);
    if (debt > 0) {
      list.push({
        id: 'debt',
        type: 'warn',
        icon: CreditCard,
        title: 'بدهی شهریه',
        message: `مانده حساب شما ${toFaDigits((debt / 10).toLocaleString('fa-IR'))} تومان است. تسویه در بهستان.`,
        time: 'وضعیت مالی',
        unread: true
      });
    }

    const workflows = [...(REAL_WORKFLOW_REQUESTS || [])].slice(0, 5);
    for (const w of workflows) {
      list.push({
        id: `wf-${w.workflowId || w.id || Math.random()}`,
        type: 'info',
        icon: FileCheck2,
        title: w.type || w.subject || 'گردش‌کار',
        message: [w.description, w.status].filter(Boolean).join(' — ') || 'در پیشخوان خدمت',
        time: w.date || 'بهستان',
        unread: true
      });
    }

    const schedules = getSchedules() || {};
    const courseCount = Object.values(schedules).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);
    if (courseCount > 0) {
      list.push({
        id: 'schedule',
        type: 'success',
        icon: CalendarDays,
        title: 'برنامه هفتگی همگام شد',
        message: `${toFaDigits(courseCount)} درس در ماژول برنامه از بهستان دریافت شد.`,
        time: 'همگام‌سازی',
        unread: false
      });
    }

    return list;
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm">
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="w-full max-w-sm h-full bg-base border-l border-base-500/50 p-5 flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-base-500/40">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-base-content">اعلان‌ها</h3>
            {unreadCount > 0 && (
              <SarvBadge variant="primary" size="sm">{toFaDigits(unreadCount)}</SarvBadge>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral hover:text-base-content hover:bg-base-500/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pt-4">
          {notifications.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-neutral">
              <Inbox className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">اعلان جدیدی از بهستان نیست</p>
            </div>
          ) : (
            notifications.map((n, i) => {
              const Icon = n.icon;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`p-3 rounded-[var(--radius-button,0.75rem)] border text-right space-y-1.5 ${
                    n.unread ? 'bg-primary/8 border-primary/30' : 'bg-base-500/20 border-base-500/35'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-xs font-semibold text-base-content truncate">{n.title}</span>
                    </div>
                    {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-[11px] text-neutral leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-neutral/70 font-mono">{n.time}</span>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.aside>
    </div>
  );
}
