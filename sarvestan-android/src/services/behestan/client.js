/**
 * کلاینت API بهستان — همان endpoint های افزونه
 * همهٔ درخواست‌ها سریال و با تأخیر
 */

import { enqueuePost, nextSeq, serviceUrl } from './http';
import {
  getSid,
  getTicket,
  getStudentId,
  getUserId,
  isSessionAlive,
} from './session';
import {
  parseF1825,
  parseF1809,
  parseF6524,
  parseF1814CurriculumStats,
  parseReport78Schedule,
  parseReport88Registration,
  parseReport88Meta,
  parseReport428Exams,
  examsFromRegistration,
} from './parsers';
import {
  updatePart,
  setScheduleForTerm,
  setExamsForTerm,
  mergeCourses,
  markSyncStatus,
} from './store';

const RP_BASE = () => ({
  ft: '0',
  f: '11147',
  seq: nextSeq(),
  subfrm: '',
  sid: getSid(),
  ct: '',
  sp: '{"UsrType":"0","TrmType":"2"}',
  loc: 'fa',
  ut: '0',
});

const URLS = {
  sys: serviceUrl('/frm/sys/sys.svc/'),
  f1825: serviceUrl('/frm/F1825_PROCESS_STDTOTALINFOTrmStat_BEH/F1825_PROCESS_STDTOTALINFOTrmStat_BEH.svc/'),
  f1825rr: serviceUrl('/frm/F1825_PROCESS_STDTOTALINFO_BEH/F1825_PROCESS_STDTOTALINFO_BEH.svc/'),
  f1809: serviceUrl('/frm/F1809_PROCESS_STD_Personally_BH/F1809_PROCESS_STD_Personally_BH.svc/'),
  f6524: serviceUrl('/frm/F6524_PROCESS_DASHBOARD_BEH/F6524_PROCESS_DASHBOARD_BEH.svc/'),
  f1814: serviceUrl('/frm/F1814_PROCESS_STDAllCrs/F1814_PROCESS_STDAllCrs.svc/'),
  viewReport: serviceUrl('/frm/BAS0237_CMP_ViewReport/BAS0237_CMP_ViewReport.svc/'),
};

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** پیام خطای بهستان از پاسخ JSON */
export function extractBehestanError(data) {
  if (!data) return null;
  const errors = data?.msg?.errors;
  if (Array.isArray(errors) && errors.length) return String(errors[0]);
  const nested = data?.msg?.c?.[0]?.m?.[0]?.m;
  if (nested) return String(nested);
  return null;
}

/** باز کردن فرم با nav — قبل از هر svc فرم‌محور لازم است (توالی مرورگر) */
async function navForm(fid, { cmpId = null, fop = null } = {}) {
  const r = { fid, ft: '0', subfrm: '' };
  if (cmpId) r.CmpId = cmpId;
  const rp = {
    sp: '{"TrmType":"2","BrnNo":"0","BrnLimit":"0","UsrType":"0"}',
    loc: 'fa',
    ut: '0',
    b: '0',
    sid: getSid(),
  };
  if (fop) rp.fop = fop;
  const txt = await enqueuePost(URLS.sys, { r, act: 'nav', rp, t: getTicket() });
  const data = parseJsonSafe(txt);
  const err = extractBehestanError(data);
  if (err) console.warn('[client] nav', fid, err);
  return data;
}

/** شناسهٔ AUW از کش پروفایل — از B1 گزارش ۸۸ می‌آید */
function getAuwId() {
  try {
    const p = JSON.parse(localStorage.getItem('sarvestan_live_profile') || 'null');
    return p?.auwId || '';
  } catch {
    return '';
  }
}

/** merge ایمن پروفایل در کش — undefined/null خالی نباید قبلی را پاک کند */
function mergeProfile(partial) {
  let prev = null;
  try {
    prev = JSON.parse(localStorage.getItem('sarvestan_live_profile') || 'null');
  } catch {}
  const clean = {};
  for (const [k, v] of Object.entries(partial || {})) {
    if (v !== undefined && v !== null && v !== '') clean[k] = v;
  }
  updatePart({ profile: { ...(prev || {}), ...clean } });
}

/**
 * سنک با sid + تیکت کافی است.
 * شناسهٔ AUW بعد از گزارش ۸۸ در کش profile می‌نشیند.
 */
export function canSync() {
  return Boolean(getSid() && getTicket() && isSessionAlive());
}

/** گزارش ۸۸ — ثبت‌نام ترم جاری: برنامه + امتحانات + متادیتای دانشجو (AUW/نام/دانشکده) */
export async function fetchRegistration88(term = '4051') {
  const res = await fetchViewReport('88', term);
  if (res?.error) return res;
  const meta = parseReport88Meta(res.outpar);
  if (meta) {
    mergeProfile({
      auwId: meta.auwId || undefined,
      // شناسهٔ AUW همان شمارهٔ دانشجویی بهستان است (مثل 40417343) — جایگزین کد ملی (نام کاربری SSO)
      studentId: meta.auwId || undefined,
      fullName: meta.fullName || undefined,
      faculty: meta.faculty || undefined,
      level: meta.level || undefined,
      major: meta.major || undefined,
      isLoggedIn: true,
    });
  }
  // امتحانات ترم جاری از C14 همین گزارش (۴۲۸ ترم جاری خالی است)
  const ex = examsFromRegistration(res.courses || [], res.termId || term);
  if (ex.exams.length) setExamsForTerm(ex.termId, ex.exams);
  return { ...res, meta };
}

/** F1825 — جامع دانشجو (توالی کامل مرورگر: nav → RR با c:110379 → act 20 با c:110381) */
export async function fetchStudentTotals() {
  const auwId = getAuwId();
  const t = getTicket();
  if (!auwId) {
    console.warn('[client] F1825 skipped — no auwId');
    return { error: 'شناسهٔ AUW نیست — گزارش ۸۸ اول زده شود', courses: [], finance: null, transcripts: [], profile: null };
  }

  await navForm('11147');
  await enqueuePost(URLS.f1825rr, {
    r: { ATxW: auwId },
    act: 'RR',
    rp: { ...RP_BASE(), ct: '', c: '110379' },
    t,
  });
  const txt = await enqueuePost(URLS.f1825, {
    r: { AUWo: auwId },
    act: '20',
    rp: { ...RP_BASE(), ct: '', c: '110381' },
    t,
  });
  const data = parseJsonSafe(txt);
  if (!data) return null;

  const apiErr = extractBehestanError(data);
  if (apiErr) {
    console.warn('[client] F1825 API error:', apiErr);
    return { error: apiErr, courses: [], finance: null, transcripts: [], profile: null };
  }

  const parsed = parseF1825(data);
  if (parsed.courses.length) mergeCourses(parsed.courses);
  if (parsed.finance) updatePart({ finance: parsed.finance });
  if (parsed.transcripts.length) updatePart({ transcripts: parsed.transcripts });
  if (parsed.profile) {
    mergeProfile({
      gpa: parsed.profile.gpa,
      totalUnitsPassed: parsed.profile.totalUnitsPassed,
      isLoggedIn: true,
    });
  }
  return parsed;
}

/** F1809 — عکس و نام (nav 11141 + c:110383 + AUWs=شناسهٔ AUW) */
export async function fetchPersonal() {
  const auwId = getAuwId();
  const studentId = getStudentId();
  const t = getTicket();
  const body = {
    r: { AUWs: auwId || studentId },
    act: '08',
    rp: { ...RP_BASE(), f: '11141', ct: '', c: '110383' },
    t,
  };
  await navForm('11141');
  const txt = await enqueuePost(URLS.f1809, body);
  const data = parseJsonSafe(txt);
  if (!data) return null;
  const apiErr = extractBehestanError(data);
  if (apiErr) return { error: apiErr };
  const parsed = parseF1809(data);
  // studentId را از session (احتمالاً کدملی SSO) روی پروفایل مینویسیم — فقط اگر از قبل نباشد
  let existingId = '';
  try {
    existingId = JSON.parse(localStorage.getItem('sarvestan_live_profile') || 'null')?.studentId || '';
  } catch {}
  mergeProfile({
    photo: parsed.photo || undefined,
    fullName: parsed.name || undefined,
    major: parsed.major || undefined,
    studentId: existingId || undefined,
    isLoggedIn: true,
  });
  return parsed;
}

/** F6524 — گردش‌کار (AVsa = شناسهٔ کاربر UId — نه شمارهٔ دانشجویی) */
export async function fetchWorkflows() {
  const userId = getUserId();
  if (!userId) {
    console.warn('[client] F6524 skipped — no userId');
    return [];
  }
  const t = getTicket();
  const body = {
    r: { AVsa: userId, AVsl: '1', AVsm: '0', AW4r: '5', AW4s: '', AvD9: '', AxI9: '{}' },
    act: '24',
    rp: { ...RP_BASE(), f: '21122' },
    t,
  };
  await navForm('21122');
  const txt = await enqueuePost(URLS.f6524, body);
  const data = parseJsonSafe(txt);
  if (!data) return [];
  const workflows = parseF6524(data);
  if (workflows.length) updatePart({ workflows, announcements: workflows });
  return workflows;
}

/** F1814 — دو مرحله با nav مخصوص (fop + CmpId:110341) و AHug=شناسهٔ AUW */
export async function fetchCurriculumStats() {
  const auwId = getAuwId();
  if (!auwId) return null;
  const t = getTicket();
  await navForm(11126, {
    cmpId: 110341,
    fop: `<row FTYPE="0" FID="11126"><Parm><row STDNO="${auwId}"/></Parm></row>`,
  });
  const rp = { ...RP_BASE(), f: '11126' };
  const txt1 = await enqueuePost(URLS.f1814, { rp, t, r: {}, act: '00', MaxHlp: 200 });
  const j1 = parseJsonSafe(txt1);
  let ahug = auwId;
  if (j1?.outpar?.AHug) ahug = j1.outpar.AHug;

  let fullName = '';
  try {
    fullName = JSON.parse(localStorage.getItem('sarvestan_live_profile') || 'null')?.fullName || '';
  } catch {}

  const step2 = {
    rp,
    t,
    r: {
      AHug: ahug,
      AHug_xml: `<row _LMustCI="1" _LkId="${ahug}" ID="${ahug}" ID_desc="${fullName}" ID_tip="${ahug}"></row>`,
    },
    act: '08',
    MaxHlp: 200,
  };
  const txt2 = await enqueuePost(URLS.f1814, step2);
  const data = parseJsonSafe(txt2);
  if (!data) return null;
  const stats = parseF1814CurriculumStats(data);
  updatePart({ curriculumStats: stats });
  return stats;
}

/** ViewReport — 78 / 88 / 428 */
export async function fetchViewReport(formCode, term) {
  const t = getTicket();
  const sid = getSid();
  const bmv = term
    ? `<Root><N id="4" ft="7" fs="0" M="${term}" F="${term}"/></Root>`
    : '<Root/>';
  const reqBody = {
    rp: {
      ft: '1',
      f: String(formCode),
      seq: nextSeq(),
      subfrm: '0',
      sid,
      ct: '',
      sp: '{"UsrType":"0","TrmType":"2"}',
      ut: '0',
    },
    t,
    r: { Ra3: '0', BMu: '<Root/>', BMv: bmv, AFek: '1' },
    act: '08',
    MaxHlp: 200,
  };

  const txt = await enqueuePost(URLS.viewReport, reqBody, {
    minDelay: 250,
    maxDelay: 600,
  });
  const data = parseJsonSafe(txt);
  if (!data) return { error: 'پاسخ نامعتبر از ViewReport', outpar: {} };

  const apiErr = extractBehestanError(data);
  if (apiErr) {
    console.warn('[client] ViewReport API error', formCode, apiErr);
    return { error: apiErr, courses: [], exams: [], termId: term, outpar: {} };
  }

  if (!data.outpar) return { error: 'outpar خالی', courses: [], exams: [], termId: term, outpar: {} };

  const outpar = data.outpar;

  if (String(formCode) === '78') {
    const parsed = parseReport78Schedule(outpar, term);
    if (parsed.courses.length) {
      setScheduleForTerm(parsed.termId || term || '4051', parsed.courses, '78');
    }
    return { ...parsed, outpar };
  }
  if (String(formCode) === '88') {
    const parsed = parseReport88Registration(outpar, term);
    if (parsed.courses.length) {
      setScheduleForTerm(parsed.termId || term || '4051', parsed.courses, '88');
    }
    return { ...parsed, outpar };
  }
  if (String(formCode) === '428') {
    const parsed = parseReport428Exams(outpar, term);
    if (parsed.exams.length) {
      setExamsForTerm(parsed.termId || term || '4051', parsed.exams);
    }
    return { ...parsed, outpar };
  }
  return null;
}
