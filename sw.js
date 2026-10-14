const CACHE_NAME = 'psa-v1';
const PRECORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 1. Peringkat Install: Wajib simpan fail teras supaya pelayar web telefon meluluskan PWA
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Menyimpan aset teras untuk kelayakan PWA mudah alih');
      return cache.addAll(PRECORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Peringkat Activate: Buang cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Peringkat Fetch: Rangkaian dahulu, cache sebagai sandaran (Termasuk sokongan fail CDN)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Simpan atau kemas kini cache dengan respon baharu dari internet
        if (networkResponse.status === 200 || networkResponse.type === 'opaque') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Jika offline, cuba cari fail yang sepadan dalam cache
        return caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
          // Jika fail spesifik tiada, pulangkan halaman utama ('./') yang disahkan ada dalam cache
          return cachedResponse || caches.match('./');
        });
      })
  );
});
