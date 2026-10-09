/**
 * University Adapter — دانشگاه شهید بهشتی (SBU)
 * سامانه بهستان ۲.۰ (ems.sbu.ac.ir)
 */

import { isSessionAlive } from '../behestan/session';
import { runFullSync } from '../behestan/sync';
import {
  getSummary,
  getCurrentTermSchedule,
  getTodayClasses,
  getSnapshot,
} from '../behestan/store';

export const SBU_ORIGIN = 'https://ems.sbu.ac.ir';

/** SBU — بهستان شهید بهشتی */
export const sbuAdapter = {
  id: 'sbu-behestan',
  name: 'دانشگاه شهید بهشتی',
  origin: SBU_ORIGIN,
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
    return (snap.courses || []).filter((c) => c.grade);
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
    return exams['4051'] || exams['4042'] || Object.values(exams).flat();
  },
};
