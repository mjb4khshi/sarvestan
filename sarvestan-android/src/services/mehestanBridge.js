/**
 * پل ارتباطی رسمی سروستان و مهستان (Sarvestan-Mehestan Bridge)
 * تبادل داده‌های دروس، اساتید، رنگ‌ها و همگام‌سازی کامل تکالیف مودل با تقویم و پلنر
 */
import { getSnapshot, getCurrentTermSchedule } from './behestan/store';
import { detectCurrentTermId } from './behestan/parsers';
import { getStudyTasks, saveStudyTask } from './studyPlanner';
import { toLocalDateString } from './calendarHelper';
import { getToneForCourse } from '../data/viewModel';

const SYNC_CHANNEL = 'sarvestan_mehestan_channel';
const LOCAL_STORAGE_DATA_KEY = 'mehestan_sarvestan_synced_data';
const SYNC_QUEUE_KEY = 'sarvestan_mehestan_sync_queue';

function importSingleTask(item, allCourses) {
  if (!item || !item.title) return null;

  const itemTitle = String(item.title).trim();
  const rawCourseName = item.courseName || '';
  const rawCourseCode = item.courseCode || '';

  const matchedCourse = allCourses.find((c) => {
    if (!c) return false;
    if (rawCourseName && c.name && (c.name.includes(rawCourseName) || rawCourseName.includes(c.name))) return true;
    if (rawCourseCode && c.code && c.code.includes(rawCourseCode)) return true;
    return false;
  });

  let dateStr = item.dateStr;
  let timeStr = item.timeStr || null;

  if (item.dueDate) {
    try {
      const d = new Date(item.dueDate);
      if (!isNaN(d.getTime())) {
        dateStr = toLocalDateString(d);
        timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    } catch {}
  }

  if (!dateStr) {
    dateStr = toLocalDateString(new Date());
  }

  const existingTasks = getStudyTasks();
  const extId = item.externalId ? String(item.externalId) : item.id ? String(item.id) : null;
  const existing = existingTasks.find((t) => {
    if (extId && t.externalId === extId) return true;
    if (t.title === itemTitle && t.dateStr === dateStr) return true;
    return false;
  });

  const taskPayload = {
    id: existing ? existing.id : undefined,
    externalId: extId,
    title: itemTitle,
    courseName: rawCourseName || matchedCourse?.name || '',
    courseCode: matchedCourse?.code || rawCourseCode || null,
    color: matchedCourse ? getToneForCourse(matchedCourse) : item.color || 'primary',
    priority: item.priority || 'high',
    status: existing ? existing.status : 'todo',
    dateStr,
    timeStr,
    source: 'mehestan',
    updatedAt: Date.now(),
  };

  return saveStudyTask(taskPayload);
}

function processIncomingSync(type, payload, allCourses) {
  if (!payload) return;

  if (type === 'single_task') {
    importSingleTask(payload, allCourses);
  } else if (type === 'batch_tasks' && Array.isArray(payload)) {
    payload.forEach((t) => importSingleTask(t, allCourses));
  } else if (type === 'full_sync') {
    if (Array.isArray(payload.assignments)) {
      payload.assignments.forEach((a) => {
        importSingleTask(
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
      });
    }
  }
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
    return { snap, term, schedule: scheduleWithColors, courses };
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

  // استخراج و بررسی پارامترهای URL یا دیپ‌لینک
  const checkUrlImport = () => {
    try {
      const url = new URL(window.location.href);
      const importData = url.searchParams.get('import_task') || url.searchParams.get('data');
      if (importData) {
        const parsed = JSON.parse(decodeURIComponent(importData));
        const { courses } = getAllCoursesWithColors();
        if (Array.isArray(parsed)) {
          processIncomingSync('batch_tasks', parsed, courses);
        } else {
          processIncomingSync('single_task', parsed, courses);
        }
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

    broadcastData();
    flushLocalStorageQueue();
    checkUrlImport();

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  } catch (err) {
    console.warn('Sarvestan-Mehestan Bridge initialization error:', err);
    return () => {};
  }
}
