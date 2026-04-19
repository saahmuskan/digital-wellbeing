import { getCurrentUser, getStorageKeyForCurrentUser } from "../utils/auth";

function getGoalMeta(score) {
  if (score >= 7) return { badge: "good", status: "On track" };
  if (score >= 5) return { badge: "mid", status: "In progress" };
  return { badge: "low", status: "Needs work" };
}

function buildGoalsFromScores(latestScore) {
  if (!latestScore) {
    return [
      { label: "Complete your first assessment", badge: "mid", status: "In progress" },
      { label: "Sleep 7+ hours nightly", badge: "mid", status: "In progress" },
      { label: "Drink 8 glasses of water", badge: "mid", status: "In progress" },
      { label: "Exercise 4× per week", badge: "mid", status: "In progress" },
    ];
  }

  const physicalMeta = getGoalMeta(latestScore.physical);
  const mentalMeta = getGoalMeta(latestScore.mental);
  const emotionalMeta = getGoalMeta(latestScore.emotional);
  const overallMeta = getGoalMeta(latestScore.overall);

  return [
    { label: "Sleep 7+ hours nightly", badge: physicalMeta.badge, status: physicalMeta.status },
    { label: "Exercise 4× per week", badge: physicalMeta.badge, status: physicalMeta.status },
    { label: "Stress below 5/10", badge: mentalMeta.badge, status: mentalMeta.status },
    { label: "Mood care and social connection", badge: emotionalMeta.badge, status: emotionalMeta.status },
    { label: "Overall wellness consistency", badge: overallMeta.badge, status: overallMeta.status },
  ];
}
 
function getBadge(overall) {
  if (overall >= 7) return { cls: "good", label: "Healthy" };
  if (overall >= 5) return { cls: "mid",  label: "Moderate" };
  return               { cls: "low",  label: "Low" };
}
 
function ProfilePage() {
  const user = getCurrentUser();
  const name = user?.name || "Wellness User";
  const avatar = name.charAt(0).toUpperCase();

  const saved   = JSON.parse(localStorage.getItem(getStorageKeyForCurrentUser("wellifyHistory")) || "[]");
  const history = saved.slice(0, 7);
  const latestScore = history[0] || null;
  const goals = buildGoalsFromScores(latestScore);
 
  return (
    <div className="profile-wrap">
      <div className="profile-header">
        <div className="avatar">{avatar}</div>
        <div className="profile-info">
          <h2>{name}</h2>
          <p>Member since April 2026 · {history.length} assessments taken</p>
        </div>
      </div>
 
      {/* History table */}
      <div className="dash-panel" style={{ marginBottom: 20 }}>
        <h3>📈 Progress Tracking</h3>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16 }}>
          Your wellness score trend over time.
        </p>
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Physical</th>
              <th>Mental</th>
              <th>Emotional</th>
              <th>Overall</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((r, i) => {
              const b = getBadge(r.overall);
              return (
                <tr key={i}>
                  <td style={{ color: "var(--text-3)", fontSize: 13 }}>{r.date}</td>
                  <td>{r.physical}</td>
                  <td>{r.mental}</td>
                  <td>{r.emotional}</td>
                  <td><strong>{r.overall}</strong></td>
                  <td><span className={`badge ${b.cls}`}>{b.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
 
      {/* Goals */}
      <div className="dash-panel">
        <h3>🎯 Goals</h3>
        <div className="goals-list">
          {goals.map((g) => (
            <div key={g.label} className="goal-row">
              <span>{g.label}</span>
              <span className={`badge ${g.badge}`}>{g.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
 
export default ProfilePage;
 