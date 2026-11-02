/**
 * پل ارتباطی رسمی سروستان و مهستان (Sarvestan-Mehestan Bridge)
 * تبادل داده‌های دروس، اساتید، رنگ‌ها و همگام‌سازی کامل تکالیف مودل با تقویم و پلنر
 */
import { getSnapshot, getCurrentTermSchedule } from './behestan/store';
import { detectCurrentTermId } from './behestan/parsers';
import { getStudyTasks, saveStudyTask } from './studyPlanner';
import { toLocalDateString } from './calendarHelper';
import { getToneForCourse, cleanCourseName } from '../data/viewModel';

const SYNC_CHANNEL = 'sarvestan_mehestan_channel';
const LOCAL_STORAGE_DATA_KEY = 'mehestan_sarvestan_synced_data';
const SYNC_QUEUE_KEY = 'sarvestan_mehestan_sync_queue';

export { cleanCourseName };

function importSingleTask(item, allCourses) {
  if (!item || !item.title) return null;

  const itemTitle = String(item.title).trim();
  const rawCourseName = item.courseName || '';
  const rawCourseCode = item.courseCode || '';
  const cleanRaw = cleanCourseName(rawCourseName);

  const matchedCourse = (allCourses || []).find((c) => {
    if (!c) return false;
    const cClean = cleanCourseName(c.name || c.title || '');
    if (cleanRaw && cClean && (cleanRaw === cClean || cleanRaw.includes(cClean) || cClean.includes(cleanRaw))) return true;
    if (rawCourseCode && c.code && (String(c.code).includes(rawCourseCode) || rawCourseCode.includes(String(c.code)))) return true;
    return false;
  });

  let dateStr = item.dateStr || null;
  let timeStr = item.timeStr || null;
  const now = new Date();
  const todayIso = toLocalDateString(now);

  const rawDue = item.dueTimestamp || item.dueDate;
  if (rawDue) {
    try {
      const d = new Date(typeof rawDue === 'number' ? rawDue : rawDue);
      if (!isNaN(d.getTime())) {
        dateStr = toLocalDateString(d);
        timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    } catch {}
  }

  if (!dateStr) {
    dateStr = todayIso;
  }

  const existingTasks = getStudyTasks();
  const extId = item.externalId ? String(item.externalId) : item.id ? String(item.id) : null;
  const existing = existingTasks.find((t) => {
    if (extId && t.externalId === extId) return true;
    if (t.title === itemTitle) return true;
    return false;
  });

  // استفاده از عنوان استاندارد درس در سروستان جهت هماهنگی کامل با فیلترها و لیست دروس
  const finalCourseName = matchedCourse?.name || cleanRaw || '';

  const taskPayload = {
    id: existing ? existing.id : undefined,
    externalId: extId,
    title: itemTitle,
    courseName: finalCourseName,
    courseCode: matchedCourse?.code || rawCourseCode || null,
    color: matchedCourse ? getToneForCourse(matchedCourse) : item.color || getToneForCourse(finalCourseName),
    priority: item.priority || 'high',
    status: existing?.status || item.status || 'todo',
    dateStr,
    timeStr,
    source: 'mehestan',
    updatedAt: Date.now(),
  };

  return saveStudyTask(taskPayload);
}

function processIncomingSync(type, payload, allCourses) {
  if (!payload) return;

  let importedCount = 0;
  if (type === 'single_task') {
    const res = importSingleTask(payload, allCourses);
    if (res) importedCount++;
  } else if (type === 'batch_tasks' && Array.isArray(payload)) {
    payload.forEach((t) => {
      const res = importSingleTask(t, allCourses);
      if (res) importedCount++;
    });
  } else if (type === 'full_sync') {
    if (Array.isArray(payload.assignments)) {
      payload.assignments.forEach((a) => {
        const res = importSingleTask(
          {
            id: a.id,
            externalId: a.id,
            title: a.title,
            courseName: a.courseName,
            dueDate: a.dueDate,
            priority: 'high',
          },
          allCourses
        );
        if (res) importedCount++;
      });
    }
  }

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('sarv_study_target_tab', 'kanban');
    } catch {}
    window.dispatchEvent(new CustomEvent('sarvShortcut', { detail: 'study' }));
    window.dispatchEvent(new CustomEvent('sarvOpenKanban'));
    window.dispatchEvent(new CustomEvent('sarvStudyUpdated'));
    const msg = importedCount > 0
      ? `${importedCount} تکلیف از مهستان با موفقیت به برنامه درسی افزوده شد.`
      : 'تکالیف مهستان در برنامه درسی به‌روزرسانی شدند.';
    window.dispatchEvent(new CustomEvent('sarvToast', { detail: msg }));
  }
}

/**
 * ارسال و همگام‌سازی مستقیم برنامه و رنگ دروس با مهستان از طریق اینترفیس نیتیو یا دیپ‌لینک
 */
export function exportScheduleToMehestan() {
  if (typeof window === 'undefined') return false;

  const snap = getSnapshot();
  const term = detectCurrentTermId(snap?.courses || []) || '4051';
  const schedule = getCurrentTermSchedule(term) || [];
  const courses = (snap?.courses || []).map((c) => ({
    code: c.code || '',
    name: c.name || '',
    color: c.color || getToneForCourse(c),
    professor: c.professor || '',
    group: c.group || '',
    units: c.units || '',
  }));
  const scheduleWithColors = schedule.map((s) => ({
    code: s.code || '',
    name: s.name || '',
    color: s.color || getToneForCourse(s),
    professor: s.professor || '',
    day: s.day || '',
    time: s.time || '',
  }));

  const payload = {
    schedule: scheduleWithColors,
    courses,
    exportedAt: Date.now(),
  };

  const encoded = encodeURIComponent(JSON.stringify(payload));
  const deepLink = `mehestan://sync-schedule?data=${encoded}`;

  if (window.MehestanLauncher && typeof window.MehestanLauncher.openMehestan === 'function') {
    try {
      const ok = window.MehestanLauncher.openMehestan(deepLink);
      if (ok) return true;
    } catch (e) {
      console.warn('MehestanLauncher error:', e);
    }
  }

  try {
    window.location.href = deepLink;
    return true;
  } catch (e) {
    try {
      window.open('https://mjb4khshi.github.io/sarvestan', '_blank');
    } catch {}
  }
  return true;
}

export function initMehestanBridge() {
  if (typeof window === 'undefined') return () => {};

  let bc = null;

  const getAllCoursesWithColors = () => {
    const snap = getSnapshot();
    const term = detectCurrentTermId(snap?.courses || []) || '4051';
    const schedule = getCurrentTermSchedule(term) || [];
    const courses = (snap?.courses || []).map((c) => ({
      ...c,
      color: getToneForCourse(c),
    }));
    const scheduleWithColors = schedule.map((s) => ({
      ...s,
      color: getToneForCourse(s),
    }));
    const combined = [...scheduleWithColors];
    courses.forEach((c) => {
      if (!combined.some((x) => x.name === c.name || (x.code && x.code === c.code))) {
        combined.push(c);
      }
    });
    return { snap, term, schedule: scheduleWithColors, courses: combined };
  };

  const broadcastData = () => {
    const { snap, schedule, courses } = getAllCoursesWithColors();
    const payload = {
      courses,
      schedule,
      profile: snap?.profile || null,
      sentAt: Date.now(),
    };

    if (bc) {
      try {
        bc.postMessage({ type: 'SARVESTAN_DATA_RESPONSE', payload });
      } catch {}
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_DATA_KEY, JSON.stringify(payload));
    } catch {}
  };

  // بررسی صف همگام‌سازی در حافظه محلی
  const flushLocalStorageQueue = () => {
    try {
      const rawQueue = localStorage.getItem(SYNC_QUEUE_KEY);
      if (!rawQueue) return;
      const items = JSON.parse(rawQueue);
      if (Array.isArray(items) && items.length > 0) {
        const { courses } = getAllCoursesWithColors();
        items.forEach((item) => {
          if (item && item.type && item.payload) {
            processIncomingSync(item.type, item.payload, courses);
          }
        });
        localStorage.removeItem(SYNC_QUEUE_KEY);
      }
    } catch (e) {
      console.warn('Failed to flush Mehestan sync queue:', e);
    }
  };

  const parseAndApplyPayloadString = (rawJsonString) => {
    try {
      if (!rawJsonString) return;
      const parsed = JSON.parse(rawJsonString);
      const { courses } = getAllCoursesWithColors();
      if (Array.isArray(parsed)) {
        processIncomingSync('batch_tasks', parsed, courses);
      } else {
        processIncomingSync('single_task', parsed, courses);
      }
    } catch (e) {
      console.warn('Failed to parse incoming payload string:', e);
    }
  };

  const handleDeepLinkString = (rawUri) => {
    if (!rawUri || typeof rawUri !== 'string') return;
    try {
      if (rawUri.includes('export-schedule')) {
        exportScheduleToMehestan();
        return;
      }
      let rawData = null;
      if (rawUri.includes('data=')) {
        const parts = rawUri.split('data=');
        if (parts.length > 1) {
          rawData = parts.slice(1).join('data=');
        }
      } else if (rawUri.includes('import_task=')) {
        const parts = rawUri.split('import_task=');
        if (parts.length > 1) {
          rawData = parts.slice(1).join('import_task=');
        }
      }
      if (rawData) {
        parseAndApplyPayloadString(decodeURIComponent(rawData));
      }
    } catch (e) {
      console.warn('Error handling deep link URI:', e);
    }
  };

  // استخراج و بررسی پارامترهای URL یا دیپ‌لینک
  const checkUrlImport = () => {
    try {
      const url = new URL(window.location.href);
      const importData = url.searchParams.get('import_task') || url.searchParams.get('data');
      if (importData) {
        parseAndApplyPayloadString(decodeURIComponent(importData));
        url.searchParams.delete('import_task');
        url.searchParams.delete('data');
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    } catch {}
  };

  try {
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel(SYNC_CHANNEL);

      bc.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'REQUEST_SARVESTAN_DATA') {
          broadcastData();
        } else if (type === 'single_task' || type === 'batch_tasks' || type === 'full_sync') {
          const { courses } = getAllCoursesWithColors();
          processIncomingSync(type, payload, courses);
          try {
            localStorage.setItem('sarvestan_moodle_synced_tasks', JSON.stringify(payload));
          } catch {}
        }
      };
    }

    const handleStorageEvent = (e) => {
      if (e.key === SYNC_QUEUE_KEY) {
        flushLocalStorageQueue();
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    const handleDeepLinkEvent = (e) => {
      if (e?.detail) handleDeepLinkString(e.detail);
    };
    window.addEventListener('sarvDeepLink', handleDeepLinkEvent);

    broadcastData();
    flushLocalStorageQueue();
    checkUrlImport();

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('sarvDeepLink', handleDeepLinkEvent);
    };
  } catch (err) {
    console.warn('Sarvestan-Mehestan Bridge initialization error:', err);
    return () => {};
  }
}
