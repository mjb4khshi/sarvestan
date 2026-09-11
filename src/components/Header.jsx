import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  Palette,
  Check,
  ChevronDown,
  RefreshCw,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { BEHESTAN_PROFILE } from '../services/behestanData';
import { searchBehestanIndex, getDashboardTabForCode } from '../services/behestanSearchIndex';
import liveSync from '../services/behestanLiveSync';
import SarvBadge from './sarv/SarvBadge';
import SarvInput from './sarv/SarvInput';
import SarvAvatar from './SarvAvatar';
import { toFaDigits } from '../utils/faDigits';

export default function Header({ onOpenSearch, onNavigate, unreadNotificationsCount = 0, onToggleNotifications, onOpenLogin, onSelectSearchResult }) {
  const { currentTheme, setTheme, themes, activeThemeMeta } = useTheme();
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    // فقط وضعیت را از تب‌های باز بخوان — سنک گزارش‌ها کند و محدود است
    setIsSyncing(true);
    await liveSync.checkConnection();
    setTimeout(() => setIsSyncing(false), 900);
  };

  const dropdownRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setThemeDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProcesses = searchBehestanIndex(searchQuery, 8);

  const handleSelectProcess = (item) => {
    if (onSelectSearchResult) {
      onSelectSearchResult(item);
    } else if (item.tab && onNavigate) {
      onNavigate(item.tab);
    } else if (item.code) {
      // sys.svc با GET و fid خطای 405 می‌دهد
      window.open('https://behestan.kntu.ac.ir/', '_blank');
    }
    setSearchDropdownOpen(false);
    setSearchQuery('');
  };

  const isOverlay =
    typeof window !== 'undefined' &&
    (window.self !== window.top || window.location.search.includes('mode=overlay'));

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-base/90 border-b border-base-500/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">

        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <img
            src="https://raw.githubusercontent.com/mjb4khshi/sarv-ui/main/sarv-logo.png"
            alt="Sarv"
            className="w-8 h-8 object-contain"
          />
          <div className="hidden sm:flex flex-col leading-tight">
            <h1 className="text-base font-bold text-base-content">سروستان</h1>
            <span className="text-[10px] text-neutral">سامانه هوشمند بهستان</span>
          </div>
        </div>

        {/* Search — Sarv Input */}
        <div className="hidden md:flex flex-1 max-w-sm relative" ref={searchContainerRef}>
          <SarvInput
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchDropdownOpen(true);
            }}
            onFocus={() => setSearchDropdownOpen(true)}
            placeholder="جستجوی فرآیند یا گزارش…"
            icon={<Search className="w-4 h-4" />}
            hideIconOnFocus
            className="w-full"
          />

          <AnimatePresence>
            {searchDropdownOpen && searchQuery.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full right-0 left-0 mt-2 p-2 rounded-[var(--radius-card,1rem)] bg-base border border-base-500 shadow-xl z-50 max-h-72 overflow-y-auto space-y-1 text-right"
              >
                {filteredProcesses.length > 0 ? (
                  filteredProcesses.map((p) => {
                    const inSarv = !!getDashboardTabForCode(p.code);
                    return (
                      <button
                        key={p.code}
                        type="button"
                        onClick={() => handleSelectProcess(p)}
                        className="w-full p-2.5 rounded-lg hover:bg-base-500/45 flex items-center justify-between text-right text-xs transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/12 text-[11px] shrink-0">
                            {toFaDigits(p.code)}
                          </span>
                          <span className="text-base-content truncate">{p.title}</span>
                        </div>
                        {inSarv ? (
                          <SarvBadge variant="primary" soft size="sm" className="shrink-0">در سروستان</SarvBadge>
                        ) : (
                          <SarvBadge variant="neutral" outline size="sm" className="shrink-0">بهستان</SarvBadge>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-neutral">موردی یافت نشد.</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mobile search */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-[var(--radius-button,0.75rem)] text-neutral hover:text-base-content hover:bg-base-500/40 transition-colors cursor-pointer"
            title="جستجو"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              className="p-2 rounded-[var(--radius-button,0.75rem)] text-neutral hover:text-base-content hover:bg-base-500/40 transition-colors cursor-pointer"
              title={activeThemeMeta?.persianName || 'تم'}
            >
              <span
                className="block w-4 h-4 rounded-[var(--radius-button,0.5rem)] border border-base-500"
                style={{ backgroundColor: activeThemeMeta?.primary || '#0066a4' }}
              />
            </button>

            <AnimatePresence>
              {themeDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  className="absolute left-0 mt-2 w-56 p-2 rounded-[var(--radius-card,1rem)] bg-base border border-base-500 shadow-xl z-50 max-h-80 overflow-y-auto space-y-0.5"
                >
                  {themes.map((theme) => {
                    const isSelected = currentTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          setTheme(theme.id);
                          setThemeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-right cursor-pointer ${
                          isSelected ? 'bg-primary text-primary-content font-semibold' : 'hover:bg-base-500/50 text-base-content'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-[4px] border border-black/10"
                            style={{ backgroundColor: theme.primary }}
                          />
                          {theme.persianName}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications — only show if real count > 0 */}
          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              onClick={onToggleNotifications}
              className="relative p-2 rounded-[var(--radius-button,0.75rem)] text-neutral hover:text-base-content hover:bg-base-500/40 transition-colors cursor-pointer"
              title="اعلانات"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 left-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-content text-[9px] font-bold flex items-center justify-center">
                {toFaDigits(unreadNotificationsCount)}
              </span>
            </button>
          )}

          {/* Overlay exit */}
          {isOverlay && (
            <button
              type="button"
              onClick={() => {
                if (window.parent) window.parent.postMessage({ action: 'CLOSE_SARVESTAN_OVERLAY' }, '*');
              }}
              className="p-2 rounded-[var(--radius-button,0.75rem)] text-danger hover:bg-danger/10 transition-colors cursor-pointer"
              title="بازگشت به بهستان"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Sync */}
          <button
            type="button"
            onClick={handleManualSync}
            className="p-2 rounded-[var(--radius-button,0.75rem)] text-neutral hover:text-primary hover:bg-base-500/40 transition-colors cursor-pointer"
            title="همگام‌سازی"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
          </button>

          {/* Profile */}
          <button
            type="button"
            onClick={onOpenLogin}
            className="flex items-center gap-2 p-1 pr-1.5 rounded-[var(--radius-button,0.75rem)] hover:bg-base-500/40 transition-colors cursor-pointer"
            title={BEHESTAN_PROFILE.isLoggedIn ? 'متصل به بهستان' : 'ورود به بهستان'}
          >
            <div className="hidden lg:flex flex-col leading-tight text-right max-w-28">
              <span className="text-xs font-semibold text-base-content truncate">
                {BEHESTAN_PROFILE.fullName}
              </span>
              <span className="text-[10px] text-neutral font-mono">
                {BEHESTAN_PROFILE.isLoggedIn
                  ? toFaDigits(BEHESTAN_PROFILE.studentId)
                  : 'میهمان'}
              </span>
            </div>
            <SarvAvatar
              fullName={BEHESTAN_PROFILE.fullName}
              photo={BEHESTAN_PROFILE.photo}
              size="sm"
              isLoggedIn={BEHESTAN_PROFILE.isLoggedIn}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
