/**
 * سرویس بررسی به‌روزرسانی خودکار سروستان از طریق مخزن رسمی گیت‌هاب
 * Repository: mjb4khshi/sarvestan
 */

export const CURRENT_VERSION = '1.1.0';
export const GITHUB_REPO = 'mjb4khshi/sarvestan';
export const GITHUB_RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=10`;
export const GITHUB_RELEASES_PAGE = `https://github.com/${GITHUB_REPO}/releases`;
export const FALLBACK_APK_URL = `https://github.com/${GITHUB_REPO}/releases/latest/download/sarvestan.apk`;

const DISMISSED_UPDATE_KEY = 'sarvestan_dismissed_update_tag';

/**
 * تجزیه رشته نسخه به اجزای تفکیک‌شده
 * پشتیبانی از v1.0.1، 1.0.1-beta، 1.0.0-rc2 و غیره
 */
export function parseVersion(verStr) {
  if (!verStr) return null;
  const clean = String(verStr).trim().replace(/^v/i, '');
  const [main, ...preParts] = clean.split('-');
  const prerelease = preParts.length > 0 ? preParts.join('-') : null;
  const parts = main.split('.').map((p) => {
    const n = parseInt(p, 10);
    return Number.isNaN(n) ? 0 : n;
  });
  while (parts.length < 3) parts.push(0);
  return {
    raw: verStr,
    clean,
    parts,
    major: parts[0],
    minor: parts[1],
    patch: parts[2],
    prerelease,
  };
}

/**
 * مقایسه نسخه ریموت با نسخه محلی
 * برمی‌گرداند true اگر ریموت جدیدتر باشد
 */
export function isNewerVersion(remoteStr, localStr = CURRENT_VERSION) {
  const remote = parseVersion(remoteStr);
  const local = parseVersion(localStr);
  if (!remote || !local) return false;

  const maxLen = Math.max(remote.parts.length, local.parts.length);
  for (let i = 0; i < maxLen; i++) {
    const r = remote.parts[i] || 0;
    const l = local.parts[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }

  // اگر اعداد اصلی کاملاً برابر بودند:
  // نسخه پایدار رسمی (بدون پیش‌وند prerelease) جدیدتر از نسخه آزمایشی همان شماره است
  if (local.prerelease && !remote.prerelease) return true;
  if (!local.prerelease && remote.prerelease) return false;
  if (local.prerelease && remote.prerelease) {
    return remote.prerelease.localeCompare(local.prerelease, undefined, { numeric: true }) > 0;
  }

  return false;
}

/**
 * تشخیص اینکه آیا ریلیز آزمایشی (Pre-release) است یا پایدار
 */
export function isPrereleaseRelease(release) {
  if (!release) return false;
  if (release.prerelease === true) return true;
  const tag = (release.tag_name || '').toLowerCase();
  const name = (release.name || '').toLowerCase();
  return (
    tag.includes('beta') ||
    tag.includes('alpha') ||
    tag.includes('rc') ||
    tag.includes('pre') ||
    tag.includes('test') ||
    name.includes('آزمایشی') ||
    name.includes('تست') ||
    name.includes('beta') ||
    name.includes('alpha') ||
    name.includes('preview')
  );
}

/**
 * پیدا کردن لینک دانلود مستقیم APK از دارایی‌های انتشار (Assets)
 */
export function getApkDownloadUrl(release) {
  if (!release) return { url: FALLBACK_APK_URL, size: null, name: 'sarvestan.apk' };

  if (Array.isArray(release.assets) && release.assets.length > 0) {
    const apkAsset = release.assets.find(
      (a) => a.name && a.name.toLowerCase().endsWith('.apk')
    );
    if (apkAsset && apkAsset.browser_download_url) {
      return {
        url: apkAsset.browser_download_url,
        size: apkAsset.size || null,
        name: apkAsset.name || 'sarvestan.apk',
      };
    }
  }

  // در صورتی که فایل APK در لیست دارایی‌ها نبود، لینک مستقیم تگ را می‌سازیم
  const tag = release.tag_name || `v${CURRENT_VERSION}`;
  return {
    url: `https://github.com/${GITHUB_REPO}/releases/download/${tag}/sarvestan.apk`,
    size: null,
    name: 'sarvestan.apk',
  };
}

/**
 * بررسی ریپازیتوری گیت‌هاب برای کشف نسخه‌های جدید
 */
export async function checkForUpdate({ timeoutMs = 7000 } = {}) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetch(GITHUB_RELEASES_API, {
      signal: controller ? controller.signal : undefined,
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      throw new Error(`خطای ارتباط با سرور گیت‌هاب (${res.status})`);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return {
        hasUpdate: false,
        currentVersion: CURRENT_VERSION,
        latestRelease: null,
        error: null,
      };
    }

    // فیلتر انتشارهای نامعتبر یا پیش‌نویس (draft)
    const validReleases = data.filter((r) => !r.draft);
    if (validReleases.length === 0) {
      return {
        hasUpdate: false,
        currentVersion: CURRENT_VERSION,
        latestRelease: null,
        error: null,
      };
    }

    // یافتن بالاترین نسخه موجود در گیت‌هاب
    let candidate = validReleases[0];
    for (const rel of validReleases) {
      if (isNewerVersion(rel.tag_name, candidate.tag_name)) {
        candidate = rel;
      }
    }

    const hasUpdate = isNewerVersion(candidate.tag_name, CURRENT_VERSION);
    const isPrerelease = isPrereleaseRelease(candidate);
    const apkInfo = getApkDownloadUrl(candidate);

    return {
      hasUpdate,
      currentVersion: CURRENT_VERSION,
      latestRelease: {
        tagName: candidate.tag_name,
        name: candidate.name || candidate.tag_name,
        body: candidate.body || '',
        isPrerelease,
        publishedAt: candidate.published_at,
        htmlUrl: candidate.html_url || GITHUB_RELEASES_PAGE,
        apkUrl: apkInfo.url,
        apkSize: apkInfo.size,
        apkName: apkInfo.name,
        raw: candidate,
      },
      error: null,
    };
  } catch (err) {
    const isAbort = err?.name === 'AbortError';
    const msg = isAbort ? 'مهلت زمان اتصال به پایان رسید' : (err?.message || 'خطا در بررسی به‌روزرسانی');
    console.warn('[Updater] Check failed:', msg);
    return {
      hasUpdate: false,
      currentVersion: CURRENT_VERSION,
      latestRelease: null,
      error: msg,
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * ذخیره و بررسی وضعیت رد موقت اعلان در نشست جاری
 */
export function hasDismissedUpdate(tag) {
  try {
    return sessionStorage.getItem(DISMISSED_UPDATE_KEY) === String(tag);
  } catch {
    return false;
  }
}

export function dismissUpdate(tag) {
  try {
    sessionStorage.setItem(DISMISSED_UPDATE_KEY, String(tag));
  } catch {}
}

export function clearDismissedUpdate() {
  try {
    sessionStorage.removeItem(DISMISSED_UPDATE_KEY);
  } catch {}
}
