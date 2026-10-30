import { calculateStudyStats, getStudyTasks } from './studyPlanner';
import { getViewModel } from '../data/viewModel';

let _syncDebounce = null;

/** درخواست همگام‌سازی فوری ویجت‌ها با دی‌بانس ۱۲۰ میلی‌ثانیه‌ای */
export function requestWidgetSync() {
  if (typeof window === 'undefined') return;
  if (_syncDebounce) clearTimeout(_syncDebounce);
  _syncDebounce = setTimeout(() => {
    updateAndroidWidget().catch(() => {});
  }, 120);
}

/** ثبت شنونده‌های تغییرات محلی برای به‌روزرسانی آنی و زنده ویجت‌ها */
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('sarvStudyUpdated', () => {
      requestWidgetSync();
    });
    window.addEventListener('sarvThemeChanged', () => {
      requestWidgetSync();
    });
    window.addEventListener('sarvExamsUpdated', () => {
      requestWidgetSync();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // به‌روزرسانی بلافاصله در لحظه خروج کاربر از برنامه به صفحه اصلی
        requestWidgetSync();
      }
    });
  } catch {}
}

/** به‌روزرسانی ویجت‌های اندروید بعد از سنک یا تغییر تسک‌ها و تنظیمات */
export async function updateAndroidWidget(vm = null) {
  try {
    const C = globalThis.Capacitor;
    const p = C?.Plugins?.SarvestanWidget;
    if (!p?.update) return false;

    const effectiveVm = vm || (typeof getViewModel === 'function' ? getViewModel() : null);
    const next = effectiveVm?.nextClass;
    const exams = effectiveVm?.exams || [];
    const exam = exams[0];
    const secondExam = exams[1];

    let studyStats = {};
    try {
      studyStats = calculateStudyStats() || {};
    } catch {}

    const studyMins = Math.round((studyStats.todaySeconds || 0) / 60);
    const studyStreak = studyStats.streak || studyStats.currentStreak || 0;

    let tasksDoneCount = 0;
    let tasksTotalCount = 0;
    let topTaskTitle = '';
    let secondTaskTitle = '';
    try {
      const allTasks = getStudyTasks() || [];
      const now = new Date();
      const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const todayTasks = allTasks.filter((t) => !t.dateStr || t.dateStr === todayIso);
      const activeList = todayTasks.length > 0 ? todayTasks : allTasks;
      tasksTotalCount = activeList.length;
      tasksDoneCount = activeList.filter((t) => t.status === 'done').length;
      const pendingTasks = activeList.filter((t) => t.status !== 'done');
      if (pendingTasks[0]) topTaskTitle = pendingTasks[0].title || '';
      if (pendingTasks[1]) secondTaskTitle = pendingTasks[1].title || '';
    } catch {}

    let themeMode = 'auto';
    try {
      const activeId = localStorage.getItem('sarvestan_theme');
      if (activeId) {
        themeMode = activeId.includes('light') ? 'light' : activeId.includes('dark') ? 'dark' : 'auto';
      }
    } catch {}

    await p.update({
      nextTitle: next?.title || '',
      nextTime: next?.isUpcomingDay ? `${next.dayLabel} ${next.time}` : next?.time || '',
      nextRoom: next?.room || '',
      examTitle: exam?.course || '',
      examDays: exam?.daysLeft ?? -1,
      examDate: exam?.examDate || '',
      secondExamTitle: secondExam?.course || '',
      secondExamDays: secondExam?.daysLeft ?? -1,
      gpa: effectiveVm?.summary?.gpa || '',
      unitsPassed: effectiveVm?.summary?.unitsPassed ? String(effectiveVm.summary.unitsPassed) : '',
      termGpa: effectiveVm?.summary?.termGpa ? String(effectiveVm.summary.termGpa) : '',
      studyMinutes: studyMins,
      studyStreak: studyStreak,
      studySubject: studyStats.topCourse || 'مطالعه و پلنر',
      tasksDoneCount,
      tasksTotalCount,
      topTaskTitle,
      secondTaskTitle,
      theme: themeMode,
    });
    return true;
  } catch {
    return false;
  }
}

export function isNativeCapacitor() {
  try {
    return Boolean(globalThis.Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}
