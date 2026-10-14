/* Pilihan: cache supaya app (termasuk fail CDN) boleh dibuka tanpa internet selepas satu lawatan dalam talian. */
const CACHE = 'psa-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => { // rangkaian dahulu (sentiasa versi terkini), cache sebagai sandaran
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match('./'))));
});
