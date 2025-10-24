const CACHE_NAME = 'okipoka-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/styles/global.css',
  '/styles/footer.css',
  '/images/logo.png',
  '/images/logo1.png',
  '/images/logo2.png',
  '/images/logo3.png',
  '/manifest.json'
];

// インストール時にキャッシュを作成
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Skip Waiting');
        return self.skipWaiting();
      })
  );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming Clients');
      return self.clients.claim();
    })
  );
});

// フェッチ時のキャッシュ戦略
self.addEventListener('fetch', (event) => {
  console.log('Service Worker: Fetch', event.request.url);
  
  // POSTリクエストは無視
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにある場合はそれを返す
        if (response) {
          console.log('Service Worker: Found in Cache', event.request.url);
          return response;
        }

        // キャッシュにない場合はネットワークから取得
        return fetch(event.request)
          .then((response) => {
            // レスポンスが有効でない場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // レスポンスをクローンしてキャッシュに保存
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                // HTMLページ、CSS、JS、画像をキャッシュ
                if (event.request.url.match(/\.(html|css|js|png|jpg|jpeg|gif|svg|ico|webp)$/i) ||
                    event.request.url.includes('/tournaments/') ||
                    event.request.url.includes('/stores/')) {
                  console.log('Service Worker: Caching New Resource', event.request.url);
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch(() => {
            // ネットワークエラー時のフォールバック
            console.log('Service Worker: Network Error, showing offline page');
            
            // HTMLページのリクエストの場合はオフラインページを表示
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/') || new Response(
                `<html>
                  <head><title>オフライン - OKIPOKA</title></head>
                  <body style="font-family: system-ui; text-align: center; padding: 50px;">
                    <h1>🔌 オフラインです</h1>
                    <p>インターネット接続を確認してください</p>
                    <button onclick="location.reload()">再試行</button>
                  </body>
                </html>`,
                { headers: { 'Content-Type': 'text/html' } }
              );
            }
          });
      })
  );
});

// プッシュ通知の受信（将来の拡張用）
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received');
  
  const options = {
    body: event.data ? event.data.text() : '新しいトーナメント情報があります！',
    icon: '/images/logo.png',
    badge: '/images/logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '詳細を見る',
        icon: '/images/logo.png'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: '/images/logo.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('OKIPOKA', options)
  );
});

// プッシュ通知のクリック処理
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification Click Received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});