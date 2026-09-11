<div align="center">

# <img src="docs/banner.png" alt="Sarvestan Banner" width="100%" />

**سروستان | Sarvestan**  
داشبورد مدرن و زیبا برای سامانه **بهستان** دانشگاه صنعتی خواجه‌نصیرالدین طوسی

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](chrome://extensions)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Sarv UI](https://img.shields.io/badge/Design-Sarv%20UI-10b981?style=flat-square)](https://github.com/mjb4khshi/sarv-ui)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

افزونه‌ای برای **بازطراحی** رابط کاربری بهستان: کارنامه، برنامه هفتگی، امور مالی، چارت دروس و پیگیری درخواست‌ها — بدون دیتای هاردکد، فقط از سرویس‌های زنده بهستان.

</div>

---

## ✨ امکانات

| بخش | توضیح |
|-----|--------|
| **میز کار** | معدل، واحد، بدهی، کلاس‌های امروز |
| **کارنامه** | نمرات ترم‌ها + شبیه‌ساز معدل |
| **برنامه هفتگی** | ماتریس/ستون روزها (گزارش ۷۸ و ۸۸) |
| **کارت آزمون** | گزارش ۴۲۸ (وقتی در بهستان منتشر شود) |
| **امور مالی** | ریزتراز، رسید چاپی، ارجاع پرداخت به بهستان رسمی |
| **چارت دروس** | وضعیت دروس از `F1825` + `F1814` (بدون هاردکد رشته) |
| **درخواست‌ها** | گردش‌کارهای واقعی از `F6524` |
| **دیزاین سرو** | تم چندگانه، انیمیشن Framer، RTL |

---

## 📦 نصب برای کاربر نهایی

1. فایل zip انتشار را دانلود و unzip کنید  
2. `chrome://extensions` → فعال‌کردن **Developer mode**  
3. **Load unpacked** → پوشه‌ای که `manifest.json` دارد (معمولاً `dist`)  
4. [behestan.kntu.ac.ir](https://behestan.kntu.ac.ir/) را باز کنید و لاگین کنید  
5. چند ثانیه صبر کنید تا همگام‌سازی آرام انجام شود  

یا از بخش **Releases** همین ریپو فایل آخر را بگیرید.

---

## 🛠 توسعه

```bash
npm install
npm run build     # خروجی در dist/
npm run dev       # پیش‌نمایش وب (بدون افزونه)
```

بسته‌بندی zip برای تستر/انتشار:

```powershell
powershell -File scripts/pack-extension.ps1
```

### ساختار مهم

```text
public/          ← manifest, content script, interceptor, آیکون
src/             ← React dashboard (ماژول‌ها، سرویس‌ها، سرو UI)
dist/            ← خروجی build (افزونه آماده)
scripts/         ← ابزارهای تحلیل/پک
docs/            ← بنر و مستندات
```

---

## ⚙️ چطور داده می‌گیرد؟

افزونه فقط داده‌های **خود کاربر** را از APIهای بهستان می‌خواند (با کلیک یا همگام‌سازی آرام):

- `F1825` — کارنامه، نمرات، مالی  
- `F1809` — عکس پرسنلی  
- `F6524` — گردش‌کار / پیشخوان  
- `F1814` — خلاصه وضعیت دروس  
- گزارش‌های `78` / `88` / `428`  

**هیچ اطلاعات شخصی در کد هاردکد نیست.**  
پرداخت شهریه فقط در بهستان رسمی انجام می‌شود.

---

## 🎨 دیزاین‌سیستم

رابط با [**Sarv UI**](https://github.com/mjb4khshi/sarv-ui) ساخته شده: تم‌های پرشین لایت/دارک، کارت‌ها، بج و اینپوت‌های رسمی سرو.

---

## 📄 لایسنس

[MIT](LICENSE)

---

<div align="center">
  <sub>
    ساخته‌شده با چای زیاد و حوصله توسط
    <a href="https://github.com/mjb4khshi"><strong>@mjb4khshi</strong></a>
    · محمدجواد بخشی ایرج
  </sub>
</div>
