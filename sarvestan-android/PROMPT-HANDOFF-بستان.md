# سروستان موبایل — اتصال دیتای بهستان (KNTU)
## پرامپت کامل و مستقل برای ای‌آی کمکی (بدون دسترسی به فایل سیستم)

---

## ۱) پروژه چیست؟

**سروستان** داشبورد/اپ مدرن برای سامانه بهستان دانشگاه صنعتی خواجه نصیرالدین طوسی.

- **افزونه Chrome (در حال حاضر کار می‌کند):** React/Vite در `sarv dashboard`. یک content script به نام `behestanInterceptor.js` در **MAIN World** صفحه `behestan.kntu.ac.ir` اجرا می‌شود. XHR/fetch را هوک می‌کند و همچنین خودش صف سریالی درخواست می‌زند (برنامه ۷۸، کارنامه F1825، …).
- **اپ موبایل (در حال ساخت):** همان React + Sarv UI، هدف نهایی **Capacitor + WebView** روی اندروید.
- **رابط طراحی:** دیزاین‌سیستم **Sarv UI** (توکن‌های `bg-base`, `text-primary`, `sarv-card`, …)، فونت آراد، RTL.

### چرا افزونه کار می‌کند ولی اپ لوکال نه؟

افزونه داخل **همان origin** بهستان است:
- `fetch` به `/frm/...svc/` همان‌origin است → **بدون CORS**
- `localStorage.sid` و `localStorage.t` (تیکت) همان صفحه
- کوکی‌های مرورگر (`credentials: include`) اتوماتیک ارسال می‌شوند

اپ موبایل روی `localhost` / `capacitor://` است. نمی‌تواند `localStorage` بهستان را بخواند و از بیرون `fetch` بزند مگر:
1. همان‌origin شود (WebView روی بهستان)، یا
2. نشست/کوکی را به‌درستی از سرور بگیرد و با همان هدرها بفرستد

### شکست‌های قبلی (صادقانه)

| راه | نتیجه |
|-----|--------|
| رمز + کپچای `loginapi` act=09 | برای کاربر جواب نداد / کپچا |
| SSO خودکار Node (فرم Keycloak) | `sid`+`t` برمی‌گردد ولی ViewReport می‌گوید **«نشست كاري شما به پايان رسيده است» (کد 50216)** |
| پراکسی Vite روی localhost | CORS حل شد، ولی همان 50216 |
| SPA بهستان روی پروکسی | صفحه سیاه (Angular روی host غیر بهستان bootstrap نمی‌شود) |
| کپی JSON نشست + پیست | نشست منقضی / ناکافی بدون کوکی واقعی |

**نتیجه:** `sid` + `t` به‌تنهایی از process دیگر (Node) برای API کافی نیست — یا به کوکی/نشست مرورگر bind است، یا باید **از داخل WebView/صفحهٔ بهستان** fetch شود.

---

## ۲) معماری هدف (تغییر نکرده)

```
React Sarvestan
    → Capacitor WebView (اندروید)
        → کاربر در WebView وارد behestan.kntu.ac.ir می‌شود (SSO)
        → همان WebView fetch می‌زند (same-origin + کوکی)
        → نتیجه JSON → ذخیره محلی → UI Sarv
```

ضدبن: سریالی، تأخیر ۳۰۰–۷۰۰ms، بدون سرور واسط مشترک، IP کاربر.

---

## ۳) SSO = Keycloak دانشگاه (از رکورد HAR)

```
GET https://sso.kntu.ac.ir/realms/kntu/protocol/openid-connect/auth
  ?client_id=behestan.kntu.ac.ir
  &redirect_uri=https%3A%2F%2Fbehestan.kntu.ac.ir%2Findex.html
  &response_type=code
  &scope=openid%20profile
  &state=...
```

- صفحه فرم Keycloak: `username`, `password`, `credentialId` (hidden), submit name=`login`
- POST به URL فرم (`login-actions/authenticate?session_code=...`)
- **ROPC** (`grant_type=password` روی token endpoint) **غیرفعال** → `unauthorized_client`
- بعد از موفقیت: redirect به `https://behestan.kntu.ac.ir/index.html?code=...`

### تأیید code نزد بهستان (Angular همین را انجام می‌دهد)

```
POST https://behestan.kntu.ac.ir/frmc/Authentication/oauth2/
Content-Type: application/json
```

```json
{
  "act": "09",
  "r": {
    "code": "<oauth-code>",
    "ticket": "",
    "l": "",
    "p": "",
    "d": "0",
    "c": "",
    "rsc": "112"
  },
  "rp": {}
}
```

پاسخ موفق:
```json
{
  "t": "{\"Ticket\":\"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX\",\"IdleTime\":10}",
  "oaut": {
    "sp": { "UsrType": "0" },
    "rp": { "sid": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", "ct": "", "...": "..." }
  },
  "msg": { "errors": [], "war": [], "suc": [] }
}
```

کلاینت:
- `localStorage.sid = oaut.rp.sid`
- `localStorage.t = t` (رشته JSON)
- `localStorage.ut = oaut.sp.UsrType`

### loginapi (ورود رمزی با کپچا — گزینهٔ فرعی)

```
POST https://behestan.kntu.ac.ir/frm/loginapi/loginapi.svc/
```

- `act: "00"` → کپچا (`outpar.capt` base64 JPEG)
- `act: "09"` → `{ r: { l: username, p: password, c: captcha, d:"0", code:"", ticket:"" }, rp:{} }`

---

## ۴) درخواست‌های API بعد از لاگین (از HAR + interceptor)

همه `POST` به `https://behestan.kntu.ac.ir/frm/...` با `Content-Type: application/json`.  
هدر Authorization **ندارند**. مهم: `sid` در `rp.sid` و `t` در بدنه (string JSON) است.

### الگوی عمومی `rp`

```json
{
  "rp": {
    "ft": "0 یا 1",
    "f": "<کد فرم>",
    "seq": "<string عددی>",
    "subfrm": " یا 0",
    "sid": "<sid>",
    "ct": "",
    "sp": "{\"UsrType\":\"0\",\"TrmType\":\"2\"}",
    "loc": "fa",
    "ut": "0"
  },
  "t": "{\"Ticket\":\"...\",\"IdleTime\":5}",
  "r": { },
  "act": "...",
  "MaxHlp": 200
}
```

### جدول سرویس‌ها

| URL | act | `r` مهم | `rp.f` | داده |
|-----|-----|---------|--------|------|
| `.../BAS0237_CMP_ViewReport/BAS0237_CMP_ViewReport.svc/` | `08` | `Ra3:"0"`, `BMu:"<Root/>"`, `BMv:"<Root><N id=\"4\" ft=\"7\" fs=\"0\" M=\"<term>\" F=\"<term>\"/></Root>"`, `AFek:"1"` | `78` برنامه, `88` ثبت‌نام, `428` امتحان | `outpar.BMt` |
| `.../F1825_PROCESS_STDTOTALINFOTrmStat_BEH/F1825_PROCESS_STDTOTALINFOTrmStat_BEH.svc/` | `20` | `AUWo: "<studentId>"` | `11147` | کارنامه/مالی/دروس |
| `.../F1809_PROCESS_STD_Personally_BH/F1809_PROCESS_STD_Personally_BH.svc/` | `08` | `AUWs: "<studentId>"` | `11141` | عکس `outpar.AUWw` |
| `.../F6524_PROCESS_DASHBOARD_BEH/F6524_PROCESS_DASHBOARD_BEH.svc/` | `24` | `AVsa: "<userId>"`, `AVsl:"1"`, `AVsm:"0"`, `AW4r:"5"` | `21122` | گردش‌کار |
| `.../F1814_PROCESS_STDAllCrs/F1814_PROCESS_STDAllCrs.svc/` | `00` سپس `08` | مرحله ۲: `AHug` از پاسخ مرحله ۱ | `11126` | چارت |
| `.../sys/sys.svc/` | `nav` | `r.fid: "11130"` یا `"21122"` | — | ناوبری/منو |

**ترتیب پیشنهادی (مثل interceptor):**  
۷۸ (ترم‌ها) → F1825 → F1809 → F6524 → F1814 (دو مرحله) → ۷۸/۸۸/۴۲۸ باقی  
هر درخواست تأخیر ۳۰۰–۷۰۰ms، سریالی، بدون موازی.

### شماره دانشجو (`studentId`)

از `AUWo` درخواست F1825. در HAR مثال: `40417343`.  
باید از `localStorage.un` بهستان یا پاسخ sys.svc (`outpar.std`) بیاید — **hardcode نکن**.

---

## ۵) شکل پاسخ‌ها

### خطا نشست مرده
```json
{
  "msg": {
    "errors": ["کد 50216-1 : نشست كاري شما به پايان رسيده است."],
    "c": [{"m":[{"e":"2","m":"کد 50216-1 : نشست كاري شما به پايان رسيده است."}]}]
  }
}
```

### گزارش ۷۸
`outpar.BMt` رشته XML/HTML. داخل آن attribute `M2="..."` شامل جدول HTML. سلول‌ها `TITLE="نام درس: ... شماره درس: NNNN گروه: NN ساعت: HH:MM-HH:MM ..."`. هدر روز: سلول‌های TD که فقط متن «شنبه» و… هستند.

### F1825
`rset.grd` آرایه. هر `grd[i].xml` رشته `<row F1="..." F2="..." .../>`.

---

## ۶) پارسرهای کلیدی (کپی از افزونه — قابل استفاده در JS)

### XML گرید
```js
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
      attrs[am[1]] = String(am[2])
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, ' ');
    }
    rows.push(attrs);
  }
  return rows;
}

function cleanHtml(str) {
  if (!str) return '';
  return String(str).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeCourseName(name) {
  if (!name) return '';
  return String(name).replace(/[يى]/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]).replace(/\s+/g, ' ').trim();
}

function normalizeDayName(raw) {
  if (!raw) return '';
  let d = cleanHtml(String(raw)).replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ').trim();
  d = d.replace(/^یک\s*شنبه\b/i, 'یکشنبه').replace(/^دو\s*شنبه\b/i, 'دوشنبه')
       .replace(/^سه\s*شنبه\b/i, 'سه‌شنبه').replace(/^چهار\s*شنبه\b/i, 'چهارشنبه')
       .replace(/^شنبه\b/i, 'شنبه');
  const token = d.split(/\s+/)[0] || '';
  const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'];
  if (days.includes(token)) return token;
  return d;
}

function parseTimeRange(raw) {
  if (!raw) return '';
  const m = String(raw).match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (!m) return String(raw).trim();
  const toMin = (t) => { const [h, mm] = t.split(':').map(Number); return h * 60 + mm; };
  let [a, b] = [m[1], m[2]];
  if (toMin(b) < toMin(a)) [a, b] = [b, a];
  const pad = (t) => (t.length === 4 ? '0' + t : t);
  return pad(a) + ' - ' + pad(b);
}
```

### گزارش ۷۸ (برنامه)
```js
function parseReport78Schedule(outpar, termHint) {
  const bmT = outpar?.BMt || '';
  if (!bmT || bmT === '<Root></Root>') return { termId: termHint || '', courses: [] };
  const m2Match = bmT.match(/M2="([^"]*)"/);
  if (!m2Match) return { termId: termHint || '', courses: [] };
  const m2Html = String(m2Match[1])
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  if (!m2Html || m2Html.indexOf('<TABLE') === -1) return { termId: termHint || '', courses: [] };

  const body = m2Html.replace(/<\/?THEAD>/gi, '');
  const courseMap = new Map();

  function extractCourseFromTitle(title, day, textHint) {
    const nameM = title.match(/نام درس\s*:\s*(.+?)(?:\s*شماره درس|$)/);
    const codeM = title.match(/شماره درس\s*:\s*(\d+)/);
    const groupM = title.match(/گروه\s*:\s*(\d+)/);
    const timeM = title.match(/ساعت\s*:\s*([0-9:]+\s*-\s*[0-9:]+)/);
    const courseName = normalizeCourseName(
      (nameM ? nameM[1] : cleanHtml(String(textHint || '').split('گروه')[0])).replace(/\s+/g, ' ').trim()
    );
    if (!courseName || !/نام درس/.test(title)) return;
    const code = codeM ? codeM[1] : '';
    const group = groupM ? groupM[1] : '';
    const classTime = timeM ? timeM[1].trim() : '';
    const hallM = textHint ? textHint.match(/محل\s*:\s*(.+?)(?=\s*امتحان|$)/) : null;
    const examM = textHint ? textHint.match(/امتحان\s*:\s*([0-9]{4}\/[0-9]{2}\/[0-9]{2})/) : null;
    const key = code + '|' + group + '|' + courseName;
    if (!courseMap.has(key)) {
      courseMap.set(key, {
        id: code || courseName, code, name: courseName,
        group: group || '۰۱', units: 0, type: 'ـ', professor: 'ـ',
        days: day ? [day] : [],
        time: parseTimeRange(classTime) || 'ـ',
        hall: (hallM ? hallM[1].replace(/\s+/g, ' ').trim() : '') || 'ـ',
        examDate: examM ? examM[1] : 'ـ',
        examTime: '', classTimeRaw: classTime, timeSlotsRaw: classTime ? [classTime] : [],
        isLive: true
      });
    } else {
      const cur = courseMap.get(key);
      if (day && !cur.days.includes(day)) cur.days.push(day);
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
    const title = tm[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    if (!/نام درس/.test(title)) continue;
    let day = '';
    for (let i = dayMarkers.length - 1; i >= 0; i--) {
      if (dayMarkers[i].index < tm.index) { day = dayMarkers[i].day; break; }
    }
    const near = body.slice(tm.index, tm.index + 700).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    extractCourseFromTitle(title, day, near);
  }
  return {
    termId: termHint || '',
    courses: [...courseMap.values()]
  };
}
```

### گزارش ۴۲۸ (امتحان)
```js
function parseReport428Exams(outpar, termHint) {
  const bmT = outpar?.BMt || '';
  if (!bmT || bmT.indexOf('<row') === -1) return { termId: termHint || '', exams: [] };
  const rows = parseBehestanXmlGrid(bmT);
  const exams = rows.map(row => {
    const codeGroup = cleanHtml(row.C1 || '');
    const codeM = codeGroup.match(/(\d{5,})/);
    const when = cleanHtml(row.C5 || '');
    const dateM = when.match(/(\d{4}\/\d{1,2}\/\d{1,2})/);
    const timeM = when.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
    return {
      id: codeM ? codeM[1] : codeGroup,
      code: codeM ? codeM[1] : '',
      name: normalizeCourseName(cleanHtml(row.C2 || '')),
      professor: normalizeCourseName(cleanHtml(row.C3 || '')),
      day: normalizeCourseName(cleanHtml(row.C4 || '')),
      examDate: dateM ? dateM[1] : '',
      examTime: timeM ? timeM[1] + '-' + timeM[2] : when,
      hall: normalizeCourseName(cleanHtml(row.C6 || '')) || 'ـ',
      isLive: true
    };
  }).filter(e => e.name);
  return { termId: termHint || '', exams };
}
```

### F1825
```js
function parseF1825(data) {
  const grids = data?.rset?.grd || [];
  const result = { courses: [], finance: null, transcripts: [], profile: null };
  if (grids[1]?.xml) {
    result.courses = parseBehestanXmlGrid(grids[1].xml).map(row => ({
      code: (row.F3 || '') + (row.F4 || '') + (row.F5 || '') || row.F2 || '',
      name: normalizeCourseName(cleanHtml(row.F1)),
      group: row.F6 || '',
      units: parseInt(row.F7 || '0', 10),
      grade: row.F9 || '',
      status: cleanHtml(row.F10) || 'ثبت شده',
      type: cleanHtml(row.F13) || 'تخصصی',
      tuitionRial: row.F15 || '',
      termId: row.F18 || '',
    })).filter(c => c.name);
  }
  if (grids[2]?.xml) {
    const finRows = parseBehestanXmlGrid(grids[2].xml);
    let latestDebtRial = 0;
    result.finance = {
      termsSummary: finRows.map(row => {
        const numDebt = parseInt(String(row.F9 || row.F13 || '0').replace(/[^\d]/g, '') || '0', 10);
        const totalBill = parseInt(String(row.F7 || '0').replace(/[^\d]/g, ''), 10);
        const totalPaid = parseInt(String(row.F8 || '0').replace(/[^\d]/g, ''), 10);
        if (row.F10 === '4051' || latestDebtRial === 0) latestDebtRial = numDebt;
        return {
          termId: row.F10 || '', termTitle: cleanHtml(row.F11) || ('ترم ' + row.F10),
          totalBillRial: totalBill, totalPaidRial: totalPaid,
          debtRial: numDebt, debtToman: Math.floor(numDebt / 10),
          status: numDebt > 0 ? 'بدهکار' : 'تسویه کامل'
        };
      }),
      totalDebtRial: latestDebtRial,
      totalDebtToman: Math.floor(latestDebtRial / 10),
    };
  }
  let finalGpa = '', finalTotalUnits = 0;
  if (grids[3]?.xml) {
    result.transcripts = parseBehestanXmlGrid(grids[3].xml).map(row => {
      const termGpa = String(row.F12 || '').trim();
      const cumGpa = String(row.F13 || '').trim();
      if (parseInt(row.F4 || '0', 10) > finalTotalUnits) finalTotalUnits = parseInt(row.F4 || '0', 10);
      if (cumGpa) finalGpa = cumGpa;
      return {
        termId: row.F1 || '',
        termGpa: termGpa || 'ـ',
        cumulativeGpa: cumGpa || termGpa,
        passedUnits: parseInt(row.F3 || '0', 10),
        totalPassedUnits: parseInt(row.F4 || '0', 10),
      };
    });
  }
  result.profile = { gpa: finalGpa || 'ـ', totalUnitsPassed: finalTotalUnits };
  return result;
}
```

---

## ۷) الگوی صف سنک (مثل interceptor)

```js
async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
let seq = 800000001;

async function postJson(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    credentials: 'include', // مهم در WebView/صفحه بهستان
  });
  return r.text();
}

// نمونه ViewReport 78
const bmv = '<Root><N id="4" ft="7" fs="0" M="4051" F="4051"/></Root>';
const reqBody = {
  rp: {
    ft: '1', f: '78', seq: String(seq++), subfrm: '0',
    sid: sid, ct: '',
    sp: '{"UsrType":"0","TrmType":"2"}', ut: '0'
  },
  t: ticket, // رشته JSON مثل {"Ticket":"...","IdleTime":5}
  r: { Ra3: '0', BMu: '<Root/>', BMv: bmv, AFek: '1' },
  act: '08', MaxHlp: 200
};
const txt = await postJson(
  'https://behestan.kntu.ac.ir/frm/BAS0237_CMP_ViewReport/BAS0237_CMP_ViewReport.svc/',
  reqBody
);
```

---

## ۸) خروجی مورد انتظار از تو (ای‌آی کمکی)

لطفاً خروج را با این بخش‌ها بنویس:

1. **SUMMARY** — یک بند: کدام گزینه و چرا (ترجیح: WebView Capacitor)
2. **ARCHITECTURE** — لیست فایل‌ها / پلاگین‌ها
3. **IMPLEMENTATION** — کد کامل:
   - پلاگین یا صفحهٔ WebView که بهستان را باز می‌کند
   - JS داخل WebView که بعد از لاگین fetch می‌زند (همان ترتیب بالا)
   - bridge به React (Capacitor `notifyListeners` / `window` / file write)
   - در صورت نیاز: اسکریپت Playwright برای تست لوکال بدون اندروید
4. **DATA_CONTRACT** — شکل JSON که به React می‌رسد:
```json
{
  "studentId": "…",
  "sid": "…",
  "schedule": { "termId": "4051", "courses": [] },
  "transcripts": [],
  "finance": { "totalDebtRial": 0, "termsSummary": [] },
  "exams": [],
  "fetchedAt": 0
}
```
5. **TEST** — دستور اجرا و انتظار
6. **RISKS** — اگر 50216 یا خطای دیگر آمد

### محدودیت‌ها (الزامی)

- بدون سرور مشترک بین کاربران
- بدون ارسال رمز به سرور ما
- بدون flood به بهستان
- ویندوز + Node 22؛ Android Studio تا حد امکان اختیاری
- هر کدی که می‌دهی باید **کامل و قابل کپی** باشد

### فایل‌های موجود در پروژه (برای اطلاع — به دسترسی نداری)

| مسیر | نقش |
|------|-----|
| `W:\sarv dashboard\public\behestanInterceptor.js` | منطق واقعی هوک + سنک + پارسر |
| `W:\sarv dashboard\sso.har` | ترافیک واقعی |
| `W:\sarv dashboard\sarvestan-android\src\services\behestan\` | پارسر/کلاینت/استور موبایل |
| `W:\sarv dashboard\sarvestan-android\scripts\behestan-proxy.mjs` | پراکسی معکوس آزمایشی (شکست‌خورده برای نشست) |

---

**این متن را کامل به ای‌آی دیگر بده. خروجی را برگردان تا پیاده‌سازی کنیم.**
