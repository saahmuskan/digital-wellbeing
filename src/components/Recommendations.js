import { getRecommendations } from "../utils/scoring";
import { FiCpu } from "react-icons/fi";
 
function Recommendations({ scores }) {
  const tips = getRecommendations(scores);
 
  return (
    <div className="dash-panel">
      <h3><FiCpu aria-hidden="true" /> AI Recommendations</h3>
      <ul className="reco-list">
        {tips.map((t, i) => (
          <li key={i} className="reco-item">
            <span className={`reco-dot ${t.dot}`} />
            <span>{t.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
 
export default Recommendations;
 