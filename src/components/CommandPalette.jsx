import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Award,
  CalendarDays,
  CreditCard,
  BookOpenCheck,
  FileCheck2,
  FileText,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { searchBehestanIndex, normalizeQuery, getDashboardTabForCode } from '../services/behestanSearchIndex';
import SarvBadge from './sarv/SarvBadge';
import SarvInput from './sarv/SarvInput';
import { toFaDigits } from '../utils/faDigits';

export default function CommandPalette({ isOpen, onClose, onNavigate, onSelectSearchResult }) {
  const [query, setQuery] = useState('');
  const { themes, setTheme } = useTheme();

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClose(); // toggled
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { label: 'میز کار و وضعیت جامع تحصیلی', tab: 'overview', icon: LayoutDashboard, code: '11147' },
    { label: 'کارنامه، ریز نمرات و سوابق تحصیلی', tab: 'transcripts', icon: Award, code: '79' },
    { label: 'برنامه هفتگی کلاس‌ها و کارت ورود به جلسه', tab: 'schedule', icon: CalendarDays, code: '428' },
    { label: 'امور مالی و پرداخت الکترونیکی شهریه', tab: 'finance', icon: CreditCard, code: '27570' },
    { label: 'چارت و وضعیت دروس دانشجو', tab: 'curriculum', icon: BookOpenCheck, code: '11126' },
    { label: 'پیشخوان خدمت و گردش‌کارهای شورا', tab: 'requests', icon: FileCheck2, code: '21122' },
    { label: 'نامه‌ها و گواهی اشتغال به تحصیل', tab: 'letters', icon: FileText, code: '11122' }
  ];

  const normQ = normalizeQuery(query);

  const filteredLinks = quickLinks.filter((l) => {
    if (!normQ) return true;
    return (
      normalizeQuery(l.label).includes(normQ) ||
      normalizeQuery(l.code).includes(normQ)
    );
  });

  const filteredBehestanProcesses = searchBehestanIndex(query, 12);

  const filteredThemes = themes.filter(
    (t) => t.persianName.includes(query) || t.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -15 }}
        className="sarv-card max-w-2xl w-full p-4 bg-base border border-base-500 shadow-2xl space-y-4"
      >
        {/* Search Header — Sarv Input */}
        <SarvInput
          autoFocus
          type="text"
          placeholder="شماره فرم یا عنوان فرآیند (۷۹، ۴۲۸، کارنامه، شهریه…)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<Search className="w-4 h-4" />}
          hideIconOnFocus
          className="w-full"
        />

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto space-y-4 pr-1 text-right">
          
          {/* Quick Active Tabs */}
          {filteredLinks.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-neutral px-3 block">
                بخش‌های فعال داشبورد
              </span>
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
                    className="w-full p-2.5 rounded-xl hover:bg-base-500/50 flex items-center justify-between text-right text-xs font-semibold text-base-content transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-base-500 group-hover:bg-primary group-hover:text-primary-content transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span>{item.label}</span>
                        <span className="text-[10px] text-neutral font-mono font-normal">
                          کد بهستان #{item.code}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral group-hover:text-primary">
                      باز کردن بخش ←
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Behestan 75 Processes Matches */}
          {filteredBehestanProcesses.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-base-500">
              <span className="text-[11px] font-bold text-neutral px-3 block">
                فرآیندها و گزارش‌های سیستمی بهستان
              </span>
              {filteredBehestanProcesses.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => {
                    if (onSelectSearchResult) {
                      onSelectSearchResult(p);
                    } else if (p.tab) {
                      onNavigate(p.tab);
                    } else if (p.code) {
                      window.open('https://behestan.kntu.ac.ir/', '_blank');
                    }
                    onClose();
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-base-500/50 flex items-center justify-between text-right text-xs transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10 text-[11px]">
                      #{toFaDigits(p.code)}
                    </span>
                    <span className="text-base-content group-hover:text-primary transition-colors">
                      {p.title}
                    </span>
                  </div>
                  {getDashboardTabForCode(p.code) ? (
                    <SarvBadge variant="primary" soft size="sm">
                      در سروستان
                    </SarvBadge>
                  ) : (
                    <SarvBadge variant="neutral" outline size="sm">
                      بهستان قدیم
                    </SarvBadge>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Theme Matches */}
          {filteredThemes.length > 0 && query.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-base-500">
              <span className="text-[11px] font-bold text-neutral px-3 block">
                تغییر تم رنگی سرو
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {filteredThemes.slice(0, 6).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTheme(t.id);
                      onClose();
                    }}
                    className="p-2 rounded-xl hover:bg-base-500/50 flex items-center gap-2 text-xs text-base-content text-right cursor-pointer"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20"
                      style={{ backgroundColor: t.primary }}
                    />
                    <span>{t.persianName}</span>
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
