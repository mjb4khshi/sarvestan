/**
 * وضعیت سراسری جریان ورود
 * از useSyncExternalStore استفاده می‌شود تا رندر پایدار بماند
 */
const CREDS_KEY = 'sarvestan_saved_creds';

export function loadSavedCreds() {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (o?.username && o?.password) {
      return { username: String(o.username), password: String(o.password) };
    }
  } catch {}
  return null;
}

export function saveCreds(username, password) {
  try {
    if (username && password) {
      localStorage.setItem(
        CREDS_KEY,
        JSON.stringify({ username: String(username), password: String(password) }),
      );
    } else {
      localStorage.removeItem(CREDS_KEY);
    }
  } catch {}
}

export function clearSavedCreds() {
  try {
    localStorage.removeItem(CREDS_KEY);
  } catch {}
}

let snapshot = {
  active: false,
  show: false, // مودال باید دیده شود — فقط با dismiss/success خاموش می‌شود
  stepIdx: -1,
  done: false,
  busy: false,
  username: '',
  password: '',
  error: '',
  remember: true,
};

const listeners = new Set();

function emit() {
  snapshot = { ...snapshot };
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {}
  });
}

export function getLoginSnapshot() {
  return snapshot;
}

export function subscribeLogin(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** نمایش مودال — وقتی وارد نیستیم */
export function openLoginModal() {
  if (snapshot.show && snapshot.busy) return;
  const saved = loadSavedCreds();
  snapshot = {
    ...snapshot,
    show: true,
    active: false,
    busy: false,
    done: false,
    stepIdx: -1,
    error: '',
    username: saved?.username || '',
    password: saved?.password || '',
    remember: true,
  };
  emit();
}

export function closeLoginModal() {
  snapshot = {
    ...snapshot,
    show: false,
    active: false,
    busy: false,
    done: false,
    stepIdx: -1,
    error: '',
    // نام کاربری/رمز از ذخیرهٔ محلی پر می‌شوند — اینجا فقط فیلد UI را خالی نکن اگر remember
    username: snapshot.remember ? snapshot.username : '',
    password: snapshot.remember ? snapshot.password : '',
  };
  emit();
}

export function setLoginUsername(v) {
  snapshot = { ...snapshot, username: String(v || '') };
  emit();
}

export function setLoginPassword(v) {
  snapshot = { ...snapshot, password: String(v || '') };
  emit();
}

export function setLoginRemember(v) {
  snapshot = { ...snapshot, remember: Boolean(v) };
  emit();
}

export function beginLoginFlow() {
  snapshot = {
    ...snapshot,
    show: true,
    active: true,
    busy: true,
    done: false,
    stepIdx: -1,
    error: '',
  };
  emit();
}

export function setLoginStep(idx) {
  snapshot = { ...snapshot, stepIdx: Number(idx) };
  emit();
}

export function setLoginDone(on) {
  snapshot = { ...snapshot, done: Boolean(on), busy: on ? false : snapshot.busy };
  emit();
}

export function failLoginFlow(step = -1, msg = '') {
  snapshot = {
    ...snapshot,
    active: true, // مودال باز بماند برای retry
    busy: false,
    done: false,
    stepIdx: -1, // تیک‌های سبز قبلی پاک شوند — فقط خطا دیده شود
    error: msg,
  };
  emit();
}

/** بعد از ورود موفق — رمز را طبق remember ذخیره/پاک کن */
export function commitCredsOnSuccess(username, password) {
  if (snapshot.remember) {
    saveCreds(username, password);
  } else {
    clearSavedCreds();
  }
}

/** آیا رمز ذخیره‌شده داریم؟ */
export function hasSavedCreds() {
  return Boolean(loadSavedCreds());
}

export function getLoginFlowState() {
  return snapshot;
}

export function isLoginFlowActive() {
  return snapshot.active;
}

export function isLoginModalOpen() {
  return snapshot.show;
}
