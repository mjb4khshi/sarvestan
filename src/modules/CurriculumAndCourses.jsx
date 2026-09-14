import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  Filter,
  GraduationCap,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookMarked
} from 'lucide-react';
import SarvButton from '../components/sarv/SarvButton';
import SarvBadge from '../components/sarv/SarvBadge';
import SarvInput from '../components/sarv/SarvInput';
import SarvSelect from '../components/sarv/SarvSelect';
import SarvStatCard from '../components/sarv/SarvStatCard';
import SarvEmptyState from '../components/sarv/SarvEmptyState';
import SarvTabs from '../components/sarv/SarvTabs';
import {
  BEHESTAN_PROFILE,
  getCourses,
  getCurriculumStats,
  subscribeToData
} from '../services/behestanData';
import liveSync from '../services/behestanLiveSync';
import { toFaDigits } from '../utils/faDigits';

const faName = (n) => String(n || '')
  .replace(/[يى]/g, 'ی')
  .replace(/ك/g, 'ک')
  .replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
  .replace(/\s+/g, ' ')
  .trim();

function parseNum(v) {
  if (typeof v === 'number') return v;
  const s = String(v ?? '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[^\d.]/g, '');
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

/** وضعیت درس از نمره/وضعیت F1825 */
function courseState(c) {
  const isDropped = c.regStatus === 'dropped' || c.isDropped || String(c.status || '').includes('حذف') || String(c.grade || '').includes('حذف');
  if (isDropped) return 'dropped';
  const isWaitlist = c.regStatus === 'waitlist' || c.isWait || String(c.status || '').includes('انتظار') || String(c.grade || '').includes('انتظار');
  if (isWaitlist) return 'waitlist';

  const grade = parseNum(c.grade);
  const status = String(c.status || '');
  if (grade !== null && grade >= 10) return 'passed';
  if (/نپذيرفته|مشروط/i.test(status)) return 'failed';
  if (grade !== null && grade > 0) return 'failed';
  if (c.isRegistration || (!c.grade && c.termId === '4051')) return 'enrolled';
  if (!c.grade && c.termId) return 'enrolled';
  return 'unknown';
}

function normalizeType(t) {
  const s = faName(t || '');
  if (!s || s === 'ـ') return 'سایر';
  if (/پايه|مقدماتي/i.test(s)) return 'پایه';
  if (/تخصصي الزامي/i.test(s)) return 'تخصصی الزامی';
  if (/تخصصي اختياري|تخصصي انتخابي/i.test(s)) return 'تخصصی انتخابی';
  if (/تخصصي/i.test(s)) return 'تخصصی';
  if (/اصلي/i.test(s)) return 'اصلی';
  if (/عمومي/i.test(s)) return 'عمومی';
  if (/اختياري/i.test(s)) return 'اختیاری';
  return s;
}

export default function CurriculumAndCourses() {
  const [selectedType, setSelectedType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeToData(() => setTick(t => t + 1));
    const unsubSync = liveSync?.subscribe?.(() => setTick(t => t + 1));
    return () => {
      unsub();
      if (unsubSync) unsubSync();
    };
  }, []);

  // فقط داده واقعی F1825 — بدون هیچ لیست هاردکد
  const liveCourses = useMemo(() => {
    const all = getCourses() || [];
    // آخرین وضعیت هر کد درس (اگر چند ترم تکرار شده)
    const byCode = new Map();
    for (const c of all) {
      if (!c?.code) continue;
      const prev = byCode.get(String(c.code));
      // ترم بزرگ‌تر اولویت دارد
      if (!prev || String(c.termId || '') >= String(prev.termId || '')) {
        byCode.set(String(c.code), {
          ...c,
          name: faName(c.name),
          type: normalizeType(c.type),
          units: parseNum(c.units) || 0,
          grade: c.grade,
          status: c.status,
          termId: c.termId
        });
      }
    }
    return [...byCode.values()].map(c => ({
      ...c,
      state: courseState(c)
    }));
  }, []);

  const stats = getCurriculumStats();
  const typeStats = (stats?.byType || []).filter(r => r.count > 0 || r.units > 0);

  const typeOptions = useMemo(() => {
    const types = [...new Set(liveCourses.map(c => c.type).filter(Boolean))];
    return [{ value: 'all', label: 'همه انواع' }, ...types.map(t => ({ value: t, label: t }))];
  }, [liveCourses]);

  const filtered = useMemo(() => {
    const q = faName(searchQuery).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    return liveCourses.filter(c => {
      if (selectedType !== 'all' && c.type !== selectedType) return false;
      if (statusFilter !== 'all' && c.state !== statusFilter) return false;
      if (!q) return true;
      const hay = `${c.name} ${c.code} ${c.type} ${c.termId}`;
      return hay.includes(q) || String(c.code || '').includes(q);
    });
  }, [liveCourses, selectedType, statusFilter, searchQuery]);

  const totals = useMemo(() => {
    const passed = liveCourses.filter(c => c.state === 'passed');
    const enrolled = liveCourses.filter(c => c.state === 'enrolled');
    const dropped = liveCourses.filter(c => c.state === 'dropped');
    const passedUnits = passed.reduce((s, c) => s + (c.units || 0), 0);
    const enrolledUnits = enrolled.reduce((s, c) => s + (c.units || 0), 0);
    return { passedCount: passed.length, enrolledCount: enrolled.length, droppedCount: dropped.length, passedUnits, enrolledUnits };
  }, [liveCourses]);

  const stateBadge = (state) => {
    if (state === 'passed') return { variant: 'success', label: 'پاس شده' };
    if (state === 'enrolled') return { variant: 'warn', label: 'در جریان' };
    if (state === 'dropped') return { variant: 'danger', label: 'حذف اضطراری' };
    if (state === 'waitlist') return { variant: 'warn', label: 'در انتظار' };
    if (state === 'failed') return { variant: 'danger', label: 'مردود' };
    return { variant: 'neutral', label: 'نامشخص' };
  };

  /** رنگ badge نوع درس با تفکیک سرو */
  const typeVariant = (type) => {
    const t = String(type || '');
    if (/پایه/.test(t)) return 'info';
    if (/اصلی/.test(t)) return 'success';
    if (/تخصصی الزامی/.test(t)) return 'primary';
    if (/تخصصی/.test(t)) return 'accent';
    if (/عمومی/.test(t)) return 'warn';
    if (/اختیاری/.test(t)) return 'secondary';
    return 'neutral';
  };

  if (liveCourses.length === 0) {
    return (
      <SarvEmptyState
        icon={BookOpen}
        title="وضعیت دروس (فرم ۱۱۱۲۶ / F1814)"
        description="پس از اتصال به بهستان، فهرست دروس گذرانده‌شده و در جریان شما از سامانه خوانده می‌شود. هیچ دیتای ثابت/هاردکد در این بخش نیست."
      >
        <SarvButton variant="primary" onClick={() => liveSync.openBehestanLogin()}>
          ورود به بهستان
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
      {/* Header */}
      <div className="sarv-card p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <SarvBadge variant="primary" soft size="sm">فرم ۱۱۱۲۶</SarvBadge>
              <SarvBadge variant="info" soft size="sm">F1814 · F1825</SarvBadge>
              <h2 className="text-lg sm:text-xl font-bold">وضعیت دروس دانشجو</h2>
            </div>
            <p className="text-xs text-neutral">
              فقط از داده زنده بهستان — برای همه رشته‌ها کار می‌کند
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral">
            <span className="font-mono">{toFaDigits(liveCourses.length)} درس</span>
            <span>•</span>
            <span className="font-mono">{toFaDigits(totals.passedUnits)} واحد پاس</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SarvStatCard
          icon={GraduationCap}
          label="کل دروس ثبت‌شده"
          value={toFaDigits(liveCourses.length)}
          accent="primary"
          delay={0.05}
        />
        <SarvStatCard
          icon={CheckCircle2}
          label="پاس‌شده"
          value={toFaDigits(totals.passedCount)}
          accent="success"
          delay={0.1}
          subtitle={`${toFaDigits(totals.passedUnits)} واحد`}
        />
        <SarvStatCard
          icon={Clock}
          label="در جریان / ثبت‌نام"
          value={toFaDigits(totals.enrolledCount)}
          accent="warn"
          delay={0.15}
          subtitle={`${toFaDigits(totals.enrolledUnits)} واحد`}
        />
        <SarvStatCard
          icon={Layers}
          label="انواع درس (F1814)"
          value={toFaDigits(typeStats.length || liveCourses.reduce((s, c) => {
            if (!s.includes(c.type)) s.push(c.type);
            return s;
          }, []).length)}
          accent="info"
          delay={0.2}
        />
      </div>

      {/* F1814 type breakdown */}
      {typeStats.length > 0 && (
        <div className="sarv-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-base-content flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            خلاصه بر اساس نوع درس (از بهستان)
          </h3>
          <div className="flex flex-wrap gap-2">
            {typeStats.map((r) => (
              <SarvBadge key={r.id || r.label} variant={typeVariant(r.label)} soft size="sm">
                {faName(r.label)}: {toFaDigits(r.count)} درس · {toFaDigits(r.units)} واحد
              </SarvBadge>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SarvInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام یا کد درس…"
          />
        </div>
        <div className="w-full sm:w-44">
          <SarvSelect
            value={selectedType}
            onChange={setSelectedType}
            options={typeOptions}
          />
        </div>
        <div className="w-full sm:w-40">
          <SarvSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'همه وضعیت‌ها' },
              { value: 'passed', label: 'پاس شده' },
              { value: 'enrolled', label: 'در جریان' },
              { value: 'dropped', label: 'حذف اضطراری' },
              { value: 'failed', label: 'مردود' }
            ]}
          />
        </div>
      </div>

      {/* Course table */}
      <div className="sarv-card p-5">
        <div className="overflow-x-auto rounded-[var(--radius-card,1rem)] border border-base-500/40">
          <table className="w-full text-right text-xs">
            <thead className="bg-base-500/30 text-neutral font-semibold border-b border-base-500/40">
              <tr>
                <th className="p-3 text-center w-12">ردیف</th>
                <th className="p-3">کد درس</th>
                <th className="p-3">نام درس</th>
                <th className="p-3 text-center">نوع</th>
                <th className="p-3 text-center">واحد</th>
                <th className="p-3 text-center">ترم</th>
                <th className="p-3 text-center">نمره</th>
                <th className="p-3 text-center">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-500/30">
              {filtered.map((c, idx) => {
                const sb = stateBadge(c.state);
                return (
                  <motion.tr
                    key={`${c.code}-${c.termId}-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                    className="hover:bg-base-500/10 transition-colors"
                  >
                    <td className="p-3 text-center text-neutral font-mono">{toFaDigits(idx + 1)}</td>
                    <td className="p-3 font-mono font-semibold text-primary">{toFaDigits(c.code)}</td>
                    <td className="p-3 font-medium text-base-content">{c.name}</td>
                    <td className="p-3 text-center">
                      <SarvBadge variant={typeVariant(c.type)} soft size="sm">
                        {c.type}
                      </SarvBadge>
                    </td>
                    <td className="p-3 text-center font-mono">{toFaDigits(c.units)}</td>
                    <td className="p-3 text-center font-mono text-neutral">{toFaDigits(c.termId || 'ـ')}</td>
                    <td className="p-3 text-center font-mono font-semibold">
                      {c.state === 'dropped' ? (
                        <span className="text-danger font-bold">حذف</span>
                      ) : c.state === 'waitlist' ? (
                        <span className="text-warn font-bold">انتظار</span>
                      ) : c.grade ? (
                        toFaDigits(c.grade)
                      ) : (
                        'ـ'
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <SarvBadge variant={sb.variant} soft size="sm" dot={c.state === 'enrolled'}>
                        {sb.label}
                      </SarvBadge>
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral">
                    درسی با این فیلتر یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-neutral/70 text-center px-2">
        داده از سرویس‌های <span className="font-mono">F1825</span> (دروس) و{' '}
        <span className="font-mono">F1814</span> (خلاصه وضعیت) بهستان است —
        برای هر دانشجو و هر رشته‌ای بدون هاردکد کار می‌کند.
      </p>
    </motion.div>
  );
}
