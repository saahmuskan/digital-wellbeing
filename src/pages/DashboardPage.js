import { useNavigate } from "react-router-dom";
import { FiBarChart2 } from "react-icons/fi";
import Dashboard from "../components/Dashboard";
import Recommendations from "../components/Recommendations";
import { getStorageKeyForCurrentUser } from "../utils/auth";
 
function DashboardPage() {
  const navigate = useNavigate();
  const scores = JSON.parse(localStorage.getItem(getStorageKeyForCurrentUser("wellifyScores")));
 
  const dateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
 
  if (!scores) {
    return (
      <div className="dash-wrap">
        <div className="empty-state">
          <div className="es-icon" aria-hidden="true"><FiBarChart2 /></div>
          <h3>No assessment data yet</h3>
          <p>Complete your wellness assessment to see your personalised dashboard.</p>
          <button className="btn-primary" onClick={() => navigate("/assessment")}>
            Take Assessment Now
          </button>
        </div>
      </div>
    );
  }
 
  return (
    <div className="dash-wrap">
      <div className="dash-header">
        <div>
          <h2>Your Wellness Dashboard</h2>
          <p style={{ color: "var(--text-3)", fontSize: 14 }}>Last updated: {dateStr}</p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/assessment")}>
          Retake Assessment
        </button>
      </div>
 
      <Dashboard scores={scores} />
      <Recommendations scores={scores} />
    </div>
  );
}
 
export default DashboardPage;
 