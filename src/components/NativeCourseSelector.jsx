import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, Check, X, Sparkles, Search } from 'lucide-react';
import { toFaDigits } from '../utils/faDigits';
import { getToneForCourse } from '../data/viewModel';

export const toneColors = {
  primary: {
    bg: 'bg-primary-soft',
    text: 'text-primary',
    border: 'border-primary/40',
    dot: 'bg-primary',
  },
  info: {
    bg: 'bg-info-soft',
    text: 'text-info',
    border: 'border-info/40',
    dot: 'bg-info',
  },
  success: {
    bg: 'bg-success-soft',
    text: 'text-success',
    border: 'border-success/40',
    dot: 'bg-success',
  },
  warn: {
    bg: 'bg-warn-soft',
    text: 'text-warn',
    border: 'border-warn/40',
    dot: 'bg-warn',
  },
  accent: {
    bg: 'bg-accent-soft',
    text: 'text-accent',
    border: 'border-accent/40',
    dot: 'bg-accent',
  },
  secondary: {
    bg: 'bg-secondary-soft',
    text: 'text-secondary',
    border: 'border-secondary/40',
    dot: 'bg-secondary',
  },
  danger: {
    bg: 'bg-danger-soft',
    text: 'text-danger',
    border: 'border-danger/40',
    dot: 'bg-danger',
  },
};

/**
 * سلکتور کاملاً نیتیو و مدرن دروس با باتم‌شیت اختصاصی سروستان
 */
export default function NativeCourseSelector({
  value,
  onChange,
  courses = [],
  modalTitle = 'انتخاب درس',
  subLabel = null,
  allowGeneral = false,
  placeholder = 'انتخاب درس...',
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCourseObj = useMemo(() => {
    return courses.find((c) => (c.name || c.title || c.course) === value);
  }, [courses, value]);

  const tone = selectedCourseObj
    ? selectedCourseObj.color || getToneForCourse(selectedCourseObj, courses)
    : 'primary';
  const colorMeta = toneColors[tone] || toneColors.primary;

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const q = searchQuery.trim().toLowerCase();
    return courses.filter((c) => {
      const name = String(c.name || c.title || c.course || '').toLowerCase();
      const code = String(c.code || '').toLowerCase();
      const prof = String(c.professor || c.instructor || '').toLowerCase();
      return name.includes(q) || code.includes(q) || prof.includes(q);
    });
  }, [courses, searchQuery]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSearchQuery('');
          setOpen(true);
        }}
        className="w-full p-2.5 rounded-xl bg-base-500/15 hover:bg-base-500/25 border border-base-500/30 text-right flex items-center justify-between gap-2.5 transition-all active:scale-[0.99] cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 text-xs font-bold ${
              value === 'عمومی'
                ? 'bg-base-500/35 text-neutral'
                : `${colorMeta.bg} ${colorMeta.text}`
            }`}
          >
            {value === 'عمومی' ? (
              <Sparkles className="w-3.5 h-3.5" />
            ) : (
              <span className={`w-2.5 h-2.5 rounded-full ${colorMeta.dot}`} />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[12.5px] font-bold text-base-content truncate leading-snug">
              {value ? (value === 'عمومی' ? 'مطالعه عمومی و آزاد' : value) : placeholder}
            </p>
            {subLabel && <p className="text-[10px] text-neutral truncate">{subLabel}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedCourseObj?.units != null && Number(selectedCourseObj.units) > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-base-500/35 text-neutral font-mono">
              {toFaDigits(selectedCourseObj.units)} واحد
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-neutral transition-transform duration-200 ${
              open ? 'rotate-180 text-primary' : ''
            }`}
          />
        </div>
      </button>

      {/* باتم‌شیت نیتیو انتخاب درس */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpen(false)}
                  className="absolute inset-0 bg-black/70 backdrop-blur-xs"
                />

                <motion.div
                  initial={{ y: '100%', opacity: 0.5 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0.5 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  className="relative z-10 w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 pt-3 pb-8 px-4 sm:p-5 shadow-2xl max-h-[82vh] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* هندل بالایی باتم شیت */}
                  <div className="w-10 h-1 rounded-full bg-base-500/50 mx-auto mb-3 shrink-0" />

                  <div className="flex items-center justify-between pb-3 border-b border-base-500/30 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-black text-base-content truncate leading-normal">
                          {modalTitle}
                        </h3>
                        <p className="text-[10.5px] text-neutral truncate">
                          انتخاب درس از برنامه ({toFaDigits(courses.length)} عنوان)
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center active:scale-95 transition shrink-0 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* جستجوگر سریع در صورت بالا بودن تعداد دروس */}
                  {courses.length > 4 && (
                    <div className="pt-2.5 shrink-0">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="جستجوی نام، کد درس یا استاد..."
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-base-500/15 border border-base-500/30 text-xs font-bold text-base-content outline-none focus:border-primary transition"
                        />
                        <Search className="w-3.5 h-3.5 text-neutral absolute right-2.5 top-3 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  <div className="overflow-y-auto py-2.5 space-y-1.5 flex-1 pr-0.5 mt-1">
                    {/* گزینه مطالعه عمومی در صورت نیاز */}
                    {allowGeneral && (
                      <button
                        type="button"
                        onClick={() => {
                          onChange('عمومی', null);
                          setOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-right flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer ${
                          value === 'عمومی'
                            ? 'bg-primary-soft border-primary text-primary font-bold shadow-xs'
                            : 'bg-base-500/15 border-base-500/30 text-base-content hover:bg-base-500/25'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-base-500/30 text-neutral grid place-items-center shrink-0">
                            <Sparkles className="w-3.5 h-3.5" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-bold truncate">مطالعه عمومی و آزاد</p>
                            <p className="text-[10px] text-neutral">زبان، آزمون‌ها، مهارت و سرفصل‌های آزاد</p>
                          </div>
                        </div>
                        {value === 'عمومی' && <Check className="w-4 h-4 text-primary shrink-0" />}
                      </button>
                    )}

                    {filteredCourses.length === 0 ? (
                      <p className="text-xs text-neutral text-center py-6">درسی با این مشخصات یافت نشد</p>
                    ) : (
                      filteredCourses.map((c) => {
                        const cName = c.name || c.title || c.course;
                        const cTone = c.color || getToneForCourse(c, courses);
                        const cMeta = toneColors[cTone] || toneColors.primary;
                        const isSelected = value === cName;
                        const prof = c.professor || c.instructor;
                        return (
                          <button
                            key={c.id || c.code || cName}
                            type="button"
                            onClick={() => {
                              onChange(cName, c);
                              setOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl border text-right flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer ${
                              isSelected
                                ? `${cMeta.bg} ${cMeta.border} font-bold shadow-xs`
                                : 'bg-base-500/15 border-base-500/30 text-base-content hover:bg-base-500/25'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-7 h-7 rounded-lg ${cMeta.bg} ${cMeta.text} grid place-items-center shrink-0 text-xs font-bold`}
                              >
                                <span className={`w-2.5 h-2.5 rounded-full ${cMeta.dot}`} />
                              </span>
                              <div className="min-w-0">
                                <p className={`text-[12.5px] font-bold truncate ${isSelected ? cMeta.text : ''}`}>
                                  {cName}
                                </p>
                                <p className="text-[10px] text-neutral truncate">
                                  {prof ? `استاد: ${prof}` : 'ثبت‌شده در برنامه هفتگی'}
                                  {c.units ? ` · ${toFaDigits(c.units)} واحد` : ''}
                                  {c.code ? ` · کد ${toFaDigits(c.code)}` : ''}
                                </p>
                              </div>
                            </div>
                            {isSelected && <Check className={`w-4 h-4 ${cMeta.text} shrink-0`} />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
