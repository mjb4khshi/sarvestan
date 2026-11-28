/**
 * وضعیت سراسری جریان ورود
 * از useSyncExternalStore استفاده می‌شود تا رندر پایدار بماند
 */
import { isExtensionRuntime } from './extensionRuntime';

const CREDS_KEY = 'sarvestan_saved_creds';

let _cachedCreds = null;
let _credsHydrated = false;
let _hydratePromise = null;

function getSecureStoragePlugin() {
  try {
    return globalThis.Capacitor?.Plugins?.SarvestanSecureStorage || null;
  } catch {
    return null;
  }
}

export async function loadSavedCredsAsync() {
  if (_credsHydrated) return _cachedCreds;
  if (_hydratePromise) return _hydratePromise;

  _hydratePromise = (async () => {
    const securePlugin = getSecureStoragePlugin();
    let legacyCreds = null;
    try {
      const rawLegacy = localStorage.getItem(CREDS_KEY);
      if (rawLegacy) {
        const parsed = JSON.parse(rawLegacy);
        if (parsed?.username && parsed?.password) {
          legacyCreds = {
            username: String(parsed.username),
            password: String(parsed.password),
          };
        }
      }
    } catch {}

    if (securePlugin?.getCreds && securePlugin?.setCreds) {
      // اندروید: انتقال یکباره از localStorage به AndroidKeyStore (AES-GCM) و حذف فوری از localStorage
      if (legacyCreds) {
        try {
          await securePlugin.setCreds({ value: JSON.stringify(legacyCreds) });
        } catch {}
        try {
          localStorage.removeItem(CREDS_KEY);
        } catch {}
        _cachedCreds = legacyCreds;
        _credsHydrated = true;
        return _cachedCreds;
      }

      try {
        const res = await securePlugin.getCreds();
        if (res?.value) {
          const parsed = JSON.parse(res.value);
          if (parsed?.username && parsed?.password) {
            _cachedCreds = {
              username: String(parsed.username),
              password: String(parsed.password),
            };
          }
        }
      } catch {}
      _credsHydrated = true;
      return _cachedCreds;
    }

    // وب: عدم ذخیره رمز خام در localStorage و پاک‌سازی نسخه قدیمی
    try {
      localStorage.removeItem(CREDS_KEY);
    } catch {}
    _credsHydrated = true;
    return _cachedCreds;
  })().finally(() => {
    _hydratePromise = null;
  });

  return _hydratePromise;
}

export function loadSavedCreds() {
  if (!_credsHydrated) {
    loadSavedCredsAsync().catch(() => {});
  }
  return _cachedCreds;
}

export async function saveCreds(username, password) {
  if (username && password) {
    _cachedCreds = { username: String(username), password: String(password) };
  } else {
    _cachedCreds = null;
  }
  _credsHydrated = true;

  try {
    localStorage.removeItem(CREDS_KEY);
  } catch {}

  const securePlugin = getSecureStoragePlugin();
  if (securePlugin) {
    try {
      if (_cachedCreds && securePlugin.setCreds) {
        await securePlugin.setCreds({ value: JSON.stringify(_cachedCreds) });
      } else if (securePlugin.clearCreds) {
        await securePlugin.clearCreds();
      }
    } catch {}
  }
}

export async function clearSavedCreds() {
  _cachedCreds = null;
  _credsHydrated = true;
  try {
    localStorage.removeItem(CREDS_KEY);
  } catch {}
  const securePlugin = getSecureStoragePlugin();
  if (securePlugin?.clearCreds) {
    try {
      await securePlugin.clearCreds();
    } catch {}
  }
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
  // در افزونه هیچ فرم لاگینی وجود ندارد —
  // کاربر در سامانه دانشگاه خودش لاگین می‌کند و داشبورد نشست را خودکار می‌خواند
  if (isExtensionRuntime()) return;
  if (typeof window !== 'undefined') {
    try {
      const isOverlay = window.self !== window.top || new URLSearchParams(window.location.search).get('mode') === 'overlay';
      if (isOverlay) {
        return;
      }
    } catch {}
  }
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
  loadSavedCredsAsync()
    .then((asyncSaved) => {
      if (asyncSaved && snapshot.show && (!snapshot.username || !snapshot.password)) {
        snapshot = {
          ...snapshot,
          username: snapshot.username || asyncSaved.username,
          password: snapshot.password || asyncSaved.password,
        };
        emit();
      }
    })
    .catch(() => {});
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

export async function hasSavedCredsAsync() {
  const saved = await loadSavedCredsAsync();
  return Boolean(saved);
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
