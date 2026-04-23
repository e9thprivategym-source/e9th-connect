/**
 * E9th Connect Service Worker
 * PWA対応：オフライン機能、キャッシング、バックグラウンド同期
 */

const CACHE_NAME = 'e9th-connect-v1';
const RUNTIME_CACHE = 'e9th-connect-runtime';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
];

/**
 * インストールイベント：静的アセットをキャッシュ
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Failed to cache some assets:', err);
        // 一部のアセットがキャッシュできなくても続行
      });
    })
  );
  self.skipWaiting();
});

/**
 * アクティベーションイベント：古いキャッシュを削除
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * フェッチイベント：ネットワークファースト戦略
 * - API呼び出し：ネットワークを優先し、失敗時はキャッシュ
 * - 静的アセット：キャッシュを優先し、失敗時はネットワーク
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API呼び出し（/api/*, /trpc/*）：ネットワークファースト
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/trpc')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功時はランタイムキャッシュに保存
          if (response.ok) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // ネットワーク失敗時はキャッシュから取得
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log('[Service Worker] Using cached response for:', request.url);
              return cached;
            }
            // キャッシュもない場合はオフラインページを返す
            return caches.match('/offline.html').catch(() => {
              return new Response('Offline - No cached response available', {
                status: 503,
                statusText: 'Service Unavailable',
              });
            });
          });
        })
    );
    return;
  }

  // 静的アセット：キャッシュファースト
  if (
    request.method === 'GET' &&
    (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i) ||
      url.pathname === '/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const cache = caches.open(CACHE_NAME);
              cache.then((c) => c.put(request, response.clone()));
            }
            return response;
          })
          .catch(() => {
            console.warn('[Service Worker] Failed to fetch:', request.url);
            return new Response('Offline', { status: 503 });
          });
      })
    );
    return;
  }

  // その他のリクエスト：通常のフェッチ
  event.respondWith(fetch(request).catch(() => new Response('Offline', { status: 503 })));
});

/**
 * バックグラウンド同期：オフライン中に記録した食事をオンライン復帰時に同期
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-meals') {
    event.waitUntil(syncMeals());
  }
});

async function syncMeals() {
  try {
    const db = await openIndexedDB();
    const pendingMeals = await getPendingMeals(db);

    for (const meal of pendingMeals) {
      try {
        const response = await fetch('/api/meals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(meal),
        });

        if (response.ok) {
          await removePendingMeal(db, meal.id);
          console.log('[Service Worker] Synced meal:', meal.id);
        }
      } catch (err) {
        console.error('[Service Worker] Failed to sync meal:', err);
      }
    }
  } catch (err) {
    console.error('[Service Worker] Sync failed:', err);
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('e9th-connect', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-meals')) {
        db.createObjectStore('pending-meals', { keyPath: 'id' });
      }
    };
  });
}

function getPendingMeals(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-meals'], 'readonly');
    const store = transaction.objectStore('pending-meals');
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removePendingMeal(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-meals'], 'readwrite');
    const store = transaction.objectStore('pending-meals');
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * プッシュ通知：トレーナーからのフィードバック通知
 */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'トレーナーからのフィードバックがあります',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'e9th-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: '確認',
      },
      {
        action: 'close',
        title: '閉じる',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title || 'E9th Connect', options));
});

/**
 * 通知クリックイベント
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // 既に開いているウィンドウがあればフォーカス
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // なければ新しいウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

console.log('[Service Worker] Loaded');
