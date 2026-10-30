/**
 * مدیریت ماژولار ویجت‌های داشبورد سروستان
 * پشتیبانی از ترتیب دلخواه، حذف و اضافه، و ذخیره‌سازی محلی
 */

export const DEFAULT_WIDGETS = [
  {
    id: 'profile',
    title: 'کارت مشخصات و خلاصه تحصیلی',
    description: 'عکس، نام، شماره دانشجویی، معدل کل، واحدهای اخذشده و شهریه',
    icon: 'User',
    enabled: true,
  },
  {
    id: 'nextClass',
    title: 'کلاس بعدی و وضعیت جاری',
    description: 'نام کلاس بعدی، استاد، شماره کلاس و تایم برگزاری',
    icon: 'Clock',
    enabled: true,
  },
  {
    id: 'quickShortcuts',
    title: 'دسترسی سریع ۴گانه',
    description: 'شورتکات‌های برنامه هفتگی، کارنامه، امور مالی و چارت',
    icon: 'LayoutGrid',
    enabled: true,
  },
  {
    id: 'todayClasses',
    title: 'لیست کلاس‌های امروز',
    description: 'جزئیات کلاس‌های امروز به همراه درصد زمان باقیمانده',
    icon: 'BookOpen',
    enabled: true,
  },
  {
    id: 'weeklyLoad',
    title: 'پراکندگی بار آموزشی هفته',
    description: 'نمودار ستونی ساعات کلاسی روزهای هفته',
    icon: 'BarChart2',
    enabled: true,
  },
  {
    id: 'calendar',
    title: 'تقویم آموزشی و برنامه ماهانه',
    description: 'تقویم شمسی ماهانه با نمایش امتحانات و رویدادها',
    icon: 'Calendar',
    enabled: true,
  },
  {
    id: 'todayTasks',
    title: 'کارهای امروز (برنامه‌ریزی)',
    description: 'چک‌لیست کارهای امروز، تکالیف و درصد پیشرفت روزانه',
    icon: 'ListTodo',
    enabled: true,
  },
  {
    id: 'studyHeatmap',
    title: 'هیت‌مپ پیوستگی مطالعه',
    description: 'ماتریس سبز سالانه فعالیت‌ها و دقایق فوکوس',
    icon: 'Flame',
    enabled: true,
  },
  {
    id: 'announcements',
    title: 'خبرنامه و کانال‌های سروستان',
    description: 'گاهنامه سرونامه، شعرنامه، مقالات دانشجویی و اطلاعیه‌ها',
    icon: 'Megaphone',
    enabled: true,
  },
];

const STORAGE_KEY = 'sarvestan_dashboard_widgets_v1';

export function getDashboardWidgetsConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGETS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return DEFAULT_WIDGETS;

    // تطبیق با ویجت‌های پیش‌فرض تا اگر ویجت جدیدی در آینده اضافه شد، گم نشود
    const existingIds = new Set(parsed.map((w) => w.id));
    const merged = [...parsed];

    DEFAULT_WIDGETS.forEach((def) => {
      if (!existingIds.has(def.id)) {
        merged.push({ ...def });
      }
    });

    // پر کردن اطلاعات عنوان و آیکون در صورت عدم ذخیره در کش و به‌روزرسانی عنوان‌های قدیمی
    return merged.map((w) => {
      const meta = DEFAULT_WIDGETS.find((d) => d.id === w.id);
      const isOutdatedTitle = w.id === 'announcements' && (w.title === 'اعلانات رسمی آموزشی' || !w.title);
      return {
        ...meta,
        ...w,
        ...(isOutdatedTitle && meta ? { title: meta.title, description: meta.description } : {}),
        enabled: w.enabled !== false,
      };
    });
  } catch {
    return DEFAULT_WIDGETS;
  }
}

export function saveDashboardWidgetsConfig(widgets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    window.dispatchEvent(new CustomEvent('sarvDashboardWidgetsUpdated', { detail: widgets }));
  } catch (err) {
    console.warn('خطا در ذخیره چیدمان داشبورد:', err);
  }
}

export function resetDashboardWidgetsConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('sarvDashboardWidgetsUpdated', { detail: DEFAULT_WIDGETS }));
    return DEFAULT_WIDGETS;
  } catch {
    return DEFAULT_WIDGETS;
  }
}
