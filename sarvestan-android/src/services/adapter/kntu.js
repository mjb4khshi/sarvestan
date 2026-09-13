/**
 * University Adapter — قرارداد برای دانشگاه‌های بعدی
 * KNTU/Behestan اولین پیاده‌سازی است
 */

/**
 * @typedef {Object} UniversityAdapter
 * @property {string} id
 * @property {string} name
 * @property {string} origin
 * @property {() => boolean} isSessionAlive
 * @property {() => Promise<{ok:boolean, reason?:string}>} sync
 * @property {() => object} getSummary
 * @property {() => object[]} getTodayClasses
 * @property {() => object[]} getGrades
 * @property {() => object} getFinance
 */

import { isSessionAlive } from '../behestan/session';
import { runFullSync } from '../behestan/sync';
import {
  getSummary,
  getCurrentTermSchedule,
  getTodayClasses,
  getSnapshot,
} from '../behestan/store';
import { BEHESTAN_ORIGIN } from '../behestan/session';

/** KNTU — بهستان خواجه نصیر */
export const kntuAdapter = {
  id: 'kntu-behestan',
  name: 'دانشگاه صنعتی خواجه نصیرالدین طوسی',
  origin: BEHESTAN_ORIGIN,
  isSessionAlive,
  sync: (opts) => runFullSync(opts),
  getSummary,
  getCurrentTermSchedule,
  getTodayClasses,
  getGrades() {
    const snap = getSnapshot();
    const transcripts = snap.transcripts || [];
    const latest = transcripts[transcripts.length - 1];
    if (latest?.courses?.length) return latest.courses;
    return (snap.courses || []).filter((c) => c.termId === '4051' || c.grade);
  },
  getFinance() {
    return getSnapshot().finance;
  },
  getProfile() {
    return getSnapshot().profile;
  },
  getWorkflows() {
    return getSnapshot().workflows || [];
  },
  getExams() {
    const exams = getSnapshot().exams || {};
    return exams['4042'] || exams['4051'] || Object.values(exams).flat();
  },
};

/** رجیستری دانشگاه‌ها */
export const adapters = {
  [kntuAdapter.id]: kntuAdapter,
};

export function getAdapter(id = 'kntu-behestan') {
  return adapters[id] || kntuAdapter;
}
