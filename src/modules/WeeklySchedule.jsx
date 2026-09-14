import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Printer,
  Download,
  BookOpen,
  Award,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Edit3,
  Check,
  X,
  AlertCircle,
  Table as TableIcon,
  LayoutGrid,
  FileText,
  RefreshCw
} from 'lucide-react';
import SarvButton from '../components/sarv/SarvButton';
import SarvBadge from '../components/sarv/SarvBadge';
import SarvSelect from '../components/sarv/SarvSelect';
import SarvInput from '../components/sarv/SarvInput';
import SarvAvatar from '../components/SarvAvatar';
import { BEHESTAN_PROFILE, subscribeToData, getSchedules, getCourses, getExams } from '../services/behestanData';
import { toFaDigits } from '../utils/faDigits';

// روزهای رسمی هفته در دانشگاه خواجه نصیر
const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'];

// بازه‌های زمانی استاندارد دانشگاه (مطابق گزارش ۷۸ بهستان)
const TIME_SLOTS = [
  { id: 'slot-1', label: '۰۷:۳۰ - ۰۹:۰۰', short: '۰۷:۳۰', startHour: 7.5, endHour: 9.0 },
  { id: 'slot-2', label: '۰۹:۰۰ - ۱۰:۳۰', short: '۰۹:۰۰', startHour: 9.0, endHour: 10.5 },
  { id: 'slot-3', label: '۱۰:۳۰ - ۱۲:۳۰', short: '۱۰:۳۰', startHour: 10.5, endHour: 12.5 },
  { id: 'slot-break', label: '۱۲:۳۰ - ۱۳:۳۰ (نماز و استراحت)', short: '۱۲:۳۰', isBreak: true, startHour: 12.5, endHour: 13.5 },
  { id: 'slot-4', label: '۱۳:۳۰ - ۱۵:۰۰', short: '۱۳:۳۰', startHour: 13.5, endHour: 15.0 },
  { id: 'slot-5', label: '۱۵:۰۰ - ۱۶:۳۰', short: '۱۵:۰۰', startHour: 15.0, endHour: 16.5 },
  { id: 'slot-6', label: '۱۶:۳۰ - ۱۸:۰۰', short: '۱۶:۳۰', startHour: 16.5, endHour: 18.0 }
];

export default function WeeklySchedule() {
  const isLoggedIn = BEHESTAN_PROFILE.isLoggedIn;
  const [selectedTerm, setSelectedTerm] = useState('4051');
  const [activeView, setActiveView] = useState('matrix');
  const [schedules, setSchedules] = useState(() => getSchedules());
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeToData((cache) => {
      setSchedules(cache?.schedule || getSchedules());
      setTick(t => t + 1);
    });
    setSchedules(getSchedules());
    return unsub;
  }, []);

  /** درخواست دستی برنامه از تب‌های باز بهستان (بدون سنک انبوه) */
  const requestScheduleRefresh = () => {
    if (typeof chrome === 'undefined' || !chrome.tabs?.query) return;
    try {
      chrome.tabs.query({ url: ['*://behestan.kntu.ac.ir/*', '*://*.kntu.ac.ir/*'] }, (tabs) => {
        for (const tab of tabs || []) {
          try {
            chrome.tabs.sendMessage(tab.id, { action: 'SARVESTAN_REFRESH_SCHEDULE' }, () => {
              void chrome.runtime.lastError;
            });
          } catch (_) {}
        }
      });
    } catch (_) {}
  };

  // اگر ترم انتخابی خالی است ولی ترم دیگری دیتا دارد، خودکار روی اولین ترم پر برو
  useEffect(() => {
    const termsWithData = Object.keys(schedules || {})
      .filter(k => Array.isArray(schedules[k]) && schedules[k].length > 0);
    if (termsWithData.length > 0 && !(Array.isArray(schedules[selectedTerm]) && schedules[selectedTerm].length > 0)) {
      // ترجیح: 4051 اگر پر است، وگرنه جدیدترین ترم پر
      const preferred = termsWithData.includes('4051') ? '4051' : termsWithData.sort().reverse()[0];
      if (preferred !== selectedTerm) setSelectedTerm(preferred);
    }
  }, [schedules, selectedTerm]);

  // تبدیل ساعت فارسی/لاتین به ساعت اعشاری
  const parseHour = (raw) => {
    if (!raw) return null;
    const fa = '۰۱۲۳۴۵۶۷۸۹';
    const s = String(raw).replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)));
    const m = s.match(/(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
  };

  // استخراج بازه شروع-پایان از classTimeRaw یا time
  const getCourseRanges = (c) => {
    const sources = [c.classTimeRaw, c.time, ...(Array.isArray(c.timeSlotsRaw) ? c.timeSlotsRaw : [])].filter(Boolean);
    const ranges = [];
    for (const src of sources) {
      // "10:30-09:00" یا "۰۹:۰۰ - ۱۰:۳۰" → start قبل از dash؟ در بهستان معمولاً end-start
      const parts = String(src).split(/\s*-\s*/);
      if (parts.length >= 2) {
        const a = parseHour(parts[0]);
        const b = parseHour(parts[1]);
        if (a == null || b == null) continue;
        const start = Math.min(a, b);
        const end = Math.max(a, b);
        ranges.push({ start, end, raw: src });
      } else {
        const h = parseHour(src);
        if (h != null) ranges.push({ start: h, end: h + 1.5, raw: src });
      }
    }
    return ranges;
  };

  // نگاشت بازه ساعتی به slotId های معتبر
  const getCourseSlotIds = (c) => {
    if (c.slotId) {
      const ids = [c.slotId];
      if (c.extraSlotId) ids.push(c.extraSlotId);
      if (Array.isArray(c.slotIds)) ids.push(...c.slotIds);
      return [...new Set(ids.filter(Boolean))];
    }
    const ranges = getCourseRanges(c);
    const ids = [];
    for (const r of ranges) {
      for (const slot of TIME_SLOTS) {
        if (slot.isBreak) continue;
        // تطابق شروع: اختلاف ≤ ۴۵ دقیقه
        if (Math.abs(slot.startHour - r.start) <= 0.75) {
          ids.push(slot.id);
        }
        // یا همپوشانی قابل توجه
        else if (r.start < slot.endHour && r.end > slot.startHour && (r.end - r.start) >= 1) {
          ids.push(slot.id);
        }
      }
    }
    return [...new Set(ids)];
  };

  const [editingCourse, setEditingCourse] = useState(null);
  const [editDaysStr, setEditDaysStr] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editHall, setEditHall] = useState('');

  // نگاشت نوع درس → توکن رنگ رسمی سرو
  const courseColorToken = (type, name) => {
    const t = String(type || '');
    const n = String(name || '');
    const all = t + ' ' + n;
    if (/انتخابی|اختیاری/i.test(t)) return 'accent';
    if (/تخصصی|اصلی|مرکزی|هسته/i.test(t)) return 'success';
    if (/عمومی|عمومي|اسلام|اخلاق|اندیشه|زبان فارسي|زبان فارسی|دینی|دانش خانواده|آیين/i.test(all)) return 'secondary';
    if (/پایه|مقدماتی/i.test(t)) return 'info';
    if (/ریاض|رياضي|فيزيك|فیزیک|جبر|شیمي|شیمی|آمار|هندسه/i.test(n)) return 'info';
    if (/برنامه|نرم|مدار|دیجیتال|پایگاه|ساختار|داده|کامپیوتر|سیستم عامل|الگوریتم/i.test(n)) return 'success';
    if (/اقتصاد|مدیریت|طرح|کیفیت|تولید|پروژه|عملیات|انبار|صنایع|تکنولوژی/i.test(n)) return 'primary';
    return 'primary';
  };

  const chipClass = (c) => `sarv-chip sarv-chip-${courseColorToken(c.type, c.name)}`;

  const cachedCoursesForTerm = useMemo(() => {
    try {
      const parsed = getCourses() || [];
      return parsed
        .filter(c => (c.termId === selectedTerm || (!c.grade && selectedTerm === '4051')) && !c.isDropped && c.regStatus !== 'dropped' && !String(c.status || '').includes('حذف'))
        .map(c => ({
          id: c.code || c.name,
          code: c.code,
          name: c.name,
          group: c.group || '۰۱',
          units: c.units || 3,
          type: c.type || 'تخصصی',
          professor: c.professor || 'اساتید گروه',
          days: c.days && c.days.length > 0 ? c.days : [],
          time: c.time || 'ـ',
          hall: c.hall || 'ـ',
          examDate: c.examDate || 'ـ',
          examTime: c.examTime || 'ـ',
          capacity: 'ـ',
          isDraft: selectedTerm === '4051',
          isRegistration: selectedTerm === '4051'
        }));
    } catch { return []; }
  }, [selectedTerm, schedules]);

  const activeCourses = useMemo(() => {
    const rawList = (schedules[selectedTerm] && schedules[selectedTerm].length > 0)
      ? schedules[selectedTerm]
      : cachedCoursesForTerm;
    const list = (rawList || []).filter(c => !c.isDropped && c.regStatus !== 'dropped' && !String(c.status || '').includes('حذف'));

    // غنی‌سازی واحد / نام / نوع از کش دروس F1825
    const metaByCode = {};
    try {
      for (const c of getCourses() || []) {
        if (c?.code) {
          metaByCode[String(c.code)] = {
            units: c.units > 0 ? c.units : 0,
            name: c.name || null,
            type: c.type || null
          };
        }
      }
    } catch {}

    const faName = (n) => String(n || '')
      .replace(/[يى]/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
      .replace(/\s+/g, ' ')
      .trim();

    return (list || []).map((c) => {
      const meta = metaByCode[String(c.code)] || {};
      const units = (c.units > 0 ? c.units : meta.units || 0);
      return {
        ...c,
        name: faName(c.name) || c.name,
        units: units || 0,
        type: c.type && c.type !== 'ـ' ? c.type : (meta.type || c.type || 'تخصصی')
      };
    });
  }, [schedules, selectedTerm, cachedCoursesForTerm]);

  // امتحانات گزارش ۴۲۸ یا مشتق از تاریخ امتحان برنامه ۷۸
  const examList = React.useMemo(() => {
    const byTerm = getExams() || {};
    const live = byTerm[selectedTerm];
    if (Array.isArray(live) && live.length > 0) {
      return live.map(e => ({
        ...e,
        id: e.id || e.code,
        examDate: toFaDigits(e.examDate || 'ـ'),
        examTime: toFaDigits(e.examTime || 'ـ'),
        name: e.name || e.codeGroup
      }));
    }
    // fallback: دروسی که examDate واقعی دارند
    return activeCourses
      .filter(c => c.examDate && c.examDate !== 'ـ' && /^\d{4}/.test(String(c.examDate).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))))
      .map(c => ({
        id: c.id || c.code,
        code: c.code,
        name: c.name,
        professor: c.professor && c.professor !== 'ـ' ? c.professor : 'ـ',
        day: Array.isArray(c.days) && c.days[0] ? c.days[0] : 'ـ',
        examDate: toFaDigits(c.examDate),
        examTime: toFaDigits(c.examTime && c.examTime !== 'ـ' ? c.examTime : 'ـ'),
        hall: c.hall && c.hall !== 'ـ' ? c.hall : 'تعیین نشده',
        invigilator: 'ـ',
        units: c.units || 0,
        codeGroup: c.code ? `${toFaDigits(c.code)} / ${toFaDigits(c.group || '')}` : 'ـ',
        isLive: false
      }));
  }, [activeCourses, selectedTerm]);

  const handleOpenEdit = (c) => {
    setEditingCourse(c);
    setEditDaysStr(c.days.join(' / '));
    setEditTime(c.time);
    setEditHall(c.hall);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingCourse) return;

    const parsedDays = editDaysStr
      .split(/[\/،,]/)
      .map(d => d.trim())
      .filter(d => DAYS.includes(d));

    setSchedules(prev => ({
      ...prev,
      [selectedTerm]: prev[selectedTerm].map(item =>
        item.id === editingCourse.id
          ? {
              ...item,
              days: parsedDays.length > 0 ? parsedDays : item.days,
              time: editTime,
              hall: editHall
            }
          : item
      )
    }));

    setEditingCourse(null);
  };

  // تابع ایجاد و دانلود فایل خروجی استاندارد اکسل (گزارش ۷۸)
  const handleExportExcel = () => {
    const termLabel = selectedTerm === '4042' ? '4042_Spring' : selectedTerm === '4041' ? '4041_Fall' : '4051_Registration';
    const rows = [
      ['شماره درس', 'گروه', 'نام درس', 'تعداد واحد', 'نوع درس', 'استاد', 'روزهای برگزاری', 'ساعت کلاس', 'محل تشکیل', 'تاریخ امتحان', 'ساعت امتحان', 'تعداد ثبت‌نامی'],
      ...activeCourses.map(c => [
        c.code,
        c.group,
        c.name,
        c.units,
        c.type,
        c.professor,
        c.days.join(' - '),
        c.time,
        c.hall,
        c.examDate,
        c.examTime,
        c.capacity
      ])
    ];

    const csvContent = '\uFEFF' + rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Behestan_Report78_${termLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Top Header Card */}
      <div className="sarv-card p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {selectedTerm === '4051' ? (
                <SarvBadge variant="warn" soft size="sm">برنامه موقت ثبت‌نام</SarvBadge>
              ) : (
                <SarvBadge variant="primary" soft size="sm">برنامه هفتگی</SarvBadge>
              )}
              <SarvBadge variant="neutral" outline size="sm">دانشگاه صنعتی خواجه نصیر</SarvBadge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-base-content flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary shrink-0" />
              برنامه هفتگی کلاس‌ها
            </h2>
            <p className="text-xs sm:text-sm text-neutral mt-1">
              ماتریس رسمی ساعات تشکیل کلاس، تالارهای آموزشی و خروجی اکسل
            </p>
          </div>

          {/* Controls: left side — same width for tabs + select */}
          <div className="w-full md:w-[340px] shrink-0 flex flex-col gap-2">
            {/* Segmented tabs with sliding indicator (like main Sidebar) */}
            <div className="sarv-seg w-full">
              {[
                { id: 'matrix', label: 'جدول برنامه', Icon: TableIcon },
                { id: 'columns', label: 'ستون روزها', Icon: LayoutGrid },
                { id: 'examCard', label: 'کارت آزمون', Icon: FileText }
              ].map(({ id, label, Icon }) => {
                const isActive = activeView === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveView(id)}
                    title={
                      id === 'matrix'
                        ? 'جدول ماتریسی رسمی بهستان'
                        : id === 'columns'
                          ? 'تفکیک بر اساس روزهای هفته'
                          : 'کارت ورود به جلسه آزمون'
                    }
                    className={`relative flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs rounded-[var(--radius-button,0.75rem)] transition-colors outline-none ${
                      isActive
                        ? 'text-primary-content font-semibold z-10'
                        : 'text-neutral hover:text-base-content font-medium z-10'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="scheduleViewPill"
                        className="absolute inset-0 bg-primary rounded-[var(--radius-button,0.75rem)] z-0 shadow-sm"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Row: term select + reload — same width as tabs above */}
            <div className="w-full flex items-stretch gap-2">
              <div className="flex-1 min-w-0">
                <SarvSelect
                  value={selectedTerm}
                  onChange={(val) => setSelectedTerm(val)}
                  options={[
                    { value: '4042', label: 'نیم‌سال دوم ۰۵-۰۴ (ترم ۲ - قطعی ۷۸)' },
                    { value: '4041', label: 'نیم‌سال اول ۰۵-۰۴ (ترم ۱ - قطعی ۷۸)' },
                    { value: '4051', label: 'نیم‌سال اول ۰۶-۰۵ (ترم جاری - گزارش ۸۸)' }
                  ]}
                />
              </div>
              <button
                type="button"
                onClick={requestScheduleRefresh}
                title="دریافت مجدد برنامه از بهستان"
                className="shrink-0 w-11 flex items-center justify-center rounded-[var(--radius-button,0.75rem)] border border-base-500/50 bg-base-500/30 text-neutral hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Course Views or Empty State */}
      {activeCourses.length === 0 && activeView !== 'examCard' ? (
        <div className="sarv-card p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-base-500/30 text-neutral flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-base-content">
              {BEHESTAN_PROFILE.isLoggedIn
                ? (selectedTerm === '4051'
                  ? 'برنامه موقت ثبت‌نام (گزارش ۸۸) دریافت نشده'
                  : 'برنامه کلاسی برای این نیم‌سال ثبت نشده است')
                : 'برنامه هفتگی و امتحانات'}
            </h3>
            <p className="text-xs text-neutral max-w-md mx-auto leading-relaxed">
              {BEHESTAN_PROFILE.isLoggedIn
                ? (selectedTerm === '4051'
                  ? 'پس از ثبت انتخاب واحد در بهستان، نتیجه به‌صورت گزارش ۸۸ همگام می‌شود. تا آن زمان دروس ثبت‌نامی ممکن است از فرم ۱۱۱۴۷ به‌صورت پیش‌نویس نمایش داده شوند.'
                  : 'اطلاعات دروس یا تاریخ امتحانات این نیم‌سال در سامانه بهستان یافت نشد.')
                : 'پس از اتصال به بهستان، برنامه هفتگی و کارت آزمون به‌صورت خودکار نمایش داده می‌شود.'}
            </p>
            {(() => {
              const available = Object.keys(schedules || {})
                .filter(k => Array.isArray(schedules[k]) && schedules[k].length > 0);
              if (!available.length) {
                return (
                  <p className="text-[11px] text-amber-300/90 max-w-lg mx-auto leading-relaxed bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                    داده‌ای هنوز دریافت نشده. یک تب باز از{' '}
                    <span className="font-mono">behestan.kntu.ac.ir</span>{' '}
                    باز بگذارید یا{' '}
                    <button
                      type="button"
                      onClick={requestScheduleRefresh}
                      className="underline font-bold cursor-pointer"
                    >
                      دریافت برنامه
                    </button>{' '}
                    بزنید. گزارش ۷۸ فقط برای ترم‌هایی که درس ثبت‌نام شده دارید پر می‌شود.
                  </p>
                );
              }
              return (
                <div className="text-[11px] text-success bg-success/10 border border-success/25 rounded-xl p-3 max-w-lg mx-auto">
                  ترم‌های موجود:{' '}
                  {available.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTerm(t)}
                      className="mx-1 underline hover:text-primary"
                    >
                      {t} ({schedules[t].length} درس)
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <>
          {/* VIEW 1: Authentic Behestan 2D Timetable Matrix (جدول رسمی برنامه هفتگی بهستان) */}
          {activeView === 'matrix' && (
        <div className="sarv-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-500/50 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-base-content">
                  جدول ماتریسی ساعات تشکیل کلاس‌ها (
                  {selectedTerm === '4042' ? 'نیم‌سال دوم ۰۵-۰۴ - قطعی' : selectedTerm === '4041' ? 'نیم‌سال اول ۰۵-۰۴ - قطعی' : 'نیم‌سال اول ۰۶-۰۵ - پیش‌نویس ثبت‌نام'}
                  )
                </h3>
              </div>
              <span className="text-xs text-neutral mt-1 block">
                {activeCourses.length} درس رسمی اخذ شده • مجموع {activeCourses.reduce((acc, c) => acc + c.units, 0)} واحد آموزشی
              </span>
            </div>

            <div className="flex items-center gap-2">
              <SarvButton variant="outline" size="sm" onClick={handleExportExcel} title="دریافت فایل اکسل گزارش ۷۸ بهستان">
                <FileSpreadsheet className="w-4 h-4 ml-1.5 text-emerald-500" />
                خروجی اکسل (Excel)
              </SarvButton>
              <SarvButton variant="outline" size="sm" onClick={() => window.print()} title="چاپ مستقیم برنامه">
                <Printer className="w-4 h-4 ml-1.5" />
                چاپ برنامه
              </SarvButton>
            </div>
          </div>

          {/* Notice banner for Registration term */}
          {selectedTerm === '4051' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
              <div>
                <span className="font-bold">برنامه هفتگی موقت در طول ثبت‌نام (گزارش ۸۸): </span>
                این دروس از فرم ۱۱۱۴۷ (نتیجه نهایی ثبت‌نام) استخراج شده‌اند. تا زمان صدور نهایی گزارش ۷۸، می‌توانید با کلیک روی هر درس ساعت و روز آن را ویرایش یا تکمیل نمایید.
              </div>
            </div>
          )}

          {/* Authentic Table Grid Matrix */}
          <div className="overflow-x-auto rounded-[var(--radius-card,1.25rem)] border border-base-500/50 bg-base/40">
            <table className="w-full text-center border-collapse min-w-[900px]">

              {/* Header: Time Slots */}
              <thead>
                <tr className="bg-base-500/30 border-b border-base-500/50 text-xs font-semibold text-base-content">
                  <th className="p-3.5 w-28 text-center text-primary bg-primary/8">
                    روز / ساعت
                  </th>
                  {TIME_SLOTS.map((slot) => (
                    <th
                      key={slot.id}
                      className={`p-3 text-center ${slot.isBreak ? 'w-24 bg-base-500/15 text-neutral text-[11px] font-normal' : 'font-medium'}`}
                    >
                      <div className="font-mono text-xs">{slot.label}</div>
                      {slot.isBreak && <div className="text-[10px] text-neutral/70 mt-0.5">استراحت</div>}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body: 5 Days as Rows */}
              <tbody className="divide-y divide-base-500/35 text-xs">
                {DAYS.map((day) => {
                  // Get courses that take place on this day
                  const dayCourses = activeCourses.filter((c) =>
                    Array.isArray(c.days) ? c.days.includes(day) : false
                  );

                  const isDayOff = dayCourses.length === 0;

                  return (
                    <tr
                      key={day}
                      className={`divide-x divide-x-reverse divide-base-500/35 transition-colors ${
                        isDayOff ? 'bg-base-500/5' : 'hover:bg-base-500/10'
                      }`}
                    >
                      {/* Day Label Cell */}
                      <td className="p-3.5 font-semibold text-base-content bg-base-500/15 text-center select-none">
                        <div className="text-sm">{day}</div>
                        {isDayOff && (
                          <span className="text-[10px] text-neutral/60 block mt-1">بدون کلاس</span>
                        )}
                      </td>

                      {/* Time Slot Cells */}
                      {TIME_SLOTS.map((slot) => {
                        // If break slot (12:30 - 13:30)
                        if (slot.isBreak) {
                          return (
                            <td key={slot.id} className="p-2 bg-base-500/10 text-center select-none">
                              <span className="text-[10px] text-neutral/40 font-mono">ـ</span>
                            </td>
                          );
                        }

                        // Find course matching this slot (از slotId یا از ساعت واقعی)
                        const matchingCourses = dayCourses.filter((c) => {
                          const ids = getCourseSlotIds(c);
                          return ids.includes(slot.id);
                        });

                        if (matchingCourses.length === 0) {
                          return (
                            <td key={slot.id} className="p-2 text-center text-neutral/20 select-none">
                              <span className="font-mono text-xs">ـ</span>
                            </td>
                          );
                        }

                        // Render matching courses in this slot
                        return (
                          <td key={slot.id} className="p-2 align-top">
                            <div className="space-y-2">
                              {matchingCourses.map((c) => (
                                <div
                                  key={`${c.id}-${day}-${slot.id}`}
                                  onClick={() => handleOpenEdit(c)}
                                  className={`${chipClass(c)} p-2.5 text-right cursor-pointer`}
                                  title="کلیک برای ویرایش"
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="font-semibold text-xs text-base-content line-clamp-1">
                                      {c.name}
                                    </span>
                                    <SarvBadge variant="primary" soft size="sm" className="shrink-0 font-mono">
                                      {toFaDigits(c.group)}
                                    </SarvBadge>
                                  </div>

                                  <div className="text-[11px] text-neutral space-y-1">
                                    <div className="flex items-center gap-1 text-base-content/80 font-mono text-[10px]">
                                      <Clock className="w-3 h-3 text-primary shrink-0" />
                                      <span>{c.time}</span>
                                    </div>
                                    <div className="flex items-center gap-1 truncate text-[10px]" title={c.hall}>
                                      <MapPin className="w-3 h-3 text-primary shrink-0" />
                                      <span className="truncate">{c.hall}</span>
                                    </div>
                                  </div>

                                  <div className="mt-2 pt-1.5 border-t border-base-500/40 flex items-center justify-between gap-1 text-[10px] text-neutral">
                                    <span className="truncate">امتحان: {toFaDigits(c.examDate)}</span>
                                    <SarvBadge variant="accent" soft size="sm" className="shrink-0">
                                      {toFaDigits(c.units)} واحد
                                    </SarvBadge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral pt-2">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'var(--theme-color-info)', opacity: 0.85 }}></span>
                <span>دروس پایه</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'var(--theme-color-success)', opacity: 0.85 }}></span>
                <span>دروس اصلی / تخصصی</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'var(--theme-color-secondary)', opacity: 0.85 }}></span>
                <span>دروس عمومی</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'var(--theme-color-primary)', opacity: 0.85 }}></span>
                <span>تکنولوژی / صنایع</span>
              </div>
            </div>
            <span className="text-[11px] text-neutral/70">
              رنگ‌ها از توکن‌های رسمی سرو و بر اساس نوع درس بهستان هستند.
            </span>
          </div>
        </div>
      )}

      {/* VIEW 2: 5-Days Column Stack Layout (نمای ستونی روزها) */}
      {activeView === 'columns' && (
        <div className="sarv-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-500/50 pb-4">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2 text-base-content">
                <LayoutGrid className="w-5 h-5 text-primary" />
                کارت‌های هفتگی به تفکیک روزها ({selectedTerm === '4042' ? 'نیم‌سال دوم ۰۵-۰۴' : selectedTerm === '4041' ? 'نیم‌سال اول ۰۵-۰۴' : 'نیم‌سال اول ۰۶-۰۵'})
              </h3>
              <span className="text-xs text-neutral">
                {activeCourses.length} درس رسمی • روزهای بدون کلاس به صورت خودکار تفکیک شده‌اند
              </span>
            </div>

            <SarvButton variant="primary" styleType="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="w-4 h-4 ml-1.5 text-success" />
              خروجی اکسل
            </SarvButton>
          </div>

          {/* 5-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {DAYS.map((day) => {
              // Strict match: only courses whose `days` array strictly includes this day!
              const dayCourses = activeCourses.filter((c) =>
                Array.isArray(c.days) ? c.days.includes(day) : false
              );

              return (
                <div key={day} className="space-y-3">
                  {/* Day Header Pill */}
                  <div className="p-3 rounded-[var(--radius-button,0.75rem)] bg-base-500/30 border border-base-500/50 text-center text-xs font-semibold text-base-content">
                    {day}
                  </div>

                  {/* Day Courses Stack */}
                  <div className="space-y-3 min-h-[300px]">
                    {dayCourses.length > 0 ? (
                      dayCourses.map((c) => (
                        <div
                          key={`${c.id}-${day}`}
                          onClick={() => handleOpenEdit(c)}
                          className={`${chipClass(c)} p-4 space-y-2.5 text-right group cursor-pointer`}
                          title="برای ویرایش روز و ساعت کلیک کنید"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-primary font-semibold">
                              {c.time}
                            </span>
                            <div className="flex items-center gap-1">
                              <SarvBadge variant="accent" soft size="sm">
                                {toFaDigits(c.units)} واحد
                              </SarvBadge>
                              <Edit3 className="w-3 h-3 text-neutral opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>

                          <h4 className="text-xs font-semibold text-base-content group-hover:text-primary transition-colors line-clamp-2">
                            {c.name}
                          </h4>

                          <div className="text-[11px] text-neutral space-y-1 pt-1.5 border-t border-base-500/40">
                            <div className="flex justify-between">
                              <span>گروه</span>
                              <span className="font-mono font-semibold text-base-content">{toFaDigits(c.group)}</span>
                            </div>
                            <div className="flex items-center gap-1 truncate" title={c.hall}>
                              <MapPin className="w-3 h-3 text-primary shrink-0" />
                              <span className="truncate">{c.hall}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full min-h-[160px] rounded-2xl border border-dashed border-base-500/40 flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-xs text-neutral/50 font-medium">بدون کلاس</span>
                        <span className="text-[10px] text-neutral/30 mt-1">برنامه‌ریزی نشده</span>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: Official Report 428 Exam Card */}
      {activeView === 'examCard' && (
        <div className="sarv-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-500/40 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <SarvBadge variant="primary" soft size="sm">گزارش ۴۲۸</SarvBadge>
                {examList.some(e => e.isLive) ? (
                  <SarvBadge variant="success" size="sm" dot>داده زنده</SarvBadge>
                ) : (
                  <SarvBadge variant="neutral" outline size="sm">مشتق از برنامه ۷۸</SarvBadge>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-base-content">
                برنامه امتحانات پایان‌ترم
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <SarvButton variant="primary" styleType="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4 ml-1.5" />
                چاپ
              </SarvButton>
            </div>
          </div>

          {/* Student header — no fake barcode */}
          <div className="p-4 rounded-[var(--radius-card,1rem)] bg-base-500/20 border border-base-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <SarvAvatar
                photo={BEHESTAN_PROFILE.photo}
                fullName={BEHESTAN_PROFILE.fullName}
                size="lg"
                isLoggedIn={BEHESTAN_PROFILE.isLoggedIn}
              />
              <div className="space-y-0.5 text-xs text-right">
                <div className="font-semibold text-sm text-base-content">{BEHESTAN_PROFILE.fullName}</div>
                <div className="text-neutral">
                  شماره دانشجویی:{' '}
                  <span className="font-mono font-semibold text-base-content">
                    {toFaDigits(BEHESTAN_PROFILE.studentId)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-neutral">
              {examList.length > 0
                ? `${toFaDigits(examList.length)} امتحان در این نیم‌سال`
                : 'امتحانی ثبت نشده'}
            </div>
          </div>

          {examList.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-semibold text-base-content">
                هنوز برنامه امتحان پایان‌ترم در بهستان ثبت نشده است
              </p>
              <p className="text-xs text-neutral max-w-md mx-auto">
                پس از اعلام رسمی آموزش، گزارش ۴۲۸ به‌صورت خودکار در این بخش نمایش داده می‌شود.
                تا آن زمان می‌توانید تاریخ امتحان دروس را در «جدول برنامه» ببینید.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[var(--radius-card,1rem)] border border-base-500/40">
              <table className="w-full text-right text-xs">
                <thead className="bg-base-500/30 text-neutral font-semibold border-b border-base-500/40">
                  <tr>
                    <th className="p-3">ردیف</th>
                    <th className="p-3">کد و گروه</th>
                    <th className="p-3">نام درس</th>
                    <th className="p-3">روز</th>
                    <th className="p-3">تاریخ و ساعت</th>
                    <th className="p-3">محل</th>
                    <th className="p-3">استاد / مراقب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-500/30 text-base-content">
                  {examList.map((exam, index) => (
                    <motion.tr
                      key={exam.id || index}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="hover:bg-base-500/15 transition-colors"
                    >
                      <td className="p-3 font-mono text-neutral">{toFaDigits(index + 1)}</td>
                      <td className="p-3 font-mono font-semibold text-primary">
                        {exam.codeGroup || toFaDigits(exam.code || '')}
                      </td>
                      <td className="p-3 font-semibold">{exam.name}</td>
                      <td className="p-3">{exam.day}</td>
                      <td className="p-3">
                        <div className="font-semibold text-warn">{exam.examDate}</div>
                        <div className="text-neutral font-mono text-[11px]">{exam.examTime}</div>
                      </td>
                      <td className="p-3 text-neutral">{exam.hall}</td>
                      <td className="p-3 text-neutral">{exam.professor || exam.invigilator || 'ـ'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* Interactive Modal to Edit Course Day / Time / Hall */}
      <AnimatePresence>
        {editingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="sarv-card p-6 w-full max-w-md space-y-4 border border-base-500/80 shadow-2xl bg-base"
            >
              <div className="flex items-center justify-between border-b border-base-500/40 pb-3">
                <h3 className="font-bold text-sm text-base-content flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-primary" />
                  ویرایش مشخصات درس: {editingCourse.name}
                </h3>
                <button
                  onClick={() => setEditingCourse(null)}
                  className="p-1 rounded-lg hover:bg-base-500/30 text-neutral hover:text-base-content"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-right">
                <div>
                  <label className="text-xs text-neutral mb-1 block">روزهای تشکیل کلاس (با اسلش جدا کنید):</label>
                  <SarvInput
                    value={editDaysStr}
                    onChange={(e) => setEditDaysStr(e.target.value)}
                    placeholder="مثال: یکشنبه / سه‌شنبه"
                  />
                  <span className="text-[10px] text-neutral/60 mt-1 block">
                    روزهای مجاز: شنبه، یکشنبه، دوشنبه، سه‌شنبه، چهارشنبه
                  </span>
                </div>

                <div>
                  <label className="text-xs text-neutral mb-1 block">ساعت تشکیل کلاس:</label>
                  <SarvInput
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    placeholder="مثال: ۰۹:۰۰ - ۱۰:۳۰"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral mb-1 block">محل کلاس و تالار:</label>
                  <SarvInput
                    value={editHall}
                    onChange={(e) => setEditHall(e.target.value)}
                    placeholder="مثال: دانشکده مهندسی مکانیک - کلاس ۲۰۱"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-500/40">
                  <SarvButton
                    type="button"
                    variant="flat"
                    size="sm"
                    onClick={() => setEditingCourse(null)}
                  >
                    انصراف
                  </SarvButton>
                  <SarvButton type="submit" variant="primary" size="sm">
                    <Check className="w-4 h-4 ml-1" />
                    ذخیره تغییرات
                  </SarvButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
