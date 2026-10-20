import React, { useState } from 'react';
import { Download, Monitor, Terminal, Check, Copy, ShieldCheck } from 'lucide-react';

function GithubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

/**
 * راهنمای جامع و رسمی نصب و فعال‌سازی افزونه مرورگر کرومیوم سروستان (رومیزی)
 */
export default function ExtensionArchiveGuide() {
  const [copiedBrowser, setCopiedBrowser] = useState(null);

  const handleCopyUrl = (url, id) => {
    navigator.clipboard?.writeText(url);
    setCopiedBrowser(id);
    setTimeout(() => setCopiedBrowser(null), 2500);
  };

  return (
    <div className="space-y-6 text-right">
      {/* گام ۱ */}
      <div className="sarv-card p-6 rounded-2xl flex flex-col sm:flex-row items-start gap-4 border-primary/30">
        <div className="w-10 h-10 rounded-xl bg-primary text-primary-content font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
          ۱
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-base text-base-content">دانلود فایل افزونه و استخراج (Unzip)</h3>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/mjb4khshi/sarvestan/releases/latest"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-xl border border-base-500/30 text-neutral hover:text-primary text-xs font-bold flex items-center gap-1 transition-all"
                title="مشاهده پکیج‌های انتشار در گیت‌هاب"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>پکیج‌های ریلیز گیت‌هاب</span>
              </a>
              <a
                href="https://github.com/mjb4khshi/sarvestan/releases/latest/download/sarvestan-extension.zip"
                download
                className="px-3 py-1.5 rounded-xl bg-primary text-primary-content text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود sarvestan-extension.zip</span>
              </a>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-neutral leading-relaxed">
            فایل فشرده <code className="bg-base-500/30 px-1.5 py-0.5 rounded text-primary font-mono text-xs">sarvestan-extension.zip</code> را دانلود کرده و آن را درون یک پوشه مشخص در رایانه خود Extract کنید.
          </p>
        </div>
      </div>

      {/* گام ۲ */}
      <div className="sarv-card p-6 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-accent text-accent-content font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-accent/20">
          ۲
        </div>
        <div className="flex-1 w-full">
          <h3 className="font-bold text-base mb-2 text-base-content">
            باز کردن بخش مدیریت افزونه‌ها (Manage Extensions)
          </h3>
          <p className="text-xs sm:text-sm text-neutral leading-relaxed mb-3">
            برای ورود به صفحه افزونه‌ها در مرورگر خود، از یکی از دو روش زیر استفاده کنید:
          </p>

          {/* روش اول */}
          <div className="p-3.5 rounded-xl bg-base-500/15 border border-base-500/30 mb-3">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-base-content mb-2">
              <span>روش اول (از طریق منوی مرورگر):</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-base-500/25 border border-base-500/40 text-base-content font-medium">
                <span>۱. کلیک روی آیکون افزونه‌ها</span>
                <strong className="text-primary font-bold">Extensions</strong>
              </span>
              <span className="text-neutral/60">←</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-base-500/25 border border-base-500/40 text-base-content font-medium">
                <span>۲. انتخاب گزینه</span>
                <strong className="text-accent font-bold">Manage extensions</strong>
              </span>
            </div>
          </div>

          {/* روش دوم */}
          <div className="p-3.5 rounded-xl bg-base-500/15 border border-base-500/30 mb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-base-content">
                <Terminal className="w-4 h-4 text-primary" />
                <span>روش دوم (ورود آدرس اختصاصی در نوار آدرس):</span>
              </div>
              <span className="text-[11px] text-neutral hidden sm:inline">جهت کپی روی آدرس کلیک کنید</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'chrome', name: 'Google Chrome', url: 'chrome://extensions' },
                { id: 'edge', name: 'Microsoft Edge', url: 'edge://extensions' },
                { id: 'brave', name: 'Brave Browser', url: 'brave://extensions' },
                { id: 'opera', name: 'Opera / GX', url: 'opera://extensions' }
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleCopyUrl(b.url, b.id)}
                  className="flex items-center justify-between p-2 rounded-lg bg-base-500/20 hover:bg-base-500/35 border border-base-500/30 transition-all text-right group cursor-pointer"
                  title="برای کپی آدرس کلیک کنید"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-neutral group-hover:text-base-content transition-colors">
                      {b.name}:
                    </span>
                    <code className="text-xs font-mono font-bold text-primary dir-ltr">
                      {b.url}
                    </code>
                  </div>
                  <span className="text-[10px] text-neutral/80 group-hover:text-primary transition-colors flex items-center gap-1 shrink-0 mr-2">
                    {copiedBrowser === b.id ? (
                      <>
                        <Check className="w-3 h-3 text-success" />
                        <span className="text-success font-bold">کپی شد</span>
                      </>
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* فعال‌سازی Developer mode */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-warn/10 border border-warn/25 text-xs text-neutral">
            <div className="leading-relaxed">
              <strong className="text-base-content font-bold">مرحله نهایی گام ۲:</strong> در گوشه بالا سمت راست (یا بالا چپ بسته به زبان مرورگر)، کلید <strong className="text-warn font-bold">Developer mode</strong> (حالت توسعه‌دهنده) را <span className="text-success font-bold">روشن</span> کنید تا دکمه Load unpacked در مرحله بعد نمایان شود.
            </div>
          </div>
        </div>
      </div>

      {/* گام ۳ */}
      <div className="sarv-card p-6 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-success text-success-content font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-success/20">
          ۳
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base mb-1 text-base-content">بارگذاری در حالت توسعه (Load unpacked)</h3>
          <p className="text-xs sm:text-sm text-neutral leading-relaxed">
            روی دکمه <strong className="text-base-content font-bold">Load unpacked</strong> در بالای صفحه افزونه‌ها کلیک کنید و فولدری که در گام اول استخراج کردید را انتخاب کنید. افزونه سروستان نصب شده و با ورود به بهستان فعال می‌شود.
          </p>
        </div>
      </div>
    </div>
  );
}
