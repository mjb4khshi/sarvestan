import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  CheckCircle2,
  Trash2,
  Clock,
  Flame,
  BarChart3,
  Download,
  Share2,
  CalendarDays,
  Calendar,
  Tag,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Copy,
  X,
  History,
  Grid,
  School,
  ArrowLeft,
  ArrowRight,
  Filter,
  Sliders,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Radio,
  Moon,
  Sun,
  Target,
  GraduationCap,
  MapPin,
  AlertCircle,
  CalendarPlus,
  Columns3,
  CheckSquare,
  ListTodo,
  CalendarCheck,
  Bell,
  CalendarRange,
  Pencil,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getViewModel, getToneForCourse, getExamsView, jalaliToDate } from '../data/viewModel';
import { toFaDigits } from '../utils/faDigits';
import {
  getStudyTasks,
  saveStudyTask,
  deleteStudyTask,
  updateTaskStatus,
  getStudySessions,
  logStudySession,
  updateStudySession,
  deleteStudySession,
  getDailyActivityMap,
  calculateStudyStats,
  exportStudyDataCsv,
  POMO_MODES,
  TASK_COLUMNS,
} from '../services/studyPlanner';
import {
  playFocusChime,
  triggerHaptic,
  requestScreenWakeLock,
  releaseScreenWakeLock,
  persistTimerState,
  getPersistedTimerState,
  clearPersistedTimerState,
  notifyTimerFinished,
  requestNotificationPermission,
} from '../services/studyTimerEngine';
import {
  renderStudyStoryImage,
  canvasToDataUrl,
  shareCanvas,
  saveCanvasImage,
  copyCanvasToClipboard,
} from '../services/shareImages';
import {
  getPersianMonthGrid,
  getPersianParts,
  getYearlyHeatmapWeeks,
  formatFullPersianDate,
  formatMinutesHuman,
  toLocalDateString,
} from '../services/calendarHelper';
import OdometerNumber from '../components/OdometerNumber';
import ExamEditModal from '../components/ExamEditModal';
import SarvDatePickerModal from '../components/SarvDatePickerModal';
import NativeCourseSelector from '../components/NativeCourseSelector';
import {
  subscribeStore,
  addExamToStore,
  updateExamInStore,
  deleteExamFromStore,
  resolveCurrentTermId,
} from '../services/behestan';
import { exportExamToCalendar, startNativeLiveTimer, stopNativeLiveTimer, scheduleTaskReminder, cancelTaskReminder } from '../services/classAlarms';
import SarvTimePickerModal from '../components/SarvTimePickerModal';
import SarvSwitch from '../components/SarvSwitch';
import SarvCheckbox from '../components/SarvCheckbox';

const STUDY_MAIN_TABS = [
  { id: 'pomo', label: 'تایمر', Icon: Clock },
  { id: 'kanban', label: 'کارها', Icon: CalendarDays },
  { id: 'calendar', label: 'تقویم', Icon: Calendar },
  { id: 'stats', label: 'آمار', Icon: BarChart3 },
];

const toneClasses = {
  primary: 'border-r-primary text-primary bg-primary-soft',
  info: 'border-r-info text-info bg-info-soft',
  success: 'border-r-success text-success bg-success-soft',
  secondary: 'border-r-secondary text-secondary bg-secondary-soft',
  accent: 'border-r-accent text-accent bg-accent-soft',
  warn: 'border-r-warn text-warn bg-warn-soft',
  danger: 'border-r-danger text-danger bg-danger-soft',
};

const toneColors = {
  primary: {
    bg: 'bg-primary-soft',
    text: 'text-primary',
    border: 'border-primary/40',
    dot: 'bg-primary',
  },
  info: {
    bg: 'bg-info-soft',
    text: 'text-info',
    border: 'border-info/40',
    dot: 'bg-info',
  },
  success: {
    bg: 'bg-success-soft',
    text: 'text-success',
    border: 'border-success/40',
    dot: 'bg-success',
  },
  secondary: {
    bg: 'bg-secondary-soft',
    text: 'text-secondary',
    border: 'border-secondary/40',
    dot: 'bg-secondary',
  },
  accent: {
    bg: 'bg-accent-soft',
    text: 'text-accent',
    border: 'border-accent/40',
    dot: 'bg-accent',
  },
  warn: {
    bg: 'bg-warn-soft',
    text: 'text-warn',
    border: 'border-warn/40',
    dot: 'bg-warn',
  },
  danger: {
    bg: 'bg-danger-soft',
    text: 'text-danger',
    border: 'border-danger/40',
    dot: 'bg-danger',
  },
};

const PRIORITY_CONFIG = {
  high: {
    label: 'اولویت بالا',
    shortLabel: 'بالا',
    color: 'text-danger bg-danger-soft border-danger/40',
    weight: 1,
    icon: Flame,
  },
  medium: {
    label: 'اولویت متوسط',
    shortLabel: 'متوسط',
    color: 'text-warn bg-warn-soft border-warn/40',
    weight: 2,
    icon: Sparkles,
  },
  low: {
    label: 'اولویت عادی',
    shortLabel: 'عادی',
    color: 'text-info bg-info-soft border-info/40',
    weight: 3,
    icon: Tag,
  },
};

export default function StudyScreen({ onNavigate }) {
  const todayIso = toLocalDateString(new Date());
  const { activeThemeMeta } = useTheme();
  const [storeVer, setStoreVer] = useState(0);

  useEffect(() => {
    return subscribeStore(() => setStoreVer((v) => v + 1));
  }, []);

  const vm = getViewModel();
  const coursesList = vm.scheduleCourses || [];
  const examsList = getExamsView() || vm.exams || [];

  // راهکار یکپارچه رنگ دروس جهت تطابق ۱۰۰٪ با برنامه هفتگی و انتخاب کاربر
  const getCourseColor = (courseOrName) => {
    if (!courseOrName) return 'primary';
    if (typeof courseOrName === 'object' && courseOrName.color) return courseOrName.color;
    const name = typeof courseOrName === 'object'
      ? (courseOrName.name || courseOrName.courseName || courseOrName.title)
      : courseOrName;
    const matched = coursesList.find(
      (c) => c.name === name || (c.code && courseOrName?.code && c.code === courseOrName.code)
    );
    if (matched?.color) return matched.color;
    return getToneForCourse(courseOrName, coursesList);
  };

  // استیت ویرایش و افزودن امتحان
  const [editingExam, setEditingExam] = useState(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('pomo'); // 'pomo' | 'kanban' | 'calendar' | 'stats'
  const [monthSlideDir, setMonthSlideDir] = useState(1);
  const [tasks, setTasks] = useState(() => getStudyTasks());
  const [sessions, setSessions] = useState(() => getStudySessions());
  const [stats, setStats] = useState(() => calculateStudyStats());
  const [activityMap, setActivityMap] = useState(() => getDailyActivityMap());

  // رفرنس اسکرول هیت‌مپ و سلول امروز
  const heatmapScrollRef = useRef(null);
  const todayCellRef = useRef(null);

  // تایمر و تمرکز استیت (مستقل برای تایمر دلخواه و کرنومتر آزاد تا جابجایی بین تب‌ها مقادیر را صفر نکند)
  const [pomoMode, setPomoMode] = useState('custom'); // 'custom' | 'stopwatch'
  const [customMinutes, setCustomMinutes] = useState(30);
  const [customSecondsLeft, setCustomSecondsLeft] = useState(30 * 60);
  const [customRunning, setCustomRunning] = useState(false);
  const [customSessionSeconds, setCustomSessionSeconds] = useState(0);

  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchSessionSeconds, setStopwatchSessionSeconds] = useState(0);

  const [selectedCourse, setSelectedCourse] = useState(coursesList[0]?.name || 'عمومی');
  const [selectedTaskId, setSelectedTaskId] = useState('');

  // محاسبات کمکی حالت فعال
  const isCustom = pomoMode === 'custom';
  const currentSeconds = isCustom ? customSecondsLeft : stopwatchSeconds;
  const timerRunning = isCustom ? customRunning : stopwatchRunning;
  const sessionSecondsCount = isCustom ? customSessionSeconds : stopwatchSessionSeconds;

  // ابزارهای پیشرفته تایمر مطالعه (صدای زنگ، بیدارباش صفحه و حالت تمرکز تمام‌صفحه)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const s = localStorage.getItem('sarv_study_sound_v1');
      return s !== null ? JSON.parse(s) : true;
    } catch {
      return true;
    }
  });
  const [wakeLockEnabled, setWakeLockEnabled] = useState(() => {
    try {
      const s = localStorage.getItem('sarv_study_wakelock_v1');
      return s !== null ? JSON.parse(s) : true;
    } catch {
      return true;
    }
  });
  const [zenModeOpen, setZenModeOpen] = useState(false);

  // متغیرهای مرجع زمانی برای مصونیت کامل در برابر قفل شدن گوشی و وقفه مرورگر
  const customTargetEndTimeRef = useRef(null);
  const stopwatchStartRef = useRef(null);
  const stopwatchBaseRef = useRef(0);

  // ذخیره تنظیمات در حافظه محلی
  useEffect(() => {
    try {
      localStorage.setItem('sarv_study_sound_v1', JSON.stringify(soundEnabled));
    } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('sarv_study_wakelock_v1', JSON.stringify(wakeLockEnabled));
    } catch {}
  }, [wakeLockEnabled]);

  // بازیابی سشن جاری در صورت بسته شدن ناگهانی برنامه
  useEffect(() => {
    const saved = getPersistedTimerState();
    if (saved && saved.isRunning) {
      const now = Date.now();
      if (saved.mode === 'custom' && saved.targetEndTime) {
        if (now >= saved.targetEndTime) {
          const mins = Math.max(1, Math.round(saved.customMinutes || 25));
          logStudySession({
            courseName: saved.courseName || 'عمومی',
            taskId: saved.taskId || null,
            durationMinutes: mins,
            mode: 'custom',
            color: 'primary',
            dateStr: toLocalDateString(new Date()),
          });
          clearPersistedTimerState();
          setShareToast(`نشست مطالعه «${saved.courseName || 'عمومی'}» که در پس‌زمینه پایان یافته بود ثبت شد.`);
          setTimeout(() => setShareToast(''), 3500);
        } else {
          const rem = Math.max(1, Math.ceil((saved.targetEndTime - now) / 1000));
          const totalSecs = (saved.customMinutes || 30) * 60;
          const elapsedSecs = Math.max(0, totalSecs - rem);
          setSelectedCourse(saved.courseName || coursesList[0]?.name || 'عمومی');
          setSelectedTaskId(saved.taskId || null);
          setCustomMinutes(saved.customMinutes || 30);
          setCustomSecondsLeft(rem);
          setCustomSessionSeconds(elapsedSecs);
          customTargetEndTimeRef.current = saved.targetEndTime;
          setCustomRunning(true);
          if (wakeLockEnabled) requestScreenWakeLock();
          setShareToast('تایمر مطالعه از نشست قبلی بازیابی شد.');
          setTimeout(() => setShareToast(''), 3000);
        }
      } else if (saved.mode === 'stopwatch' && saved.stopwatchStartedAt) {
        const elapsed = (saved.stopwatchBase || 0) + Math.floor((now - saved.stopwatchStartedAt) / 1000);
        setSelectedCourse(saved.courseName || coursesList[0]?.name || 'عمومی');
        setSelectedTaskId(saved.taskId || null);
        setPomoMode('stopwatch');
        setStopwatchSeconds(elapsed);
        setStopwatchSessionSeconds(elapsed);
        stopwatchStartRef.current = saved.stopwatchStartedAt;
        stopwatchBaseRef.current = saved.stopwatchBase || 0;
        setStopwatchRunning(true);
        if (wakeLockEnabled) requestScreenWakeLock();
        startNativeLiveTimer({
          title: saved.courseName ? `کرنومتر: ${saved.courseName}` : 'کرنومتر مطالعه',
          subtitle: saved.taskId ? (tasks.find((t) => t.id === saved.taskId)?.title || 'تمرکز روی تسک') : 'کرنومتر آزاد',
          isCountDown: false,
          baseStartMs: now - (elapsed * 1000),
        });
        setShareToast('کرنومتر مطالعه از نشست قبلی بازیابی شد.');
        setTimeout(() => setShareToast(''), 3000);
      }
    }
  }, []);

  // تقویم و تایم‌لاین استیت — تاریخ محلی دقیق
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [calendarMonthRefDate, setCalendarMonthRefDate] = useState(() => new Date());
  const [calendarSubView, setCalendarSubView] = useState('month'); // 'month' | 'year' | 'timeline'
  const [timelineFilterCourse, setTimelineFilterCourse] = useState('all');

  // کانبان و اولویت‌بندی استیت
  const [kanbanFilterCourse, setKanbanFilterCourse] = useState('all');
  const [kanbanFilterPriority, setKanbanFilterPriority] = useState('all');
  const [kanbanFilterDate, setKanbanFilterDate] = useState('all'); // 'all' | 'today' | 'selected'
  const [taskViewMode, setTaskViewMode] = useState(() => {
    try {
      return localStorage.getItem('sarv_task_view_mode_v1') || 'daily';
    } catch {
      return 'daily';
    }
  });
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekSlideDir, setWeekSlideDir] = useState(1);

  const handlePrevWeek = () => {
    setWeekSlideDir(-1);
    setWeekOffset((w) => w - 1);
  };
  const handleNextWeek = () => {
    setWeekSlideDir(1);
    setWeekOffset((w) => w + 1);
  };
  const handleResetCurrentWeek = () => {
    setWeekSlideDir(weekOffset > 0 ? -1 : 1);
    setWeekOffset(0);
  };

  const currentWeekDays = useMemo(() => {
    const d = new Date();
    const dayFromSaturday = (d.getDay() + 1) % 7;
    const saturday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayFromSaturday + (weekOffset * 7), 12, 0, 0);
    const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
    const res = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(saturday.getFullYear(), saturday.getMonth(), saturday.getDate() + i, 12, 0, 0);
      const iso = toLocalDateString(cur);
      const p = getPersianParts(cur);
      res.push({
        isoDate: iso,
        dayName: dayNames[i],
        dayNumber: p.day,
        monthNumber: p.month,
        isToday: iso === todayIso,
        dateObj: cur,
      });
    }
    return res;
  }, [weekOffset, todayIso]);

  const handleToggleTaskStatus = (task) => {
    triggerHaptic('light');
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    updateTaskStatus(task.id, nextStatus);
    if (nextStatus === 'done') {
      cancelTaskReminder(task.id);
      setShareToast(`کار «${task.title}» تکمیل شد!`);
      setTimeout(() => setShareToast(''), 2500);
    }
  };

  const handleRescheduleOverdueToToday = (overdueList) => {
    triggerHaptic('medium');
    overdueList.forEach((t) => {
      saveStudyTask({ ...t, dateStr: todayIso });
    });
    setShareToast(`${toFaDigits(overdueList.length)} کار به برنامه امروز منتقل شد`);
    setTimeout(() => setShareToast(''), 2500);
  };


  // مودال افزودن و ویرایش تسک
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCourse, setNewTaskCourse] = useState(coursesList[0]?.name || 'عمومی');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDate, setNewTaskDate] = useState(todayIso);
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskReminder, setNewTaskReminder] = useState(false);
  const [taskDatePickerOpen, setTaskDatePickerOpen] = useState(false);
  const [taskTimePickerOpen, setTaskTimePickerOpen] = useState(false);

  const tomorrowIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toLocalDateString(d);
  }, []);

  const dayAfterIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return toLocalDateString(d);
  }, []);

  const formatTaskDateDisplay = (isoStr) => {
    if (!isoStr) return 'امروز';
    const parts = String(isoStr).split('-');
    const d = parts.length === 3 ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0) : new Date();
    const fullFa = formatFullPersianDate(d);
    if (isoStr === todayIso) return `${fullFa} (امروز)`;
    if (isoStr === tomorrowIso) return `${fullFa} (فردا)`;
    if (isoStr === dayAfterIso) return `${fullFa} (پس‌فردا)`;
    return fullFa;
  };

  const formatTaskDateShort = (isoStr) => {
    if (!isoStr) return 'امروز';
    if (isoStr === todayIso) return 'امروز';
    if (isoStr === tomorrowIso) return 'فردا';
    if (isoStr === dayAfterIso) return 'پس‌فردا';
    const parts = String(isoStr).split('-');
    const d = parts.length === 3 ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0) : new Date();
    try {
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        day: 'numeric',
        month: 'short',
      }).format(d);
    } catch {
      return toFaDigits(isoStr);
    }
  };

  // مودال ثبت دستی و ویرایش مطالعه
  const [manualLogModalOpen, setManualLogModalOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [sessionDatePickerOpen, setSessionDatePickerOpen] = useState(false);
  const [manualCourse, setManualCourse] = useState(coursesList[0]?.name || 'عمومی');
  const [manualDate, setManualDate] = useState(todayIso);
  const [manualMinutes, setManualMinutes] = useState(30);
  const [manualNote, setManualNote] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // استیت پیش‌نمایش و اشتراک‌گذاری پوستر استوری
  const [sharingBusy, setSharingBusy] = useState(false);
  const [sharePreview, setSharePreview] = useState(null); // { url, canvas, filename, title }
  const [shareMsg, setShareMsg] = useState('');
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [shareToast, setShareToast] = useState('');

  // بارگذاری مجدد داده‌ها با تغییر رویداد
  useEffect(() => {
    const handleUpdate = () => {
      setTasks(getStudyTasks());
      setSessions(getStudySessions());
      setStats(calculateStudyStats());
      setActivityMap(getDailyActivityMap());
    };
    window.addEventListener('sarvStudyUpdated', handleUpdate);
    return () => window.removeEventListener('sarvStudyUpdated', handleUpdate);
  }, []);

  // بستن مودال‌ها هنگام دکمه بازگشت اندروید
  useEffect(() => {
    const handleCloseTopModal = (e) => {
      if (zenModeOpen) {
        setZenModeOpen(false);
        e?.preventDefault?.();
      } else if (sharePreview) {
        setSharePreview(null);
        e?.preventDefault?.();
      } else if (taskModalOpen) {
        setTaskModalOpen(false);
        e?.preventDefault?.();
      } else if (sessionDatePickerOpen) {
        setSessionDatePickerOpen(false);
        e?.preventDefault?.();
      } else if (manualLogModalOpen) {
        setManualLogModalOpen(false);
        setEditingSessionId(null);
        e?.preventDefault?.();
      } else if (isExamModalOpen) {
        setIsExamModalOpen(false);
        e?.preventDefault?.();
      }
    };
    window.addEventListener('sarvCloseTopModal', handleCloseTopModal);
    return () => window.removeEventListener('sarvCloseTopModal', handleCloseTopModal);
  }, [zenModeOpen, sharePreview, taskModalOpen, manualLogModalOpen, sessionDatePickerOpen, isExamModalOpen]);

  // اسکرول خودکار و فوری هیت‌مپ به امروز در زمان نمایش
  const scrollToTodayHeatmap = (smooth = false) => {
    if (todayCellRef.current) {
      todayCellRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        inline: 'center',
        block: 'nearest',
      });
    } else if (heatmapScrollRef.current) {
      heatmapScrollRef.current.scrollLeft = heatmapScrollRef.current.scrollWidth;
    }
  };

  useEffect(() => {
    if (activeTab === 'calendar' && calendarSubView === 'year') {
      const t1 = setTimeout(() => scrollToTodayHeatmap(false), 50);
      const t2 = setTimeout(() => scrollToTodayHeatmap(false), 200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [activeTab, calendarSubView]);

  // همگام‌سازی زمان واقعی هنگام روشن شدن صفحه یا بازگشت به برنامه
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (customRunning && customTargetEndTimeRef.current) {
          const remaining = Math.max(0, Math.ceil((customTargetEndTimeRef.current - now) / 1000));
          setCustomSecondsLeft(remaining);
          if (now >= customTargetEndTimeRef.current) {
            setCustomRunning(false);
            handleCustomTimerFinish();
          }
        }
        if (stopwatchRunning && stopwatchStartRef.current) {
          const elapsed = (stopwatchBaseRef.current || 0) + Math.floor((now - stopwatchStartRef.current) / 1000);
          setStopwatchSeconds(elapsed);
          setStopwatchSessionSeconds(elapsed);
        }
        if ((customRunning || stopwatchRunning) && wakeLockEnabled) {
          requestScreenWakeLock();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [customRunning, stopwatchRunning, wakeLockEnabled]);

  // حلقه تایمر با فرکانس ۵۰۰ میلی‌ثانیه بر پایه اختلاف زمانی دقیق سیستم
  useEffect(() => {
    let interval = null;
    if (customRunning || stopwatchRunning) {
      interval = setInterval(() => {
        const now = Date.now();
        if (customRunning && customTargetEndTimeRef.current) {
          const remaining = Math.max(0, Math.ceil((customTargetEndTimeRef.current - now) / 1000));
          setCustomSecondsLeft(remaining);
          const totalSecs = customMinutes * 60;
          const actualElapsed = Math.max(0, totalSecs - remaining);
          setCustomSessionSeconds(actualElapsed);

          if (remaining <= 0) {
            setCustomRunning(false);
            handleCustomTimerFinish();
          }
        }
        if (stopwatchRunning && stopwatchStartRef.current) {
          const elapsed = (stopwatchBaseRef.current || 0) + Math.floor((now - stopwatchStartRef.current) / 1000);
          setStopwatchSeconds(elapsed);
          setStopwatchSessionSeconds(elapsed);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [customRunning, stopwatchRunning, customMinutes]);

  const handleToggleTimer = () => {
    const now = Date.now();
    triggerHaptic('light');

    if (isCustom) {
      if (customRunning) {
        setCustomRunning(false);
        customTargetEndTimeRef.current = null;
        if (!stopwatchRunning) {
          releaseScreenWakeLock();
          clearPersistedTimerState();
          stopNativeLiveTimer();
        }
      } else {
        const end = now + (customSecondsLeft * 1000);
        customTargetEndTimeRef.current = end;
        setCustomRunning(true);
        if (wakeLockEnabled) requestScreenWakeLock();
        requestNotificationPermission();
        startNativeLiveTimer({
          title: selectedCourse ? `مطالعه: ${selectedCourse}` : 'مطالعه و تمرکز',
          subtitle: selectedTaskId ? (tasks.find((t) => t.id === selectedTaskId)?.title || 'تمرکز روی تسک') : 'تایمر پومودورو',
          isCountDown: true,
          targetEndMs: end,
        });

        persistTimerState({
          isRunning: true,
          mode: 'custom',
          customMinutes,
          secondsLeft: customSecondsLeft,
          targetEndTime: end,
          courseName: selectedCourse,
          taskId: selectedTaskId,
          sessionSecondsCount: customSessionSeconds,
          startedAt: now,
        });
      }
    } else {
      if (stopwatchRunning) {
        setStopwatchRunning(false);
        stopwatchStartRef.current = null;
        stopwatchBaseRef.current = stopwatchSeconds;
        stopNativeLiveTimer();
        if (!customRunning) {
          releaseScreenWakeLock();
          clearPersistedTimerState();
        }
      } else {
        stopwatchStartRef.current = now;
        stopwatchBaseRef.current = stopwatchSeconds;
        setStopwatchRunning(true);
        if (wakeLockEnabled) requestScreenWakeLock();
        requestNotificationPermission();

        const baseTime = now - (stopwatchSeconds * 1000);
        startNativeLiveTimer({
          title: selectedCourse ? `کرنومتر: ${selectedCourse}` : 'کرنومتر مطالعه',
          subtitle: selectedTaskId ? (tasks.find((t) => t.id === selectedTaskId)?.title || 'تمرکز روی تسک') : 'کرنومتر آزاد',
          isCountDown: false,
          baseStartMs: baseTime,
        });

        persistTimerState({
          isRunning: true,
          mode: 'stopwatch',
          stopwatchBase: stopwatchSeconds,
          stopwatchStartedAt: now,
          courseName: selectedCourse,
          taskId: selectedTaskId,
          sessionSecondsCount: stopwatchSessionSeconds,
          startedAt: now,
        });
      }
    }
  };

  const handleCustomTimerFinish = () => {
    stopNativeLiveTimer();
    if (!stopwatchRunning) {
      releaseScreenWakeLock();
      clearPersistedTimerState();
    }

    if (soundEnabled) {
      playFocusChime();
    }
    triggerHaptic('finish');

    const currentTask = tasks.find((t) => t.id === selectedTaskId);
    const matchedCourse = coursesList.find((c) => c.name === selectedCourse);
    const tone = getCourseColor(matchedCourse || selectedCourse);

    const now = Date.now();
    const totalSecs = customMinutes * 60;
    // محاسبه دقیق ثانیه‌های واقعی مطالعه (حتی در صورت پایان زودهنگام یا توقف موقت)
    let actualElapsedSecs = customSessionSeconds;
    if (customRunning && customTargetEndTimeRef.current) {
      const rem = Math.max(0, Math.ceil((customTargetEndTimeRef.current - now) / 1000));
      actualElapsedSecs = Math.max(actualElapsedSecs, totalSecs - rem);
    } else if (customSecondsLeft < totalSecs) {
      actualElapsedSecs = Math.max(actualElapsedSecs, totalSecs - customSecondsLeft);
    }
    // اگر تایمر به طور کامل و طبیعی به پایان رسیده باشد
    if (customSecondsLeft <= 0 || (customTargetEndTimeRef.current && now >= customTargetEndTimeRef.current)) {
      if (actualElapsedSecs >= totalSecs - 5) {
        actualElapsedSecs = totalSecs;
      }
    }
    const durationMins = Math.max(1, Math.round(actualElapsedSecs / 60));
    const loggedSession = logStudySession({
      courseCode: matchedCourse?.code || null,
      courseName: selectedCourse,
      taskId: selectedTaskId || null,
      taskTitle: currentTask?.title || null,
      durationMinutes: durationMins,
      mode: 'custom',
      color: tone,
      dateStr: toLocalDateString(new Date()),
    });

    notifyTimerFinished({ courseName: selectedCourse, minutes: durationMins });
    setCustomSessionSeconds(0);
    setCustomSecondsLeft(customMinutes * 60);
    customTargetEndTimeRef.current = null;

    setShareToast({
      text: `نشست مطالعه «${selectedCourse}» (${toFaDigits(durationMins)} دقیقه) ثبت شد`,
      actionLabel: 'ویرایش',
      onAction: () => handleOpenEditSession(loggedSession),
    });
    setTimeout(() => setShareToast(''), 4500);
  };

  const handleStopwatchFinish = () => {
    stopNativeLiveTimer();
    if (!customRunning) {
      releaseScreenWakeLock();
      clearPersistedTimerState();
    }

    if (soundEnabled) {
      playFocusChime();
    }
    triggerHaptic('finish');

    const currentTask = tasks.find((t) => t.id === selectedTaskId);
    const matchedCourse = coursesList.find((c) => c.name === selectedCourse);
    const tone = getCourseColor(matchedCourse || selectedCourse);

    const durationMins = Math.max(1, Math.round(stopwatchSeconds / 60));
    const loggedSession = logStudySession({
      courseCode: matchedCourse?.code || null,
      courseName: selectedCourse,
      taskId: selectedTaskId || null,
      taskTitle: currentTask?.title || null,
      durationMinutes: durationMins,
      mode: 'stopwatch',
      color: tone,
      dateStr: toLocalDateString(new Date()),
    });

    notifyTimerFinished({ courseName: selectedCourse, minutes: durationMins });
    setStopwatchSessionSeconds(0);
    setStopwatchSeconds(0);
    stopwatchStartRef.current = null;
    stopwatchBaseRef.current = 0;

    setShareToast({
      text: `کرنومتر «${selectedCourse}» (${toFaDigits(durationMins)} دقیقه) ثبت شد`,
      actionLabel: 'ویرایش',
      onAction: () => handleOpenEditSession(loggedSession),
    });
    setTimeout(() => setShareToast(''), 4500);
  };

  const handleFinishAndSaveSession = () => {
    if (isCustom) {
      setCustomRunning(false);
      handleCustomTimerFinish();
    } else {
      setStopwatchRunning(false);
      handleStopwatchFinish();
    }
  };

  const switchPomoMode = (modeKey) => {
    if (modeKey === pomoMode) return;
    triggerHaptic('light');
    setPomoMode(modeKey);
    // مقادیر تایمر دلخواه و کرنومتر آزاد هرگز پاک نمی‌شوند و کاملاً پایدار می‌مانند!
  };

  const updateCustomMinutes = (mins) => {
    const clamped = Math.max(1, Math.min(240, mins));
    setCustomMinutes(clamped);
    if (!customRunning) {
      setCustomSecondsLeft(clamped * 60);
    }
  };

  const handleResetTimer = () => {
    stopNativeLiveTimer();
    if (isCustom) {
      setCustomRunning(false);
      customTargetEndTimeRef.current = null;
      if (customSessionSeconds >= 10) {
        handleCustomTimerFinish();
      } else {
        setCustomSecondsLeft(customMinutes * 60);
        setCustomSessionSeconds(0);
      }
    } else {
      stopNativeLiveTimer();
      setStopwatchRunning(false);
      stopwatchStartRef.current = null;
      stopwatchBaseRef.current = 0;
      if (stopwatchSeconds >= 10) {
        handleStopwatchFinish();
      } else {
        setStopwatchSeconds(0);
        setStopwatchSessionSeconds(0);
      }
    }
    if (!customRunning && !stopwatchRunning) {
      releaseScreenWakeLock();
      clearPersistedTimerState();
    }
  };

  const handleOpenCreateTask = (defaultDate = selectedDate || todayIso) => {
    setEditingTaskId(null);
    setNewTaskTitle('');
    setNewTaskCourse(coursesList[0]?.name || 'عمومی');
    setNewTaskPriority('medium');
    setNewTaskDate(defaultDate);
    setNewTaskTime('');
    setNewTaskReminder(false);
    setTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title || '');
    setNewTaskCourse(task.courseName || coursesList[0]?.name || 'عمومی');
    setNewTaskPriority(task.priority || 'medium');
    setNewTaskDate(task.dateStr || todayIso);
    setNewTaskTime(task.timeStr || '');
    setNewTaskReminder(Boolean(task.reminderEnabled));
    setTaskModalOpen(true);
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const matched = coursesList.find((c) => c.name === newTaskCourse);
    const taskDate = newTaskDate || selectedDate || todayIso;

    if (editingTaskId) {
      const updated = {
        id: editingTaskId,
        title: newTaskTitle.trim(),
        courseName: newTaskCourse,
        courseCode: matched?.code || null,
        color: getCourseColor(matched || newTaskCourse),
        priority: newTaskPriority,
        dateStr: newTaskDate || todayIso,
        timeStr: newTaskTime || null,
        reminderEnabled: Boolean(newTaskReminder && newTaskTime),
      };
      saveStudyTask(updated);
      if (newTaskReminder && newTaskTime) {
        scheduleTaskReminder(updated);
      } else {
        cancelTaskReminder(editingTaskId);
      }
      setShareToast('کار با موفقیت ویرایش شد');
    } else {
      const created = saveStudyTask({
        title: newTaskTitle.trim(),
        courseName: newTaskCourse,
        courseCode: matched?.code || null,
        color: getCourseColor(matched || newTaskCourse),
        priority: newTaskPriority,
        status: 'todo',
        dateStr: taskDate,
        timeStr: newTaskTime || null,
        reminderEnabled: Boolean(newTaskReminder && newTaskTime),
      });
      if (newTaskReminder && newTaskTime && created?.id) {
        scheduleTaskReminder(created);
      }
      setShareToast('کار جدید به برنامه اضافه شد');
    }
    setEditingTaskId(null);
    setNewTaskTitle('');
    setNewTaskTime('');
    setNewTaskReminder(false);
    setTaskModalOpen(false);
    setTimeout(() => setShareToast(''), 3000);
  };

  const handleDeleteTask = (taskId, e) => {
    if (e) {
      e?.preventDefault?.();
      e?.stopPropagation?.();
    }
    triggerHaptic('medium');
    const target = tasks.find((t) => t.id === taskId);
    cancelTaskReminder(taskId);
    deleteStudyTask(taskId);
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
    setShareToast(target?.title ? `کار «${target.title}» با موفقیت حذف شد` : 'کار با موفقیت حذف شد');
    setTimeout(() => setShareToast(''), 3000);
  };

  const handleOpenManualLog = (defaultDate = selectedDate || todayIso) => {
    setEditingSessionId(null);
    setManualCourse(coursesList[0]?.name || 'مطالعه عمومی');
    setManualMinutes(30);
    setManualNote('');
    setManualDate(defaultDate);
    setManualLogModalOpen(true);
  };

  const handleOpenEditSession = (session) => {
    if (!session) return;
    setEditingSessionId(session.id);
    setManualCourse(session.courseName || coursesList[0]?.name || 'مطالعه عمومی');
    setManualMinutes(session.durationMinutes || 30);
    setManualNote(session.taskTitle || '');
    setManualDate(session.dateStr || todayIso);
    setManualLogModalOpen(true);
  };

  const handleManualLogSubmit = (e) => {
    e.preventDefault();
    const matched = coursesList.find((c) => c.name === manualCourse);
    const tone = getCourseColor(matched || manualCourse);
    const mins = Math.max(1, Number(manualMinutes) || 30);

    if (editingSessionId) {
      updateStudySession(editingSessionId, {
        courseCode: matched?.code || null,
        courseName: manualCourse,
        taskTitle: manualNote.trim() || null,
        durationMinutes: mins,
        color: tone,
        dateStr: manualDate || todayIso,
      });
      setShareToast(`نشست مطالعه «${manualCourse}» با موفقیت ویرایش شد`);
    } else {
      logStudySession({
        courseCode: matched?.code || null,
        courseName: manualCourse,
        taskTitle: manualNote.trim() || null,
        durationMinutes: mins,
        mode: 'manual',
        color: tone,
        dateStr: manualDate || todayIso,
      });
      setShareToast(`مطالعه «${manualCourse}» به مدت ${toFaDigits(mins)} دقیقه با موفقیت ثبت شد.`);
    }

    setManualLogModalOpen(false);
    setEditingSessionId(null);
    setManualNote('');
    setTimeout(() => setShareToast(''), 3500);
  };

  const handleStartTaskFocus = (task) => {
    setSelectedCourse(task.courseName || 'عمومی');
    setSelectedTaskId(task.id);
    setPomoMode('custom');
    setActiveTab('pomo');
    const now = Date.now();
    const end = now + (customSecondsLeft * 1000);
    customTargetEndTimeRef.current = end;
    setCustomRunning(true);
    if (wakeLockEnabled) requestScreenWakeLock();
    setShareToast(`تایمر برای تسک «${task.title}» آغاز شد`);
    setTimeout(() => setShareToast(''), 3000);
  };

  const handleCycleTaskPriority = (task) => {
    const cycle = { high: 'medium', medium: 'low', low: 'high' };
    const nextP = cycle[task.priority] || 'medium';
    saveStudyTask({ ...task, priority: nextP });
    setShareToast(`اولویت به «${PRIORITY_CONFIG[nextP].shortLabel}» تغییر یافت`);
    setTimeout(() => setShareToast(''), 2500);
  };

  const handleDeleteSession = (sessionId) => {
    deleteStudySession(sessionId);
    setShareToast('نشست مطالعه حذف شد');
    setTimeout(() => setShareToast(''), 2500);
  };

  // باز کردن پیش‌نمایش استوری
  const handleOpenStoryPreview = async () => {
    if (sharingBusy) return;
    setSharingBusy(true);
    setShareMsg('');
    try {
      const canvas = await renderStudyStoryImage({
        stats,
        student: vm.student,
        theme: activeThemeMeta,
      });
      setSharePreview({
        url: canvasToDataUrl(canvas),
        canvas,
        title: 'پوستر دستاورد مطالعه من | سروستان',
        filename: `sarvestan-study-${todayIso}.png`,
      });
      setShareMsg('پیش‌نمایش آماده شد — گزینهٔ اشتراک‌گذاری یا ذخیره را انتخاب کنید');
      setShareToast('پوستر استوری ایجاد شد');
      setTimeout(() => setShareToast(''), 2500);
    } catch (e) {
      console.error('[study story error]', e);
      setShareMsg('خطا در ساخت پوستر');
      setShareToast('خطا در ایجاد پوستر');
      setTimeout(() => setShareToast(''), 3000);
    } finally {
      setSharingBusy(false);
    }
  };

  const handleDownloadPreview = async () => {
    if (!sharePreview?.canvas) return;
    try {
      await saveCanvasImage(sharePreview.canvas, sharePreview.filename || 'sarvestan-study.png');
      setShareMsg('تصویر با موفقیت در گالری ذخیره شد');
      setShareToast('تصویر ذخیره شد');
      setTimeout(() => setShareToast(''), 2500);
    } catch (e) {
      console.error('[download preview]', e);
      setShareMsg('خطا در ذخیره تصویر');
    }
  };

  const handleShareNative = async () => {
    if (!sharePreview?.canvas) return;
    try {
      const r = await shareCanvas(sharePreview.canvas, {
        filename: sharePreview.filename || 'sarvestan-study.png',
        title: sharePreview.title || 'سروستان',
      });
      if (r === 'shared') {
        setShareMsg('تصویر با موفقیت به اشتراک گذاشته شد');
        setShareToast('تصویر به اشتراک گذاشته شد');
      } else {
        setShareMsg('تصویر ذخیره شد — آمادهٔ قرار دادن در استوری');
        setShareToast('تصویر دانلود و ذخیره شد');
      }
      setTimeout(() => setShareToast(''), 3000);
    } catch (e) {
      console.error('[share native]', e);
      await handleDownloadPreview();
    }
  };

  const handleCopyPreview = async () => {
    if (!sharePreview?.canvas) return;
    try {
      await copyCanvasToClipboard(sharePreview.canvas);
      setCopiedPreview(true);
      setShareMsg('تصویر در حافظه کپی شد (آمادهٔ الصاق در استوری یا چت)');
      setShareToast('تصویر در حافظه کپی شد');
      setTimeout(() => setCopiedPreview(false), 3000);
      setTimeout(() => setShareToast(''), 2500);
    } catch (e) {
      console.warn('[copy preview]', e);
      await handleDownloadPreview();
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${toFaDigits(String(m).padStart(2, '0'))}:${toFaDigits(String(s).padStart(2, '0'))}`;
  };

  // استخراج کلاس‌های رسمی دانشگاه از برنامه هفتگی برای هر روز تقویم
  const getUniversityClassesForDate = (dateObj) => {
    if (!dateObj || isNaN(dateObj.getTime())) return [];
    const jsDay = dateObj.getDay();
    const dayName = { 6: 'شنبه', 0: 'یکشنبه', 1: 'دوشنبه', 2: 'سه‌شنبه', 3: 'چهارشنبه', 4: 'پنجشنبه', 5: 'جمعه' }[jsDay];
    if (!dayName) return [];
    return coursesList
      .filter((c) => {
        if (Array.isArray(c.daySlots) && c.daySlots.some((s) => s.day === dayName)) return true;
        if (Array.isArray(c.days) && c.days.includes(dayName)) return true;
        return false;
      })
      .map((c) => {
        let slotTime = c.time || c.classTimeRaw || 'ـ';
        if (Array.isArray(c.daySlots)) {
          const match = c.daySlots.find((s) => s.day === dayName);
          if (match?.time) slotTime = match.time;
        }
        return {
          id: c.id || c.code || c.name,
          name: c.name,
          code: c.code,
          professor: c.professor,
          room: c.hall || c.room,
          units: c.units,
          time: toFaDigits(slotTime),
          color: getCourseColor(c),
        };
      });
  };

  // محاسبات تقویم ماهانه
  const monthGrid = getPersianMonthGrid(calendarMonthRefDate);
  const handlePrevMonth = () => {
    setMonthSlideDir(-1);
    const d = new Date(monthGrid.firstDay);
    d.setDate(d.getDate() - 15);
    setCalendarMonthRefDate(d);
  };
  const handleNextMonth = () => {
    setMonthSlideDir(1);
    const d = new Date(monthGrid.firstDay);
    d.setDate(d.getDate() + 35);
    setCalendarMonthRefDate(d);
  };

  // محاسبات هیت‌مپ سالانه (۵۲ هفته)
  const heatmapWeeks = getYearlyHeatmapWeeks();
  const yearlyStats = (() => {
    let totalMins = 0;
    let activeDays = 0;
    let streakCount = 0;
    let maxStreak = 0;

    for (const week of heatmapWeeks) {
      for (const day of week) {
        const act = activityMap[day.isoDate];
        if (act && act.totalMinutes > 0) {
          totalMins += act.totalMinutes;
          activeDays += 1;
          streakCount += 1;
          if (streakCount > maxStreak) maxStreak = streakCount;
        } else {
          streakCount = 0;
        }
      }
    }
    return {
      totalMins,
      totalHours: (totalMins / 60).toFixed(1),
      activeDays,
      longestStreak: maxStreak,
      avgSessionMins: Math.round(totalMins / Math.max(1, activeDays)),
    };
  })();

  // تابع کمکی تطابق امتحانات با روزهای تقویم (رسمی بهستان + دستی کاربر)
  const getExamsForDay = (isoDate, pYear, pMonth, pDay) => {
    if (!examsList?.length) return [];
    let py = pYear;
    let pm = pMonth;
    let pd = pDay;
    if ((!py || !pm || !pd) && isoDate) {
      try {
        const parts = getPersianParts(new Date(isoDate));
        py = parts.year;
        pm = parts.month;
        pd = parts.day;
      } catch {}
    }
    return examsList.filter((ex) => {
      if (isoDate && ex.isoDate && ex.isoDate === isoDate) return true;
      if (ex.jalaliParts && py && pm && pd) {
        return (
          ex.jalaliParts.year === py &&
          ex.jalaliParts.month === pm &&
          ex.jalaliParts.day === pd
        );
      }
      return false;
    });
  };

  // مدیریت افزودن و ویرایش امتحان مستقیماً از تقویم
  const handleOpenAddExam = (prefilledDate = null) => {
    const p = getPersianParts(selectedDayDateObj);
    const defaultDate =
      prefilledDate ||
      (p
        ? `${p.year}/${String(p.month).padStart(2, '0')}/${String(p.day).padStart(2, '0')}`
        : '1404/03/20');
    setEditingExam({
      id: null,
      course: coursesList[0]?.name || '',
      examDate: defaultDate,
      examTime: '08:30-10:30',
      room: '',
      seat: '—',
      unit: 3,
    });
    setIsExamModalOpen(true);
  };

  const handleOpenEditExam = (exam) => {
    setEditingExam(exam);
    setIsExamModalOpen(true);
  };

  const handleSaveExam = (examData) => {
    const currentTerm = resolveCurrentTermId();
    if (editingExam && (editingExam.id || editingExam.code)) {
      updateExamInStore(currentTerm, editingExam.id || editingExam.code, examData);
      setShareToast(`امتحان «${examData.course}» به‌روزرسانی شد`);
    } else {
      addExamToStore(currentTerm, examData);
      setShareToast(`امتحان «${examData.course}» به تقویم اضافه شد`);
    }
    setIsExamModalOpen(false);
    setEditingExam(null);
    setStoreVer((v) => v + 1);
    setTimeout(() => setShareToast(''), 3000);
  };

  const handleDeleteExam = (examIdOrObj) => {
    const currentTerm = resolveCurrentTermId();
    deleteExamFromStore(currentTerm, examIdOrObj);
    setIsExamModalOpen(false);
    setEditingExam(null);
    setStoreVer((v) => v + 1);
    setShareToast('امتحان از تقویم حذف شد');
    setTimeout(() => setShareToast(''), 3000);
  };

  // اطلاعات روز انتخاب‌شده (جلسات مطالعه + کلاس‌های دانشگاه + امتحانات + تسک‌های روز)
  const selectedDayActivity = activityMap[selectedDate];
  const selectedDaySessions = selectedDayActivity?.sessions || [];
  const selectedDayTasks = tasks.filter(
    (t) => (t.dateStr || toLocalDateString(new Date(t.createdAt || Date.now()))) === selectedDate
  );
  const selectedDayDateObj = new Date(selectedDate);
  const selectedDayUniversityClasses = getUniversityClassesForDate(selectedDayDateObj);
  const selectedDayParts = getPersianParts(selectedDayDateObj);
  const selectedDayExams = getExamsForDay(
    selectedDate,
    selectedDayParts?.year,
    selectedDayParts?.month,
    selectedDayParts?.day
  );

  // سشن‌های فیلترشده برای تایم‌لاین
  const filteredSessions = sessions.filter((s) => {
    if (timelineFilterCourse === 'all') return true;
    return s.courseName === timelineFilterCourse;
  });

  return (
    <div className="px-4 pt-3.5 space-y-4 mobile-pad-bottom">
      {/* هدر ۴ تایی تب‌های بخش مطالعه با انیمیشن روان و بدون بریدگی گوشه‌ها */}
      <section className="sarv-seg w-full relative" dir="rtl">
        {STUDY_MAIN_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                try {
                  const cur = getPersistedTimerState();
                  if (cur?.isRunning) {
                    persistTimerState({ ...cur, isStudySubTab: tab.id !== 'pomo' });
                  }
                } catch {}
              }}
              className={`relative flex-1 py-2 px-1 rounded-xl text-[12px] flex items-center justify-center gap-1.5 transition-colors outline-none select-none active:scale-[0.98] cursor-pointer z-10 ${
                isActive
                  ? 'text-primary-content font-bold'
                  : 'text-neutral hover:text-base-content font-medium'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="studyMainTabIndicator"
                  className="absolute inset-0 bg-primary rounded-xl shadow-xs -z-10"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.25 }}
                />
              )}
              <tab.Icon className="w-3.5 h-3.5 shrink-0 relative z-10" />
              <span className="truncate relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </section>

      {/* ۱. تب تایمر و تمرکز مطالعه با قابلیت تایمر دلخواه و کرنومتر آزاد */}
      {activeTab === 'pomo' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="sarv-card p-5 border border-base-500/40 flex flex-col items-center text-center relative overflow-hidden">
            {/* جعبه‌ابزار هوشمند تمرکز (حالت تمرکز تمام‌صفحه، صفحه روشن و زنگ هشدار) */}
            <div className="w-full max-w-xs mb-3 flex items-center justify-between gap-1 p-1.5 rounded-2xl bg-base-500/20 border border-base-500/30 text-xs">
              {/* حالت تمرکز تمام‌صفحه */}
              <button
                type="button"
                onClick={() => setZenModeOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-base-500/30 hover:bg-base-500/50 text-base-content font-bold transition active:scale-95 cursor-pointer"
                title="حالت تمرکز تمام‌صفحه"
              >
                <Maximize2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px]">حالت تمرکز</span>
              </button>

              <div className="flex items-center gap-1">
                {/* روشن ماندن صفحه */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !wakeLockEnabled;
                    setWakeLockEnabled(next);
                    if (next && timerRunning) requestScreenWakeLock();
                    else if (!next) releaseScreenWakeLock();
                  }}
                  className={`p-1.5 rounded-xl transition cursor-pointer ${
                    wakeLockEnabled
                      ? 'bg-warn-soft text-warn font-black shadow-xs'
                      : 'text-neutral hover:bg-base-500/30 hover:text-base-content'
                  }`}
                  title={wakeLockEnabled ? 'صفحه حین مطالعه روشن می‌ماند' : 'روشن ماندن صفحه خاموش است'}
                >
                  <Sun className="w-4 h-4" />
                </button>

                {/* صدای زنگ */}
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 rounded-xl transition cursor-pointer ${
                    soundEnabled
                      ? 'bg-primary-soft text-primary font-black shadow-xs'
                      : 'text-neutral/60 hover:bg-base-500/30'
                  }`}
                  title={soundEnabled ? 'زنگ پایان فعال است' : 'زنگ پایان بی‌صدا است'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* انتخاب حالت تایمر: فقط تایمر دلخواه و کرنومتر آزاد با انیمیشن روان مستطیل */}
            <div className="sarv-seg w-full max-w-xs mb-4 relative" dir="rtl">
              {Object.values(POMO_MODES).map((m) => {
                const isSelected = pomoMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => switchPomoMode(m.id)}
                    className={`relative flex-1 py-2 px-3 rounded-xl text-[12.5px] transition-colors select-none cursor-pointer text-center outline-none z-10 ${
                      isSelected
                        ? 'text-primary-content font-bold'
                        : 'text-neutral hover:text-base-content font-medium'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="pomoModeIndicator"
                        className="absolute inset-0 bg-primary rounded-xl shadow-xs -z-10"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.25 }}
                      />
                    )}
                    <span className="relative z-10">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* کنترلر تنظیم تایم دلخواه */}
            {pomoMode === 'custom' && (
              <div className="w-full max-w-xs mb-4 p-3 rounded-2xl bg-base-500/20 border border-base-500/35 flex flex-col items-center gap-2">
                <span className="text-[11px] font-bold text-neutral">تنظیم مدت زمان تایمر دلخواه:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateCustomMinutes(customMinutes - 5)}
                    className="w-8 h-8 rounded-xl bg-base-500/30 hover:bg-base-500/50 text-base-content font-black text-sm grid place-items-center active:scale-95 cursor-pointer"
                    title="کاهش ۵ دقیقه"
                  >
                    -
                  </button>
                  <span className="text-base font-black font-mono text-primary min-w-[70px] text-center">
                    {toFaDigits(customMinutes)} دقیقه
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCustomMinutes(customMinutes + 5)}
                    className="w-8 h-8 rounded-xl bg-base-500/30 hover:bg-base-500/50 text-base-content font-black text-sm grid place-items-center active:scale-95 cursor-pointer"
                    title="افزایش ۵ دقیقه"
                  >
                    +
                  </button>
                </div>
                {/* دکمه‌های پیش‌تنظیم سریع */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap justify-center">
                  {[15, 25, 30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => updateCustomMinutes(mins)}
                      className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition cursor-pointer ${
                        customMinutes === mins
                          ? 'bg-primary text-primary-content font-black shadow-xs'
                          : 'bg-base-500/25 text-neutral hover:bg-base-500/40'
                      }`}
                    >
                      {toFaDigits(mins)}د
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* حلقه و شمارنده مرکزی تایمر (لمس‌پذیر جهت شروع و توقف سریع با اعداد انیمیشنی آنالوگ) */}
            <div
              onClick={handleToggleTimer}
              className="relative w-56 h-56 flex flex-col items-center justify-center my-2 cursor-pointer group select-none active:scale-95 transition-transform"
              title="برای شروع یا توقف کلیک کنید"
            >
              <div className="absolute inset-0 rounded-full border-4 border-base-500/20" />
              <div
                className={`absolute inset-0 rounded-full border-4 border-primary transition-all duration-1000 ${
                  timerRunning ? 'scale-105 border-primary animate-pulse shadow-[0_0_25px_rgba(var(--primary-rgb),0.25)]' : ''
                }`}
              />
              <OdometerNumber
                value={formatTimer(currentSeconds)}
                height={52}
                className="text-5xl font-black font-mono tracking-wider text-base-content select-none tabular-nums"
              />
              <span className="text-xs text-neutral mt-2 font-medium flex items-center gap-1">
                {timerRunning ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>در حال تمرکز عمیق</span>
                  </>
                ) : (
                  <span>برای شروع ضربه بزنید</span>
                )}
              </span>
            </div>

            {/* انتخاب درس متصل از بهستان — پورتال‌شده و بدون ماسک شدن */}
            <div className="w-full max-w-xs mt-3 space-y-1.5 text-right">
              <label className="text-[11px] font-bold text-neutral flex items-center justify-between">
                <span>درس انتخابی برای ثبت زمان:</span>
                <span className="text-primary font-mono">{toFaDigits(coursesList.length)} درس موجود</span>
              </label>
              <NativeCourseSelector
                value={selectedCourse}
                onChange={setSelectedCourse}
                courses={coursesList}
                modalTitle="انتخاب درس پومودورو"
                allowGeneral={true}
              />
            </div>

            {/* کلیدهای کنترل تایمر */}
            <div className="flex items-center gap-3 mt-5">
              <button
                type="button"
                onClick={handleToggleTimer}
                className={`px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer ${
                  timerRunning
                    ? 'bg-warn text-warn-content hover:brightness-110'
                    : 'bg-primary text-primary-content hover:brightness-110'
                }`}
              >
                {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                <span>{timerRunning ? 'توقف موقت' : 'شروع تمرکز'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetTimer}
                className="p-3.5 rounded-2xl bg-base-500/30 text-neutral hover:text-base-content border border-base-500/40 active:scale-95 transition-all cursor-pointer"
                title="بازنشانی تایمر"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* دکمه واضح و صریح پایان و ذخیره فوری سشن جاری */}
            {sessionSecondsCount > 0 && (
              <button
                type="button"
                onClick={handleFinishAndSaveSession}
                className="w-full max-w-xs mt-4 py-2.5 px-4 rounded-2xl bg-success-soft text-success border border-success/40 font-bold text-xs flex items-center justify-center gap-2 hover:bg-success hover:text-success-content transition active:scale-95 cursor-pointer shadow-xs animate-in fade-in"
              >
                <Check className="w-4 h-4" />
                <span>
                  پایان و ثبت این نشست ({toFaDigits(Math.max(1, Math.round(sessionSecondsCount / 60)))} دقیقه)
                </span>
              </button>
            )}

            {/* دکمه ثبت دستی مطالعه بدون نیاز به تایمر */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => handleOpenManualLog()}
                className="text-xs font-bold text-neutral hover:text-primary flex items-center gap-1.5 transition cursor-pointer py-1.5 px-3 rounded-xl hover:bg-base-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ثبت دستی نشست مطالعه (بدون تایمر)</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ۲. تب کانبان و بورد هوشمند تسک‌ها با اولویت‌بندی پیشرفته */}
            {/* ۲. تب تسک‌ها — سه‌نمای هوشمند روزانه، هفتگی و کانبان (مشابه تیک‌تیک) */}
      {activeTab === 'kanban' && (() => {
        const todayTasks = tasks.filter((t) => {
          const d = t.dateStr || toLocalDateString(new Date(t.createdAt || Date.now()));
          return d === todayIso;
        });
        const todayPending = todayTasks.filter((t) => t.status !== 'done');
        const todayDone = todayTasks.filter((t) => t.status === 'done');

        const overdueTasks = tasks.filter((t) => {
          if (t.status === 'done') return false;
          const d = t.dateStr || toLocalDateString(new Date(t.createdAt || Date.now()));
          return d < todayIso;
        });

        const allPendingTasks = tasks.filter((t) => t.status !== 'done');
        const allDoneTasks = tasks.filter((t) => t.status === 'done');

        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
            {/* هدر بخش تسک‌ها و دکمه تسک جدید */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[13.5px] font-black text-base-content flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-primary" />
                  مدیریت کارها و برنامه‌ریزی
                </h3>
                <p className="text-[10.5px] text-neutral mt-0.5">
                  {toFaDigits(allPendingTasks.length)} باقیمانده · {toFaDigits(allDoneTasks.length)} تکمیل‌شده
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenCreateTask(taskViewMode === 'daily' ? todayIso : selectedDate || todayIso)}
                className="px-3.5 py-2 rounded-xl bg-primary text-primary-content text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer hover:brightness-110 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>کار جدید</span>
              </button>
            </div>

            {/* سوییچر ۳ حالته نما: روزانه (تیک‌تیک) · هفتگی · کانبان با انیمیشن روان مستطیل */}
            <div className="sarv-seg w-full relative" dir="rtl">
              <button
                type="button"
                onClick={() => {
                  setTaskViewMode('daily');
                  try { localStorage.setItem('sarv_task_view_mode_v1', 'daily'); } catch {}
                }}
                className={`relative flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer outline-none select-none z-10 ${
                  taskViewMode === 'daily'
                    ? 'text-primary-content font-black'
                    : 'text-neutral hover:text-base-content'
                }`}
              >
                {taskViewMode === 'daily' && (
                  <motion.div
                    layoutId="taskViewModeIndicator"
                    className="absolute inset-0 bg-primary rounded-xl shadow-xs -z-10"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.25 }}
                  />
                )}
                <CalendarDays className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">نمای روزانه</span>
                {todayPending.length > 0 && (
                  <span className={`relative z-10 text-[9.5px] px-1.5 py-0.2 rounded-full font-bold ${
                    taskViewMode === 'daily' ? 'bg-white/20 text-white' : 'bg-primary-soft text-primary'
                  }`}>
                    {toFaDigits(todayPending.length)}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTaskViewMode('weekly');
                  try { localStorage.setItem('sarv_task_view_mode_v1', 'weekly'); } catch {}
                }}
                className={`relative flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer outline-none select-none z-10 ${
                  taskViewMode === 'weekly'
                    ? 'text-primary-content font-black'
                    : 'text-neutral hover:text-base-content'
                }`}
              >
                {taskViewMode === 'weekly' && (
                  <motion.div
                    layoutId="taskViewModeIndicator"
                    className="absolute inset-0 bg-primary rounded-xl shadow-xs -z-10"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.25 }}
                  />
                )}
                <CalendarRange className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">نمای هفتگی</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTaskViewMode('kanban');
                  try { localStorage.setItem('sarv_task_view_mode_v1', 'kanban'); } catch {}
                }}
                className={`relative flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer outline-none select-none z-10 ${
                  taskViewMode === 'kanban'
                    ? 'text-primary-content font-black'
                    : 'text-neutral hover:text-base-content'
                }`}
              >
                {taskViewMode === 'kanban' && (
                  <motion.div
                    layoutId="taskViewModeIndicator"
                    className="absolute inset-0 bg-primary rounded-xl shadow-xs -z-10"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.25 }}
                  />
                )}
                <Columns3 className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">بورد کانبان</span>
              </button>
            </div>

            {/* ── ۱. نمای روزانه (DAILY TICKTICK STYLE) ── */}
            {taskViewMode === 'daily' && (
              <div className="space-y-3.5">
                {/* کارت آمار پیشرفت امروز */}
                <div className="sarv-card p-3.5 border border-base-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-primary-soft text-primary grid place-items-center">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-base-content">
                          کارهای امروز ({formatTaskDateDisplay(todayIso)})
                        </span>
                        <p className="text-[10px] text-neutral">
                          {toFaDigits(todayDone.length)} از {toFaDigits(todayTasks.length)} کار امروز انجام شده است
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-black text-primary">
                      {toFaDigits(todayTasks.length > 0 ? Math.round((todayDone.length / todayTasks.length) * 100) : 0)}٪
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-base-500/25 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${todayTasks.length > 0 ? (todayDone.length / todayTasks.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* بنر تسک‌های معوقه (در صورت وجود) */}
                {overdueTasks.length > 0 && (
                  <div className="sarv-card p-3 border border-warn/40 bg-warn/5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-warn">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{toFaDigits(overdueTasks.length)} کار معوقه از روزهای قبل</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRescheduleOverdueToToday(overdueTasks)}
                        className="text-[10.5px] px-2 py-0.5 rounded-lg bg-warn text-white font-bold cursor-pointer hover:bg-warn/90 active:scale-95 transition"
                      >
                        انتقال همه به امروز
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {overdueTasks.map((t) => {
                        const matched = coursesList.find((c) => c.name === t.courseName);
                        const tone = getCourseColor(matched || t.courseName);
                        const priority = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                        return (
                          <div
                            key={t.id}
                            className="p-2.5 rounded-xl bg-base border border-base-500/30 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <SarvCheckbox
                                checked={false}
                                onChange={() => handleToggleTaskStatus(t)}
                                variant="warn"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-base-content truncate cursor-pointer hover:text-primary transition-colors" onClick={() => handleOpenEditTask(t)}>{t.title}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                                  <span className={`px-1.5 py-0.2 rounded font-bold ${toneClasses[tone] || 'bg-base-500/20 text-neutral'}`}>
                                    {t.courseName || 'عمومی'}
                                  </span>
                                  <span className="text-warn font-mono">
                                    موعد: {formatTaskDateShort(t.dateStr)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => saveStudyTask({ ...t, dateStr: todayIso })}
                              className="text-[10px] px-2 py-1 rounded-lg bg-base-500/20 text-neutral hover:text-base-content transition cursor-pointer"
                              title="انتقال به امروز"
                            >
                              امروز
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* لیست کارهای امروز */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-neutral">
                      کارهای در انتظار انجام ({toFaDigits(todayPending.length)})
                    </span>
                  </div>

                  {todayPending.length === 0 ? (
                    <div className="sarv-card p-6 border border-base-500/30 text-center space-y-2">
                      <Check className="w-8 h-8 text-success mx-auto opacity-70" />
                      <p className="text-xs font-bold text-base-content">
                        {todayDone.length > 0 ? 'عالیه! همه کارهای امروز را انجام داده‌ای.' : 'برای امروز کاری ثبت نشده است.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateTask(todayIso)}
                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        + افزودن کار جدید برای امروز
                      </button>
                    </div>
                  ) : (
                    todayPending.map((t) => {
                      const matched = coursesList.find((c) => c.name === t.courseName);
                      const tone = getCourseColor(matched || t.courseName);
                      const priority = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                      return (
                        <div
                          key={t.id}
                          className="sarv-card p-3 rounded-2xl border border-base-500/40 hover:border-primary/50 shadow-xs flex items-center justify-between gap-3 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <SarvCheckbox
                              checked={false}
                              onChange={() => handleToggleTaskStatus(t)}
                              variant="primary"
                            />
                            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleOpenEditTask(t)}>
                              <p className="text-xs font-bold text-base-content truncate hover:text-primary transition-colors">{t.title}</p>
                              <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                                <span className={`px-1.5 py-0.2 rounded-md font-bold truncate max-w-[120px] ${toneClasses[tone] || 'bg-base-500/20 text-neutral'}`}>
                                  {t.courseName || 'عمومی'}
                                </span>
                                {t.timeStr && (
                                  <span className="flex items-center gap-1 font-mono text-[10px] text-primary bg-primary-soft px-1.5 py-0.2 rounded-md">
                                    <Clock className="w-3 h-3" />
                                    {toFaDigits(t.timeStr)}
                                  </span>
                                )}
                                {t.reminderEnabled && (
                                  <span className="text-primary flex items-center" title="یادآوری فعال">
                                    <Bell className="w-3 h-3" />
                                  </span>
                                )}
                                {t.priority && t.priority !== 'medium' && (
                                  <span className={`px-1.5 py-0.2 rounded-md font-bold border ${priority.color}`}>
                                    {priority.shortLabel}
                                  </span>
                                )}
                                {(t.timeSpentSeconds || 0) > 0 && (
                                  <span className="text-neutral font-mono">
                                    {toFaDigits(Math.round(t.timeSpentSeconds / 60))} د مطالعه
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartTaskFocus(t)}
                              className="p-1.5 rounded-xl bg-primary-soft hover:bg-primary hover:text-primary-content text-primary transition active:scale-95 cursor-pointer"
                              title="تمرکز با تایمر"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditTask(t)}
                              className="p-1.5 rounded-xl text-neutral hover:text-base-content hover:bg-base-500/25 transition cursor-pointer"
                              title="ویرایش"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e?.stopPropagation?.();
                                setTaskToDelete(t);
                              }}
                              className="p-1.5 rounded-xl text-neutral hover:text-danger hover:bg-danger-soft transition cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* کارهای تکمیل‌شده امروز (آکاردئونی ملایم) */}
                {todayDone.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-xs font-bold text-neutral px-1">
                      کارهای انجام‌شده ({toFaDigits(todayDone.length)})
                    </span>
                    {todayDone.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-2xl bg-base-500/10 border border-base-500/20 opacity-70 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <SarvCheckbox
                            checked={true}
                            onChange={() => handleToggleTaskStatus(t)}
                            variant="primary"
                          />
                          <p className="text-xs font-bold text-neutral line-through truncate cursor-pointer hover:text-base-content transition-colors" onClick={() => handleOpenEditTask(t)}>{t.title}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e?.stopPropagation?.();
                            setTaskToDelete(t);
                          }}
                          className="p-1.5 rounded-xl text-neutral hover:text-danger transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ۲. نمای هفتگی (WEEKLY TICKTICK STYLE) ── */}
            {taskViewMode === 'weekly' && (
              <div className="space-y-3.5">
                {/* کنترلر و ناوبری هفته */}
                <div className="sarv-card p-3 border border-base-500/40 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevWeek}
                    className="p-1.5 rounded-xl bg-base-500/20 text-neutral hover:text-base-content transition cursor-pointer"
                    title="هفته قبل"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="overflow-hidden min-w-[140px] text-center">
                    <AnimatePresence mode="wait" custom={weekSlideDir}>
                      <motion.div
                        key={`week-label-${weekOffset}`}
                        custom={weekSlideDir}
                        initial={{ opacity: 0, y: weekSlideDir * 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -weekSlideDir * 6 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                      >
                        <span className="text-xs font-black text-base-content block">
                          {weekOffset === 0
                            ? 'هفته جاری'
                            : weekOffset === 1
                            ? 'هفته آینده'
                            : weekOffset === -1
                            ? 'هفته گذشته'
                            : `${toFaDigits(Math.abs(weekOffset))} هفته ${weekOffset > 0 ? 'بعد' : 'قبل'}`}
                        </span>
                        <span className="text-[10px] text-neutral font-mono">
                          {toFaDigits(currentWeekDays[0].dayNumber)} تا {toFaDigits(currentWeekDays[6].dayNumber)} ماه
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {weekOffset !== 0 && (
                      <button
                        type="button"
                        onClick={handleResetCurrentWeek}
                        className="text-[10.5px] font-bold px-2 py-1 rounded-lg bg-primary-soft text-primary hover:bg-primary hover:text-primary-content transition cursor-pointer"
                      >
                        امروز
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleNextWeek}
                      className="p-1.5 rounded-xl bg-base-500/20 text-neutral hover:text-base-content transition cursor-pointer"
                      title="هفته بعد"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* کارت‌های روزهای هفت‌گانه (شنبه تا جمعه) با انیمیشن کشویی افقی */}
                <div className="overflow-hidden">
                  <AnimatePresence mode="wait" custom={weekSlideDir}>
                    <motion.div
                      key={`week-days-${weekOffset}`}
                      custom={weekSlideDir}
                      initial={{ opacity: 0, x: -weekSlideDir * 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: weekSlideDir * 24 }}
                      transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                      className="space-y-2.5"
                    >
                  {currentWeekDays.map((day) => {
                    const dayTasks = tasks.filter((t) => {
                      const d = t.dateStr || toLocalDateString(new Date(t.createdAt || Date.now()));
                      return d === day.isoDate;
                    });
                    const pending = dayTasks.filter((t) => t.status !== 'done');

                    return (
                      <div
                        key={day.isoDate}
                        className={`sarv-card p-3 rounded-2xl border transition ${
                          day.isToday
                            ? 'border-primary/60 bg-primary/5 shadow-xs'
                            : 'border-base-500/40 hover:border-base-500/70'
                        }`}
                      >
                        {/* هدر روز */}
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-base-500/30">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black ${day.isToday ? 'text-primary' : 'text-base-content'}`}>
                              {day.dayName} {toFaDigits(day.dayNumber)}
                            </span>
                            {day.isToday && (
                              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-primary text-primary-content">
                                امروز
                              </span>
                            )}
                            <span className="text-[10px] text-neutral">
                              ({toFaDigits(pending.length)} کار)
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenCreateTask(day.isoDate)}
                            className="p-1 rounded-lg bg-base-500/20 hover:bg-primary-soft text-neutral hover:text-primary transition cursor-pointer"
                            title={`افزودن کار برای ${day.dayName}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* لیست کارهای روز */}
                        {dayTasks.length === 0 ? (
                          <p className="text-[10.5px] text-neutral py-1.5 text-center opacity-70">
                            بدون برنامه
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {dayTasks.map((t) => {
                              const isDone = t.status === 'done';
                              const matched = coursesList.find((c) => c.name === t.courseName);
                              const tone = getCourseColor(matched || t.courseName);
                              return (
                                <div
                                  key={t.id}
                                  className={`p-2 rounded-xl flex items-center justify-between gap-2 border ${
                                    isDone
                                      ? 'bg-base-500/10 border-base-500/20 opacity-60'
                                      : 'bg-base border-base-500/30 hover:border-primary/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <SarvCheckbox
                                      checked={isDone}
                                      onChange={() => handleToggleTaskStatus(t)}
                                      variant="primary"
                                    />
                                    <span className={`text-xs font-bold truncate ${isDone ? 'line-through text-neutral' : 'text-base-content'}`}>
                                      {t.title}
                                    </span>
                                    <span className={`text-[9.5px] px-1 py-0.2 rounded font-bold truncate ${toneClasses[tone] || 'bg-base-500/20 text-neutral'}`}>
                                      {t.courseName || 'عمومی'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {!isDone && (
                                      <button
                                        type="button"
                                        onClick={() => handleStartTaskFocus(t)}
                                        className="p-1 rounded-lg bg-primary-soft text-primary hover:bg-primary hover:text-primary-content transition cursor-pointer"
                                        title="تمرکز"
                                      >
                                        <Play className="w-3 h-3 fill-current" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditTask(t)}
                                      className="p-1 rounded-lg text-neutral hover:text-base-content transition cursor-pointer"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ── ۳. بورد کانبان کلاسیک (KANBAN BOARD) ── */}
            {taskViewMode === 'kanban' && (
              <div className="space-y-3.5">
                {/* نوار فیلتر دوگانه درس و اولویت */}
                <div className="space-y-1.5">
                  {/* فیلتر درس */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                    <span className="text-[11px] font-bold text-neutral pl-1 shrink-0 flex items-center gap-1">
                      <Filter className="w-3 h-3" /> درس:
                    </span>
                    <button
                      type="button"
                      onClick={() => setKanbanFilterCourse('all')}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                        kanbanFilterCourse === 'all'
                          ? 'bg-primary text-primary-content shadow-xs'
                          : 'bg-base-500/20 text-neutral hover:bg-base-500/30'
                      }`}
                    >
                      همه ({toFaDigits(tasks.length)})
                    </button>
                    {coursesList.map((c) => (
                      <button
                        key={c.id || c.code}
                        type="button"
                        onClick={() => setKanbanFilterCourse(c.name)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                          kanbanFilterCourse === c.name
                            ? 'bg-primary text-primary-content shadow-xs'
                            : 'bg-base-500/20 text-neutral hover:bg-base-500/30'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>

                  {/* فیلتر اولویت */}
                  <div className="flex items-center gap-1.5 text-xs pt-0.5">
                    <span className="text-[11px] font-bold text-neutral pl-1 shrink-0">اولویت:</span>
                    <button
                      type="button"
                      onClick={() => setKanbanFilterPriority('all')}
                      className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                        kanbanFilterPriority === 'all'
                          ? 'bg-base-500/40 text-base-content border border-base-500/60'
                          : 'text-neutral hover:text-base-content'
                      }`}
                    >
                      همه
                    </button>
                    {Object.entries(PRIORITY_CONFIG).map(([k, p]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKanbanFilterPriority(k)}
                        className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                          kanbanFilterPriority === k
                            ? `${p.color} font-black shadow-xs`
                            : 'bg-base-500/10 text-neutral border-transparent hover:bg-base-500/20'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ستون‌های سه‌گانه کانبان (در انتظار انجام، در حال انجام، تکمیل‌شده) */}
                <div className="space-y-3">
                  {TASK_COLUMNS.map((col) => {
                    const colTasks = tasks
                      .filter((t) => t.status === col.id)
                      .filter((t) => kanbanFilterCourse === 'all' || t.courseName === kanbanFilterCourse)
                      .filter((t) => kanbanFilterPriority === 'all' || t.priority === kanbanFilterPriority)
                      .sort((a, b) => {
                        const wa = PRIORITY_CONFIG[a.priority]?.weight || 2;
                        const wb = PRIORITY_CONFIG[b.priority]?.weight || 2;
                        return wa - wb;
                      });

                    return (
                      <div key={col.id} className="sarv-card p-3 border border-base-500/40 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${col.id === 'done' ? 'bg-success' : col.id === 'in_progress' ? 'bg-primary' : 'bg-neutral'}`} />
                            <h4 className="text-xs font-black text-base-content">{col.title}</h4>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-base-500/20 text-neutral font-bold">
                              {toFaDigits(colTasks.length)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenCreateTask()}
                            className="p-1 rounded-lg text-neutral hover:text-primary transition cursor-pointer"
                            title="افزودن تکلیف جدید"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {colTasks.length === 0 ? (
                          <div className="py-4 text-center rounded-xl border border-dashed border-base-500/30 text-[11px] text-neutral">
                            هیچ تکلیفی در این ستون نیست
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {colTasks.map((t) => {
                              const matched = coursesList.find((c) => c.name === t.courseName);
                              const tone = getCourseColor(matched || t.courseName);
                              const priority = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                              return (
                                <div
                                  key={t.id}
                                  className="p-3 rounded-xl bg-base border border-base-500/30 hover:border-primary/40 shadow-xs space-y-2 transition"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => handleCycleTaskPriority(t)}
                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border cursor-pointer ${priority.color}`}
                                        title="تغییر اولویت"
                                      >
                                        {priority.shortLabel}
                                      </button>
                                      <p className="text-xs font-bold text-base-content truncate cursor-pointer hover:text-primary transition-colors" onClick={() => handleOpenEditTask(t)}>{t.title}</p>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleStartTaskFocus(t)}
                                        className="p-1 rounded-lg bg-primary-soft text-primary hover:bg-primary hover:text-primary-content transition cursor-pointer"
                                        title="شروع تمرکز"
                                      >
                                        <Play className="w-3 h-3 fill-current" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditTask(t)}
                                        className="p-1 rounded-lg text-neutral hover:text-base-content transition cursor-pointer"
                                        title="ویرایش"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e?.stopPropagation?.();
                                          setTaskToDelete(t);
                                        }}
                                        className="p-1 rounded-lg text-neutral hover:text-danger transition cursor-pointer"
                                        title="حذف"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-neutral pt-1 border-t border-base-500/20">
                                    <span className={`px-1.5 py-0.2 rounded font-bold ${toneClasses[tone] || 'bg-base-500/20 text-neutral'}`}>
                                      {t.courseName || 'عمومی'}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      {t.timeStr && (
                                        <span className="flex items-center gap-0.5 font-mono text-primary">
                                          <Clock className="w-3 h-3" />
                                          {toFaDigits(t.timeStr)}
                                        </span>
                                      )}
                                      {t.reminderEnabled && (
                                        <Bell className="w-3 h-3 text-primary" title="یادآوری فعال" />
                                      )}
                                      <span className="font-mono">{formatTaskDateShort(t.dateStr)}</span>
                                    </div>
                                  </div>

                                  {/* دکمه‌های جابجایی بین ستون‌ها */}
                                  <div className="flex items-center gap-1 pt-1 justify-end">
                                    {col.id !== 'todo' && (
                                      <button
                                        type="button"
                                        onClick={() => updateTaskStatus(t.id, 'todo')}
                                        className="text-[10px] px-2 py-0.5 rounded bg-base-500/20 text-neutral hover:text-base-content transition cursor-pointer"
                                      >
                                        ← در انتظار
                                      </button>
                                    )}
                                    {col.id !== 'in_progress' && (
                                      <button
                                        type="button"
                                        onClick={() => updateTaskStatus(t.id, 'in_progress')}
                                        className="text-[10px] px-2 py-0.5 rounded bg-primary-soft text-primary hover:bg-primary hover:text-primary-content transition cursor-pointer"
                                      >
                                        درحال انجام
                                      </button>
                                    )}
                                    {col.id !== 'done' && (
                                      <button
                                        type="button"
                                        onClick={() => updateTaskStatus(t.id, 'done')}
                                        className="text-[10.5px] px-2.5 py-1 rounded-lg bg-success/15 text-success hover:bg-success hover:text-white transition cursor-pointer flex items-center gap-1 font-bold shadow-xs active:scale-95"
                                      >
                                        <Check className="w-3 h-3 stroke-[3]" />
                                        <span>تکمیل شد</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        );
      })()}


      {/* ۳. تب تقویم و تایم‌لاین هوشمند (به همراه کلاس‌های رسمی دانشگاه و تقویم شمسی دقیق) */}
      {activeTab === 'calendar' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
          {/* سوییچر ۳ حالته نما: تقویم ماهانه، هیت‌مپ سالانه، تایم‌لاین با انیمیشن روان مستطیل */}
          <div className="sarv-seg w-full relative" dir="rtl">
            {[
              { id: 'month', label: 'تقویم ماهانه', Icon: Calendar },
              { id: 'year', label: 'هیت‌مپ سالانه', Icon: Grid },
              { id: 'timeline', label: 'ریز جلسات', Icon: History },
            ].map((v) => {
              const isSelected = calendarSubView === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setCalendarSubView(v.id)}
                  className={`relative flex-1 py-1.5 px-2 rounded-xl text-[11.5px] flex items-center justify-center gap-1 transition-colors outline-none select-none cursor-pointer z-10 ${
                    isSelected
                      ? 'text-primary-content font-bold'
                      : 'text-neutral hover:text-base-content font-medium'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="calendarSubViewIndicator"
                      className="absolute inset-0 bg-primary rounded-xl shadow-xs -z-10"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.25 }}
                    />
                  )}
                  <v.Icon className="w-3.5 h-3.5 shrink-0 relative z-10" />
                  <span className="truncate relative z-10">{v.label}</span>
                </button>
              );
            })}
          </div>

          {/* ۱. نمای تقویم ماهانه شمسی با دات‌های کلاس دانشگاه و سشن‌ها */}
          {calendarSubView === 'month' && (
            <div className="sarv-card p-4 border border-base-500/35 space-y-3">
              {/* هدر ماه با کلیدهای قبلی/بعدی */}
              <div className="flex items-center justify-between pb-2 border-b border-base-500/25 gap-2">
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="w-8 h-8 rounded-xl bg-base-500/20 hover:bg-base-500/40 text-neutral hover:text-base-content transition active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                    title="ماه قبل"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="overflow-hidden min-w-[75px] sm:min-w-[100px] text-center">
                    <AnimatePresence mode="wait" custom={monthSlideDir}>
                      <motion.h4
                        key={`${monthGrid.year}-${monthGrid.monthName}`}
                        custom={monthSlideDir}
                        initial={{ opacity: 0, y: monthSlideDir * 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -monthSlideDir * 6 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="text-[13px] font-black text-base-content whitespace-nowrap select-none"
                      >
                        {monthGrid.monthName} {toFaDigits(monthGrid.year)}
                      </motion.h4>
                    </AnimatePresence>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="w-8 h-8 rounded-xl bg-base-500/20 hover:bg-base-500/40 text-neutral hover:text-base-content transition active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                    title="ماه بعد"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenAddExam()}
                    className="h-8 px-2.5 rounded-xl bg-danger-soft text-danger hover:bg-danger hover:text-white font-bold text-[11px] border border-danger/30 active:scale-95 transition cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap shadow-2xs leading-none"
                    title="افزودن نوبت امتحان دستی یا ویرایش"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>افزودن امتحان</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMonthSlideDir(1);
                      setCalendarMonthRefDate(new Date());
                      setSelectedDate(todayIso);
                    }}
                    className="h-8 px-2.5 rounded-xl bg-primary-soft text-primary hover:bg-primary hover:text-white font-bold text-[11px] border border-primary/30 active:scale-95 transition cursor-pointer flex items-center justify-center shrink-0 whitespace-nowrap shadow-2xs leading-none"
                  >
                    امروز
                  </button>
                </div>
              </div>

              {/* نوار موعدهای آزمون و امتحانات این ترم */}
              {examsList.length > 0 && (
                <div className="p-2.5 rounded-2xl bg-base-500/15 border border-base-500/25 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] px-0.5">
                    <span className="font-bold text-base-content flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-danger" />
                      <span>امتحانات ({toFaDigits(examsList.length)} عنوان):</span>
                    </span>
                    <span className="text-[10px] text-neutral">برای پرش به روز امتحان لمس کنید</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                    {examsList.map((ex) => {
                      const isExamSelected =
                        (ex.isoDate && ex.isoDate === selectedDate) ||
                        (ex.jalaliParts &&
                          selectedDayParts &&
                          ex.jalaliParts.year === selectedDayParts.year &&
                          ex.jalaliParts.month === selectedDayParts.month &&
                          ex.jalaliParts.day === selectedDayParts.day);
                      const exTone = getCourseColor(ex.course) || ex.color || 'danger';
                      const cMeta = toneColors[exTone] || toneColors.danger;
                      return (
                        <button
                          key={ex.id || ex.code}
                          type="button"
                          onClick={() => {
                            if (ex.isoDate) setSelectedDate(ex.isoDate);
                            if (ex.jalaliParts) {
                              const d = jalaliToDate(ex.jalaliParts.year, ex.jalaliParts.month, ex.jalaliParts.day);
                              if (d) setCalendarMonthRefDate(d);
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer ${
                            isExamSelected
                              ? 'bg-danger text-white border-danger shadow-xs'
                              : 'bg-base-100 hover:bg-base-500/25 text-base-content border-base-500/30'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isExamSelected ? 'bg-white' : cMeta.dot
                            }`}
                          />
                          <span className="font-bold text-[11px] truncate max-w-[110px]">{ex.course}</span>
                          <span
                            className={`text-[9.5px] font-mono px-1 rounded ${
                              isExamSelected ? 'bg-white/20 text-white' : 'bg-base-500/25 text-neutral'
                            }`}
                          >
                            {ex.daysLeft === 0
                              ? 'امروز'
                              : ex.daysLeft === 1
                              ? 'فردا'
                              : ex.daysLeft > 0
                              ? `${toFaDigits(ex.daysLeft)} روز`
                              : 'برگزار شده'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* سرستون روزهای هفته — شروع از شنبه در سمت راست تا جمعه در چپ */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-neutral">
                {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((dayName, idx) => (
                  <div key={idx} className="py-1">
                    {dayName}
                  </div>
                ))}
              </div>

              {/* خانه روزهای ماه با انیمیشن جابجایی ماه */}
              <div className="overflow-hidden min-h-[250px]">
                <AnimatePresence mode="wait" custom={monthSlideDir}>
                  <motion.div
                    key={`${monthGrid.year}-${monthGrid.monthName}`}
                    custom={monthSlideDir}
                    initial={{ opacity: 0, x: -monthSlideDir * 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: monthSlideDir * 24 }}
                    transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                    className="grid grid-cols-7 gap-1.5"
                  >
                    {monthGrid.days.map((d, idx) => {
                      if (!d) {
                        return <div key={`empty-${idx}`} className="h-11 rounded-xl opacity-0" />;
                      }
                      const act = activityMap[d.isoDate];
                      const hasStudy = act && act.totalMinutes > 0;
                      const uniClasses = getUniversityClassesForDate(d.date);
                      const dayExams = getExamsForDay(d.isoDate, monthGrid.year, monthGrid.month, d.dayNumber);
                      const hasExam = dayExams.length > 0;
                      const isToday = d.isoDate === todayIso;
                      const isSelected = d.isoDate === selectedDate;

                      // گردآوری نشانگرهای رنگی دروس برای این روز (امتحان + کلاس دانشگاه + مطالعه)
                      const dayDots = [];
                      const seenCourses = new Set();
                      for (const ex of dayExams) {
                        const key = `e:${ex.course}`;
                        if (!seenCourses.has(key)) {
                          seenCourses.add(key);
                          dayDots.push({
                            name: `امتحان ${ex.course}`,
                            tone: getCourseColor(ex.course) || ex.color || 'danger',
                            isExam: true,
                          });
                        }
                      }
                      for (const uc of uniClasses) {
                        const key = `u:${uc.name}`;
                        if (!seenCourses.has(key)) {
                          seenCourses.add(key);
                          dayDots.push({ name: uc.name, tone: getCourseColor(uc), isUni: true });
                        }
                      }
                      if (act && Array.isArray(act.sessions)) {
                        for (const s of act.sessions) {
                          const key = `s:${s.courseName}`;
                          if (!seenCourses.has(key)) {
                            seenCourses.add(key);
                            dayDots.push({
                              name: s.courseName,
                              tone: getCourseColor(s.courseName) || s.color,
                              isUni: false,
                            });
                          }
                        }
                      }

                      return (
                        <button
                          key={d.isoDate}
                          type="button"
                          onClick={() => setSelectedDate(d.isoDate)}
                          className={`h-12 rounded-xl flex flex-col items-center justify-between py-1 transition-all active:scale-95 cursor-pointer relative ${
                            isSelected
                              ? 'bg-primary text-primary-content font-black shadow-sm ring-2 ring-primary/40'
                              : hasExam
                              ? 'bg-danger-soft/25 hover:bg-danger-soft/45 text-base-content font-black border border-danger/40 ring-1 ring-danger/30'
                              : isToday
                              ? 'bg-primary-soft text-primary font-bold border border-primary/40'
                              : hasStudy
                              ? 'bg-base-500/25 hover:bg-base-500/40 text-base-content font-bold'
                              : 'bg-base-500/10 hover:bg-base-500/20 text-neutral'
                          }`}
                          title={hasExam ? `امتحان: ${dayExams.map((e) => e.course).join('، ')}` : undefined}
                        >
                          <div className="w-full flex items-center justify-between px-1">
                            {hasExam ? (
                              <span
                                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-white text-danger' : 'bg-danger text-white shadow-xs'
                                }`}
                                title={`موعد امتحان: ${dayExams.map((e) => e.course).join('، ')}`}
                              >
                                <GraduationCap className="w-2.5 h-2.5" />
                              </span>
                            ) : (
                              <span className="w-2" />
                            )}
                            <span className="text-[12px] font-mono leading-none">
                              {toFaDigits(d.dayNumber)}
                            </span>
                            <span className="w-2" />
                          </div>

                          {/* نشانگرهای تفکیک‌شده درس به درس با رنگ و نقطه ویژه */}
                          <div className="flex items-center justify-center gap-0.5 mt-0.5 min-h-[8px] max-w-full px-0.5 overflow-hidden">
                            {dayDots.slice(0, 4).map((dotItem, di) => {
                              const cMeta = toneColors[dotItem.tone] || toneColors.primary;
                              return (
                                <span
                                  key={di}
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    isSelected
                                      ? 'bg-white shadow-xs'
                                      : dotItem.isExam
                                      ? 'bg-danger ring-1 ring-danger/60 shadow-xs'
                                      : `${cMeta.dot} ring-1 ring-black/20 shadow-xs`
                                  }`}
                                  title={`${dotItem.name} (${
                                    dotItem.isExam ? 'امتحان' : dotItem.isUni ? 'کلاس دانشگاه' : 'مطالعه'
                                  })`}
                                />
                              );
                            })}
                            {dayDots.length > 4 && (
                              <span
                                className={`text-[8px] font-black leading-none shrink-0 ${
                                  isSelected ? 'text-white' : 'text-neutral'
                                }`}
                              >
                                +{toFaDigits(dayDots.length - 4)}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* راهنمای نشانگرهای تقویم */}
              <div className="flex items-center justify-between pt-1.5 border-t border-base-500/20 text-[10.5px] text-neutral flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-danger text-white flex items-center justify-center shadow-xs">
                      <GraduationCap className="w-2.5 h-2.5" />
                    </span>
                    <span className="font-bold text-danger">موعد آزمون و امتحان</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="flex items-center gap-0.5">
                      <span className="w-2 h-2 rounded-full bg-info" />
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span className="w-2 h-2 rounded-full bg-accent" />
                    </span>
                    <span>کلاس دانشگاه و مطالعه</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAddExam()}
                  className="text-[10.5px] text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>افزودن امتحان جدید</span>
                </button>
              </div>
            </div>
          )}

          {/* ۲. نمای ماتریس و هیت‌مپ سالانه (TickTick / GitHub Matrix) */}
          {calendarSubView === 'year' && (
            <div className="sarv-card p-4 border border-base-500/35 space-y-3.5">
              {/* خلاصه عملکرد ۱ سال */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-2xl bg-primary-soft/60 border border-primary/30">
                  <p className="text-[10px] text-neutral font-bold">مجموع سالانه</p>
                  <p className="text-[16px] font-black text-primary mt-0.5 font-mono">
                    {toFaDigits(yearlyStats.totalHours)} س
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-accent-soft/60 border border-accent/30">
                  <p className="text-[10px] text-neutral font-bold">روزهای فعال</p>
                  <p className="text-[16px] font-black text-accent mt-0.5 font-mono">
                    {toFaDigits(yearlyStats.activeDays)} روز
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-warn-soft/60 border border-warn/30">
                  <p className="text-[10px] text-neutral font-bold">بهترین زنجیره</p>
                  <p className="text-[16px] font-black text-warn mt-0.5 font-mono">
                    {toFaDigits(yearlyStats.longestStreak)} روز
                  </p>
                </div>
              </div>

              {/* ماتریس ۵۲ هفته‌ای اسکرول‌پذیر */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-neutral px-1">
                  <span className="font-bold">ماتریس فعالیت ۵۲ هفته اخیر:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(todayIso);
                      scrollToTodayHeatmap(true);
                    }}
                    className="text-[10.5px] text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer bg-primary-soft/50 px-2 py-0.5 rounded-lg border border-primary/20"
                  >
                    <span>برو به امروز</span>
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                </div>

                <div
                  ref={heatmapScrollRef}
                  className="overflow-x-auto pb-2 no-scrollbar border border-base-500/30 rounded-2xl p-2.5 bg-base-500/10 flex items-center gap-1.5 direction-ltr"
                >
                  {/* برچسب‌های روزهای هفته (شنبه تا جمعه) در کنار ماتریس */}
                  <div className="flex flex-col gap-1.5 shrink-0 pr-1 select-none">
                    {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((dayAbbr, dai) => (
                      <span
                        key={dai}
                        className="w-3 h-3.5 text-[9px] font-mono text-neutral/70 flex items-center justify-center leading-none"
                      >
                        {dayAbbr}
                      </span>
                    ))}
                  </div>

                  {/* ماتریس ستونی هفته‌ها */}
                  <div className="inline-flex gap-1.5">
                    {heatmapWeeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-1.5">
                        {week.map((d) => {
                          const act = activityMap[d.isoDate];
                          const mins = act?.totalMinutes || 0;
                          const isToday = d.isoDate === todayIso;
                          const isSelected = d.isoDate === selectedDate;
                          const isFuture = d.isFuture;

                          let levelClass = 'bg-base-500/25';
                          if (mins > 120) levelClass = 'bg-primary shadow-xs';
                          else if (mins > 60) levelClass = 'bg-primary/80';
                          else if (mins > 30) levelClass = 'bg-primary/55';
                          else if (mins > 0) levelClass = 'bg-primary/35';

                          const dayExams = getExamsForDay(d.isoDate);
                          const hasExam = dayExams.length > 0;

                          if (isFuture) {
                            if (hasExam) {
                              return (
                                <button
                                  key={d.isoDate}
                                  type="button"
                                  onClick={() => setSelectedDate(d.isoDate)}
                                  className={`w-3.5 h-3.5 rounded-[4px] border border-danger/60 bg-danger-soft/30 flex items-center justify-center transition-all cursor-pointer relative ${
                                    isSelected
                                      ? 'ring-2 ring-danger scale-125 z-20 shadow-sm'
                                      : 'hover:scale-110'
                                  }`}
                                  title={`موعد آزمون: ${dayExams.map((e) => e.course).join('، ')} (${d.isoDate})`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                                </button>
                              );
                            }
                            return (
                              <div
                                key={d.isoDate}
                                className="w-3.5 h-3.5 rounded-[4px] border border-dashed border-base-500/30 opacity-25 pointer-events-none"
                              />
                            );
                          }

                          return (
                            <button
                              key={d.isoDate}
                              ref={isToday ? todayCellRef : null}
                              type="button"
                              onClick={() => setSelectedDate(d.isoDate)}
                              className={`w-3.5 h-3.5 rounded-[4px] transition-all cursor-pointer relative ${
                                hasExam && !isSelected ? 'border border-danger/50 ring-1 ring-danger/30' : ''
                              } ${levelClass} ${
                                isSelected
                                  ? 'ring-2 ring-accent scale-125 z-20'
                                  : isToday
                                  ? 'ring-2 ring-primary ring-offset-1 ring-offset-base scale-125 z-10 shadow-sm'
                                  : 'hover:scale-110'
                              }`}
                              title={`${d.isoDate} ${isToday ? '(امروز)' : ''}${
                                hasExam ? ` | موعد امتحان: ${dayExams.map((e) => e.course).join('، ')}` : ''
                              }: ${toFaDigits(mins)} دقیقه مطالعه`}
                            >
                              {isToday && (
                                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-warn shadow-xs" />
                              )}
                              {hasExam && !isToday && (
                                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-danger shadow-xs" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* راهنمای سطوح فعالیت و نشانگر امروز */}
                <div className="flex items-center justify-between text-[10.5px] text-neutral pt-1 flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 font-bold text-primary">
                    <span className="w-2.5 h-2.5 rounded-[3px] bg-primary ring-2 ring-primary ring-offset-1 ring-offset-base" />
                    کادر رنگی = امروز
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span>کمتر</span>
                    <span className="w-3 h-3 rounded-[3px] bg-base-500/25" />
                    <span className="w-3 h-3 rounded-[3px] bg-primary/35" />
                    <span className="w-3 h-3 rounded-[3px] bg-primary/55" />
                    <span className="w-3 h-3 rounded-[3px] bg-primary/80" />
                    <span className="w-3 h-3 rounded-[3px] bg-primary" />
                    <span>بیشتر</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ۳. نمای تایم‌لاین تمام جلسات */}
          {calendarSubView === 'timeline' && (
            <div className="sarv-card p-4 border border-base-500/35 space-y-3">
              {/* فیلتر درس */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <button
                  type="button"
                  onClick={() => setTimelineFilterCourse('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                    timelineFilterCourse === 'all'
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-500/20 text-neutral hover:bg-base-500/30'
                  }`}
                >
                  همه دروس ({toFaDigits(sessions.length)})
                </button>
                {coursesList.map((c) => (
                  <button
                    key={c.id || c.code}
                    type="button"
                    onClick={() => setTimelineFilterCourse(c.name)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                      timelineFilterCourse === c.name
                        ? 'bg-primary text-primary-content'
                        : 'bg-base-500/20 text-neutral hover:bg-base-500/30'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {filteredSessions.length === 0 ? (
                <p className="text-xs text-neutral text-center py-4">جلسه‌ای ثبت نشده است</p>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-0.5">
                  {filteredSessions.map((s) => {
                    const sessionTone = getCourseColor(s.courseName) || s.color || 'primary';
                    const cMeta = toneColors[sessionTone] || toneColors.primary;
                    const dateFa = new Date(s.timestamp).toLocaleDateString('fa-IR');
                    const timeFa = toFaDigits(
                      new Date(s.timestamp).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    );
                    return (
                      <div
                        key={s.id}
                        className="p-3 rounded-2xl bg-base-500/15 border border-base-500/30 flex items-center justify-between gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-xl ${cMeta.bg} ${cMeta.text} grid place-items-center shrink-0`}
                          >
                            <Clock className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-base-content truncate">
                              {s.courseName}
                            </p>
                            <p className="text-[10.5px] text-neutral mt-0.5 truncate">
                              {dateFa} · ساعت {timeFa} · {s.mode === 'stopwatch' ? 'کرنومتر آزاد' : s.mode === 'manual' ? 'ثبت دستی' : 'پومودورو'}
                              {s.taskTitle ? ` · تسک: ${s.taskTitle}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[12px] font-black text-primary font-mono ml-1">
                            {toFaDigits(s.durationMinutes)} د
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditSession(s)}
                            className="p-1.5 rounded-lg text-neutral hover:text-primary hover:bg-primary-soft transition cursor-pointer"
                            title="ویرایش نشست"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSessionToDelete(s)}
                            className="p-1.5 rounded-lg text-neutral hover:text-danger hover:bg-danger-soft transition cursor-pointer"
                            title="حذف جلسه"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ۴. پنل تفکیک جامع روز انتخاب‌شده: کلاس‌های دانشگاه + سشن‌های مطالعه */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDate}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="sarv-card p-4 border border-base-500/35 space-y-3.5"
            >
            <div className="flex items-center justify-between pb-2 border-b border-base-500/25">
              <div>
                <h4 className="text-[13.5px] font-black text-base-content flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <span>{formatFullPersianDate(selectedDayDateObj)}</span>
                </h4>
                <p className="text-[10.5px] text-neutral mt-0.5">
                  {selectedDayExams.length > 0 && (
                    <span className="text-danger font-bold">
                      {toFaDigits(selectedDayExams.length)} موعد آزمون ·{' '}
                    </span>
                  )}
                  {toFaDigits(selectedDayUniversityClasses.length)} کلاس دانشگاه · {toFaDigits(selectedDayTasks.length)} تکلیف · {toFaDigits(selectedDaySessions.length)} نشست مطالعه
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenAddExam()}
                  className="px-2 py-1 rounded-xl bg-danger-soft text-danger hover:bg-danger hover:text-white font-bold text-[10.5px] border border-danger/30 active:scale-95 transition cursor-pointer flex items-center gap-1"
                  title="افزودن نوبت امتحان برای این روز"
                >
                  <Plus className="w-3 h-3" />
                  <span>ثبت امتحان</span>
                </button>

                {selectedDate === todayIso && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-soft text-primary border border-primary/25">
                    امروز
                  </span>
                )}
              </div>
            </div>

            {/* بخش ۰: موعدهای آزمون و امتحان در این روز */}
            {selectedDayExams.length > 0 && (
              <div className="space-y-2 p-3 rounded-2xl bg-danger-soft/20 border border-danger/35">
                <div className="flex items-center justify-between">
                  <h5 className="text-[12.5px] font-black text-danger flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>موعد برگزاری امتحان در این روز:</span>
                  </h5>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-danger text-white shadow-xs font-mono">
                    {toFaDigits(selectedDayExams.length)} آزمون
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedDayExams.map((ex) => {
                    const exTone = getCourseColor(ex.course) || ex.color || 'danger';
                    return (
                      <div
                        key={ex.id || ex.code}
                        className={`p-3 rounded-xl border border-base-500/30 border-r-4 ${
                          toneClasses[exTone] || 'border-r-danger'
                        } bg-base-100/90 shadow-xs space-y-2`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-lg ${
                                ex.category === 'quiz'
                                  ? 'bg-accent-soft text-accent border border-accent/20'
                                  : ex.category === 'midterm'
                                  ? 'bg-warn-soft text-warn border border-warn/20'
                                  : 'bg-primary-soft text-primary border border-primary/20'
                              }`}>
                                {ex.category === 'quiz' ? 'کوییز' : ex.category === 'midterm' ? 'میان‌ترم' : 'پایان‌ترم'}
                              </span>
                              <h6 className="text-[13px] font-black text-base-content truncate">
                                امتحان {ex.course}
                              </h6>
                              {ex.code && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-base-500/25 text-neutral">
                                  کد {toFaDigits(ex.code)}
                                </span>
                              )}
                              {ex.unit > 0 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-base-500/25 text-neutral">
                                  {toFaDigits(ex.unit)} واحد
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[10.5px] text-neutral mt-1 flex-wrap">
                              {ex.instructor && ex.instructor !== 'ـ' && (
                                <span>استاد: {ex.instructor}</span>
                              )}
                              {ex.room && ex.room !== 'ـ' && (
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3 text-neutral" />
                                  مکان: {toFaDigits(ex.room)}
                                </span>
                              )}
                              {ex.seat && ex.seat !== '—' && ex.seat !== 'ـ' && (
                                <span>صندلی: {toFaDigits(ex.seat)}</span>
                              )}
                            </div>
                          </div>

                          {/* وضعیت روز آزمون */}
                          <div className="shrink-0 text-left">
                            {ex.daysLeft === 0 ? (
                              <span className="px-2 py-1 rounded-lg bg-danger text-white text-[10.5px] font-black flex items-center gap-1 shadow-xs animate-pulse">
                                <AlertCircle className="w-3 h-3" />
                                امروز!
                              </span>
                            ) : ex.daysLeft === 1 ? (
                              <span className="px-2 py-1 rounded-lg bg-warning text-warning-content text-[10.5px] font-bold">
                                فردا!
                              </span>
                            ) : ex.daysLeft > 1 ? (
                              <span className="px-2 py-1 rounded-lg bg-base-500/25 text-base-content text-[10.5px] font-bold font-mono">
                                {toFaDigits(ex.daysLeft)} روز مانده
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-lg bg-base-500/20 text-neutral text-[10px]">
                                برگزار شده
                              </span>
                            )}
                          </div>
                        </div>

                        {/* سطر ساعت آزمون و دکمه‌های سریع */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-base-500/20 text-[11px] gap-2 flex-wrap">
                          <span className="flex items-center gap-1 text-base-content font-bold">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            ساعت آزمون: {toFaDigits(ex.examTime || 'ـ')}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditExam(ex)}
                              className="p-1.5 rounded-lg bg-base-500/20 hover:bg-base-500/35 text-neutral hover:text-base-content transition cursor-pointer"
                              title="ویرایش یا حذف نوبت آزمون"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                const res = await exportExamToCalendar(ex);
                                if (res?.ok) {
                                  setShareToast(`امتحان «${ex.course}» به تقویم دستگاه افزوده شد`);
                                  setTimeout(() => setShareToast(''), 3000);
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-base-500/20 hover:bg-base-500/35 text-neutral hover:text-base-content text-[10px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition"
                              title="افزودن به تقویم رسمی دستگاه"
                            >
                              <CalendarPlus className="w-3 h-3" />
                              <span>تقویم دستگاه</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCourse(ex.course);
                                setActiveTab('pomo');
                                setShareToast(`درس «${ex.course}» برای مطالعه انتخاب شد`);
                                setTimeout(() => setShareToast(''), 2500);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-primary text-primary-content text-[10.5px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition shadow-xs"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>مطالعه برای امتحان</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* بخش ۱: کلاس‌های دانشگاه در این روز (از سامانه بهستان) */}
            <div className="space-y-2">
              <h5 className="text-[12px] font-black text-base-content flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-info" />
                  برنامه کلاس‌های دانشگاه در این روز:
                </span>
                <span className="text-[11px] text-neutral font-mono">
                  {toFaDigits(selectedDayUniversityClasses.length)} عنوان
                </span>
              </h5>

              {selectedDayUniversityClasses.length === 0 ? (
                <p className="text-[11px] text-neutral bg-base-500/10 p-2.5 rounded-xl text-center">
                  در این روز طبق برنامه هفتگی کلاسی در دانشگاه ندارید
                </p>
              ) : (
                <div className="space-y-1.5">
                  {selectedDayUniversityClasses.map((uc) => (
                    <div
                      key={uc.id}
                      className={`p-2.5 rounded-xl border border-base-500/25 border-r-4 ${
                        toneClasses[uc.color] || 'border-r-info'
                      } bg-base-500/15 flex items-center justify-between gap-2`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[12.5px] font-bold text-base-content truncate">{uc.name}</p>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-base-500/30 text-neutral">
                            {toFaDigits(uc.time)}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral mt-0.5 truncate">
                          استاد: {uc.professor || 'ـ'} {uc.room && uc.room !== 'ـ' ? ` · کلاس ${toFaDigits(uc.room)}` : ''}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourse(uc.name);
                          setActiveTab('pomo');
                          setShareToast(`درس «${uc.name}» برای تایمر انتخاب شد`);
                          setTimeout(() => setShareToast(''), 2500);
                        }}
                        className="p-1.5 rounded-xl bg-primary-soft text-primary hover:bg-primary hover:text-primary-content transition cursor-pointer"
                        title="انتخاب این درس برای پومودورو"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* بخش ۲: تکالیف و کارهای این روز */}
            <div className="space-y-2 pt-2 border-t border-base-500/20">
              <div className="flex items-center justify-between">
                <h5 className="text-[12px] font-black text-base-content flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-primary" />
                  <span>برنامه‌ها و کارهای این روز:</span>
                </h5>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral font-mono">
                    {toFaDigits(selectedDayTasks.filter((t) => t.status === 'done').length)} از {toFaDigits(selectedDayTasks.length)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateTask(selectedDate)}
                    className="px-2 py-0.5 rounded-lg bg-primary-soft text-primary hover:bg-primary hover:text-white font-bold text-[10.5px] border border-primary/25 active:scale-95 transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>کار جدید</span>
                  </button>
                </div>
              </div>

              {selectedDayTasks.length === 0 ? (
                <p className="text-[11px] text-neutral bg-base-500/10 p-2.5 rounded-xl text-center">
                  کاری برای این تاریخ تنظیم نشده است
                </p>
              ) : (
                <div className="space-y-1.5">
                  {selectedDayTasks.map((t) => {
                    const isDone = t.status === 'done';
                    const taskTone = getCourseColor(t.courseName) || t.color || 'primary';
                    return (
                      <div
                        key={t.id}
                        className={`p-2.5 rounded-xl border border-base-500/25 border-r-4 ${
                          toneClasses[taskTone] || 'border-r-primary'
                        } ${isDone ? 'bg-base-500/10 opacity-75' : 'bg-base-500/15'} flex items-center justify-between gap-2`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <SarvCheckbox
                            checked={isDone}
                            onChange={() => updateTaskStatus(t.id, isDone ? 'todo' : 'done')}
                            variant="success"
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              onClick={() => handleOpenEditTask(t)}
                              className={`text-[12px] font-bold text-base-content truncate cursor-pointer hover:text-primary transition-colors ${
                                isDone ? 'line-through text-neutral' : ''
                              }`}
                              title="برای ویرایش تسک کلیک کنید"
                            >
                              {t.title}
                            </p>
                            <p className="text-[10px] text-neutral truncate">
                              {t.courseName} · {PRIORITY_CONFIG[t.priority]?.label || 'اولویت عادی'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!isDone && (
                            <button
                              type="button"
                              onClick={() => handleStartTaskFocus(t)}
                              className="p-1.5 rounded-xl bg-primary-soft text-primary hover:bg-primary hover:text-white transition cursor-pointer"
                              title="شروع مطالعه برای این تسک"
                            >
                              <Play className="w-3 h-3 fill-current" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEditTask(t)}
                            className="p-1 rounded-lg text-neutral hover:text-primary hover:bg-primary-soft transition cursor-pointer"
                            title="ویرایش تسک"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e?.stopPropagation?.();
                              setTaskToDelete(t);
                            }}
                            className="p-1 rounded-lg text-neutral hover:text-danger hover:bg-danger-soft transition cursor-pointer"
                            title="حذف تسک"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* بخش ۳: نشست‌های مطالعه و تمرکز ثبت‌شده */}
            <div className="space-y-2 pt-2 border-t border-base-500/20">
              <h5 className="text-[12px] font-black text-base-content flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  نشست‌های مطالعه و تمرکز:
                </span>
                <span className="text-[11px] text-primary font-bold">
                  {selectedDayActivity ? formatMinutesHuman(selectedDayActivity.totalMinutes) : '۰ دقیقه'}
                </span>
              </h5>

              {selectedDaySessions.length === 0 ? (
                <div className="py-2.5 text-center space-y-1.5 bg-base-500/10 rounded-xl">
                  <p className="text-[11px] text-neutral">نشست مطالعه‌ای در این روز ثبت نشده است</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('pomo')}
                      className="px-3 py-1.5 rounded-xl bg-primary text-primary-content text-xs font-bold inline-flex items-center gap-1 cursor-pointer active:scale-95 transition"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>شروع تمرکز</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenManualLog(selectedDate)}
                      className="px-3 py-1.5 rounded-xl bg-base-500/25 text-base-content text-xs font-bold inline-flex items-center gap-1 cursor-pointer active:scale-95 transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>ثبت دستی</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedDaySessions.map((s) => {
                    const sessionTone = getCourseColor(s.courseName) || s.color || 'primary';
                    const cMeta = toneColors[sessionTone] || toneColors.primary;
                    const timeStr = toFaDigits(
                      new Date(s.timestamp).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    );
                    return (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-base-500/15 border border-base-500/25 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg ${cMeta.bg} ${cMeta.text} grid place-items-center shrink-0 text-xs font-bold`}
                          >
                            <span className={`w-2 h-2 rounded-full ${cMeta.dot}`} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-base-content truncate">
                              {s.courseName}
                            </p>
                            <p className="text-[10px] text-neutral truncate">
                              ساعت {timeStr} · {toFaDigits(s.durationMinutes)} دقيقه {s.taskTitle ? `· تسک: ${s.taskTitle}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSession(s)}
                            className="p-1 rounded-lg text-neutral hover:text-primary hover:bg-primary-soft transition cursor-pointer"
                            title="ویرایش نشست مطالعه"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSessionToDelete(s)}
                            className="p-1 rounded-lg text-neutral hover:text-danger hover:bg-danger-soft transition cursor-pointer"
                            title="حذف نشست مطالعه"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
        </motion.div>
      )}

      {/* ۴. تب آمار و پیوستگی */}
      {activeTab === 'stats' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* کارت پیوستگی و خلاصه */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="sarv-card p-4 border border-accent/30 bg-accent-soft flex flex-col items-center justify-center text-center">
              <Flame className="w-7 h-7 text-accent mb-1 animate-bounce" />
              <span className="text-2xl font-black text-accent">{toFaDigits(stats.streak)} روز</span>
              <span className="text-[11px] font-bold text-neutral mt-0.5">پیوستگی مطالعه</span>
            </div>

            <div className="sarv-card p-4 border border-primary/30 bg-primary-soft flex flex-col items-center justify-center text-center">
              <Clock className="w-7 h-7 text-primary mb-1" />
              <span className="text-2xl font-black text-primary">{toFaDigits(stats.todayHours)} ساعت</span>
              <span className="text-[11px] font-bold text-neutral mt-0.5">مطالعه امروز</span>
            </div>
          </div>

          {/* تفکیک دروس */}
          <section className="sarv-card p-4 border border-base-500/35 space-y-3">
            <h4 className="text-[13px] font-bold text-base-content flex items-center justify-between">
              <span>تفکیک مطالعه بر روی دروس</span>
              <span className="text-xs text-neutral">مجموع: {toFaDigits(stats.totalHours)} ساعت</span>
            </h4>

            {stats.byCourse.length === 0 ? (
              <p className="text-xs text-neutral text-center py-3">هنوز نشست مطالعه‌ای ثبت نشده است</p>
            ) : (
              <div className="space-y-2">
                {stats.byCourse.map((c) => {
                  const hrs = (c.totalMinutes / 60).toFixed(1);
                  return (
                    <div key={c.name} className="p-2.5 rounded-xl bg-base-500/15 flex items-center justify-between">
                      <span className="text-xs font-bold text-base-content">{c.name}</span>
                      <span className="text-xs font-mono font-bold text-primary">{toFaDigits(hrs)} ساعت</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* کلیدهای خروجی اکسل و استوری اینستاگرام */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleOpenStoryPreview}
              disabled={sharingBusy}
              className="py-3 rounded-2xl bg-accent text-accent-content font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>{sharingBusy ? 'در حال ساخت پوستر…' : 'استوری دستاورد'}</span>
            </button>

            <button
              type="button"
              onClick={exportStudyDataCsv}
              className="py-3 rounded-2xl bg-base-500/30 text-base-content font-bold text-xs flex items-center justify-center gap-2 border border-base-500/40 active:scale-95 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>خروجی اکسل (CSV)</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* توست اطلاع‌رسانی */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-20 left-4 right-4 z-[9999] mx-auto max-w-sm p-3 rounded-2xl bg-base/95 backdrop-blur-md border border-primary/35 shadow-xl text-xs font-bold text-base-content flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Check className="w-4 h-4 text-success shrink-0" />
              <span className="truncate">{typeof shareToast === 'string' ? shareToast : shareToast.text}</span>
            </div>
            {typeof shareToast === 'object' && shareToast.onAction && (
              <button
                type="button"
                onClick={() => {
                  const act = shareToast.onAction;
                  setShareToast('');
                  act();
                }}
                className="px-2.5 py-1 rounded-lg bg-primary text-primary-content text-xs font-black shrink-0 cursor-pointer hover:brightness-110 active:scale-95 transition"
              >
                {shareToast.actionLabel || 'ویرایش'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال تمام‌صفحه حالت تمرکز — پورتال‌شده به document.body */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {zenModeOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-base flex flex-col items-center justify-between p-6 select-none"
              >
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold text-base-content">حالت تمرکز</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setZenModeOpen(false)}
                    className="p-2 rounded-xl bg-base-500/30 text-neutral hover:text-base-content cursor-pointer active:scale-95 transition"
                    title="خروج از حالت تمرکز"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-col items-center justify-center my-auto">
                  <span className="text-xs font-bold text-neutral mb-4 px-3 py-1 rounded-xl bg-base-500/20 border border-base-500/30">
                    {selectedCourse} {pomoMode === 'stopwatch' ? '· کرنومتر آزاد' : '· تایمر دلخواه'}
                  </span>
                  <div
                    onClick={handleToggleTimer}
                    className="cursor-pointer active:scale-95 transition-transform flex flex-col items-center"
                    title="کلیک برای توقف یا ادامه"
                  >
                    <OdometerNumber
                      value={formatTimer(currentSeconds)}
                      height={76}
                      className="text-7xl font-black font-mono tracking-wider text-primary tabular-nums"
                    />
                    <p className="text-xs text-neutral mt-5 font-bold flex items-center gap-1.5">
                      {timerRunning ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                          <span>در حال تمرکز عمیق (برای توقف کلیک کنید)</span>
                        </>
                      ) : (
                        <span>متوقف شده (برای ادامه کلیک کنید)</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="w-full max-w-xs flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleTimer}
                    className={`btn flex-1 !py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-2xl active:scale-95 transition cursor-pointer ${
                      timerRunning ? 'bg-warn text-warn-content' : 'btn-primary'
                    }`}
                  >
                    {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                    <span>{timerRunning ? 'توقف موقت' : 'ادامه تمرکز'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setZenModeOpen(false)}
                    className="btn bg-base-500/30 text-base-content !py-3 px-4 text-sm font-bold rounded-2xl active:scale-95 transition cursor-pointer"
                  >
                    بستن
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* مودال ایجاد تسک جدید — پورتال‌شده به document.body */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {taskModalOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="w-full max-w-sm sarv-card p-5 border border-base-500/50 shadow-2xl space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-base-500/30">
                    <h3 className="text-sm font-black text-base-content">
                      {editingTaskId ? 'ویرایش تکلیف' : 'تعریف تسک یا مبحث جدید'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setTaskModalOpen(false)}
                      className="p-1 rounded-lg text-neutral hover:text-base-content cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveTask} className="space-y-3.5 text-right">
                    <div>
                      <label className="text-[11px] font-bold text-neutral block mb-1">عنوان تکلیف یا سرفصل:</label>
                      <input
                        type="text"
                        required
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="مثال: تمرین سری سوم فصل انتگرال"
                        className="w-full p-2.5 rounded-xl bg-base-500/20 border border-base-500/40 text-xs font-bold text-base-content outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-neutral block mb-1">درس مربوطه (از ترم جاری):</label>
                      <NativeCourseSelector
                        value={newTaskCourse}
                        onChange={setNewTaskCourse}
                        courses={coursesList}
                        modalTitle={editingTaskId ? 'تغییر درس تسک' : 'انتخاب درس برای تسک جدید'}
                        allowGeneral={true}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-neutral block mb-1.5">اولویت انجام:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(PRIORITY_CONFIG).map(([k, p]) => {
                          const isSelected = newTaskPriority === k;
                          return (
                            <button
                              key={k}
                              type="button"
                              onClick={() => setNewTaskPriority(k)}
                              className={`py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                                isSelected
                                  ? `${p.color} shadow-xs font-black ring-1 ring-current`
                                  : 'bg-base-500/20 text-neutral border-base-500/35 hover:bg-base-500/30'
                              }`}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-neutral block mb-1">تاریخ انجام کار:</label>
                      <button
                        type="button"
                        onClick={() => setTaskDatePickerOpen(true)}
                        className="w-full p-2.5 rounded-xl bg-base-500/20 border border-base-500/40 hover:border-primary/50 text-right flex items-center justify-between transition active:scale-98 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-xs font-bold text-base-content truncate">
                            {formatTaskDateDisplay(newTaskDate)}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary-soft text-primary group-hover:bg-primary/20 transition shrink-0">
                          تقویم شمسی
                        </span>
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-neutral block mb-1">ساعت انجام کار (اختیاری):</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTaskTimePickerOpen(true)}
                          className="flex-1 p-2.5 rounded-xl bg-base-500/20 border border-base-500/40 text-xs font-bold text-base-content flex items-center justify-between hover:border-primary/50 transition cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>{newTaskTime ? `ساعت ${toFaDigits(newTaskTime)}` : 'بدون ساعت مشخص (در طول روز)'}</span>
                          </span>
                          <span className="text-[10.5px] px-2 py-0.5 rounded-lg bg-primary-soft text-primary font-bold">
                            {newTaskTime ? 'تغییر' : 'تعیین ساعت'}
                          </span>
                        </button>
                        {newTaskTime && (
                          <button
                            type="button"
                            onClick={() => {
                              setNewTaskTime('');
                              setNewTaskReminder(false);
                            }}
                            className="w-9 h-9 rounded-xl bg-base-500/20 text-neutral hover:text-danger hover:bg-danger/10 grid place-items-center transition cursor-pointer"
                            title="حذف ساعت"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {newTaskTime && (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-base-500/15 border border-base-500/30">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
                            <Bell className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-base-content block">اعلان یادآوری کار</span>
                            <span className="text-[10px] text-neutral">ارسال اعلان در ساعت مشخص‌شده</span>
                          </div>
                        </div>
                        <SarvSwitch
                          checked={newTaskReminder}
                          onChange={setNewTaskReminder}
                          variant="primary"
                          aria-label="یادآوری کار"
                        />
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between gap-2">
                      {editingTaskId ? (
                        <button
                          type="button"
                          onClick={() => {
                            const target = tasks.find((t) => t.id === editingTaskId);
                            setTaskModalOpen(false);
                            setEditingTaskId(null);
                            if (target) {
                              setTaskToDelete(target);
                            }
                          }}
                          className="px-3 py-2 rounded-xl border border-danger/40 text-danger hover:bg-danger hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          title="حذف این کار"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف کار</span>
                        </button>
                      ) : <div />}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTaskModalOpen(false)}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral hover:bg-base-500/20 cursor-pointer"
                        >
                          انصراف
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-primary text-primary-content text-xs font-black shadow-md cursor-pointer hover:brightness-110 active:scale-95 transition"
                        >
                          {editingTaskId ? 'ذخیره تغییرات' : 'ثبت کار'}
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* مودال ثبت دستی و ویرایش جلسه مطالعه — پورتال‌شده به document.body */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {manualLogModalOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="w-full max-w-sm sarv-card p-5 border border-base-500/50 shadow-2xl space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-base-500/30">
                    <h3 className="text-sm font-black text-base-content flex items-center gap-1.5">
                      {editingSessionId ? (
                        <>
                          <Pencil className="w-4 h-4 text-primary" />
                          <span>ویرایش نشست مطالعه</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-primary" />
                          <span>ثبت دستی نشست مطالعه</span>
                        </>
                      )}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setManualLogModalOpen(false);
                        setEditingSessionId(null);
                      }}
                      className="p-1 rounded-lg text-neutral hover:text-base-content cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleManualLogSubmit} className="space-y-3.5 text-right">
                    <div>
                      <label className="text-[11px] font-bold text-neutral block mb-1">درس مطالعه‌شده:</label>
                      <NativeCourseSelector
                        value={manualCourse}
                        onChange={setManualCourse}
                        courses={coursesList}
                        modalTitle={editingSessionId ? 'تغییر درس مطالعه' : 'انتخاب درس برای ثبت مطالعه'}
                        allowGeneral={true}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-neutral block mb-1">مدت زمان مطالعه (دقیقه):</label>
                      <input
                        type="number"
                        min="1"
                        max="600"
                        required
                        value={manualMinutes}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setManualMinutes('');
                          } else {
                            const num = parseInt(val, 10);
                            setManualMinutes(isNaN(num) ? '' : Math.min(600, Math.max(1, num)));
                          }
                        }}
                        onBlur={() => {
                          if (!manualMinutes || Number(manualMinutes) < 1) {
                            setManualMinutes(30);
                          }
                        }}
                        placeholder="۳۰"
                        className="w-full p-2.5 rounded-xl bg-base-500/20 border border-base-500/40 text-xs font-bold text-base-content font-mono outline-none focus:border-primary transition-colors text-center"
                      />
                      <div className="flex items-center gap-1 pt-1.5 flex-wrap justify-center">
                        {[15, 30, 45, 60, 90, 120].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setManualMinutes(m)}
                            className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                              Number(manualMinutes) === m
                                ? 'bg-primary text-primary-content font-black shadow-xs'
                                : 'bg-base-500/20 text-neutral border-transparent hover:bg-base-500/30'
                            }`}
                          >
                            {toFaDigits(m)} دقیقه
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-neutral block mb-1">تاریخ نشست مطالعه:</label>
                      <button
                        type="button"
                        onClick={() => setSessionDatePickerOpen(true)}
                        className="w-full p-2.5 rounded-xl bg-base-500/20 border border-base-500/40 hover:border-primary/50 text-right flex items-center justify-between transition active:scale-98 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-xs font-bold text-base-content truncate">
                            {formatTaskDateDisplay(manualDate)}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary-soft text-primary group-hover:bg-primary/20 transition shrink-0">
                          تقویم شمسی
                        </span>
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-neutral block mb-1">موضوع یا یادداشت (اختیاری):</label>
                      <input
                        type="text"
                        value={manualNote}
                        onChange={(e) => setManualNote(e.target.value)}
                        placeholder="مثال: مطالعه سرفصل انتگرال، حل تمرین ۳"
                        className="w-full p-2.5 rounded-xl bg-base-500/20 border border-base-500/40 text-xs font-bold text-base-content outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setManualLogModalOpen(false);
                          setEditingSessionId(null);
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral hover:bg-base-500/20 cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-primary text-primary-content text-xs font-black shadow-md cursor-pointer hover:brightness-110 active:scale-95 transition"
                      >
                        {editingSessionId ? 'ذخیره تغییرات' : 'ثبت در گزارش‌ها'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* مودال پیش‌نمایش پوستر استوری — پورتال‌شده به document.body */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {sharePreview && (
              <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setSharePreview(null);
                    setShareMsg('');
                  }}
                  className="absolute inset-0 bg-black/65 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ y: '100%', opacity: 0.5 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0.5 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  className="relative z-10 w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-4 shadow-2xl max-h-[90vh] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* هدر مودال */}
                  <div className="flex items-center justify-between pb-3 border-b border-base-500/30 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="relative w-6 h-6 flex items-center justify-center">
                        <svg viewBox="0 0 1080 1080" className="w-full h-full fill-accent drop-shadow-sm">
                          <path d="M540,167.08 C540,167.08 213.25,912.92 540,912.92 C866.75,912.92 540,167.08 540,167.08 Z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold text-base-content">
                          پوستر استوری گزارش مطالعه
                        </h3>
                        <p className="text-[10px] text-neutral">طرح رزولوشن بالا ۱۰۸۰p ویژه همرسانی در شبکه‌های اجتماعی</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSharePreview(null);
                        setShareMsg('');
                      }}
                      className="w-8 h-8 rounded-full bg-base-500/30 hover:bg-base-500/50 text-neutral grid place-items-center active:scale-95 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* کانتینر پیش‌نمایش تصویر */}
                  <div className="flex-1 overflow-y-auto py-3 pr-0.5">
                    <div className="relative rounded-2xl overflow-hidden border border-base-500/50 shadow-lg bg-black/40">
                      <img
                        src={sharePreview.url}
                        alt="پیش‌نمایش استوری مطالعه"
                        className="w-full h-auto object-contain block"
                      />
                    </div>
                  </div>

                  {shareMsg && (
                    <p className="text-[11px] text-accent bg-accent-soft border border-accent/30 rounded-xl px-3 py-1.5 mb-2 text-center font-bold">
                      {shareMsg}
                    </p>
                  )}

                  {/* اکشن‌بار سه‌گانه: اشتراک‌گذاری، دانلود و کپی */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-base-500/30 shrink-0">
                    <button
                      type="button"
                      onClick={handleShareNative}
                      className="btn btn-primary !py-2.5 text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      اشتراک‌گذاری
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadPreview}
                      className="btn bg-base-500/30 hover:bg-base-500/50 text-base-content border border-base-500/50 !py-2.5 text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      دانلود تصویر
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyPreview}
                      className="btn bg-base-500/30 hover:bg-base-500/50 text-base-content border border-base-500/50 !py-2.5 text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      {copiedPreview ? (
                        <>
                          <Check className="w-4 h-4 text-success" />
                          کپی شد!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          کپی تصویر
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* مودال افزودن و ویرایش نوبت امتحان */}
      <ExamEditModal
        isOpen={isExamModalOpen}
        exam={editingExam}
        courses={coursesList}
        onClose={() => setIsExamModalOpen(false)}
        onSave={handleSaveExam}
        onDelete={handleDeleteExam}
      />

      {/* تقویم نیتیو و شمسی سرو برای انتخاب تاریخ انجام کار */}
      <SarvDatePickerModal
        isOpen={taskDatePickerOpen}
        initialDate={newTaskDate}
        title="انتخاب تاریخ انجام کار"
        subtitle="تقویم هوشمند برنامه‌ریزی مطالعه"
        mode="task"
        onClose={() => setTaskDatePickerOpen(false)}
        onConfirm={(_, jsDate) => {
          if (jsDate) {
            setNewTaskDate(toLocalDateString(jsDate));
          }
          setTaskDatePickerOpen(false);
        }}
      />

      {/* مودال چرخشی تنظیم ساعت انجام کار */}
      <SarvTimePickerModal
        isOpen={taskTimePickerOpen}
        initialTime={newTaskTime || '10:00'}
        title="تنظیم ساعت انجام کار"
        onClose={() => setTaskTimePickerOpen(false)}
        onConfirm={(newTime) => {
          setNewTaskTime(newTime);
          setNewTaskReminder(true);
          setTaskTimePickerOpen(false);
          setShareToast(`ساعت ${toFaDigits(newTime)} برای این کار انتخاب شد`);
          setTimeout(() => setShareToast(''), 2500);
        }}
      />

      {/* تقویم نیتیو و شمسی سرو برای انتخاب تاریخ نشست مطالعه */}
      <SarvDatePickerModal
        isOpen={sessionDatePickerOpen}
        initialDate={manualDate}
        title="انتخاب تاریخ نشست مطالعه"
        subtitle="تقویم هوشمند برنامه‌ریزی مطالعه"
        mode="task"
        onClose={() => setSessionDatePickerOpen(false)}
        onConfirm={(_, jsDate) => {
          if (jsDate) {
            setManualDate(toLocalDateString(jsDate));
          }
          setSessionDatePickerOpen(false);
        }}
      />
      {/* مودال تایید حذف نشست مطالعه — پورتال‌شده به document.body */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {sessionToDelete && (
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
                onClick={() => setSessionToDelete(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="w-full max-w-sm sarv-card p-5 border border-base-500/50 shadow-2xl space-y-4 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-danger-soft text-danger grid place-items-center shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-base-content">حذف نشست مطالعه</h3>
                      <p className="text-[11px] text-neutral mt-0.5">این عملیات قابل بازگشت نیست</p>
                    </div>
                  </div>

                  <p className="text-xs text-neutral leading-relaxed">
                    آیا از حذف نشست مطالعه درس <strong className="text-base-content">«{sessionToDelete.courseName || 'عمومی'}»</strong> به مدت <strong className="text-base-content font-mono">{toFaDigits(sessionToDelete.durationMinutes || 0)} دقیقه</strong> اطمینان دارید؟
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSessionToDelete(null)}
                      className="flex-1 py-2.5 rounded-xl border border-base-500/40 text-xs font-bold text-neutral hover:text-base-content hover:bg-base-500/20 transition cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const sid = sessionToDelete.id;
                        setSessionToDelete(null);
                        handleDeleteSession(sid);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-danger text-white text-xs font-bold hover:bg-danger/90 transition shadow-sm cursor-pointer"
                    >
                      حذف جلسه
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
      {/* مودال تایید حذف کار مطالعه — پورتال‌شده به document.body */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {taskToDelete && (
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
                onClick={() => setTaskToDelete(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="w-full max-w-sm sarv-card p-5 border border-base-500/50 shadow-2xl space-y-4 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-danger-soft text-danger grid place-items-center shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-base-content">حذف کار از برنامه</h3>
                      <p className="text-[11px] text-neutral mt-0.5">این عملیات قابل بازگشت نیست</p>
                    </div>
                  </div>

                  <p className="text-xs text-neutral leading-relaxed">
                    آیا از حذف کار <strong className="text-base-content">«{taskToDelete.title}»</strong>{taskToDelete.courseName ? <span> مربوط به درس <strong className="text-base-content">«{taskToDelete.courseName}»</strong></span> : null} از برنامه مطالعه اطمینان دارید؟
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setTaskToDelete(null)}
                      className="flex-1 py-2.5 rounded-xl border border-base-500/40 text-xs font-bold text-neutral hover:text-base-content hover:bg-base-500/20 transition cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const tid = taskToDelete.id;
                        setTaskToDelete(null);
                        handleDeleteTask(tid);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-danger text-white text-xs font-bold hover:bg-danger/90 transition shadow-sm cursor-pointer"
                    >
                      حذف کار
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
