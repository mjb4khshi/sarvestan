export const STUDENT = {
  fullName: 'علی رضایی',
  studentId: '۴۰۱۲۳۴۵۶',
  college: 'مهندسی کامپیوتر',
  major: 'مهندسی کامپیوتر — نرم‌افزار',
  term: '۱۴۰۴–۱۴۰۵ نیمسال اول',
  greeting: 'سلام علی جان',
};

export const SUMMARY = {
  gpa: '۱۷٫۴۲',
  credits: '۱۴',
  unpaid: '۲٬۴۵۰٬۰۰۰',
  nextClassIn: '۲۵ دقیقه',
};

export const TODAY_CLASSES = [
  {
    id: 'c1',
    title: 'الگوریتم‌ها',
    code: 'CS۱۰۱',
    time: '۱۰:۰۰–۱۱:۳۰',
    room: 'کلاس ۲۰۴',
    status: 'now',
    color: 'primary',
  },
  {
    id: 'c2',
    title: 'ریاضیات گسسته',
    code: 'MATH۲۰۳',
    time: '۱۳:۰۰–۱۴:۳۰',
    room: 'کلاس ۱۱۲',
    status: 'next',
    color: 'info',
  },
  {
    id: 'c3',
    title: 'آز کامپایلر',
    code: 'CS۱۰۱L',
    time: '۱۶:۰۰–۱۷:۳۰',
    room: 'آزمایشگاه ۳',
    status: 'later',
    color: 'secondary',
  },
];

export const WEEK = [
  { day: 'شنبه', count: 3 },
  { day: 'یکشنبه', count: 2 },
  { day: 'دوشنبه', count: 4 },
  { day: 'سه‌شنبه', count: 1 },
  { day: 'چهارشنبه', count: 3 },
];

/** ماتریس برنامه هفتگی — مثل گزارش ۷۸ (قابل اسکرول افقی) */
export const SCHEDULE_MATRIX = {
  days: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'],
  slots: ['۰۷:۳۰–۰۹:۰۰', '۰۹:۰۰–۱۰:۳۰', '۱۰:۳۰–۱۲:۳۰', '۱۳:۳۰–۱۵:۰۰', '۱۵:۰۰–۱۶:۳۰', '۱۶:۳۰–۱۸:۰۰'],
  /** key: `${slotIndex}-${dayIndex}` */
  cells: {
    '0-0': { title: 'معماری کامپیوتر', room: '۲۱۰', professor: 'دکتر محمدی', color: 'primary' },
    '1-0': { title: 'الگوریتم‌ها', room: '۲۰۴', professor: 'دکتر احمدی', color: 'info' },
    '2-2': { title: 'الگوریتم‌ها', room: '۲۰۴', professor: 'دکتر احمدی', color: 'info' },
    '1-1': { title: 'مدار منطقی', room: '۱۱۵', professor: 'دکتر رضایی', color: 'secondary' },
    '3-1': { title: 'ریاضیات گسسته', room: '۱۱۲', professor: 'دکتر کریمی', color: 'accent' },
    '0-2': { title: 'برنامه‌سازی پیشرفته', room: 'آز ۲', professor: 'مهندس نادری', color: 'success' },
    '1-2': { title: 'آمار و احتمالات', room: '۲۲۰', professor: 'دکتر صادقی', color: 'warn' },
    '5-2': { title: 'آز کامپایلر', room: 'آز ۳', professor: 'مهندس نادری', color: 'danger' },
    '4-3': { title: 'زبان انگلیسی', room: '۳۰۱', professor: 'دکتر نوری', color: 'primary' },
    '3-4': { title: 'تاریخ تمدن', room: '۱۰۱', professor: 'دکتر شریفی', color: 'secondary' },
    '5-4': { title: 'کارگاه نرم‌افزار', room: 'کارگاه ۱', professor: 'مهندس مرادی', color: 'success' },
  },
};

/** لیست و برنامه امتحانات پایان‌ترم با روزشمار و زمان‌بندی */
export const EXAMS_DATA = [
  {
    id: 'ex1',
    course: 'آمار و احتمالات مهندسی',
    code: '۱۰۱',
    unit: 3,
    instructor: 'دکتر صادقی',
    examDate: '۱۴۰۴/۱۰/۱۵',
    examTime: '۰۸:۳۰–۱۰:۳۰',
    room: 'سالن خوارزمی (طبقه ۲)',
    seat: '۱۲۴',
    daysLeft: 12,
    color: 'primary',
  },
  {
    id: 'ex2',
    course: 'مدار منطقی و سیستم دیجیتال',
    code: '۱۰۲',
    unit: 3,
    instructor: 'دکتر رضایی',
    examDate: '۱۴۰۴/۱۰/۱۸',
    examTime: '۱۳:۳۰–۱۵:۳۰',
    room: 'ساختمان ابوریحان - کلاس ۳۰۴',
    seat: '۸۹',
    daysLeft: 15,
    color: 'secondary',
  },
  {
    id: 'ex3',
    course: 'برنامه‌سازی پیشرفته (شی‌ءگرا)',
    code: '۱۰۳',
    unit: 3,
    instructor: 'مهندس نادری',
    examDate: '۱۴۰۴/۱۰/۲۲',
    examTime: '۰۹:۰۰–۱۱:۳۰',
    room: 'سایت مرکزی کامپیوتر',
    seat: '۴۵',
    daysLeft: 19,
    color: 'accent',
  },
  {
    id: 'ex4',
    course: 'تاریخ فرهنگ و تمدن اسلامی',
    code: '۱۰۴',
    unit: 2,
    instructor: 'دکتر شریفی',
    examDate: '۱۴۰۴/۱۰/۲۷',
    examTime: '۱۴:۰۰–۱۶:۰۰',
    room: 'آمفی‌تئاتر دانشکده',
    seat: '۲۱۵',
    daysLeft: 24,
    color: 'warn',
  },
];

export const TERMS_DATA = [
  {
    id: '4041',
    name: 'نیمسال اول ۱۴۰۴–۱۴۰۵',
    shortName: 'ترم ۱ (۱۴۰۴)',
    gpa: '۱۷٫۲۵',
    totalUnits: 11,
    passedUnits: 9,
    status: 'در حال ثبت نمرات',
    courses: [
      { id: 'c1', code: '۱۰۱', course: 'آمار و احتمالات مهندسی', unit: 3, score: 18.50, displayScore: '۱۸٫۵۰', status: 'قطعی', color: 'success' },
      { id: 'c2', code: '۱۰۲', course: 'مدار منطقی و سیستم دیجیتال', unit: 3, score: 16.25, displayScore: '۱۶٫۲۵', status: 'قطعی', color: 'primary' },
      { id: 'c3', code: '۱۰۳', course: 'برنامه‌سازی پیشرفته (شی‌ءگرا)', unit: 3, score: 17.00, displayScore: '۱۷٫۰۰', status: 'قطعی', color: 'info' },
      { id: 'c4', code: '۱۰۴', course: 'تاریخ فرهنگ و تمدن اسلامی', unit: 2, score: null, displayScore: '—', status: 'در حال', color: 'warn' },
    ],
  },
  {
    id: '4032',
    name: 'نیمسال دوم ۱۴۰۳–۱۴۰۴',
    shortName: 'ترم ۲ (۱۴۰۳)',
    gpa: '۱۸٫۰۵',
    totalUnits: 13,
    passedUnits: 13,
    status: 'تایید نهایی',
    courses: [
      { id: 'c5', code: '۲۰۱', course: 'ساختمان داده‌ها و الگوریتم', unit: 3, score: 18.25, displayScore: '۱۸٫۲۵', status: 'قطعی', color: 'success' },
      { id: 'c6', code: '۲۰۲', course: 'ریاضیات عمومی ۲', unit: 3, score: 19.00, displayScore: '۱۹٫۰۰', status: 'قطعی', color: 'primary' },
      { id: 'c7', code: '۲۰۳', course: 'فیزیک الکتریسیته و مغناطیس', unit: 3, score: 16.50, displayScore: '۱۶٫۵۰', status: 'قطعی', color: 'info' },
      { id: 'c8', code: '۲۰۴', course: 'زبان خارجی تخصصی کامپیوتر', unit: 3, score: 17.50, displayScore: '۱۷٫۵۰', status: 'قطعی', color: 'secondary' },
      { id: 'c9', code: '۲۰۵', course: 'کارگاه کامپیوتر و لینوکس', unit: 1, score: 20.00, displayScore: '۲۰٫۰۰', status: 'قطعی', color: 'accent' },
    ],
  },
  {
    id: '4031',
    name: 'نیمسال اول ۱۴۰۳–۱۴۰۴',
    shortName: 'ترم ۱ (۱۴۰۳)',
    gpa: '۱۷٫۶۸',
    totalUnits: 13,
    passedUnits: 13,
    status: 'تایید نهایی',
    courses: [
      { id: 'c10', code: '۳۰۱', course: 'مبانی برنامه‌نویسی پایتون', unit: 3, score: 19.25, displayScore: '۱۹٫۲۵', status: 'قطعی', color: 'success' },
      { id: 'c11', code: '۳۰۲', course: 'ریاضیات عمومی ۱', unit: 3, score: 17.50, displayScore: '۱۷٫۵۰', status: 'قطعی', color: 'primary' },
      { id: 'c12', code: '۳۰۳', course: 'فیزیک مکانیک و حرارت', unit: 3, score: 15.75, displayScore: '۱۵٫۷۵', status: 'قطعی', color: 'warn' },
      { id: 'c13', code: '۳۰۴', course: 'فارسی عمومی و نگارش', unit: 3, score: 18.00, displayScore: '۱۸٫۰۰', status: 'قطعی', color: 'info' },
      { id: 'c14', code: '۳۰۵', course: 'تربیت بدنی ۱', unit: 1, score: 19.50, displayScore: '۱۹٫۵۰', status: 'قطعی', color: 'accent' },
    ],
  },
];

export const GRADES = TERMS_DATA[0].courses;

export const CURRICULUM_DATA = {
  totalCredits: 140,
  passedCredits: 105,
  enrolledCredits: 11,
  remainingCredits: 24,
  categories: [
    {
      id: 'core',
      title: 'دروس تخصصی و اصلی',
      passed: 48,
      total: 60,
      color: 'accent',
      courses: [
        { name: 'ساختمان داده‌ها', unit: 3, status: 'passed', grade: '۱۸٫۲۵' },
        { name: 'طراحی الگوریتم‌ها', unit: 3, status: 'enrolled', grade: 'جاری' },
        { name: 'مدار منطقی', unit: 3, status: 'passed', grade: '۱۶٫۲۵' },
        { name: 'معماری کامپیوتر', unit: 3, status: 'enrolled', grade: 'جاری' },
        { name: 'سیستم‌های عامل', unit: 3, status: 'remaining', prereq: 'ساختمان داده‌ها' },
        { name: 'شبکه‌های کامپیوتری', unit: 3, status: 'remaining', prereq: 'معماری' },
        { name: 'پایگاه داده‌ها', unit: 3, status: 'remaining', prereq: 'ساختمان داده‌ها' },
      ],
    },
    {
      id: 'basic',
      title: 'دروس پایه',
      passed: 25,
      total: 28,
      color: 'primary',
      courses: [
        { name: 'ریاضی عمومی ۱', unit: 3, status: 'passed', grade: '۱۷٫۵۰' },
        { name: 'ریاضی عمومی ۲', unit: 3, status: 'passed', grade: '۱۹٫۰۰' },
        { name: 'معادلات دیفرانسیل', unit: 3, status: 'enrolled', grade: 'جاری' },
        { name: 'آمار و احتمالات', unit: 3, status: 'passed', grade: '۱۸٫۵۰' },
        { name: 'فیزیک ۱ و ۲', unit: 6, status: 'passed', grade: '۱۶٫۱۲' },
      ],
    },
    {
      id: 'general',
      title: 'دروس عمومی',
      passed: 18,
      total: 22,
      color: 'info',
      courses: [
        { name: 'فارسی عمومی', unit: 3, status: 'passed', grade: '۱۸٫۰۰' },
        { name: 'زبان خارجی عمومی', unit: 3, status: 'passed', grade: '۱۷٫۵۰' },
        { name: 'تربیت بدنی ۱ و ۲', unit: 2, status: 'passed', grade: '۱۹٫۵۰' },
        { name: 'اندیشه اسلامی ۱', unit: 2, status: 'passed', grade: '۱۹٫۰۰' },
        { name: 'اندیشه اسلامی ۲', unit: 2, status: 'remaining', prereq: 'اندیشه ۱' },
        { name: 'تاریخ اسلام', unit: 2, status: 'remaining', prereq: '—' },
      ],
    },
    {
      id: 'elective',
      title: 'دروس اختیاری',
      passed: 14,
      total: 24,
      color: 'secondary',
      courses: [
        { name: 'هوش مصنوعی', unit: 3, status: 'enrolled', grade: 'جاری' },
        { name: 'یادگیری ماشین', unit: 3, status: 'remaining', prereq: 'هوش مصنوعی' },
        { name: 'توسعه وب پیشرفته', unit: 3, status: 'passed', grade: '۲۰٫۰۰' },
        { name: 'امنیت داده‌ها', unit: 3, status: 'remaining', prereq: 'شبکه‌ها' },
      ],
    },
    {
      id: 'project',
      title: 'پروژه و کارآموزی',
      passed: 0,
      total: 6,
      color: 'warn',
      courses: [
        { name: 'کارآموزی تابستان', unit: 2, status: 'remaining', prereq: '۱۰۰ واحد' },
        { name: 'پروژه کارشناسی', unit: 4, status: 'remaining', prereq: '۱۱۰ واحد' },
      ],
    },
  ],
};

export const FINANCE = {
  balanceLabel: 'بدهی جاری',
  balance: '۲٬۴۵۰٬۰۰۰',
  currency: 'تومان',
  totalBillRial: 24500000,
  totalPaidRial: 0,
  debtToman: 2450000,
  isPaid: false,
  dateLabel: '۱۴۰۴/۰۶/۲۱',
  timeLabel: '۱۴:۳۲',
  items: [
    { id: 'f1', title: 'شهریه نیمسال', amount: '۲٬۱۰۰٬۰۰۰', status: 'پرداخت‌نشده', color: 'danger' },
    { id: 'f2', title: 'بیمه دانشجویی', amount: '۳۵۰٬۰۰۰', status: 'پرداخت‌نشده', color: 'warn' },
    { id: 'f3', title: 'کتابخانه', amount: '۰', status: 'تسویه', color: 'success' },
  ],
};

export const REQUESTS = [
  { id: 'r1', title: 'ثبت نمره انتخابی', date: '۲ روز پیش', status: 'در جریان', color: 'info' },
  { id: 'r2', title: 'گواهی اشتغال به تحصیل', date: 'هفته گذشته', status: 'آماده', color: 'success' },
  { id: 'r3', title: 'اعتراض به نمره', date: '۱۰ روز پیش', status: 'بسته', color: 'neutral' },
];

export const ANNOUNCEMENTS = [
  {
    id: 'a1',
    title: 'مهلت اعتراض به نمرات',
    body: 'تا پایان هفته جاری در بهستان ثبت کنید.',
    color: 'warn',
  },
  {
    id: 'a2',
    title: 'انتخاب واحد ترم بعد',
    body: 'پیش‌ثبت‌نام از شنبه آغاز می‌شود.',
    color: 'info',
  },
];

export const SHORTCUTS = [
  { id: 's1', label: 'برنامه امروز', tab: 'schedule' },
  { id: 's2', label: 'جدول هفتگی', tab: 'timetable' },
  { id: 's3', label: 'کارنامه', tab: 'grades' },
  { id: 's4', label: 'پرداخت', tab: 'finance' },
];
