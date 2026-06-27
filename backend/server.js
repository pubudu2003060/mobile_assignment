const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const webpush = require("web-push");
const dotenv = require("dotenv");
const schedule = require("node-schedule");

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

const pushSubscriptions = new Map(); // Stores user push endpoints
const assignmentsStore = new Map(); // Stores assignments with reminder tracking

async function sendPushToAllSubscribers(title, body, tag) {
  if (pushSubscriptions.size === 0) {
    console.log("[PUSH] No subscribers to notify.");
    return;
  }

  const notificationPayload = {
    title,
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: tag || "evaluation-reminder",
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { tag },
  };

  console.log(`[PUSH] Sending to ${pushSubscriptions.size} devices...`);
  const failedEndpoints = [];

  for (const [subscriptionId, subscription] of pushSubscriptions.entries()) {
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify(notificationPayload),
      );
      console.log(`  ✓ Sent to: ${subscriptionId.substring(0, 30)}...`);
    } catch (error) {
      if (error.statusCode === 410) {
        // Subscription expired or revoked
        console.log(
          `  ✗ Removing expired subscription: ${subscriptionId.substring(0, 30)}...`,
        );
        failedEndpoints.push(subscriptionId);
      } else {
        console.error(`  ✗ Failed: ${error.message}`);
      }
    }
  }

  // Clean up expired subscriptions
  failedEndpoints.forEach((id) => pushSubscriptions.delete(id));
}

schedule.scheduleJob("* * * * *", async () => {
  const now = new Date();
  console.log(`\n[CRON] Running reminder check at ${now.toLocaleTimeString()}`);

  if (assignmentsStore.size === 0) {
    console.log("[CRON] No assignments scheduled.");
    return;
  }

  const thresholds = [
    { hours: 1 / 60, label: "1 minute" },
    { hours: 5 / 60, label: "5 minutes" },
    { hours: 1, label: "1 hour" },
    { hours: 24, label: "1 day" },
    { hours: 72, label: "3 days" },
    { hours: 168, label: "7 days" },
  ];

  for (const [id, assignment] of assignmentsStore.entries()) {
    if (assignment.status === "Completed" || !assignment.notify) {
      continue;
    }

    const deadline = new Date(assignment.deadline);
    if (isNaN(deadline.getTime())) {
      console.warn(`[CRON] Invalid deadline for assignment ${id}`);
      continue;
    }

    const diffMs = deadline - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours <= 0) {
      continue;
    }

    for (const t of thresholds) {
      if (diffHours <= t.hours && !assignment.remindersSent.includes(t.hours)) {
        const title = `⏰ Evaluation Reminder: ${assignment.title}`;
        const body = `⚠️ Deadline is in ${t.label}!`;
        const tag = `${assignment.id}-${t.hours}`;

        console.log(
          `[CRON] Triggering "${t.label}" reminder for "${assignment.title}" (${diffHours.toFixed(4)}h remaining)`,
        );
        await sendPushToAllSubscribers(title, body, tag);

        assignment.remindersSent.push(t.hours);
        assignmentsStore.set(id, assignment);

        break;
      }
    }
  }
});

app.post("/api/push-subscription", (req, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription" });
  }

  const subscriptionId = subscription.endpoint;
  pushSubscriptions.set(subscriptionId, subscription);

  console.log(
    `✓ Push subscription saved: ${subscriptionId.substring(0, 30)}...`,
  );
  res.status(201).json({
    message: "Subscription saved successfully",
    subscriptionCount: pushSubscriptions.size,
  });
});

app.post("/api/push-unsubscribe", (req, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription" });
  }

  const subscriptionId = subscription.endpoint;
  pushSubscriptions.delete(subscriptionId);

  console.log(`✓ Unsubscribed: ${subscriptionId.substring(0, 30)}...`);
  res.json({
    message: "Unsubscribed successfully",
    subscriptionCount: pushSubscriptions.size,
  });
});

app.get("/api/subscriptions/count", (req, res) => {
  res.json({
    count: pushSubscriptions.size,
    subscriptions: Array.from(pushSubscriptions.keys()),
  });
});

app.post("/api/assignments/schedule-notification", (req, res) => {
  const {
    assignmentId,
    title,
    deadline,
    status = "Pending",
    notify = true,
  } = req.body;

  if (!assignmentId || !deadline) {
    return res
      .status(400)
      .json({ error: "assignmentId and deadline are required" });
  }

  const existing = assignmentsStore.get(assignmentId) || { remindersSent: [] };
  assignmentsStore.set(assignmentId, {
    id: assignmentId,
    title: title || "Untitled",
    deadline: deadline,
    status: status,
    notify: notify,
    remindersSent: existing.remindersSent || [],
  });

  console.log(
    `[API] Assignment stored: "${title}" (${assignmentId}) | Reminders already sent: ${(existing.remindersSent || []).join(", ")}`,
  );
  res.json({
    message: "Assignment scheduled for multi-tiered reminders",
    assignmentId: assignmentId,
  });
});

app.get("/api/assignments", (req, res) => {
  const all = Array.from(assignmentsStore.values());
  res.json({ count: all.length, assignments: all });
});

app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  Smart Campus Backend Server Started   ║
╠════════════════════════════════════════╣
║  Port: ${PORT}                          
║  VAPID Subject: ${vapidSubject}
║  Subscriptions: ${pushSubscriptions.size}
║  Scheduled Assignments: ${assignmentsStore.size}
║  Reminder Strategy: 7d → 3d → 1d → 1h → 5min → 1min
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
