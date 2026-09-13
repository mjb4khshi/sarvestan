import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useSarvestanData } from '../hooks/useSarvestanData';
import {
  isLoginModalOpen,
  subscribeLogin,
  getLoginSnapshot,
} from '../services/loginFlow';
import { resetSyncState, isSyncing } from '../services/behestan/sync';
import { hasLiveData } from '../services/behestan/store';
import { getViewModel } from '../data/viewModel';
import { updateAndroidWidget, isNativeCapacitor } from '../services/androidWidget';

/**
 * اگر نشست هست ولی دیتا نیست → همگام‌سازی بزن
 * بعد از دیتا، ویجت اندروید را به‌روز کن
 */
export default function DataBootstrap() {
  const { live, isSessionAlive, sync, syncMeta } = useSarvestanData();
  useSyncExternalStore(subscribeLogin, getLoginSnapshot, getLoginSnapshot);
  const triesRef = useRef(0);

  useEffect(() => {
    if (live || hasLiveData()) {
      triesRef.current = 0;
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
    if (triesRef.current >= 3) return;

    triesRef.current += 1;
    const t = setTimeout(async () => {
      if (isLoginModalOpen() || hasLiveData()) return;
      try {
        if (isSyncing()) resetSyncState();
        await sync(true);
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [live, isSessionAlive, sync, syncMeta?.status, syncMeta?.lastSyncAt]);

  return null;
}