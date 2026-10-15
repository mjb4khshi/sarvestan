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
import CurriculumChartModal from './components/CurriculumChartModal';
import FinanceModal from './components/FinanceModal';
import { getViewModel } from './data/viewModel';
import StudyScreen from './screens/StudyScreen';
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
  closeLoginModal,
  isLoginModalOpen,
} from './services/loginFlow';
import { getUniversityOrigin } from './services/behestan/session';
import { isSessionAlive } from './services/behestan/session';
import { hasLiveData } from './services/behestan/store';
import UpdateModal from './components/UpdateModal';
import BatBackground from './components/BatBackground';
import { checkForUpdate, hasDismissedUpdate, dismissUpdate } from './services/updater';
import { isBatNotifEnabled, scheduleBatNightNotification, initBatWebTimer } from './services/batMode';
import { initExtensionBridge } from './services/extensionBridge';

const TITLES = {
  schedule: 'برنامه هفتگی',
  grades: 'کارنامه و نمرات',
  study: 'مطالعه و پلنر',
  more: 'خدمات و تنظیمات',
};

const TABS_ORDER = ['schedule', 'grades', 'home', 'study', 'more'];

const pageVariants = {
  enter: (direction) => ({
    x: direction > 0 ? -28 : 28,
    opacity: 0,
    scale: 0.99,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: 'spring', stiffness: 380, damping: 34, mass: 0.8 },
      opacity: { duration: 0.16, ease: 'easeOut' },
      scale: { duration: 0.16, ease: 'easeOut' },
    },
  },
  exit: (direction) => ({
    x: direction > 0 ? 28 : -28,
    opacity: 0,
    scale: 0.99,
    transition: {
      x: { duration: 0.14, ease: [0.32, 0, 0.67, 0] },
      opacity: { duration: 0.12, ease: 'linear' },
      scale: { duration: 0.14 },
    },
  }),
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
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [exitToast, setExitToast] = useState(false);
  const lastBackPressRef = useRef(0);
  const [slideDir, setSlideDir] = useState(0);
  const showBack = tab !== 'home';
  const pointerStartRef = useRef(null);
  const vm = getViewModel();

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('sso') || qs.get('sso_error')) {
      setTab('more');
      try {
        window.history.replaceState({}, '', window.location.pathname);
      } catch {}
    }

    const triggerTarget = (rawTarget) => {
      const target = String(rawTarget || '').toLowerCase();
      if (target === 'schedule') {
        handleNavigate('schedule');
      } else if (target === 'behestan') {
        window.open(getUniversityOrigin() + '/', '_blank');
      } else if (target === 'vc') {
        window.open('https://vc.kntu.ac.ir/', '_blank');
      }
    };

    const onShortcut = (e) => {
      triggerTarget(e?.detail);
    };

    window.addEventListener('sarvShortcut', onShortcut);

    try {
      const { Plugins } = window.Capacitor || {};
      if (Plugins?.SarvestanIcon?.getPendingShortcut) {
        Plugins.SarvestanIcon.getPendingShortcut().then((res) => {
          if (res?.target) {
            triggerTarget(res.target);
          }
        }).catch(() => {});
      }
    } catch {}

    return () => window.removeEventListener('sarvShortcut', onShortcut);
  }, []);

  // راه‌اندازی و بررسی زمان‌بندی اعلان شبانه بت‌سیگنال (ساعت ۱۱ شب) و اتصال به افزونه
  useEffect(() => {
    initExtensionBridge();
    if (isBatNotifEnabled()) {
      scheduleBatNightNotification().catch(() => {});
      initBatWebTimer();
    }
  }, []);

  // مدیریت رویداد دکمه فیزیکی یا ژست بازگشت (Back) اندروید
  useEffect(() => {
    const onBackButton = (e) => {
      // ۱. اگر مودال لاگین باز باشد
      if (isLoginModalOpen()) {
        closeLoginModal();
        e?.preventDefault?.();
        return;
      }

      // ۲. تلاش برای بستن هر مودال باز در صفحات (چارت، مالی، آلارم، ...)
      const closeEvent = new CustomEvent('sarvCloseTopModal', { cancelable: true });
      const notHandled = window.dispatchEvent(closeEvent);
      if (!notHandled) {
        // یکی از کامپوننت‌ها رویداد را مصرف و بسته شد
        e?.preventDefault?.();
        return;
      }

      if (chartModalOpen) {
        setChartModalOpen(false);
        e?.preventDefault?.();
        return;
      }

      if (financeModalOpen) {
        setFinanceModalOpen(false);
        e?.preventDefault?.();
        return;
      }

      // ۳. اگر در تب دیگری غیر از خانه (میز کار) هستیم -> بازگشت به خانه
      if (tab !== 'home') {
        changeTabWithDirection('home');
        e?.preventDefault?.();
        return;
      }

      // ۴. در صفحه خانه: با دوبار فشردن دکمه بازگشت خارج می‌شود
      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        // بدون preventDefault: اجازه خروج به MainActivity داده می‌شود
        return;
      }

      lastBackPressRef.current = now;
      e?.preventDefault?.();
      setExitToast(true);
      setTimeout(() => setExitToast(false), 2000);
    };

    window.addEventListener('sarvBackButton', onBackButton);
    return () => window.removeEventListener('sarvBackButton', onBackButton);
  }, [tab, chartModalOpen, financeModalOpen]);

  const changeTabWithDirection = (targetTab, explicitDir = null) => {
    const currentIndex = TABS_ORDER.indexOf(tab);
    const nextIndex = TABS_ORDER.indexOf(targetTab);
    if (explicitDir !== null) {
      setSlideDir(explicitDir);
    } else if (currentIndex >= 0 && nextIndex >= 0) {
      const dir = nextIndex > currentIndex ? 1 : -1;
      setSlideDir(dir);
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
      setChartModalOpen(true);
      setFinanceModalOpen(false);
    } else if (targetTab === 'finance') {
      setFinanceModalOpen(true);
      setChartModalOpen(false);
    } else {
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

    // کشیدن انگشت به راست (dx > 0): رفتن به تب بعدی
    // کشیدن انگشت به چپ (dx < 0): رفتن به تب قبلی
    if (dx > 0 && currentIndex < TABS_ORDER.length - 1) {
      changeTabWithDirection(TABS_ORDER[currentIndex + 1]);
    } else if (dx < 0 && currentIndex > 0) {
      changeTabWithDirection(TABS_ORDER[currentIndex - 1]);
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
          <AnimatePresence mode="wait" custom={slideDir}>
            <motion.main
              key={tab}
              custom={slideDir}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
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
              {tab === 'study' && <StudyScreen onNavigate={handleNavigate} />}
              {tab === 'more' && <MoreScreen onNavigate={handleNavigate} />}
            </motion.main>
          </AnimatePresence>
        </div>

        {/* مودال چارت تحصیلی در سطح سراسری برنامه */}
        <CurriculumChartModal
          isOpen={chartModalOpen}
          onClose={() => setChartModalOpen(false)}
          curriculumState={vm?.curriculum}
          student={vm?.student}
        />

        {/* مودال امور مالی و شهریه در سطح سراسری برنامه */}
        <FinanceModal
          isOpen={financeModalOpen}
          onClose={() => setFinanceModalOpen(false)}
          onNavigate={handleNavigate}
        />

        {/* توست تأیید خروج هنگام دکمه بازگشت */}
        <AnimatePresence>
          {exitToast && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ duration: 0.16 }}
              className="fixed bottom-20 left-4 right-4 z-[999] mx-auto max-w-xs px-4 py-2.5 rounded-2xl bg-base-content text-base text-[12px] font-bold text-center shadow-2xl backdrop-blur-md border border-base-500/30 pointer-events-none"
            >
              برای خروج از برنامه، دوباره بازگشت را بزنید
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav active={tab} onChange={changeTabWithDirection} />
      </div>
    </div>
  );
}

export default function App() {
  try {
    const qs = new URLSearchParams(window.location.search);
    // صفحهٔ شبیه‌ساز استوری و پوستر با ?story=1
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
        <div className="relative">
          <BatBackground />
          <AutoUpdateGate />
          <LoginGate />
          <SsoCallbackBridge />
          <DataBootstrap />
          <Shell />
        </div>
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
