export function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(timeString) {
  if (!timeString) return "";
  const [hours, minutes] = timeString.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function getTodayName() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function getTodayFormatted() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function getTimeRemaining(deadlineString) {
  if (!deadlineString)
    return { text: "No deadline", isOverdue: false, isDueSoon: false };

  const now = new Date();
  const deadline = new Date(deadlineString);
  const diffMs = deadline - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      text: overdueDays === 0 ? "Overdue today" : `${overdueDays}d overdue`,
      isOverdue: true,
      isDueSoon: false,
    };
  }

  if (diffHours < 24) {
    return {
      text: `${diffHours}h remaining`,
      isOverdue: false,
      isDueSoon: true,
    };
  }

  if (diffDays <= 3) {
    return {
      text: `${diffDays}d remaining`,
      isOverdue: false,
      isDueSoon: true,
    };
  }

  return {
    text: `${diffDays} days left`,
    isOverdue: false,
    isDueSoon: false,
  };
}

export function isCurrentlyOngoing(startTime, endTime) {
  if (!startTime || !endTime) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
