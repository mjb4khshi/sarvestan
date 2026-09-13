/**
 * از پراکسی محلی نشست را بگیر و در اپ ذخیره کن
 */
import { applySession } from './login';

const PROXY = 'http://127.0.0.1:5175';

export function isProxyAvailable() {
  return true; // همیشه سعی کن
}

export async function fetchSessionFromLocalProxy() {
  const resp = await fetch(`${PROXY}/__sarvestan/session`, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-store',
  });
  if (!resp.ok) throw new Error(`proxy HTTP ${resp.status}`);
  const data = await resp.json();
  if (!data?.ok || !data.sid || !data.ticket) {
    return { ok: false, data };
  }
  applySession({
    sid: data.sid,
    ticket: data.ticket,
    studentId: data.studentId || undefined,
  });
  return { ok: true, data };
}

export function openProxyLogin() {
  // صفحهٔ راهنمای پراکسی — لینک «باز کردن بهستان» در همان صفحه است
  window.open(`${PROXY}/`, 'sarvestan_proxy_login', 'width=520,height=760');
}
