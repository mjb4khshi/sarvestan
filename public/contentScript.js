/**
 * Sarvestan - Behestan Modern Overlay & Live Content Script
 * Injected into: *://behestan.kntu.ac.ir/* and *://*.kntu.ac.ir/*
 */

console.log('[Sarvestan Extension] Content script loaded on Behestan.');

// ── تزریق مستقیم اینترسپتور به MAIN world در صورت نیاز ──
function injectMainWorldInterceptor() {
  if (document.getElementById('sarvestan-interceptor-script')) return;
  // اگر قبلاً در MAIN world فعال شده، فقط برای re-inject مجدد اگر نیاز بود
  try {
    const script = document.createElement('script');
    script.id = 'sarvestan-interceptor-script';
    script.src = chrome.runtime.getURL('behestanInterceptor.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  } catch (err) {
    console.warn('[Sarvestan Extension] Script injection error:', err);
  }
}
injectMainWorldInterceptor();

// ── ذخیره داده‌ها در حافظه محلی و chrome.storage ──
function normalizeCourseName(name) {
  if (!name) return '';
  return String(name)
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
    .replace(/\s+/g, ' ')
    .trim();
}

// واحد و نام استاندارد دروس F1825 روی برنامه هفتگی
function enrichScheduleFromCourses(courses) {
  if (!Array.isArray(courses) || !courses.length) return;
  const byCode = {};
  for (const c of courses) {
    if (c && c.code) {
      byCode[String(c.code)] = {
        units: c.units > 0 ? c.units : 0,
        name: c.name ? normalizeCourseName(c.name) : null,
        type: c.type || null
      };
    }
  }
  const schedule = readStorage('sarvestan_live_schedule', {}) || {};
  let changed = false;
  for (const termId of Object.keys(schedule)) {
    const list = schedule[termId];
    if (!Array.isArray(list)) continue;
    for (const course of list) {
      if (!course || !course.code) continue;
      const hit = byCode[String(course.code)];
      if (!hit) continue;
      if (hit.units > 0 && course.units !== hit.units) {
        course.units = hit.units;
        changed = true;
      }
      if (hit.name) {
        const norm = normalizeCourseName(hit.name);
        if (norm && course.name !== norm) {
          course.name = norm;
          changed = true;
        }
      }
      if (hit.type && (!course.type || course.type === 'ـ' || course.type === 'تخصصی')) {
        // فقط اگر type قبلاً پیش‌فرض بود یا خالی بود
        if (course.type !== hit.type) {
          course.type = hit.type;
          changed = true;
        }
      }
    }
  }
  if (changed) {
    saveStorage('sarvestan_live_schedule', schedule);
    forwardToOverlay('SARVESTAN_DATA_UPDATE', { dataType: 'schedule', payload: schedule });
    console.log('[Sarvestan] schedule enriched from courses');
  }
}

function saveStorage(key, data) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ [key]: data });
    }
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('[Sarvestan] saveStorage error:', e);
  }
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// ۱. استخراج مشخصات دانشجو از ساختار صفحات و حافظه محلی سامانه بهستان
function scanBehestanDOM() {
  let studentName = null;
  let studentId = null;
  let photoUrl = null;
  let faculty = 'دانشگاه صنعتی خواجه نصیرالدین طوسی';
  let major = 'دانشجو';
  const degree = 'کارشناسی';

  try {
    // الف: استخراج شماره دانشجویی مستقیماً از حافظه محلی سامانه بهستان (کلید 'un' یا 'sid')
    studentId = localStorage.getItem('un') || null;

    const pageText = document.body ? document.body.innerText : (document.documentElement ? document.documentElement.innerText : '');

    // ب: بررسی تگ‌های کاربری نبولار / هدر بهستان برای نام
    const nbUser = document.querySelector('nb-user');
    if (nbUser) {
      studentName = nbUser.getAttribute('name') ||
                    nbUser.querySelector('.user-name')?.innerText?.trim() ||
                    nbUser.querySelector('.info-container .user-name')?.innerText?.trim();

      // استخراج عکس کاربر از نبولار در صورت وجود
      const nbUserImg = nbUser.querySelector('.user-picture img');
      if (nbUserImg && nbUserImg.src && !nbUserImg.src.includes('blank-profile-picture')) {
        photoUrl = nbUserImg.src;
      }
    }

    // ج: جستجوی نام کاربری در المان‌های هدر یا پروفایل
    if (!studentName && document.body) {
      const headerUserEl = document.querySelector('.user-title, #lblUser, #userName, span[id*="User"], .header-user, .user-profile-name');
      if (headerUserEl && headerUserEl.innerText) {
        studentName = headerUserEl.innerText.replace(/^(کاربر|دانشجو)\s*[:\-]?\s*/, '').trim();
      }
    }

    // د: استخراج شماره دانشجویی با الگوی عددی در صورت عدم وجود در localStorage
    if (!studentId) {
      const stdMatch = pageText.match(/\b(40[0-9]{6,7}|99[0-9]{6}|98[0-9]{6})\b/);
      if (stdMatch) studentId = stdMatch[1];
    }

    // ه: بررسی علائم فعال بودن سامانه بهستان برای دانشجو
    const isBehestan = window.location.hostname.includes('kntu.ac.ir');
    const hasStudentKeywords = pageText.includes('دانشجو') ||
                               pageText.includes('اطلاعات تحصیلی') ||
                               pageText.includes('پرداخت بدهی') ||
                               pageText.includes('پرگاربرد') ||
                               pageText.includes('کارنامه');

    const isLoggedIn = isBehestan && (!!studentId || !!studentName || hasStudentKeywords);

    // و: خواندن کش قبلی برای مقادیر موجود
    const cachedProfile = readStorage('sarvestan_live_profile', {});

    return {
      studentName: studentName || cachedProfile.fullName || (isLoggedIn ? 'دانشجو' : 'دانشجوی میهمان'),
      studentId: studentId || cachedProfile.studentId || (isLoggedIn ? 'ـ' : 'ـ'),
      faculty: cachedProfile.faculty || faculty,
      major: cachedProfile.major || major,
      degree: cachedProfile.degree || degree,
      term: cachedProfile.term || 'نیم‌سال اول تحصیلی ۰۵-۱۴۰۴ (۴۰۵۱)',
      totalUnitsPassed: cachedProfile.totalUnitsPassed || 0,
      gpa: cachedProfile.gpa || 'ـ',
      standing: cachedProfile.standing || 'ـ',
      photo: photoUrl || cachedProfile.photo || null,
      isLoggedIn: isLoggedIn
    };
  } catch (err) {
    console.warn('[Sarvestan] Session scan warning:', err);
    return {
      studentName: 'دانشجو',
      studentId: 'ـ',
      faculty,
      major,
      degree,
      term: 'نیم‌سال اول تحصیلی ۰۵-۱۴۰۴ (۴۰۵۱)',
      totalUnitsPassed: 0,
      gpa: 'ـ',
      standing: 'ـ',
      photo: null,
      isLoggedIn: false
    };
  }
}

// ── شنود داده‌های استخراج‌شده توسط behestandInterceptor ──
window.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'SARVESTAN_INTERCEPTED_DATA') {
    const { dataType, payload } = event.data;
    handleInterceptedData(dataType, payload);
  }
});

function handleInterceptedData(dataType, payload) {
  if (!dataType || !payload) return;
  // بعد از لاگاوت فقط پروفایل/نشست را برنگردان؛ داده گزارش‌ها را هنوز پردازش کن
  // (تا وقتی کاربر خودش گزارش ۷۸ را در بهستان باز کند یا بعد از unlock برنامه بیاید)
  const locked = isManualLogoutLockedSync();
  if (locked && (dataType === 'profile_update' || dataType === 'session_info')) {
    return;
  }

  switch (dataType) {
    case 'profile_update': {
      const currentProfile = readStorage('sarvestan_live_profile', scanBehestanDOM());
      const updated = { ...currentProfile, ...payload, isLoggedIn: true };
      saveStorage('sarvestan_live_profile', updated);
      forwardToOverlay('INIT_LIVE_BEHESTAN_SESSION', updated);
      break;
    }
    case 'transcripts': {
      saveStorage('sarvestan_live_transcripts', payload);
      forwardToOverlay('SARVESTAN_DATA_UPDATE', { dataType: 'transcripts', payload });
      break;
    }
    case 'courses': {
      saveStorage('sarvestan_live_courses', payload);
      forwardToOverlay('SARVESTAN_DATA_UPDATE', { dataType: 'courses', payload });
      // غنی‌سازی برنامه هفتگی از دروس F1825 (واحد و نام نرمال)
      enrichScheduleFromCourses(payload);
      break;
    }
    case 'schedule_enrich': {
      if (payload && payload.courses) enrichScheduleFromCourses(payload.courses);
      break;
    }
    case 'finance': {
      saveStorage('sarvestan_live_finance', payload);
      forwardToOverlay('SARVESTAN_DATA_UPDATE', { dataType: 'finance', payload });
      break;
    }
    case 'schedule': {
      // payload: { termId, courses: [] }
      const prevSchedule = readStorage('sarvestan_live_schedule', {}) || {};
      const termId = payload && payload.termId;
      const courses = (payload && payload.courses) || [];
      if (termId) {
        const next = { ...prevSchedule, [termId]: courses };
        saveStorage('sarvestan_live_schedule', next);
        forwardToOverlay('SARVESTAN_DATA_UPDATE', { dataType: 'schedule', payload: next });
        console.log(
          '[Sarvestan] schedule saved term=' + termId +
          ' count=' + courses.length +
          ' names=' + courses.map(c => c.name).join(' | ')
        );
      }
      break;
    }
    case 'exams': {
      // payload: { termId, exams: [] }
      const prevExams = readStorage('sarvestan_live_exams', {}) || {};
      const examTerm = payload && payload.termId;
      const exams = (payload && payload.exams) || [];
      if (examTerm) {
        const next = { ...prevExams, [examTerm]: exams };
        saveStorage('sarvestan_live_exams', next);
        forwardToOverlay('SARVESTAN_DATA_UPDATE', { dataType: 'exams', payload: next });
        console.log('[Sarvestan] exams saved term=' + examTerm + ' count=' + exams.length);
      }
      break;
    }
    case 'curriculum_stats': {
      saveStorage('sarvestan_live_curriculum_stats', payload);
      forwardToOverlay('SARVESTAN_DATA_UPDATE', { dataType: 'curriculumStats', payload });
      console.log('[Sarvestan] curriculum stats saved');
      break;
    }
    case 'workflows': {
      saveStorage('sarvestan_live_workflows', payload);
      forwardToOverlay('SARVESTAN_DATA_UPDATE', { dataType: 'workflows', payload });
      break;
    }
    case 'session_info': {
      const cur = readStorage('sarvestan_live_profile', scanBehestanDOM());
      if (payload.studentId && !cur.studentId) cur.studentId = payload.studentId;
      saveStorage('sarvestan_live_profile', cur);
      break;
    }
  }
}

function forwardToOverlay(action, payload) {
  if (sarvestanOverlayIframe && sarvestanOverlayIframe.contentWindow) {
    try {
      sarvestanOverlayIframe.contentWindow.postMessage({ action, payload }, '*');
    } catch(e) {}
  }
}

// ذخیره مداوم نشست در کش امن افزونه
function syncStorage(session) {
  if (session && session.isLoggedIn) {
    const existing = readStorage('sarvestan_live_profile', {});
    const merged = {
      fullName: session.studentName || existing.fullName || 'دانشجو',
      studentId: session.studentId || existing.studentId || 'ـ',
      faculty: session.faculty || existing.faculty,
      major: session.major || existing.major,
      degree: session.degree || existing.degree,
      term: session.term || existing.term,
      totalUnitsPassed: session.totalUnitsPassed || existing.totalUnitsPassed || 0,
      gpa: session.gpa !== 'ـ' ? session.gpa : (existing.gpa || 'ـ'),
      standing: session.standing !== 'ـ' ? session.standing : (existing.standing || 'ـ'),
      photo: session.photo || existing.photo || null,
      isLoggedIn: true,
      lastLogin: new Date().toLocaleDateString('fa-IR')
    };

    saveStorage('sarvestan_live_profile', merged);
    saveStorage('sarvestan_auth_status', {
      loggedIn: true,
      lastCheck: new Date().toISOString()
    });
  }
}

// ۲. مدیریت لایه و پنجره هوشمند سروستان روی سامانه بهستان
let sarvestanOverlayIframe = null;

function toggleSarvestanOverlay() {
  const session = scanBehestanDOM();
  syncStorage(session);

  const queryParams = new URLSearchParams({
    mode: 'overlay',
    name: session.studentName || (session.isLoggedIn ? 'دانشجو' : 'دانشجوی میهمان'),
    std: session.studentId || 'ـ',
    gpa: session.gpa || 'ـ',
    units: String(session.totalUnitsPassed || 0),
    standing: session.standing || 'ـ',
    loggedIn: session.isLoggedIn ? 'true' : 'false'
  });
  if (session.photo) {
    queryParams.set('photo', session.photo);
  }

  const overlayUrl = chrome.runtime.getURL(`index.html?${queryParams.toString()}`);

  if (!sarvestanOverlayIframe) {
    sarvestanOverlayIframe = document.createElement('iframe');
    sarvestanOverlayIframe.id = 'sarvestan-fullscreen-overlay';
    sarvestanOverlayIframe.src = overlayUrl;
    sarvestanOverlayIframe.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 2147483645 !important;
      border: none !important;
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      display: block !important;
    `;

    sarvestanOverlayIframe.onload = () => {
      setTimeout(() => {
        forwardToOverlay('INIT_LIVE_BEHESTAN_SESSION', session);
        // همچنین بقیه داده‌های کش شده را بفرست
        const trans = readStorage('sarvestan_live_transcripts', null);
        if (trans) forwardToOverlay('SARVESTAN_DATA_UPDATE', { dataType: 'transcripts', payload: trans });
        const fin = readStorage('sarvestan_live_finance', null);
        if (fin) forwardToOverlay('SARVESTAN_DATA_UPDATE', { dataType: 'finance', payload: fin });
        const courses = readStorage('sarvestan_live_courses', null);
        if (courses) forwardToOverlay('SARVESTAN_DATA_UPDATE', { dataType: 'courses', payload: courses });
        const wf = readStorage('sarvestan_live_workflows', null);
        if (wf) forwardToOverlay('SARVESTAN_DATA_UPDATE', { dataType: 'workflows', payload: wf });
      }, 120);
    };

    const targetContainer = document.body || document.documentElement;
    if (targetContainer) {
      targetContainer.appendChild(sarvestanOverlayIframe);
    }
  } else {
    const isHidden = sarvestanOverlayIframe.style.display === 'none';
    sarvestanOverlayIframe.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      forwardToOverlay('INIT_LIVE_BEHESTAN_SESSION', session);
    }
  }
}

// بستن لایه با پیام از داخل آی‌فریم
window.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'CLOSE_SARVESTAN_OVERLAY') {
    if (sarvestanOverlayIframe) {
      sarvestanOverlayIframe.style.display = 'none';
    }
  }
});

// ۳. تزریق دکمه‌ها در هدر و داک شناور
function injectHeaderButton() {
  if (document.getElementById('sarvestan-header-btn')) return;

  const headerActions = document.querySelector('nb-actions, .header-container, header, .actions-container, [class*="action"]');
  if (!headerActions) return;

  const headerBtn = document.createElement('div');
  headerBtn.id = 'sarvestan-header-btn';
  headerBtn.title = 'داشبورد هوشمند سروستان (سرو ۲.۰)';
  headerBtn.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin: 0 4px;
    border-radius: 10px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    z-index: 1000;
  `;

  headerBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  `;

  headerBtn.onmouseover = () => {
    headerBtn.style.transform = 'scale(1.08)';
    headerBtn.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.6)';
  };
  headerBtn.onmouseout = () => {
    headerBtn.style.transform = 'scale(1)';
    headerBtn.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.4)';
  };

  headerBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSarvestanOverlay();
  };

  headerActions.insertBefore(headerBtn, headerActions.firstChild);
}

function injectFloatingDock() {
  if (window.self !== window.top) return;
  if (document.getElementById('sarvestan-floating-dock')) return;

  const targetContainer = document.body || document.documentElement;
  if (!targetContainer) return;

  const dock = document.createElement('div');
  dock.id = 'sarvestan-floating-dock';
  dock.style.cssText = `
    position: fixed !important;
    bottom: 24px !important;
    left: 24px !important;
    z-index: 2147483640 !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    font-family: inherit !important;
    direction: rtl !important;
  `;

  const btn = document.createElement('button');
  btn.innerText = 'سروستان | داشبورد هوشمند';
  btn.title = 'نمایش داشبورد مدرن، برنامه هفتگی، کارنامه و شهریه بهستان';
  btn.style.cssText = `
    background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
    color: #ffffff !important;
    font-size: 13px !important;
    font-weight: bold !important;
    padding: 10px 18px !important;
    border-radius: 9999px !important;
    border: 2px solid rgba(255, 255, 255, 0.45) !important;
    box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.55), 0 8px 10px -6px rgba(16, 185, 129, 0.4) !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    outline: none !important;
  `;

  btn.onmouseover = () => {
    btn.style.transform = 'translateY(-2px) scale(1.03)';
  };
  btn.onmouseout = () => {
    btn.style.transform = 'none';
  };

  btn.onclick = () => {
    toggleSarvestanOverlay();
  };

  const openTabBtn = document.createElement('button');
  openTabBtn.innerText = '↗';
  openTabBtn.title = 'باز کردن داشبورد در تب مستقل مرورگر';
  openTabBtn.style.cssText = `
    background: rgba(15, 23, 42, 0.9) !important;
    color: #38bdf8 !important;
    font-size: 14px !important;
    font-weight: bold !important;
    width: 38px !important;
    height: 38px !important;
    border-radius: 9999px !important;
    border: 1px solid rgba(56, 189, 248, 0.35) !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    backdrop-filter: blur(8px) !important;
    transition: all 0.2s ease !important;
    outline: none !important;
  `;

  openTabBtn.onclick = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'OPEN_SARVESTAN_DASHBOARD' });
    } else {
      window.open(chrome.runtime.getURL('index.html'), '_blank');
    }
  };

  dock.appendChild(btn);
  dock.appendChild(openTabBtn);
  targetContainer.appendChild(dock);
}

/**
 * باز کردن فرم در بهستان با POST act=nav (GET و fid خطای 405 می‌دهد)
 */
function openBehestanForm(fid) {
  if (!fid) return false;
  const sid = localStorage.getItem('sid') || '';
  const tRaw = localStorage.getItem('t') || '';
  let t = tRaw;
  if (t && String(t).trim().charAt(0) !== '{') {
    t = JSON.stringify({ Ticket: t, IdleTime: 5 });
  }

  const body = JSON.stringify({
    r: { fid: String(fid), ft: '1', subfrm: '' },
    act: 'nav',
    rp: {
      sp: '{"TrmType":"2","BrnNo":"0","BrnLimit":"0","UsrType":"0"}',
      loc: 'fa',
      ut: '0',
      b: '0',
      sid: sid
    },
    t: t
  });

  console.log('[Sarvestan] nav to form', fid, 'sid?', !!sid);

  return fetch('https://behestan.kntu.ac.ir/frm/sys/sys.svc/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  }).then(r => r.text()).then(txt => {
    console.log('[Sarvestan] nav response len', txt ? txt.length : 0);
    return true;
  }).catch(err => {
    console.warn('[Sarvestan] nav form error', fid, err);
    return false;
  });
}

// شنود از داشبورد (iframe) یا پیام داخل صفحه
window.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'OPEN_NATIVE_BEHESTAN_FORM' && event.data.code) {
    openBehestanForm(event.data.code);
  }
});

// ۴. شنود پیام‌های ارسالی از بک‌گراند و تب داشبورد
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'GET_BEHESTAN_DATA') {
      const data = scanBehestanDOM();
      syncStorage(data);
      sendResponse(data);
      return true;
    }
    if (msg.action === 'TOGGLE_SARVESTAN_OVERLAY') {
      toggleSarvestanOverlay();
      sendResponse({ status: 'OK' });
      return true;
    }
    if (msg.action === 'SWITCH_TO_CLASSIC_PAYMENT') {
      if (sarvestanOverlayIframe) {
        sarvestanOverlayIframe.style.display = 'none';
      }
      sendResponse({ status: 'OK' });
      return true;
    }
    if (msg.action === 'SARVESTAN_FORCE_SYNC') {
      try {
        // MAIN world ≠ ISOLATED world → فقط postMessage
        window.postMessage({
          action: 'SARVESTAN_FORCE_SYNC_CMD',
          source: 'sarvestan-content'
        }, '*');
        injectMainWorldInterceptor();
        const session = scanBehestanDOM();
        syncStorage(session);
        sendResponse({ status: 'FORCED', isLoggedIn: !!session.isLoggedIn });
      } catch (e) {
        sendResponse({ status: 'ERROR', error: String(e) });
      }
      return true;
    }
    if (msg.action === 'SARVESTAN_LOGOUT') {
      try { localStorage.setItem('sarvestan_manual_logout', '1'); } catch (_) {}
      window.postMessage({ action: 'SARVESTAN_LOGOUT', reason: msg.reason || 'user' }, '*');
      sendResponse({ status: 'LOGOUT_NOTED' });
      return true;
    }
    if (msg.action === 'SARVESTAN_REFRESH_SCHEDULE') {
      // فقط گزارش ۷۸ برای ترم‌های رایج — سریع و سبک
      try {
        window.postMessage({ action: 'SARVESTAN_REFRESH_SCHEDULE', reason: 'ui' }, '*');
        sendResponse({ status: 'REFRESH_SCHEDULE' });
      } catch (e) {
        sendResponse({ status: 'ERROR' });
      }
      return true;
    }
    if (msg.action === 'SARVESTAN_UNLOCK') {
      try { localStorage.removeItem('sarvestan_manual_logout'); } catch (_) {}
      window.postMessage({ action: 'SARVESTAN_UNLOCK', reason: 'user-reconnect' }, '*');
      // داده‌های بلافاصله بعد از unlock دوباره جاری شوند
      try {
        const session = scanBehestanDOM();
        syncStorage(session);
      } catch (_) {}
      sendResponse({ status: 'UNLOCKED' });
      return true;
    }
    if (msg.action === 'OPEN_BEHESTAN_FORM') {
      const fid = msg.fid || msg.code;
      openBehestanForm(fid).then((ok) => {
        sendResponse({ status: ok ? 'NAVIGATED' : 'ERROR', fid });
      });
      return true;
    }
  });
}

// ۵. حلقه همگام‌سازی و اطمینان از حضور المان‌ها پس از رندرهای دینامیک آنگولار
function isManualLogoutLockedSync() {
  try { return localStorage.getItem('sarvestan_manual_logout') === '1'; } catch (_) { return false; }
}

// قفل دائم در chrome.storage (فراتر از localStorage صفحه)
function ensureLogoutLockWatcher() {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
  chrome.storage.local.get('sarvestan_manual_logout', (res) => {
    if (res && res.sarvestan_manual_logout) {
      try { localStorage.setItem('sarvestan_manual_logout', '1'); } catch (_) {}
    }
  });
  if (chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes.sarvestan_manual_logout) return;
      if (changes.sarvestan_manual_logout.newValue) {
        try { localStorage.setItem('sarvestan_manual_logout', '1'); } catch (_) {}
        window.postMessage({ action: 'SARVESTAN_LOGOUT', reason: 'storage-lock' }, '*');
      }
    });
  }
}
ensureLogoutLockWatcher();

function ensureSarvestanActive() {
  try {
    injectMainWorldInterceptor();
    injectFloatingDock();
    injectHeaderButton();
    if (!isManualLogoutLockedSync()) {
      const session = scanBehestanDOM();
      syncStorage(session);
    }
  } catch (err) {
    console.warn('[Sarvestan] ensure error:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensureSarvestanActive);
} else {
  ensureSarvestanActive();
}

setInterval(ensureSarvestanActive, 1200);
