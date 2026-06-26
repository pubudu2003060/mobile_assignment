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

// ===== FIXED PUSH HANDLER =====
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

    // ---- FIX: Extract notification from nested OR flat structure ----
    let notification = data.notification || data; // If nested, use data.notification

    // Extract title, body, tag from the notification object
    const title = notification.title || data.title || notificationData.title;
    const body = notification.body || data.body || notificationData.body;
    const tag =
      notification.tag || data.tag || data.assignmentId || "notification";
    const icon = notification.icon || notificationData.icon;
    const badge = notification.badge || notificationData.badge;
    const requireInteraction =
      notification.requireInteraction !== undefined
        ? notification.requireInteraction
        : notificationData.requireInteraction;

    notificationData = {
      title,
      body,
      icon,
      badge,
      tag,
      requireInteraction,
      // Preserve any extra data like "data" object if needed for click handling
      ...(data.data || {}),
    };

    console.log("[Service Worker] Displaying notification:", notificationData);
  } catch (e) {
    // If JSON parsing fails, use the raw text as body
    notificationData.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationData,
    ),
  );
});

// ===== IMPROVED CLICK HANDLER (Handles subdirectories) =====
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event);
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing window
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          // Check if the URL is the root or any page of your app
          if (
            client.url.startsWith(self.location.origin) &&
            "focus" in client
          ) {
            return client.focus();
          }
        }
        // If no window found, open a new one
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      }),
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("[Service Worker] Notification closed:", event);
});
