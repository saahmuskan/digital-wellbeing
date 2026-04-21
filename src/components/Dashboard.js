import { useEffect, useMemo, useState } from "react";
import { FiTrendingUp, FiBriefcase, FiCalendar, FiFeather } from "react-icons/fi";
import MoodBanner from "./MoodUI";
import { getAllUsers, getCurrentUser, getStorageKeyForCurrentUser, getStorageKeyForUser } from "../utils/auth";
 
const SCORE_KEYS = ["physical", "mental", "emotional", "overall"];

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getEntryDateKey(entry) {
  if (entry?.timestamp) {
    const parsed = new Date(entry.timestamp);
    if (!Number.isNaN(parsed.getTime())) return toDateKey(parsed);
  }

  if (entry?.date) {
    const raw = String(entry.date).trim();
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return toDateKey(parsed);

    // Handle common date strings like 21/04/2026 or 21-04-2026.
    const slashOrDash = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (slashOrDash) {
      const day = Number(slashOrDash[1]);
      const month = Number(slashOrDash[2]);
      const year = Number(slashOrDash[3].length === 2 ? `20${slashOrDash[3]}` : slashOrDash[3]);
      const rebuilt = new Date(year, month - 1, day);
      if (!Number.isNaN(rebuilt.getTime())) return toDateKey(rebuilt);
    }

    const dayMonthText = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
    if (dayMonthText) {
      const rebuilt = new Date(`${dayMonthText[1]} ${dayMonthText[2]} ${dayMonthText[3]}`);
      if (!Number.isNaN(rebuilt.getTime())) return toDateKey(rebuilt);
    }
  }

  return null;
}

function getCurrentStreak(history) {
  const uniqueDays = new Set(
    history
      .map((entry) => getEntryDateKey(entry))
      .filter(Boolean)
  );

  const today = new Date();
  if (!uniqueDays.has(toDateKey(today))) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  while (uniqueDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function parseDateKeyToDate(dateKey) {
  const match = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getDisplayStreak(history) {
  const streakKey = getStorageKeyForCurrentUser("wellifyStreak");
  const stored = JSON.parse(localStorage.getItem(streakKey) || "null");

  if (!stored?.lastDate) {
    return getCurrentStreak(history);
  }

  const lastDate = parseDateKeyToDate(stored.lastDate);
  if (!lastDate) {
    return getCurrentStreak(history);
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const lastStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const diffDays = Math.floor((todayStart.getTime() - lastStart.getTime()) / 86400000);

  const storedCurrent = Number(stored.current);
  const safeCurrent = Number.isFinite(storedCurrent) && storedCurrent > 0 ? storedCurrent : 0;

  // Keep streak visible on the very next day so user can continue it.
  if (diffDays <= 1) {
    return safeCurrent;
  }

  return 0;
}

function getDailyLatestScoreMap(history) {
  const dailyMap = new Map();

  history.forEach((entry) => {
    const dayKey = getEntryDateKey(entry);
    const overall = Number(entry?.overall);

    if (!dayKey || !Number.isFinite(overall)) return;

    const existing = dailyMap.get(dayKey);
    const currentTs = entry?.timestamp ? new Date(entry.timestamp).getTime() : Number.NEGATIVE_INFINITY;
    const existingTs = existing?.timestamp ? new Date(existing.timestamp).getTime() : Number.NEGATIVE_INFINITY;

    if (!existing || currentTs >= existingTs) {
      dailyMap.set(dayKey, entry);
    }
  });

  return dailyMap;
}

function getNumericScore(entry, key) {
  const value = Number(entry?.[key]);
  return Number.isFinite(value) ? value : null;
}

function getOrganisationSnapshot() {
  const users = getAllUsers();
  const latestScores = users
    .map((user) => {
      const scoreKey = getStorageKeyForUser("wellifyScores", user.id);
      const historyKey = getStorageKeyForUser("wellifyHistory", user.id);

      const latest = JSON.parse(localStorage.getItem(scoreKey) || "null")
        || (JSON.parse(localStorage.getItem(historyKey) || "[]")[0] || null);

      return {
        user,
        score: latest,
      };
    })
    .filter((item) => item.score && getNumericScore(item.score, "overall") !== null);

  const participants = latestScores.length;
  const totalUsers = users.length;

  if (participants === 0) {
    return {
      participants,
      totalUsers,
      teamWellness: 0,
      teamStatus: "No data yet",
      teamClass: "amber-c",
      stressLabel: "No data",
      stressSub: "Need assessment data",
      stressClass: "amber-c",
      productivityLabel: "No data",
      productivitySub: "Need assessment data",
      productivityClass: "amber-c",
    };
  }

  const avgOverall = latestScores.reduce((sum, item) => sum + getNumericScore(item.score, "overall"), 0) / participants;
  const avgMental = latestScores.reduce((sum, item) => sum + getNumericScore(item.score, "mental"), 0) / participants;

  const teamWellness = Math.round(avgOverall * 10);
  const stressRiskPct = Math.round(100 - (avgMental * 10));

  const teamStatus = teamWellness >= 75 ? "High wellbeing" : teamWellness >= 55 ? "Moderate wellbeing" : "Needs attention";
  const teamClass = teamWellness >= 75 ? "green-c" : teamWellness >= 55 ? "amber-c" : "rose-c";

  const stressLabel = stressRiskPct >= 65 ? "High" : stressRiskPct >= 35 ? "Medium" : "Low";
  const stressClass = stressRiskPct >= 65 ? "rose-c" : stressRiskPct >= 35 ? "amber-c" : "green-c";

  const productivityLabel = teamWellness >= 75 ? "Low" : teamWellness >= 55 ? "Medium" : "High";
  const productivityClass = teamWellness >= 75 ? "green-c" : teamWellness >= 55 ? "amber-c" : "rose-c";

  return {
    participants,
    totalUsers,
    teamWellness,
    teamStatus,
    teamClass,
    stressLabel,
    stressSub: `${stressRiskPct}% estimated stress risk`,
    stressClass,
    productivityLabel,
    productivitySub: `${teamWellness}% wellness alignment`,
    productivityClass,
  };
}

function getMergedHistoryForCurrentUser() {
  const userHistoryKey = getStorageKeyForCurrentUser("wellifyHistory");
  const userHistory = JSON.parse(localStorage.getItem(userHistoryKey) || "[]");

  // Backward compatibility for older app data saved before user-scoped keys.
  const legacyHistory = JSON.parse(localStorage.getItem("wellifyHistory") || "[]");

  const userDailyKey = getStorageKeyForCurrentUser("wellifyDailyScores");
  const userDaily = Object.values(JSON.parse(localStorage.getItem(userDailyKey) || "{}"));

  const legacyDaily = Object.values(JSON.parse(localStorage.getItem("wellifyDailyScores") || "{}"));

  const userScoreKey = getStorageKeyForCurrentUser("wellifyScores");
  const userLatestScore = JSON.parse(localStorage.getItem(userScoreKey) || "null");
  const legacyLatestScore = JSON.parse(localStorage.getItem("wellifyScores") || "null");

  const merged = [
    ...userHistory,
    ...legacyHistory,
    ...userDaily,
    ...legacyDaily,
    ...(userLatestScore ? [userLatestScore] : []),
    ...(legacyLatestScore ? [legacyLatestScore] : []),
  ];

  const unique = [];
  const seen = new Set();

  merged.forEach((entry) => {
    const dayKey = getEntryDateKey(entry) || "unknown-day";
    const signature = `${dayKey}|${entry?.timestamp || ""}|${entry?.overall || ""}|${entry?.mood || ""}`;
    if (!seen.has(signature)) {
      seen.add(signature);
      unique.push(entry);
    }
  });

  return unique;
}
 
function BarRow({ label, pct, color }) {
  const [width, setWidth] = useState(0);
 
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);
 
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="bar-pct" style={{ color }}>{pct}%</span>
    </div>
  );
}
 
function WeeklyChart({ history, currentScore }) {
  const buckets = useMemo(() => {
    const today = new Date();
    const todayDayKey = toDateKey(today);
    const dailyMap = getDailyLatestScoreMap(history);
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const latestTodayEntry = dailyMap.get(todayDayKey);

    const fallbackTodayValue = currentScore ? Math.round(currentScore.overall * 10) : 0;

    return Array.from({ length: 7 }, (_, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);

      const key = toDateKey(dayDate);
      const match = dailyMap.get(key);
      const isToday = key === todayDayKey;

      return {
        dateLabel: dayDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        value: match ? Math.round(match.overall * 10) : (isToday && latestTodayEntry ? Math.round(latestTodayEntry.overall * 10) : (isToday ? fallbackTodayValue : 0)),
        isToday,
      };
    });
  }, [history, currentScore]);

  return (
    <>
      <div className="weekly-chart">
        {buckets.map((bucket, i) => (
          <div key={`${bucket.dateLabel}-${i}`} className="weekly-day">
            <span>{bucket.value}%</span>
            <div
              className="weekly-bar"
              style={{
                height: bucket.value > 0 ? `${Math.max(10, Math.round((bucket.value / 100) * 90))}px` : "8px",
                background: bucket.value > 0 ? "var(--green)" : "var(--green-light)",
                outline: bucket.isToday ? "2px solid var(--amber)" : "none",
                outlineOffset: "2px",
              }}
            />
            <span style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{bucket.dateLabel}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function MonthlyMiniChart({ history }) {
  const days = useMemo(() => {
    const today = new Date();
    const dailyMap = getDailyLatestScoreMap(history);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
    const items = [];

    for (let i = 0; i < 30; i += 1) {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + i);

      const dayKey = toDateKey(dayDate);
      const entry = dailyMap.get(dayKey);

      items.push({
        label: dayDate.getDate(),
        short: dayDate.toLocaleDateString("en-IN", { month: "short" }),
        value: entry ? Math.round(entry.overall * 10) : 0,
        isToday: dayKey === toDateKey(today),
      });
    }

    return items;
  }, [history]);

  return (
    <div className="monthly-mini">
      <div className="monthly-mini-head">
        <span>Last 30 days</span>
        <span className="monthly-mini-note">Daily overall score</span>
      </div>
      <div className="monthly-mini-chart">
        {days.map((day) => (
          <div key={`${day.short}-${day.label}`} className="monthly-mini-day">
            <div className="monthly-mini-bar-wrap">
              <div
                className="monthly-mini-bar"
                style={{
                  height: day.value > 0 ? `${Math.max(5, Math.round((day.value / 100) * 46))}px` : "4px",
                  background: day.value > 0 ? "var(--amber)" : "var(--green-light)",
                  outline: day.isToday ? "2px solid var(--green)" : "none",
                  outlineOffset: "2px",
                }}
              />
            </div>
            <span className="monthly-mini-value">{day.value}%</span>
            <span className="monthly-mini-label">{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
 
function Dashboard({ scores }) {
  const barColors = {
    physical:  "var(--green)",
    mental:    "var(--blue)",
    emotional: "var(--rose)",
    overall:   "var(--amber)",
  };
 
  const history = getMergedHistoryForCurrentUser();
  const currentStreak = getDisplayStreak(history);
  const [showMonthly, setShowMonthly] = useState(false);
  const orgSnapshot = getOrganisationSnapshot();
  const ayurveda = scores?.ayurveda || {
    dominantDosha: "Unknown",
    balanceScore: 0,
    scores: { vata: 0, pitta: 0, kapha: 0 },
    label: "No Ayurveda data",
    summary: "Take an assessment to generate Ayurveda rhythm insights.",
    routine: [],
    note: "",
  };

  const handleDownloadReport = () => {
    const user = getCurrentUser();
    const userName = user?.name || "Wellness User";
    const generatedAt = new Date().toLocaleString("en-IN");

    const lines = [
      "WELLIFY WELLNESS REPORT",
      "=======================",
      `Name: ${userName}`,
      `Generated at: ${generatedAt}`,
      "",
      "Latest Scores",
      "-------------",
      `Physical: ${scores.physical}/10`,
      `Mental: ${scores.mental}/10`,
      `Emotional: ${scores.emotional}/10`,
      `Overall: ${scores.overall}/10`,
      `Mood: ${scores.mood}`,
      "",
      "Ayurveda Insight",
      "----------------",
      `Dominant dosha pattern: ${ayurveda.dominantDosha}`,
      `Balance score: ${ayurveda.balanceScore}/100`,
      `Vata: ${ayurveda.scores.vata} | Pitta: ${ayurveda.scores.pitta} | Kapha: ${ayurveda.scores.kapha}`,
      ayurveda.summary ? `Summary: ${ayurveda.summary}` : "",
      "",
      "Recent History",
      "--------------",
    ];

    if (history.length === 0) {
      lines.push("No history available.");
    } else {
      history.forEach((entry, index) => {
        lines.push(
          `${index + 1}. ${entry.date} | Physical: ${entry.physical} | Mental: ${entry.mental} | Emotional: ${entry.emotional} | Overall: ${entry.overall}`
        );
      });
    }

    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileDate = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `wellify-report-${fileDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
 
  return (
    <>
      <MoodBanner mood={scores.mood} streak={currentStreak} />
 
      {/* Score cards */}
      <div className="score-grid">
        {SCORE_KEYS.map((k) => (
          <div key={k} className={`score-card ${k}`}>
            <div className="label">{k.charAt(0).toUpperCase() + k.slice(1)}</div>
            <div className={`value ${k}`}>{scores[k]}</div>
            <div className="sub">{k === "overall" ? "wellness score" : "out of 10"}</div>
          </div>
        ))}
      </div>
 
      {/* Bar chart */}
      <div className="dash-panel">
        <h3><FiTrendingUp aria-hidden="true" /> Score Breakdown</h3>
        {SCORE_KEYS.map((k) => (
          <BarRow
            key={k}
            label={k.charAt(0).toUpperCase() + k.slice(1)}
            pct={Math.round(scores[k] * 10)}
            color={barColors[k]}
          />
        ))}
      </div>

      <div className="dash-panel ayurveda-panel">
        <h3><FiFeather aria-hidden="true" /> Ayurveda Rhythm Insight</h3>
        <p className="ayurveda-intro">
          {ayurveda.summary}
        </p>
        <div className="ayurveda-meta">
          <div className="ayurveda-pill">Dominant: <strong>{ayurveda.dominantDosha}</strong></div>
          <div className="ayurveda-pill">Balance score: <strong>{ayurveda.balanceScore}/100</strong></div>
        </div>
        <div className="ayurveda-bars">
          {[
            { key: "vata", label: "Vata", color: "var(--blue)" },
            { key: "pitta", label: "Pitta", color: "var(--amber)" },
            { key: "kapha", label: "Kapha", color: "var(--green)" },
          ].map((item) => (
            <BarRow
              key={item.key}
              label={item.label}
              pct={Math.round(ayurveda.scores[item.key] || 0)}
              color={item.color}
            />
          ))}
        </div>
        {Array.isArray(ayurveda.routine) && ayurveda.routine.length > 0 ? (
          <ul className="ayurveda-routine">
            {ayurveda.routine.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        ) : null}
        {ayurveda.note ? <p className="ayurveda-note">{ayurveda.note}</p> : null}
      </div>
 
      {/* Org wellness */}
      <div className="dash-panel">
        <h3><FiBriefcase aria-hidden="true" /> Organisation Wellness Index</h3>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16 }}>
          We provide wellness index insights for institutions like schools, colleges, and corporates using aggregated workforce health trends.
        </p>
        <div className="org-grid">
          <div className={`org-card ${orgSnapshot.teamClass}`}>
            <div className="oc-label">Team Wellness</div>
            <div className="oc-val">{orgSnapshot.teamWellness}%</div>
            <div className="oc-sub">{orgSnapshot.teamStatus} · {orgSnapshot.participants}/{orgSnapshot.totalUsers} users</div>
          </div>
          <div className={`org-card ${orgSnapshot.stressClass}`}>
            <div className="oc-label">Stress Index</div>
            <div className="oc-val">{orgSnapshot.stressLabel}</div>
            <div className="oc-sub">{orgSnapshot.stressSub}</div>
          </div>
          <div className={`org-card ${orgSnapshot.productivityClass}`}>
            <div className="oc-label">Productivity Risk</div>
            <div className="oc-val">{orgSnapshot.productivityLabel}</div>
            <div className="oc-sub">{orgSnapshot.productivitySub}</div>
          </div>
        </div>
      </div>
 
      {/* Weekly chart */}
      <div className="dash-panel">
        <div className="progress-head">
          <h3>Weekly Progress</h3>
        </div>
        <WeeklyChart history={history} currentScore={scores} />
        <div className="progress-actions weekly-actions">
          <button
            className="btn-outline"
            style={{ fontSize: 13, padding: "6px 14px" }}
            onClick={handleDownloadReport}
          >
            Download Report
          </button>
          <button
            type="button"
            className={`month-toggle${showMonthly ? " active" : ""}`}
            onClick={() => setShowMonthly((value) => !value)}
            aria-label="Show monthly progress"
            title="Show monthly progress"
          >
            <FiCalendar aria-hidden="true" />
          </button>
        </div>
        {showMonthly ? <MonthlyMiniChart history={history} /> : null}
      </div>
    </>
  );
}
 
export default Dashboard;
 