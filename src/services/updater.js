/**
 * سرویس بررسی خودکار به‌روزرسانی افزونه مرورگر سروستان از طریق مخزن رسمی گیت‌هاب
 * Repository: mjb4khshi/sarvestan
 */

export const GITHUB_REPO = 'mjb4khshi/sarvestan';
export const GITHUB_RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=10`;
export const GITHUB_RELEASES_PAGE = `https://github.com/${GITHUB_REPO}/releases`;
export const OFFICIAL_SITE_URL = 'https://mjb4khshi.github.io/sarvestan';

const DISMISSED_UPDATE_KEY = 'sarvestan_extension_dismissed_update_tag';

/**
 * دریافت نسخه کنونی افزونه (به‌صورت داینامیک از منیفست مرورگر یا فال‌بک)
 */
export function getExtensionVersion() {
  try {
    if (typeof chrome !== 'undefined' && chrome?.runtime?.getManifest) {
      const manifest = chrome.runtime.getManifest();
      if (manifest?.version) {
        return manifest.version;
      }
    }
  } catch {}
  return '1.0.1';
}

export const CURRENT_VERSION = getExtensionVersion();

/**
 * تجزیه رشته نسخه به اجزای تفکیک‌شده
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
 * مقایسه نسخه ریموت با نسخه محلی افزونه
 */
export function isNewerVersion(remoteStr, localStr = getExtensionVersion()) {
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

  // اگر اعداد اصلی برابر بودند
  if (local.prerelease && !remote.prerelease) return true;
  if (!local.prerelease && remote.prerelease) return false;
  if (local.prerelease && remote.prerelease) {
    return remote.prerelease.localeCompare(local.prerelease, undefined, { numeric: true }) > 0;
  }

  return false;
}

/**
 * تشخیص نسخه پیش‌انتشار (Pre-release)
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
    name.includes('alpha')
  );
}

/**
 * پیدا کردن فایل زیپ افزونه از دارایی‌های انتشار
 */
export function getExtensionZipDownloadUrl(release) {
  const currentVer = getExtensionVersion();
  const fallback = `https://github.com/${GITHUB_REPO}/releases/download/${release?.tag_name || `v${currentVer}`}/sarvestan-extension.zip`;

  if (!release) return { url: fallback, size: null, name: 'sarvestan-extension.zip' };

  if (Array.isArray(release.assets) && release.assets.length > 0) {
    // جستجو برای فایلی با نام sarvestan-extension یا دارای پسوند .zip
    const zipAsset = release.assets.find(
      (a) => a.name && (a.name.toLowerCase().includes('extension') || a.name.toLowerCase().endsWith('.zip'))
    ) || release.assets.find((a) => a.name && a.name.toLowerCase().endsWith('.zip'));

    if (zipAsset && zipAsset.browser_download_url) {
      return {
        url: zipAsset.browser_download_url,
        size: zipAsset.size || null,
        name: zipAsset.name || 'sarvestan-extension.zip',
      };
    }
  }

  return {
    url: fallback,
    size: null,
    name: 'sarvestan-extension.zip',
  };
}

/**
 * بررسی ریپازیتوری گیت‌هاب برای نسخه‌های جدید افزونه
 */
export async function checkForExtensionUpdate({ timeoutMs = 7000 } = {}) {
  const currentVer = getExtensionVersion();
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
      throw new Error(`خطای سرور گیت‌هاب (${res.status})`);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return {
        hasUpdate: false,
        currentVersion: currentVer,
        latestRelease: null,
        error: null,
      };
    }

    const validReleases = data.filter((r) => !r.draft);
    if (validReleases.length === 0) {
      return {
        hasUpdate: false,
        currentVersion: currentVer,
        latestRelease: null,
        error: null,
      };
    }

    // انتخاب بالاترین نسخه موجود
    let candidate = validReleases[0];
    for (const rel of validReleases) {
      if (isNewerVersion(rel.tag_name, candidate.tag_name)) {
        candidate = rel;
      }
    }

    const hasUpdate = isNewerVersion(candidate.tag_name, currentVer);
    const isPrerelease = isPrereleaseRelease(candidate);
    const zipInfo = getExtensionZipDownloadUrl(candidate);

    return {
      hasUpdate,
      currentVersion: currentVer,
      latestRelease: {
        tagName: candidate.tag_name,
        name: candidate.name || candidate.tag_name,
        body: candidate.body || '',
        isPrerelease,
        publishedAt: candidate.published_at,
        htmlUrl: candidate.html_url || GITHUB_RELEASES_PAGE,
        zipUrl: zipInfo.url,
        zipSize: zipInfo.size,
        zipName: zipInfo.name,
        raw: candidate,
      },
      error: null,
    };
  } catch (err) {
    const isAbort = err?.name === 'AbortError';
    const msg = isAbort ? 'مهلت زمان اتصال به پایان رسید' : (err?.message || 'خطا در بررسی به‌روزرسانی');
    console.warn('[ExtensionUpdater] Check failed:', msg);
    return {
      hasUpdate: false,
      currentVersion: currentVer,
      latestRelease: null,
      error: msg,
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function hasDismissedExtensionUpdate(tag) {
  try {
    return sessionStorage.getItem(DISMISSED_UPDATE_KEY) === String(tag);
  } catch {
    return false;
  }
}

export function dismissExtensionUpdate(tag) {
  try {
    sessionStorage.setItem(DISMISSED_UPDATE_KEY, String(tag));
  } catch {}
}
