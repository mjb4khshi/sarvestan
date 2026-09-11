import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Calculator,
  RefreshCw,
  BookOpen,
  TrendingUp,
  Sparkles,
  Award as AwardIcon
} from 'lucide-react';
import SarvButton from '../components/sarv/SarvButton';
import SarvBadge from '../components/sarv/SarvBadge';
import SarvTabs from '../components/sarv/SarvTabs';
import SarvEmptyState from '../components/sarv/SarvEmptyState';
import {
  BEHESTAN_PROFILE,
  REAL_TRANSCRIPTS,
  CURRENT_TERM_4051_COURSES,
  subscribeToData
} from '../services/behestanData';
import liveSync from '../services/behestanLiveSync';
import { toFaDigits } from '../utils/faDigits';

const gradeBadge = (g) => {
  const n = parseFloat(String(g).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  if (Number.isNaN(n)) return 'neutral';
  if (n >= 17) return 'success';
  if (n >= 14) return 'primary';
  if (n >= 10) return 'warn';
  return 'danger';
};

export default function TranscriptsGrades() {
  const [activeTab, setActiveTab] = useState('realTranscripts');
  const [selectedTermId, setSelectedTermId] = useState(() => REAL_TRANSCRIPTS[0]?.termId || '4042');
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeToData(() => setTick(t => t + 1));
    const unsubSync = liveSync?.subscribe?.(() => setTick(t => t + 1));
    return () => {
      unsub();
      if (unsubSync) unsubSync();
    };
  }, []);

  useEffect(() => {
    const terms = [...(REAL_TRANSCRIPTS || [])];
    if (terms.length > 0 && !terms.some(t => t.termId === selectedTermId)) {
      setSelectedTermId(terms[0].termId);
    }
  }, [REAL_TRANSCRIPTS.length, selectedTermId]);

  const [simulatedGrades, setSimulatedGrades] = useState(() => {
    const initial = {};
    CURRENT_TERM_4051_COURSES.forEach(c => {
      initial[c.id] = c.defaultGrade;
    });
    return initial;
  });

  const updateGrade = (id, val) => {
    setSimulatedGrades(prev => ({ ...prev, [id]: parseFloat(val) }));
  };

  const resetSimulator = () => {
    const initial = {};
    CURRENT_TERM_4051_COURSES.forEach(c => {
      initial[c.id] = c.defaultGrade;
    });
    setSimulatedGrades(initial);
  };

  const simulatedTermGPA = useMemo(() => {
    let totalPoints = 0;
    let totalUnits = 0;
    CURRENT_TERM_4051_COURSES.forEach(c => {
      const grade = simulatedGrades[c.id] ?? c.defaultGrade;
      totalPoints += grade * c.units;
      totalUnits += c.units;
    });
    return totalUnits > 0 ? toFaDigits((totalPoints / totalUnits).toFixed(2)) : '۰٫۰۰';
  }, [simulatedGrades, CURRENT_TERM_4051_COURSES.length]);

  const terms = useMemo(() => [...(REAL_TRANSCRIPTS || [])], []);
  const activeTermData = terms.find(t => t.termId === selectedTermId) || terms[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28 }}
      className="space-y-5 text-right"
    >
      {/* Header */}
      <div className="sarv-card p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold">کارنامه و ریز نمرات</h2>
            </div>
            <p className="text-xs text-neutral">
              {BEHESTAN_PROFILE.major} · دانشجو {toFaDigits(BEHESTAN_PROFILE.studentId)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="sarv-chip sarv-chip-primary p-3.5 text-center min-w-28">
              <span className="text-[11px] text-neutral block">معدل کل</span>
              <span className="text-2xl font-bold font-mono text-primary">
                {toFaDigits(BEHESTAN_PROFILE.gpa)}
              </span>
              {BEHESTAN_PROFILE.standing && (
                <span className="text-[10px] text-success block font-semibold mt-0.5">
                  {BEHESTAN_PROFILE.standing}
                </span>
              )}
            </div>
            <div className="sarv-chip sarv-chip-info p-3.5 text-center min-w-24">
              <span className="text-[11px] text-neutral block">واحد</span>
              <span className="text-2xl font-bold font-mono text-info">
                {toFaDigits(BEHESTAN_PROFILE.totalUnitsPassed)}
              </span>
              <span className="text-[10px] text-neutral block">از {toFaDigits(140)}</span>
            </div>
          </div>
        </div>
      </div>

      <SarvTabs
        layoutId="transcriptTabs"
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { id: 'realTranscripts', label: 'نمرات رسمی ۷۹', icon: BookOpen },
          { id: 'simulator', label: 'شبیه‌ساز معدل', icon: Calculator }
        ]}
      />

      {/* Real transcripts */}
      {activeTab === 'realTranscripts' && (
        terms.length === 0 ? (
          <SarvEmptyState
            icon={Award}
            title="کارنامه رسمی (گزارش ۷۹)"
            description="ریز نمرات قطعی نیم‌سال‌ها پس از اتصال به بهستان نمایش داده می‌شود."
          >
            <SarvButton variant="primary" onClick={() => liveSync.openBehestanLogin()}>
              ورود به بهستان
            </SarvButton>
          </SarvEmptyState>
        ) : (
          <div className="space-y-4">
            {/* Term chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {terms.map((term, i) => {
                const isActive = selectedTermId === term.termId;
                const gpa = toFaDigits(term.termGpa);
                const gpaNum = parseFloat(String(term.termGpa).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
                return (
                  <motion.button
                    key={term.termId}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -2 }}
                    onClick={() => setSelectedTermId(term.termId)}
                    className={`sarv-chip p-4 text-right space-y-2 ${
                      isActive ? 'sarv-chip-primary' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-base-content truncate">
                        {term.termTitle}
                      </span>
                      <SarvBadge variant="neutral" outline size="sm" className="font-mono shrink-0">
                        ترم {toFaDigits(term.termId)}
                      </SarvBadge>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold font-mono text-primary">{gpa}</span>
                        <span className="text-[11px] text-neutral">معدل ترم</span>
                      </div>
                      <div className="text-left space-y-0.5">
                        {term.standing && (
                          <span className="text-[11px] font-semibold text-success block">
                            {term.standing}
                          </span>
                        )}
                        <span className="text-[11px] text-neutral">
                          {toFaDigits(term.unitsPassed)} واحد
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-base-500/40 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((gpaNum || 0) / 20) * 100)}%` }}
                        transition={{ duration: 0.6, delay: 0.15 + i * 0.05 }}
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Courses table */}
            {activeTermData && (
              <div className="sarv-card p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-500/40 pb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-base-content">
                      ریز نمرات — {activeTermData.termTitle}
                    </h4>
                    <p className="text-[11px] text-neutral mt-0.5">
                      معدل ترم {toFaDigits(activeTermData.termGpa)}
                      {activeTermData.cumulativeGpa && (
                        <> · معدل کل تا این ترم {toFaDigits(activeTermData.cumulativeGpa)}</>
                      )}
                    </p>
                  </div>
                  <SarvBadge variant="success" soft size="sm">
                    نمرات قطعی
                  </SarvBadge>
                </div>

                <div className="overflow-x-auto rounded-[var(--radius-card,1rem)] border border-base-500/40">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-base-500/30 text-neutral font-semibold border-b border-base-500/40">
                      <tr>
                        <th className="p-3 text-center w-12">ردیف</th>
                        <th className="p-3">کد درس</th>
                        <th className="p-3">نام درس</th>
                        <th className="p-3 text-center">واحد</th>
                        <th className="p-3 text-center">نمره</th>
                        <th className="p-3 text-center">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-500/30">
                      {(activeTermData.courses || []).map((c, idx) => (
                        <motion.tr
                          key={`${c.code}-${idx}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className="hover:bg-base-500/10 transition-colors"
                        >
                          <td className="p-3 text-center text-neutral font-mono">
                            {toFaDigits(idx + 1)}
                          </td>
                          <td className="p-3 font-mono font-semibold text-primary">
                            {toFaDigits(c.code)}
                          </td>
                          <td className="p-3 font-medium text-base-content">{c.name}</td>
                          <td className="p-3 text-center font-mono">
                            {toFaDigits(c.units)}
                          </td>
                          <td className="p-3 text-center">
                            <SarvBadge variant={gradeBadge(c.grade)} soft size="sm" className="font-mono font-bold">
                              {toFaDigits(c.grade)}
                            </SarvBadge>
                          </td>
                          <td className="p-3 text-center">
                            <SarvBadge variant="success" soft size="sm" dot>
                              {c.status || 'قبول'}
                            </SarvBadge>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Simulator */}
      {activeTab === 'simulator' && (
        <div className="sarv-card p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-base-500/40">
            <div className="space-y-1 text-right">
              <div className="flex items-center gap-2 flex-wrap">
                <Calculator className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold">شبیه‌ساز معدل ترم جاری</h3>
                <SarvBadge variant="primary" soft size="sm">تعاملی</SarvBadge>
              </div>
              <p className="text-[11px] text-neutral">
                اسلایدرها را حرکت دهید تا تأثیر نمرات احتمالی را ببینید.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="sarv-chip sarv-chip-primary px-4 py-2 flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-neutral block">معدل تخمینی</span>
                  <span className="text-2xl font-bold font-mono text-primary">{simulatedTermGPA}</span>
                </div>
                <SarvBadge variant="accent" soft size="sm">
                  {(() => {
                    const g = parseFloat(String(simulatedTermGPA).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
                    return g >= 17 ? 'ممتاز' : 'عادی';
                  })()}
                </SarvBadge>
              </div>
              <SarvButton
                variant="primary"
                styleType="flat"
                size="icon"
                onClick={resetSimulator}
                title="بازنشانی"
              >
                <RefreshCw className="w-4 h-4" />
              </SarvButton>
            </div>
          </div>

          {CURRENT_TERM_4051_COURSES.length === 0 ? (
            <p className="text-xs text-neutral py-8 text-center">
              درسی برای ترم جاری از بهستان دریافت نشده است.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CURRENT_TERM_4051_COURSES.map((course) => {
                const currentGrade = simulatedGrades[course.id] ?? course.defaultGrade;
                return (
                  <div
                    key={course.id}
                    className="sarv-chip p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between text-right gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-base-content truncate">{course.title}</h4>
                        <span className="text-[11px] text-neutral">
                          کد {toFaDigits(course.code)} · {toFaDigits(course.units)} واحد
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {course.isFinal ? (
                          <SarvBadge variant="success" soft size="sm">قطعی</SarvBadge>
                        ) : (
                          <SarvBadge variant="warn" soft size="sm">فرضی</SarvBadge>
                        )}
                        <span className="text-base font-bold font-mono text-primary w-10 text-center">
                          {toFaDigits(Number(currentGrade).toFixed(2).replace(/\.00$/, ''))}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-neutral">{toFaDigits(10)}</span>
                      <input
                        type="range"
                        min="10"
                        max="20"
                        step="0.25"
                        disabled={course.isFinal}
                        value={currentGrade}
                        onChange={(e) => updateGrade(course.id, e.target.value)}
                        className={`w-full accent-primary cursor-pointer ${
                          course.isFinal ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      />
                      <span className="text-[10px] font-mono text-neutral">{toFaDigits(20)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
