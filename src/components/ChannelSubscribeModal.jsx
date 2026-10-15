import { X, Check, Bell, BookOpen, Feather, Megaphone } from 'lucide-react';
import { toggleChannelSubscription } from '../services/feedService';

export default function ChannelSubscribeModal({ isOpen, onClose, channels = [], subscribedIds = [] }) {
  if (!isOpen) return null;

  const subscribedSet = new Set(subscribedIds);

  const handleToggle = (channelId) => {
    toggleChannelSubscription(channelId);
  };

  const getChannelMeta = (id) => {
    switch (id) {
      case 'announcements':
        return {
          icon: <Megaphone className="w-4 h-4" />,
          cardActive: 'border-warn/40 bg-warn-soft/60',
          btnActive: 'bg-warn text-warn-content',
        };
      case 'shernameh':
        return {
          icon: <Feather className="w-4 h-4" />,
          cardActive: 'border-secondary/40 bg-secondary-soft/60',
          btnActive: 'bg-secondary text-secondary-content',
        };
      case 'sarvnameh':
      default:
        return {
          icon: <BookOpen className="w-4 h-4" />,
          cardActive: 'border-primary/40 bg-primary-soft/60',
          btnActive: 'bg-primary text-primary-content',
        };
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-base rounded-3xl border border-base-500/30 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* هدر */}
        <div className="p-4 border-b border-base-500/20 flex items-center justify-between gap-3 bg-base-200/50">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
              <Bell className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-[14px] font-black text-base-content">
                کانال‌ها و اشتراک خبرنامه
              </h3>
              <p className="text-[10.5px] text-neutral">
                انتخاب بخش‌های فعال در داشبورد
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-base-500/20 text-neutral hover:text-base-content grid place-items-center cursor-pointer transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* لیست کانال‌ها */}
        <div className="p-4 space-y-3">
          <p className="text-[11.5px] text-neutral leading-relaxed">
            موضوعات دلخواه خود را برای دریافت نوشته‌ها و اعلانات فعال کنید:
          </p>

          <div className="space-y-2">
            {channels.map((ch) => {
              const isSubscribed = subscribedSet.has(ch.id);
              const meta = getChannelMeta(ch.id);

              return (
                <div
                  key={ch.id}
                  onClick={() => handleToggle(ch.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSubscribed
                      ? meta.cardActive
                      : 'border-base-500/30 bg-base-500/10 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 mt-0.5 ${
                        isSubscribed ? meta.btnActive : 'bg-base-500/30 text-neutral'
                      }`}
                    >
                      {meta.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-[13px] font-bold text-base-content">{ch.name}</h4>
                        {ch.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-base text-base-content border border-base-500/30">
                            {ch.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral mt-0.5 line-clamp-2 leading-relaxed">
                        {ch.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`w-7 h-7 rounded-xl grid place-items-center shrink-0 transition-all ${
                      isSubscribed ? `${meta.btnActive} shadow-xs` : 'bg-base-500/30 text-neutral'
                    }`}
                  >
                    {isSubscribed ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* فوتر */}
        <div className="p-3 border-t border-base-500/20 bg-base-200/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-content font-bold text-[12.5px] cursor-pointer"
          >
            تایید و بستن
          </button>
        </div>
      </div>
    </div>
  );
}
