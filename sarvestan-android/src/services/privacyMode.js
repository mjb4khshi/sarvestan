/**
 * حالت حریم خصوصی سراسری (Global Privacy Mode)
 * محو کردن معدل، نمرات، شماره دانشجویی و مبالغ مالی با یک کلیک یا میانبر Ctrl+Shift+P
 */
import { useState, useEffect } from 'react';

const PRIVACY_KEY = 'sarvestan_privacy_mode';
const PRIVACY_EVENT = 'sarvPrivacyChanged';

export function isPrivacyModeEnabled() {
  try {
    return localStorage.getItem(PRIVACY_KEY) === 'true';
  } catch {
    return false;
  }
}

export function applyPrivacyAttribute(enabled) {
  if (typeof document === 'undefined') return;
  if (enabled) {
    document.documentElement.setAttribute('data-privacy', 'true');
  } else {
    document.documentElement.removeAttribute('data-privacy');
  }
}

export function setPrivacyMode(enabled) {
  const val = Boolean(enabled);
  try {
    localStorage.setItem(PRIVACY_KEY, val ? 'true' : 'false');
  } catch {}
  applyPrivacyAttribute(val);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PRIVACY_EVENT, { detail: { enabled: val } }));
  }
  return val;
}

export function togglePrivacyMode() {
  return setPrivacyMode(!isPrivacyModeEnabled());
}

export function usePrivacyMode() {
  const [enabled, setEnabled] = useState(() => isPrivacyModeEnabled());
  useEffect(() => {
    applyPrivacyAttribute(enabled);
    const handler = (e) => {
      setEnabled(Boolean(e?.detail?.enabled ?? isPrivacyModeEnabled()));
    };
    window.addEventListener(PRIVACY_EVENT, handler);
    return () => window.removeEventListener(PRIVACY_EVENT, handler);
  }, []);
  return [enabled, setPrivacyMode, togglePrivacyMode];
}

if (typeof document !== 'undefined') {
  applyPrivacyAttribute(isPrivacyModeEnabled());
}
