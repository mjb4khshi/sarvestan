import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, BookOpen, Feather, Megaphone } from 'lucide-react';
import SarvSwitch from './SarvSwitch';
import { toggleChannelSubscription } from '../services/feedService';

export default function ChannelSubscribeModal({ isOpen, onClose, channels = [], subscribedIds = [] }) {
  const subscribedSet = new Set(subscribedIds);

  const handleToggle = (channelId) => {
    toggleChannelSubscription(channelId);
  };

  const getChannelMeta = (id) => {
    switch (id) {
      case 'announcements':
        return {
          icon: <Megaphone className="w-4.5 h-4.5" />,
          variant: 'warn',
          activeBg: 'bg-warn-soft/50 border-warn/40',
          iconBg: 'bg-warn text-warn-content',
        };
      case 'shernameh':
        return {
          icon: <Feather className="w-4.5 h-4.5" />,
          variant: 'secondary',
          activeBg: 'bg-secondary-soft/50 border-secondary/40',
          iconBg: 'bg-secondary text-secondary-content',
        };
      case 'sarvnameh':
      default:
        return {
          icon: <BookOpen className="w-4.5 h-4.5" />,
          variant: 'primary',
          activeBg: 'bg-primary-soft/50 border-primary/40',
          iconBg: 'bg-primary text-primary-content',
        };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* پس‌زمینه محو و تاریک */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* پنل مودال با ترنزیشن نرم اسپرینگ */}
          <motion.div
            initial={{ y: '100%', opacity: 0.4 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.4 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-4 sm:p-5 shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* دستگیره برای موبایل */}
            <div className="w-12 h-1.5 rounded-full bg-base-500/60 mx-auto mb-3 sm:hidden" />

            {/* هدر مودال */}
            <div className="flex items-center justify-between pb-3.5 border-b border-base-500/30 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-primary-soft text-primary grid place-items-center shadow-sm">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-base-content">
                    کانال‌ها و اشتراک خبرنامه
                  </h3>
                  <p className="text-[11px] text-neutral">
                    انتخاب بخش‌های فعال در داشبورد سروستان
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center transition-colors cursor-pointer"
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* متن راهنما و لیست کانال‌ها */}
            <div className="py-3.5 space-y-3 overflow-y-auto no-scrollbar flex-1">
              <p className="text-[11.5px] text-neutral leading-relaxed">
                موضوعات دلخواه خود را برای دریافت نوشته‌ها، شعرها و اطلاعیه‌ها فعال کنید:
              </p>

              <div className="space-y-2.5">
                {channels.map((ch) => {
                  const isSubscribed = subscribedSet.has(ch.id);
                  const meta = getChannelMeta(ch.id);

                  return (
                    <motion.div
                      key={ch.id}
                      layout
                      transition={{ duration: 0.18 }}
                      onClick={() => handleToggle(ch.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSubscribed
                          ? `${meta.activeBg} shadow-xs`
                          : 'border-base-500/30 bg-base-500/10 opacity-70 hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 transition-colors ${
                            isSubscribed ? meta.iconBg : 'bg-base-500/30 text-neutral'
                          }`}
                        >
                          {meta.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-[13px] font-bold text-base-content">{ch.name}</h4>
                            {ch.badge && (
                              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-base-500/25 text-base-content border border-base-500/30">
                                {ch.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral mt-0.5 line-clamp-2 leading-relaxed">
                            {ch.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        <SarvSwitch
                          checked={isSubscribed}
                          onChange={() => handleToggle(ch.id)}
                          size="sm"
                          variant={meta.variant}
                          aria-label={`اشتراک ${ch.name}`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* فوتر مودال */}
            <div className="pt-3 border-t border-base-500/30 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl bg-primary text-primary-content font-bold text-[13px] shadow-sm hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
              >
                تایید و بستن
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
