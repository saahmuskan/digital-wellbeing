import { useEffect, useState } from "react";
import {
  FiActivity,
  FiBell,
  FiClock,
  FiDroplet,
  FiEdit3,
  FiMessageSquare,
  FiMoon,
  FiPlus,
  FiTrash2,
  FiZap,
} from "react-icons/fi";
import { getCurrentUser, getStorageKeyForCurrentUser } from "../utils/auth";

const CATEGORY_OPTIONS = [
  { key: "Fitness", label: "Fitness", icon: FiActivity, tone: "green" },
  { key: "Sleep", label: "Sleep", icon: FiMoon, tone: "blue" },
  { key: "Hydration", label: "Hydration", icon: FiDroplet, tone: "amber" },
  { key: "Focus", label: "Focus", icon: FiZap, tone: "rose" },
  { key: "Mood", label: "Mood", icon: FiMessageSquare, tone: "green" },
  { key: "Break", label: "Break", icon: FiClock, tone: "blue" },
];

const DEFAULT_FORM = {
  title: "",
  category: "Sleep",
  time: "08:00",
  repeat: "Daily",
  note: "",
};

function getNotificationSupport() {
  return typeof window !== "undefined" && "Notification" in window;
}

function getReminderStorageKey() {
  const user = getCurrentUser();
  return user?.id ? getStorageKeyForCurrentUser("wellifyReminders") : "wellifyReminders";
}

function parseTimeToMinutes(timeValue) {
  const match = String(timeValue || "").match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  return (hours * 60) + minutes;
}

function getNextUpcomingReminder(reminders, now = new Date()) {
  const activeReminders = reminders.filter((item) => !item.done);
  if (activeReminders.length === 0) return null;

  const nowMinutes = (now.getHours() * 60) + now.getMinutes();
  const withMinutes = activeReminders
    .map((item) => ({ item, minutes: parseTimeToMinutes(item.time) }))
    .filter((entry) => entry.minutes !== null)
    .sort((a, b) => a.minutes - b.minutes);

  const upcomingToday = withMinutes.find((entry) => entry.minutes >= nowMinutes);
  return (upcomingToday || withMinutes[0] || null)?.item || null;
}

function getLatestAssessment() {
  const scoreKey = getStorageKeyForCurrentUser("wellifyScores");
  const historyKey = getStorageKeyForCurrentUser("wellifyHistory");
  const latest = JSON.parse(localStorage.getItem(scoreKey) || "null");
  if (latest) return latest;

  const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
  return history[0] || null;
}

function getRecentAssessments(limit = 7) {
  const historyKey = getStorageKeyForCurrentUser("wellifyHistory");
  const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
  return Array.isArray(history) ? history.slice(0, limit) : [];
}

function getMoodTrend(recentAssessments) {
  const moods = recentAssessments
    .map((entry) => entry?.mood)
    .filter(Boolean);

  const lowCount = moods.filter((mood) => mood === "Sad" || mood === "Anxious").length;
  const positiveCount = moods.filter((mood) => mood === "Happy" || mood === "Joyful").length;
  const latestMood = moods[0] || null;

  const counts = moods.reduce((acc, mood) => {
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {});

  const dominantMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    moods,
    latestMood,
    dominantMood,
    lowCount,
    positiveCount,
  };
}

function getStreakSnapshot() {
  const streakKey = getStorageKeyForCurrentUser("wellifyStreak");
  const streak = JSON.parse(localStorage.getItem(streakKey) || "null");
  return {
    current: Number(streak?.current) > 0 ? Number(streak.current) : 0,
    best: Number(streak?.best) > 0 ? Number(streak.best) : 0,
    lastDate: streak?.lastDate || null,
  };
}

function buildSmartSuggestions(scores, moodTrend, streakSnapshot) {
  const suggestions = [];
  const seen = new Set();
  const dominantDosha = scores?.ayurveda?.dominantDosha;

  const baselineSuggestions = [
    {
      category: "Focus",
      title: "Morning planning reminder",
      time: "08:30",
      repeat: "Daily",
      note: "Pick one priority before the day gets noisy.",
      reason: "A stable default that helps structure the day.",
    },
    {
      category: "Sleep",
      title: "Evening wind-down",
      time: "22:00",
      repeat: "Daily",
      note: "Close the day with a calmer routine.",
      reason: "A reliable habit to reduce late-night stress.",
    },
    {
      category: "Hydration",
      title: "Midday water break",
      time: "13:30",
      repeat: "Daily",
      note: "Pause for water before energy dips in the afternoon.",
      reason: "Simple support that benefits focus and physical energy.",
    },
    {
      category: "Break",
      title: "Post-lunch reset",
      time: "15:30",
      repeat: "Daily",
      note: "Take a short screen pause and reset attention.",
      reason: "A gentle reset improves consistency through the day.",
    },
  ];

  const addSuggestion = (item) => {
    const key = `${item.category}|${item.title}`;
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push(item);
  };

  if (!scores) {
    return baselineSuggestions;
  }

  if (scores.physical < 7) {
    addSuggestion({
      category: "Sleep",
      title: "Sleep recovery reminder",
      time: "22:15",
      repeat: "Daily",
      note: "Dim the lights and stop work 30 minutes earlier.",
      reason: "Your physical score suggests you need more recovery time.",
    });
    addSuggestion({
      category: "Hydration",
      title: "Hydration check",
      time: "14:00",
      repeat: "Daily",
      note: "Refill your bottle before the afternoon dip.",
      reason: "Small support can lift a low physical score quickly.",
    });
  }

  if (scores.mental < 7) {
    addSuggestion({
      category: "Break",
      title: "Reset screen break",
      time: "11:30",
      repeat: "Weekdays",
      note: "Stand up, stretch, and look away from the screen.",
      reason: "Mental load is high, which often means high screen strain too.",
    });
  }

  if (dominantDosha === "Vata") {
    addSuggestion({
      category: "Sleep",
      title: "Ayurveda calm routine",
      time: "21:30",
      repeat: "Daily",
      note: "Keep a consistent night routine for steadier sleep.",
      reason: "Ayurveda insight shows Vata-dominant pattern, which improves with regular routine.",
    });
  }

  if (dominantDosha === "Pitta") {
    addSuggestion({
      category: "Hydration",
      title: "Cooling hydration break",
      time: "15:00",
      repeat: "Daily",
      note: "Take a short cooling pause and hydrate.",
      reason: "Ayurveda insight shows Pitta-dominant pattern, which benefits from cooling and decompression.",
    });
  }

  if (dominantDosha === "Kapha") {
    addSuggestion({
      category: "Fitness",
      title: "Activation walk",
      time: "07:15",
      repeat: "Daily",
      note: "A brisk morning start helps avoid sluggishness later.",
      reason: "Ayurveda insight shows Kapha-dominant pattern, which responds well to morning movement.",
    });
  }

  if (scores.emotional < 7 || scores.mood === "Anxious" || scores.mood === "Sad") {
    addSuggestion({
      category: "Mood",
      title: "Mood check-in",
      time: "20:00",
      repeat: "Daily",
      note: "Write one sentence about how today felt.",
      reason: "This keeps emotional tracking grounded and personal.",
    });
  }

  if (moodTrend.lowCount >= 2) {
    addSuggestion({
      category: "Mood",
      title: "Evening decompression",
      time: "21:00",
      repeat: "Daily",
      note: "Try a 10-minute calm-down routine and a short journal line.",
      reason: `Recent mood trend shows ${moodTrend.lowCount} low-mood check-ins.`,
    });
  }

  if (moodTrend.positiveCount >= 3 && scores.overall >= 7.5) {
    addSuggestion({
      category: "Fitness",
      title: "Momentum walk",
      time: "18:15",
      repeat: "Daily",
      note: "Use your good mood window to lock in one positive habit.",
      reason: "Positive mood trend detected, ideal time to reinforce routine.",
    });
  }

  if (streakSnapshot.current > 0 && streakSnapshot.current < 3) {
    addSuggestion({
      category: "Focus",
      title: "Protect your streak",
      time: "19:30",
      repeat: "Daily",
      note: "Quick reminder to complete today before the streak resets.",
      reason: `You are on a ${streakSnapshot.current}-day streak, keep it alive today.`,
    });
  }

  if (streakSnapshot.current >= 3) {
    addSuggestion({
      category: "Fitness",
      title: "Streak maintenance",
      time: "18:00",
      repeat: "Daily",
      note: "You have consistency now. Keep one small non-negotiable habit.",
      reason: `Great consistency: ${streakSnapshot.current}-day streak active.`,
    });
  }

  if (scores.overall >= 8) {
    addSuggestion({
      category: "Fitness",
      title: "Keep the streak alive",
      time: "18:00",
      repeat: "Daily",
      note: "Do a 10-minute walk so the good rhythm does not fade.",
      reason: "You are doing well, so this acts as a maintenance reminder.",
    });
  }

  if (suggestions.length < 4) {
    baselineSuggestions.forEach((item) => addSuggestion(item));
  }

  return suggestions.slice(0, 5);
}

function getCompletion(reminders) {
  if (!reminders.length) return 0;
  const done = reminders.filter((item) => item.done).length;
  return Math.round((done / reminders.length) * 100);
}

function sortByTime(reminders) {
  return [...reminders].sort((a, b) => String(a.time).localeCompare(String(b.time)));
}

function ReminderPage() {
  const reminderStorageKey = getReminderStorageKey();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [reminders, setReminders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(reminderStorageKey) || "[]");
    } catch {
      return [];
    }
  });
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (!getNotificationSupport()) return "unsupported";
    return Notification.permission;
  });
  const [toastMessage, setToastMessage] = useState("");
  const [clockTick, setClockTick] = useState(() => Date.now());

  useEffect(() => {
    localStorage.setItem(reminderStorageKey, JSON.stringify(reminders));
  }, [reminderStorageKey, reminders]);

  useEffect(() => {
    const intervalId = setInterval(() => setClockTick(Date.now()), 30000);
    return () => clearInterval(intervalId);
  }, []);

  const latestAssessment = getLatestAssessment();
  const recentAssessments = getRecentAssessments(7);
  const moodTrend = getMoodTrend(recentAssessments);
  const streakSnapshot = getStreakSnapshot();
  const smartSuggestions = buildSmartSuggestions(latestAssessment, moodTrend, streakSnapshot);
  const visibleSuggestions = smartSuggestions.slice(0, 4);

  const completion = getCompletion(reminders);
  const activeReminders = sortByTime(reminders.filter((item) => !item.done));
  const finishedReminders = reminders.filter((item) => item.done).length;
  const nextReminder = getNextUpcomingReminder(reminders, new Date(clockTick)) || activeReminders[0] || null;
  const reminderHighlights = [
    {
      icon: FiMessageSquare,
      title: moodTrend.dominantMood ? `${moodTrend.dominantMood} mood trend` : "Mood trend not ready",
      note: moodTrend.lowCount > 0
        ? `${moodTrend.lowCount} lower checks found in your recent history.`
        : "Track a few more days to see a pattern.",
      meta: `Recent mood: ${moodTrend.latestMood || "None"}`,
    },
    {
      icon: FiZap,
      title: latestAssessment?.ayurveda?.dominantDosha ? `${latestAssessment.ayurveda.dominantDosha} signal` : "Ayurveda signal pending",
      note: latestAssessment?.ayurveda?.guidance?.summary || "Complete an assessment to unlock rhythm cues.",
      meta: `Completion ${completion}%`,
    },
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const applySuggestion = (suggestion) => {
    setForm({
      category: suggestion.category,
      title: suggestion.title,
      time: suggestion.time,
      repeat: suggestion.repeat,
      note: suggestion.note,
    });
  };

  const handleAddReminder = (event) => {
    event.preventDefault();

    if (!form.title.trim()) return;

    const nextReminderItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: form.title.trim(),
      category: form.category,
      time: form.time,
      repeat: form.repeat,
      note: form.note.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };

    setReminders((prev) => sortByTime([nextReminderItem, ...prev]));
    setForm((prev) => ({ ...prev, title: "", note: "" }));
  };

  const toggleReminder = (id) => {
    setReminders((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const deleteReminder = (id) => {
    setReminders((prev) => prev.filter((item) => item.id !== id));
  };

  const enableNotifications = async () => {
    if (!getNotificationSupport()) {
      setToastMessage("This browser does not support pop-up notifications.");
      setNotificationPermission("unsupported");
      return;
    }

    if (Notification.permission === "granted") {
      setNotificationPermission("granted");
      setToastMessage("Notifications are already enabled.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      setToastMessage("Pop-up reminders enabled.");
    } else {
      setToastMessage("Notifications are blocked. You can enable them from browser settings.");
    }
  };

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeoutId = setTimeout(() => setToastMessage(""), 3000);
    return () => clearTimeout(timeoutId);
  }, [toastMessage]);

  return (
    <div className="blog-wrap reminder-wrap reminder-editor">
      <section className="reminder-hero">
        <div className="reminder-hero-copy">
          <span className="reminder-kicker">
            <FiBell aria-hidden="true" /> Daily Reminder
          </span>
          <div>
            <h2>Plan your wellness, one reminder at a time.</h2>
            <p>
              Set simple daily reminders to build healthy habits. Get smart suggestions based on your wellness data and stay consistent without feeling overwhelmed.
            </p>
          </div>

          <div className="reminder-stats">
            <div>
              <strong>{reminders.length.toString().padStart(2, "0")}</strong>
              <span>Total reminders</span>
            </div>
            <div>
              <strong>{completion}%</strong>
              <span>Completion</span>
            </div>
          </div>
        </div>
      </section>

      <section className="reminder-builder-grid">
        <div className="reminder-panel reminder-builder-panel">
          <div className="reminder-panel-head">
            <div>
              <span className="reminder-mini-label">Create yours</span>
              <h3>Make a custom reminder</h3>
            </div>
            <div className="reminder-head-actions">
              <span className="reminder-panel-sub">Saved for this account</span>
              <button
                type="button"
                className="reminder-notify-btn"
                onClick={enableNotifications}
                disabled={notificationPermission === "granted" || notificationPermission === "unsupported"}
              >
                {notificationPermission === "granted"
                  ? "Pop-ups enabled"
                  : notificationPermission === "unsupported"
                    ? "Pop-ups not supported"
                    : "Enable pop-up reminders"}
              </button>
            </div>
          </div>

          <form className="reminder-form" onSubmit={handleAddReminder}>
            <div className="reminder-field">
              <label>Reminder title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Example: Evening walk"
              />
            </div>

            <div className="reminder-form-row">
              <div className="reminder-field">
                <label>Category</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="reminder-field">
                <label>Time</label>
                <input type="time" name="time" value={form.time} onChange={handleChange} />
              </div>
            </div>

            <div className="reminder-form-row">
              <div className="reminder-field">
                <label>Repeat</label>
                <select name="repeat" value={form.repeat} onChange={handleChange}>
                  <option>Daily</option>
                  <option>Weekdays</option>
                  <option>Weekly</option>
                  <option>Custom</option>
                </select>
              </div>
              <div className="reminder-field">
                <label>Note</label>
                <input
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder="Short note for yourself"
                />
              </div>
            </div>

            <button type="submit" className="reminder-submit">
              <FiPlus aria-hidden="true" /> Add reminder
            </button>
          </form>

          <div className="reminder-builder-foot">
            <div className="reminder-panel-head">
              <div>
                <span className="reminder-mini-label">At a glance</span>
              </div>
              <span className="reminder-panel-sub">A compact summary from your current data</span>
            </div>

            <div className="reminder-quick-stack">
              {reminderHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <article key={item.title} className="reminder-quick-item">
                    <div className="reminder-quick-icon" aria-hidden="true">
                      <Icon />
                    </div>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.note}</p>
                    </div>
                    <span>{item.meta}</span>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="reminder-panel reminder-suggestion-panel">
          <div className="reminder-panel-head">
            <div>
              <span className="reminder-mini-label">Smart touch</span>
              <h3>Auto suggestions from your wellness data</h3>
            </div>
          </div>

          <div className="reminder-suggestion-list">
            {visibleSuggestions.map((suggestion) => {
              const category = CATEGORY_OPTIONS.find((item) => item.key === suggestion.category) || CATEGORY_OPTIONS[0];
              const Icon = category.icon;

              return (
                <article key={`${suggestion.title}-${suggestion.time}`} className={`reminder-suggestion ${category.tone}`}>
                  <div className="reminder-suggestion-icon" aria-hidden="true">
                    <Icon />
                  </div>
                  <div className="reminder-suggestion-body">
                    <div className="reminder-suggestion-head">
                      <strong>{suggestion.title}</strong>
                      <span>{suggestion.time}</span>
                    </div>
                    <p>{suggestion.reason}</p>
                    <div className="reminder-suggestion-meta">
                      <span>{suggestion.repeat}</span>
                      <span>{suggestion.category}</span>
                    </div>
                  </div>
                  <button type="button" className="reminder-suggestion-action" onClick={() => applySuggestion(suggestion)}>
                    Use
                  </button>
                </article>
              );
            })}
          </div>
        </aside>
      </section>

      <section className="reminder-list-section">
        <div className="reminder-panel reminder-timeline-panel">
          <div className="reminder-panel-head">
            <div>
              <span className="reminder-mini-label">Your list</span>
              <h3>Reminders you created</h3>
            </div>
            <span className="reminder-panel-sub">{reminders.length} total · {finishedReminders} completed · next {nextReminder ? nextReminder.time : "--:--"}</span>
          </div>

          <div className="reminder-timeline">
            {reminders.length === 0 ? (
              <div className="reminder-empty-state">
                <FiEdit3 aria-hidden="true" />
                <h4>No reminders saved yet</h4>
                <p>Create your own fitness, sleep, or focus reminder and it will stay saved for next time.</p>
              </div>
            ) : (
              sortByTime(reminders).map((item) => {
                const category = CATEGORY_OPTIONS.find((entry) => entry.key === item.category) || CATEGORY_OPTIONS[0];
                const Icon = category.icon;

                return (
                  <article key={item.id} className={`reminder-event ${category.tone}${item.done ? " done" : ""}`}>
                    <div className="reminder-event-time">
                      <strong>{item.time}</strong>
                      <span>{item.repeat}</span>
                    </div>

                    <div className="reminder-event-body">
                      <div className="reminder-event-head">
                        <div className="reminder-event-title">
                          <span className="reminder-event-icon" aria-hidden="true">
                            <Icon />
                          </span>
                          <div>
                            <h4>{item.title}</h4>
                            <p>{item.note || item.category}</p>
                          </div>
                        </div>

                        <div className="reminder-event-actions">
                          <button type="button" onClick={() => toggleReminder(item.id)}>
                            {item.done ? "Undo" : "Done"}
                          </button>
                          <button type="button" className="danger" onClick={() => deleteReminder(item.id)}>
                            <FiTrash2 aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {toastMessage ? <div className="reminder-toast">{toastMessage}</div> : null}
    </div>
  );
}

export default ReminderPage;
