/**
 * سرویس یادآوری و آلارم کلاس‌های سروستان
 * - نوتیفیکیشن هوشمند داخلی اپ: ۱۰/۱۵ دقیقه قبل + لحظه شروع کلاس
 * - تنظیم در ساعت رسمی سیستم (AlarmClock intent تکرارشونده هفتگی)
 * - مدیریت مجوزها، ماندگاری تنظیمات و لغو کامل
 */

import { getCurrentTermSchedule, hasLiveData } from './behestan/store';
import { detectCurrentTermId } from './behestan/parsers';
import { parseClassTime, getScheduleMatrix } from '../data/viewModel';

const SETTINGS_KEY = 'sarvestan_class_reminders_settings';
const SCHEDULED_IDS_KEY = 'sarvestan_class_reminders_ids';

export const DAY_CAL = {
  شنبه: 7, // Calendar.SATURDAY
  یکشنبه: 1,
  دوشنبه: 2,
  'سه‌شنبه': 3,
  'چهارشنبه': 4,
  پنجشنبه: 5,
  جمعه: 6,
};

export function normalizeDay(raw) {
  if (!raw) return null;
  const s = String(raw).replace(/[\u200c\s]/g, '').trim();
  if (s.includes('چهارشنبه')) return 'چهارشنبه';
  if (s.includes('سهشنبه')) return 'سه‌شنبه';
  if (s.includes('دوشنبه')) return 'دوشنبه';
  if (s.includes('یکشنبه')) return 'یکشنبه';
  if (s.includes('پنجشنبه')) return 'پنجشنبه';
  if (s.includes('جمعه')) return 'جمعه';
  if (s.includes('شنبه')) return 'شنبه';
  return null;
}

export function parseTimeStartEnd(raw) {
  if (!raw) return null;
  const s = String(raw)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[\u200c]/g, ' ');

  // 1. الگوی HH:MM (مانند 07:30 - 09:00 یا 8:00 تا 10:00)
  const matches = [...s.matchAll(/(\d{1,2}):(\d{2})/g)];
  if (matches.length >= 2) {
    const h1 = parseInt(matches[0][1], 10);
    const m1 = parseInt(matches[0][2], 10);
    const h2 = parseInt(matches[1][1], 10);
    const m2 = parseInt(matches[1][2], 10);
    const t1 = h1 * 60 + m1;
    const t2 = h2 * 60 + m2;
    const startM = Math.min(t1, t2);
    const endM = Math.max(t1, t2);
    const sh = Math.floor(startM / 60) % 24;
    const sm = startM % 60;
    const eh = Math.floor(endM / 60) % 24;
    const em = endM % 60;
    return {
      start: { hour: sh, minute: sm },
      end: { hour: eh, minute: em },
      timeStr: `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')} - ${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`,
    };
  }
  if (matches.length === 1) {
    const h1 = parseInt(matches[0][1], 10);
    const m1 = parseInt(matches[0][2], 10);
    const startM = h1 * 60 + m1;
    const endM = startM + 90; // پیش‌فرض ۹۰ دقیقه
    const sh = Math.floor(startM / 60) % 24;
    const sm = startM % 60;
    const eh = Math.floor(endM / 60) % 24;
    const em = endM % 60;
    return {
      start: { hour: sh, minute: sm },
      end: { hour: eh, minute: em },
      timeStr: `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`,
    };
  }

  // 2. الگوی ساعات ساده بدون دقیقه (مانند ۸-۱۰ یا 8 الی 10 یا 8 تا 10)
  const bareMatch = s.match(/(\d{1,2})\s*(?:[-–—]|تا|الی)\s*(\d{1,2})/);
  if (bareMatch) {
    const h1 = parseInt(bareMatch[1], 10);
    const h2 = parseInt(bareMatch[2], 10);
    const startH = Math.min(h1, h2) % 24;
    const endH = Math.max(h1, h2) % 24;
    return {
      start: { hour: startH, minute: 0 },
      end: { hour: endH, minute: 0 },
      timeStr: `${String(startH).padStart(2, '0')}:00 - ${String(endH).padStart(2, '0')}:00`,
    };
  }

  return null;
}

function plugins() {
  try {
    return globalThis.Capacitor?.Plugins || {};
  } catch {
    return {};
  }
}

export function hasClassAlarmPlugin() {
  return Boolean(plugins().ClassAlarms);
}

export function isNativeAlarms() {
  try {
    return Boolean(globalThis.Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

function courseSlots(c) {
  if (Array.isArray(c.daySlots) && c.daySlots.length) return c.daySlots;
  if (Array.isArray(c.days) && c.days.length) {
    return c.days.map((d) => ({
      day: d,
      time: c.time || c.classTimeRaw || c.slot || '',
      hall: c.hall || c.room || 'ـ',
    }));
  }
  if (c.day) {
    return [
      {
        day: c.day,
        time: c.time || c.classTimeRaw || c.slot || '',
        hall: c.hall || c.room || 'ـ',
      },
    ];
  }
  return [];
}

/**
 * دریافت کلیه جلسات هفتگی برای یادآوری و آلارم
 * استخراج اولویت‌دار از ماتریس کلاسی (getScheduleMatrix) و بهستان
 */
export function collectWeeklySlots() {
  const list = [];
  const seen = new Set();

  // ۱. استخراج از ماتریس کلاسی (همیشه معتبر و شامل تمام دروس ۹‌گانه نمایش داده شده در UI)
  try {
    const matrix = getScheduleMatrix();
    const daysList = matrix.days || ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'];
    const slotsList = matrix.slots || [];
    const cells = matrix.cells || {};

    for (const [coord, cell] of Object.entries(cells)) {
      if (!cell) continue;
      const [siStr, diStr] = coord.split('-');
      const si = parseInt(siStr, 10);
      const di = parseInt(diStr, 10);
      const rawDay = daysList[di];
      const day = normalizeDay(rawDay);
      if (!day || !DAY_CAL[day]) continue;

      const rawTime = cell.time || slotsList[si] || '';
      const parsed = parseTimeStartEnd(rawTime);
      if (!parsed) continue;

      const title = cell.title || 'کلاس';
      const key = `${title}-${day}-${parsed.start.hour}:${parsed.start.minute}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: `cell_${coord}`,
          title,
          name: title,
          label: title,
          day,
          days: [day],
          time: parsed.timeStr || rawTime,
          slot: slotsList[si] || rawTime,
          hour: parsed.start.hour,
          minute: parsed.start.minute,
          endHour: parsed.end.hour,
          endMinute: parsed.end.minute,
          hall: cell.room && cell.room !== 'ـ' ? cell.room : '',
          room: cell.room && cell.room !== 'ـ' ? cell.room : '',
          professor: cell.professor && cell.professor !== 'ـ' ? cell.professor : '',
        });
      }
    }
  } catch (e) {
    console.warn('[collectWeeklySlots] matrix extract error:', e);
  }

  // ۲. در صورتی که ماتریس به هر دلیل خالی بود، استخراج مستقیم از getCurrentTermSchedule
  if (list.length === 0) {
    try {
      const courses = getCurrentTermSchedule() || [];
      for (const c of courses) {
        for (const s of courseSlots(c)) {
          const day = normalizeDay(s.day);
          if (!day || !DAY_CAL[day]) continue;
          const parsed = parseTimeStartEnd(s.time || c.time || c.classTimeRaw || c.slot);
          if (!parsed) continue;
          const title = c.name || c.title || c.course || 'کلاس';
          const key = `${title}-${day}-${parsed.start.hour}:${parsed.start.minute}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({
              id: c.id || c.code || `slot_${key}`,
              title,
              name: title,
              label: title,
              day,
              days: [day],
              time: parsed.timeStr,
              slot: parsed.timeStr,
              hour: parsed.start.hour,
              minute: parsed.start.minute,
              endHour: parsed.end.hour,
              endMinute: parsed.end.minute,
              hall: s.hall || c.hall || c.room || '',
              room: s.hall || c.hall || c.room || '',
              professor: c.professor || '',
            });
          }
        }
      }
    } catch (e) {
      console.warn('[collectWeeklySlots] courses extract error:', e);
    }
  }

  // مرتب‌سازی بر اساس روز هفته و سپس ساعت شروع
  const dayOrder = { شنبه: 0, یکشنبه: 1, دوشنبه: 2, 'سه‌شنبه': 3, 'چهارشنبه': 4, پنجشنبه: 5, جمعه: 6 };
  list.sort((a, b) => {
    const da = dayOrder[a.day] ?? 99;
    const db = dayOrder[b.day] ?? 99;
    if (da !== db) return da - db;
    const ta = a.hour * 60 + a.minute;
    const tb = b.hour * 60 + b.minute;
    return ta - tb;
  });

  return list;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * ساخت لیست نوتیف‌ها: برای هر جلسه، تا ۷ روز آینده
 */
export function buildReminderItems({ daysAhead = 7, leadMinutes = 10, notifyAtStart = true } = {}) {
  const slots = collectWeeklySlots();
  const items = [];
  let id = 17001;
  const now = new Date();

  for (const slot of slots) {
    for (const dayFa of slot.days) {
      const calDay = DAY_CAL[dayFa];
      if (!calDay) continue;
      for (let d = 0; d < daysAhead; d++) {
        const when = new Date(now);
        when.setDate(when.getDate() + d);
        when.setHours(slot.hour, slot.minute, 0, 0);

        // JS: 0=یکشنبه … 6=شنبه  ↔  Calendar: 1=یکشنبه … 7=شنبه
        const jsDay = when.getDay();
        const asCalDay = jsDay === 0 ? 1 : jsDay + 1;
        if (asCalDay !== calDay) continue;

        const hall = slot.hall ? ` (محل: ${slot.hall})` : '';
        const startAt = when.getTime();
        const preAt = startAt - leadMinutes * 60_000;

        if (leadMinutes > 0 && preAt > Date.now()) {
          items.push({
            id: id++,
            triggerAtMs: preAt,
            title: `⏰ ${leadMinutes} دقیقه تا کلاس ${slot.title || slot.label}`,
            body: `کلاس «${slot.title || slot.label}» ساعت ${pad(slot.hour)}:${pad(slot.minute)} شروع می‌شود${hall}`,
            kind: 'pre',
            slotKey: `${dayFa}-${pad(slot.hour)}:${pad(slot.minute)}`,
          });
        }
        if (notifyAtStart && startAt > Date.now()) {
          items.push({
            id: id++,
            triggerAtMs: startAt,
            title: `🔔 شروع کلاس ${slot.title || slot.label}`,
            body: `کلاس «${slot.title || slot.label}» هم‌اکنون آغاز شد${hall}`,
            kind: 'start',
            slotKey: `${dayFa}-${pad(slot.hour)}:${pad(slot.minute)}`,
          });
        }
      }
    }
  }

  items.sort((a, b) => a.triggerAtMs - b.triggerAtMs);
  return items;
}

/**
 * زمان‌بندی یادآوری کلاس‌ها در سیستم
 */
export async function scheduleClassReminders({ daysAhead = 7, leadMinutes = 10, notifyAtStart = true } = {}) {
  const p = plugins().ClassAlarms;
  if (!p?.scheduleReminders) {
    return { ok: false, error: 'پلاگین ClassAlarms در این دستگاه در دسترس نیست', code: 'no-plugin' };
  }

  const items = buildReminderItems({ daysAhead, leadMinutes, notifyAtStart });
  if (!items.length) {
    return {
      ok: true,
      scheduled: 0,
      message: 'هیچ کلاس پیش‌رویی در ۷ روز آینده برای یادآوری یافت نشد.',
    };
  }

  try {
    const oldIdsRaw = localStorage.getItem(SCHEDULED_IDS_KEY);
    if (oldIdsRaw) {
      try {
        const oldIds = JSON.parse(oldIdsRaw);
        if (Array.isArray(oldIds) && oldIds.length && p.cancelReminders) {
          await p.cancelReminders({ ids: oldIds });
        }
      } catch {}
    }

    const payload = items.map((x) => ({
      id: x.id,
      triggerAtMs: x.triggerAtMs,
      title: x.title,
      body: x.body,
    }));

    const res = await p.scheduleReminders({ items: payload });
    const scheduledIds = items.map((x) => x.id);
    localStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(scheduledIds));

    return {
      ok: true,
      scheduled: res.scheduled ?? items.length,
      skipped: res.skipped ?? 0,
      count: items.length,
    };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * لغو تمام یادآورهای کلاس‌ها
 */
export async function cancelAllReminders() {
  const p = plugins().ClassAlarms;
  try {
    const oldIdsRaw = localStorage.getItem(SCHEDULED_IDS_KEY);
    if (oldIdsRaw) {
      const oldIds = JSON.parse(oldIdsRaw);
      if (Array.isArray(oldIds) && oldIds.length && p?.cancelReminders) {
        await p.cancelReminders({ ids: oldIds });
      }
    }
    localStorage.removeItem(SCHEDULED_IDS_KEY);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * ایجاد آلارم در برنامه ساعت سیستم (Clock App) برای تمام کلاس‌ها
 */
export async function importSystemAlarms({ skipUi = false } = {}) {
  const p = plugins().ClassAlarms;
  if (!p?.importAlarms) {
    return { ok: false, error: 'پلاگین ClassAlarms در این دستگاه در دسترس نیست', code: 'no-plugin' };
  }

  const slots = collectWeeklySlots();
  if (!slots.length) {
    return { ok: false, error: 'هیچ کلاسی در برنامه هفتگی برای آلارم یافت نشد' };
  }

  // تجمیع جلسات یک درس خاص در طول روزهای هفته (بدون تداخل با دروس دیگر)
  const byCourseTime = new Map();
  for (const s of slots) {
    const courseTitle = s.title || s.name || s.label || 'کلاس';
    const key = `${courseTitle}-${s.hour}:${s.minute}`;
    if (!byCourseTime.has(key)) {
      byCourseTime.set(key, {
        name: courseTitle,
        hour: s.hour,
        minute: s.minute,
        days: [],
      });
    }
    const item = byCourseTime.get(key);
    if (!item.days.includes(s.day)) item.days.push(s.day);
  }

  const items = [...byCourseTime.values()].map((x) => ({
    hour: x.hour,
    minute: x.minute,
    days: x.days,
    label: `کلاس ${x.name}`,
  }));

  try {
    const res = await p.importAlarms({ items, skipUi });
    return { ok: true, ...res, total: items.length };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * ساخت آلارم در ساعت گوشی برای یک درس خاص (کاملاً دقیق و تضمینی)
 */
export async function importAlarmsForCourse(courseLike, { skipUi = false } = {}) {
  const p = plugins().ClassAlarms;
  if (!p?.importAlarms) {
    return { ok: false, error: 'پلاگین ClassAlarms در این دستگاه در دسترس نیست', code: 'no-plugin' };
  }

  const name = courseLike?.name || courseLike?.title || courseLike?.course || 'کلاس';
  let hour = null;
  let minute = null;
  let days = [];

  // اولویت ۱: مقدار ساعت و دقیقه مستقیم
  if (courseLike?.hour != null && courseLike?.minute != null) {
    hour = Number(courseLike.hour);
    minute = Number(courseLike.minute);
  } else {
    // اولویت ۲: پارس رشته زمان
    const parsed = parseTimeStartEnd(courseLike?.time || courseLike?.classTimeRaw || courseLike?.slot);
    if (parsed) {
      hour = parsed.start.hour;
      minute = parsed.start.minute;
    }
  }

  // استخراج روزها
  if (Array.isArray(courseLike?.days) && courseLike.days.length) {
    days = courseLike.days.map(normalizeDay).filter(Boolean);
  } else if (courseLike?.day) {
    const d = normalizeDay(courseLike.day);
    if (d) days = [d];
  }

  if (!days.length) {
    days = ['شنبه'];
  }

  if (hour == null || minute == null) {
    return { ok: false, error: 'ساعت برگزاری این درس قابل تشخیص نبود' };
  }

  const items = [
    {
      hour,
      minute,
      days,
      label: `کلاس ${name}`,
    },
  ];

  try {
    const res = await p.importAlarms({ items, skipUi });
    return { ok: true, ...res, total: items.length };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * بررسی و درخواست مجوز نوتیفیکیشن
 */
export async function requestNotificationPermission() {
  const p = plugins().ClassAlarms;
  if (!p?.requestNotificationPermission) return { granted: true };
  try {
    return await p.requestNotificationPermission();
  } catch (e) {
    return { granted: false, error: String(e?.message || e) };
  }
}

/**
 * هدایت مستقیم به صفحه تنظیمات نوتیفیکیشن اپ در اندروید
 */
export async function openNotificationSettings() {
  const p = plugins().ClassAlarms;
  if (p?.openNotificationSettings) {
    try {
      return await p.openNotificationSettings();
    } catch {}
  }
  return { ok: false };
}

/**
 * بررسی مجوز زمان‌بندی دقیق در اندروید ۱۲+
 */
export async function checkExactPermission() {
  const p = plugins().ClassAlarms;
  if (!p?.canScheduleExact) return { ok: true };
  try {
    return await p.canScheduleExact();
  } catch {
    return { ok: true };
  }
}

export async function requestExactPermission() {
  const p = plugins().ClassAlarms;
  if (!p?.requestExactPermission) return { ok: false };
  try {
    return await p.requestExactPermission();
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * ارسال یک اعلان تستی زنده به گوشی برای راستی‌آزمایی صدا و مجوزها
 */
export async function testClassNotification() {
  const p = plugins().ClassAlarms;
  if (!p?.testNotification) {
    if (typeof Notification !== 'undefined') {
      try {
        if (Notification.permission !== 'granted') {
          await Notification.requestPermission();
        }
        new Notification('🔔 آزمایش یادآور سروستان', {
          body: 'اعلان‌ها و صدای زنگ یادآوری کلاس‌ها به‌درستی کار می‌کنند.',
          icon: '/favicon.ico',
        });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: String(e?.message || e) };
      }
    }
    return { ok: false, error: 'پلاگین در دسترس نیست' };
  }

  try {
    return await p.testNotification({
      title: '🔔 آزمایش یادآور سروستان',
      body: 'اعلان‌ها و صدای زنگ یادآوری کلاس‌ها به‌درستی فعال است.',
    });
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * تنظیمات ذخیره‌شدهٔ یادآور
 */
export function getReminderSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return {
        enabled: false,
        leadMinutes: 10,
        notifyAtStart: true,
        lastScheduledCount: 0,
        lastScheduledAt: null,
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      enabled: false,
      leadMinutes: 10,
      notifyAtStart: true,
      lastScheduledCount: 0,
      lastScheduledAt: null,
    };
  }
}

export function saveReminderSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}
