import {
  KNTU_IE_CURRICULUM,
  KNTU_CE_CURRICULUM,
  resolveCurriculumForMajor,
} from '../data/curriculumData.js';
import { getPrereqInfo, UNIVERSAL_PREREQ_DB } from '../data/prereqDatabase.js';
import { getEquivalentCodes, areCoursesEquivalent } from '../data/equivalenceDatabase.js';
import { toFaDigits, toPersianCourseName } from '../utils/faDigits.js';
import { isProjectCourse, isInternshipCourse } from './behestan/parsers.js';

/**
 * نرمال‌سازی نام دروس جهت تطابق دقیق و بدون خطا بین نام‌های رسمی و گزارش‌های مختلف
 */
export function normName(name) {
  return String(name || '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[يی]/g, 'ی')
    .replace(/[كک]/g, 'ک')
    .replace(/[\u200c\s]+/g, ' ')
    .trim();
}

/**
 * پاکسازی موجودیت‌های HTML (مانند &#x09;، تب، فاصله‌های نامتعارف) و یکسان‌سازی حروف فارسی
 */
export function cleanPrereqText(str) {
  return String(str || '')
    .replace(/&#x09;|&amp;|&lt;|&gt;|[\t\r\n]/g, ' ')
    .replace(/[يی]/g, 'ی')
    .replace(/[كک]/g, 'ک')
    .replace(/[\u200c\s]+/g, ' ')
    .trim();
}

/**
 * کلید موضوع درس جهت یکتاسازی دروس معادل و حذف موارد تکراری در پیش‌درآمدها
 */
export function normSubjectKey(name) {
  return cleanPrereqText(name)
    .replace(/[۰-۹0-9]/g, '')
    .replace(/\s*(مهندسی|عمومی|پیشرفته|۱|۲|۳|1|2|3)\s*$/g, '')
    .trim();
}

/**
 * تشخیص کاملاً پویا و بدون هاردکد سقف واحدهای فارغ‌التحصیلی
 * پشتیبانی از تمامی رشته‌های دانشگاه صنعتی خواجه نصیر و تمامی مقاطع (کارشناسی، ارشد، دکتری)
 */
export function resolveTotalDegreeCredits(
  profile = {},
  curriculumStats = null,
  passedAndEnrolled = 0,
  knownCategoryTotal = 0,
  curriculumReport = null,
) {
  // ۱. اولویت اول: مقدار رسمی اعلام‌شده توسط بهستان در گزارش ۲۸۴
  let repReq = Number(curriculumReport?.totalUnitsRequired) || 0;
  if (repReq > 200) {
    const saneM = String(repReq).match(/^(1[3-5]\d)/);
    repReq = saneM ? Number(saneM[1]) : 140;
  }
  if (repReq >= 25 && repReq <= 165) return Math.max(repReq, passedAndEnrolled);

  // ۲. اولویت دوم: مقدار اعلام‌شده در پروفایل دانشجو
  let profileReq = Number(profile?.totalUnitsRequired) || 0;
  if (profileReq > 200) {
    const saneM = String(profileReq).match(/^(1[3-5]\d)/);
    profileReq = saneM ? Number(saneM[1]) : 140;
  }
  if (profileReq >= 25 && profileReq <= 165) return Math.max(profileReq, passedAndEnrolled);

  // ۳. اولویت سوم: مجموع سرفصل‌های F1814 اگر نشان‌دهنده کل برنامه آموزشی باشد
  const statsTotal = (curriculumStats?.byType || []).reduce(
    (s, x) => s + (Number(x.units) || parseFloat(x.units) || 0),
    0,
  );
  if (statsTotal > 0 && statsTotal >= passedAndEnrolled && statsTotal <= 165) {
    return statsTotal;
  }

  // ۴. اولویت چهارم: تشخیص هوشمند بر اساس رشته و مقطع تحصیلی در اطلاعات بهستان
  const level = String(profile?.level || '').trim();
  const major = String(profile?.major || '').trim();

  let standardCredits = 140; // پایه عمومی دوره کارشناسی
  if (/ارشد|کارشناسی\s*ارشد|master/i.test(level)) {
    standardCredits = 32;
  } else if (/دکتری|phd|doctor/i.test(level)) {
    standardCredits = 36;
  } else if (/صنایع|صنايع|مکانیک|مكانيك/i.test(major)) {
    standardCredits = 142; // مهندسی صنایع و مهندسی مکانیک
  } else if (/برق|عمران|کامپیوتر|كامپيوتر|نرم\s*افزار|computer|هوافضا|مواد|نقشه|ژئوماتیک|شیمی|شيمي|فیزیک|فيزيك|ریاضی|رياضي/i.test(major)) {
    standardCredits = 140;
  }

  const safeCategoryTotal = knownCategoryTotal > 200 ? standardCredits : knownCategoryTotal;
  const result = Math.max(standardCredits, passedAndEnrolled, safeCategoryTotal);
  if (result > 200) {
    const saneM = String(result).match(/^(1[3-5]\d)/);
    return saneM ? Number(saneM[1]) : standardCredits;
  }
  return result;
}

/**
 * رنگ‌بندی تمیز و شکیل بر اساس نوع درس
 */
export const CATEGORY_COLORS = {
  پایه: 'primary',
  'دروس پایه': 'primary',
  'اصلی': 'accent',
  'دروس اصلی': 'accent',
  'تخصصی': 'accent',
  'تخصصی الزامی': 'accent',
  'دروس تخصصی الزامی': 'accent',
  'دروس اصلی و تخصصی الزامی': 'accent',
  عمومی: 'info',
  'دروس عمومی': 'info',
  مهارتی: 'warning',
  'دروس مهارتی': 'warning',
  'دروس مهارتی و اشتغال‌پذیری': 'warning',
  'تخصصی انتخابی': 'secondary',
  'دروس تخصصی انتخابی': 'secondary',
  'اختیاری': 'secondary',
  'دروس اختیاری': 'secondary',
  سایر: 'neutral',
  'سایر دروس': 'neutral',
};

export function getCategoryColor(catName = '') {
  const norm = String(catName || '').trim();
  for (const [k, v] of Object.entries(CATEGORY_COLORS)) {
    if (norm === k || norm.includes(k)) return v;
  }
  return 'primary';
}

/**
 * جدول جامع معادل‌سازی دروس در چارچوب برنامه‌های درسی دانشگاه
 * هر سطر گروهی از دروس معادل با نام‌ها و کدهای گوناگون است.
 */
export const EQUIVALENCE_GROUPS = [
  // اقتصاد
  ['اقتصاد خرد', 'اقتصاد عمومی ۱', 'اقتصاد عمومی 1', 'اقتصادعمومی ۱', 'اقتصادعمومی 1', 'اقتصاد عمومی', 'اقتصاد خرد و کلان'],
  ['اقتصاد کلان', 'اقتصاد عمومی ۲', 'اقتصاد عمومی 2', 'اقتصادعمومی ۲', 'اقتصادعمومی 2'],
  // ریاضیات
  ['ریاضی عمومی ۱', 'ریاضی عمومی 1', 'ریاضیات ۱', 'ریاضیات 1', 'ریاضی ۱', 'ریاضی 1', 'حساب دیفرانسیل ۱'],
  ['ریاضی عمومی ۲', 'ریاضی عمومی 2', 'ریاضیات ۲', 'ریاضیات 2', 'ریاضی ۲', 'ریاضی 2', 'حساب دیفرانسیل ۲'],
  ['معادلات دیفرانسیل', 'معادلات ديفرانسيل'],
  ['جبر خطی', 'جبرخطي', 'جبر خطی کاربردی'],
  // فیزیک
  ['فیزیک ۱', 'فیزیک 1', 'فیزیک عمومی ۱', 'فیزیک عمومی 1', 'فيزيك 1', 'فيزيك ۱'],
  ['فیزیک ۲', 'فیزیک 2', 'فیزیک عمومی ۲', 'فیزیک عمومی 2', 'فيزيك 2', 'فيزيك ۲'],
  ['آزمایشگاه فیزیک ۱', 'آز فیزیک ۱', 'آزفیزیک ۱', 'آزفيزيك 1'],
  ['آزمایشگاه فیزیک ۲', 'آز فیزیک ۲', 'آزفیزیک ۲', 'آزفيزيك 2'],
  // کامپیوتر و محاسبات
  ['محاسبات عددی', 'محاسبات عددي', 'کاربست کامپیوتر در محاسبات عددی', 'كاربست كامپيوتر در محاسبات عددي', 'روشهای محاسبات عددی'],
  ['برنامه نویسی کامپیوتر', 'برنامه نويسي كامپيوتر', 'مبانی کامپیوتر و برنامه نویسی', 'مبانی برنامه سازی', 'مبانی برنامه نویسی'],
  // آمار و احتمال
  ['نظریه احتمال و کاربردها', 'نظريه احتمال و كاربردها', 'تئوری احتمالات و کاربرد آن', 'تئوري احتمالات وكاربردآن', 'احتمال و کاربردها', 'آمار و احتمال مهندسی', 'آمار مهندسی', 'آمارمهندسي'],
  // صنایع و مکانیک
  ['طراحی و نقشه کشی مهندسی', 'طراحي و نقشه كشي مهندسي', 'نقشه کشی صنعتی', 'نقشه كشي صنعتي', 'نقشه کشی صنعتی ۱', 'نقشه كشي صنعتي1'],
  ['استاتیک و مقاومت مصالح', 'استاتیک ومقاومت مصالح', 'استاتیک', 'مقاومت مصالح'],
  // دروس معارف و عمومی
  ['معارف اسلامی ۱', 'معارف اسلامی 1', 'معارف اسلامي 1', 'اندیشه اسلامی ۱', 'اندیشه اسلامی 1'],
  ['معارف اسلامی ۲', 'معارف اسلامی 2', 'معارف اسلامي 2', 'اندیشه اسلامی ۲', 'اندیشه اسلامی 2'],
  ['اخلاق اسلامی', 'اخلاق وتربيت اسلامي', 'آیین زندگی', 'آیین زندگی و اخلاق کاربردی'],
  ['تربیت بدنی', 'تربیت بدنی ۱', 'تربيت بدني 1', 'تربیت بدنی 1'],
  ['ورزش ۱', 'ورزش 1', 'تربیت بدنی ۲', 'تربيت بدني 2', 'تربیت بدنی 2'],
];

const EQUIV_MAP = new Map();
for (const group of EQUIVALENCE_GROUPS) {
  const normGroup = group.map(normName);
  for (const n of normGroup) {
    if (!EQUIV_MAP.has(n)) EQUIV_MAP.set(n, new Set());
    const s = EQUIV_MAP.get(n);
    normGroup.forEach((x) => s.add(x));
  }
}

export function getEquivalentNames(name) {
  const norm = normName(name);
  const s = EQUIV_MAP.get(norm);
  if (s) return [...s];
  return [norm];
}

/**
 * ساخت وضعیت جامع چارت تحصیلی برای هر دانشجو از هر رشته بدون هیچ‌گونه هاردکد
 */
export function buildCurriculumState(
  userCourses = [],
  profile = {},
  curriculumStats = null,
  curriculumReport = null,
) {
  const majorName = profile?.major || '';
  const facultyName = profile?.faculty || '';

  // ۱. انتخاب چارت متناسب با رشته یا تولید پویا از گزارش ۲۸۴
  let curriculum = resolveCurriculumForMajor(majorName || facultyName, userCourses);

  // اگر سرفصل‌های رسمی ۲۸۴ در بهستان موجود است، از آنها به عنوان اولویت اول برای تمام دانشجویان استفاده شود
  if (curriculumReport?.categories?.length > 0) {
    const dynamicCourses = [];
    const dynamicCategories = [];

    curriculumReport.categories.forEach((cat, catIdx) => {
      const catTitle = toPersianCourseName(cat.title);
      const catColor = getCategoryColor(catTitle);
      dynamicCategories.push({
        id: `cat_${catIdx}`,
        title: catTitle,
        minUnits: cat.minUnits || 0,
        color: catColor,
      });

      (cat.courses || []).forEach((c, cIdx) => {
        let termNum = 1;
        if (/پایه/i.test(catTitle)) termNum = (cIdx % 3) + 1;
        else if (/عمومی/i.test(catTitle)) termNum = (cIdx % 4) + 1;
        else if (/تخصصی/i.test(catTitle)) termNum = (cIdx % 6) + 3;
        else if (/اختیاری/i.test(catTitle)) termNum = 7;
        else termNum = Math.min(8, Math.floor(cIdx / 5) + 1);

        dynamicCourses.push({
          code: c.code,
          name: toPersianCourseName(c.name),
          units: Number(c.units) || 2,
          term: termNum,
          category: catTitle,
          color: catColor,
          prerequisites: [],
          corequisites: [],
          unlocks: [],
        });
      });
    });

    if (dynamicCourses.length > 0) {
      curriculum = {
        degreeTitle: profile.major ? toPersianCourseName(`${profile.major} — کارشناسی پیوسته`) : 'چارت تحصیلی مصوب دانشگاه',
        faculty: toPersianCourseName(profile.faculty || 'دانشگاه صنعتی خواجه نصیرالدین طوسی'),
        university: 'دانشگاه صنعتی خواجه نصیرالدین طوسی',
        defaultRequiredCredits: (() => {
          let req = Number(curriculumReport.totalUnitsRequired) || 140;
          if (req > 200) {
            const m = String(req).match(/^(1[3-5]\d)/);
            return m ? Number(m[1]) : 140;
          }
          return req;
        })(),
        courses: dynamicCourses,
        categories: dynamicCategories,
      };
    }
  }

  // ۲. یکتاسازی و پاکسازی سوابق درسی دانشجو (بدون تکرار)
  const passedMap = new Map(); // code -> course
  const enrolledMap = new Map(); // code -> course
  const passedNameSet = new Set();
  const enrolledNameSet = new Set();
  const termsSeen = new Set();

  const cleanUserCourses = [];
  const seenUserKeys = new Map(); // key -> record

  for (const c of userCourses || []) {
    if (!c) continue;
    const code = c.code ? String(c.code).trim() : null;
    const rawName = c.name || c.title || '';
    const name = normName(rawName);
    const key = code || name;
    if (!key) continue;

    const st = String(c.status || '').toLowerCase();
    const regSt = String(c.regStatus || '').toLowerCase();
    const gm = String(c.gradeMode || '').toLowerCase();
    const allSt = st + ' ' + regSt + ' ' + gm;

    // نادیده گرفتن دروس حذف یا انتظار
    if (allSt.includes('حذف') || allSt.includes('dropped') || allSt.includes('انتظار') || allSt.includes('waitlist')) {
      continue;
    }

    if (c.termId) termsSeen.add(String(c.termId));

    const numGrade = parseFloat(String(c.grade || '').replace(/[^\d.]/g, ''));
    const isPassedGrade = Number.isFinite(numGrade) ? numGrade >= 10 : false;
    const isPassed = /قبول|pass/i.test(st) || isPassedGrade;

    // تشخیص دقیق و جامع دروس در حال اخذ ترم جاری
    const isEnrolled =
      !isPassed &&
      (regSt === 'registered' ||
        /enrolled|جاری|ثبت|در\s*حال/i.test(st) ||
        /enrolled|جاری|ثبت|در\s*حال/i.test(regSt) ||
        Boolean(c.isRegistration) ||
        Boolean(c.onSchedule) ||
        (!c.grade && (c.termId === '4051' || String(c.termId || '').endsWith('1') || String(c.termId || '').endsWith('2'))));

    const record = {
      ...c,
      code,
      name: toPersianCourseName(rawName),
      normalizedName: name,
      gradeDisplay: Number.isFinite(numGrade)
        ? toFaDigits(numGrade.toFixed(2))
        : c.grade && c.grade !== 'ـ' && c.grade !== '-'
          ? toFaDigits(c.grade)
          : isPassed
            ? 'قبول'
            : isEnrolled
              ? 'در حال اخذ'
              : null,
      termTaken: c.termId || c.term || '',
      isPassed,
      isEnrolled,
    };

    if (seenUserKeys.has(key)) {
      const prev = seenUserKeys.get(key);
      if (!prev.isPassed && record.isPassed) {
        seenUserKeys.set(key, record);
      } else if (!prev.isPassed && !prev.isEnrolled && record.isEnrolled) {
        seenUserKeys.set(key, record);
      }
    } else {
      seenUserKeys.set(key, record);
    }
  }

  for (const record of seenUserKeys.values()) {
    cleanUserCourses.push(record);
    const code = record.code;
    const name = record.normalizedName;
    const eqCodes = code ? getEquivalentCodes(code) : [];

    if (record.isPassed) {
      if (code) {
        passedMap.set(code, record);
        for (const eq of eqCodes) {
          if (!passedMap.has(eq)) passedMap.set(eq, record);
        }
      }
      passedNameSet.add(name);
      for (const eq of getEquivalentNames(name)) {
        passedNameSet.add(eq);
      }
    } else if (record.isEnrolled) {
      if (code) {
        enrolledMap.set(code, record);
        for (const eq of eqCodes) {
          if (!enrolledMap.has(eq)) enrolledMap.set(eq, record);
        }
      }
      enrolledNameSet.add(name);
      for (const eq of getEquivalentNames(name)) {
        enrolledNameSet.add(eq);
      }
    }
  }

  // تابع بررسی پاس شدن پیش‌نیاز با احتساب معادل‌ها و متون استثنا
  const isPrereqPassed = (prereq) => {
    if (!prereq) return true;
    const rawName = prereq.name || '';
    if (
      !rawName ||
      rawName === 'ـ' ||
      rawName === '-' ||
      rawName.includes('فاقد پيش نياز') ||
      rawName.includes('فاقد پیش نیاز')
    ) {
      return true;
    }

    const pCode = prereq.code ? String(prereq.code).trim() : null;
    const pName = normName(rawName);

    // ۱. بررسی کد مستقیم و کدهای معادل
    if (pCode) {
      if (passedMap.has(pCode)) return true;
      const eqCodes = getEquivalentCodes(pCode);
      for (const eq of eqCodes) {
        if (passedMap.has(eq)) return true;
      }
    }

    // ۲. بررسی نام مستقیم
    if (pName && passedNameSet.has(pName)) return true;

    // ۳. بررسی معادل‌های نام درس
    const equivs = getEquivalentNames(pName);
    for (const eq of equivs) {
      if (passedNameSet.has(eq)) return true;
    }

    return false;
  };

  // ۳. یکتاسازی دروس معادل در چارت مصوب دانشگاه و جلوگیری از نمایش دروس معادلِ تکراری
  const rawMaster = curriculum?.courses || [];
  const masterCourses = [];
  const droppedMasterCodes = new Set();

  for (let i = 0; i < rawMaster.length; i++) {
    const mcA = rawMaster[i];
    const codeA = mcA.code ? String(mcA.code).trim() : null;
    if (codeA && droppedMasterCodes.has(codeA)) continue;

    let duplicateIndex = -1;
    for (let j = i + 1; j < rawMaster.length; j++) {
      const mcB = rawMaster[j];
      const codeB = mcB.code ? String(mcB.code).trim() : null;
      if (codeB && droppedMasterCodes.has(codeB)) continue;

      const isEq =
        (codeA && codeB && areCoursesEquivalent(codeA, codeB)) ||
        normName(mcA.name) === normName(mcB.name) ||
        Boolean(EQUIV_MAP.get(normName(mcA.name))?.has(normName(mcB.name)));

      if (isEq) {
        duplicateIndex = j;
        break;
      }
    }

    if (duplicateIndex >= 0) {
      const mcB = rawMaster[duplicateIndex];
      const codeB = mcB.code ? String(mcB.code).trim() : null;

      const userTookA = (codeA && (passedMap.has(codeA) || enrolledMap.has(codeA))) || passedNameSet.has(normName(mcA.name)) || enrolledNameSet.has(normName(mcA.name));
      const userTookB = (codeB && (passedMap.has(codeB) || enrolledMap.has(codeB))) || passedNameSet.has(normName(mcB.name)) || enrolledNameSet.has(normName(mcB.name));

      let keepCourse = mcA;
      let dropCourse = mcB;

      if (!userTookA && userTookB) {
        keepCourse = mcB;
        dropCourse = mcA;
      } else if (!userTookA && !userTookB) {
        if (codeB && codeA && codeB > codeA) {
          keepCourse = mcB;
          dropCourse = mcA;
        }
      }

      // ادغام دروس بازگشایی‌شونده تا گراف پیش‌نیاز ناقص نشود
      const mergedUnlocks = [...(keepCourse.unlocks || [])];
      for (const u of dropCourse.unlocks || []) {
        if (!mergedUnlocks.some((x) => (x.code && x.code === u.code) || normName(x.name) === normName(u.name))) {
          mergedUnlocks.push(u);
        }
      }
      keepCourse.unlocks = mergedUnlocks;

      if (dropCourse.code) droppedMasterCodes.add(String(dropCourse.code).trim());
      if (keepCourse === mcB) {
        continue;
      }
    }

    masterCourses.push(mcA);
  }

  const matchedUserKeys = new Set();
  const consumedUserKeys = new Set();

  const evaluatedMaster = masterCourses.map((mc) => {
    const code = mc.code ? String(mc.code).trim() : null;
    const norm = normName(mc.name);
    const equivs = getEquivalentNames(norm);
    const eqCodes = code ? getEquivalentCodes(code) : [];

    // پیش‌نیازها و هم‌نیازهای سراسری از دیتابیس خواجه نصیر
    const dbInfo = getPrereqInfo(code, mc.name);
    const prereqs = (mc.prerequisites && mc.prerequisites.length > 0)
      ? mc.prerequisites
      : dbInfo.prereqs || [];
    const coreqs = (mc.corequisites && mc.corequisites.length > 0)
      ? mc.corequisites
      : dbInfo.coreqs || [];
    const unlocks = (mc.unlocks && mc.unlocks.length > 0)
      ? mc.unlocks
      : dbInfo.unlocks || [];

    // یافتن سابقهٔ دانشجو با جلوگیری از مصرف چندباره یک سابقه تحصیلی
    let matchedUserCourse = null;
    if (code && !consumedUserKeys.has(code)) {
      if (passedMap.has(code)) matchedUserCourse = passedMap.get(code);
      else if (enrolledMap.has(code)) matchedUserCourse = enrolledMap.get(code);
    }
    if (!matchedUserCourse) {
      for (const eq of eqCodes) {
        if (consumedUserKeys.has(eq)) continue;
        if (passedMap.has(eq)) { matchedUserCourse = passedMap.get(eq); break; }
        if (enrolledMap.has(eq)) { matchedUserCourse = enrolledMap.get(eq); break; }
      }
    }
    if (!matchedUserCourse) {
      const candidate = cleanUserCourses.find((x) => {
        const uKey = x.code || x.normalizedName;
        if (consumedUserKeys.has(uKey)) return false;
        return x.normalizedName === norm || equivs.includes(x.normalizedName);
      });
      if (candidate) matchedUserCourse = candidate;
    }

    if (matchedUserCourse) {
      const uKey = matchedUserCourse.code || matchedUserCourse.normalizedName;
      if (uKey) consumedUserKeys.add(uKey);
      if (matchedUserCourse.code) matchedUserKeys.add(matchedUserCourse.code);
      if (matchedUserCourse.normalizedName) matchedUserKeys.add(matchedUserCourse.normalizedName);
      if (code) matchedUserKeys.add(code);
      matchedUserKeys.add(norm);
      eqCodes.forEach((eq) => matchedUserKeys.add(eq));
      equivs.forEach((eq) => matchedUserKeys.add(eq));
    }

    let status = 'locked';
    let gradeDisplay = null;
    let termTaken = null;

    if (matchedUserCourse?.isPassed) {
      status = 'passed';
      gradeDisplay = matchedUserCourse.gradeDisplay;
      termTaken = matchedUserCourse.termTaken;
    } else if (matchedUserCourse?.isEnrolled) {
      status = 'enrolled';
      gradeDisplay = matchedUserCourse.gradeDisplay || 'در حال اخذ';
      termTaken = matchedUserCourse.termTaken;
    } else {
      // بررسی پیش‌نیازها برای تعیین وضعیت مجاز به اخذ
      const missingPrereqs = prereqs.filter((p) => !isPrereqPassed(p));
      if (missingPrereqs.length === 0) {
        status = 'available'; // مجاز به اخذ در ترم بعد ⭐
      } else {
        status = 'locked'; // قفل به دلیل پیش‌نیاز 🔒
      }
    }

    const missingPrereqs =
      status === 'locked' ? prereqs.filter((p) => !isPrereqPassed(p)) : [];

    return {
      ...mc,
      name: toPersianCourseName(mc.name),
      units: Number(matchedUserCourse?.units) || Number(mc.units) || (isProjectCourse(mc.name) ? 3 : isInternshipCourse(mc.name) ? 2 : 2),
      category: toPersianCourseName(mc.category || 'تخصصی الزامی'),
      status,
      gradeDisplay,
      termTaken,
      prerequisites: prereqs.map((p) => ({
        ...p,
        name: toPersianCourseName(cleanPrereqText(p.name)),
        isPassed: isPrereqPassed(p),
      })),
      corequisites: coreqs.map((c) => ({
        ...c,
        name: toPersianCourseName(cleanPrereqText(c.name)),
      })),
      unlocks: unlocks.map((u) => ({
        ...u,
        name: toPersianCourseName(cleanPrereqText(u.name)),
      })),
      missingPrereqs: missingPrereqs.map((p) => ({
        ...p,
        name: toPersianCourseName(cleanPrereqText(p.name)),
      })),
    };
  });

  // ۴. افزودن دروسی که دانشجو گذرانده اما در چارت مرجع نبوده (دروس مازاد/انتقالی/تطبیقی/مهارتی)
  const masterCodes = new Set(evaluatedMaster.map((c) => c.code));
  const masterNames = new Set(evaluatedMaster.map((c) => normName(c.name)));

  const extraCourses = [];
  const addedExtraKeys = new Set();

  cleanUserCourses.forEach((c) => {
    if (!c) return;
    const code = c.code ? String(c.code).trim() : null;
    const norm = normName(c.name || c.title || '');
    const eqCodes = code ? getEquivalentCodes(code) : [];
    const equivs = getEquivalentNames(norm);

    // اگر قبلاً در چارت مصوب نگاشت شده، دیگر اضافه نشود
    if (code && (masterCodes.has(code) || matchedUserKeys.has(code))) return;
    if (masterNames.has(norm) || matchedUserKeys.has(norm)) return;
    if (eqCodes.some((eq) => masterCodes.has(eq) || matchedUserKeys.has(eq))) return;
    if (equivs.some((eq) => masterNames.has(eq) || matchedUserKeys.has(eq))) return;
    if (addedExtraKeys.has(code || norm)) return;

    addedExtraKeys.add(code || norm);

    const dbInfo = getPrereqInfo(code, c.name);

    // تعیین هوشمند ترم بر اساس ترم اخذ واقعی دانشجو
    let assignedTerm = 8;
    if (c.termTaken) {
      const tStr = String(c.termTaken).trim();
      if (tStr === '4041') assignedTerm = 1;
      else if (tStr === '4042') assignedTerm = 2;
      else if (tStr === '4051') assignedTerm = 3;
      else if (tStr === '4052') assignedTerm = 4;
      else if (tStr === '4061') assignedTerm = 5;
      else if (tStr === '4062') assignedTerm = 6;
      else if (tStr === '4071') assignedTerm = 7;
      else if (tStr === '4072') assignedTerm = 8;
      else if (/^[1-8]$/.test(tStr)) assignedTerm = parseInt(tStr, 10);
    }

    extraCourses.push({
      code: code || `ext_${norm}`,
      name: toPersianCourseName(c.name || 'درس اختیاری/عمومی'),
      units: Number(c.units) || (isProjectCourse(c.name) ? 3 : isInternshipCourse(c.name) ? 2 : 2),
      category: toPersianCourseName(c.type || 'سایر دروس'),
      term: assignedTerm,
      status: c.isPassed ? 'passed' : c.isEnrolled ? 'enrolled' : 'available',
      gradeDisplay: c.gradeDisplay || (c.isPassed ? 'قبول' : c.isEnrolled ? 'در حال اخذ' : null),
      termTaken: c.termTaken || '',
      prerequisites: (dbInfo.prereqs || []).map((p) => ({ ...p, name: toPersianCourseName(cleanPrereqText(p.name)) })),
      corequisites: (dbInfo.coreqs || []).map((c) => ({ ...c, name: toPersianCourseName(cleanPrereqText(c.name)) })),
      unlocks: (dbInfo.unlocks || []).map((u) => ({ ...u, name: toPersianCourseName(cleanPrereqText(u.name)) })),
      missingPrereqs: [],
    });
  });

  const allCourses = [...evaluatedMaster, ...extraCourses];

  // ۵. پالایش و یکتاسازی هوشمند دروس پیش‌درآمد و زنجیره‌ای (Unlocks) برای تک‌تک دروس
  allCourses.forEach((course) => {
    const cCode = course.code ? String(course.code).trim() : null;
    const cNorm = normName(course.name);
    const cEquivs = getEquivalentNames(cNorm);
    const cEqCodes = cCode ? getEquivalentCodes(cCode) : [];

    const chartUnlocks = [];
    const seenSubjectKeys = new Set();
    const seenUnlockCodes = new Set();

    // ۱. استخراج دروسی در چارت و برنامه آموزشی دانشجو که به این درس وابسته‌اند
    allCourses.forEach((other) => {
      if (other === course) return;
      const isDependent =
        (other.prerequisites || []).some((p) => {
          const pCode = p.code ? String(p.code).trim() : null;
          const pNorm = normName(p.name);
          return (
            (cCode && pCode && (cCode === pCode || cEqCodes.includes(pCode))) ||
            pNorm === cNorm ||
            cEquivs.includes(pNorm) ||
            (cNorm.length > 5 && pNorm.includes(cNorm))
          );
        }) ||
        (course.unlocks || []).some((u) => {
          const uCode = u.code ? String(u.code).trim() : null;
          const uNorm = normName(u.name);
          const oCode = other.code ? String(other.code).trim() : null;
          const oNorm = normName(other.name);
          return (
            (uCode && oCode && uCode === oCode) ||
            (uNorm && oNorm && (uNorm === oNorm || oNorm.includes(uNorm) || uNorm.includes(oNorm)))
          );
        });

      if (isDependent) {
        const oName = toPersianCourseName(cleanPrereqText(other.name));
        const subjKey = normSubjectKey(oName);
        seenSubjectKeys.add(subjKey);
        if (other.code) seenUnlockCodes.add(String(other.code));

        chartUnlocks.push({
          code: other.code,
          name: oName,
          units: other.units,
          term: other.term,
          status: other.status,
          inCurriculum: true,
        });
      }
    });

    // ۲. استخراج پیش‌درآمدهای سراسری از دیتابیس خواجه نصیر با حذف HTML entity و یکتاسازی موضوعی
    const dbEntry = (cCode && UNIVERSAL_PREREQ_DB[cCode]) ? UNIVERSAL_PREREQ_DB[cCode] : null;
    const rawUnlocks = dbEntry?.unlocks || course.unlocks || [];
    const universityUnlocks = [];

    for (const u of rawUnlocks) {
      const uCode = u.code ? String(u.code).trim() : '';
      const uName = toPersianCourseName(cleanPrereqText(u.name));
      const subjKey = normSubjectKey(uName);

      if (uCode && seenUnlockCodes.has(uCode)) continue;
      if (subjKey && seenSubjectKeys.has(subjKey)) continue;

      if (subjKey) seenSubjectKeys.add(subjKey);
      if (uCode) seenUnlockCodes.add(uCode);

      universityUnlocks.push({
        code: uCode,
        name: uName,
        units: Number(u.units) || 3,
        inCurriculum: false,
      });
    }

    course.unlocks = [...chartUnlocks, ...universityUnlocks];
  });

  // ۵. دسته‌بندی ترم‌به‌ترم (ترم ۱ تا ۸)
  const semesters = [];
  for (let t = 1; t <= 8; t++) {
    const termCourses = allCourses.filter((c) => c.term === t);
    const totalTermUnits = termCourses.reduce((sum, c) => sum + (c.units || 0), 0);
    const passedTermUnits = termCourses
      .filter((c) => c.status === 'passed')
      .reduce((sum, c) => sum + (c.units || 0), 0);

    semesters.push({
      termNumber: t,
      title: `ترم ${toFaDigits(t)}`,
      courses: termCourses,
      totalUnits: totalTermUnits,
      passedUnits: passedTermUnits,
    });
  }

  // ۶. تفکیک سرفصل‌ها و دسته‌بندی‌ها
  const predefinedCategories = (curriculum?.categories || [
    { id: 'base', title: 'دروس پایه', minUnits: 21, color: 'primary' },
    { id: 'core', title: 'دروس تخصصی الزامی', minUnits: 65, color: 'accent' },
    { id: 'general', title: 'دروس عمومی', minUnits: 22, color: 'info' },
    { id: 'skills', title: 'دروس مهارتی', minUnits: 6, color: 'warning' },
    { id: 'elective', title: 'دروس تخصصی انتخابی', minUnits: 20, color: 'secondary' },
    { id: 'extra', title: 'سایر دروس', minUnits: 0, color: 'neutral' },
  ]).map((c) => ({
    ...c,
    title: toPersianCourseName(c.title),
  }));

  const categories = predefinedCategories.map((cat) => {
    const catCourses = allCourses.filter((c) => {
      const cCat = String(c.category || '').trim();
      return cCat === cat.title || cat.title.includes(cCat) || cCat.includes(cat.title);
    });
    const totalUnits = catCourses.reduce((sum, c) => sum + (c.units || 0), 0);
    const passedUnits = catCourses
      .filter((c) => c.status === 'passed')
      .reduce((sum, c) => sum + (c.units || 0), 0);

    return {
      ...cat,
      totalUnits: Math.max(cat.minUnits || 0, totalUnits),
      passedUnits,
      courses: catCourses,
      percent: Math.min(100, Math.round((passedUnits / Math.max(1, cat.minUnits || totalUnits || 1)) * 100)),
    };
  });

  // ۷. محاسبه پویا و دقیق آمار کل (بدون هرگونه هاردکد!)
  const passedCredits = allCourses
    .filter((c) => c.status === 'passed')
    .reduce((sum, c) => sum + (c.units || 0), 0);

  const enrolledCredits = allCourses
    .filter((c) => c.status === 'enrolled')
    .reduce((sum, c) => sum + (c.units || (isProjectCourse(c.name) ? 3 : isInternshipCourse(c.name) ? 2 : 0)), 0);

  const knownCategoriesTotal = categories.reduce((sum, c) => sum + c.totalUnits, 0);

  // محاسبه سقف فارغ‌التحصیلی پویا بر اساس اطلاعات بهستان
  const totalCredits = resolveTotalDegreeCredits(
    profile,
    curriculumStats,
    passedCredits + enrolledCredits,
    curriculum.defaultRequiredCredits || knownCategoriesTotal,
    curriculumReport,
  );

  const remainingCredits = Math.max(0, totalCredits - passedCredits - enrolledCredits);
  const progressPercent = Math.min(100, Math.round((passedCredits / Math.max(1, totalCredits)) * 100));

  const availableCount = allCourses.filter((c) => c.status === 'available').length;
  const lockedCount = allCourses.filter((c) => c.status === 'locked').length;
  const passedCount = allCourses.filter((c) => c.status === 'passed').length;

  return {
    degreeTitle: toPersianCourseName(profile.major ? `${profile.major} — کارشناسی پیوسته` : curriculum.degreeTitle),
    university: curriculum.university || 'دانشگاه صنعتی خواجه نصیرالدین طوسی',
    studentName: profile.fullName || '',
    studentId: profile.studentId || '',
    gpa: profile.gpa || null,
    totalCredits,
    passedCredits,
    enrolledCredits,
    remainingCredits,
    progressPercent,
    availableCount,
    lockedCount,
    passedCount,
    allCourses,
    semesters,
    categories,
  };
}

/**
 * محاسبه عمق توپولوژیک (مراحل جریان ورک‌فلو) برای دروس بر اساس زنجیره پیش‌نیاز
 * خروجی: ۴ مرحله طبیعی جریان یادگیری (پایه -> میانی -> تخصصی -> پیشرفته/پایانی)
 */
export function computeTopologicalStages(courses = [], courseMap = null) {
  if (!courses || !courses.length) return [];

  const map = courseMap || new Map();
  if (!courseMap) {
    for (const c of courses) {
      if (!c) continue;
      const k = c.code ? String(c.code) : normName(c.name || '');
      map.set(k, c);
      map.set(normName(c.name || ''), c);
      if (c.code) map.set(String(c.code), c);
    }
  }

  const depthMap = new Map();
  function getDepth(c, visited = new Set()) {
    const key = c?.code ? String(c.code) : normName(c?.name || '');
    if (depthMap.has(key)) return depthMap.get(key);
    if (visited.has(key)) return 0;
    visited.add(key);

    const prereqs = c?.prerequisites || [];
    if (!prereqs.length) {
      depthMap.set(key, 0);
      return 0;
    }

    let maxPrereqDepth = -1;
    for (const p of prereqs) {
      const pKey = p.code ? String(p.code) : normName(p.name || '');
      const parent = map.get(pKey);
      if (parent) {
        maxPrereqDepth = Math.max(maxPrereqDepth, getDepth(parent, new Set(visited)));
      }
    }

    const d = Math.min(3, maxPrereqDepth + 1);
    depthMap.set(key, d);
    return d;
  }

  courses.forEach((c) => getDepth(c));

  const STAGE_CONFIG = [
    { id: 'stage_0', title: 'مرحله ۱: دروس ورودی و پایه', desc: 'بدون پیش‌نیاز قبلی' },
    { id: 'stage_1', title: 'مرحله ۲: دروس زنجیره‌ای میانی', desc: 'وابسته به مرحله اول' },
    { id: 'stage_2', title: 'مرحله ۳: دروس تخصصی اصلی', desc: 'هسته تخصصی رشته' },
    { id: 'stage_3', title: 'مرحله ۴: دروس پیشرفته و نهایی', desc: 'پروژه و کارآموزی' },
  ];

  return STAGE_CONFIG.map((cfg, idx) => ({
    id: cfg.id,
    title: cfg.title,
    desc: cfg.desc,
    courses: courses.filter((c) => depthMap.get(c?.code ? String(c.code) : normName(c?.name || '')) === idx),
  }));
}

