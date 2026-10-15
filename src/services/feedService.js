/**
 * سرویس دریافت و مدیریت فید زنده و خبرنامه سروستان
 * منبع: مخزن رسمی https://github.com/mjb4khshi/Sarvestan_feed
 */

const FEED_PRIMARY_URL = 'https://cdn.jsdelivr.net/gh/mjb4khshi/Sarvestan_feed@main/feed.json';
const FEED_FALLBACK_URL = 'https://raw.githubusercontent.com/mjb4khshi/Sarvestan_feed/main/feed.json';

const CACHE_KEY = 'sarvestan_feed_cache';
const READ_IDS_KEY = 'sarvestan_feed_read_ids';
const CACHE_TTL_MS = 30 * 60 * 1000; // ۳۰ دقیقه برای بازخوانی پس‌زمینه

let memoryFeed = null;
const listeners = new Set();

function getCachedFeed() {
  if (memoryFeed) return memoryFeed;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      memoryFeed = JSON.parse(raw);
      return memoryFeed;
    }
  } catch {}
  return null;
}

export function getReadPostIds() {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markPostAsRead(postId) {
  if (!postId) return;
  const set = getReadPostIds();
  set.add(String(postId));
  try {
    localStorage.setItem(READ_IDS_KEY, JSON.stringify([...set]));
  } catch {}
  notify();
}

export function markAllPostsAsRead() {
  const feed = getCachedFeed();
  if (!feed || !Array.isArray(feed.posts)) return;
  const set = getReadPostIds();
  feed.posts.forEach((p) => set.add(String(p.id)));
  try {
    localStorage.setItem(READ_IDS_KEY, JSON.stringify([...set]));
  } catch {}
  notify();
}

export function subscribeFeed(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {}
  });
}

/**
 * دریافت فید زنده با کش هوشمند و قابلیت بازخوانی مجدد
 */
export async function fetchFeed({ force = false } = {}) {
  const cached = getCachedFeed();
  const now = Date.now();

  if (!force && cached && cached._cachedAt && now - cached._cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  const fetchUrl = async (url) => {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  };

  try {
    let data;
    try {
      data = await fetchUrl(FEED_PRIMARY_URL);
    } catch {
      data = await fetchUrl(FEED_FALLBACK_URL);
    }

    if (data && Array.isArray(data.posts)) {
      data._cachedAt = now;
      memoryFeed = data;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch {}
      notify();
      return data;
    }
  } catch (err) {
    console.warn('[FeedService] Failed to load remote feed:', err);
  }

  return cached || { banner: null, posts: [] };
}

/**
 * دریافت خلاصه وضعیت فید برای نمایش در UI
 */
export function getFeedState() {
  const feed = getCachedFeed() || { banner: null, posts: [] };
  const readIds = getReadPostIds();
  const posts = (feed.posts || []).map((p) => ({
    ...p,
    isRead: readIds.has(String(p.id)),
  }));

  const unreadCount = posts.filter((p) => !p.isRead).length;

  return {
    banner: feed.banner,
    posts,
    unreadCount,
    lastUpdated: feed.lastUpdated,
  };
}
