import { useEffect, useMemo, useState } from "react";
import MoodBanner from "./MoodUI";
import { getAllUsers, getCurrentUser, getStorageKeyForCurrentUser, getStorageKeyForUser } from "../utils/auth";
 
const SCORE_KEYS = ["physical", "mental", "emotional", "overall"];

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
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const todayKey = today.toDateString();
    const todayDateLabel = today.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    const latestTodayEntry = [...history]
      .reverse()
      .find((entry) => {
        const entryDate = entry.timestamp ? new Date(entry.timestamp) : null;
        if (entryDate && !Number.isNaN(entryDate.getTime()) && entryDate.toDateString() === todayKey) {
          return true;
        }
        return entry.date === todayDateLabel;
      });

    const fallbackTodayValue = currentScore ? Math.round(currentScore.overall * 10) : 0;

    return Array.from({ length: 7 }, (_, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);

      const key = dayDate.toDateString();
      const match = [...history]
        .reverse()
        .find((entry) => {
          const entryDate = entry.timestamp ? new Date(entry.timestamp) : null;
          return entryDate && !Number.isNaN(entryDate.getTime()) && entryDate.toDateString() === key;
        });

      return {
        dateLabel: dayDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        value: match ? Math.round(match.overall * 10) : (dayDate.toDateString() === todayKey && latestTodayEntry ? Math.round(latestTodayEntry.overall * 10) : (dayDate.toDateString() === todayKey ? fallbackTodayValue : 0)),
        isToday: dayDate.toDateString() === today.toDateString(),
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
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
    const items = [];

    for (let i = 0; i < 30; i += 1) {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + i);

      const dayKey = dayDate.toDateString();
      const entry = [...history]
        .reverse()
        .find((item) => {
          const entryDate = item.timestamp ? new Date(item.timestamp) : null;
          return entryDate && !Number.isNaN(entryDate.getTime()) && entryDate.toDateString() === dayKey;
        });

      items.push({
        label: dayDate.getDate(),
        short: dayDate.toLocaleDateString("en-IN", { month: "short" }),
        value: entry ? Math.round(entry.overall * 10) : 0,
        isToday: dayDate.toDateString() === today.toDateString(),
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
 
  const historyKey = getStorageKeyForCurrentUser("wellifyHistory");
  const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
  const [showMonthly, setShowMonthly] = useState(false);
  const orgSnapshot = getOrganisationSnapshot();

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
      <MoodBanner mood={scores.mood} />
 
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
        <h3>📈 Score Breakdown</h3>
        {SCORE_KEYS.map((k) => (
          <BarRow
            key={k}
            label={k.charAt(0).toUpperCase() + k.slice(1)}
            pct={Math.round(scores[k] * 10)}
            color={barColors[k]}
          />
        ))}
      </div>
 
      {/* Org wellness */}
      <div className="dash-panel">
        <h3>🏢 Organisation Wellness Index</h3>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16 }}>
          Based on aggregated team wellness data — shows workforce health trends.
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
              📆
            </button>
          </div>
        </div>
        <WeeklyChart history={history} currentScore={scores} />
        {showMonthly ? <MonthlyMiniChart history={history} /> : null}
      </div>
    </>
  );
}
 
export default Dashboard;
 