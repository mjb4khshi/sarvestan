/**
 * Behestan Live Synchronization & Dynamic Data Engine (Sarvestan Extension)
 * 
 * وظیفه این ماژول:
 * ۱. ارتباط زنده با سامانه بهستان دانشگاه صنعتی خواجه نصیرالدین طوسی (behestan.kntu.ac.ir)
 * ۲. تشخیص نشست فعال (Ticket / sid / کوکی‌ها)
 * ۳. استخراج داینامیک مشخصات هویتی، برنامه هفتگی، کارنامه و وضعیت مالی دانشجو
 * ۴. جلوگیری از هاردکد بودن اطلاعات شخصی و ذخیره امن در کش لوکال کاربر (chrome.storage.local / localStorage)
 * ۵. سوییچ خودکار به نمای اصلی بهستان برای درگاه‌های شاپرک و پرداخت شهریه
 */

const STORAGE_KEY_PROFILE = 'sarvestan_live_profile';
const STORAGE_KEY_SCHEDULE = 'sarvestan_live_schedule';
const STORAGE_KEY_GRADES = 'sarvestan_live_transcripts'; // هماهنگ با behestanData
const STORAGE_KEY_FINANCE = 'sarvestan_live_finance';
const STORAGE_KEY_AUTH = 'sarvestan_auth_status';
/** پرچم لاگاوت دستی — تا وقتی true باشد، هیچ سنکی پروفایل را برنمی‌گرداند */
const STORAGE_KEY_LOGOUT_LOCK = 'sarvestan_manual_logout';

/** پاک‌سازی عکس پروفایل — تگ <PHOTO> یا base64 ناقص را رد می‌کند */
function sanitizePhoto(photo) {
  if (!photo || typeof photo !== 'string') return null;
  let s = photo.trim();
  if (!s || /blank-profile-picture|avatar-placeholder|PHOTO/i.test(s)) return null;
  if (s.startsWith('data:image/')) {
    const m = s.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.*)$/is);
    if (!m) return null;
    const b64 = m[2].replace(/[^A-Za-z0-9+/=]/g, '');
    if (b64.length < 80) return null;
    const mime = m[1] === 'png' || b64.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${b64}`;
  }
  if (/^https?:\/\//i.test(s)) return s;
  return null;
}

// پروفایل عمومی پیش‌فرض (در صورت عدم لاگین یا حالت مهمان)
export const DEFAULT_GUEST_PROFILE = {
  fullName: 'دانشجوی میهمان',
  firstName: 'دانشجو',
  lastName: 'میهمان',
  studentId: 'ـ',
  userId: 'ـ',
  university: 'دانشگاه صنعتی خواجه نصیرالدین طوسی',
  systemName: 'سامانه جامع بهستان',
  faculty: 'دانشگاه صنعتی خواجه نصیرالدین طوسی',
  department: 'ـ',
  major: 'دانشجو',
  degree: 'کارشناسی',
  term: 'نیم‌سال تحصیلی جاری',
  termNo: '4051',
  lastLogin: 'در انتظار ورود',
  photo: null,
  status: 'در انتظار لاگین به بهستان',
  standing: 'در انتظار ورود به بهستان',
  totalUnitsPassed: 0,
  totalUnitsRequired: 140,
  gpa: 'ـ',
  isLoggedIn: false
};

class BehestanSyncEngine {
  constructor() {
    this.listeners = new Set();
    this.currentProfile = this.loadLocal(STORAGE_KEY_PROFILE, DEFAULT_GUEST_PROFILE);
    // حذف عکس خراب از کش قبلی
    this.currentProfile = {
      ...this.currentProfile,
      photo: sanitizePhoto(this.currentProfile.photo)
    };
    this.authStatus = this.loadLocal(STORAGE_KEY_AUTH, { loggedIn: false, lastCheck: null });
    if (this.isManualLogout()) {
      this.currentProfile = { ...DEFAULT_GUEST_PROFILE };
      this.authStatus = { loggedIn: false, lastCheck: this.authStatus.lastCheck };
    }

    // ۱. بررسی پارامترهای URL (هنگامی که داشبورد از بهستان لود می‌شود)
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlName = urlParams.get('name');
        const urlStd = urlParams.get('std');
        const urlLoggedIn = urlParams.get('loggedIn') === 'true' || !!(urlName && !urlName.includes('میهمان'));

        if (urlName || urlStd || urlLoggedIn) {
          this.currentProfile = {
            ...this.currentProfile,
            fullName: urlName || this.currentProfile.fullName || 'دانشجو',
            studentId: urlStd || this.currentProfile.studentId || 'ـ',
            faculty: urlParams.get('fac') || 'دانشگاه صنعتی خواجه نصیرالدین طوسی',
            major: urlParams.get('maj') || 'دانشجو',
            degree: 'کارشناسی',
            term: urlParams.get('term') || 'نیم‌سال اول سال تحصیلی ۰۵-۱۴۰۴ (۴۰۵۱)',
            termNo: '4051',
            status: 'مشغول به تحصیل (متصل به بهستان)',
            standing: urlParams.get('standing') || 'ـ',
            totalUnitsPassed: parseInt(urlParams.get('units') || '0', 10),
            totalUnitsRequired: 140,
            gpa: urlParams.get('gpa') || 'ـ',
            photo: sanitizePhoto(urlParams.get('photo')),
            isLoggedIn: true
          };
          this.authStatus = { loggedIn: true, lastCheck: new Date().toISOString() };
          this.saveLocal(STORAGE_KEY_PROFILE, this.currentProfile);
          this.saveLocal(STORAGE_KEY_AUTH, this.authStatus);
        }
      } catch (e) {
        console.warn('URL params parsing error:', e);
      }

      // ۲. دریافت پیام زنده از contentScript بهستان (postMessage)
      window.addEventListener('message', (event) => {
        if (event.data && event.data.action === 'INIT_LIVE_BEHESTAN_SESSION') {
          const payload = event.data.payload;
          if (payload && payload.isLoggedIn) {
            this.updateProfileFromBehestanData({
              fullName: payload.studentName || 'دانشجو',
              studentId: payload.studentId || 'ـ',
              faculty: payload.faculty || 'دانشگاه صنعتی خواجه نصیرالدین طوسی',
              major: payload.major || 'دانشجو',
              degree: 'کارشناسی',
              term: payload.term || 'نیم‌سال اول سال تحصیلی ۰۵-۱۴۰۴ (۴۰۵۱)',
              gpa: payload.gpa || 'ـ',
              totalUnitsPassed: payload.totalUnitsPassed || 0,
              standing: payload.standing || 'ـ',
              photo: payload.photo || null,
              isLoggedIn: true
            });
          }
        }
      });
    }

    // ۳. خواندن کش امن chrome.storage.local
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get([STORAGE_KEY_PROFILE, STORAGE_KEY_AUTH], (res) => {
        if (res && res[STORAGE_KEY_PROFILE] && res[STORAGE_KEY_PROFILE].isLoggedIn) {
          this.currentProfile = {
            ...this.currentProfile,
            ...res[STORAGE_KEY_PROFILE]
          };
          this.authStatus = res[STORAGE_KEY_AUTH] || { loggedIn: true };
          this.notify();
        }
      });

      // ۴. شنود تغییرات در حافظه محلی افزونه
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes[STORAGE_KEY_PROFILE]) {
          this.currentProfile = {
            ...this.currentProfile,
            ...changes[STORAGE_KEY_PROFILE].newValue
          };
          this.notify();
        }
      });
    }

    // ۵. ارتباط فوری با تب باز بهستان برای خواندن دیتای زنده
    this.syncWithActiveBehestanTab();

    // ۶. همگام‌سازی مجدد هنگام فوکوس روی پنجره
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => this.syncWithActiveBehestanTab());
    }
  }

  // همگام‌سازی بی‌درنگ با تب باز بهستان
  async syncWithActiveBehestanTab() {
    if (typeof chrome === 'undefined' || !chrome.tabs) return false;
    try {
      const tabs = await chrome.tabs.query({ url: ['*://*.kntu.ac.ir/*', '*://behestan.kntu.ac.ir/*'] });
      if (tabs && tabs.length > 0) {
        for (const tab of tabs) {
          try {
            chrome.tabs.sendMessage(tab.id, { action: 'GET_BEHESTAN_DATA' }, (response) => {
              if (chrome.runtime.lastError) return;
              if (response && response.isLoggedIn) {
                // اگر لاگاوت دستی بود و هنوز قفل است، خودکار باز نکن
                if (this.isManualLogout()) return;
                this.updateProfileFromBehestanData(response);
              }
            });
          } catch (e) {}
        }
        return true;
      }
    } catch (e) {
      console.warn('Tab sync error:', e);
    }
    return false;
  }

  // بررسی دستی اتصال — اگر نشست واقعی بهستان باشد، قفل لاگاوت باز می‌شود
  async checkConnection() {
    if (typeof chrome === 'undefined' || !chrome.tabs) return this.currentProfile.isLoggedIn;
    try {
      const tabs = await chrome.tabs.query({ url: ['*://behestan.kntu.ac.ir/*', '*://*.kntu.ac.ir/*'] });
      let found = false;
      for (const tab of tabs || []) {
        await new Promise((resolve) => {
          chrome.tabs.sendMessage(tab.id, { action: 'GET_BEHESTAN_DATA' }, (response) => {
            if (chrome.runtime.lastError || !response) {
              resolve();
              return;
            }
            if (response.isLoggedIn && response.studentId && response.studentId !== 'ـ') {
              found = true;
              this.unlockAfterLogin();
              this.updateProfileFromBehestanData({ ...response, _explicitUnlock: true });
            }
            resolve();
          });
        });
      }
      return found || this.currentProfile.isLoggedIn;
    } catch {
      return false;
    }
  }

  // متد دستی جهت کلیک دکمه همگام‌سازی در هدر
  async syncNow() {
    const synced = await this.syncWithActiveBehestanTab();
    if (!synced && typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get([STORAGE_KEY_PROFILE], (res) => {
        if (res && res[STORAGE_KEY_PROFILE] && res[STORAGE_KEY_PROFILE].isLoggedIn) {
          this.currentProfile = { ...this.currentProfile, ...res[STORAGE_KEY_PROFILE] };
          this.notify();
        }
      });
    }
    return this.currentProfile;
  }

  // ثبت لیسنر برای به‌روزرسانی آنی کامپوننت‌ها
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach(cb => {
      try { cb(this.currentProfile, this.authStatus); } catch (e) { console.error(e); }
    });
  }

  loadLocal(key, defaultVal) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  saveLocal(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [key]: val });
      }
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  // به‌روزرسانی پروفایل با دیتای دریافت شده از سرور بهستان
  updateProfileFromBehestanData(behestanUser) {
    if (!behestanUser) return;
    if (this.isManualLogout() && !behestanUser._explicitUnlock) {
      // بعد از لاگاوت دستی، سنک خودکار پروفایل را برنمی‌گرداند
      return;
    }

    const updated = {
      ...this.currentProfile,
      fullName: behestanUser.fullName || `${behestanUser.firstName || ''} ${behestanUser.lastName || ''}`.trim() || 'دانشجو',
      firstName: behestanUser.firstName || '',
      lastName: behestanUser.lastName || '',
      studentId: behestanUser.studentId || behestanUser.std || this.currentProfile.studentId || 'ـ',
      userId: behestanUser.userId || behestanUser.u || this.currentProfile.userId || 'ـ',
      major: behestanUser.major || behestanUser.B8 || this.currentProfile.major || 'دانشجو',
      faculty: behestanUser.faculty || behestanUser.B4 || this.currentProfile.faculty || 'دانشگاه صنعتی خواجه نصیرالدین طوسی',
      degree: behestanUser.degree || behestanUser.B6 || this.currentProfile.degree || 'کارشناسی',
      term: behestanUser.term || this.currentProfile.term || 'نیم‌سال اول سال تحصیلی ۰۵-۱۴۰۴ (۴۰۵۱)',
      gpa: behestanUser.gpa || this.currentProfile.gpa || 'ـ',
      totalUnitsPassed: behestanUser.totalUnitsPassed !== undefined ? behestanUser.totalUnitsPassed : this.currentProfile.totalUnitsPassed,
      standing: behestanUser.standing || this.currentProfile.standing || 'ـ',
      photo: sanitizePhoto(behestanUser.photo || (behestanUser.photoBase64 ? `data:image/jpeg;base64,${behestanUser.photoBase64}` : this.currentProfile.photo)),
      status: 'مشغول به تحصیل (متصل به بهستان)',
      lastLogin: behestanUser.lastLogin || new Date().toLocaleDateString('fa-IR'),
      isLoggedIn: true
    };

    this.currentProfile = updated;
    this.saveLocal(STORAGE_KEY_PROFILE, updated);
    this.authStatus = { loggedIn: true, lastCheck: new Date().toISOString() };
    this.saveLocal(STORAGE_KEY_AUTH, this.authStatus);
    this.notify();
  }

  isManualLogout() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        // همگان async است؛ برای مقداردهی اولیه از localStorage هم می‌خوانیم
      }
      return localStorage.getItem(STORAGE_KEY_LOGOUT_LOCK) === '1';
    } catch {
      return false;
    }
  }

  setManualLogoutFlag(on) {
    try {
      if (on) localStorage.setItem(STORAGE_KEY_LOGOUT_LOCK, '1');
      else localStorage.removeItem(STORAGE_KEY_LOGOUT_LOCK);
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        if (on) chrome.storage.local.set({ [STORAGE_KEY_LOGOUT_LOCK]: true });
        else chrome.storage.local.remove(STORAGE_KEY_LOGOUT_LOCK);
      }
    } catch (_) {}
  }

  // خروج از حساب و بازگشت به حالت مهمان
  logout() {
    this.setManualLogoutFlag(true);
    this.currentProfile = { ...DEFAULT_GUEST_PROFILE };
    this.authStatus = { loggedIn: false, lastCheck: new Date().toISOString() };
    this.saveLocal(STORAGE_KEY_PROFILE, this.currentProfile);
    this.saveLocal(STORAGE_KEY_AUTH, this.authStatus);

    // پاک‌سازی localStorage داشبورد هم
    try {
      localStorage.removeItem(STORAGE_KEY_PROFILE);
      localStorage.removeItem(STORAGE_KEY_AUTH);
      localStorage.removeItem('sarvestan_live_schedule');
      localStorage.removeItem('sarvestan_live_exams');
      localStorage.removeItem('sarvestan_live_transcripts');
      localStorage.removeItem('sarvestan_live_finance');
      localStorage.removeItem('sarvestan_live_courses');
      localStorage.removeItem('sarvestan_live_workflows');
      localStorage.removeItem('sarvestan_live_curriculum_stats');
    } catch (_) {}

    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [STORAGE_KEY_LOGOUT_LOCK]: true });
        chrome.storage.local.remove([
          'sarvestan_live_profile',
          'sarvestan_auth_status',
          'sarvestan_live_schedule',
          'sarvestan_live_exams',
          'sarvestan_live_transcripts',
          'sarvestan_live_finance',
          'sarvestan_live_courses',
          'sarvestan_live_workflows',
          'sarvestan_live_curriculum_stats'
        ]);
      }
    } catch (_) {}

    try {
      if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
        chrome.tabs.query({ url: ['*://behestan.kntu.ac.ir/*', '*://*.kntu.ac.ir/*'] }, (tabs) => {
          for (const tab of tabs || []) {
            try {
              chrome.tabs.sendMessage(tab.id, { action: 'SARVESTAN_LOGOUT', reason: 'user' });
            } catch (_) {}
          }
        });
      }
    } catch (_) {}

    this.notify();
  }

  /** فقط با ورود صریح کاربر قفل باز شود */
  unlockAfterLogin() {
    this.setManualLogoutFlag(false);
    // قفل را روی تب‌های باز بهستان هم پاک کن تا داده‌ها دوباره جاری شوند
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
        chrome.tabs.query({ url: ['*://behestan.kntu.ac.ir/*', '*://*.kntu.ac.ir/*'] }, (tabs) => {
          for (const tab of tabs || []) {
            try {
              chrome.tabs.sendMessage(tab.id, { action: 'SARVESTAN_UNLOCK' });
            } catch (_) {}
          }
        });
      }
    } catch (_) {}
  }

  // سوییچ خودکار به صفحه اصلی و سنتی بهستان جهت تراکنش و پرداخت شهریه شاپرک
  switchToNativeBehestanPayment(amountToman) {
    console.log('Switching to native Behestan payment view for secure Shaparak transaction...');
    
    // اگر در تب افزونه یا صفحه وب هستیم
    const behestanPaymentUrl = 'https://behestan.kntu.ac.ir/frm/sys/sys.svc/';
    
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ url: '*://behestan.kntu.ac.ir/*' }, (tabs) => {
        if (tabs && tabs.length > 0) {
          chrome.tabs.update(tabs[0].id, { active: true });
          // ارسال پیام به کانتنت اسکریپت برای سوییچ به تم کلاسیک
          chrome.tabs.sendMessage(tabs[0].id, { action: 'SWITCH_TO_CLASSIC_PAYMENT', amount: amountToman });
        } else {
          chrome.tabs.create({ url: 'https://behestan.kntu.ac.ir/' });
        }
      });
    } else {
      // ریدایرکت مستقیم یا باز کردن در تب جدید
      window.open('https://behestan.kntu.ac.ir/', '_blank');
    }
  }

  // هدایت مستقیم به صفحه لاگین بهستان
  openBehestanLogin() {
    const loginUrl = 'https://behestan.kntu.ac.ir/';
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: loginUrl });
    } else {
      window.open(loginUrl, '_blank');
    }
  }
}

export const liveSync = new BehestanSyncEngine();
export default liveSync;
