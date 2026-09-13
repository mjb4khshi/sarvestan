/**
 * وضعیت سراسری جریان ورود
 * از useSyncExternalStore استفاده می‌شود تا رندر پایدار بماند
 */
let snapshot = {
  active: false,
  show: false, // مودال باید دیده شود — فقط با dismiss/success خاموش می‌شود
  stepIdx: -1,
  done: false,
  busy: false,
  username: '',
  password: '',
  error: '',
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
  snapshot = {
    ...snapshot,
    show: true,
    active: false,
    busy: false,
    done: false,
    stepIdx: -1,
    error: '',
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
    username: '',
    password: '',
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

export function beginLoginFlow() {
  snapshot = {
    ...snapshot,
    show: true,
    active: true,
    busy: true,
    done: false,
    stepIdx: 0,
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
    stepIdx: step,
    error: msg,
  };
  emit();
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
