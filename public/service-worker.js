self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {
      title: 'NoteFlow',
      body: event.data ? event.data.text() : 'You have a new alert.',
    };
  }

  const title = payload.title || 'NoteFlow';
  const options = {
    body: payload.body || 'You have a new alert.',
    icon: payload.icon || '/placeholder.svg',
    badge: payload.badge || '/placeholder.svg',
    tag: payload.tag || 'noteflow-alert',
    renotify: true,
    data: payload.data || { url: '/alerts' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/alerts';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
