// Barrel سبک — بدون صدور adapter (برای جلوگیری از چرخهٔ import)
export { runFullSync, isSyncing, resetSyncState } from './sync';
export {
  subscribeStore,
  getSnapshot,
  hasLiveData,
  getSummary,
  getCurrentTermSchedule,
  getTodayClasses,
  clearLiveData,
  markSyncStatus,
  updateScheduleCourse,
  addScheduleCourse,
  deleteScheduleCourse,
  updateExamInStore,
  addExamToStore,
  deleteExamFromStore,
  resetScheduleAndExamsToBehestan,
  hasScheduleCustomizations,
  resolveCurrentTermId,
} from './store';
export {
  getSid,
  getTicket,
  getStudentId,
  isSessionAlive,
  getSessionSnapshot,
  saveManualSession,
  clearSession,
  BEHESTAN_ORIGIN,
} from './session';
export {
  fetchStudentTotals,
  fetchPersonal,
  fetchWorkflows,
  fetchCurriculumStats,
  fetchViewReport,
  canSync,
} from './client';
export {
  openBehestanLogin,
  parseSessionBlob,
  readClipboardSession,
  applySession,
} from './login';
