/**
 * Sarvestan - Extension Background Service Worker (Manifest V3)
 */

console.log('[Sarvestan Background] Service worker loaded.');

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Sarvestan Background] Extension installed successfully.');
});

// کلیک روی آیکون افزونه در نوار ابزار مرورگر:
// اگر کاربر روی تب بهستان است -> باز کردن مستقیم لایه هوشمند روی بهستان
// اگر کاربر روی تب دیگری است -> باز کردن یا فوکوس روی تب داشبورد مستقل
chrome.action.onClicked.addListener(async (tab) => {
  if (tab && tab.url && tab.url.includes('kntu.ac.ir')) {
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
