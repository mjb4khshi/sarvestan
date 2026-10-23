const CACHE_NAME = 'sarvestan-pwa-v3';

// فایل‌های خروجی بیلد که به صورت خودکار در زمان بیلد تزریق می‌شوند
const BUILD_ASSETS = [
  /* __BUILD_ASSETS__ */
];

// دارایی‌های پایه و فونت‌های ضروری برنامه برای کارکرد کاملاً آفلاین
const STATIC_ASSETS = [
  './',
  './index.html',
  './?web=1',
  './manifest.webmanifest',
  './favicon.svg',
  './sarv-logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './fonts/AradVF.woff2',
  './fonts/Arad-Medium.woff2',
  './fonts/Arad-Bold.woff2',
  './fonts/Arad-Regular.woff2',
  ...BUILD_ASSETS
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch((err) => {
        console.warn('[SW] Pre-caching warning:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // نادیده‌گرفتن درخواست‌های خارج از مبدأ برنامه (مانند API گیت‌هاب و سرویس‌های خارجی)
  if (url.origin !== self.location.origin) {
    return;
  }

  // ۱. درخواست‌های ناوبری صفحه (HTML Document / Navigation)
  // اول تلاش برای دریافت نسخه جدید از شبکه و به‌روزرسانی کش، در صورت قطعی اینترنت بازگشت به کش آفلاین
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const webFallback = await caches.match('./?web=1');
          if (webFallback) return webFallback;
          const rootFallback = await caches.match('./');
          if (rootFallback) return rootFallback;
          return caches.match('./index.html');
        })
    );
    return;
  }

  // ۲. فایل‌های استاتیک برنامه (JS Bundles, CSS, Fonts, Images)
  // استراتژی کش پویا (Cache-First با به‌روزرسانی در صورت اتصال به اینترنت)
  const isAsset =
    url.pathname.includes('/assets/') ||
    url.pathname.includes('/fonts/') ||
    url.pathname.includes('/icons/') ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image';

  if (isAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // در پس‌زمینه نسخه جدید دریافت شود
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const copy = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // اگر در کش نبود، از شبکه دریافت و در کش ذخیره شود
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // ۳. سایر درخواست‌های داخلی GET
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse)
      );
    })
  );
});
