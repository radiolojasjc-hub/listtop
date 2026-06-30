const CACHE_NAME = 'radio-play12-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
  // Vídeos removidos para evitar erro 404
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache do PWA aberto');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(err => console.warn('Falha ao cachear alguns assets:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('Deletando cache antigo:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  const isAudio = requestUrl.pathname.match(/\.(m4a|mp3|wav|ogg)$/i);
  const isStatic = requestUrl.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|mp4|webm)$/i);

  if (isAudio) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  if (isStatic || ASSETS_TO_CACHE.includes(event.request.url)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request).then(response => {
            if (response.status === 200) {
              const cloned = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
            }
            return response;
          });
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match('/index.html'))
  );
});
