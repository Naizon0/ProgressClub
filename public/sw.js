// Service Worker for Progress Club background notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If an existing window/tab of the app exists, focus it and notify
      for (const client of clientList) {
        if ('focus' in client) {
          try {
            client.postMessage({ type: 'SCHEDULED_TIMER_OPEN' });
          } catch (e) {}
          return client.focus();
        }
      }
      // If no window is open, open the app window automatically
      if (self.clients.openWindow) {
        return self.clients.openWindow('/?action=quickstart');
      }
    })
  );
});
