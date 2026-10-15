/**
 * سرویس دریافت و مدیریت فید زنده و خبرنامه سروستان
 * منبع: مخزن رسمی https://github.com/mjb4khshi/Sarvestan_feed
 */

const FEED_PRIMARY_URL = 'https://cdn.jsdelivr.net/gh/mjb4khshi/Sarvestan_feed@main/feed.json';
const FEED_FALLBACK_URL = 'https://raw.githubusercontent.com/mjb4khshi/Sarvestan_feed/main/feed.json';

const CACHE_KEY = 'sarvestan_feed_cache';
const READ_IDS_KEY = 'sarvestan_feed_read_ids';
const SUBSCRIBED_CHANNELS_KEY = 'sarvestan_feed_subscribed_channels';
const CACHE_TTL_MS = 30 * 60 * 1000; // ۳۰ دقیقه برای بازخوانی پس‌زمینه

export const DEFAULT_CHANNELS = [
  {
    id: 'sarvnameh',
    name: 'سرونامه',
    slug: 'sarvnameh',
    badge: 'فنی و آموزشی',
    description: 'خبرنامه رسمی، به‌روزرسانی‌های سروستان، نکات بهستان و هشدارهای تقویم آموزشی',
    color: 'primary',
  },
  {
    id: 'shernameh',
    name: 'شعرنامه',
    slug: 'shernameh',
    badge: 'ادبیات و شعر',
    description: 'گزیده ابیات کهن و شعر معاصر، دلنوشته‌های شبانه و آرامش در روزهای شلوغ دانشگاه',
    color: 'secondary',
  },
];

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

export function getSubscribedChannelIds() {
  try {
    const raw = localStorage.getItem(SUBSCRIBED_CHANNELS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set(['sarvnameh', 'shernameh']);
}

export function toggleChannelSubscription(channelId) {
  if (!channelId) return;
  const current = getSubscribedChannelIds();
  if (current.has(channelId)) {
    if (current.size > 1) {
      current.delete(channelId);
    }
  } else {
    current.add(channelId);
  }
  try {
    localStorage.setItem(SUBSCRIBED_CHANNELS_KEY, JSON.stringify([...current]));
  } catch {}
  notify();
  return current;
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

  return cached || { banner: null, posts: [], channels: DEFAULT_CHANNELS };
}

/**
 * دریافت خلاصه وضعیت فید، کانال‌ها و پست‌های فیلترشده بر اساس اشتراک
 */
export function getFeedState() {
  const feed = getCachedFeed() || { banner: null, posts: [], channels: DEFAULT_CHANNELS };
  const readIds = getReadPostIds();
  const subscribedIds = getSubscribedChannelIds();
  const channels = feed.channels && feed.channels.length > 0 ? feed.channels : DEFAULT_CHANNELS;

  const allPosts = (feed.posts || []).map((p) => ({
    ...p,
    channelId: p.channelId || 'sarvnameh',
    isRead: readIds.has(String(p.id)),
  }));

  const posts = allPosts.filter((p) => subscribedIds.has(p.channelId));
  const unreadCount = posts.filter((p) => !p.isRead).length;

  return {
    banner: feed.banner,
    channels,
    subscribedChannelIds: [...subscribedIds],
    posts,
    allPosts,
    unreadCount,
    lastUpdated: feed.lastUpdated,
  };
}
