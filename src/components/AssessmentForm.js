import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMoon, FiCpu, FiHeart, FiSun, FiSmile, FiMeh, FiAlertCircle, FiFrown } from "react-icons/fi";
import { calculateScore } from "../utils/scoring";
import { getCurrentUser, getStorageKeyForCurrentUser } from "../utils/auth";
 
const MOODS = [
  { key: "Joyful", Icon: FiSun },
  { key: "Happy", Icon: FiSmile },
  { key: "Neutral", Icon: FiMeh },
  { key: "Anxious", Icon: FiAlertCircle },
  { key: "Sad", Icon: FiFrown },
];

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getUpdatedStreak(previous, assessedAt) {
  const todayKey = toDateKey(assessedAt);
  const yesterday = new Date(assessedAt);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday);

  const prevCurrent = Number(previous?.current);
  const safePrevCurrent = Number.isFinite(prevCurrent) && prevCurrent > 0 ? prevCurrent : 0;

  let current = 1;
  if (previous?.lastDate === todayKey) {
    current = Math.max(1, safePrevCurrent);
  } else if (previous?.lastDate === yesterdayKey) {
    current = safePrevCurrent + 1;
  }

  const prevBest = Number(previous?.best);
  const safePrevBest = Number.isFinite(prevBest) && prevBest > 0 ? prevBest : 0;

  return {
    current,
    best: Math.max(current, safePrevBest),
    lastDate: todayKey,
    updatedAt: assessedAt.toISOString(),
  };
}
 
function AssessmentForm() {
  const navigate = useNavigate();
 
  const [form, setForm] = useState({
    sleep: "", water: "", exercise: "", meals: "",
    stress: 5, focus: "", social: "",
    mood: "Neutral", energy: 5,
  });
 
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
 
  const selectMood = (key) => setForm((prev) => ({ ...prev, mood: key }));
 
  /* progress */
  const fields = ["sleep", "water", "exercise", "meals", "focus", "social"];
  const filled = fields.filter((k) => form[k] !== "").length;
  const moodBonus = form.mood !== "Neutral" ? 1 : 0;
  const progress = Math.round(((filled + moodBonus) / (fields.length + 1)) * 100);
 
  const handleSubmit = () => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const scores = calculateScore(form);
    const assessedAt = new Date();
    const scoredEntry = {
      ...scores,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      timestamp: assessedAt.toISOString(),
      weekday: assessedAt.toLocaleDateString("en-IN", { weekday: "short" }),
    };

    localStorage.setItem(
      getStorageKeyForCurrentUser("wellifyScores"),
      JSON.stringify(scoredEntry)
    );
 
    const historyKey = getStorageKeyForCurrentUser("wellifyHistory");
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
    history.unshift(scoredEntry);
    localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 180)));

    const dailyKey = getStorageKeyForCurrentUser("wellifyDailyScores");
    const daily = JSON.parse(localStorage.getItem(dailyKey) || "{}");
    daily[toDateKey(assessedAt)] = scoredEntry;
    localStorage.setItem(dailyKey, JSON.stringify(daily));

    const streakKey = getStorageKeyForCurrentUser("wellifyStreak");
    const previousStreak = JSON.parse(localStorage.getItem(streakKey) || "null");
    const nextStreak = getUpdatedStreak(previousStreak, assessedAt);
    localStorage.setItem(streakKey, JSON.stringify(nextStreak));
 
    navigate("/dashboard");
  };
 
  return (
    <div className="assess-wrap">
      <h2>Wellness Assessment</h2>
      <p>Answer a few questions to get your personalised wellness score.</p>
 
      <div className="progress-bar-wrap">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>
 
      {/* Physical */}
      <div className="form-section">
        <h3><FiMoon aria-hidden="true" /> Physical Health</h3>
        <div className="form-row">
          <div className="field">
            <label>Sleep hours per night</label>
            <input name="sleep" type="number" min="1" max="12" placeholder="e.g. 7"
              value={form.sleep} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Glasses of water per day</label>
            <input name="water" type="number" min="1" max="20" placeholder="e.g. 8"
              value={form.water} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Exercise days per week</label>
            <input name="exercise" type="number" min="0" max="7" placeholder="e.g. 3"
              value={form.exercise} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Meals per day</label>
            <input name="meals" type="number" min="1" max="6" placeholder="e.g. 3"
              value={form.meals} onChange={handleChange} />
          </div>
        </div>
      </div>
 
      {/* Mental */}
      <div className="form-section">
        <h3><FiCpu aria-hidden="true" /> Mental Health</h3>
        <div className="field">
          <label>
            Stress level today&nbsp;
            <span style={{ color: "var(--green)", fontWeight: 500 }}>{form.stress}</span>/10
          </label>
          <div className="slider-wrap">
            <input type="range" name="stress" min="1" max="10"
              value={form.stress} onChange={handleChange} />
            <div className="slider-labels"><span>Low</span><span>Moderate</span><span>Very High</span></div>
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Focus / concentration</label>
            <select name="focus" value={form.focus} onChange={handleChange}>
              <option value="">Select…</option>
              <option value="high">Excellent</option>
              <option value="mid">Average</option>
              <option value="low">Poor</option>
            </select>
          </div>
          <div className="field">
            <label>Social interactions</label>
            <select name="social" value={form.social} onChange={handleChange}>
              <option value="">Select…</option>
              <option value="high">Very active</option>
              <option value="mid">Moderate</option>
              <option value="low">Isolated</option>
            </select>
          </div>
        </div>
      </div>
 
      {/* Emotional */}
      <div className="form-section">
        <h3><FiHeart aria-hidden="true" /> Emotional Health</h3>
        <div className="field">
          <label>How are you feeling today?</label>
          <div className="mood-grid">
            {MOODS.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`mood-btn${form.mood === m.key ? " selected" : ""}`}
                onClick={() => selectMood(m.key)}
              >
                <m.Icon aria-hidden="true" className="mood-btn-icon" />
                <span>{m.key}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>
            Energy level&nbsp;
            <span style={{ color: "var(--green)", fontWeight: 500 }}>{form.energy}</span>/10
          </label>
          <div className="slider-wrap">
            <input type="range" name="energy" min="1" max="10"
              value={form.energy} onChange={handleChange} />
            <div className="slider-labels"><span>Exhausted</span><span>OK</span><span>Energised</span></div>
          </div>
        </div>
      </div>
 
      <button className="submit-btn" onClick={handleSubmit}>
        Calculate My Wellness Score →
      </button>
    </div>
  );
}
 
export default AssessmentForm;
 