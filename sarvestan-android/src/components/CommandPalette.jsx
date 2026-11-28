import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Award,
  CalendarDays,
  CreditCard,
  BookOpenCheck,
  BookOpen,
  Timer,
  Eye,
  EyeOff,
  ListTodo,
  Palette,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { searchBehestanIndex, normalizeQuery, getDashboardTabForCode } from '../services/behestanSearchIndex';
import { getCurrentTermSchedule, resolveCurrentTermId } from '../services/behestan/store';
import { getExamsView } from '../data/viewModel';
import { getStudyTasks } from '../services/studyPlanner';
import { getExamCategoryLabel } from '../services/classAlarms';
import { usePrivacyMode } from '../services/privacyMode';
import { toFaDigits } from '../utils/faDigits';
import { getUniversityOrigin } from '../services/behestan/session';

export default function CommandPalette({ isOpen, onClose, onNavigate, onSelectSearchResult }) {
  const [query, setQuery] = useState('');
  const { themes, setTheme } = useTheme();
  const [privacyEnabled, , togglePrivacy] = usePrivacyMode();

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { label: 'میز کار و خانه دانشجو', tab: 'home', icon: LayoutDashboard },
    { label: 'برنامه هفتگی و امتحانات', tab: 'schedule', icon: CalendarDays },
    { label: 'تایمر مطالعه و تسک‌ها', tab: 'study', icon: ListTodo },
    { label: 'کارنامه، ریز نمرات و شبیه‌ساز معدل', tab: 'grades', icon: Award },
    { label: 'امور مالی و شهریه', tab: 'finance', icon: CreditCard },
    { label: 'چارت تحصیلی و پیش‌نیازها', tab: 'curriculum', icon: BookOpenCheck },
  ];

  const normQ = normalizeQuery(query);

  const filteredLinks = quickLinks.filter((l) => {
    if (!normQ) return true;
    return normalizeQuery(l.label).includes(normQ);
  });

  const courses = getCurrentTermSchedule(resolveCurrentTermId()) || [];
  const filteredCourses = normQ
    ? courses
        .filter((c) => normalizeQuery(c.name || c.title || '').includes(normQ) || normalizeQuery(c.professor || '').includes(normQ))
        .slice(0, 6)
    : [];

  const exams = getExamsView() || [];
  const filteredExams = normQ
    ? exams
        .filter((ex) => normalizeQuery(ex.course || '').includes(normQ) || normalizeQuery(getExamCategoryLabel(ex.category)).includes(normQ))
        .slice(0, 5)
    : [];

  const tasks = getStudyTasks() || [];
  const filteredTasks = normQ
    ? tasks
        .filter((t) => normalizeQuery(t.title || '').includes(normQ) || normalizeQuery(t.courseName || '').includes(normQ))
        .slice(0, 5)
    : [];

  const filteredBehestanProcesses = normQ ? searchBehestanIndex(query, 6) : [];

  const filteredThemes = themes
    .filter((t) => !normQ || t.persianName.includes(query) || t.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, normQ ? 8 : 4);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/70 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -15 }}
        onClick={(e) => e.stopPropagation()}
        className="sarv-card max-w-2xl w-full p-4 bg-base border border-base-500 shadow-2xl space-y-3"
      >
        <div className="relative">
          <Search className="w-4 h-4 text-neutral absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            autoFocus
            type="text"
            placeholder="جستجوی درس، امتحان، تسک، تغییر تم یا شماره فرم بهستان..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-base-500/20 border border-base-500/40 text-xs text-base-content placeholder:text-neutral outline-none focus:border-primary"
          />
        </div>

        <div className="max-h-96 overflow-y-auto space-y-3 pr-1 text-right">
          {/* دکمه سریع حریم خصوصی */}
          <button
            type="button"
            onClick={() => {
              togglePrivacy();
              onClose();
            }}
            className="w-full p-2.5 rounded-xl bg-base-500/15 hover:bg-primary-soft flex items-center justify-between text-xs font-bold text-base-content cursor-pointer transition"
          >
            <span className="flex items-center gap-2">
              {privacyEnabled ? <EyeOff className="w-4 h-4 text-primary" /> : <Eye className="w-4 h-4 text-primary" />}
              {privacyEnabled ? 'غیرفعال‌سازی حالت حریم خصوصی' : 'فعال‌سازی حالت حریم خصوصی (محو کردن نمرات و مبالغ)'}
            </span>
            <span className="text-[10px] font-mono text-neutral">Ctrl+Shift+P</span>
          </button>

          {filteredCourses.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-base-500/30">
              <span className="text-[11px] font-bold text-neutral px-2 block">دروس ترم جاری</span>
              {filteredCourses.map((c, idx) => (
                <button
                  key={c.id || idx}
                  type="button"
                  onClick={() => {
                    onNavigate('schedule');
                    onClose();
                  }}
                  className="w-full p-2 rounded-xl hover:bg-base-500/30 flex items-center justify-between text-xs text-base-content cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-bold">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    {c.name || c.title}
                  </span>
                  <span className="text-[10.5px] text-neutral">{c.professor !== 'ـ' ? c.professor : ''}</span>
                </button>
              ))}
            </div>
          )}

          {filteredExams.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-base-500/30">
              <span className="text-[11px] font-bold text-neutral px-2 block">امتحانات و کوییزها</span>
              {filteredExams.map((ex, idx) => (
                <button
                  key={ex.id || idx}
                  type="button"
                  onClick={() => {
                    onNavigate('schedule');
                    onClose();
                  }}
                  className="w-full p-2 rounded-xl hover:bg-base-500/30 flex items-center justify-between text-xs text-base-content cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-bold">
                    <Timer className="w-3.5 h-3.5 text-warn" />
                    {getExamCategoryLabel(ex.category)} {ex.course}
                  </span>
                  <span className="text-[10.5px] text-neutral font-mono">{toFaDigits(ex.examDate)}</span>
                </button>
              ))}
            </div>
          )}

          {filteredTasks.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-base-500/30">
              <span className="text-[11px] font-bold text-neutral px-2 block">کارها و تکالیف پلنر</span>
              {filteredTasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onNavigate('study');
                    onClose();
                  }}
                  className="w-full p-2 rounded-xl hover:bg-base-500/30 flex items-center justify-between text-xs text-base-content cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-bold truncate">
                    <ListTodo className="w-3.5 h-3.5 text-info shrink-0" />
                    {t.title}
                  </span>
                  <span className="text-[10.5px] text-neutral shrink-0">{t.courseName || 'عمومی'}</span>
                </button>
              ))}
            </div>
          )}

          {filteredLinks.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-base-500/30">
              <span className="text-[11px] font-bold text-neutral px-2 block">بخش‌های برنامه</span>
              {filteredLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.tab}
                    type="button"
                    onClick={() => {
                      onNavigate(item.tab);
                      onClose();
                    }}
                    className="w-full p-2 rounded-xl hover:bg-base-500/30 flex items-center justify-between text-xs font-semibold text-base-content cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-primary" />
                      {item.label}
                    </span>
                    <span className="text-[10px] text-neutral">باز کردن ←</span>
                  </button>
                );
              })}
            </div>
          )}

          {filteredBehestanProcesses.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-base-500/30">
              <span className="text-[11px] font-bold text-neutral px-2 block">فرم‌های بهستان</span>
              {filteredBehestanProcesses.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => {
                    if (onSelectSearchResult) onSelectSearchResult(p);
                    else if (p.tab) onNavigate(p.tab);
                    else if (p.code) window.open(getUniversityOrigin() + '/', '_blank');
                    onClose();
                  }}
                  className="w-full p-2 rounded-xl hover:bg-base-500/30 flex items-center justify-between text-xs cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">#{toFaDigits(p.code)}</span>
                    <span className="text-base-content">{p.title}</span>
                  </span>
                  {getDashboardTabForCode(p.code) && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-soft text-primary">داشبورد</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {filteredThemes.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-base-500/30">
              <span className="text-[11px] font-bold text-neutral px-2 flex items-center gap-1">
                <Palette className="w-3 h-3" /> تغییر سریع تم
              </span>
              <div className="flex flex-wrap gap-1.5 px-1 pt-1">
                {filteredThemes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTheme(t.id);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-base-500/20 hover:bg-primary-soft text-[11px] font-bold text-base-content flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.primary }} />
                    {t.persianName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
