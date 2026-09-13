import { useEffect, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import DataBootstrap from './components/DataBootstrap';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import GradesScreen from './screens/GradesScreen';
import FinanceScreen from './screens/FinanceScreen';
import MoreScreen from './screens/MoreScreen';
import LoginScreen from './screens/LoginScreen';
import { extractSsoCodeFromUrl, completeCentralSsoLogin } from './services/behestan/login';
import { useSarvestanData } from './hooks/useSarvestanData';
import {
  subscribeLogin,
  getLoginSnapshot,
  openLoginModal,
  isLoginModalOpen,
} from './services/loginFlow';
import { isSessionAlive } from './services/behestan/session';
import { hasLiveData } from './services/behestan/store';

const TITLES = {
  schedule: 'برنامه هفتگی',
  grades: 'کارنامه و نمرات',
  finance: 'امور مالی و شهریه',
  more: 'خدمات و تنظیمات',
};

function SsoCallbackBridge() {
  useEffect(() => {
    const code = extractSsoCodeFromUrl();
    if (!code) return;
    completeCentralSsoLogin(code)
      .then(async () => {
        const { runFullSync } = await import('./services/behestan/sync');
        await runFullSync({ force: true });
        window.location.href = '/?sso=1';
      })
      .catch((e) => {
        console.warn('[SSO]', e);
        const msg = encodeURIComponent(String(e?.message || e));
        window.location.href = `/?sso_error=${msg}`;
      });
  }, []);
  return null;
}

function Shell() {
  const [tab, setTab] = useState('home');
  const [scheduleDefaultView, setScheduleDefaultView] = useState('cards');
  const [chartAutoOpen, setChartAutoOpen] = useState(false);
  const showBack = tab !== 'home';

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('sso') || qs.get('sso_error')) {
      setTab('more');
      try {
        window.history.replaceState({}, '', window.location.pathname);
      } catch {}
    }
  }, []);

  const handleNavigate = (targetTab, options = {}) => {
    if (targetTab === 'timetable') {
      setScheduleDefaultView('matrix');
      setTab('schedule');
    } else if (targetTab === 'schedule') {
      if (options.view) setScheduleDefaultView(options.view);
      setTab('schedule');
    } else if (targetTab === 'chart') {
      setChartAutoOpen(true);
      setTab('more');
    } else {
      if (targetTab === 'more' && options.openChart) {
        setChartAutoOpen(true);
      } else {
        setChartAutoOpen(false);
      }
      setTab(targetTab);
    }
  };

  return (
    <div className="min-h-full bg-base text-base-content selection:bg-primary/30 selection:text-primary">
      <div className="mobile-shell min-h-screen relative flex flex-col justify-between">
        <TopBar
          title={TITLES[tab] || null}
          onBack={showBack ? () => setTab('home') : undefined}
          onNavigate={handleNavigate}
        />

        <AnimatePresence mode="wait">
          <motion.main
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex-1 min-w-0"
          >
            {tab === 'home' && <HomeScreen onNavigate={handleNavigate} />}
            {tab === 'schedule' && (
              <ScheduleScreen
                initialView={scheduleDefaultView}
                onViewChange={setScheduleDefaultView}
              />
            )}
            {tab === 'grades' && <GradesScreen onNavigate={handleNavigate} />}
            {tab === 'finance' && <FinanceScreen onNavigate={handleNavigate} />}
            {tab === 'more' && (
              <MoreScreen
                key={`more-${chartAutoOpen}`}
                onNavigate={handleNavigate}
                initialChartOpen={chartAutoOpen}
              />
            )}
          </motion.main>
        </AnimatePresence>

        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  );
}

export default function App() {
  // صفحهٔ لاگین تمام‌صفحه با ?login=1 (برای خروج دستی و لینک مستقیم)
  try {
    const login = new URLSearchParams(window.location.search).has('login');
    if (login) {
      return (
        <ErrorBoundary>
          <ThemeProvider>
            <LoginScreen />
          </ThemeProvider>
        </ErrorBoundary>
      );
    }
  } catch {}

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LoginGate />
        <SsoCallbackBridge />
        <DataBootstrap />
        <Shell />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

/**
 * مودال لاگین
 * - فقط با openLoginModal / closeLoginModal باز و بسته می‌شود
 * - هرگز به live وابسته نیست تا وسط سنک نپرد
 */
function LoginGate() {
  useSyncExternalStore(subscribeLogin, getLoginSnapshot, getLoginSnapshot);

  useEffect(() => {
    try {
      if (!isLoginModalOpen() && !isSessionAlive() && !hasLiveData()) {
        openLoginModal();
      }
    } catch {}
  }, []);

  if (!isLoginModalOpen()) return null;

  return (
    <LoginScreen
      asModal
      key="sarvestan-login-modal"
      onSuccess={async () => {
        try {
          window.history.replaceState({}, '', window.location.pathname);
        } catch {}
        // بعد از بستن مودال — حتماً یک سنک کامل بزن
        try {
          const { runFullSync, resetSyncState } = await import(
            './services/behestan/sync'
          );
          if (!hasLiveData()) {
            resetSyncState();
            await runFullSync({ force: true });
          }
        } catch {}
      }}
    />
  );
}
