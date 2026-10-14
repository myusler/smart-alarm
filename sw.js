const CACHE_NAME = 'psa-v1';
const PRECORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 1. Peringkat Install: Wajib simpan fail teras supaya pelayar web meluluskan PWA
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Menyimpan aset teras untuk kelayakan PWA');
      // Guna keralatan berasingan supaya jika satu fail gagal, ia tidak merosakkan semua
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

// 3. Peringkat Fetch: Rangkaian dahulu, cache sebagai sandaran (Telah diperbaiki)
self.addEventListener('fetch', (event) => {
  // Hanya proses permintaan GET dan skema http/https (elakkan ralat chrome-extension)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // PERBAIKAN: Pastikan respon sah sebelum klon dimasukkan ke cache secara selamat
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const responseClone = networkResponse.clone();
          // Gunakan event.waitUntil supaya pelayar tidak menutup thread sebelum cache selesai disimpan
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
              return cache.put(event.request, responseClone);
            })
          );
        }
        return networkResponse;
      })
      .catch(() => {
        // Jika offline, cuba cari fail yang sepadan dalam cache
        return caches.match(event.request).then((cachedResponse) => {
          // Jika fail spesifik tiada, pulangkan fail utama '/' sebagai sandaran
          return cachedResponse || caches.match('./');
        });
      })
  );
});
