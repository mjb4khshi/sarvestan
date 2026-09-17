import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
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
import BehestanReferralModal from './components/BehestanReferralModal';
import ExtensionUpdateModal from './components/ExtensionUpdateModal';
import LandingPage from './components/LandingPage';
import { getDashboardTabForCode } from './services/behestanSearchIndex';
import { REAL_WORKFLOW_REQUESTS, REAL_FINANCIAL_REPORT_2563, subscribeToData } from './services/behestanData';
import {
  checkForExtensionUpdate,
  hasDismissedExtensionUpdate,
  dismissExtensionUpdate,
} from './services/updater';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [behestanReferralType, setBehestanReferralType] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [notAvailableItem, setNotAvailableItem] = useState(null);
  const [, setNotifyTick] = React.useState(0);
  const [updateRelease, setUpdateRelease] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await checkForExtensionUpdate();
        if (!active) return;
        if (res.hasUpdate && res.latestRelease) {
          setUpdateRelease(res.latestRelease);
          if (!hasDismissedExtensionUpdate(res.latestRelease.tagName)) {
            setIsUpdateModalOpen(true);
          }
        }
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleTabChange = (tab) => {
    if (tab === 'requests' || tab === 'letters') {
      setBehestanReferralType(tab);
      return;
    }
    setActiveTab(tab);
  };

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
      handleTabChange(tab);
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
        onNavigate={handleTabChange}
        unreadNotificationsCount={liveUnread}
        onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onSelectSearchResult={handleSelectSearchResult}
        latestUpdateRelease={updateRelease}
        onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-24 lg:pb-8 flex flex-col lg:flex-row gap-0 lg:gap-8">
        {/* سایدبار فقط در دسکتاپ — در موبایل MobileNav جایگزین می‌شود */}
        <div className="hidden lg:block">
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onOpenBehestanReferral={setBehestanReferralType}
          />
        </div>

        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <DashboardOverview key="overview" onNavigate={handleTabChange} />
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
          </AnimatePresence>
        </main>
      </div>

      {/* فوتر فقط دسکتاپ — موبایل فضای لازم را دارد */}
      <footer className="hidden lg:block mt-auto border-t border-base-500/40 py-6 text-center text-xs text-neutral bg-base-500/10">
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
                محمدجواد بخشی
              </a>
              <span className="font-mono text-neutral/80 mx-1">@mjb4khshi</span>
            </span>
          </div>
        </div>
      </footer>

      {/* ناوبری موبایل — پایین صفحه، همیشه در دسترس */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenBehestanReferral={setBehestanReferralType}
      />

      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleTabChange}
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

      <BehestanReferralModal
        type={behestanReferralType}
        onClose={() => setBehestanReferralType(null)}
      />

      {/* مودال اعلان به‌روزرسانی افزونه */}
      <AnimatePresence>
        {isUpdateModalOpen && updateRelease && (
          <ExtensionUpdateModal
            key="sarvestan-ext-update-modal"
            release={updateRelease}
            onClose={() => {
              dismissExtensionUpdate(updateRelease.tagName);
              setIsUpdateModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const isExtension = typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:';

  return (
    <ThemeProvider>
      {isExtension ? <DashboardContent /> : <LandingPage />}
    </ThemeProvider>
  );
}

