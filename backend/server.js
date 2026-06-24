const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const webpush = require("web-push");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject =
  process.env.VAPID_SUBJECT || "mailto:your-email@example.com";

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error("ERROR: VAPID keys not configured in .env");
  process.exit(1);
}

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

const pushSubscriptions = new Map();

// Save/update push subscription
app.post("/api/push-subscription", (req, res) => {
  const { subscription } = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription" });
  }

  const subscriptionId = subscription.endpoint;
  pushSubscriptions.set(subscriptionId, subscription);

  console.log(`✓ Push subscription saved: ${subscriptionId}`);
  console.log(`
╠════════════════════════════════════════╣
║  Subscriptions: ${pushSubscriptions.size}
╚════════════════════════════════════════╝
  `);
  res.status(201).json({
    message: "Subscription saved successfully",
    subscriptionCount: pushSubscriptions.size,
  });
});

//Send push notification to all subscribed devices
app.post("/api/send-notification", async (req, res) => {
  const { title, body, data } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: "Title and body are required" });
  }

  const notificationPayload = {
    notification: {
      title,
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data?.assignmentId || "notification",
      requireInteraction: true,
    },
    data: data || {},
  };

  const failedSubscriptions = [];

  for (const [subscriptionId, subscription] of pushSubscriptions.entries()) {
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify(notificationPayload),
      );
      console.log(`✓ Notification sent to: ${subscriptionId}`);
    } catch (error) {
      if (error.statusCode === 410) {
        pushSubscriptions.delete(subscriptionId);
        failedSubscriptions.push(subscriptionId);
      } else {
        console.error(`✗ Failed to send notification: ${error.message}`);
      }
    }
  }

  res.json({
    success: true,
    message: "Notification sent",
    totalSubscriptions: pushSubscriptions.size,
    failed: failedSubscriptions.length,
  });
});

//Unsubscribe from push notifications
app.post("/api/push-unsubscribe", (req, res) => {
  const { subscription } = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription" });
  }

  const subscriptionId = subscription.endpoint;
  pushSubscriptions.delete(subscriptionId);

  console.log(`✓ Unsubscribed: ${subscriptionId}`);
  console.log(`
╠════════════════════════════════════════╣
║  Subscriptions: ${pushSubscriptions.size}
╚════════════════════════════════════════╝
  `);
  res.json({
    message: "Unsubscribed successfully",
    subscriptionCount: pushSubscriptions.size,
  });
});

///Get current subscriptions count (for admin/testing)
app.get("/api/subscriptions/count", (req, res) => {
  res.json({
    count: pushSubscriptions.size,
    subscriptions: Array.from(pushSubscriptions.keys()),
  });
});

// ===== SCHEDULE NOTIFICATIONS FOR ASSIGNMENTS =====
/**
 * Setup deadline notifications for an assignment
 * This runs on the backend and sends notifications at the right time
 */
const schedule = require("node-schedule");
const assignmentNotifications = new Map();

app.post("/api/assignments/schedule-notification", (req, res) => {
  const { assignmentId, title, deadline, timeBeforeDeadline = 24 } = req.body;

  if (!assignmentId || !deadline) {
    return res
      .status(400)
      .json({ error: "assignmentId and deadline are required" });
  }

  // Calculate when to send notification
  const deadlineDate = new Date(deadline);
  const notificationTime = new Date(
    deadlineDate.getTime() - timeBeforeDeadline * 60 * 60 * 1000,
  );

  // Cancel existing notification for this assignment
  if (assignmentNotifications.has(assignmentId)) {
    assignmentNotifications.get(assignmentId).cancel();
  }

  // Schedule the notification
  const job = schedule.scheduleJob(notificationTime, async () => {
    console.log(`⏰ Sending scheduled notification for: ${title}`);

    const notificationPayload = {
      notification: {
        title: "⏰ Assignment Due Soon",
        body: `${title} - Due at ${deadlineDate.toLocaleString()}`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: assignmentId,
        requireInteraction: true,
      },
      data: {
        assignmentId,
        deadline: deadline.toISOString(),
      },
    };

    // Send to all subscribed devices
    for (const [subscriptionId, subscription] of pushSubscriptions.entries()) {
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify(notificationPayload),
        );
      } catch (error) {
        if (error.statusCode === 410) {
          pushSubscriptions.delete(subscriptionId);
        }
      }
    }

    // Clean up completed notification
    assignmentNotifications.delete(assignmentId);
  });

  assignmentNotifications.set(assignmentId, job);

  console.log(
    `✓ Notification scheduled for ${assignmentId} at ${notificationTime}`,
  );
  res.json({
    message: "Notification scheduled",
    scheduledFor: notificationTime.toISOString(),
  });
});

//ERROR HANDLING
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  });
});

//START SERVER
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  Smart Campus Backend Server Started   ║
╠════════════════════════════════════════╣
║  Port: ${PORT}                          
║  VAPID Subject: ${vapidSubject}
║  Subscriptions: ${pushSubscriptions.size}
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
