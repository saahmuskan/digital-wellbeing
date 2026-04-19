import { useState, useRef, useEffect } from "react";
import { FiMessageCircle, FiFeather, FiX, FiSend } from "react-icons/fi";

const CRISIS_PATTERNS = [
  /\b(suicide|suicidal|kill myself|end my life|want to die|dont want to live|self harm|harm myself|cut myself|overdose|sucide|sucid|die)\b/i,
];

const TOPIC_KEYWORDS = {
  sleep: ["sleep", "tired", "insomnia", "wake up", "night", "bedtime"],
  stress: ["stress", "stressed", "anxious", "anxiety", "worried", "panic", "overthink"],
  nutrition: ["food", "eat", "diet", "nutrition", "meal", "protein", "sugar"],
  mood: ["mood", "sad", "low", "unhappy", "lonely", "emotion", "feel"],
  hydration: ["water", "hydration", "drink", "dehydrated"],
  exercise: ["exercise", "workout", "gym", "walk", "running", "activity"],
};

function normalizeInput(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function detectMood(lower) {
  if (["anxious", "overwhelmed", "stressed", "panic"].some((k) => lower.includes(k))) return "anxious";
  if (["sad", "low", "down", "hopeless"].some((k) => lower.includes(k))) return "low";
  if (["happy", "calm", "good", "great"].some((k) => lower.includes(k))) return "good";
  return null;
}

function parseUserData(text) {
  const lower = normalizeInput(text);

  const sleepMatch = lower.match(/(?:sleep(?:\s*hours?)?\s*(?:is|:)?\s*)(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:h|hours?)\s*sleep/);
  const stressMatch = lower.match(/stress(?:\s*level)?\s*(?:is|:)?\s*(\d{1,2})(?:\s*\/\s*10)?/);
  const exerciseMatch = lower.match(/exercise(?:\s*frequency)?\s*(?:is|:)?\s*(\d{1,2})\s*(?:days?|times?)|(?:exercise|workout|walk)\s*(\d{1,2})\s*(?:days?|times?)/);
  const waterLMatch = lower.match(/water(?:\s*intake)?\s*(?:is|:)?\s*(\d+(?:\.\d+)?)\s*(?:l|liter|liters)/);
  const waterMlMatch = lower.match(/water(?:\s*intake)?\s*(?:is|:)?\s*(\d{2,4})\s*ml/);
  const moodWordMatch = lower.match(/mood\s*(?:is|:)?\s*(low|sad|good|happy|calm|anxious|stressed|okay|ok)/);

  return {
    sleepHours: sleepMatch ? Number(sleepMatch[1] || sleepMatch[2]) : null,
    stressLevel: stressMatch ? Number(stressMatch[1]) : null,
    exerciseDays: exerciseMatch ? Number(exerciseMatch[1] || exerciseMatch[2]) : null,
    waterLiters: waterLMatch ? Number(waterLMatch[1]) : waterMlMatch ? Number(waterMlMatch[1]) / 1000 : null,
    mood: moodWordMatch ? moodWordMatch[1] : detectMood(lower),
  };
}

function mergeUserData(existing, incoming) {
  return {
    sleepHours: incoming.sleepHours ?? existing.sleepHours,
    stressLevel: incoming.stressLevel ?? existing.stressLevel,
    exerciseDays: incoming.exerciseDays ?? existing.exerciseDays,
    waterLiters: incoming.waterLiters ?? existing.waterLiters,
    mood: incoming.mood ?? existing.mood,
  };
}

function hasUserData(data) {
  return Object.values(data).some((value) => value !== null && value !== undefined);
}

function detectTopic(lower) {
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((key) => lower.includes(key))) {
      return topic;
    }
  }
  return null;
}

function formatReply(insight, recommendation, quickTip) {
  return [insight, recommendation, quickTip].join("\n");
}

function getCrisisReply() {
  return formatReply(
    "You sound emotionally unsafe right now, and this needs immediate support.",
    "Call your local emergency number now, and contact one trusted person to stay with you. If you're in India, call Tele-MANAS: 14416.",
    "Put both feet on the floor, breathe out slowly for 6 seconds, and repeat 5 times while help is on the way."
  );
}

function isCrisisMessage(lower) {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(lower));
}

function isGuidanceRequest(lower) {
  return lower.includes("guide me") || lower.includes("help me") || lower.includes("what should i do") || lower.includes("plan for me");
}

function getBotReply(text, userData) {
  const lower = normalizeInput(text);

  if (isCrisisMessage(lower)) {
    return getCrisisReply();
  }

  const topic = detectTopic(lower);
  const dataAvailable = hasUserData(userData);

  if ((isGuidanceRequest(lower) || !topic) && !dataAvailable) {
    return formatReply(
      "I can help, but I need your quick wellness snapshot to personalize this.",
      "Share in one line: sleep hours, stress (1-10), mood, water today, and exercise this week.",
      "Example: sleep 6h, stress 8/10, mood low, water 1.2L, exercise 1 day."
    );
  }

  if (topic === "stress" || lower === "im stressed" || lower === "i am stressed" || lower === "i'm stressed") {
    const stressLine = userData.stressLevel ? `Your stress looks high at ${userData.stressLevel}/10 right now.` : "Your mind seems overloaded right now.";
    return formatReply(
      stressLine,
      "Do a 2-minute reset: inhale 4s, exhale 6s for 10 rounds, then take a 3-minute walk away from your screen.",
      "Name one worry on paper, then write one next small action under it."
    );
  }

  if (topic === "sleep") {
    const sleepInsight = userData.sleepHours
      ? userData.sleepHours < 7
        ? `You slept ${userData.sleepHours}h, which may be driving your low energy.`
        : `Your sleep is ${userData.sleepHours}h, so consistency can now improve quality.`
      : "Your sleep pattern may be affecting your daytime energy.";
    return formatReply(
      sleepInsight,
      "Set a fixed bedtime tonight and stop screens 45 minutes before bed; if awake at night, do slow breathing instead of scrolling.",
      "Have caffeine only before 2 PM to protect deep sleep."
    );
  }

  if (topic === "nutrition") {
    return formatReply(
      "Your nutrition choices today can directly affect mood and focus.",
      "Build your next meal with protein + fiber (for example: dal + salad or eggs + vegetables), and avoid sugary snacks for the next 4 hours.",
      "Add one fruit or handful of nuts to prevent energy crashes."
    );
  }

  if (topic === "hydration") {
    const hydrationInsight = userData.waterLiters
      ? `You are at about ${userData.waterLiters.toFixed(1)}L today, so hydration may still need a push.`
      : "Low hydration may be worsening tiredness or headaches.";
    return formatReply(
      hydrationInsight,
      "Drink one glass now and one before each main meal today to steadily raise intake.",
      "Keep a bottle visible at your desk to trigger sipping every hour."
    );
  }

  if (topic === "mood") {
    const moodInsight = userData.mood
      ? `Your mood seems ${userData.mood}, and small body-based actions can shift it quickly.`
      : "Your emotional state sounds heavy right now.";
    return formatReply(
      moodInsight,
      "Take 10 minutes outside with light movement, then text one trusted person a simple check-in message.",
      "Use the 3-word check: name your feeling in three words to reduce emotional overload."
    );
  }

  if (topic === "exercise") {
    const exerciseInsight = userData.exerciseDays !== null && userData.exerciseDays !== undefined
      ? `You reported ${userData.exerciseDays} active day(s), so a small consistency boost will help.`
      : "Your movement routine may need a simple restart.";
    return formatReply(
      exerciseInsight,
      "Do a 12-minute brisk walk today and schedule two 20-minute sessions on your calendar this week.",
      "Attach exercise to a trigger: walk right after lunch or after work."
    );
  }

  if (dataAvailable) {
    const parts = [];
    if (userData.sleepHours) parts.push(`sleep ${userData.sleepHours}h`);
    if (userData.stressLevel) parts.push(`stress ${userData.stressLevel}/10`);
    if (userData.waterLiters) parts.push(`water ${userData.waterLiters.toFixed(1)}L`);

    return formatReply(
      `From your check-in (${parts.join(", ") || "shared data"}), your routine can be optimized with one focused reset today.`,
      "Choose one priority now: improve sleep timing tonight or reduce stress with a 5-minute breathing + walk break.",
      "Keep the same wake-up time tomorrow even if sleep was not perfect."
    );
  }

  if (isGuidanceRequest(lower)) {
    return formatReply(
      "I can guide you better once I know your main wellness focus.",
      "Tell me one area: sleep, stress, nutrition, or mood, and I will give a short personalized plan.",
      "Start with: 'I'm stressed' or 'I slept 5 hours and feel tired'."
    );
  }

  return formatReply(
    "I can support your wellness, but I need a bit more context to personalize.",
    "Share your sleep hours, stress score (1-10), mood, water intake, and exercise days this week.",
    "The more specific your check-in, the better your plan."
  );
}

function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [userData, setUserData] = useState({
    sleepHours: null,
    stressLevel: null,
    exerciseDays: null,
    waterLiters: null,
    mood: null,
  });
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hello! I'm your Wellify assistant. Share your sleep, stress, mood, water, and exercise for personalized wellness guidance.",
    },
  ]);
  const msgsEndRef = useRef(null);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;

    const extractedData = parseUserData(text);
    const mergedData = mergeUserData(userData, extractedData);

    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    setUserData(mergedData);

    setTimeout(() => {
      setMessages((prev) => [...prev, { from: "bot", text: getBotReply(text, mergedData) }]);
    }, 600);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") send();
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen((v) => !v)} aria-label="Open chat">
        <FiMessageCircle aria-hidden="true" />
      </button>

      {open && (
        <div className="chat-window">
          <div className="chat-head">
            <div className="ch-avatar" aria-hidden="true"><FiFeather /></div>
            <div>
              <h4>Wellify Assistant</h4>
              <p>Your AI wellness companion</p>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat"><FiX aria-hidden="true" /></button>
          </div>

          <div className="chat-msgs">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.from}`}>{m.text}</div>
            ))}
            <div ref={msgsEndRef} />
          </div>

          <div className="chat-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your check-in or question..."
            />
            <button className="chat-send" onClick={send} aria-label="Send message"><FiSend aria-hidden="true" /></button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;
