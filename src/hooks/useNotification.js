import { useState, useEffect, useCallback } from "react";

export function useNotification() {
  const [permission, setPermission] = useState("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  useEffect(() => {
    const supported = "Notification" in window && "serviceWorker" in navigator;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      initializeServiceWorker();
    }
  }, []);

  const initializeServiceWorker = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      console.log("Service Worker registered successfully:", registration);
      setSwRegistration(registration);

      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.warn("Service Worker registration failed:", error);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return "denied";
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        await subscribeToPushNotifications();
      }

      return result;
    } catch (error) {
      console.warn("Notification permission request failed:", error);
      return "denied";
    }
  }, [isSupported]);

  const subscribeToPushNotifications = useCallback(async () => {
    if (!swRegistration || permission !== "granted") return;

    try {
      let subscription = await swRegistration.pushManager.getSubscription();

      if (!subscription) {
        const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

        if (!publicKey) {
          console.warn(
            "VAPID public key not configured. Push notifications disabled.",
          );
          return;
        }

        subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        console.log("Push subscription successful:", subscription);

        await savePushSubscription(subscription);
      }

      setIsSubscribed(!!subscription);
    } catch (error) {
      console.warn("Failed to subscribe to push notifications:", error);
    }
  }, [swRegistration, permission]);

  const savePushSubscription = useCallback(async (subscription) => {
    try {
      const response = await fetch("/api/push-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription");
      }

      console.log("Push subscription saved to backend");
    } catch (error) {
      console.warn("Failed to save push subscription:", error);
    }
  }, []);

  const sendNotification = useCallback(
    (title, options = {}) => {
      if (!isSupported || permission !== "granted") return null;

      try {
        const notification = new Notification(title, {
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          ...options,
        });

        if (!options.persistBrowserClosed) {
          setTimeout(() => notification.close(), 6000);
        }

        return notification;
      } catch (error) {
        console.warn("Failed to send notification:", error);
        return null;
      }
    },
    [isSupported, permission],
  );

  const sendPushNotification = useCallback(
    async (assignmentData) => {
      if (!isSubscribed) {
        console.warn("Device not subscribed to push notifications");
        return false;
      }

      try {
        const response = await fetch("/api/send-notification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "⏰ Assignment Due Soon",
            body: `${assignmentData.title} - Due in ${assignmentData.timeRemaining}`,
            assignmentId: assignmentData.id,
            data: {
              assignmentId: assignmentData.id,
              deadline: assignmentData.deadline,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send push notification");
        }

        console.log("Push notification sent successfully");
        return true;
      } catch (error) {
        console.warn("Failed to send push notification:", error);
        return false;
      }
    },
    [isSubscribed],
  );

  const unsubscribeFromPush = useCallback(async () => {
    if (!swRegistration) return;

    try {
      const subscription = await swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        console.log("Unsubscribed from push notifications");
      }
    } catch (error) {
      console.warn("Failed to unsubscribe:", error);
    }
  }, [swRegistration]);

  return {
    permission,
    isSupported,
    isSubscribed,
    requestPermission,
    sendNotification,
    sendPushNotification,
    subscribeToPushNotifications,
    unsubscribeFromPush,
  };
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
