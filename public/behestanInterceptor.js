/**
 * Sarvestan Behestan API Interceptor & Active Sync Engine
 * اجرا در MAIN WORLD صفحه بهستان
 * وظیفه:
 * ۱. هوک کردن تمام درخواست‌های XHR و Fetch در صفحه بهستان
 * ۲. استخراج داینامیک کارنامه، نمرات، ریزتراز مالی، بدهی، عکس پرسنلی، گردش‌کارها و برنامه
 * ۳. ارسال بی‌درنگ داده‌ها از طریق postMessage به contentScript برای ذخیره در storage
 * ۴. سنک خودکار و فعال (Active Auto-Sync) به محض تشخیص نشست فعال
 */
(function() {
  'use strict';
  if (window.__SARVESTAN_INTERCEPTOR_ACTIVE__) return;
  window.__SARVESTAN_INTERCEPTOR_ACTIVE__ = true;

  console.log('[Sarvestan] Interceptor & Live Engine loaded in MAIN world');

  // تجزیه رشته گرید XML اختصاصی گلستان/بهستان
  function parseBehestanXmlGrid(xmlStr) {
    if (!xmlStr || typeof xmlStr !== 'string') return [];
    const rows = [];
    const rowRe = /<row\s+([^>]*?)\/?>/gi;
    let match;
    while ((match = rowRe.exec(xmlStr)) !== null) {
      const attrs = {};
      const attrRe = /(\w+)="([^"]*)"/g;
      let am;
      while ((am = attrRe.exec(match[1])) !== null) {
        attrs[am[1]] = am[2]
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"');
      }
      rows.push(attrs);
    }
    return rows;
  }

  function cleanHtml(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  function unescapeXmlAttr(s) {
    if (!s) return '';
    return String(s)
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x0D;/g, ' ')
      .replace(/&#\d+;/g, ' ');
  }

  function decodeHtmlEntities(s) {
    if (!s) return '';
    return String(s)
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');
  }

  function normalizeDayName(raw) {
    if (!raw) return '';
    let d = decodeHtmlEntities(String(raw))
      .replace(/<[^>]*>/g, ' ')
      .replace(/[\s‌]+/g, ' ')
      .replace(/[يى]/g, 'ی')
      .replace(/ك/g, 'ک')
      .trim();
    // فقط اولین توکن معنادار روز را نگه دار (مثال: "شنبه" از "شنبه ...")
    d = d.replace(/^یک\s*شنبه\b/i, 'یکشنبه');
    d = d.replace(/^يك\s*شنبه\b/i, 'یکشنبه');
    d = d.replace(/^دو\s*شنبه\b/i, 'دوشنبه');
    d = d.replace(/^سه\s*شنبه\b/i, 'سه‌شنبه');
    d = d.replace(/^چهار\s*شنبه\b/i, 'چهارشنبه');
    d = d.replace(/^پنج\s*شنبه\b/i, 'پنجشنبه');
    d = d.replace(/^شنبه\b/i, 'شنبه');
    // اگر هنوز کل سلول است، فقط اولین کلمه روز را بردار
    const token = d.split(/\s+/)[0] || '';
    if (['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'].includes(token)) return token;
    if (['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'].includes(d)) return d;
    // "یک شنبه" باقی‌مانده
    if (/^یک\s*شنبه/.test(d)) return 'یکشنبه';
    if (/^سه\s*شنبه/.test(d)) return 'سه‌شنبه';
    if (/^دوشنبه/.test(d) || /^دو\s*شنبه/.test(d)) return 'دوشنبه';
    if (/^چهارشنبه/.test(d) || /^چهار\s*شنبه/.test(d)) return 'چهارشنبه';
    if (/^شنبه/.test(d)) return 'شنبه';
    return d;
  }

  function faDigits(str) {
    const map = '۰۱۲۳۴۵۶۷۸۹';
    return String(str || '').replace(/[0-9]/g, d => map[+d]);
  }

  // نرمال‌سازی نام درس: ي→ی ، ك→ک ، ى→ی ، اعداد لاتین→فارسی
  function normalizeCourseName(name) {
    if (!name) return '';
    return String(name)
      .replace(/[يى]/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/ـ/g, '')
      .replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
      .replace(/\s+/g, ' ')
      .trim();
  }

  function cleanCodeKey(code) {
    if (!code) return '';
    return String(code)
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/_\d+$/, '')
      .replace(/\D/g, '')
      .trim();
  }

  // واحد و اساتید دروس از گزارش‌های بهستان (کد درس → واحد و استاد)
  const unitByCode = Object.create(null);
  const professorByCode = Object.create(null);
  const professorByName = Object.create(null);

  function rememberCourseUnits(courses) {
    if (!Array.isArray(courses)) return;
    for (const c of courses) {
      if (!c) continue;
      const k = cleanCodeKey(c.code);
      if (k && c.units > 0) unitByCode[k] = c.units;
    }
  }

  function rememberProfessors(courses) {
    if (!Array.isArray(courses)) return;
    for (const c of courses) {
      if (!c) continue;
      const prof = c.professor;
      if (prof && prof !== 'ـ') {
        const k = cleanCodeKey(c.code);
        if (k) professorByCode[k] = prof;
        if (c.name) professorByName[normalizeCourseName(c.name)] = prof;
      }
    }
  }

  /**
   * تبدیل خروجی خام بهستان (ممکن است حاوی <PHOTO>... </PHOTO> باشد)
   * به data:image/jpeg;base64 معتبر
   */
  function extractPhotoDataUrl(raw) {
    if (!raw || typeof raw !== 'string') return null;
    let s = raw.trim();
    // حذف تگ‌های PHOTO در هر جای رشته
    s = s.replace(/<\/?PHOTO\s*>/gi, '');
    // حذف data-url اگر از قبل آمده
    s = s.replace(/^data:image\/(jpeg|jpg|png|webp);base64,/i, '');
    // فقط کاراکترهای معتبر base64 نگه داشته شود (با شکستن در whitespace)
    const b64 = s.replace(/[^A-Za-z0-9+/=]/g, '');
    if (b64.length < 200) return null;
    // حداقل طول برای عکس واقعی
    if (!b64.startsWith('/9j/') && !b64.startsWith('/9j') && !b64.startsWith('iVBOR') && !b64.startsWith('/9')) {
      // همچنان اگر خیلی بلند بود بفرست؛ اما لاگ بده
      console.warn('[Sarvestan] photo b64 unusual prefix:', b64.slice(0, 12));
    }
    const mime = b64.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${b64}`;
  }

  function parseTimeRange(raw) {
    if (!raw) return '';
    const norm = String(raw)
      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    const matches = [...norm.matchAll(/(\d{1,2}):(\d{2})/g)];
    if (matches.length < 2) return faDigits(String(raw).trim());
    const t1 = parseInt(matches[0][1], 10) * 60 + parseInt(matches[0][2], 10);
    const t2 = parseInt(matches[1][1], 10) * 60 + parseInt(matches[1][2], 10);
    const startM = Math.min(t1, t2);
    const endM = Math.max(t1, t2);
    const pad = (mins) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    };
    return faDigits(`${pad(startM)} - ${pad(endM)}`);
  }

  function mapTermFromTitle(title) {
    if (!title) return '';
    const t = decodeHtmlEntities(title);
    // "نيمسال اول سال تحصيلي 06-05" → 4051
    // "نيمسال دوم سال تحصيلي 05-04" → 4042
    const m = t.match(/(اول|دوم)\s+سال\s+تحصيلي\s+(\d{2})-(\d{2})/i);
    if (!m) {
      const m2 = t.match(/(06-05|05-04|07-06)/);
      if (!m2) return '';
      const map = { '06-05': '4051', '05-04': '4042', '07-06': '4061' };
      return map[m2[1]] || '';
    }
    const half = m[1]; // اول | دوم
    const yy = m[2]; // 06
    // first semester of year 05-06 = 4051 (0=05 year end digit + 1 first)
    // KNTU term ids: 40XY where X is year offset, Y is 1 or 2
    // 06-05 first = 4051, 05-04 first = 4041, 05-04 second = 4042
    const yearEnd = parseInt(yy, 10); // 6 → 05-06 is current academic year end 06?
    // Actually: "سال تحصيلي 06-05" = 1405-1406 → term 4051 (first of 405x)
    // "سال تحصيلي 05-04" = 1404-1405 → 4041 first, 4042 second
    const base = 4040 + (yearEnd); // 4046 for 06? Wait yearEnd=6 → 4046 wrong
    // Better: academic year 05-06 first term = 4051, second = 4052
    // year token "06" means ends in 06, starts with 05 → term 405?
    const startYY = parseInt(m[3], 10); // 05
    const termNum = half === 'دوم' ? 2 : 1;
    return '40' + String(startYY) + termNum;
  }

  /**
   * پارس ماتریس گزارش ۷۸ (برنامه هفتگی) از فیلد M2 در BMt
   * شامل دروس داخل TABLE های تو در تو
   */
  function parseReport78Schedule(outpar, termHint) {
    const bmT = outpar?.BMt || '';
    if (!bmT || bmT === '<Root></Root>') return { termId: termHint || '', courses: [] };

    const m2Match = bmT.match(/M2="([^"]*)"/);
    if (!m2Match) return { termId: termHint || '', courses: [] };
    const m2Html = unescapeXmlAttr(m2Match[1]);
    if (!m2Html || m2Html.indexOf('<TABLE') === -1) return { termId: termHint || '', courses: [] };

    // هدر ساعت‌ها (برای map ستون‌ها — اختیاری)
    const headHtml = (m2Html.match(/<THEAD>[\s\S]*?<\/THEAD>/i) || [''])[0];
    const timeCells = [];
    const headCellRe = /<TD[^>]*>([\s\S]*?)<\/TD>/gi;
    let hm;
    while ((hm = headCellRe.exec(headHtml)) !== null) {
      const t = decodeHtmlEntities(hm[1]).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (t && t !== 'روز/ساعت' && /:/.test(t)) {
        const times = t.split(/\s+/).filter(Boolean);
        if (times.length >= 2) timeCells.push(times[0] + '-' + times[1]);
        else timeCells.push(times[0]);
      }
    }

    const body = m2Html.replace(/<\/?THEAD>/gi, '');
    const courseMap = new Map();

    function extractCourseFromTitle(title, day, textHint) {
      const nameM = title.match(/نام درس\s*:\s*(.+?)(?:\s*شماره درس|$)/);
      const codeM = title.match(/شماره درس\s*:\s*(\d+)/);
      const groupM = title.match(/گروه\s*:\s*(\d+)/);

      const normAll = (title + ' ' + (textHint || ''))
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
      const timeM = normAll.match(/ساعت\s*[:\-]?\s*([0-9]{1,2}:[0-9]{2}\s*[-–]\s*[0-9]{1,2}:[0-9]{2})/);
      const capM = normAll.match(/تعداد ثبت نامي\s*[:\-]?\s*(\d+)/);

      const courseName = normalizeCourseName(
        (nameM ? nameM[1] : cleanHtml(String(textHint || '').split('گروه')[0]))
          .replace(/\s+/g, ' ')
          .trim()
      );
      if (!courseName || !/نام درس/.test(title)) return;

      const code = codeM ? codeM[1] : '';
      const group = groupM ? groupM[1] : '';
      const classTime = timeM ? timeM[1].trim() : '';
      const capacity = capM ? capM[1] : '';
      const kCode = cleanCodeKey(code);
      const units = unitByCode[kCode] || 0;

      let parsedProf = '';
      const profM = (title + ' ' + (textHint || '')).match(
        /(?:نام\s*(?:استاد|مدرس)|استاد|مدرس)\s*[:\-]?\s*([^<\n\r]+?)(?=\s*(?:محل|امتحان|ساعت|تعداد|شماره|گروه|واحد|$))/i
      );
      if (profM) {
        parsedProf = normalizeCourseName(profM[1].trim());
      }
      if (!parsedProf && textHint) {
        const drM = textHint.match(/(?:دکتر|مهندس|استادیار|دانشیار)\s+([^\d<\n\r:]{3,30})/i);
        if (drM) {
          parsedProf = normalizeCourseName(drM[0].trim());
        }
      }
      const resolvedProf = parsedProf || professorByCode[kCode] || professorByName[courseName] || 'ـ';

      const hallM = textHint ? textHint.match(/محل\s*[:\-]?\s*(.+?)(?=\s*امتحان|$)/) : null;
      const examM = textHint ? textHint.match(/امتحان\s*[:\-]?\s*([0-9]{4}\/[0-9]{2}\/[0-9]{2})/) : null;
      let examTime = '';
      if (examM && textHint) {
        const afterExam = textHint.slice(textHint.indexOf('امتحان'));
        const et = afterExam.match(/ساعت\s*[:\-]?\s*([0-9]{1,2}:[0-9]{2}\s*[-–]\s*[0-9]{1,2}:[0-9]{2})/);
        if (et) examTime = et[1].trim();
      }

      const hall = (hallM ? hallM[1].replace(/\s+/g, ' ').trim() : '') || 'ـ';
      const slotTime = parseTimeRange(classTime) || 'ـ';
      const slot = day ? { day, time: slotTime, hall } : null;

      const key = code + '|' + group + '|' + courseName;
      if (!courseMap.has(key)) {
        courseMap.set(key, {
          id: code || courseName,
          code,
          name: courseName,
          group: group || '۰۱',
          units: units,
          type: 'ـ',
          professor: resolvedProf,
          days: day ? [day] : [],
          daySlots: slot ? [slot] : [],
          time: slotTime,
          hall,
          examDate: examM ? examM[1] : 'ـ',
          examTime: examTime ? parseTimeRange(examTime) : 'ـ',
          capacity: capacity || 'ـ',
          classTimeRaw: classTime,
          timeSlotsRaw: classTime ? [classTime] : [],
          isLive: true
        });
      } else {
        const cur = courseMap.get(key);
        if (resolvedProf !== 'ـ' && (!cur.professor || cur.professor === 'ـ')) cur.professor = resolvedProf;
        if (day && !cur.days.includes(day)) cur.days.push(day);
        if (!cur.daySlots) cur.daySlots = [];
        if (slot && !cur.daySlots.some(s => s.day === day && s.time === slotTime)) {
          cur.daySlots.push(slot);
        }
        if (units > 0) cur.units = units;
        if (classTime && !cur.timeSlotsRaw.includes(classTime)) {
          cur.timeSlotsRaw.push(classTime);
          if (!cur.classTimeRaw) {
            cur.classTimeRaw = classTime;
            cur.time = slotTime;
          }
        }
        if (hall && (cur.hall === 'ـ' || !cur.hall)) cur.hall = hall;
        if (examM && (!cur.examDate || cur.examDate === 'ـ')) cur.examDate = examM[1];
      }
    }

    // ── پارس موقعیتی: </TR> های تو در تو سطر را نمی‌شکنند ──
    // 1) همه جایگاه‌های هدر روز
    const dayMarkers = [];
    const dayCellRe = /<TD[^>]*>([\s\S]*?)<\/TD>/gi;
    let dcm;
    while ((dcm = dayCellRe.exec(body)) !== null) {
      const candidate = normalizeDayName(dcm[1]);
      if (['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'].includes(candidate)) {
        // فقط اگر متن سلول عمدتاً همان نام روز است (سطر هدر، نه سلول درس)
        const plain = decodeHtmlEntities(dcm[1]).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (plain.length < 25) {
          dayMarkers.push({ index: dcm.index, day: candidate });
        }
      }
    }

    // 2) همه TITLE های «نام درس» با نزدیک‌ترین روز قبلی
    const titleRe = /TITLE\s*=\s*"([^"]*)"/gi;
    let tm;
    while ((tm = titleRe.exec(body)) !== null) {
      const title = unescapeXmlAttr(tm[1]);
      if (!/نام درس/.test(title)) continue;

      let day = '';
      for (let i = dayMarkers.length - 1; i >= 0; i--) {
        if (dayMarkers[i].index < tm.index) {
          day = dayMarkers[i].day;
          break;
        }
      }

      const near = body.slice(tm.index, tm.index + 700);
      const textHint = decodeHtmlEntities(near).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      extractCourseFromTitle(title, day, textHint);
    }

    // fallback: اگر هیچ TITLE پیدا نشد
    if (courseMap.size === 0) {
      const titles = m2Html.match(/TITLE\s*=\s*"([^"]*نام درس[^"]*)"/gi) || [];
      for (const rawTitle of titles) {
        const title = unescapeXmlAttr(rawTitle.replace(/^TITLE\s*=\s*"/i, '').replace(/"$/i, ''));
        extractCourseFromTitle(title, '', '');
      }
    }

    const courses = [...courseMap.values()];
    let termId = termHint || '';
    if (!termId) {
      termId = mapTermFromTitle(outpar?.BMs || '');
    }
    return { termId, courses };
  }

  /**
   * پارس گزارش ۴۲۸ (برنامه امتحان) — داده در BMt با فیلدهای C1..C7
   * C1: شماره و گروه درس | C2: نام درس | C3: استاد | C4: روز
   * C5: تاریخ و ساعت | C6: محل | C7: مراقب
   */
  function parseReport428Exams(outpar, termHint) {
    const bmT = outpar?.BMt || '';
    if (!bmT || bmT === '<Root></Root>' || bmT.indexOf('<row') === -1) {
      return { termId: termHint || '', exams: [] };
    }
    const rows = parseBehestanXmlGrid(bmT);
    const exams = rows.map(row => {
      const codeGroup = cleanHtml(row.C1 || '');
      const codeM = codeGroup.match(/(\d{5,})/);
      const groupM = codeGroup.match(/(?:گروه|G)\s*[:\-]?\s*(\d+)/i) || codeGroup.match(/\s(\d{1,3})\s*$/);
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
        examTime: timeM
          ? faDigits(timeM[1]) + ' - ' + faDigits(timeM[2])
          : faDigits(when),
        hall: normalizeCourseName(cleanHtml(row.C6 || '')) || 'ـ',
        invigilator: normalizeCourseName(cleanHtml(row.C7 || '')) || 'ـ',
        isLive: true
      };
    }).filter(e => e.name);

    rememberProfessors(exams);

    let termId = termHint || '';
    if (!termId) {
      const bms = String(outpar.BMs || '');
      if (bms.includes('05-04') && bms.includes('اول')) termId = '4041';
      else if (bms.includes('05-04') && bms.includes('دوم')) termId = '4042';
      else if (bms.includes('06-05')) termId = '4051';
    }
    return { termId, exams };
  }

  /**
   * پارس گزارش ۷۷ — «نتیجه ثبت نام دانشجو»
   * C1=شماره و گروه درس | C2=نام درس | C3=کل واحد | C5=وضعیت | C6=نوع درس | C7=نام استاد | C8=روز و ساعت
   */
  function parseReport77(outpar, termHint) {
    const bmT = String(outpar?.BMt || '');
    if (!bmT || bmT.indexOf('<row') === -1) {
      return { termId: termHint || '4051', courses: [] };
    }
    const rows = parseBehestanXmlGrid(bmT);
    const courses = rows.map(row => {
      const codeGroup = cleanHtml(row.C1 || '');
      const code = (codeGroup.match(/^(\d+)/) || [])[1] || codeGroup;
      const group = (codeGroup.match(/_(\d+)/) || [])[1] || '۰۱';
      const name = normalizeCourseName(cleanHtml(row.C2 || ''));
      const units = parseFloat(cleanHtml(row.C3 || '0')) || 0;
      const professor = normalizeCourseName(cleanHtml(row.C7 || '')) || 'ـ';
      const statusRaw = cleanHtml(row.C5 || '');
      const typeRaw = cleanHtml(row.C6 || '');
      return {
        id: code,
        code,
        group,
        name,
        units,
        professor,
        type: typeRaw,
        statusRaw,
        isLive: true,
      };
    }).filter(c => c.name);

    rememberProfessors(courses);
    rememberCourseUnits(courses);

    let termId = termHint || '';
    if (!termId) {
      const bms = String(outpar?.BMs || '');
      if (bms.includes('06-05')) termId = '4051';
      else if (bms.includes('05-04') && bms.includes('دوم')) termId = '4042';
      else if (bms.includes('05-04')) termId = '4041';
    }
    return { termId: termId || '4051', courses };
  }

  /**
   * پارس گزارش ۸۸ — «برنامه هفتگی در طول ثبت‌نام»
   * BMt چند row دارد؛ هر row یک درس:
   * C1=کد_گروه | C2=نام | C3=واحد | C5=استاد
   * C6..C12 = شنبه..جمعه با محتوای "HH:MM-HH:MM محل"
   * C13=روز امتحان | C14=تاریخ و ساعت امتحان
   */
  function parseReport88Registration(outpar, termHint) {
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
      C12: 'جمعه'
    };

    const rows = parseBehestanXmlGrid(bmT);
    const courses = rows.map(row => {
      const codeGroup = cleanHtml(row.C1 || '');
      const code = (codeGroup.match(/^(\d+)/) || [])[1] || codeGroup;
      const group = (codeGroup.match(/_(\d+)/) || [])[1] || '۰۱';
      const days = [];
      let firstTime = '';
      let firstHall = '';

      for (const [col, day] of Object.entries(dayCols)) {
        const cell = cleanHtml(row[col] || '');
        if (!cell) continue;
        const timeM = cell.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
        const hall = cell.replace(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/, '').trim() || 'ـ';
        if (timeM) {
          days.push(day);
          if (!firstTime) {
            // ۸۸: "16:30-18:00" یعنی start-end → برای parseTimeRange که end-start است، جابه‌جا می‌کنیم
            firstTime = parseTimeRange(timeM[2] + '-' + timeM[1]);
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
        days: days.length ? days : (examDay ? [normalizeDayName(examDay)] : []),
        time: firstTime || 'ـ',
        hall: firstHall || 'ـ',
        examDate: examDateM ? faDigits(examDateM[1]) : 'ـ',
        examTime: examTimeM ? parseTimeRange(examTimeM[2] + '-' + examTimeM[1]) : 'ـ',
        classTimeRaw: firstTime ? firstTime.replace(/ /g, '') : '',
        timeSlotsRaw: days.length ? [] : [],
        isLive: true,
        isRegistration: true
      };
    }).filter(c => c.name);

    rememberProfessors(courses);
    rememberCourseUnits(courses);

    // استخراج ترم از BMs
    let termId = termHint || '';
    if (!termId) {
      const bms = String(outpar.BMs || '');
      if (bms.includes('06-05')) termId = '4051';
      else if (bms.includes('05-04') && bms.includes('دوم')) termId = '4042';
      else if (bms.includes('05-04')) termId = '4041';
    }
    return { termId: termId || '4051', courses };
  }

  /**
   * پارس خلاصه وضعیت دروس F1814 (فرم ۱۱۱۲۶)
   * گریدها: byType (عمومی/پایه/...)، byStatus، ...
   */
  function parseF1814CurriculumStats(data) {
    const grids = data.rset?.grd || [];
    const pick = (gi) => {
      const xml = grids[gi]?.xml || '';
      return parseBehestanXmlGrid(xml).map(row => ({
        id: row.F1 || row.F2,
        label: cleanHtml(row.F3),
        count: parseInt(row.F4 || '0', 10) || 0,
        units: parseFloat(row.F5 || '0') || 0
      })).filter(r => r.label);
    };
    return {
      byType: pick(0),
      byStatus: pick(1),
      byGradeStatus: pick(2),
      byStanding: pick(3)
    };
  }

  function sendData(dataType, payload) {
    try {
      window.postMessage({
        action: 'SARVESTAN_INTERCEPTED_DATA',
        dataType: dataType,
        payload: payload,
        source: 'sarvestan-interceptor'
      }, '*');
    } catch (err) {
      console.warn('[Sarvestan] sendData error:', err);
    }
  }

  // ── پردازش پاسخ‌های API سامانه بهستان ──
  function processResponseData(url, responseText, requestText) {
    if (!responseText || responseText.length < 30) return;
    try {
      if (!isManualLogoutLocked()) {
        rememberFromText(requestText);
        rememberFromText(responseText);
      }

      const data = JSON.parse(responseText);
      if (!data) return;

      // ۱. رهگیری اطلاعات نشست و شماره دانشجویی از sys.svc
      if (url.includes('sys.svc') && data.outpar) {
        if (isManualLogoutLocked() || userLoggedOut) return;
        rememberFromText(responseText);
        if (requestText) rememberFromText(requestText);
        const std = data.outpar.std || localStorage.getItem('un') || localStorage.getItem('std') || localStorage.getItem('stdno') || localStorage.getItem('studentId');
        const u = data.outpar.u || localStorage.getItem('u') || localStorage.getItem('uid');
        const sid = data.oaut?.rp?.sid || sessionCache.sid || localStorage.getItem('sid');
        if (sid) sessionCache.sid = sid;
        if (std) sessionCache.studentId = std;
        if (u) sessionCache.userId = u;
        if (std || u) {
          sendData('session_info', {
            studentId: std,
            userId: u,
            sid: sid
          });
          sendData('profile_update', {
            studentId: std,
            userId: u
          });
          triggerProactiveSync();
        }
      }

      // ViewReport همیشه پردازش شود (حتی اگر لاگاوت بود، داده‌ی صفحهٔ باز شده مهم است)
      if (url.includes('ViewReport') || url.includes('BAS0237')) {
        const outpar = data.outpar || {};
        let formCode = '';
        try {
          if (requestText) {
            const rq = JSON.parse(requestText);
            formCode = String(rq?.rp?.f || '');
          }
        } catch (_) {}
        const bms = String(outpar.BMs || '');
        if (!formCode) {
          const fm = bms.match(/شماره گزارش\s*:\s*(\d+)/);
          if (fm) formCode = fm[1];
        }
        // تشخیص از متن سربرگ گزارش
        if (!formCode && bms.includes('برنامه هفتگي')) formCode = '78';
        if (!formCode && (bms.includes('ثبت‌نام') || bms.includes('88') || bms.includes('تأييديه ثبت'))) formCode = '88';
        if (!formCode && bms.includes('نتيجه ثبت')) formCode = '77';
        if (!formCode && (bms.includes('امتحان') || bms.includes('428'))) formCode = '428';

        // استخراج مشخصات دانشجو از ساختار متادیتا (B1/B2) یا متن هدر گزارش‌های بهستان
        const b1Match = String(outpar.BMt || '').match(/\bB1=["']([^"']+)["']/i);
        const b2Match = String(outpar.BMt || '').match(/\bB2=["']([^"']+)["']/i);
        const b4Match = String(outpar.BMt || '').match(/\bB4=["']([^"']+)["']/i);
        const l1Match = String(outpar.BMt || '').match(/\bL1=["']([^"']+)["']/i);

        const allReportText = (bms + ' ' + String(outpar.BMt || '')).replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]);
        const bmsStdMatch = allReportText.match(/(?:شماره|کد)\s*(?:دانشجوی[یي]|دانشجو)?\s*[:\-]?\s*(\d{7,10})/i) ||
                            allReportText.match(/\b(40[0-9]{5,8}|9[5-9][0-9]{5,8})\b/);
        const bmsNameMatch = (bms + ' ' + String(outpar.BMt || '')).match(/(?:نام\s*و\s*نام\s*خانوادگی|نام\s*دانشجو)\s*[:\-]?\s*([^\d\n\r:—\-]{3,35})(?=\s*(?:شماره|دانشکده|رشته|دوره|مقطع|$))/i);

        const sId = (b1Match && b1Match[1]) || (bmsStdMatch ? bmsStdMatch[1] : null);
        const sName = (b2Match && cleanHtml(decodeHtmlEntities(b2Match[1]))) || (bmsNameMatch ? bmsNameMatch[1].trim() : null);
        const sFaculty = (b4Match && cleanHtml(decodeHtmlEntities(b4Match[1]))) || null;
        const sMajor = (l1Match && cleanHtml(decodeHtmlEntities(l1Match[1]))) || sFaculty;

        if (sId || sName) {
          if (sId && !sessionCache.studentId) sessionCache.studentId = sId;
          sendData('profile_update', {
            ...(sId ? { studentId: sId } : {}),
            ...(sName ? { fullName: sName } : {}),
            ...(sFaculty ? { faculty: sFaculty } : {}),
            ...(sMajor ? { major: sMajor } : {}),
            isLoggedIn: true
          });
        }

        let termHint = '';
        try {
          if (requestText) {
            const rq = JSON.parse(requestText);
            const bmv = String(rq?.r?.BMv || '');
            const tm = bmv.match(/M="(\d+)"/);
            if (tm) termHint = tm[1];
          }
        } catch (_) {}
        if (!termHint) {
          // BMv پاسخ هم ممکن است ترم را داشته باشد
          const bmvResp = String(outpar.BMv || '');
          const tm2 = bmvResp.match(/M="(\d+)"/);
          if (tm2) termHint = tm2[1];
        }

        if (formCode === '78') {
          const parsed = parseReport78Schedule(outpar, termHint);
          const courseCount = parsed && parsed.courses ? parsed.courses.length : 0;
          if (courseCount > 0) {
            const termId = parsed.termId || termHint || '4051';
            // غنی‌سازی با اساتید و واحدهای شناخته‌شده
            for (const c of parsed.courses) {
              const k = cleanCodeKey(c.code);
              if (!c.professor || c.professor === 'ـ') {
                c.professor = (k && professorByCode[k]) || professorByName[c.name] || 'ـ';
              }
              if (!c.units || c.units === 0) {
                c.units = (k && unitByCode[k]) || 0;
              }
            }
            sendData('schedule', { termId, courses: parsed.courses, source: '78' });
            console.log(
              '[Sarvestan] ✅ Report 78 schedule captured:',
              termId,
              courseCount,
              'courses:',
              parsed.courses.map(c => `${c.name} (${c.professor})`).join(' | ')
            );
          } else {
            console.log('[Sarvestan] Report 78 empty for term', termHint || parsed?.termId);
          }
        } else if (formCode === '77') {
          const parsed77 = parseReport77(outpar, termHint);
          if (parsed77.courses.length > 0) {
            const termId = parsed77.termId || termHint || '4051';
            sendData('reg77', { termId, courses: parsed77.courses });
            console.log(
              '[Sarvestan] ✅ Report 77 registration results captured:',
              termId,
              parsed77.courses.length,
              'professors:',
              parsed77.courses.map(c => `${c.name} (${c.professor})`).join(' | ')
            );
          } else {
            console.log('[Sarvestan] Report 77 empty for term', termHint || parsed77.termId);
          }
        } else if (formCode === '88') {
          const parsed88 = parseReport88Registration(outpar, termHint);
          if (parsed88.courses.length > 0) {
            const termId = parsed88.termId || termHint || '4051';
            sendData('schedule', { termId, courses: parsed88.courses, source: '88' });
            console.log(
              '[Sarvestan] ✅ Report 88 registration schedule captured:',
              termId,
              parsed88.courses.length,
              parsed88.courses.map(c => c.name).join(' | ')
            );
          } else {
            console.log('[Sarvestan] Report 88 empty for term', termHint || parsed88.termId);
          }
        } else if (formCode === '428') {
          const parsed428 = parseReport428Exams(outpar, termHint);
          if (parsed428.exams.length > 0) {
            const termId = parsed428.termId || termHint || '4051';
            sendData('exams', { termId, exams: parsed428.exams });
            console.log(
              '[Sarvestan] ✅ Report 428 exams captured:',
              termId,
              parsed428.exams.length,
              parsed428.exams.map(e => e.name).join(' | ')
            );
          } else {
            console.log('[Sarvestan] Report 428 empty for term', termHint || parsed428.termId);
          }
        } else if (outpar.BMt || outpar.BMs) {
          console.log('[Sarvestan] ViewReport form=' + (formCode || '?') + ' BMtLen=' + String(outpar.BMt || '').length);
        }
      }

      // ۲. کارنامه، وضعیت تحصیلی، دروس و وضعیت مالی (STDTOTALINFOTrmStat_BEH)
      if (url.includes('STDTOTALINFOTrmStat')) {
        const grids = data.rset?.grd || [];
        
        // الف) پردازش دروس از گرید ۱ (AUWr)
        let allCourses = [];
        if (grids[1] && grids[1].xml) {
          const courseRows = parseBehestanXmlGrid(grids[1].xml);
          allCourses = courseRows.map(row => {
            const code = (row.F3 || '') + (row.F4 || '') + (row.F5 || '') || row.F2 || '';
            const statusRaw = cleanHtml(row.F10 || '');
            const gradeModeRaw = cleanHtml(row.F11 || '');
            const crsModeRaw = cleanHtml(row.F12 || '');
            const typeRaw = cleanHtml(row.F13 || '');
            const regTypeRaw = cleanHtml(row.F23 || '');
            const a0 = String(row.A0 || '').trim();
            const gradeRaw = String(row.F9 || '').trim();

            const isDropped = /حذف\s*اضطرار|حذف\s*شده|حذف\s*ايثار|حذف\s*ایثار|cancell?ed|dropped/i.test(`${gradeModeRaw} ${crsModeRaw} ${statusRaw}`);
            const isWait = a0 === '3' || /انتظار|ليست\s*انتظار|لیست\s*انتظار|wait\s*list|waitlist/i.test(`${regTypeRaw} ${gradeModeRaw} ${crsModeRaw} ${statusRaw}`);

            let regStatus = 'registered';
            let status = statusRaw;
            let displayGrade = gradeRaw;

            if (isDropped) {
              regStatus = 'dropped';
              status = 'حذف اضطراری';
              displayGrade = 'حذف';
            } else if (isWait) {
              regStatus = 'waitlist';
              status = 'در انتظار';
              displayGrade = 'انتظار';
            } else if (gradeRaw && gradeRaw !== 'ـ' && gradeRaw !== '-') {
              const g = parseFloat(gradeRaw.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
              if (!isNaN(g)) {
                status = g >= 10 ? 'قبول' : 'مردود';
              }
            }

            return {
              code,
              name: normalizeCourseName(cleanHtml(row.F1)),
              group: cleanHtml(row.F2).match(/گروه\s*(\S+)/)?.[1] || cleanHtml(row.F6) || '',
              units: parseInt(row.F7 || '0', 10),
              grade: displayGrade,
              rawGrade: gradeRaw,
              status,
              regStatus,
              isDropped,
              isWaitlist: isWait,
              type: typeRaw || 'تخصصی',
              tuitionRial: row.F15 || '',
              termId: String(row.F18 || '').trim(),
              note: cleanHtml(row.F17) || ''
            };
          }).filter(c => c.name);

          if (allCourses.length > 0) {
            rememberCourseUnits(allCourses);
            sendData('courses', allCourses);
            // اگر برنامه قبلاً ذخیره شده بود، واحد/نام را غنی کن
            sendData('schedule_enrich', { courses: allCourses });
            console.log('[Sarvestan] ✅ Captured all courses:', allCourses.length);
          }
        }

        // ب) پردازش اطلاعات مالی و بدهی از گرید ۲ (AVVY)
        if (grids[2] && grids[2].xml) {
          const finRows = parseBehestanXmlGrid(grids[2].xml);
          let latestDebtRial = 0;
          let overallDebtRial = 0;
          const termsSummary = finRows.map(row => {
            const numDebt = parseInt(String(row.F9 || '').replace(/[^\d]/g, '') || '0', 10);
            const rowOverall = parseInt(String(row.F13 || '').replace(/[^\d]/g, '') || '0', 10);
            if (rowOverall > 0 && overallDebtRial === 0) overallDebtRial = rowOverall;
            if (numDebt > 0 && latestDebtRial === 0) latestDebtRial = numDebt;

            const totalBill = parseInt((row.F7 || '0').replace(/[^\d]/g, ''), 10);
            const totalPaid = parseInt((row.F8 || '0').replace(/[^\d]/g, ''), 10);
            const fixed = parseInt((row.F1 || '0').replace(/[^\d]/g, ''), 10);
            const variable = parseInt((row.F2 || '0').replace(/[^\d]/g, ''), 10);
            const insurance = parseInt((row.F3 || '0').replace(/[^\d]/g, ''), 10);
            const tid = String(row.F10 || '').trim();

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
              status: numDebt > 0 ? `${Math.floor(numDebt / 10).toLocaleString('fa-IR')} تومان بدهکار` : 'تسویه کامل'
            };
          });

          const finalTotalDebt = overallDebtRial > 0 ? overallDebtRial : latestDebtRial;
          sendData('finance', {
            totalDebtRial: finalTotalDebt,
            totalDebtToman: Math.floor(finalTotalDebt / 10),
            statusText: finalTotalDebt > 0 ? 'بدهکار' : 'تسویه حساب کامل',
            termsSummary: termsSummary
          });
          console.log('[Sarvestan] ✅ Captured financial status: Debt =', finalTotalDebt);
        }

        // ج) پردازش کارنامه رسمی و معدل از گرید ۳ (AfqV) یا گرید ۰ (AUWp)
        let transcripts = [];
        let finalGpa = '';
        let finalTotalUnits = 0;
        let finalStanding = 'عادی';

        if (grids[3] && grids[3].xml) {
          const gpaRows = parseBehestanXmlGrid(grids[3].xml);
          transcripts = gpaRows.map(row => {
            const termId = String(row.F1 || '').trim();
            const tCourses = allCourses.filter(c => c.termId === termId);
            const regUnits = parseInt(row.F3 || '0', 10);
            const termUnits = parseInt(row.F5 || row.F6 || row.F3 || '0', 10);
            const totUnits = parseInt(row.F7 || row.F4 || '0', 10);
            const droppedUnits = parseInt(row.F10 || '0', 10);
            const termGpa = (row.F12 || '').trim();
            const cumGpa = (row.F13 || '').trim();

            if (totUnits > finalTotalUnits) finalTotalUnits = totUnits;
            if (cumGpa) finalGpa = cumGpa;

            const gpaNum = parseFloat(termGpa.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
            let standing = 'عادی';
            if (gpaNum >= 19) standing = 'ممتاز';
            else if (gpaNum >= 17) standing = 'معدل الف';
            else if (gpaNum < 10) standing = 'مشروط';

            return {
              termId: termId,
              termTitle: cleanHtml(row.F2) ? `نیم‌سال تحصیلی ${termId}` : `ترم ${termId}`,
              termGpa: termGpa || 'ـ',
              cumulativeGpa: cumGpa || termGpa,
              passedUnits: termUnits,
              unitsPassed: termUnits,
              registeredUnits: regUnits,
              droppedUnits: droppedUnits,
              totalPassedUnits: totUnits,
              termStatus: cleanHtml(row.F2),
              standing,
              courses: tCourses
            };
          }).filter(t => t.termId);
        } else if (grids[0] && grids[0].xml) {
          const termRows = parseBehestanXmlGrid(grids[0].xml);
          transcripts = termRows.map(row => {
            const termId = String(row.F13 || '').trim();
            const tCourses = allCourses.filter(c => c.termId === termId);
            const passed = parseInt(row.F5 || row.F6 || '0', 10);
            const total = parseInt(row.F4 || '0', 10);
            if (total > finalTotalUnits) finalTotalUnits = total;
            const gpaNum = parseFloat(String(row.F1 || '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
            let standing = 'عادی';
            if (gpaNum >= 19) standing = 'ممتاز';
            else if (gpaNum >= 17) standing = 'معدل الف';
            else if (gpaNum < 10) standing = 'مشروط';

            return {
              termId: termId,
              termTitle: cleanHtml(row.F15) || `ترم ${termId}`,
              termGpa: (row.F1 || '').trim(),
              cumulativeGpa: '',
              passedUnits: passed,
              unitsPassed: passed,
              totalPassedUnits: total,
              termStatus: cleanHtml(row.F16) || '',
              standing,
              courses: tCourses
            };
          }).filter(t => t.termId);
        }

        if (!finalTotalUnits) {
          const passedCourses = allCourses.filter(c => 
            c.regStatus !== 'dropped' && 
            c.regStatus !== 'waitlist' && 
            !/حذف|انتظار/i.test(c.status) &&
            (c.regStatus === 'passed' || parseFloat(c.grade) >= 10)
          );
          finalTotalUnits = passedCourses.reduce((s, c) => s + (c.units || 0), 0);
        }

        const gpaFloat = parseFloat(String(finalGpa).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
        if (gpaFloat >= 19) finalStanding = 'ممتاز (دانشجوی برتر)';
        else if (gpaFloat >= 17) finalStanding = 'معدل الف';
        else if (gpaFloat < 10) finalStanding = 'مشروط';

        if (transcripts.length > 0) {
          sendData('transcripts', transcripts);
          sendData('profile_update', {
            gpa: finalGpa || (transcripts[0]?.termGpa ?? 'ـ'),
            totalUnitsPassed: finalTotalUnits,
            standing: finalStanding
          });
          console.log('[Sarvestan] ✅ Transcripts & GPA captured:', transcripts.length, 'terms, GPA:', finalGpa);
        }
      }

      // ۳. عکس پرسنلی و اطلاعات فردی (STD_Personally)
      if (url.includes('STD_Personally')) {
        const photoUrl = extractPhotoDataUrl(data.outpar?.AUWw);
        if (photoUrl) {
          sendData('profile_update', { photo: photoUrl });
          console.log('[Sarvestan] ✅ Clean student photo captured, len=', photoUrl.length);
        }
      }

      // ۳ب. خلاصه وضعیت دروس (F1814 / فرم ۱۱۱۲۶)
      if (url.includes('F1814') || url.includes('STDAllCrs')) {
        if (data.rset?.grd) {
          const stats = parseF1814CurriculumStats(data);
          if (stats.byType.length || stats.byStatus.length) {
            sendData('curriculum_stats', stats);
            console.log('[Sarvestan] ✅ F1814 curriculum stats:', stats.byType.length, 'types');
          }
        }
      }

      // ۴. پیشخوان خدمت، گردش‌کارها و نامه‌ها (DASHBOARD_BEH)
      if (url.includes('DASHBOARD_BEH')) {
        const grids = data.rset?.grd || [];
        for (const grid of grids) {
          if (!grid.xml) continue;
          const rows = parseBehestanXmlGrid(grid.xml);
          if (rows.length > 0 && rows[0].F3 && (rows[0].F6 || rows[0].F7)) {
            const workflows = rows.map(row => ({
              workflowId: row.F1 || '',
              type: cleanHtml(row.F3),
              description: cleanHtml(row.F6),
              date: cleanHtml(row.F7),
              statusCode: row.F8 || '',
              subject: cleanHtml(row.F3),
              category: cleanHtml(row.F3),
              status: cleanHtml(row.F6) ? 'در حال بررسی' : 'جاری'
            }));

            if (workflows.length > 0) {
              sendData('workflows', workflows);
              console.log('[Sarvestan] ✅ Workflows captured:', workflows.length);
            }
          }
        }
      }

      // ۵. گزارش برنامه و امتحانات (گزارش ۴۲۸ / ۷۸ در ViewReport)
      // پارس ۷۸ بالاتر انجام شد؛ اینجا فقط لاگ تشخیص ۴۲۸
      if (url.includes('ViewReport') || url.includes('BAS0237')) {
        const bms = String((data.outpar && data.outpar.BMs) || '');
        if (bms.includes('امتحان پايان ترم') || bms.includes('برنامه امتحان')) {
          console.log('[Sarvestan] Exam report (428) detected — structured parse pending');
        }
      }

    } catch (e) {
      // ignore non-JSON or parsing error
    }
  }

  // ── هوک کردن XMLHttpRequest ──
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url) {
    this._sarvUrl = url;
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function() {
    try {
      if (typeof arguments[0] === 'string') this._sarvBody = arguments[0];
    } catch (_) {}
    this.addEventListener('load', function() {
      try {
        if (this._sarvBody) rememberFromText(this._sarvBody);
        if (this._sarvUrl && this.responseText) {
          processResponseData(this._sarvUrl, this.responseText, this._sarvBody);
        }
      } catch(e) {}
    });
    return origSend.apply(this, arguments);
  };

  // ── هوک کردن Fetch ──
  const origFetch = window.fetch;
  window.fetch = function() {
    const url = typeof arguments[0] === 'string' ? arguments[0] : arguments[0]?.url || '';
    let reqBody = '';
    try {
      if (arguments[1] && typeof arguments[1].body === 'string') reqBody = arguments[1].body;
    } catch (_) {}
    return origFetch.apply(this, arguments).then(function(response) {
      if (url.includes('.svc/') || url.includes('/frm/')) {
        try {
          response.clone().text().then(function(text) {
            processResponseData(url, text, reqBody);
          }).catch(function() {});
        } catch(e) {}
      }
      return response;
    });
  };

  // ── موتور فعال سنک خودکار (Active Proactive Fetch) ──
  let hasSynced = false;
  let skipLogAt = 0;
  let userLoggedOut = false; // پس از لاگاوت صریح یا پایان نشست بهستان
  let queueRunning = false; // جلوگیری از اجرای هم‌زمان دو صف سنک
  let lastQueueRunAt = 0;   // آخرین بار که صف کامل فعال سنک اجرا شد

  // کش نشست از ترافیک واقعی (فقط تا زمانی که نشست واقعی باشد)
  const sessionCache = {
    sid: null,
    ticket: null,
    studentId: null,
    userId: null
  };

  function clearSessionCache() {
    sessionCache.sid = null;
    sessionCache.ticket = null;
    sessionCache.studentId = null;
    sessionCache.userId = null;
    console.log('[Sarvestan] sessionCache cleared');
  }

  function getCookie(name) {
    try {
      const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    } catch {
      return null;
    }
  }

  function findStudentInfoInDOM() {
    let std = null;
    let name = null;

    // ۱. بررسی حافظه محلی و سشن
    try {
      std = localStorage.getItem('un') || localStorage.getItem('std') || localStorage.getItem('stdno') || localStorage.getItem('studentId') ||
            sessionStorage.getItem('un') || sessionStorage.getItem('std');
    } catch {}

    // ۲. بررسی کوکی‌ها
    if (!std) {
      std = getCookie('un') || getCookie('std') || getCookie('studentId') || getCookie('stdno');
    }

    // ۳. بررسی فیلدهای ورودی و هیدین فرم‌ها
    if (!std) {
      try {
        const inp = document.querySelector('input[name="un"], input[name="std"], input[name="AUWo"], #Fld_StdNo');
        if (inp && inp.value && /^\d{7,10}$/.test(inp.value.trim())) std = inp.value.trim();
      } catch {}
    }

    // ۴. بررسی المان‌های ساختار یافته با شناسه مشخص
    try {
      const stdEl = document.querySelector('#Fld_StdNo, #lblStdNo, [id*="StdNo"], [id*="StudentNo"]');
      if (stdEl && stdEl.innerText) {
        const m = stdEl.innerText.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).match(/\b\d{7,10}\b/);
        if (m) std = m[0];
      }
      const nameEl = document.querySelector('#Fld_StdName, #lblStdName, #lblUserName, [id*="StdName"], .user-title, .user-name, .header-user');
      if (nameEl && nameEl.innerText) {
        const n = nameEl.innerText.replace(/^(دانشجو|کاربر|نام)\s*[:\-]?\s*/, '').trim();
        if (n && n.length > 2 && !n.includes('ورود')) name = n;
      }
    } catch {}

    // ۵. بررسی متن بدنه صفحه در صورت نبودن المان اختصاصی
    if (!std && document.body) {
      const text = document.body.innerText.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
      const m = text.match(/(?:شماره|کد)\s*(?:دانشجوی[یي]|دانشجو)?\s*[:\-]?\s*([0-9]{7,10})/i) ||
                text.match(/\b(40[0-9]{5,8}|9[5-9][0-9]{5,8})\b/);
      if (m) std = m[1];
    }

    return { studentId: std, studentName: name };
  }

  /** تشخیص جامع و انعطاف‌پذیر نشست فعال بهستان / گلستان برای تمام دانشگاه‌ها */
  function isBehestanSessionAlive() {
    if (userLoggedOut || isManualLogoutLocked()) return false;
    try {
      // الف: توکن مستقیم در حافظه یا کش
      const sid = getSid();
      const ticket = getTicket();
      if (ticket && String(ticket).length > 10 && sid) return true;
      if (sid && sid.length > 8) return true;
      if (sessionCache.sid || sessionCache.ticket) return true;

      // ب: مشخصات دانشجو در DOM، فرم‌ها یا کوکی‌ها
      const info = findStudentInfoInDOM();
      if (info.studentId && info.studentId !== 'ـ') return true;
      if (info.studentName && info.studentName.length > 2) return true;

      // ج: کوکی‌های لاگین موفق
      const cookies = document.cookie || '';
      if (cookies.includes('sid=') || cookies.includes('Ticket=') || cookies.includes('ASP.NET_SessionId=') || cookies.includes('JSESSIONID=')) {
        const isLoginPage = window.location.pathname.toLowerCase().includes('login') &&
                            Boolean(document.querySelector('input[type="password"]'));
        if (!isLoginPage) return true;
      }

      // د: کلمات کلیدی پرتال احرازشده
      const rawText = document.body ? document.body.innerText : '';
      if (rawText && (
        rawText.includes('خروج از سامانه') ||
        rawText.includes('اطلاعات تحصیلی') ||
        rawText.includes('گزارش های آموزش') ||
        rawText.includes('پیشخوان خدمت') ||
        rawText.includes('کارنامه ترمی') ||
        rawText.includes('تاییدیه ثبت نام')
      )) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /** لاگاوت صریح از داشبورد یا خروج از بهستان */
  function markLoggedOut(reason) {
    if (userLoggedOut) return;
    userLoggedOut = true;
    hasSynced = true;
    clearSessionCache();
    try {
      localStorage.setItem('sarvestan_manual_logout', '1');
    } catch (_) {}
    console.log('[Sarvestan] logged out —', reason);
    sendData('session_logout', { reason: reason || 'user' });
  }

  function markLoggedIn() {
    if (!userLoggedOut) return;
    // فقط با ورود دوباره بهستان (نشست زنده) و بدون قفل دستی
    let locked = false;
    try { locked = localStorage.getItem('sarvestan_manual_logout') === '1'; } catch (_) {}
    if (locked) return;
    userLoggedOut = false;
    hasSynced = false;
    console.log('[Sarvestan] re-login detected — sync allowed again');
  }

  function isManualLogoutLocked() {
    try { return localStorage.getItem('sarvestan_manual_logout') === '1'; } catch (_) { return false; }
  }

  function rememberFromText(text) {
    if (!text) return;
    if (userLoggedOut) return; // بعد از خروج چیزی کش نکن
    try {
      const sidM = text.match(/"sid"\s*:\s*"([^"]+)"/);
      if (sidM) sessionCache.sid = sidM[1];
      const tRaw = text.match(/"t"\s*:\s*"(\{[^"]+\})"/);
      if (tRaw) {
        sessionCache.ticket = tRaw[1].replace(/\\"/g, '"');
      } else {
        const t2 = text.match(/"t"\s*:\s*"([0-9a-fA-F-]{20,})"/);
        if (t2) sessionCache.ticket = t2[1];
      }
      const unM = text.match(/"std"\s*:\s*"(\d+)"/) || text.match(/"AUWo"\s*:\s*"(\d+)"/) || text.match(/"un"\s*:\s*"(\d+)"/);
      if (unM) sessionCache.studentId = unM[1];
      const uM = text.match(/"u"\s*:\s*"(\d+)"/) || text.match(/"AVsa"\s*:\s*"(\d+)"/);
      if (uM) sessionCache.userId = uM[1];
    } catch (_) {}
  }

  function getSid() {
    try {
      const ls = localStorage.getItem('sid') || localStorage.getItem('SID') || localStorage.getItem('sessionId');
      if (ls) return ls;
    } catch {}
    try {
      const ss = sessionStorage.getItem('sid') || sessionStorage.getItem('SID');
      if (ss) return ss;
    } catch {}
    const cookieSid = getCookie('sid') || getCookie('SID') || getCookie('sessionId');
    if (cookieSid) return cookieSid;
    try {
      const input = document.querySelector('input[name="sid"], input[name="SID"], input[id="sid"]');
      if (input && input.value) return input.value;
    } catch {}
    if (window.sid || window.SID) return window.sid || window.SID;
    try {
      if (window.top && (window.top.sid || window.top.SID)) return window.top.sid || window.top.SID;
    } catch {}
    if (userLoggedOut || isManualLogoutLocked()) return null;
    return sessionCache.sid || null;
  }

  function getTicket() {
    try {
      const ls = localStorage.getItem('t') || localStorage.getItem('Ticket') || localStorage.getItem('ticket');
      if (ls) return normalizeTicket(ls);
    } catch {}
    try {
      const ss = sessionStorage.getItem('t') || sessionStorage.getItem('Ticket');
      if (ss) return normalizeTicket(ss);
    } catch {}
    const cookieT = getCookie('t') || getCookie('Ticket') || getCookie('ticket');
    if (cookieT) return normalizeTicket(cookieT);
    try {
      const input = document.querySelector('input[name="t"], input[name="Ticket"], input[id="Ticket"]');
      if (input && input.value) return normalizeTicket(input.value);
    } catch {}
    if (window.ticket || window.Ticket) return normalizeTicket(window.ticket || window.Ticket);
    if (userLoggedOut || isManualLogoutLocked()) return null;
    return normalizeTicket(sessionCache.ticket) || null;
  }

  function getStudentId() {
    const info = findStudentInfoInDOM();
    if (info.studentId) return info.studentId;
    if (userLoggedOut || isManualLogoutLocked()) return null;
    if (sessionCache.studentId) return sessionCache.studentId;
    return null;
  }

  function normalizeTicket(t) {
    if (!t) return t;
    const s = String(t).trim();
    if (!s) return t;
    if (s.charAt(0) === '{') return s;
    return JSON.stringify({ Ticket: s, IdleTime: 5 });
  }

  // شنود لاگاوت از contentScript / صفحه
  window.addEventListener('message', (event) => {
    const d = event.data;
    if (!d) return;
    if (d.action === 'SARVESTAN_LOGOUT' || d.action === 'SARVESTAN_USER_LOGOUT') {
      markLoggedOut(d.reason || 'user-logout');
    }
    if (d.action === 'SARVESTAN_UNLOCK') {
      try { localStorage.removeItem('sarvestan_manual_logout'); } catch (_) {}
      userLoggedOut = false;
      hasSynced = false;
      console.log('[Sarvestan] UNLOCK — proactive sync allowed');
      triggerProactiveSync();
    }
    if (d.action === 'SARVESTAN_REFRESH_SCHEDULE') {
      // درخواست سبک: فقط ۷۸
      (async () => {
        const sid = getSid();
        const t = getTicket();
        if (!sid || !t || isManualLogoutLocked()) return;
        const delay = (ms) => new Promise((r) => setTimeout(r, ms));
        for (const termId of ['4042', '4041', '4051']) {
          await delay(300);
          const bmv = '<Root><N id="4" ft="7" fs="0" M="' + termId + '" F="' + termId + '"/></Root>';
          const reqBody = {
            rp: { ft: '1', f: '78', seq: String(800000050 + Math.floor(Math.random() * 100)), subfrm: '0', sid, ct: '', sp: '{"UsrType":"0","TrmType":"2"}', ut: '0' },
            t,
            r: { Ra3: '0', BMu: '<Root/>', BMv: bmv, AFek: '1' },
            act: '08',
            MaxHlp: 200
          };
          try {
            const apiOrigin = window.location.origin || 'https://behestan.kntu.ac.ir';
            const resp = await fetch(`${apiOrigin}/frm/BAS0237_CMP_ViewReport/BAS0237_CMP_ViewReport.svc/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(reqBody)
            });
            const txt = await resp.text();
            processResponseData('BAS0237_CMP_ViewReport', txt, JSON.stringify(reqBody));
          } catch (e) {
            console.warn('[Sarvestan] refresh schedule fail', termId, e);
          }
        }
      })();
    }
  });

  function triggerProactiveSync() {
    if (userLoggedOut || isManualLogoutLocked()) return;
    if (hasSynced) return;
    if (queueRunning) return;

    if (!isBehestanSessionAlive()) {
      // فقط اگر قفل لاگاوت دستی است کش را بسوزان؛ وگرنه کش ترافیک را نگه دار
      if (isManualLogoutLocked() || userLoggedOut) {
        if (sessionCache.sid || sessionCache.ticket) {
          clearSessionCache();
        }
      }
      return;
    }

    markLoggedIn();

    const now = Date.now();
    const sid = getSid() || '1';
    const t = getTicket() || JSON.stringify({ Ticket: '', IdleTime: 5 });
    const studentId = getStudentId();
    const userId = localStorage.getItem('u') || sessionCache.userId;

    // ارسال مشخصات اولیه دانشجو در صورت کشف
    const info = findStudentInfoInDOM();
    if (info.studentId || info.studentName) {
      if (info.studentId && !sessionCache.studentId) sessionCache.studentId = info.studentId;
      sendData('session_info', { studentId: info.studentId, studentName: info.studentName });
      sendData('profile_update', { studentId: info.studentId, fullName: info.studentName, isLoggedIn: true });
    }

    const effectiveStd = studentId || info.studentId || sessionCache.studentId;
    hasSynced = true;
    console.log('[Sarvestan] Starting paced proactive sync, student:', effectiveStd || '(detecting from reports)');

    // ── صف سریالی با تأخیر — مثل UI اصلی بهستان، همزمان نه ──
    const RP_BASE = {
      ft: '0',
      f: '11147',
      seq: '800000001',
      subfrm: '',
      sid: sid,
      ct: '',
      sp: '{"UsrType":"0","TrmType":"2"}',
      loc: 'fa',
      ut: '0'
    };

    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    function postJson(url, body) {
      return fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/plain, */*' },
        body: typeof body === 'string' ? body : JSON.stringify(body)
      }).then((r) => r.text());
    }

    async function navForm(fid, { cmpId = null, fop = null, ft = '0' } = {}) {
      const r = { fid: String(fid), ft: String(ft), subfrm: '' };
      if (cmpId) r.CmpId = cmpId;
      const rp = {
        sp: '{"TrmType":"2","BrnNo":"0","BrnLimit":"0","UsrType":"0"}',
        loc: 'fa',
        ut: '0',
        b: '0',
        sid: sid,
      };
      if (fop) rp.fop = fop;
      try {
        const txt = await postJson(`${window.location.origin}/frm/sys/sys.svc/`, { r, act: 'nav', rp, t });
        return JSON.parse(txt);
      } catch (e) {
        return null;
      }
    }

    async function runQueue() {
      try {
        const apiOrigin = window.location.origin || 'https://behestan.kntu.ac.ir';
        const isAutOrSbu = window.location.hostname.includes('aut.ac.ir') || window.location.hostname.includes('sbu.ac.ir');

        // ۱. فعال‌سازی نشست میزکار بهستان (فرم ۱۱۱۳۰)
        await navForm('11130');
        await delay(250);

        // ۲. گزارش‌های ViewReport با توالی مرورگر:
        // ۸۸ (تأییدیه ثبت‌نام برای شناسایی ترم، مشخصات دانشجو B1/B2 و اساتید)
        // ۷۷ (نتیجه ثبت‌نام برای اسامی قطعی اساتید و واحدها)
        // ۷۸ (برنامه هفتگی برای ساعات و روزهای کلاس)
        // ۴۲۸ (برنامه امتحانات)
        const viewReports = [
          { f: '88', term: null },
          { f: '77', term: '4051' },
          { f: '78', term: '4051' },
          { f: '428', term: '4051' },
          { f: '78', term: '4042' },
          { f: '88', term: '4042' },
          { f: '77', term: '4042' },
          { f: '428', term: '4042' },
        ];

        let seqNum = 800000010;
        for (const job of viewReports) {
          if (userLoggedOut || isManualLogoutLocked()) return;
          await delay(350);

          try {
            await navForm(job.f, { ft: '1' });
            if (isAutOrSbu) {
              await postJson(`${apiOrigin}/frm/BAS0203_CMP_REP_MultiFilter/BAS0203_CMP_REP_MultiFilter.svc/`, {
                rp: { ft: '1', f: String(job.f), seq: String(seqNum++), subfrm: '0', sid, ct: '', sp: '{"UsrType":"0","TrmType":"2"}', ut: '0', c: '110001' },
                t, r: { AFZ6: '0' }, act: '00', MaxHlp: 200
              }).catch(() => {});
              await postJson(`${apiOrigin}/frm/BAS0203_CMP_Sort_REP_FILTER2/BAS0203_CMP_Sort_REP_FILTER2.svc/`, {
                rp: { ft: '1', f: String(job.f), seq: String(seqNum++), subfrm: '0', sid, ct: '', sp: '{"UsrType":"0","TrmType":"2"}', ut: '0', c: '110067' },
                t, r: {}, act: '08', MaxHlp: 200
              }).catch(() => {});
            }

            const bmv = job.term ? '<Root><N id="4" ft="7" fs="0" M="' + job.term + '" F="' + job.term + '"/></Root>' : '<Root/>';
            const reqBody = {
              rp: {
                ft: '1',
                f: job.f,
                seq: String(seqNum++),
                subfrm: '0',
                sid,
                ct: '',
                sp: '{"UsrType":"0","TrmType":"2"}',
                ut: '0',
                c: 110015
              },
              t,
              r: { Ra3: '0', BMu: '<Root/>', BMv: bmv, AFek: '1' },
              act: '08',
              MaxHlp: 200
            };
            const txt = await postJson(`${apiOrigin}/frm/BAS0237_CMP_ViewReport/BAS0237_CMP_ViewReport.svc/`, reqBody);
            processResponseData('BAS0237_CMP_ViewReport', txt, JSON.stringify(reqBody));
          } catch (err) {
            console.warn('[Sarvestan] ViewReport fail', job.f, err);
          }
        }

        // ۳. فرم‌های جامع دانشجو، کارنامه، نمرات و مشخصات
        const activeStd = sessionCache.studentId || effectiveStd || getStudentId();
        if (activeStd) {
          // الف) جامع دانشجو (F1825: کارنامه، معدل، نمرات و مالی) با توالی کامل مرورگر
          await delay(350);
          try {
            await navForm('11147');
            await postJson(`${apiOrigin}/frm/F1825_PROCESS_STDTOTALINFO_BEH/F1825_PROCESS_STDTOTALINFO_BEH.svc/`, {
              r: { ATxW: activeStd },
              act: 'RR',
              rp: { ...RP_BASE, seq: String(seqNum++), c: '110379' },
              t
            }).catch(() => {});

            const txt1 = await postJson(`${apiOrigin}/frm/F1825_PROCESS_STDTOTALINFOTrmStat_BEH/F1825_PROCESS_STDTOTALINFOTrmStat_BEH.svc/`, {
              r: { AUWo: activeStd },
              act: '20',
              rp: { ...RP_BASE, seq: String(seqNum++), c: '110381' },
              t
            });
            processResponseData('STDTOTALINFOTrmStat', txt1);
          } catch (err) {
            console.warn('[Sarvestan] F1825 fail', err);
          }

          // ب) عکس پرسنلی (F1809)
          await delay(350);
          try {
            await navForm('11141');
            const txt2 = await postJson(`${apiOrigin}/frm/F1809_PROCESS_STD_Personally_BH/F1809_PROCESS_STD_Personally_BH.svc/`, {
              r: { AUWs: activeStd },
              act: '08',
              rp: { ...RP_BASE, f: '11141', seq: String(seqNum++), c: '110383' },
              t
            });
            processResponseData('STD_Personally', txt2);
          } catch (err) {
            console.warn('[Sarvestan] F1809 fail', err);
          }

          // ج) خلاصه وضعیت دروس و چارت (F1814)
          await delay(350);
          try {
            await navForm('11126');
            const txt3 = await postJson(`${apiOrigin}/frm/F1814_PROCESS_STDAllCrs/F1814_PROCESS_STDAllCrs.svc/`, {
              r: { AUWo: activeStd, BrnNo: '0', CurStatus: '1' },
              act: '08',
              rp: { ...RP_BASE, f: '11126', seq: String(seqNum++) },
              t
            });
            processResponseData('F1814_PROCESS_STDAllCrs', txt3);
          } catch (err) {
            console.warn('[Sarvestan] F1814 fail', err);
          }
        }

        // ۴. پیشخوان خدمت و نامه‌ها (F6524)
        if (userId) {
          await delay(300);
          try {
            const txtWf = await postJson(`${apiOrigin}/frm/F6524_PROCESS_DASHBOARD_BEH/F6524_PROCESS_DASHBOARD_BEH.svc/`, {
              r: { AVsa: userId, AVsl: '1', AVsm: '0', AW4r: '5', AW4s: '', AvD9: '', AxI9: '{}' },
              act: '24',
              rp: { ...RP_BASE, f: '21122', seq: String(seqNum++) },
              t
            });
            processResponseData('DASHBOARD_BEH', txtWf);
          } catch (err) {
            console.warn('[Sarvestan] F6524 fail', err);
          }
        }
        console.log('[Sarvestan] clean proactive sync finished successfully');
      } catch (err) {
        console.warn('[Sarvestan] sync error', err);
      }
    }

    queueRunning = true;
    lastQueueRunAt = Date.now();
    runQueue().catch(() => {}).finally(() => {
      queueRunning = false;
    });
  }

  // تلاش برای همگام‌سازی سریع و مجدد
  setTimeout(triggerProactiveSync, 1500);
  setTimeout(triggerProactiveSync, 5000);
  setTimeout(triggerProactiveSync, 12000);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(triggerProactiveSync, 1000));
  }

  // خودهال‌سازی (self-heal): هر ۶۰ ثانیه—if نشست زنده و صف بیکار است و آخرین سنک
  // کامل بیش از ۵ دقیقه پیش بوده، یک سنک کامل آرام دیگر اجرا کن.
  // این باعث می‌شود اگر سنک اولیه قبل از آماده‌شدن کامل نشست ناقص مانده باشد،
  // به‌محض بازگشت به تب سامانه، داده‌ها خودکار کامل شوند.
  setInterval(() => {
    if (userLoggedOut) return;
    if (!isBehestanSessionAlive()) {
      if (sessionCache.sid) {
        clearSessionCache();
        sendData('session_logout', { reason: 'behestan-session-ended' });
      }
      return;
    }
    if (queueRunning) return;
    if (Date.now() - lastQueueRunAt < 300000) return;
    console.log('[Sarvestan] self-heal — re-running paced sync (interval)');
    hasSynced = false;
    triggerProactiveSync();
  }, 60000);

  // اگر کاربر به تب سامانه برمی‌گردد، بررسی کن آیا سنک تازه لازم است
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (userLoggedOut || isManualLogoutLocked()) return;
    if (!isBehestanSessionAlive()) return;
    if (queueRunning) return;
    if (Date.now() - lastQueueRunAt < 60000) return;
    console.log('[Sarvestan] tab visible — re-running paced sync');
    hasSynced = false;
    triggerProactiveSync();
  });

  // API اجباری برای داشبورد (ریست + سنک دوباره) — فقط اگر نشست زنده باشد
  window.__SARVESTAN_FORCE_SYNC__ = function() {
    if (userLoggedOut) {
      console.log('[Sarvestan] FORCE_SYNC ignored — user logged out');
      return false;
    }
    if (!isBehestanSessionAlive()) {
      console.log('[Sarvestan] FORCE_SYNC skipped — no live Behestan session');
      return false;
    }
    hasSynced = false;
    console.log('[Sarvestan] FORCE_SYNC requested');
    triggerProactiveSync();
    return true;
  };

  // از contentScript (ISOLATED) با postMessage
  window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'SARVESTAN_FORCE_SYNC_CMD') {
      window.__SARVESTAN_FORCE_SYNC__();
    }
  });

})();
