// TaskWise service worker.
// Only handles notifications: it shows Web Push reminders sent by the server
// (so they arrive with the tab closed) and focuses the app when one is clicked.
// It deliberately does not cache pages, so deploys are picked up immediately.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'TaskWise', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'TaskWise reminder';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      tag: data.tag || undefined, // same tag replaces instead of stacking duplicates
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if (win.url.startsWith(self.location.origin)) {
          win.navigate(target).catch(() => {});
          return win.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
