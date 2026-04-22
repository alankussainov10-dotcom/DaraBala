// Service Worker — DaraBala PWA
const CACHE_NAME = 'darabala-v2';

// Файлы которые кэшируем при установке
const STATIC_FILES = [
  '/DaraBala/',
  '/DaraBala/index.html',
  '/DaraBala/student/',
  '/DaraBala/student/index.html',
  '/DaraBala/teacher/',
  '/DaraBala/teacher/index.html',
  '/DaraBala/css/style.css',
  '/DaraBala/js/curriculum.js',
  '/DaraBala/js/lesson.js',
  '/DaraBala/js/chat.js',
  '/DaraBala/js/app.js',
  '/DaraBala/manifest.json',
  '/DaraBala/icons/icon-192.png',
  '/DaraBala/icons/icon-512.png',
];

// Установка — кэшируем все статические файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

// Активация — удаляем старые кэши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — стратегия Cache First для статики, Network First для API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API запросы (воркер, Google) — только сеть, без кэша
  if (url.hostname !== location.hostname) {
    return; // браузер обрабатывает сам
  }

  // Статические файлы — сначала кэш, потом сеть
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Кэшируем новые успешные ответы
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Офлайн — возвращаем главную страницу для навигации
        if (event.request.mode === 'navigate') {
          return caches.match('/DaraBala/student/index.html');
        }
      });
    })
  );
});
