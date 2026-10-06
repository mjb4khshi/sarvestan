/**
 * سرویس مدیریت برنامه‌ریزی درسی، تایمر پومودورو، استریک و گزارش‌های مطالعه
 * ذخیره‌سازی آفلاین و محلی بر روی حافظه دستگاه
 */
import { toLocalDateString } from './calendarHelper.js';

const STORAGE_KEYS = {
  TASKS: 'sarv_study_tasks_v1',
  SESSIONS: 'sarv_study_sessions_v1',
  SETTINGS: 'sarv_study_settings_v1',
};

export const POMO_MODES = {
  CUSTOM: { id: 'custom', label: 'تایمر دلخواه', minutes: 30, color: 'accent' },
  STOPWATCH: { id: 'stopwatch', label: 'کرنومتر آزاد', minutes: 0, color: 'primary' },
};

export const TASK_COLUMNS = [
  { id: 'todo', label: 'برای مطالعه', badge: 'bg-base-500/30 text-neutral' },
  { id: 'in_progress', label: 'در حال خواندن', badge: 'bg-primary-soft text-primary' },
  { id: 'done', label: 'تکمیل شده', badge: 'bg-success-soft text-success' },
];

const memStore = {};

function read(key, fallback) {
  try {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    }
  } catch {}
  return memStore[key] ? JSON.parse(memStore[key]) : fallback;
}

function write(key, data) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
      return;
    }
  } catch (e) {
    console.warn('[studyPlanner storage write error]', e);
  }
  memStore[key] = JSON.stringify(data);
}

function notifyUpdate() {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('sarvStudyUpdated'));
    } catch {}
  }
}

// ── تسک‌ها ──

export function getStudyTasks() {
  return read(STORAGE_KEYS.TASKS, []);
}

export function saveStudyTask(task) {
  const tasks = getStudyTasks();
  const now = Date.now();
  let savedTask = null;
  if (task.id) {
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      savedTask = { ...tasks[idx], ...task, updatedAt: now };
      tasks[idx] = savedTask;
    } else {
      savedTask = { ...task, createdAt: now, updatedAt: now };
      tasks.unshift(savedTask);
    }
  } else {
    savedTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      status: task.status || 'todo',
      timeSpentSeconds: task.timeSpentSeconds || 0,
      createdAt: now,
      updatedAt: now,
    };
    tasks.unshift(savedTask);
  }
  write(STORAGE_KEYS.TASKS, tasks);
  notifyUpdate();
  return savedTask;
}

export function deleteStudyTask(taskId) {
  const tasks = getStudyTasks().filter((t) => t.id !== taskId);
  write(STORAGE_KEYS.TASKS, tasks);
  notifyUpdate();
  return tasks;
}

export function updateTaskStatus(taskId, newStatus) {
  const tasks = getStudyTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.status = newStatus;
    task.updatedAt = Date.now();
    write(STORAGE_KEYS.TASKS, tasks);
    notifyUpdate();
  }
  return task || null;
}

export function addTimeSpentToTask(taskId, seconds) {
  if (!taskId || seconds <= 0) return;
  const tasks = getStudyTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.timeSpentSeconds = (task.timeSpentSeconds || 0) + seconds;
    task.updatedAt = Date.now();
    write(STORAGE_KEYS.TASKS, tasks);
    notifyUpdate();
  }
}

// ── سشن‌های مطالعه (Sessions) ──

export function getStudySessions() {
  return read(STORAGE_KEYS.SESSIONS, []);
}

export function logStudySession({
  courseCode,
  courseName,
  taskId,
  taskTitle,
  durationMinutes,
  mode = 'pomo',
  color = 'primary',
  dateStr = null,
  timestamp = null,
}) {
  if (!durationMinutes || durationMinutes <= 0) return null;
  const sessions = getStudySessions();
  const now = new Date();
  const sessionDateStr = dateStr || toLocalDateString(now);
  const newSession = {
    id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: timestamp || now.getTime(),
    dateStr: sessionDateStr,
    courseCode: courseCode || null,
    courseName: courseName || 'مطالعه عمومی',
    taskId: taskId || null,
    taskTitle: taskTitle || null,
    durationMinutes: Math.max(1, Math.round(durationMinutes)),
    mode,
    color,
  };
  sessions.unshift(newSession);
  write(STORAGE_KEYS.SESSIONS, sessions);

  if (taskId) {
    addTimeSpentToTask(taskId, Math.round(durationMinutes) * 60);
  }

  notifyUpdate();
  return newSession;
}

export function deleteStudySession(sessionId) {
  const sessions = getStudySessions().filter((s) => s.id !== sessionId);
  write(STORAGE_KEYS.SESSIONS, sessions);
  notifyUpdate();
  return sessions;
}

export function getDailyActivityMap() {
  const sessions = getStudySessions();
  const map = {};
  for (const s of sessions) {
    const d = s.dateStr;
    if (!map[d]) {
      map[d] = {
        dateStr: d,
        totalMinutes: 0,
        sessions: [],
        courseNames: [],
        colors: [],
      };
    }
    map[d].totalMinutes += s.durationMinutes || 0;
    map[d].sessions.push(s);
    if (s.courseName && !map[d].courseNames.includes(s.courseName)) {
      map[d].courseNames.push(s.courseName);
    }
    if (s.color && !map[d].colors.includes(s.color)) {
      map[d].colors.push(s.color);
    }
  }
  return map;
}

// ── آمار، استریک و گزارش‌ها ──

export function calculateStudyStats() {
  const sessions = getStudySessions();
  const tasks = getStudyTasks();

  const totalMinutes = sessions.reduce((s, x) => s + (x.durationMinutes || 0), 0);
  const totalTasksDone = tasks.filter((t) => t.status === 'done').length;

  const todayStr = toLocalDateString(new Date());
  const todayMinutes = sessions
    .filter((s) => s.dateStr === todayStr)
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  // محاسبه استریک (روزهای پیوسته مطالعه)
  const uniqueDates = [...new Set(sessions.map((s) => s.dateStr))].sort().reverse();
  let streak = 0;
  const checkDate = new Date();

  // اگر امروز مطالعه داشته، استریک شروع می‌شود؛ اگر نه، شاید دیروز داشته
  const todayHas = uniqueDates.includes(todayStr);
  if (!todayHas) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dStr = toLocalDateString(checkDate);
    if (uniqueDates.includes(dStr)) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // تفکیک مطالعه بر اساس دروس
  const byCourse = {};
  for (const s of sessions) {
    const key = s.courseName || 'عمومی';
    if (!byCourse[key]) {
      byCourse[key] = {
        name: key,
        code: s.courseCode,
        color: s.color || 'primary',
        totalMinutes: 0,
        sessionsCount: 0,
      };
    }
    byCourse[key].totalMinutes += s.durationMinutes || 0;
    byCourse[key].sessionsCount += 1;
  }

  const courseList = Object.values(byCourse).sort((a, b) => b.totalMinutes - a.totalMinutes);

  return {
    totalMinutes,
    totalHours: (totalMinutes / 60).toFixed(1),
    todayMinutes,
    todayHours: (todayMinutes / 60).toFixed(1),
    totalTasks: tasks.length,
    totalTasksDone,
    totalSessions: sessions.length,
    streak,
    streakDays: streak,
    byCourse: courseList,
    byCourseMap: byCourse,
  };
}

// ── خروجی اکسل / CSV ──

export function generateStudyDataCsv() {
  const sessions = getStudySessions();
  if (!sessions.length) return '';

  const header = ['شناسه', 'تاریخ', 'زمان (دقیقه)', 'نام درس', 'عنوان تسک', 'نوع تایمر'];
  const rows = sessions.map((s) => [
    s.id,
    new Date(s.timestamp).toLocaleDateString('fa-IR'),
    s.durationMinutes,
    `"${(s.courseName || 'عمومی').replace(/"/g, '""')}"`,
    `"${(s.taskTitle || '—').replace(/"/g, '""')}"`,
    s.mode,
  ]);

  return '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportStudyDataCsv() {
  const csvContent = generateStudyDataCsv();
  if (!csvContent) return false;

  if (
    typeof document !== 'undefined' &&
    typeof window !== 'undefined' &&
    typeof Blob !== 'undefined' &&
    document?.createElement
  ) {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sarvestan-study-log-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('[CSV download error]', e);
    }
  }
  return csvContent;
}
