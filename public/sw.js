// Service Worker for Bayraq Gate - Web Push Notifications & Background Sync
const CACHE_NAME = 'bayraq-gate-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// استلام أحداث الإشعارات في الخلفية حتى والمتصفح مغلق
self.addEventListener('push', (event) => {
  let data = {
    title: 'بوابة بيرق - Bayraq Gate',
    body: 'لديك إشعار جديد في بوابة بيرق',
    icon: '/logo.png',
    badge: '/logo.png',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        icon: payload.icon || '/logo.png',
        badge: '/logo.png',
        data: payload.data || { url: '/' }
      };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: data.data,
    dir: 'rtl',
    lang: 'ar',
    tag: 'bayraq-notification',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// عند نقر المستخدم على الإشعار من شريط التنبيهات
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // إذا كان المتصفح مفتوحاً، تركيز النافذة
      for (let client of windowClients) {
        if ('focus' in client) {
          if (targetUrl && client.url.includes(targetUrl)) {
            return client.focus();
          }
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // إذا لم تكن هناك نافذة مفتوحة، فتح التطبيق
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
