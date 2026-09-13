/**
 * پارسرهای خروجی بهستان — همان منطق behestanInterceptor.js
 * بدون وابستگی به chrome / window اضافه
 */

export function parseBehestanXmlGrid(xmlStr) {
  if (!xmlStr || typeof xmlStr !== 'string') return [];
  const rows = [];
  const rowRe = /<row\s+([^>]*?)\/?>/gi;
  let match;
  while ((match = rowRe.exec(xmlStr)) !== null) {
    const attrs = {};
    const attrRe = /(\w+)="([^"]*)"/g;
    let am;
    while ((am = attrRe.exec(match[1])) !== null) {
      attrs[am[1]] = decodeEntities(am[2]);
    }
    rows.push(attrs);
  }
  return rows;
}

export function decodeEntities(s) {
  if (!s) return '';
  return String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x0D;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/&nbsp;/g, ' ');
}

export function cleanHtml(str) {
  if (!str) return '';
  return decodeEntities(str)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ۀ/g, 'ه')
    .trim();
}

/**
 * وضعیت ثبت‌نام درس:
 * - registered: روی برنامهٔ فرم ۸۸ / ثبت‌شده
 * - dropped: حذف اضطراری / حذف شده / حذف ايثار
 * - waitlist: در انتظار / لیست انتظار
 */
export function normalizeRegStatus(raw, { onSchedule = false, hasGrade = false, gradePassed = false } = {}) {
  const s = cleanHtml(raw || '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک');
  if (/حذف\s*اضطراري|حذف\s*اضطراری|حذف\s*شده|حذف\s*ايثار|حذف\s*ایثار|cancell?ed|dropped/i.test(s)) {
    return 'dropped';
  }
  if (/انتظار|ليست\s*انتظار|لیست\s*انتظار|wait\s*list|waitlist|در\s*صف/i.test(s)) {
    return 'waitlist';
  }
  if (gradePassed || (hasGrade && /قبول|مشروط|نمره/i.test(s))) return 'passed';
  if (onSchedule) return 'registered';
  if (hasGrade) return 'passed';
  return 'unknown';
}

/** کد درس از F2 مثل «5505050 گروه 59» یا C1 مثل «5505050_59» */
export function extractCourseCode(...parts) {
  for (const p of parts) {
    const s = cleanHtml(p || '');
    const m = s.match(/(\d{5,})/);
    if (m) return m[1];
  }
  return '';
}

/**
 * گزارش ۷۷ — وضعیت واقعی دروس ترم (ثبت‌نام / لیست انتظار / حذف)
 * C5 = وضعیت درس، L3 = مرحله، S2/S3 = خلاصهٔ لیست انتظار
 */
export function parseReport77(outpar, termHint) {
  const bmT = String(outpar?.BMt || '');
  if (!bmT || bmT.indexOf('<row') === -1) {
    return {
      termId: termHint || '',
      courses: [],
      waitlistUnits: 0,
      waitlistCount: 0,
      enrolledUnits: 0,
    };
  }

  const rows = parseBehestanXmlGrid(bmT);
  const courses = [];
  let waitlistUnits = 0;
  let waitlistCount = 0;
  let enrolledUnits = 0;

  for (const row of rows) {
    // S1/S2/S3 فقط روی ردیف گروه‌بندی تکرار می‌شوند
    const s1 = toNum(row.S1);
    const s2 = toNum(row.S2);
    const s3 = toNum(row.S3);
    if (s1 != null && s1 > 0) enrolledUnits = s1;
    if (s2 != null && s2 > 0) waitlistUnits = s2;
    if (s3 != null && s3 > 0) waitlistCount = s3;

    const codeGroup = cleanHtml(row.C1 || '');
    if (!codeGroup) continue;
    const code = extractCourseCode(codeGroup, row.C1);
    const name = normalizeCourseName(cleanHtml(row.C2 || ''));
    if (!name) continue;

    const statusRaw = cleanHtml(row.C5 || '');
    const phaseRaw = cleanHtml(row.L3 || '');
    const typeRaw = cleanHtml(row.C6 || '');
    const combined = `${statusRaw} ${phaseRaw}`;
    const regStatus = normalizeRegStatus(combined, {
      onSchedule: true,
      hasGrade: false,
    });
    // اگر normalize چیزی نگفت و روی برنامه است → registered
    const finalStatus =
      regStatus === 'unknown' || regStatus === 'passed' ? 'registered' : regStatus;

    const daySlots = [];
    const days = [];
    const timeRaw = cleanHtml(row.C8 || '');
    const dayHints = [
      ['شنبه', /شنبه/i],
      ['یکشنبه', /يك\s*شنبه|یکشنبه/i],
      ['دوشنبه', /دو\s*شنبه/i],
      ['سه‌شنبه', /سه\s*شنبه/i],
      ['چهارشنبه', /چهار\s*شنبه/i],
      ['پنجشنبه', /پنج\s*شنبه/i],
    ];
    for (const [day, re] of dayHints) {
      if (re.test(timeRaw)) {
        days.push(day);
        const tm = timeRaw.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
        if (tm) {
          daySlots.push({
            day,
            time: normalizeTimeRange(tm[1] + '-' + tm[2]),
            hall: 'ـ',
          });
        }
      }
    }
    const examM = timeRaw.match(/(\d{4}[./]\d{1,2}[./]\d{1,2})/);
    const examTimeM = timeRaw.match(/ساعت\s*:\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);

    courses.push({
      code,
      group: (codeGroup.match(/_(\d+)/) || [])[1] || '',
      name,
      units: toNum(row.C3) || 0,
      professor: normalizeCourseName(cleanHtml(row.C7 || '')) || 'ـ',
      type: typeRaw || 'ثبت‌نام',
      days,
      time: daySlots[0]?.time || 'ـ',
      hall: daySlots[0]?.hall || 'ـ',
      examDate: examM ? faDigits(examM[1].replace(/[./]/g, '/')) : 'ـ',
      examTime: examTimeM
        ? normalizeTimeRange(examTimeM[1] + '-' + examTimeM[2])
        : 'ـ',
      classTimeRaw: daySlots[0]?.time || '',
      daySlots,
      isLive: true,
      isRegistration: finalStatus === 'registered',
      onSchedule: finalStatus === 'registered',
      regStatus: finalStatus,
      statusRaw,
      phaseRaw,
    });
  }

  const termId =
    termHint ||
    mapTermFromTitle(String(outpar?.BMs || '')) ||
    detectTermFromCourses(courses) ||
    '4051';

  return { termId, courses, waitlistUnits, waitlistCount, enrolledUnits };
}

function detectTermFromCourses(courses) {
  // فرم ۷۷ معمولاً ترم جاری را می‌دهد — از BMs یا hint
  return null;
}

export function faDigits(str) {
  const map = '۰۱۲۳۴۵۶۷۸۹';
  return String(str ?? '').replace(/[0-9]/g, (d) => map[+d]);
}

export function normalizeCourseName(name) {
  if (!name) return '';
  return String(name)
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ـ/g, '')
    .replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeDayName(raw) {
  if (!raw) return '';
  let d = cleanHtml(String(raw))
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, ' ')
    .trim();
  d = d
    .replace(/^یک\s*شنبه\b/i, 'یکشنبه')
    .replace(/^يك\s*شنبه\b/i, 'یکشنبه')
    .replace(/^دو\s*شنبه\b/i, 'دوشنبه')
    .replace(/^سه\s*شنبه\b/i, 'سه‌شنبه')
    .replace(/^چهار\s*شنبه\b/i, 'چهارشنبه')
    .replace(/^پنج\s*شنبه\b/i, 'پنجشنبه')
    .replace(/^شنبه\b/i, 'شنبه');
  const token = d.split(/\s+/)[0] || '';
  const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'];
  if (days.includes(token)) return token;
  if (days.includes(d)) return d;
  return d;
}

export function parseTimeRange(raw) {
  if (!raw) return '';
  const m = String(raw).match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (!m) return String(raw).trim();
  return normalizeTimeRange(m[1] + '-' + m[2]);
}

// نرمال start-end (بدون جابه‌جایی اشتباه)
export function normalizeTimeRange(raw) {
  if (!raw) return '';
  const m = String(raw).match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (!m) return String(raw).trim();
  const toMin = (t) => {
    const [h, mm] = t.split(':').map(Number);
    return h * 60 + mm;
  };
  let [start, end] = [m[1], m[2]];
  if (toMin(end) < toMin(start)) {
    [start, end] = [end, start];
  }
  const pad = (t) => (t.length === 4 ? '0' + t : t);
  return pad(start) + ' - ' + pad(end);
}

/** تبدیل عدد فارسی/عربی/مخلوط به number */
export function toNum(v) {
  if (v === null || v === undefined || v === '') return 0;
  const s = String(v)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^\d.]/g, '');
  if (!s) return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function extractPhotoDataUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.trim().replace(/<\/?PHOTO\s*>/gi, '');
  s = s.replace(/^data:image\/(jpeg|jpg|png|webp);base64,/i, '');
  // بهستان گاهی base64 را با پیشوند /9j بدون data: می‌دهد — همان JPEG است
  const b64 = s.replace(/[^A-Za-z0-9+/=]/g, '');
  if (b64.length < 200) return null;
  const mime = b64.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${b64}`;
}

export function mapTermFromTitle(bms) {
  const s = String(bms || '');
  if (s.includes('06-05') || s.includes('۰۶-۰۵')) return '4051';
  if (s.includes('05-04') && s.includes('دوم')) return '4042';
  if (s.includes('05-04') && s.includes('اول')) return '4041';
  return '';
}

/** گزارش ۷۸ — برنامه هفتگی از M2 */
export function parseReport78Schedule(outpar, termHint) {
  const bmT = outpar?.BMt || '';
  if (!bmT || bmT === '<Root></Root>') return { termId: termHint || '', courses: [] };

  const m2Match = bmT.match(/M2="([^"]*)"/);
  if (!m2Match) return { termId: termHint || '', courses: [] };
  const m2Html = decodeEntities(m2Match[1]);
  if (!m2Html || m2Html.indexOf('<TABLE') === -1) return { termId: termHint || '', courses: [] };

  const body = m2Html.replace(/<\/?THEAD>/gi, '');
  const courseMap = new Map();

  function extractCourseFromTitle(title, day, textHint) {
    const nameM = title.match(/نام درس\s*:\s*(.+?)(?:\s*شماره درس|$)/);
    const codeM = title.match(/شماره درس\s*:\s*(\d+)/);
    const groupM = title.match(/گروه\s*:\s*(\d+)/);
    const timeM = title.match(/ساعت\s*:\s*([0-9:]+\s*-\s*[0-9:]+)/);
    const capM = title.match(/تعداد ثبت نامي\s*:\s*(\d+)/);
    const courseName = normalizeCourseName(
      (nameM ? nameM[1] : cleanHtml(String(textHint || '').split('گروه')[0]))
        .replace(/\s+/g, ' ')
        .trim(),
    );
    if (!courseName || !/نام درس/.test(title)) return;

    const code = codeM ? codeM[1] : '';
    const group = groupM ? groupM[1] : '';
    const classTime = timeM ? timeM[1].trim() : '';
    const capacity = capM ? capM[1] : '';

    const hallM = textHint ? textHint.match(/محل\s*:\s*(.+?)(?=\s*امتحان|$)/) : null;
    const examM = textHint ? textHint.match(/امتحان\s*:\s*([0-9]{4}\/[0-9]{2}\/[0-9]{2})/) : null;
    let examTime = '';
    if (examM && textHint) {
      const afterExam = textHint.slice(textHint.indexOf('امتحان'));
      const et = afterExam.match(/ساعت\s*:\s*([0-9]{1,2}:[0-9]{2}\s*-\s*[0-9]{1,2}:[0-9]{2})/);
      if (et) examTime = et[1].trim();
    }

    const key = code + '|' + group + '|' + courseName;
    if (!courseMap.has(key)) {
      courseMap.set(key, {
        id: code || courseName,
        code,
        name: courseName,
        group: group || '۰۱',
        units: 0,
        type: 'ـ',
        professor: 'ـ',
        days: day ? [day] : [],
        time: normalizeTimeRange(classTime) || 'ـ',
        hall: (hallM ? hallM[1].replace(/\s+/g, ' ').trim() : '') || 'ـ',
        examDate: examM ? faDigits(examM[1]) : 'ـ',
        examTime: examTime ? normalizeTimeRange(examTime) : 'ـ',
        capacity: capacity || 'ـ',
        classTimeRaw: classTime,
        timeSlotsRaw: classTime ? [classTime] : [],
        isLive: true,
      });
    } else {
      const cur = courseMap.get(key);
      if (day && !cur.days.includes(day)) cur.days.push(day);
      if (classTime && !cur.timeSlotsRaw.includes(classTime)) cur.timeSlotsRaw.push(classTime);
    }
  }

  const dayMarkers = [];
  const dayCellRe = /<TD[^>]*>([\s\S]*?)<\/TD>/gi;
  let dcm;
  while ((dcm = dayCellRe.exec(body)) !== null) {
    const candidate = normalizeDayName(dcm[1]);
    if (['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'].includes(candidate)) {
      const plain = cleanHtml(dcm[1]);
      if (plain.length < 25) dayMarkers.push({ index: dcm.index, day: candidate });
    }
  }

  const titleRe = /TITLE\s*=\s*"([^"]*)"/gi;
  let tm;
  while ((tm = titleRe.exec(body)) !== null) {
    const title = decodeEntities(tm[1]);
    if (!/نام درس/.test(title)) continue;
    let day = '';
    for (let i = dayMarkers.length - 1; i >= 0; i--) {
      if (dayMarkers[i].index < tm.index) {
        day = dayMarkers[i].day;
        break;
      }
    }
    const near = body.slice(tm.index, tm.index + 700);
    extractCourseFromTitle(title, day, cleanHtml(near));
  }

  const courses = [...courseMap.values()];
  const termId = termHint || mapTermFromTitle(outpar?.BMs || '');
  return { termId, courses };
}

/** گزارش ۸۸ — برنامه هنگام ثبت‌نام */
export function parseReport88Registration(outpar, termHint) {
  const bmT = String(outpar?.BMt || '');
  if (!bmT || bmT.indexOf('<row') === -1) {
    return { termId: termHint || '4051', courses: [] };
  }

  const dayCols = {
    C6: 'شنبه',
    C7: 'یکشنبه',
    C8: 'دوشنبه',
    C9: 'سه‌شنبه',
    C10: 'چهارشنبه',
    C11: 'پنجشنبه',
    C12: 'جمعه',
  };

  const rows = parseBehestanXmlGrid(bmT);
  const courses = rows.map((row) => {
    const codeGroup = cleanHtml(row.C1 || '');
    const code = extractCourseCode(codeGroup, row.C1);
    const group = (codeGroup.match(/_(\d+)/) || [])[1] || '۰۱';
    const days = [];
    let firstTime = '';
    let firstHall = '';
    // زمان و محل مخصوص هر روز — C6..C12 هرکدام بازهٔ خودشان را دارند
    const daySlots = [];

    for (const [col, day] of Object.entries(dayCols)) {
      const cell = cleanHtml(row[col] || '');
      if (!cell) continue;
      const timeM = cell.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      const hall = cell.replace(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/, '').trim() || 'ـ';
      if (timeM) {
        const t = normalizeTimeRange(timeM[1] + '-' + timeM[2]);
        days.push(day);
        daySlots.push({ day, time: t, hall });
        if (!firstTime) {
          firstTime = t;
          firstHall = hall;
        }
      }
    }

    const examRaw = cleanHtml(row.C14 || '');
    const examDay = cleanHtml(row.C13 || '');
    const examDateM = examRaw.match(/(\d{4}\/\d{1,2}\/\d{1,2})/);
    const examTimeM = examRaw.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);

    return {
      id: code,
      code,
      group: group || '۰۱',
      name: normalizeCourseName(cleanHtml(row.C2 || '')),
      units: parseInt(cleanHtml(row.C3 || '0'), 10) || 0,
      professor: normalizeCourseName(cleanHtml(row.C5 || '')) || 'ـ',
      type: 'ثبت‌نام',
      days: days.length ? days : examDay ? [normalizeDayName(examDay)] : [],
      time: firstTime || 'ـ',
      hall: firstHall || 'ـ',
      examDate: examDateM ? faDigits(examDateM[1]) : 'ـ',
      examTime: examTimeM ? normalizeTimeRange(examTimeM[1] + '-' + examTimeM[2]) : 'ـ',
      classTimeRaw: firstTime,
      daySlots,
      timeSlotsRaw: [],
      isLive: true,
      isRegistration: true,
      onSchedule: true,
      regStatus: 'registered',
    };
  }).filter((c) => c.name);

  const termId = termHint || mapTermFromTitle(String(outpar?.BMs || '')) || '4051';
  return { termId, courses };
}

/** گزارش ۴۲۸ — کارت امتحان */
export function parseReport428Exams(outpar, termHint) {
  const bmT = outpar?.BMt || '';
  if (!bmT || bmT === '<Root></Root>' || bmT.indexOf('<row') === -1) {
    return { termId: termHint || '', exams: [] };
  }
  const rows = parseBehestanXmlGrid(bmT);
  const exams = rows
    .map((row) => {
      const codeGroup = cleanHtml(row.C1 || '');
      const codeM = codeGroup.match(/(\d{5,})/);
      const when = cleanHtml(row.C5 || '');
      const day = normalizeCourseName(cleanHtml(row.C4 || ''));
      const dateM = when.match(/(\d{4}\/\d{1,2}\/\d{1,2})/);
      const timeM = when.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
      return {
        id: codeM ? codeM[1] : codeGroup || row.C2,
        code: codeM ? codeM[1] : '',
        codeGroup,
        name: normalizeCourseName(cleanHtml(row.C2 || '')),
        professor: normalizeCourseName(cleanHtml(row.C3 || '')),
        day,
        examDate: dateM ? faDigits(dateM[1]) : day,
        examTime: timeM ? faDigits(timeM[1]) + ' - ' + faDigits(timeM[2]) : faDigits(when),
        hall: normalizeCourseName(cleanHtml(row.C6 || '')) || 'ـ',
        invigilator: normalizeCourseName(cleanHtml(row.C7 || '')) || 'ـ',
        isLive: true,
      };
    })
    .filter((e) => e.name);

  return { termId: termHint || mapTermFromTitle(outpar?.BMs || '') || '4051', exams };
}

/** متادیتای دانشجو از گزارش ۸۸ — B1=شناسه AUW، B2=نام، B3=کد دانشکده، B4=دانشکده، B5=ترم، B6=مقطع */
export function parseReport88Meta(outpar) {
  const bmT = outpar?.BMt || '';
  if (!bmT) return null;
  const pick = (key) => {
    const m = bmT.match(new RegExp(`${key}="([^"]*)"`));
    return m ? cleanHtml(decodeEntities(m[1])) : '';
  };
  const auwId = pick('B1');
  const fullName = pick('B2');
  if (!auwId && !fullName) return null;
  return {
    auwId,
    fullName,
    facultyCode: pick('B3'),
    faculty: pick('B4'),
    term: pick('B5'),
    level: pick('B6'),
    // رشته از L1 (گروه آموزشی) — مثل افزونه
    major: pick('L1'),
  };
}

/** امتحانات از دروس ثبت‌نامی ۸۸ (C14 تاریخ و ساعت) — گزارش ۴۲۸ ترم جاری خالی است */
export function examsFromRegistration(courses, termId) {
  const exams = (courses || [])
    // تاریخ شمسی با ارقام فارسی ذخیره می‌شود — هر دو شکل را بپذیر
    .filter(
      (c) =>
        c.examDate &&
        c.examDate !== 'ـ' &&
        /[0-9۰-۹]{4}\/[0-9۰-۹]{1,2}\/[0-9۰-۹]{1,2}/.test(c.examDate || ''),
    )
    .map((c) => ({
      id: c.code || c.name,
      code: c.code || '',
      name: c.name,
      units: c.units || 0,
      professor: c.professor || 'ـ',
      day: '',
      examDate: c.examDate,
      examTime: c.examTime || 'ـ',
      hall: c.hall || 'ـ',
      isLive: true,
    }));
  return { termId: termId || '4051', exams };
}

/** برچسب فارسی ترم از شناسهٔ عددی — 4051 → نیمسال اول ۱۴۰۵–۱۴۰۶؛ 4052/4053 تابستان */
export function termIdToLabel(termId) {
  const tid = String(termId || '');
  if (!/^\d{4}$/.test(tid)) return tid ? `ترم ${faDigits(tid)}` : '';
  const y = 1000 + parseInt(tid.slice(0, 3), 10);
  const last = tid.charAt(3);
  let semName;
  if (last === '1') semName = 'نیمسال اول';
  else if (last === '2') semName = 'نیمسال دوم';
  else if (last === '3' || last === '4') semName = 'تابستان';
  const next = last === '3' || last === '4' ? y : y + 1;
  const range = last === '3' || last === '4' ? String(y) : `${y}–${next}`;
  return `${semName} ${faDigits(range)}`;
}

/** شناسهٔ ترم جاری: بزرگ‌ترین termId در دیتا یا 4051 */
export function detectCurrentTermId(courses) {
  const ids = (courses || [])
    .map((c) => String(c?.termId || '').trim())
    .filter((t) => /^\d{4}$/.test(t));
  if (!ids.length) return '4051';
  return ids.sort().reverse()[0];
}

/** F1825 — کارنامه / دروس / مالی */
export function parseF1825(data) {
  const grids = data?.rset?.grd || [];
  const result = {
    courses: [],
    finance: null,
    transcripts: [],
    profile: null,
  };

  if (grids[1]?.xml) {
    result.courses = parseBehestanXmlGrid(grids[1].xml)
      .map((row) => {
        const code = extractCourseCode(row.F2, row.F3, row.F4, row.F5);
        const gradeRaw = String(row.F9 || '').trim();
        const statusRaw = cleanHtml(row.F10 || '');
        const typeRaw = cleanHtml(row.F13 || '');
        const note = cleanHtml(row.F17 || '');
        const hasGrade = Boolean(gradeRaw && gradeRaw !== 'ـ' && gradeRaw !== '-');
        const g = toNum(gradeRaw);
        const gradePassed = hasGrade && g !== null && g >= 10;
        // F10 معمولاً «قبول/مردود» است؛ وضعیت حذف/انتظار از متن‌های دیگر
        const combined = `${statusRaw} ${typeRaw} ${note}`;
        const regStatus = normalizeRegStatus(combined, {
          onSchedule: false,
          hasGrade,
          gradePassed,
        });
        return {
          code,
          name: normalizeCourseName(cleanHtml(row.F1)),
          group: cleanHtml(row.F2).match(/گروه\s*(\S+)/)?.[1] || cleanHtml(row.F6) || '',
          units: toNum(row.F7),
          grade: gradeRaw,
          // برای UI کارنامه: قبول/مردود/…
          status: statusRaw || (hasGrade ? (gradePassed ? 'قبول' : 'مردود') : ''),
          regStatus,
          type: typeRaw || 'تخصصی',
          tuitionRial: row.F15 || '',
          termId: String(row.F18 || '').trim(),
          note,
          onSchedule: false,
        };
      })
      .filter((c) => c.name);
  }

  if (grids[2]?.xml) {
    const finRows = parseBehestanXmlGrid(grids[2].xml);
    let latestDebtRial = 0;
    const termsSummary = finRows.map((row) => {
      const numDebt = toNum(row.F9 || row.F13);
      const totalBill = toNum(row.F7);
      const totalPaid = toNum(row.F8);
      const fixed = toNum(row.F1);
      const variable = toNum(row.F2);
      const insurance = toNum(row.F3);
      const tid = String(row.F10 || '').trim();
      if (tid === '4051' || latestDebtRial === 0) latestDebtRial = numDebt;
      return {
        termId: tid,
        termTitle: cleanHtml(row.F11) || `ترم ${tid}`,
        fixedTuitionRial: fixed,
        variableTuitionRial: variable,
        insuranceRial: insurance,
        totalBillRial: totalBill,
        totalPaidRial: totalPaid,
        debtRial: numDebt,
        debtToman: Math.floor(numDebt / 10),
        status: numDebt > 0 ? 'بدهکار' : 'تسویه کامل',
      };
    });
    result.finance = {
      totalDebtRial: latestDebtRial,
      totalDebtToman: Math.floor(latestDebtRial / 10),
      statusText: latestDebtRial > 0 ? 'بدهکار' : 'تسویه حساب کامل',
      termsSummary,
    };
  }

  let finalGpa = '';
  let finalTotalUnits = 0;
  if (grids[3]?.xml) {
    const gpaRows = parseBehestanXmlGrid(grids[3].xml);
    result.transcripts = gpaRows.map((row) => {
      const termId = String(row.F1 || '').trim();
      const termUnits = toNum(row.F3);
      const totUnits = toNum(row.F4);
      const termGpa = String(row.F12 || '').trim();
      const cumGpa = String(row.F13 || '').trim();
      if (totUnits > finalTotalUnits) finalTotalUnits = totUnits;
      if (cumGpa) finalGpa = cumGpa;
      return {
        termId,
        termTitle: `نیم‌سال تحصیلی ${termId}`,
        termGpa: termGpa || 'ـ',
        cumulativeGpa: cumGpa || termGpa,
        passedUnits: termUnits,
        totalPassedUnits: totUnits,
        standing: toNum(termGpa) >= 17 ? 'ممتاز' : 'عادی',
        courses: result.courses.filter((c) => c.termId === termId),
      };
    }).filter((t) => t.termId);
  }

  // اگر گرید ۳ خالی بود، معدل را از دروس نمره‌دار حساب کن
  if (!finalGpa) {
    const scored = result.courses.filter((c) => c.grade && c.grade !== 'ـ' && c.grade !== '-');
    if (scored.length) {
      let pts = 0;
      let units = 0;
      for (const c of scored) {
        const g = toNum(c.grade);
        const u = c.units || 1;
        pts += g * u;
        units += u;
      }
      if (units > 0) finalGpa = (pts / units).toFixed(2);
    }
  }

  result.profile = {
    gpa: finalGpa || 'ـ',
    totalUnitsPassed: finalTotalUnits,
  };
  return result;
}

/** F1809 — عکس پرسنلی */
export function parseF1809(data) {
  const outpar = data?.outpar || {};
  const photo =
    extractPhotoDataUrl(outpar.AUWw || '') ||
    extractPhotoDataUrl(outpar.PHOTO || '') ||
    extractPhotoDataUrl(outpar.Photo || '');
  const name =
    cleanHtml(outpar.NA || outpar.Name || outpar.FN || '') || null;
  const major = cleanHtml(outpar.BRN || outpar.Major || '') || null;
  return { photo, name, major };
}

/** F6524 — گردش‌کار / اعلان‌ها */
export function parseF6524(data) {
  const grids = data?.rset?.grd || [];
  const xml = grids[0]?.xml || data?.outpar?.BMt || '';
  if (!xml) return [];
  return parseBehestanXmlGrid(xml)
    .map((row) => ({
      id: row.F1 || row.ID || String(row.C1 || ''),
      title: cleanHtml(row.F3 || row.F6 || row.F2 || row.C2 || row.F1 || ''),
      body: cleanHtml(row.F6 || row.F3 || row.C3 || ''),
      status: cleanHtml(row.F8 || row.F4 || ''),
      date: cleanHtml(row.F7 || row.F5 || ''),
    }))
    .filter((r) => r.title && r.title !== '5');
}

/** F1814 — خلاصه وضعیت دروس */
export function parseF1814CurriculumStats(data) {
  const grids = data?.rset?.grd || [];
  const pick = (gi) => {
    const xml = grids[gi]?.xml || '';
    return parseBehestanXmlGrid(xml)
      .map((row) => ({
        id: row.F1 || row.F2,
        label: cleanHtml(row.F3),
        count: parseInt(row.F4 || '0', 10) || 0,
        units: parseFloat(row.F5 || '0') || 0,
      }))
      .filter((r) => r.label);
  };
  return {
    byType: pick(0),
    byStatus: pick(1),
    byGradeStatus: pick(2),
    byStanding: pick(3),
  };
}
