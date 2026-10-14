const CACHE_NAME = 'smart-alarm-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
  // Jika anda ada fail CSS atau JS berasingan (cth: './style.css', './app.js'), tambah di sini.
];

// Peringkat Pasang (Install): Simpan fail asas
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Menyimpan aset teras ke dalam cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Peringkat Aktif (Activate): Buang cache lama jika ada kemas kini
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Memadam cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Peringkat Ambil Data (Fetch): Strategi Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  // Jangan cache permintaan luar atau fail audio dinamik/IndexedDB
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          // Simpan salinan baru ke dalam cache jika berjaya
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Jika tiada internet langsung, ia akan gagal senyap-senyap dan guna cache
        });

        // Kembalikan cache yang ada dulu (laju), manakala network request berjalan di latar belakang
        return cachedResponse || fetchedResponse;
      });
    })
  );
});
