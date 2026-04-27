// public/firebase-messaging-sw.js
// Handles background push notifications for FarmX.
// Registered by src/lib/fcm.ts when the user grants push permission.

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "SHOW_NOTIFICATION") return;

  const { title, body, icon, badge, tag, url } = event.data;

  self.registration.showNotification(title, {
    body,
    icon: icon || "/favicon.ico",
    badge: badge || "/favicon.ico",
    tag: tag || "farmx-notif",
    data: { url: url || "/" },
    requireInteraction: false,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});