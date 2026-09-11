import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardOverview from './modules/DashboardOverview';
import WeeklySchedule from './modules/WeeklySchedule';
import TranscriptsGrades from './modules/TranscriptsGrades';
import FinanceAndTuition from './modules/FinanceAndTuition';
import CurriculumAndCourses from './modules/CurriculumAndCourses';
import EducationalRequests from './modules/EducationalRequests';
import LettersAndCertificates from './modules/LettersAndCertificates';
import CommandPalette from './components/CommandPalette';
import NotificationsDrawer from './components/NotificationsDrawer';
import LoginModal from './components/LoginModal';
import NotAvailableModal from './components/NotAvailableModal';
import LandingPage from './components/LandingPage';
import { getDashboardTabForCode } from './services/behestanSearchIndex';
import { REAL_WORKFLOW_REQUESTS, REAL_FINANCIAL_REPORT_2563, subscribeToData } from './services/behestanData';
import { Sparkles, Download, ArrowRight } from 'lucide-react';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [notAvailableItem, setNotAvailableItem] = useState(null);
  const [, setNotifyTick] = React.useState(0);

  React.useEffect(() => {
    return subscribeToData(() => setNotifyTick((t) => t + 1));
  }, []);

  const liveUnread = React.useMemo(() => {
    let n = 0;
    if (Number(REAL_FINANCIAL_REPORT_2563.totalDebtRial || 0) > 0) n += 1;
    n += Math.min(5, (REAL_WORKFLOW_REQUESTS || []).length);
    return n;
  }, []);

  /**
   * انتخاب نتیجه جستجو:
   * - فقط کدهای مجاز داشبورد → بخش
   * - وگرنه → مودال «فعلاً موجود نیست» + هدایت به بهستان قدیم
   */
  const handleSelectSearchResult = (item) => {
    if (!item) return;
    const code = String(item.code || '');
    const tab = getDashboardTabForCode(code);
    if (tab) {
      setActiveTab(tab);
      setIsSearchOpen(false);
      setNotAvailableItem(null);
      return;
    }
    setNotAvailableItem({ ...item, tab: null });
    setIsSearchOpen(false);
  };

  return (
    <div className="min-h-screen bg-base text-base-content flex flex-col font-sans transition-colors duration-300">
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigate={setActiveTab}
        unreadNotificationsCount={liveUnread}
        onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onSelectSearchResult={handleSelectSearchResult}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col lg:flex-row gap-6 sm:gap-8">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <DashboardOverview key="overview" onNavigate={setActiveTab} />
            )}
            {activeTab === 'transcripts' && (
              <TranscriptsGrades key="transcripts" />
            )}
            {activeTab === 'schedule' && (
              <WeeklySchedule key="schedule" />
            )}
            {activeTab === 'finance' && (
              <FinanceAndTuition key="finance" />
            )}
            {activeTab === 'curriculum' && (
              <CurriculumAndCourses key="curriculum" />
            )}
            {activeTab === 'requests' && (
              <EducationalRequests key="requests" />
            )}
            {activeTab === 'letters' && (
              <LettersAndCertificates key="letters" />
            )}
          </AnimatePresence>
        </main>
      </div>

      <footer className="mt-auto border-t border-base-500/40 py-6 text-center text-xs text-neutral bg-base-500/10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base-content">سامانه هوشمند خدمات آموزشی سروستان</span>
            <span>(بهستان ۲٫۰)</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>
              طراحی‌شده با دیزاین‌سیستم{' '}
              <a
                href="https://github.com/mjb4khshi/sarv-ui"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-semibold"
              >
                سَرو (Sarv UI)
              </a>
            </span>
            <span className="opacity-40">•</span>
            <span>
              توسعه‌یافته توسط{' '}
              <a
                href="https://github.com/mjb4khshi"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-semibold"
              >
                محمدجواد بخشی ایرج
              </a>
              <span className="font-mono text-neutral/80 mx-1">@mjb4khshi</span>
            </span>
          </div>
        </div>
      </footer>

      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setActiveTab}
        onSelectSearchResult={handleSelectSearchResult}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <NotAvailableModal
        item={notAvailableItem}
        onClose={() => setNotAvailableItem(null)}
      />
    </div>
  );
}

export default function App() {
  const [viewMode, setViewMode] = useState(() => {
    // If running inside Chrome Extension tab/popup
    if (typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:') {
      return 'dashboard';
    }
    // If URL has demo or dashboard query/hash
    if (typeof window !== 'undefined') {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      if (search.includes('demo') || hash.includes('demo') || search.includes('mode=dashboard')) {
        return 'demo';
      }
    }
    // Default for web visitors / GitHub Pages is the Landing Showcase
    return 'landing';
  });

  return (
    <ThemeProvider>
      {viewMode === 'landing' ? (
        <LandingPage onOpenDemo={() => setViewMode('demo')} />
      ) : (
        <div className="flex flex-col min-h-screen">
          {viewMode === 'demo' && (
            <div className="sticky top-0 z-50 bg-gradient-to-r from-primary via-accent to-primary text-white px-4 py-2.5 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-warn animate-pulse shrink-0" />
                <span className="font-bold">پیش‌نمایش تعاملی سروستان (نسخه آزمایشی آنلاین)</span>
                <span className="opacity-80 hidden md:inline">— این نما صرفاً دمو است؛ برای اتصال به داده‌های زنده بهستان، افزونه را نصب کنید.</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="./sarvestan-extension.zip"
                  download
                  className="px-3 py-1 rounded-lg bg-white text-primary font-bold hover:bg-white/90 transition-all text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود افزونه (.zip)</span>
                </a>
                <button
                  onClick={() => setViewMode('landing')}
                  className="px-3 py-1 rounded-lg bg-black/25 hover:bg-black/40 text-white font-bold transition-all text-xs flex items-center gap-1"
                >
                  <span>بازگشت به سایت معرفی</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
          <DashboardContent />
        </div>
      )}
    </ThemeProvider>
  );
}

