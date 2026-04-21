import { FiSun, FiSmile, FiMeh, FiAlertCircle, FiFrown, FiZap } from "react-icons/fi";

export const MOOD_STYLES = {
  Joyful: {
    bg: "linear-gradient(135deg, #e8f8ee 0%, #f4fbf6 100%)",
    border: "rgba(26, 92, 58, 0.25)",
    color: "#1a5c3a",
    icon: FiSun,
    title: "Mood: Joyful 😄",
    msg: "Amazing energy today. Keep spreading that positive momentum.",
  },
  Happy: {
    bg: "linear-gradient(135deg, #e7f7ea 0%, #f2fbf4 100%)",
    border: "rgba(26, 92, 58, 0.25)",
    color: "#1a5c3a",
    icon: FiSmile,
    title: "Mood: Happy 😊",
    msg: "You're doing great! Keep it up.",
  },
  Neutral: {
    bg: "linear-gradient(135deg, #f5f7f4 0%, #fbfcfb 100%)",
    border: "rgba(74, 90, 78, 0.2)",
    color: "#4a5a4e",
    icon: FiMeh,
    title: "Mood: Neutral 😐",
    msg: "Steady day. A short walk or mindful break can lift your mood.",
  },
  Anxious: {
    bg: "linear-gradient(135deg, #fff4de 0%, #fff9ee 100%)",
    border: "rgba(196, 122, 26, 0.25)",
    color: "#9a6217",
    icon: FiAlertCircle,
    title: "Mood: Anxious 😰",
    msg: "Pause for a minute: slow breathing can calm your nervous system.",
  },
  Sad: {
    bg: "linear-gradient(135deg, #fdeef3 0%, #fff5f8 100%)",
    border: "rgba(196, 74, 106, 0.25)",
    color: "#a63c5b",
    icon: FiFrown,
    title: "Mood: Sad 😔",
    msg: "Be kind to yourself today. One small self-care action is enough.",
  },
};
 
/* Convenience: returns background colour based on stress level (kept from original) */
export const getMoodColor = (stress) => {
  if (stress > 7) return "#a8dadc";
  if (stress > 4) return "#f1faee";
  return "#ffd166";
};
 
function MoodBanner({ mood, streak = 0 }) {
  const style = MOOD_STYLES[mood] || MOOD_STYLES.Neutral;
  const Icon = style.icon;
 
  return (
    <div
      className="mood-banner"
      style={{
        background: style.bg,
        color: style.color,
        borderColor: style.border,
      }}
    >
      <span className="mood-banner-icon" aria-hidden="true"><Icon /></span>
      <div className="mood-banner-content">
        <strong>{style.title}</strong>
        <span>{style.msg}</span>
      </div>
      <div className="mood-banner-streak" aria-label={`Current streak ${streak} days`}>
        <FiZap aria-hidden="true" />
        <span>{streak} day streak</span>
      </div>
    </div>
  );
}
 
export default MoodBanner;
 