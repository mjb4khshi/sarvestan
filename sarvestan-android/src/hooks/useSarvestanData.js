import { useEffect, useMemo, useSyncExternalStore, useCallback, useState } from 'react';
import {
  subscribeStore,
  getSnapshot,
  hasLiveData,
  getSummary,
  getCurrentTermSchedule,
  markSyncStatus,
  clearLiveData,
} from '../services/behestan/store';
import { detectCurrentTermId } from '../services/behestan/parsers';
import {
  isSessionAlive,
  getSessionSnapshot,
  saveManualSession,
  clearSession,
  clearAllLive,
} from '../services/behestan/session';
import { runFullSync, isSyncing, resetSyncState } from '../services/behestan/sync';
import { getAdapter } from '../services/adapter';
import { openLoginModal } from '../services/loginFlow';

function storeSnapshot() {
  return getSnapshot();
}

export function useSarvestanData() {
  const data = useSyncExternalStore(subscribeStore, storeSnapshot, storeSnapshot);
  const [sessionTick, setSessionTick] = useState(0);
  const adapter = getAdapter();

  useEffect(() => {
    const meta = data?.syncMeta;
    if (meta?.status === 'syncing' && !isSyncing()) {
      markSyncStatus('idle');
    }
  }, [data?.syncMeta?.status]);

  useEffect(() => {
    const id = setInterval(() => setSessionTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const session = useMemo(() => {
    void sessionTick;
    return getSessionSnapshot();
  }, [sessionTick]);

  const summary = useMemo(() => {
    if (!hasLiveData()) return null;
    return getSummary();
  }, [data]);

  const scheduleCourses = useMemo(() => {
    if (!hasLiveData()) return [];
    const term = detectCurrentTermId(getSnapshot()?.courses || []) || '4051';
    return getCurrentTermSchedule(term);
  }, [data]);

  const sync = useCallback(async (force = true) => {
    return runFullSync({ force });
  }, []);

  const applyManualSession = useCallback((fields) => {
    saveManualSession(fields);
    setSessionTick((t) => t + 1);
  }, []);

  const logout = useCallback(() => {
    resetSyncState();
    clearSession();
    clearAllLive();
    markSyncStatus('idle');
    setSessionTick((t) => t + 1);
    openLoginModal();
  }, []);

  const hardResetSession = useCallback(() => {
    resetSyncState();
    clearSession();
    clearLiveData();
    try {
      clearAllLive();
    } catch {}
    markSyncStatus('idle');
    setSessionTick((t) => t + 1);
  }, []);

  return {
    data,
    live: hasLiveData(),
    session,
    summary,
    scheduleCourses,
    profile: data.profile,
    finance: data.finance,
    transcripts: data.transcripts || [],
    courses: data.courses || [],
    workflows: data.workflows || [],
    exams: data.exams || {},
    curriculumStats: data.curriculumStats,
    syncMeta: data.syncMeta,
    syncing: isSyncing(),
    sync,
    applyManualSession,
    logout,
    hardResetSession,
    adapter,
    isSessionAlive: isSessionAlive(),
  };
}
