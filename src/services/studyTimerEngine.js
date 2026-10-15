/**
 * موتور حرفه‌ای تایمر، پایداری پس‌زمینه، سیستم صوتی و بازخورد حسی مطالعه
 * کاملاً آفلاین، بدون نیاز به فایل‌های خارجی با Web Audio API
 */

const TIMER_STORAGE_KEY = 'sarv_active_study_timer_v2';

// ── ذخیره‌سازی و پایداری حالت تایمر (مقاوم در برابر بستن، ری‌استارت و قفل شدن) ──

export function getPersistedTimerState() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('[studyTimerEngine] read timer error', e);
  }
  return null;
}

export function persistTimerState(state) {
  try {
    if (typeof localStorage !== 'undefined') {
      if (!state) {
        localStorage.removeItem(TIMER_STORAGE_KEY);
      } else {
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
      }
    }
  } catch (e) {
    console.warn('[studyTimerEngine] persist timer error', e);
  }
}

export function clearPersistedTimerState() {
  persistTimerState(null);
}

// ── موتور صدای ذن و زنگ پایان مطالعه (Web Audio API) ──

let sharedAudioCtx = null;
function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * پخش زنگ آرامش‌بخش ذن (کاسه تبتی ۵۲۸ هرتز + هارمونیک‌ها) در پایان سشن
 */
export function playFocusChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // ۳ فرکانس متوالی با طنین ملایم (528Hz, 792Hz, 1056Hz)
    const tones = [
      { freq: 528, delay: 0.0, gain: 0.35, decay: 2.8 },
      { freq: 792, delay: 0.25, gain: 0.22, decay: 2.5 },
      { freq: 1056, delay: 0.5, gain: 0.15, decay: 2.2 },
    ];

    tones.forEach(({ freq, delay, gain, decay }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      // حمله سریع و محو تدریجی نمایی
      gainNode.gain.setValueAtTime(0.0001, now + delay);
      gainNode.gain.linearRampToValueAtTime(gain, now + delay + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + decay);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + decay + 0.1);
    });
  } catch (e) {
    console.warn('[playFocusChime]', e);
  }
}

/**
 * کلیک ملایم حین فشردن دکمه‌های تایمر (غیرفعال‌شده به درخواست کاربر)
 */
export function playGentleClick() {
  // صدای کلیک کلاً برداشته شد
}

// ── موتور صدای محیطی و نویز سفید (غیرفعال‌شده به درخواست کاربر) ──

export function stopAmbientSound() {
  // صدای پس‌زمینه کلاً برداشته شد
}

export function startAmbientSound() {
  // صدای پس‌زمینه/باران کلاً برداشته شد
}

// ── سیستم لرزش و هپتیک (Haptic Feedback) ──

export function triggerHaptic(type = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    if (type === 'light') {
      navigator.vibrate(20);
    } else if (type === 'medium') {
      navigator.vibrate(45);
    } else if (type === 'finish') {
      // الگوی ۳ ضربه‌ای پایان
      navigator.vibrate([180, 80, 240, 80, 400]);
    }
  } catch {}
}

// ── مدیریت روشن ماندن صفحه (Screen Wake Lock API) ──

let activeWakeLock = null;

export async function requestScreenWakeLock() {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return null;
  try {
    if (activeWakeLock && !activeWakeLock.released) return activeWakeLock;
    activeWakeLock = await navigator.wakeLock.request('screen');
    activeWakeLock.addEventListener('release', () => {
      activeWakeLock = null;
    });
    return activeWakeLock;
  } catch (err) {
    console.warn('[ScreenWakeLock error]', err);
    return null;
  }
}

export function releaseScreenWakeLock() {
  try {
    if (activeWakeLock && !activeWakeLock.released) {
      activeWakeLock.release().catch(() => {});
      activeWakeLock = null;
    }
  } catch {}
}

// ── ارسال نوتیفیکیشن سیستمی پایان مطالعه ──

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  try {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const res = await Notification.requestPermission();
      return res === 'granted';
    }
  } catch {}
  return false;
}

export function notifyTimerFinished({ courseName = 'عمومی', minutes = 25 }) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  try {
    if (Notification.permission === 'granted') {
      new Notification('پایان زمان تمرکز! 🍅', {
        body: `نشست مطالعه «${courseName}» (${minutes} دقیقه) با موفقیت ثبت شد. وقت استراحته!`,
        icon: '/favicon.ico',
        tag: 'study-timer-finish',
      });
    }
  } catch (e) {
    console.warn('[Notification error]', e);
  }
}
