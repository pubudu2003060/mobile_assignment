import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useNotification } from "../hooks/useNotification";
import Modal from "../components/Modal";

export default function Settings() {
  const [settings, setSettings] = useLocalStorage("smartcampus_settings", {
    reminderTime: 60,
  });
  const {
    permission,
    requestPermission,
    sendNotification,
    isSupported,
    isSubscribed,
    subscribeToPushNotifications,
    unsubscribeFromPush,
  } = useNotification();
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const handleEnableNotifications = async () => {
    if (permission !== "granted") {
      const res = await requestPermission();
      if (res === "granted") {
        sendNotification("Success!", { body: "Notifications are enabled." });
      }
    }
  };

  const handleSubscribeToPush = async () => {
    setPushLoading(true);
    try {
      await subscribeToPushNotifications();
      sendNotification("Success!", {
        body: "You will now receive push notifications even when the browser is closed.",
      });
    } catch (error) {
      console.error("Failed to subscribe to push:", error);
    } finally {
      setPushLoading(false);
    }
  };

  const handleUnsubscribeFromPush = async () => {
    setPushLoading(true);
    try {
      await unsubscribeFromPush();
      sendNotification("Unsubscribed", {
        body: "Push notifications have been disabled.",
      });
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
    } finally {
      setPushLoading(false);
    }
  };

  const handleExportData = () => {
    const data = {
      profile: JSON.parse(localStorage.getItem("smartcampus_profile") || "{}"),
      courses: JSON.parse(localStorage.getItem("smartcampus_courses") || "[]"),
      schedule: JSON.parse(
        localStorage.getItem("smartcampus_schedule") || "[]",
      ),
      assignments: JSON.parse(
        localStorage.getItem("smartcampus_assignments") || "[]",
      ),
      settings: JSON.parse(
        localStorage.getItem("smartcampus_settings") || "{}",
      ),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smartcampus_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.profile)
          localStorage.setItem(
            "smartcampus_profile",
            JSON.stringify(data.profile),
          );
        if (data.courses)
          localStorage.setItem(
            "smartcampus_courses",
            JSON.stringify(data.courses),
          );
        if (data.schedule)
          localStorage.setItem(
            "smartcampus_schedule",
            JSON.stringify(data.schedule),
          );
        if (data.assignments)
          localStorage.setItem(
            "smartcampus_assignments",
            JSON.stringify(data.assignments),
          );
        if (data.settings)
          localStorage.setItem(
            "smartcampus_settings",
            JSON.stringify(data.settings),
          );
        window.location.reload();
      } catch (err) {
        alert("Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    localStorage.removeItem("smartcampus_profile");
    localStorage.removeItem("smartcampus_courses");
    localStorage.removeItem("smartcampus_schedule");
    localStorage.removeItem("smartcampus_assignments");
    localStorage.removeItem("smartcampus_settings");
    window.location.reload();
  };

  return (
    <div className="page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
      </header>

      <section className="section stagger">
        <h2
          className="section-title mb-sm"
          style={{ marginBottom: "var(--space-sm)" }}
        >
          Notifications
        </h2>
        <div
          className="card animate-slide-up"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          <div className="flex-between">
            <div>
              <p style={{ fontWeight: 500 }}>Local Notifications</p>
              <p className="text-sm text-muted">
                Notifications while app is open
              </p>
            </div>
            <span
              className={`badge ${permission === "granted" ? "badge-completed" : permission === "denied" ? "badge-overdue" : "badge-pending"}`}
            >
              {permission}
            </span>
          </div>

          {!isSupported && (
            <p
              className="text-sm text-danger"
              style={{ color: "var(--color-danger)" }}
            >
              Notifications are not supported in your browser.
            </p>
          )}

          {isSupported && permission !== "granted" && (
            <button
              className="btn btn-primary btn-block"
              onClick={handleEnableNotifications}
            >
              Enable Notifications
            </button>
          )}

          {isSupported && permission === "granted" && (
            <button
              className="btn btn-secondary btn-block"
              onClick={() =>
                sendNotification("Test", {
                  body: "This is a test notification",
                })
              }
            >
              Send Test Notification
            </button>
          )}
        </div>

        <div
          className="card animate-slide-up"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
            marginTop: "var(--space-md)",
          }}
        >
          <div className="flex-between">
            <div>
              <p style={{ fontWeight: 500 }}>🔔 Push Notifications (PWA)</p>
              <p className="text-sm text-muted">
                Notifications even when browser is closed
              </p>
            </div>
            <span
              className={`badge ${isSubscribed ? "badge-completed" : "badge-pending"}`}
            >
              {isSubscribed ? "Active" : "Inactive"}
            </span>
          </div>

          {!isSupported && (
            <p
              className="text-sm text-danger"
              style={{ color: "var(--color-danger)" }}
            >
              Push notifications are not supported in your browser.
            </p>
          )}

          {isSupported && permission !== "granted" && (
            <p className="text-sm text-muted">
              Please enable notifications first
            </p>
          )}

          {isSupported && permission === "granted" && !isSubscribed && (
            <button
              className="btn btn-primary btn-block"
              onClick={handleSubscribeToPush}
              disabled={pushLoading}
            >
              {pushLoading
                ? "Subscribing..."
                : "Subscribe to Push Notifications"}
            </button>
          )}

          {isSupported && permission === "granted" && isSubscribed && (
            <>
              <p
                className="text-sm text-success"
                style={{ color: "var(--color-success)" }}
              >
                ✓ Push notifications are active on this device
              </p>
              <button
                className="btn btn-secondary btn-block"
                onClick={handleUnsubscribeFromPush}
                disabled={pushLoading}
              >
                {pushLoading
                  ? "Unsubscribing..."
                  : "Disable Push Notifications"}
              </button>
            </>
          )}
        </div>
      </section>

      <section className="section stagger">
        <h2
          className="section-title mb-sm"
          style={{ marginBottom: "var(--space-sm)" }}
        >
          Data Management
        </h2>
        <div
          className="card animate-slide-up"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          <button
            className="btn btn-secondary btn-block"
            onClick={handleExportData}
          >
            Export Backup (JSON)
          </button>

          <label
            className="btn btn-secondary btn-block"
            style={{ cursor: "pointer", textAlign: "center" }}
          >
            Import Backup
            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleImportData}
            />
          </label>

          <button
            className="btn btn-danger btn-block"
            onClick={() => setIsClearModalOpen(true)}
          >
            Clear All Data
          </button>
        </div>
      </section>

      <section className="section stagger">
        <h2
          className="section-title mb-sm"
          style={{ marginBottom: "var(--space-sm)" }}
        >
          About
        </h2>
        <div className="card animate-slide-up text-center">
          <h3 className="text-lg" style={{ fontWeight: 600 }}>
            Smart Campus Web Companion
          </h3>
          <p
            className="text-muted text-sm mt-xs"
            style={{ marginTop: "var(--space-xs)" }}
          >
            Version 1.0.0
          </p>
          <p
            className="text-muted text-sm mt-sm"
            style={{ marginTop: "var(--space-sm)" }}
          >
            Track A: SENG 41293
          </p>
          <p className="text-muted text-sm">
            Mobile Web Application Development
          </p>
          <p className="text-muted text-sm">University of Kelaniya</p>
        </div>
      </section>

      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Clear All Data"
      >
        <p>
          Are you sure you want to delete all your data? This action cannot be
          undone.
        </p>
        <div className="modal-actions" style={{ marginTop: "var(--space-lg)" }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsClearModalOpen(false)}
          >
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleClearAll}>
            Yes, Clear All
          </button>
        </div>
      </Modal>
    </div>
  );
}
