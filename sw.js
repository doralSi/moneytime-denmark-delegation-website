// ===== PWA Service Worker (iOS-friendly) =====
// גרסה: v6 — הקפד להגדיל בגרסה חדשה אחרי כל שינוי כדי לאלץ ריענון
const CACHE = 'pwa-cache-v6';

// ===== Precache ל"שלד" בלבד (דפים קלים שחייבים לעבוד מיד) =====
const PRECACHE_URLS = [
  './index.html',
  './offline.html',
  './manifest.json',
  './src/style.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  // הוסף כאן רק דפי HTML חשובים וקלים (לא מאות קבצים)
  './learning.html',
  './technical.html',
  './schedule.html',
  './schedule-day1.html',
  './schedule-day2.html',
  './schedule-day3.html',
  './schedule-day4.html',
  './schedule-day5.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE_URLS))
  );
  // מתקין מיד בלי לחכות לסגירת גרסה קודמת
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  // מפעיל ישר על כל הקליינטים
  self.clients.claim();
});

// עוזר קטן: קאש-פרסט עם נפילה ל-offline
async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (req.method === 'GET') cache.put(req, res.clone());
    return res;
  } catch (e) {
    const off = await cache.match('./offline.html');
    return off || Response.error();
  }
}

// עוזר: נטוורק-פרסט עם נפילה למטמון
async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (req.method === 'GET') cache.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(req);
    return hit || (await cache.match('./offline.html')) || Response.error();
  }
}

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // ניווטים בין דפים: cache-first, ואם אין — offline
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      // מיפוי נתיב לשם קובץ HTML
      let path = url.pathname.replace(/^\/+/, '');
      if (!path || path.endsWith('/')) path += 'index.html';
      // נסה את הדף עצמו, ואם אין — את index.html
      const candidates = ['./' + decodeURIComponent(path), './index.html'];
      for (const c of candidates) {
        const hit = await cache.match(c);
        if (hit) return hit;
      }
      // רשת ואם נפל — offline
      try {
        const fresh = await fetch(req);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        return (await cache.match('./offline.html')) || Response.error();
      }
    })());
    return;
  }

  // סטטי מאותו origin: cache-first (CSS/JS/תמונות/פונטים)
  if (url.origin === location.origin) {
    const ext = url.pathname.split('.').pop().toLowerCase();
    const STATIC_EXT = ['css','js','png','jpg','jpeg','webp','gif','svg','ico','woff','woff2','ttf','eot','mp4','webm'];
    if (STATIC_EXT.includes(ext)) {
      event.respondWith(cacheFirst(req));
      return;
    }
    // PDFs וקבצים כבדים — network-first כדי לא לעוף על המכסה באייפון
    if (ext === 'pdf') {
      event.respondWith(networkFirst(req));
      return;
    }
  }

  // חיצוני: network-first, ואם יש מטמון — נפילה אליו
  event.respondWith(networkFirst(req));
});

// (אופציונלי) API להורדה יזומה של "חבילות אופליין" כפתור באתר
self.addEventListener('message', async (event) => {
  const { type, files } = event.data || {};
  if (type === 'CACHE_BULK' && Array.isArray(files)) {
    const cache = await caches.open(CACHE);
    for (const url of files) {
      try {
        const res = await fetch(url);
        await cache.put(url, res.clone());
        // אפשר להחזיר פרוגרס לקליינט:
        // event.source.postMessage({ type:'CACHE_PROGRESS', file:url });
      } catch(e) { /* דלג על קבצים בעייתיים */ }
    }
    event.source && event.source.postMessage && event.source.postMessage({ type: 'CACHE_DONE' });
  }
});