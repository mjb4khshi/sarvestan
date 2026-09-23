import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
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
import StoryPreviewScreen from './screens/StoryPreviewScreen';
import WidgetPreviewScreen from './screens/WidgetPreviewScreen';
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
import UpdateModal from './components/UpdateModal';
import { checkForUpdate, hasDismissedUpdate, dismissUpdate } from './services/updater';

const TITLES = {
  schedule: 'برنامه هفتگی',
  grades: 'کارنامه و نمرات',
  finance: 'امور مالی و شهریه',
  more: 'خدمات و تنظیمات',
};

const TABS_ORDER = ['schedule', 'grades', 'home', 'finance', 'more'];

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
  const [slideDir, setSlideDir] = useState(0);
  const showBack = tab !== 'home';
  const pointerStartRef = useRef(null);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('sso') || qs.get('sso_error')) {
      setTab('more');
      try {
        window.history.replaceState({}, '', window.location.pathname);
      } catch {}
    }
  }, []);

  const changeTabWithDirection = (targetTab, explicitDir = null) => {
    const currentIndex = TABS_ORDER.indexOf(tab);
    const nextIndex = TABS_ORDER.indexOf(targetTab);
    if (explicitDir !== null) {
      setSlideDir(explicitDir);
    } else if (currentIndex >= 0 && nextIndex >= 0) {
      setSlideDir(nextIndex > currentIndex ? 1 : -1);
    }
    setTab(targetTab);
  };

  const handleNavigate = (targetTab, options = {}) => {
    if (targetTab === 'timetable') {
      setScheduleDefaultView('matrix');
      changeTabWithDirection('schedule');
    } else if (targetTab === 'schedule') {
      if (options.view) setScheduleDefaultView(options.view);
      changeTabWithDirection('schedule');
    } else if (targetTab === 'chart') {
      setChartAutoOpen(true);
      changeTabWithDirection('more');
    } else {
      if (targetTab === 'more' && options.openChart) {
        setChartAutoOpen(true);
      } else {
        setChartAutoOpen(false);
      }
      changeTabWithDirection(targetTab);
    }
  };

  // جلوگیری از تداخل با اسکرول افقی جدول‌ها، ورودی‌های متنی، دکمه‌ها و لینک‌ها
  const isNoSwipeElement = (target) => {
    if (!target || typeof target.closest !== 'function') return false;
    return Boolean(
      target.closest(
        'input, textarea, select, [data-no-swipe], .no-swipe, .overflow-x-auto, table, [role="slider"], button, a'
      )
    );
  };

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (isNoSwipeElement(e.target)) return;
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  };

  const handlePointerUp = (e) => {
    if (!pointerStartRef.current) return;
    const { x: startX, y: startY, time: startTime } = pointerStartRef.current;
    pointerStartRef.current = null;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const elapsed = Date.now() - startTime;

    if (elapsed > 450) return;
    if (Math.abs(dx) < 35 || Math.abs(dx) <= Math.abs(dy) * 1.3) return;

    const currentIndex = TABS_ORDER.indexOf(tab);
    if (currentIndex < 0) return;

    // کشیدن به راست (dx > 0) -> تب بعدی سمت چپ (افزایش اندیس)
    // کشیدن به چپ (dx < 0) -> تب قبلی سمت راست (کاهش اندیس)
    if (dx > 0 && currentIndex < TABS_ORDER.length - 1) {
      changeTabWithDirection(TABS_ORDER[currentIndex + 1], 1);
    } else if (dx < 0 && currentIndex > 0) {
      changeTabWithDirection(TABS_ORDER[currentIndex - 1], -1);
    }
  };

  const handlePointerCancel = () => {
    pointerStartRef.current = null;
  };

  return (
    <div className="min-h-full bg-base text-base-content selection:bg-primary/30 selection:text-primary">
      <div className="mobile-shell min-h-screen relative flex flex-col justify-between">
        <TopBar
          title={TITLES[tab] || null}
          onBack={showBack ? () => changeTabWithDirection('home') : undefined}
          onNavigate={handleNavigate}
        />

        <div
          className="flex-1 flex flex-col min-w-0 overflow-x-hidden touch-pan-y select-none"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <AnimatePresence mode="wait">
            <motion.main
              key={tab}
              initial={{ opacity: 0, x: slideDir * 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -slideDir * 8 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
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
        </div>

        <BottomNav active={tab} onChange={changeTabWithDirection} />
      </div>
    </div>
  );
}

export default function App() {
  // صفحهٔ پیش‌نمایش پوسترها با ?story=1 یا ?preview=1
  try {
    const qs = new URLSearchParams(window.location.search);
    if (qs.has('story') || qs.has('preview')) {
      return (
        <ErrorBoundary>
          <ThemeProvider>
            <StoryPreviewScreen onBack={() => { window.location.href = '/'; }} />
          </ThemeProvider>
        </ErrorBoundary>
      );
    }
    // صفحهٔ پیش‌نمایش ویجت‌های اندروید با ?widgets=1 یا ?widget=1
    if (qs.has('widget') || qs.has('widgets')) {
      return (
        <ErrorBoundary>
          <ThemeProvider>
            <WidgetPreviewScreen onBack={() => { window.location.href = '/'; }} />
          </ThemeProvider>
        </ErrorBoundary>
      );
    }
    // صفحهٔ لاگین تمام‌صفحه با ?login=1 (برای خروج دستی و لینک مستقیم)
    if (qs.has('login')) {
      return (
        <ErrorBoundary>
          <ThemeProvider>
            <LoginScreen
              onSuccess={() => {
                try {
                  sessionStorage.removeItem('sarvestan_manual_logout');
                } catch {}
                window.location.replace(window.location.origin + window.location.pathname);
              }}
            />
          </ThemeProvider>
        </ErrorBoundary>
      );
    }
  } catch {}

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AutoUpdateGate />
        <LoginGate />
        <SsoCallbackBridge />
        <DataBootstrap />
        <Shell />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

/**
 * بررسی مخفیانه و خودکار به‌روزرسانی هنگام ورود
 * در صورت وجود نسخه جدید و عدم رد در نشست جاری، مودال به‌روزرسانی نمایش می‌یابد
 */
function AutoUpdateGate() {
  const [updateRelease, setUpdateRelease] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await checkForUpdate();
        if (!active) return;
        if (res.hasUpdate && res.latestRelease) {
          if (!hasDismissedUpdate(res.latestRelease.tagName)) {
            setUpdateRelease(res.latestRelease);
          }
        }
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AnimatePresence>
      {updateRelease && (
        <UpdateModal
          key="sarvestan-auto-update-modal"
          release={updateRelease}
          onClose={() => {
            dismissUpdate(updateRelease.tagName);
            setUpdateRelease(null);
          }}
        />
      )}
    </AnimatePresence>
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
