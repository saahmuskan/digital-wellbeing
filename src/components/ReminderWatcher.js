import { useEffect, useState } from "react";
import { getCurrentUser, getStorageKeyForCurrentUser } from "../utils/auth";

function getTodayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseTimeToMinutes(timeValue) {
  const match = String(timeValue || "").match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return (hh * 60) + mm;
}

function isReminderActiveToday(reminder, date) {
  const repeat = String(reminder?.repeat || "Daily");
  const day = date.getDay();

  if (repeat === "Weekdays") {
    return day >= 1 && day <= 5;
  }

  if (repeat === "Weekly") {
    const created = reminder?.createdAt ? new Date(reminder.createdAt) : null;
    const createdDay = created && !Number.isNaN(created.getTime()) ? created.getDay() : day;
    return day === createdDay;
  }

  return true;
}

function ReminderWatcher() {
  const [activePopup, setActivePopup] = useState(null);

  useEffect(() => {
    const dueWindowMinutes = 2;

    const checkDueReminders = () => {
      const user = getCurrentUser();
      if (!user?.id) return;

      const reminderKey = getStorageKeyForCurrentUser("wellifyReminders");
      const notifiedKey = getStorageKeyForCurrentUser("wellifyReminderNotified");

      const reminders = JSON.parse(localStorage.getItem(reminderKey) || "[]");
      if (!Array.isArray(reminders) || reminders.length === 0) return;

      const now = new Date();
      const todayKey = getTodayKey(now);
      const nowMinutes = (now.getHours() * 60) + now.getMinutes();
      const notifiedMap = JSON.parse(localStorage.getItem(notifiedKey) || "{}");
      let changed = false;
      let popupCandidate = null;

      reminders.forEach((item) => {
        if (!item || item.done) return;
        if (!isReminderActiveToday(item, now)) return;

        const reminderMinutes = parseTimeToMinutes(item.time);
        if (reminderMinutes === null) return;

        const delta = nowMinutes - reminderMinutes;
        if (delta < 0 || delta > dueWindowMinutes) return;

        const fireKey = `${item.id}|${todayKey}|${item.time}`;
        if (notifiedMap[fireKey]) return;

        popupCandidate = popupCandidate || item;

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          const body = item.note || `${item.category} reminder`;
          new Notification("Wellify Reminder", {
            body: `${item.title} • ${body}`,
          });
        }

        notifiedMap[fireKey] = now.toISOString();
        changed = true;
      });

      if (changed) {
        localStorage.setItem(notifiedKey, JSON.stringify(notifiedMap));
      }

      if (popupCandidate) {
        setActivePopup(popupCandidate);
      }
    };

    checkDueReminders();
    const intervalId = setInterval(checkDueReminders, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const dismissPopup = () => {
    setActivePopup(null);
  };

  const markDone = () => {
    if (!activePopup?.id) return;

    const reminderKey = getStorageKeyForCurrentUser("wellifyReminders");
    const reminders = JSON.parse(localStorage.getItem(reminderKey) || "[]");

    if (!Array.isArray(reminders)) {
      setActivePopup(null);
      return;
    }

    const next = reminders.map((item) => (
      item.id === activePopup.id ? { ...item, done: true } : item
    ));

    localStorage.setItem(reminderKey, JSON.stringify(next));
    setActivePopup(null);
  };

  if (!activePopup) return null;

  return (
    <div className="reminder-live-popup" role="alert" aria-live="assertive">
      <div className="reminder-live-popup-head">
        <strong>Reminder due now</strong>
        <span>{activePopup.time}</span>
      </div>
      <h4>{activePopup.title}</h4>
      <p>{activePopup.note || `${activePopup.category} reminder`}</p>
      <div className="reminder-live-popup-actions">
        <button type="button" onClick={markDone}>Mark done</button>
        <button type="button" onClick={dismissPopup}>Dismiss</button>
      </div>
    </div>
  );
}

export default ReminderWatcher;
