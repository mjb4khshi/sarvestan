import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Landmark,
  GraduationCap,
} from 'lucide-react';
import {
  UNIVERSITIES,
  getSelectedUniversity,
  setSelectedUniversity,
  getUniversityOrigin,
  getAssetUrl,
} from '../services/behestan/session';
import { openBehestanPage, checkExtensionSync } from '../services/extensionBridge';
import { useSarvestanData } from '../hooks/useSarvestanData';

/**
 * گیت اتصال اختصاصی افزونه — بدون فرم، بدون رمز، بدون هیچ fetch از سمت داشبورد
 * جریان: کاربر در تب سامانه دانشگاه لاگین می‌کند ← اینترسپتور نشست و گزارش‌ها را
 * از همان origin می‌خواند ← chrome.storage ← داشبورد خودکار پر می‌شود.
 */
export default function ExtensionConnectGate() {
  const { live, profile } = useSarvestanData();
  const [uni, setUni] = useState(() => getSelectedUniversity());
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState(null);

  const uniList = UNIVERSITIES.filter((u) => !u.disabled);
  const current = UNIVERSITIES.find((u) => u.id === uni) || uniList[0];

  // داده‌ای از تب‌های دانشگاه رسیده؟ داشبورد را بازی کن
  if (live || profile?.isLoggedIn) return null;

  const pickUni = (id) => {
    setUni(id);
    setSelectedUniversity(id);
    setMessage(null);
  };

  const checkConnection = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const res = await checkExtensionSync({ bypassThrottle: true });
      if (res?.ok) {
        setMessage({ type: 'success', text: 'نشست فعال شناسایی شد — داده‌ها در حال بارگیری هستند…' });
      } else if (Number(res?.staleTabs) > 0 || Number(res?.responders) === 0) {
        setMessage({
          type: 'warn',
          text: 'تب سامانه باز است ولی اسکریپت افزونه در آن فعال نشده — یک بار صفحهٔ سامانه دانشگاه را رفرش (F5) کن و دوباره بررسی کن.',
        });
      } else if (Number(res?.tabs) > 0) {
        setMessage({ type: 'warn', text: 'در تب سامانه وارد نشده‌ای — از دکمهٔ «ورود به سامانه» لاگین کن و بعد «بررسی اتصال» را بزن.' });
      } else {
        setMessage({
          type: 'warn',
          text: 'هیچ تب سامانه‌ای باز نیست. ابتدا وارد سامانه دانشگاه شو؛ سپس این صفحه به‌طور خودکار داده را می‌خواند.',
        });
      }
    } catch (e) {
      setMessage({ type: 'warn', text: String(e?.message || e) });
    } finally {
      setChecking(false);
    }
  };

  // یک بررسی خودکار هنگام باز شدن داشبورد
  useEffect(() => {
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // اگر داده در حین نبودِ گیت برسد، useSarvestanData رندر جدید می‌دهد و گیت محو می‌شود
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="sarv-card p-6 w-full max-w-md space-y-5 shadow-2xl"
      >
        {/* هدر */}
        <div className="flex flex-col items-center gap-2 text-center">
          <img
            src={getAssetUrl('sarv-icon.svg')}
            alt="سروستان"
            className="w-16 h-16 rounded-3xl object-contain shadow-lg ring-2 ring-primary/30 bg-base"
          />
          <h1 className="text-[20px] font-black text-base-content">سروستان</h1>
          <p className="text-[11.5px] text-neutral leading-relaxed">
            ابتدا در سامانه دانشگاه خود لاگین کنید؛ نشست و داده‌ها پس از ورود
            <span className="text-primary font-semibold"> خودکار </span>
            خوانده می‌شوند
          </p>
        </div>

        {/* انتخاب دانشگاه — بدون فرم لاگین */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral px-1">
            <GraduationCap className="w-4 h-4" />
            <span>دانشگاه خود را انتخاب کنید</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {uniList.map((u) => {
              const active = u.id === uni;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => pickUni(u.id)}
                  className={`p-2.5 rounded-2xl border flex items-center gap-2 text-right transition-all outline-none active:scale-[0.99] cursor-pointer ${
                    active
                      ? 'bg-primary/12 border-primary/50 ring-1 ring-primary/40'
                      : 'bg-base-500/15 border-base-500/30 hover:bg-base-500/25'
                  }`}
                >
                  <img
                    src={u.logo}
                    alt={u.name}
                    className="w-8 h-8 rounded-xl bg-white p-1 border border-black/5 object-contain shrink-0 shadow-xs"
                  />
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-bold text-base-content truncate">{u.shortName}</p>
                    <p className="text-[9px] text-neutral truncate">{u.systemName}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* اکشن‌ها */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => openBehestanPage(uni)}
            className="w-full py-2.5 px-3 rounded-xl bg-primary text-primary-content text-[12px] font-bold flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>ورود به سامانه</span>
          </button>
          <button
            type="button"
            onClick={checkConnection}
            disabled={checking}
            className="w-full py-2.5 px-3 rounded-xl bg-base-500/30 hover:bg-base-500/50 text-base-content text-[12px] font-bold flex items-center justify-center gap-1.5 border border-base-500/40 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${checking ? 'animate-spin text-primary' : ''}`} />
            <span>بررسی اتصال</span>
          </button>
        </div>

        {/* پیام وضعیت */}
        {message && (
          <div
            className={`flex items-start gap-2 p-3 rounded-2xl text-[11.5px] font-medium animate-fade-in ${
              message.type === 'success'
                ? 'bg-success/10 text-success border border-success/25'
                : 'bg-warn/10 text-warn border border-warn/25'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{message.text}</span>
          </div>
        )}

        {/* راهنما */}
        <div className="flex items-center gap-2 pt-1 border-t border-base-500/20">
          <Landmark className="w-3.5 h-3.5 text-neutral shrink-0" />
          <p className="text-[9.8px] text-neutral leading-relaxed">
            سامانه فعلی: <span className="font-bold text-base-content">{current.systemName}</span>
            <span className="font-mono text-[8.5px] opacity-70 ms-1">
              ({new URL(getUniversityOrigin(uni)).host})
            </span>
            <br />
            هیچ نام کاربری یا رمزی در افزونه وارد نمی‌شود — اتصال فقط از نشست رسمی دانشگاه
          </p>
        </div>
      </motion.div>
    </div>
  );
}
