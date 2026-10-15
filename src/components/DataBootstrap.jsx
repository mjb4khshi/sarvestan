import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useSarvestanData } from '../hooks/useSarvestanData';
import {
  isLoginModalOpen,
  subscribeLogin,
  getLoginSnapshot,
} from '../services/loginFlow';
import { resetSyncState, isSyncing } from '../services/behestan/sync';
import { hasLiveData } from '../services/behestan/store';
import { setSelectedUniversity } from '../services/behestan/session';
import { getViewModel } from '../data/viewModel';
import { updateAndroidWidget, isNativeCapacitor } from '../services/androidWidget';

/**
 * اگر نشست هست ولی دیتا نیست → همگام‌سازی بزن
 * بعد از دیتا، ویجت اندروید را به‌روز کن
 */
export default function DataBootstrap() {
  const { live, isSessionAlive, sync, syncMeta, applyManualSession } = useSarvestanData();
  useSyncExternalStore(subscribeLogin, getLoginSnapshot, getLoginSnapshot);
  const triesRef = useRef(0);

  useEffect(() => {
    if (!isNativeCapacitor()) {
      try {
        if (
          sessionStorage.getItem('sarvestan_manual_logout') === '1' ||
          new URLSearchParams(window.location.search).get('login') === '1'
        ) {
          return;
        }
      } catch {}
      fetch('/__sarvestan/session')
        .then((r) => r.json())
        .then((s) => {
          if (s?.sid && s?.ticket) {
            const cur = JSON.parse(localStorage.getItem('sarvestan_mobile_session') || '{}');
            const curUni = cur?.university || localStorage.getItem('sarvestan_selected_university');
            if (curUni === 'sbu' && s.university !== 'sbu' && cur?.sid) {
              console.log('[bootstrap] Skipping stale non-SBU server session');
              return;
            }
            if (cur?.sid !== s.sid || cur?.ticket !== s.ticket || (s.university && cur?.university !== s.university)) {
              console.log('[bootstrap] Loaded server session into localStorage:', s.sid, s.university);
              if (s.university) setSelectedUniversity(s.university);
              applyManualSession({
                sid: s.sid,
                ticket: s.ticket,
                studentId: s.studentId || undefined,
                cookies: s.cookies || undefined,
                university: s.university || undefined,
              });
            }
          }
        })
        .catch(() => {});
    }
  }, [applyManualSession]);

  const syncingRef = useRef(false);

  useEffect(() => {
    if (live || hasLiveData()) {
      syncingRef.current = false;
      // ویجت
      if (isNativeCapacitor()) {
        try {
          updateAndroidWidget(getViewModel());
        } catch {}
      }
      return;
    }
    if (!isSessionAlive) return;
    if (isLoginModalOpen()) return;
    if (syncingRef.current) return;

    syncingRef.current = true;
    const t = setTimeout(async () => {
      if (isLoginModalOpen() || hasLiveData()) {
        syncingRef.current = false;
        return;
      }
      try {
        if (isSyncing()) resetSyncState();
        await sync(true);
      } catch {
        syncingRef.current = false;
      }
    }, 400);
    return () => clearTimeout(t);
  }, [live, isSessionAlive, sync]);

  return null;
}