const CACHE_NAME = "smartcampus-v1";
const urlsToCache = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        return (
          response ||
          fetch(event.request).then((response) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone());
              return response;
            });
          })
        );
      })
      .catch(() => {
        return caches.match("/index.html");
      }),
  );
});

self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push notification received:", event);

  if (!event.data) {
    console.log("[Service Worker] Push notification has no data");
    return;
  }

  let notificationData = {
    title: "Smart Campus Reminder",
    body: "You have an assignment due soon",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "assignment-notification",
    requireInteraction: true,
  };

  try {
    const data = event.data.json();
    notificationData = {
      ...notificationData,
      ...data,
      tag: data.assignmentId || "notification",
    };
  } catch (e) {
    notificationData.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationData,
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event);

  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === "/" && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      }),
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("[Service Worker] Notification closed:", event);
});
