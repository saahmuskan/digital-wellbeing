import { FiSun, FiSmile, FiMeh, FiAlertCircle, FiFrown } from "react-icons/fi";

export const MOOD_STYLES = {
  Joyful:  { bg: "#e8f5ee", color: "#1a5c3a", icon: FiSun, msg: "You're feeling joyful today — your emotional health is thriving!" },
  Happy:   { bg: "#e8f5ee", color: "#1a5c3a", icon: FiSmile, msg: "Good mood detected! Keep up the positive energy." },
  Neutral: { bg: "#f7f9f6", color: "#4a5a4e", icon: FiMeh, msg: "Feeling neutral today. Small wins can lift your mood." },
  Anxious: { bg: "#fef3dc", color: "#c47a1a", icon: FiAlertCircle, msg: "Anxiety detected. Try 5 deep breaths right now." },
  Sad:     { bg: "#fdeef3", color: "#c44a6a", icon: FiFrown, msg: "Feeling down? That's okay — reaching out or journaling can help." },
};
 
/* Convenience: returns background colour based on stress level (kept from original) */
export const getMoodColor = (stress) => {
  if (stress > 7) return "#a8dadc";
  if (stress > 4) return "#f1faee";
  return "#ffd166";
};
 
function MoodBanner({ mood }) {
  const style = MOOD_STYLES[mood] || MOOD_STYLES.Neutral;
  const Icon = style.icon;
 
  return (
    <div
      className="mood-banner"
      style={{ background: style.bg, color: style.color }}
    >
      <span className="mood-banner-icon" aria-hidden="true"><Icon /></span>
      <span>{style.msg}</span>
    </div>
  );
}
 
export default MoodBanner;
 