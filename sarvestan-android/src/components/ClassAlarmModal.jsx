import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BellRing,
  AlarmClock,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  Sparkles,
  Volume2,
  CalendarCheck,
  Settings,
  Layers,
  Check,
  UtensilsCrossed,
  ExternalLink,
} from 'lucide-react';
import {
  isNativeAlarms,
  hasClassAlarmPlugin,
  scheduleClassReminders,
  importSystemAlarms,
  importAlarmsForCourse,
  cancelAllReminders,
  testClassNotification,
  openNotificationSettings,
  requestNotificationPermission,
  checkNotificationPermission,
  checkExactPermission,
  requestExactPermission,
  getReminderSettings,
  saveReminderSettings,
  collectWeeklySlots,
  getSamadReminderSettings,
  saveSamadReminderSettings,
  updateSamadReminder,
  testSamadNotification,
  SAMAD_URL,
} from '../services/classAlarms';
import { toFaDigits } from '../utils/faDigits';
import SarvCheckbox from './SarvCheckbox';
import SarvTimePickerModal from './SarvTimePickerModal';

const LEAD_TIME_OPTIONS = [
  { value: 5, label: '۵ دقیقه قبل' },
  { value: 10, label: '۱۰ دقیقه قبل' },
  { value: 15, label: '۱۵ دقیقه قبل' },
  { value: 20, label: '۲۰ دقیقه قبل' },
];

export default function ClassAlarmModal({ isOpen, onClose }) {
  const [leadMinutes, setLeadMinutes] = useState(10);
  const [notifyAtStart, setNotifyAtStart] = useState(true);
  const [samadEnabled, setSamadEnabled] = useState(false);
  const [samadTime, setSamadTime] = useState('14:00');
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [notifGranted, setNotifGranted] = useState(true);
  const [busyAction, setBusyAction] = useState(null); // 'reminders' | 'clock' | 'test' | 'cancel' | 'samad' | 'samad-test' | 'perm' | null
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error' | 'info', text: string, showSettings?: boolean }
  const [coursesList, setCoursesList] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const settings = getReminderSettings();
      setLeadMinutes(settings.leadMinutes || 10);
      setNotifyAtStart(settings.notifyAtStart !== false);

      const samadSettings = getSamadReminderSettings();
      setSamadEnabled(Boolean(samadSettings.enabled));
      const sh = String(samadSettings.hour ?? 14).padStart(2, '0');
      const sm = String(samadSettings.minute ?? 0).padStart(2, '0');
      setSamadTime(`${sh}:${sm}`);

      setFeedback(null);

      // بررسی وضعیت دسترسی اعلان‌ها
      const checkPerm = async () => {
        try {
          const res = await checkNotificationPermission();
          setNotifGranted(res?.granted !== false);
        } catch {}
      };
      checkPerm();
      window.addEventListener('focus', checkPerm);

      // دریافت لیست دروس و جلسات با اطلاعات کامل (نام، روز، ساعت دقیق)
      const slots = collectWeeklySlots();
      setCoursesList(slots);

      return () => {
        window.removeEventListener('focus', checkPerm);
      };
    }
  }, [isOpen]);

  const showMsg = (text, type = 'success', showSettings = false) => {
    setFeedback({ text, type, showSettings });
  };

  const handleRequestPermission = async () => {
    if (busyAction) return;
    setBusyAction('perm');
    setFeedback(null);
    try {
      const res = await requestNotificationPermission();
      if (res?.granted) {
        setNotifGranted(true);
        showMsg('دسترسی نوتیفیکیشن با موفقیت تأیید و فعال شد.', 'success');
      } else {
        await openNotificationSettings();
        showMsg('لطفاً در صفحه تنظیمات باز شده، دسترسی اعلان (Notifications) را برای سروستان فعال کنید.', 'error', true);
      }
    } catch {
      await openNotificationSettings();
    } finally {
      setBusyAction(null);
    }
  };

  const handleApplyReminders = async () => {
    if (busyAction) return;
    setBusyAction('reminders');
    setFeedback(null);
    try {
      const notifPerm = await requestNotificationPermission();
      if (notifPerm && notifPerm.granted === false) {
        showMsg('دسترسی نوتیفیکیشن داده نشد. لطفاً در تنظیمات گوشی اجازه دهید.', 'error', true);
        return;
      }
      const exact = await checkExactPermission();
      if (exact && exact.ok === false) {
        await requestExactPermission();
      }

      saveReminderSettings({
        enabled: true,
        leadMinutes,
        notifyAtStart,
      });

      const res = await scheduleClassReminders({
        daysAhead: 7,
        leadMinutes,
        notifyAtStart,
        includeSamad: samadEnabled,
      });

      if (!res.ok) {
        showMsg(res.error || 'خطا در ثبت یادآورها', 'error');
      } else {
        const count = res.scheduled || 0;
        showMsg(
          count > 0
            ? `${toFaDigits(count)} یادآور هوشمند برای کلاس‌های هفته${samadEnabled ? ' و سامانه سماد' : ''} تنظیم شد.`
            : res.message || 'جلسه‌ای برای یادآوری یافت نشد.',
          'success',
        );
      }
    } catch (e) {
      showMsg(String(e?.message || e), 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleToggleSamad = async (nextState) => {
    setSamadEnabled(nextState);
    const [hStr, mStr] = samadTime.split(':');
    const hour = parseInt(hStr, 10) || 14;
    const minute = parseInt(mStr, 10) || 0;

    if (nextState) {
      const notifPerm = await requestNotificationPermission();
      if (notifPerm && notifPerm.granted === false) {
        showMsg('دسترسی نوتیفیکیشن داده نشد. لطفاً در تنظیمات گوشی اجازه دهید.', 'error', true);
      }
      const exact = await checkExactPermission();
      if (exact && exact.ok === false) {
        await requestExactPermission();
      }
    }

    setBusyAction('samad');
    try {
      const res = await updateSamadReminder({
        enabled: nextState,
        hour,
        minute,
      });

      if (!res.ok) {
        showMsg(res.error || 'خطا در ثبت یادآور سماد', 'error');
      } else if (nextState) {
        showMsg(`یادآور سماد فعال شد؛ هر چهارشنبه ساعت ${toFaDigits(samadTime)} نوتیفیکیشن ورود به سماد ارسال می‌شود.`, 'success');
      } else {
        showMsg('یادآور رزرو غذای سماد غیرفعال شد.', 'info');
      }
    } catch (e) {
      showMsg(String(e?.message || e), 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleChangeSamadTime = async (newTimeStr) => {
    if (!newTimeStr) return;
    setSamadTime(newTimeStr);
    const [hStr, mStr] = newTimeStr.split(':');
    const hour = parseInt(hStr, 10) || 14;
    const minute = parseInt(mStr, 10) || 0;
    saveSamadReminderSettings({
      enabled: samadEnabled,
      hour,
      minute,
    });
    if (samadEnabled) {
      await updateSamadReminder({
        enabled: true,
        hour,
        minute,
      });
      showMsg(`ساعت یادآوری سماد به ${toFaDigits(newTimeStr)} در روزهای چهارشنبه تغییر یافت.`, 'success');
    }
  };

  const handleTestSamadNotification = async () => {
    if (busyAction) return;
    setBusyAction('samad-test');
    setFeedback(null);
    try {
      await requestNotificationPermission();
      const res = await testSamadNotification();
      if (res.ok) {
        showMsg('اعلان تستی سماد ارسال شد! با کلیک روی آن وارد سامانه سماد خواهید شد.', 'success');
      } else if (res.disabled) {
        showMsg(res.error || 'اعلان‌های برنامه در تنظیمات گوشی غیرفعال است.', 'error', true);
      } else {
        showMsg(res.error || 'خطا در ارسال نوتیفیکیشن آزمایشی سماد', 'error');
      }
    } catch (e) {
      showMsg(String(e?.message || e), 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleExportSingle = async (course) => {
    if (busyAction || !course) return;
    setBusyAction('clock');
    setFeedback(null);
    try {
      const res = await importAlarmsForCourse(course, { skipUi: false });
      if (res.ok && res.opened > 0) {
        if (res.fallback) {
          showMsg(`برنامه ساعت اصلی گوشی باز شد. لطفاً ساعت کلاس «${course.name || course.title}» را ثبت نمایید.`, 'success');
        } else {
          showMsg(
            `آلارم درس «${course.name || course.title}» (${course.day} ساعت ${toFaDigits(course.time)}) در برنامه ساعت اصلی گوشی باز شد. لطفاً ذخیره نمایید.`,
            'success',
          );
        }
      } else {
        showMsg(res.error || 'برنامه ساعت زنگ‌دار گوشی باز نشد.', 'error');
      }
    } catch (e) {
      showMsg(String(e?.message || e), 'error');
    } finally {
      setBusyAction(null);
    }
  };


  const handleTestNotification = async () => {
    if (busyAction) return;
    setBusyAction('test');
    setFeedback(null);
    try {
      await requestNotificationPermission();
      const res = await testClassNotification();
      if (res.ok) {
        showMsg('اعلان تستی ارسال شد! بالای صفحه گوشی (نوار اعلان‌ها) را بررسی کنید.', 'success');
      } else if (res.disabled) {
        showMsg(res.error || 'اعلان‌های برنامه در تنظیمات گوشی غیرفعال است.', 'error', true);
      } else {
        showMsg(res.error || 'خطا در ارسال نوتیفیکیشن آزمایشی', 'error');
      }
    } catch (e) {
      showMsg(String(e?.message || e), 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleCancelAll = async () => {
    if (busyAction) return;
    setBusyAction('cancel');
    setFeedback(null);
    try {
      const res = await cancelAllReminders();
      if (res.ok) {
        saveReminderSettings({ enabled: false });
        saveSamadReminderSettings({ enabled: false, hour: 14, minute: 0 });
        setSamadEnabled(false);
        showMsg('تمام یادآورهای فعال کلاس‌ها و سماد لغو شدند.', 'info');
      } else {
        showMsg(res.error || 'خطا در لغو یادآورها', 'error');
      }
    } catch (e) {
      showMsg(String(e?.message || e), 'error');
    } finally {
      setBusyAction(null);
    }
  };


  return (
    <>
      <AnimatePresence>
        {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* پس‌زمینه تیره با بلر ملایم و انیمیشن محو خروج */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* کانتینر اصلی مودال — با رنگ زمینه کاملاً کدر bg-base و انیمیشن اسلاید نرم */}
          <motion.div
            key="modal-panel"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/40 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* هدر مودال */}
            <div className="p-4 border-b border-base-500/30 flex items-center justify-between bg-base-500/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-primary/15 text-primary grid place-items-center shrink-0 shadow-sm">
                  <BellRing className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-[14.5px] font-black text-base-content">
                    تنظیم یادآور و آلارم کلاس‌ها
                  </h3>
                  <p className="text-[11px] text-neutral">
                    نوتیفیکیشن هوشمند داخلی و ساعت زنگ‌دار اصلی گوشی
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-base-500/20 hover:bg-base-500/35 text-neutral hover:text-base-content grid place-items-center transition active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* پیام وضعیت و فیدبک شناور/ثابت بالای مودال — همیشه در دید حتی هنگام اسکرول */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`p-3 mx-4 mt-3 rounded-2xl flex items-start gap-2.5 text-[12px] font-medium border shadow-md shrink-0 ${
                    feedback.type === 'error'
                      ? 'bg-danger-soft text-danger border-danger/25'
                      : feedback.type === 'info'
                        ? 'bg-info-soft text-info border-info/25'
                        : 'bg-success-soft text-success border-success/25'
                  }`}
                >
                  {feedback.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 leading-relaxed">
                    <p>{feedback.text}</p>
                    {feedback.showSettings && (
                      <button
                        type="button"
                        onClick={openNotificationSettings}
                        className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-base text-base-content font-bold border border-base-500/30 shadow-xs text-[11px] hover:bg-base-500/20 transition"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        باز کردن تنظیمات اعلان در گوشی
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* بدنه اسکرول‌شونده */}
            <div className="p-4 space-y-4 overflow-y-auto">

              {/* اخطار عدم اعطای مجوز نوتیفیکیشن با دکمه مستقیم اعطای دسترسی */}
              {!notifGranted && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-2xl bg-danger-soft text-danger border border-danger/30 space-y-2.5 shadow-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-danger/15 text-danger grid place-items-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-danger" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-black text-danger leading-tight">
                        دسترسی ارسال اعلان غیرفعال است!
                      </h4>
                      <p className="text-[11.5px] text-danger/85 leading-relaxed mt-1">
                        برای دریافت اعلان‌های هوشمند پیش از شروع کلاس‌ها و یادآور رزرو غذای سماد در روزهای چهارشنبه، لازم است مجوز نوتیفیکیشن داده شود.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      disabled={busyAction === 'perm'}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-danger text-white text-[11.5px] font-bold shadow-xs hover:bg-danger/90 active:scale-95 transition disabled:opacity-50"
                    >
                      {busyAction === 'perm' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <BellRing className="w-3.5 h-3.5" />
                      )}
                      اعطای دسترسی اعلان
                    </button>
                    <button
                      type="button"
                      onClick={openNotificationSettings}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-base text-base-content border border-base-500/30 text-[11.5px] font-bold hover:bg-base-500/20 active:scale-95 transition"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      تنظیمات گوشی
                    </button>
                  </div>
                </motion.div>
              )}

              {/* بخش ۱: نوتیفیکیشن هوشمند سروستان */}
              <div className="sarv-card bg-base-500/10 border border-base-500/30 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-[13px] font-bold text-base-content">
                      یادآور هوشمند هفتگی (نوتیفیکیشن اپ)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    پیشنهادی
                  </span>
                </div>

                <p className="text-[11.5px] text-neutral leading-relaxed">
                  قبل از شروع هر جلسه، اعلان هوشمند با صدا و لرزش همراه با نام درس، استاد و شماره کلاس ارسال می‌شود.
                </p>

                {/* انتخاب بازه پیش‌آگاهی */}
                <div>
                  <label className="text-[11px] font-bold text-neutral block mb-1.5">
                    زمان ارسال اعلان پیش از کلاس:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {LEAD_TIME_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setLeadMinutes(opt.value)}
                        className={`py-1.5 px-2 rounded-xl text-[11.5px] font-medium border transition-all ${
                          leadMinutes === opt.value
                            ? 'bg-primary text-primary-content border-primary font-bold shadow-sm'
                            : 'bg-base text-base-content border-base-500/30 hover:border-primary/40'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* چک‌باکس رسمی سرو یوآی */}
                <div className="p-2.5 rounded-xl bg-base border border-base-500/25">
                  <SarvCheckbox
                    checked={notifyAtStart}
                    onChange={setNotifyAtStart}
                    label="اعلان تکمیلی در لحظه شروع کلاس"
                    description="ارسال نوتیفیکیشن دقیقاً در ساعت آغاز جلسه"
                    variant="primary"
                  />
                </div>

                {/* دکمه‌های اقدام بخش نوتیفیکیشن */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleApplyReminders}
                    disabled={Boolean(busyAction)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-content text-[12px] font-bold shadow-sm hover:bg-primary/90 transition disabled:opacity-50 active:scale-95"
                  >
                    {busyAction === 'reminders' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <BellRing className="w-4 h-4" />
                    )}
                    فعالسازی یادآورهای هفتگی
                  </button>

                  <button
                    type="button"
                    onClick={handleTestNotification}
                    disabled={Boolean(busyAction)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-base text-base-content border border-base-500/30 text-[12px] font-bold hover:bg-base-500/20 transition disabled:opacity-50 active:scale-95"
                  >
                    {busyAction === 'test' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-primary" />
                    )}
                    تست نوتیفیکیشن (ارسال آنی)
                  </button>
                </div>

                {/* لغو و پاکسازی یادآورهای هوشمند */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleCancelAll}
                    disabled={Boolean(busyAction)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-danger-soft text-danger hover:bg-danger/20 border border-danger/20 text-[12px] font-bold shadow-2xs active:scale-95 transition disabled:opacity-50"
                  >
                    {busyAction === 'cancel' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    لغو و پاکسازی یادآورهای فعال
                  </button>
                </div>
              </div>

              {/* بخش ۲: یادآور هفتگی رزرو غذای سماد */}
              <div className="sarv-card bg-base-500/10 border border-base-500/30 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-warning" />
                    <span className="text-[13px] font-bold text-base-content">
                      یادآور رزرو غذای سلف (سامانه سماد)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
                    چهارشنبه‌ها
                  </span>
                </div>

                <p className="text-[11.5px] text-neutral leading-relaxed">
                  هر چهارشنبه اعلان یادآوری جهت رزرو غذای هفته آینده سلف با امکان ورود مستقیم به سامانه سماد با یک لمس دریافت کنید.
                </p>

                {/* ردیف سوییچ اختصاصی فعالسازی */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-base border border-base-500/25">
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="text-[12.5px] font-bold text-base-content">
                      یادآوری رزرو غذای چهارشنبه‌ها
                    </span>
                    <span className="text-[11px] text-neutral mt-0.5">
                      {samadEnabled
                        ? `فعال — ارسال هر چهارشنبه ساعت ${toFaDigits(samadTime)}`
                        : 'غیرفعال'}
                    </span>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    dir="ltr"
                    aria-checked={samadEnabled}
                    onClick={() => handleToggleSamad(!samadEnabled)}
                    disabled={busyAction === 'samad'}
                    className={`w-12 h-6.5 p-0.5 rounded-full transition-colors flex items-center shrink-0 cursor-pointer ${
                      samadEnabled ? 'bg-primary justify-end' : 'bg-base-500/40 justify-start'
                    }`}
                  >
                    <motion.span
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-5.5 h-5.5 rounded-full bg-white shadow-md pointer-events-none"
                    />
                  </button>
                </div>

                {/* تنظیم ساعت و پیش‌نمایش در صورت فعال بودن سوییچ */}
                {samadEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 pt-1"
                  >
                    {/* ردیف باز کردن مودال چرخشی تنظیم ساعت */}
                    <div className="p-3 rounded-2xl bg-base border border-base-500/25 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-warning/15 text-warning grid place-items-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </span>
                        <div>
                          <span className="text-[12.5px] font-bold text-base-content block">
                            ساعت ارسال اعلان
                          </span>
                          <span className="text-[11px] text-neutral mt-0.5">
                            چهارشنبه‌ها ساعت {toFaDigits(samadTime)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setTimePickerOpen(true)}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-warning/15 hover:bg-warning/25 text-warning border border-warning/30 text-[12px] font-bold transition active:scale-95 shadow-2xs cursor-pointer"
                      >
                        <span className="font-mono text-[13px] font-black" dir="ltr">{toFaDigits(samadTime)}</span>
                        <span className="text-[10.5px] px-1.5 py-0.5 rounded-md bg-warning/20 text-warning font-semibold">تغییر ساعت</span>
                      </button>
                    </div>

                    {/* پیش‌نمایش نوتیفیکیشن سماد */}
                    <div className="p-2.5 rounded-xl bg-base border border-base-500/25 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-warning">
                        <span>🍽️ یادآوری رزرو غذای سماد</span>
                      </div>
                      <p className="text-[11px] text-neutral leading-relaxed">
                        فرصت رزرو غذای هفته آینده سلف رو به اتمامه! برای ورود به سامانه سماد کلیک کنید.
                      </p>
                    </div>

                    {/* دکمه‌های تست و ورود به سماد */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleTestSamadNotification}
                        disabled={Boolean(busyAction)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-base text-base-content border border-base-500/30 text-[11.5px] font-bold hover:bg-base-500/20 transition active:scale-95 disabled:opacity-50"
                      >
                        {busyAction === 'samad-test' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-warning" />
                        )}
                        تست اعلان سماد (ارسال آنی)
                      </button>

                      <a
                        href={SAMAD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-warning/15 hover:bg-warning/25 text-warning border border-warning/25 text-[11.5px] font-bold transition active:scale-95"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        ورود به سامانه سماد
                      </a>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* بخش ۳: ساعت زنگ‌دار گوشی (Clock App) */}
              <div className="sarv-card bg-base-500/10 border border-base-500/30 p-3.5 space-y-3">
                <div className="flex items-center gap-2">
                  <AlarmClock className="w-4 h-4 text-info" />
                  <span className="text-[13px] font-bold text-base-content">
                    افزودن به ساعت زنگ‌دار گوشی (Alarm Clock)
                  </span>
                </div>
                <p className="text-[11.5px] text-neutral leading-relaxed">
                  می‌توانید برای کلاس‌های دلخواه مستقیماً در اپلیکیشن ساعت اصلی اندروید (بدون تداخل با برنامه‌های دیگر) آلارم هفتگی تنظیم کنید.
                </p>

                {/* لیست کارت‌های دروس با دکمه تنظیم مستقیم ساعت */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-neutral block">
                    انتخاب درس برای تنظیم در ساعت گوشی:
                  </label>

                  {coursesList.length > 0 ? (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                      {coursesList.map((c, i) => (
                        <div
                          key={c.id || i}
                          className="w-full p-2.5 rounded-xl border border-base-500/20 bg-base text-base-content text-right transition-all flex items-center justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-bold truncate leading-tight">
                              {c.name || c.title}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-[10.5px] text-neutral">
                              <span className="font-semibold text-base-content/80">
                                {c.day}
                              </span>
                              <span>·</span>
                              <span className="font-mono font-bold text-primary">
                                ساعت {toFaDigits(c.time || `${c.hour}:${c.minute}`)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleExportSingle(c)}
                            disabled={Boolean(busyAction)}
                            className="mr-2 px-2.5 py-1.5 rounded-xl bg-info-soft hover:bg-info/20 text-info text-[11px] font-bold border border-info/20 flex items-center gap-1 shrink-0 transition active:scale-95 disabled:opacity-50"
                            title="تنظیم مستقیم این درس در ساعت گوشی"
                          >
                            <AlarmClock className="w-3.5 h-3.5" />
                            <span>تنظیم ساعت</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-neutral text-center py-2">
                      جلسه‌ای در برنامه هفتگی یافت نشد.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* مودال چرخشی شبیه ساعت موبایل برای انتخاب ساعت سماد */}
    <SarvTimePickerModal
      isOpen={timePickerOpen}
      initialTime={samadTime}
      title="تنظیم ساعت یادآوری سماد"
      subtitle="ارسال اعلان رزرو در روزهای چهارشنبه"
      onClose={() => setTimePickerOpen(false)}
      onConfirm={(newTime) => handleChangeSamadTime(newTime)}
    />
  </>
  );
}
