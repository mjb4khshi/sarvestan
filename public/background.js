/**
 * Sarvestan - Extension Background Service Worker (Manifest V3)
 */

console.log('[Sarvestan Background] Service worker loaded.');

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Sarvestan Background] Extension installed successfully.');
});

const SUPPORTED_DOMAINS = ['kntu.ac.ir', 'aut.ac.ir', 'sbu.ac.ir', 'ut.ac.ir', 'iust.ac.ir'];

// کلیک روی آیکون افزونه در نوار ابزار مرورگر:
// اگر کاربر روی تب یکی از سامانه‌های دانشگاهی است -> باز کردن مستقیم لایه هوشمند روی سامانه
// اگر کاربر روی تب دیگری است -> باز کردن یا فوکوس روی تب داشبورد مستقل
chrome.action.onClicked.addListener(async (tab) => {
  const isUniTab = tab && tab.url && SUPPORTED_DOMAINS.some((domain) => tab.url.includes(domain));
  if (isUniTab) {
    chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_SARVESTAN_OVERLAY' }, (res) => {
      if (chrome.runtime.lastError) {
        // در صورت عدم تزریق قبلی، تب مستقل باز شود
        openDashboardTab();
      }
    });
  } else {
    openDashboardTab();
  }
});

function openDashboardTab() {
  const dashboardUrl = chrome.runtime.getURL('index.html');
  chrome.tabs.query({ url: dashboardUrl }, (tabs) => {
    if (tabs && tabs.length > 0) {
      chrome.tabs.update(tabs[0].id, { active: true });
    } else {
      chrome.tabs.create({ url: dashboardUrl });
    }
  });
}

// مدیریت پیام‌های ارسالی از Content Script یا داشبورد
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'OPEN_SARVESTAN_DASHBOARD') {
    openDashboardTab();
    sendResponse({ status: 'OPENED' });
    return true;
  }
});
