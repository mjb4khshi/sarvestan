/**
 * باز کردن فرم بهستان از داشبورد افزونه
 * GET fid= کار نمی‌کند (405) — پیام به contentScript می‌فرستیم تا POST act=nav بزند
 */
export async function openBehestanFormFromDashboard(code) {
  const fid = String(code || '').trim();
  // ۱) تب‌های باز بهستان را پیدا کن و پیام بده
  if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
    try {
      const tabs = await chrome.tabs.query({ url: ['*://behestan.kntu.ac.ir/*', '*://*.kntu.ac.ir/*'] });
      let navigated = false;
      for (const tab of tabs || []) {
        try {
          await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: 'OPEN_BEHESTAN_FORM', fid }, () => {
              void chrome.runtime.lastError;
              resolve();
            });
          });
          navigated = true;
        } catch (_) {}
      }
      if (navigated) return true;
    } catch (_) {}
  }

  // ۲) اگر تبی نبود، بهستان را باز کن
  window.open('https://behestan.kntu.ac.ir/', '_blank');
  return false;
}
