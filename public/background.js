/**
 * Sarvestan - Extension Background Service Worker (Manifest V3)
 */

console.log('[Sarvestan Background] Service worker loaded.');

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Sarvestan Background] Extension installed successfully.');
});

const SUPPORTED_DOMAINS = ['kntu.ac.ir', 'aut.ac.ir', 'sbu.ac.ir', 'ut.ac.ir', 'iust.ac.ir'];

// کلیک روی آیکون افزونه در نوار ابزار مرورگر:
// اگر کاربر روی تب یکی از سامانه‌های دانشگاهی است -> باز کردن مستقیم لایه هوشمند روی سامانه
// اگر کاربر روی تب دیگری است -> باز کردن یا فوکوس روی تب داشبورد مستقل
chrome.action.onClicked.addListener(async (tab) => {
  const isUniTab = tab && tab.url && SUPPORTED_DOMAINS.some((domain) => tab.url.includes(domain));
  if (isUniTab) {
    chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_SARVESTAN_OVERLAY' }, (res) => {
      if (chrome.runtime.lastError) {
        // در صورت عدم تزریق قبلی، تب مستقل باز شود
        openDashboardTab();
      }
    });
  } else {
    openDashboardTab();
  }
});

function openDashboardTab() {
  const dashboardUrl = chrome.runtime.getURL('index.html');
  chrome.tabs.query({ url: dashboardUrl }, (tabs) => {
    if (tabs && tabs.length > 0) {
      chrome.tabs.update(tabs[0].id, { active: true });
    } else {
      chrome.tabs.create({ url: dashboardUrl });
    }
  });
}

// مدیریت پیام‌های ارسالی از Content Script یا داشبورد
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'OPEN_SARVESTAN_DASHBOARD') {
    openDashboardTab();
    sendResponse({ status: 'OPENED' });
    return true;
  }
  if (msg.action === 'SARVESTAN_SCHEDULE_NOTIFS') {
    handleScheduleNotifs(msg.items).then(sendResponse);
    return true; // پاسخ async
  }
  if (msg.action === 'SARVESTAN_CANCEL_NOTIFS') {
    handleCancelNotifs(msg.ids).then(sendResponse);
    return true;
  }
});

// ── یادآورها (چون پلاگین اندروید در افزونه نیست) ──
const NOTIF_META_KEY = 'sarvestan_notif_meta';
const ALARM_PREFIX = 'sarv';
const MAX_SCHEDULE_ITEMS = 120;

function alarmNameFor(id) {
  return `${ALARM_PREFIX}-${String(id)}`;
}

function getAllAlarms() {
  return new Promise((resolve) => chrome.alarms.getAll((alarms) => resolve(alarms || [])));
}

function clearAlarm(name) {
  return new Promise((resolve) => chrome.alarms.clear(name, () => resolve()));
}

/** فهرست زنگ‌ها را دو باره می‌سازد؛ همچنین متای منقضی را پاک می‌کند */
async function clearSarvAlarms() {
  const alarms = await getAllAlarms();
  for (const a of alarms) {
    if (String(a.name).startsWith(ALARM_PREFIX + '-')) {
      await clearAlarm(a.name);
    }
  }
}

async function getNotifMeta() {
  return new Promise((resolve) => {
    chrome.storage.local.get(NOTIF_META_KEY, (all) => {
      resolve((all && all[NOTIF_META_KEY]) || {});
    });
  });
}

function setNotifMeta(meta) {
  return new Promise((resolve) => chrome.storage.local.set({ [NOTIF_META_KEY]: meta }, () => resolve()));
}

async function handleScheduleNotifs(items) {
  try {
    const now = Date.now();
    const norm = (items || [])
      .filter((i) => i && Number(i.triggerAtMs) > now && (i.title || i.body))
      .slice(0, MAX_SCHEDULE_ITEMS)
      .map((i) => ({
        id: String(i.id),
        triggerAtMs: Number(i.triggerAtMs),
        title: String(i.title || 'سروستان'),
        body: String(i.body || ''),
      }));

    await clearSarvAlarms();
    if (!norm.length) {
      return { ok: true, scheduled: 0, ids: [] };
    }

    const prevMeta = await getNotifMeta();
    // متای قدیمی را دور بریز — همهٔ زنگ‌های قبلی تازه پاک‌سازی شدند
    const meta = { ...prevMeta };
    for (const name of Object.keys(meta)) {
      const info = meta[name];
      if (!info || !info.when || info.when < now) delete meta[name];
    }
    for (const i of norm) {
      const name = alarmNameFor(i.id);
      chrome.alarms.create(name, { when: i.triggerAtMs });
      meta[name] = { title: i.title, body: i.body, when: i.triggerAtMs };
    }

    await setNotifMeta(meta);
    return { ok: true, scheduled: norm.length, ids: norm.map((i) => i.id) };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

async function handleCancelNotifs(ids) {
  try {
    const alarms = await getAllAlarms();
    for (const a of alarms) {
      if (!String(a.name).startsWith(ALARM_PREFIX + '-')) continue;
      if (!ids || (Array.isArray(ids) && ids.length)) {
        if (!Array.isArray(ids)) await clearAlarm(a.name); // بدون فهرست = همه
        else if (ids.includes(a.name.slice(ALARM_PREFIX.length + 1))) await clearAlarm(a.name);
      }
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

// وقتی زنگ وقتش برسد → اعلان سیستم
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!String(alarm.name).startsWith(ALARM_PREFIX + '-')) return;
  const meta = await getNotifMeta();
  const info = meta[alarm.name];
  if (!info) return; // منقضی/لغوشده
  try {
    chrome.notifications.create(alarm.name, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: info.title,
      message: info.body,
      priority: 2,
    });
  } catch (e) {
    console.warn('[Sarvestan Background] notification error:', e);
  }
  delete meta[alarm.name];
  setNotifMeta(meta);
});
