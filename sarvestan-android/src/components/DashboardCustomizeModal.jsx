import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  X,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Check,
  User,
  Clock,
  LayoutGrid,
  BookOpen,
  BarChart2,
  Calendar,
  Flame,
  Megaphone,
  Eye,
  EyeOff,
  ListTodo,
} from 'lucide-react';
import {
  DEFAULT_WIDGETS,
  getDashboardWidgetsConfig,
  saveDashboardWidgetsConfig,
  resetDashboardWidgetsConfig,
} from '../services/dashboardWidgets';

const ICON_MAP = {
  User,
  Clock,
  LayoutGrid,
  BookOpen,
  BarChart2,
  Calendar,
  Flame,
  Megaphone,
  ListTodo,
};

export default function DashboardCustomizeModal({ isOpen, onClose }) {
  const [widgets, setWidgets] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setWidgets(getDashboardWidgetsConfig());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const moveUp = (index) => {
    if (index <= 0) return;
    const next = [...widgets];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setWidgets(next);
    saveDashboardWidgetsConfig(next);
  };

  const moveDown = (index) => {
    if (index >= widgets.length - 1) return;
    const next = [...widgets];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setWidgets(next);
    saveDashboardWidgetsConfig(next);
  };

  const toggleWidget = (id) => {
    const next = widgets.map((w) => {
      if (w.id === id) {
        return { ...w, enabled: !w.enabled };
      }
      return w;
    });
    setWidgets(next);
    saveDashboardWidgetsConfig(next);
  };

  const handleReset = () => {
    const def = resetDashboardWidgetsConfig();
    setWidgets(def);
  };

  const handleClose = () => {
    saveDashboardWidgetsConfig(widgets);
    onClose();
  };

  const content = (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />

      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.5 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative z-10 w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-4 sm:p-5 shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* نوار کشویی برای موبایل */}
        <div className="w-12 h-1.5 rounded-full bg-base-500/60 mx-auto mb-3 sm:hidden" />

        {/* هدر مودال */}
        <div className="flex items-center justify-between pb-3 border-b border-base-500/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary-soft text-primary grid place-items-center shadow-sm">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-base-content">شخصی‌سازی میزکار</h3>
              <p className="text-[11px] text-neutral">تغییر ترتیب و نمایش یا عدم نمایش ویجت‌ها در میزکار</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* لیست ویجت‌ها با دکمه‌های جابه‌جایی و فعال‌سازی */}
        <div className="overflow-y-auto flex-1 no-scrollbar py-3 space-y-2.5">
          {widgets.map((widget, idx) => {
            const Icon = ICON_MAP[widget.icon] || LayoutGrid;
            const isEnabled = widget.enabled !== false;

            return (
              <motion.div
                key={widget.id}
                layout
                transition={{ duration: 0.2 }}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                  isEnabled
                    ? 'bg-base-200/50 border-base-500/60 shadow-sm'
                    : 'bg-base-200/20 border-base-500/30 opacity-60'
                }`}
              >
                {/* دکمه‌های جابه‌جایی به بالا و پایین */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="w-7 h-7 rounded-lg bg-base-500/30 hover:bg-base-500/70 text-base-content grid place-items-center disabled:opacity-20 disabled:hover:bg-base-500/30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    title="انتقال به بالا"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={idx === widgets.length - 1}
                    className="w-7 h-7 rounded-lg bg-base-500/30 hover:bg-base-500/70 text-base-content grid place-items-center disabled:opacity-20 disabled:hover:bg-base-500/30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    title="انتقال به پایین"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* آیکون و مشخصات ویجت */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${
                      isEnabled ? 'bg-primary-soft text-primary' : 'bg-base-500/30 text-neutral'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-[13px] font-bold truncate ${
                        isEnabled ? 'text-base-content' : 'text-neutral'
                      }`}
                    >
                      {widget.title}
                    </h4>
                    <p className="text-[10.5px] text-neutral truncate mt-0.5">
                      {widget.description}
                    </p>
                  </div>
                </div>

                {/* سوئیچ نمایش / عدم نمایش */}
                <button
                  type="button"
                  onClick={() => toggleWidget(widget.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                    isEnabled
                      ? 'bg-success-soft text-success border border-success/30'
                      : 'bg-base-500/30 text-neutral border border-base-500/40'
                  }`}
                  title={isEnabled ? 'مخفی کردن از میزکار' : 'نمایش در میزکار'}
                >
                  {isEnabled ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>فعال</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>مخفی</span>
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* فوتر مودال: دکمه بازنشانی و دکمه تایید */}
        <div className="pt-3 border-t border-base-500/30 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-ghost !py-2 !px-3 text-[12px] font-bold text-neutral hover:text-base-content flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی پیش‌فرض</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="btn btn-primary !py-2 !px-5 text-[12px] font-bold shadow-md flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>تایید و ذخیره</span>
          </button>
        </div>
      </motion.div>
    </div>
  );

  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
}
