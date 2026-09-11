# سروستان | Sarvestan - مستند جامع پروژه، معماری و راهنمای انتقال به ایجنت جدید (Agent Handoff)

> **نسخه افزونه:** 1.2.0  
> **هدف پروژه:** بازطراحی کامل، مدرن‌سازی و افزودن لایه هوشمند تعاملی روی سامانه آموزش جامع گلستان/بهستان دانشگاه صنعتی خواجه نصیرالدین طوسی با زبان طراحی اختصاصی **«سرو ۲.۰ (Sarv UI)»**.

---

## ۱. پشته فناوری (Tech Stack)

- **هسته فرانت‌اند:** React 19 + Vite 6
- **استایل‌دهی و دیزاین‌سیستم:** Tailwind CSS v4 + دیزاین‌سیستم اختصاصی سروستان (`sarv-ui`) با تایپوگرافی فونت‌های سری آراد، تم‌های مدرن (پرشین لایت، سرو دارک، رویال سرمه‌ای)، گلس‌مورفیسم و میکروانیمیشن‌ها
- **انیمیشن‌ها:** `framer-motion`
- **آیکون‌ها:** `lucide-react`
- **معماری افزونه مرورگر:** Chrome Extension Manifest V3
  - اسکریپت پس‌زمینه (Service Worker): `background.js`
  - اسکریپت‌های تزریق شونده به صفحه بهستان:
    - `behestanInterceptor.js` (اجرا در **MAIN World** جهت هوک شبکه و سنک مستقیم)
    - `contentScript.js` (اجرا در **ISOLATED World** جهت مدیریت DOM، لایه Overlay و پل ارتباطی با `chrome.storage`)
  - تب مستقل داشبورد و لایه فول‌اسکرین آی‌فریم درون بهستان (`index.html`)

---

## ۲. ساختار پوشه‌ها و فایل‌های پروژه

```text
w:\sarv dashboard\
├── public/
│   ├── manifest.json              # مانیفست استاندارد Manifest V3 افزونه کروم
│   ├── background.js              # سرویس‌ورکر افزونه برای مدیریت کلیک آیکون و تب‌ها
│   ├── contentScript.js           # اسکریپت کانتنت، ایجاد دکمه شناور، اسکن DOM و لایه Overlay
│   ├── behestanInterceptor.js     # هوک شبکه در MAIN World و موتور سنک خودکار (Proactive Sync)
│   ├── fonts/                     # فونت‌های وب رسمی خانواده آراد (Arad)
│   └── icons/                     # آیکون‌های استاندارد افزونه (۱۶، ۳۲، ۴۸، ۱۲۸ پیکسل)
│
├── src/
│   ├── index.css                  # استایل‌های پایه، متغیرهای تم و کلاس‌های دیزاین‌سیستم سرو
│   ├── App.jsx                    # کامپوننت اصلی، روتینگ ماژول‌ها، ناوبری، تم و هدر
│   │
│   ├── components/
│   │   ├── sarv/                  # کامپوننت‌های اتمیک سیستم سرو (SarvButton, SarvBadge, SarvInput, SarvSelect)
│   │   ├── SarvAvatar.jsx         # آواتار هوشمند با قابلیت نمایش عکس زنده یا حروف اختصاری نام
│   │   ├── BehestanStatusBadge.jsx# نشانگر وضعیت اتصال آنلاین/آفلاین به سشن بهستان
│   │   ├── QuickSearchModal.jsx   # جستجوی سریع هوشمند در خدمات و گزارش‌های بهستان (Ctrl+K)
│   │   └── NativeBehestanPaymentView.jsx # نمای ایمن پرداخت مستقیم و سوئیچ به درگاه رسمی بهستان
│   │
│   ├── modules/                   # ماژول‌های اصلی داشبورد:
│   │   ├── DashboardOverview.jsx      # میز کار جامع، خلاصه وضعیت تحصیلی، بدهی، برنامه امروز
│   │   ├── TranscriptsGrades.jsx      # کارنامه رسمی گزارش ۷۹، نمرات قطعی، شبیه‌ساز هوشمند معدل
│   │   ├── FinanceAndTuition.jsx      # امور مالی، گزارش ۲۵۶۳، فرم ۲۷۵۷۰ و پرداخت شاپرک
│   │   ├── WeeklySchedule.jsx         # برنامه هفتگی و امتحانات (گزارش ۷۸ و ۴۲۸)، خروجی اکسل
│   │   ├── EducationalRequests.jsx    # پیشخوان خدمت، گردش‌کارها و پیگیری درخواست‌ها (کاملاً داینامیک)
│   │   ├── LettersAndCertificates.jsx # نامه‌ها، گواهی اشتغال به تحصیل و استعلام QR Code
│   │   └── CurriculumAndCourses.jsx   # چارت و وضعیت دروس، پیش‌نیازها و واحدهای گذرانده
│   │
│   └── services/
│       ├── behestanData.js        # پروکسی‌های داینامیک داده و مدیریت سابسکرایب کش زنده
│       └── behestanLiveSync.js    # موتور همگام‌سازی، مدیریت پروفایل و ارتباط با تب‌های بهستان
│
├── dist/                          # خروجی باندل‌شده بیلد نهایی جهت لود در مرورگر
├── package.json                   # تنظیمات وابستگی‌ها و اسکریپت‌ها
└── vite.config.js                 # کانفیگ Vite با پلاگین‌های React و Tailwind CSS
```

---

## ۳. معماری تبادل داده و ارتباط زنده با سامانه بهستان (Data Flow Pipeline)

```mermaid
flowchart TD
    subgraph Behestan ["سامانه بهستان (behestan.kntu.ac.ir)"]
        PageJS["جاوااسکریپت آنگولار / سشن بهستان"]
        Storage["localStorage: un, sid, t, ut"]
    end

    subgraph MainWorld ["MAIN World"]
        Interceptor["behestanInterceptor.js\n1. هوک XHR & Fetch\n2. موتور سنک خودکار (Proactive Sync)"]
    end

    subgraph IsolatedWorld ["ISOLATED World"]
        ContentScript["contentScript.js\n1. مدیریت دکمه سبز و داک شناور\n2. تزریق Overlay Iframe\n3. اسکن DOM و حافظه"]
    end

    subgraph ChromeExt ["Chrome Extension Runtime"]
        ChromeStorage["chrome.storage.local\n(sarvestan_live_*)"]
        LocalStorage["localStorage کش افزونه"]
    end

    subgraph SarvDashboard ["داشبورد سروستان (React 19)"]
        LiveSync["behestanData.js & liveSync\n(subscribeToData)"]
        UI["کامپوننت‌های ری‌اکت\n(Overview, Transcripts, Finance, Schedule, ...)"]
    end

    Storage -.->|خواندن کلیدها| Interceptor
    PageJS <-->|Intercept Calls| Interceptor
    Interceptor -->|Proactive Fetch به APIهای بهستان| PageJS
    Interceptor -->|window.postMessage| ContentScript
    ContentScript -->|set| ChromeStorage
    ContentScript -->|set| LocalStorage
    ContentScript -->|postMessage| SarvDashboard
    ChromeStorage -->|onChanged| LiveSync
    LiveSync -->|notifyData()| UI
```

### اندپوینت‌های کلیدی استخراج‌شده از بهستان:

1. **`sys.svc`:** استخراج شناسه سشن (`sid`)، تیکت اعتبارسنجی (`t`)، شماره دانشجویی (`std` / `un`) و شناسه کاربری (`u`).
2. **`F1825_PROCESS_STDTOTALINFOTrmStat_BEH.svc` (مهم‌ترین اندپوینت جامع):**
   - **گرید ۰ (`AUWp`):** لیست ترم‌های تحصیلی و پارامترهای لینک به گزارش ۴۲۸ و ۷۹.
   - **گرید ۱ (`AUWr`):** کلیه ریز نمرات دروس تمام ترم‌ها شامل کد درس، نام درس، شماره گروه، تعداد واحد، نمره نهایی قطعی، وضعیت قبولی و نوع درس (پایه/تخصصی/عمومی).
   - **گرید ۲ (`AVVY`):** ریزتراز مالی به تفکیک ترم شامل شهریه ثابت، شهریه متغیر، بیمه، کل صورتحساب، پرداختی‌ها و مانده بدهی قطعی (مثلاً ۱۳,۳۲۵,۰۰۰ تومان).
   - **گرید ۳ (`AfqV`):** سوابق جامع معدل ترمی، معدل کل رسمی تجمیعی و مجموع واحدهای پاس‌شده تا هر مقطع.
3. **`F1809_PROCESS_STD_Personally_BH.svc`:**
   - استخراج عکس پرسنلی رسمی دانشجو از فیلد `outpar.AUWw`.
   - **نکته حیاتی:** در بهستان این فیلد با تگ `<PHOTO>/9j/...` شروع می‌شود؛ افزونه این پیشوند را پاک کرده و به رشته استاندارد `data:image/jpeg;base64,...` تبدیل می‌کند.
4. **`F6524_PROCESS_DASHBOARD_BEH.svc`:**
   - استخراج درخواست‌های جاری، نامه‌ها و گردش‌کارهای پیشخوان خدمت دانشجو به صورت بلادرنگ.

---

## ۴. درس‌های آموخته و خطاهای برطرف‌شده (Critical Gotchas & Fixes)

1. **عدم هاردکد کردن اطلاعات شخصی کاربر:**
   - در نسخه‌های گذشته، اطلاعات شخصی یک دانشجو (شماره دانشجویی و درخواست شورای آموزشی) به عنوان fallback درون کد قرار گرفته بود که کاربر به درستی معترض شد.
   - **قاعده اساسی:** تمام فایل‌ها باید ۱۰۰٪ داینامیک باشند؛ در صورت خالی بودن کش یا عدم اتصال به بهستان، تنها **Empty State استاندارد و زیبا** نمایش داده می‌شود و هیچ دیتای جعلی یا هاردکدی نباید وجود داشته باشد.
2. **جداسازی محیطی Manifest V3:**
   - هوک کردن `XMLHttpRequest` یا `fetch` داخل `contentScript.js` روی درخواست‌های صفحه میزبان اثری ندارد، چون در Isolated World اجرا می‌شود. کد هوک و سنک حتماً باید از طریق `behestanInterceptor.js` در `"world": "MAIN"` اجرا شود.
3. **حل مشکل صفحه سفید در ماژول شهریه (`FinanceAndTuition.jsx`):**
   - به دلیل دریافت مقادیر رشته‌ای حاوی کاما از بهستان (مانند `"133,250,000"` یا `"273,250,000"`), عملیات ریاضی مستقیم مانند `amount / 10` سبب تولید `NaN` و کرش رندر می‌شد. توابع کمکی `n(v)` و `fmt(v)` برای پاکسازی و اعتبارسنجی اعداد پیش از رندر اضافه شدند.
4. **سیستم سابسکرایب ری‌اکتیو (`subscribeToData`):**
   - تمام کامپوننت‌های اصلی با `useEffect` به `subscribeToData` متصل هستند تا به محض اینکه اینترسپتور دیتا را دریافت کرد، کامپوننت‌های ری‌اکت بدون نیاز به رفرش صفحه فوراً ری‌رندر شوند.

---

## ۵. راهنمای بیلد، توسعه و بارگذاری در مرورگر

### اجرای محیط توسعه (Dev Server):
```bash
npm run dev
# یا
npx vite --port 5173
```

### بیلد افزونه برای مرورگر (Production Build):
```bash
npm run build
# یا
npx vite build
```
فایل‌های بیلد شده مستقیماً در پوشه `w:\sarv dashboard\dist` ریخته می‌شوند.

### نصب افزونه در مرورگر (Chrome / Edge / Brave):
1. به آدرس `chrome://extensions` بروید.
2. کلید **Developer mode** (حالت توسعه‌دهنده) را در بالا سمت راست فعال کنید.
3. روی دکمه **Load unpacked** کلیک کنید.
4. پوشه خروجی را انتخاب کنید:
   ```text
   w:\sarv dashboard\dist
   ```
5. پس از هر تغییر در کد، بعد از اجرای `npm run build`، کافی است در صفحه افزونه‌ها روی دکمه **Reload (🔄)** افزونه کلیک کنید و تب سامانه بهستان را رفرش فرمایید.
