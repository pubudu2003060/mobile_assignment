import { useState, useEffect, useCallback } from "react";

export function useNotification() {
  const [permission, setPermission] = useState("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = "Notification" in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  /** Request notification permission (must be called from a user gesture) */
  const requestPermission = useCallback(async () => {
    if (!isSupported) return "denied";
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.warn("Notification permission request failed:", error);
      return "denied";
    }
  }, [isSupported]);

  /** Send a browser notification */
  const sendNotification = useCallback(
    (title, options = {}) => {
      if (!isSupported || permission !== "granted") return null;

      try {
        const notification = new Notification(title, {
          icon: "/vite.svg",
          badge: "/vite.svg",
          ...options,
        });

        // Auto-close after 6 seconds
        setTimeout(() => notification.close(), 6000);

        return notification;
      } catch (error) {
        console.warn("Failed to send notification:", error);
        return null;
      }
    },
    [isSupported, permission],
  );

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
  };
}
