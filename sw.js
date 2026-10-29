// Service Worker for Rabochaya Tetrad
const CACHE_NAME = 'tetrad-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/_blob/')) {
    const assetId = url.pathname.replace('/_blob/', '');
    e.respondWith((async () => {
      try {
        const db = await new Promise((resolve, reject) => {
          const req = indexedDB.open('RabochayaTetradDB', 1);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        const blobRecord = await new Promise((resolve, reject) => {
          const tx = db.transaction('assets', 'readonly');
          const req = tx.objectStore('assets').get(assetId);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        if (blobRecord && blobRecord.blob) {
          return new Response(blobRecord.blob, {
            status: 200,
            headers: {
              'Content-Type': blobRecord.type || 'application/octet-stream',
              'Cache-Control': 'public, max-age=31536000'
            }
          });
        }
      } catch (err) {
        console.error('SW asset fetch error:', err);
      }
      return new Response('Not found', { status: 404 });
    })());
  }
});
