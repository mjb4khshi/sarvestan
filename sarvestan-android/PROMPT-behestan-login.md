# پرامپت دست‌به‌دست‌ساز: اتصال دیتای بهستان (KNTU Behestan) به اپ موبایل سروستان

## زمینه

**سروستان (Sarvestan)** اپ/داشبورد مدرن برای سامانه بهستان دانشگاه خواجه نصیر است.

- **افزونه Chrome (کار می‌کند):** `W:\sarv dashboard` — `public/behestanInterceptor.js` در MAIN World صفحه بهستان اجرا می‌شود، XHR/fetch را هوک می‌کند و دیتا را از همان صفحهٔ لاگین‌شده می‌گیرد.
- **اپ موبایل (در دست ساخت):** `W:\sarv dashboard\sarvestan-android` — React + Vite، هدف نهایی Capacitor WebView روی اندروید.
- **رکورد شبکه:** `W:\sarv dashboard\sso.har` (لاگین SSO + چند دقیقه استفادهٔ واقعی).

## مسئله

از `localhost` نمی‌توانیم دیتای واقعی بگیریم. هر راهی که امتحان کردیم شکست خورده:

| راه | نتیجه |
|-----|--------|
| رمز + کپچای `loginapi` | برای کاربر جواب نداد / کپچا اشتباه |
| SSO خودکار با Node (فرم Keycloak) | `sid`+`t` برمی‌گردد ولی ViewReport می‌گوید **«نشست كاري شما به پايان رسيده است» (کد 50216)** |
| پراکسی معکوس Vite به `behestan.kntu.ac.ir` | CORS حل شد ولی همان 50216 |
| SPA بهستان روی پروکسی | صفحه سیاه (Angular روی هاست غیر `behestan.kntu.ac.ir` بالا نمی‌آید) |
| Capture کوکی از oauth2 | کمکی نکرد؛ همچنان 50216 |

**افزونه چرا کار می‌کند؟** چون fetch از **همان origin** (`behestan.kntu.ac.ir`) با **کوکی و `localStorage` واقعی** صفحهٔ لاگین‌شده انجام می‌شود. `sid`/`t` به‌تنهایی از بیرون کافی نیست (یا به چیز دیگری bind شده‌اند).

---

## آنچه از `sso.har` و کد افزونه استخراج شده (حقیقت فنی)

### ۱) SSO = Keycloak دانشگاه

```
GET https://sso.kntu.ac.ir/realms/kntu/protocol/openid-connect/auth
  ?client_id=behestan.kntu.ac.ir
  &redirect_uri=https://behestan.kntu.ac.ir/index.html
  &response_type=code
  &scope=openid profile
  &state=...
```

- صفحه فرم: `username` + `password` + `credentialId` + submit `login`
- POST به `login-actions/authenticate?session_code=...`
- ROPC (`grant_type=password` روی token endpoint) **غیرفعال** است → `unauthorized_client`
- پس از موفقیت: redirect به `https://behestan.kntu.ac.ir/index.html?code=...`

### ۲) تأیید code نزد بهستان (همان چیزی که Angular انجام می‌دهد)

```
POST https://behestan.kntu.ac.ir/frmc/Authentication/oauth2/
Content-Type: application/json
Body:
{
  "act": "09",
  "r": {
    "code": "<oauth code>",
    "ticket": "",
    "l": "", "p": "", "d": "0", "c": "",
    "rsc": "112"
  },
  "rp": {}
}
```

پاسخ موفق (از HAR):
- `oaut.rp.sid` → مثلاً `44or4xi3ahhf2rccs2ahiocd`
- `t` → `{"Ticket":"39F57606-...","IdleTime":10}`

کلاینت بعد `sid` را در `localStorage.sid` و `t` را در `localStorage.t` می‌گذارد.

### ۳) درخواست‌های API بعد از لاگین (از HAR)

همه POST به `https://behestan.kntu.ac.ir/frm/...` با `Content-Type: application/json` و **بدون هدر Authorization**.

الگوی `rp` تقریباً ثابت:

```json
{
  "rp": {
    "ft": "0|1",
    "f": "<کد فرم>",
    "seq": "<عدد>",
    "subfrm": "",
    "sid": "<sid>",
    "ct": "",
    "sp": "{\"UsrType\":\"0\",\"TrmType\":\"2\"}",
    "loc": "fa",
    "ut": "0"
  },
  "t": "{\"Ticket\":\"...\",\"IdleTime\":5}",
  "r": { ... },
  "act": "...",
  "MaxHlp": 200
}
```

| سرویس | act | فیلدهای مهم `r` | فرم `f` |
|-------|-----|-----------------|---------|
| `BAS0237_CMP_ViewReport.svc/` | `08` | `Ra3`, `BMu=<Root/>`, `BMv=<Root><N id="4" ft="7" fs="0" M="4051" F="4051"/></Root>`, `AFek=1` | `78` برنامه / `88` ثبت‌نام / `428` امتحان |
| `F1825_PROCESS_STDTOTALINFOTrmStat_BEH.svc/` | `20` | **`AUWo: <شماره دانشجو>`** | `11147` |
| `F1809_PROCESS_STD_Personally_BH.svc/` | `08` | `AUWs: <شماره دانشجو>` | `11141` |
| `F6524_PROCESS_DASHBOARD_BEH.svc/` | `20` یا `24` | `AVsa: <userId>` | `21122` |
| `F1814_PROCESS_STDAllCrs.svc/` | `00` سپس `08` با `AHug` | — | `11126` |
| `sys.svc/` | `nav` | `fid: 11130` یا `21122` | — |

**شماره دانشجو** در HAR مثال: `40417343` (برای F1825/F1809). کاربر فعلی چیزی حدود `087981815` / `0200667981` دارد — باید از پاسخ‌ها یا `localStorage.un` بیاید، نه hardcode.

### ۴) پاسخ API

JSON با:
- `outpar` (فیلدها مثل `BMt` برای گزارش‌ها، `AHug` برای F1814)
- `rset.grd[].xml` گریدهای `<row F1="..." .../>` (F1825)
- `msg.errors` آرایهٔ پیام خطا

**خطای نشست مرده:**
```json
{"msg":{"errors":["کد 50216-1 : نشست كاري شما به پايان رسيده است."], ...}}
```

### ۵) پارسرها (از افزونه)

- **گزارش ۷۸:** فیلد `outpar.BMt` → attribute `M2` → HTML جدول → `TITLE="نام درس:..."` → روز با نزدیک‌ترین هدر روز
- **F1825:** `rset.grd[1].xml` دروس، `grd[2].xml` مالی، `grd[3].xml` معدل ترم
- **عکس:** `outpar.AUWw` با پیشوند `<PHOTO>base64...`

### ۶) چرا از Node/localhost «نشست تمام» می‌شود؟ (فرضیه‌ها برای بررسی)

1. نیاز به **کوکی‌های دامنهٔ behestan** (ASP.NET / مخصوص بهستان) علاوه بر sid/t — در HAR `withCredentials` بوده
2. `sid` به **نشست مرورگر / IP / UA** bind شده
3. بعد از oauth2 باید **بلافاصله** `sys.svc nav` یا همان درخواست‌های اول SPA بخورد تا «کاری» ساخته شود
4. ticket باید همان لحظه با همان کوکی استفاده شود نه بعد از چند ثانیه از یک process دیگر
5. شاید oauth2 از Node پاسخ درست می‌دهد ولی **نشست سمت سرور بهستان** با redirect به `index.html` تثبیت می‌شود، نه فقط با JSON

---

## معماری هدف محصول (تغییر نکرده)

```
React (سروستان موبایل)
  → Capacitor WebView (اندروید)
      → WebView روی behestan.kntu.ac.ir
      → کاربر با SSO خودش لاگین می‌کند
      → اسکریپت/هوک داخل همان WebView (origin بهستان) داده را می‌گیرد
      → ذخیره محلی + UI + ویجت
```

**ضدبن:** سریالی، تأخیر ۳۰۰–۷۰۰ms، بدون سرور واسط اشتراکی، IP کاربر.

---

## چه چیزی از تو (ای‌آی کمکی) می‌خواهیم

یکی از این‌ها یا ترکیب‌شان را **با کد کامل و قابل اجرا** پیشنهاد بده:

### گزینه A — راه حل واقعی موبایل (ترجیح)
پیاده‌سازی **Capacitor** با:
1. WebView ثانویه یا navigation اصلی روی `behestan.kntu.ac.ir`
2. لاگین SSO کاربر در همان WebView
3. `evaluateJavascript` برای خواندن `localStorage.sid/t/un` و/یا اجرای همان fetch های جدول بالا **از داخل WebView** (same-origin)
4. ارسال JSON نتیجه به اپ React از طریق `window.flutter_inappwebview` / `Capacitor` bridge / `postMessage`
5. همان پارسرهای ۷۸/۸۸/۴۲۸/F1825 که در افزونه هست

### گزینه B — اگر راه بدون WebView ممکن است
اگر واقعاً **بدون WebView** می‌شود از بیرون API زد، بگو **دقیقاً** چه چیزی در HAR/افزونه جا افتاده (کوکی، header، ترتیب درخواست، nonce، …) و کد Node/Puppeteer/Playwright با profile مرورگر واقعی که نشست را نگه می‌دارد.

### گزینه C — مسیر تست لوکال بدون اندروید
ابزار CLI که مرورگر واقعی (Playwright persistent context) را باز می‌کند، کاربر یک‌بار لاگین می‌کند، اسکریپت‌های F1825/78 را اجرا می‌کند و JSON را در `sarvestan-android/.behestan-live.json` می‌نویسد؛ اپ از همان فایل می‌خواند. (برای توسعه، نه تولید)

---

## محدودیت‌ها

- **بدون** سرور مشترک بین کاربران
- **بدون** ارسال رمز کاربر به سرور ما
- **بدون** بن / flood به بهستان
- فارسی، RTL، همان توکن‌های Sarv UI
- هدف: دیتای واقعی دانشجو فقط از حساب خودش

---

## خروجی مورد انتظار از تو (ای‌آی کمکی)

لطفاً خروج را با **این بخش‌ها** بنویس تا توسعه‌دهندهٔ سروستان بتواند مستقیم پیاده کند:

1. **SUMMARY** — یک بند: کدام گزینه و چرا
2. **ARCHITECTURE** — نمودار/لیست فایل‌هایی که ساخته یا تغییر می‌دهی
3. **IMPLEMENTATION** — کد کامل فایل‌های جدید (مثلاً Capacitor plugin، Playwright script، یا interceptor جدید)
4. **DATA_CONTRACT** — شکل JSON خروجی که به React می‌رسد (مثلاً `{ studentId, schedule: { termId, courses[] }, finance, ... }`)
5. **TEST** — دقیقاً چطور تست کنیم (دستور اجرا + انتظار)
6. **RISKS** — اگر 50216 باز هم آمد چه کنیم

**مهم:** کد باید روی ویندوز، Node 22، بدون Android Studio (تا حد امکان) قابل اجرا باشد. اگر WebView/Capacitor لازم است، بگو دقیقاً کدام افزونه/پلاگین و چرا.

---

## فایل‌های مرجع در سیستم

| فایل | نقش |
|------|-----|
| `W:\sarv dashboard\public\behestanInterceptor.js` | منطق واقعی هوک + سنک + پارسر |
| `W:\sarv dashboard\sso.har` | ترافیک واقعی لاگین و API |
| `W:\sarv dashboard\sarvestan-android\src\services\behestan\` | پارسر/کلاینت/استور فعلی موبایل |
| `W:\sarv dashboard\sarvestan-android\scripts\parse-sso-*.mjs` | اسکریپت‌های تحلیل HAR |

این پرامپت را به ای‌آی دیگر بده. خروجی را کامل اینجا برگردان تا پیاده‌سازی کنیم.
