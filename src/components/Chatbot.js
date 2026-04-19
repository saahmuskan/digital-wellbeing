import { useState, useRef, useEffect } from "react";
import { FiMessageCircle, FiFeather, FiX, FiSend } from "react-icons/fi";
 
const CRISIS_PATTERNS = [
  /\b(suicide|suicidal|kill myself|end my life|want to die|dont want to live|self harm|harm myself|cut myself|overdose|sucide|sucid|die)\b/i,
];

const INTENT_RESPONSES = [
  {
    keys: ["weight", "fat", "obese", "bmi", "belly", "gain weight", "lose weight", "manage weight", "control this", "control weight"],
    reply: "You can manage weight safely with 3 basics: 1) eat smaller portions of sugary snacks and fried foods, 2) build each meal around protein + vegetables, 3) walk 30 minutes daily and sleep 7-9 hours. If you want, I can make you a simple 7-day weight control plan.",
  },
  {
    keys: ["sleep", "tired", "insomnia", "wake up", "night"],
    reply: "For better sleep, keep a fixed bedtime, avoid screens 60 mins before bed, and reduce caffeine after 2 PM. Most adults need 7-9 hours. If you want, I can also give you a night routine checklist.",
  },
  {
    keys: ["stress", "anxious", "anxiety", "worried", "panic", "overthink"],
    reply: "When stress spikes, try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s for 4 rounds. Then do one small grounding action (water, short walk, or journaling). If you want, I can walk you through a 2-minute calm-down plan.",
  },
  {
    keys: ["sad", "depress", "low", "unhappy", "lonely", "hopeless"],
    reply: "I'm sorry you're feeling this way. Try one gentle step right now: text someone you trust, step outside for 10 minutes, or write what you're feeling. If this persists, talking to a counselor can really help.",
  },
  {
    keys: ["water", "hydrat", "drink"],
    reply: "Aim for about 2 liters/day (adjust for heat and activity). Easy plan: one glass after waking, one before each meal, and one mid-evening. If you want, I can make a hydration schedule for your day.",
  },
  {
    keys: ["exercise", "workout", "gym", "fit", "walk", "running"],
    reply: "Start simple: 30 minutes brisk walking 5 days/week + 2 strength sessions. Consistency beats intensity at the beginning. If you want, I can build a beginner workout plan for fat loss or fitness.",
  },
  {
    keys: ["eat", "food", "diet", "nutrition", "protein", "weight"],
    reply: "Try the plate method: 1/2 veggies, 1/4 protein, 1/4 whole grains. Keep meal timing consistent and include protein in breakfast for better energy. If you want, I can turn this into a simple meal plan.",
  },
  {
    keys: ["mood", "feeling", "emotion", "motivation"],
    reply: "Mood improves with sleep, movement, sunlight, and connection. Pick one 10-minute action now (walk, music, or calling a friend) and notice the shift.",
  },
  {
    keys: ["meditat", "mindful", "breathing"],
    reply: "Quick reset: sit comfortably, inhale for 4, exhale for 6 for 2 minutes. Focus on the exhale to calm your nervous system.",
  },
  {
    keys: ["score", "wellness", "result", "dashboard", "assessment"],
    reply: "Your latest wellness scores are in Dashboard (Physical, Mental, Emotional, Overall). Retake Assessment anytime to track progress.",
  },
  {
    keys: ["book", "appointment", "consult", "doctor", "therapist"],
    reply: "Go to the Book tab to schedule with a wellness coach, therapist, or nutritionist. Pick an available date and time, then confirm.",
  },
  {
    keys: ["hello", "hi", "hey", "helo", "namaste"],
    reply: "Hi! I can help with sleep, stress, anxiety, food, fitness, weight control, mood, and booking consultations. Tell me your goal and I’ll guide you step by step.",
  },
];

const DEFAULT_REPLY = "I can help with sleep, stress, anxiety, mood, food, fitness, weight control, hydration, and consultation booking. Try asking: 'give me a weight loss plan', 'help me sleep better', or 'guide me for stress'.";

function normalizeInput(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function getCrisisReply() {
  return [
    "I'm really glad you shared this. You matter, and you deserve support right now.",
    "If you might act on these thoughts, please call your local emergency number immediately.",
    "If you're in India, you can call Tele-MANAS at 14416 or 1-800-891-4416 (24x7).",
    "Please also contact a trusted person near you right now and tell them you're not feeling safe.",
    "If you want, I can stay with you and guide one small grounding step right now.",
  ].join(" ");
}

function isCrisisMessage(lower) {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(lower));
}

function isGuidanceRequest(lower) {
  return lower.includes("guide me") || lower.includes("help me") || lower.includes("what should i do") || lower.includes("plan for me");
}

function getBotReply(text) {
  const lower = normalizeInput(text);

  if (isCrisisMessage(lower)) {
    return getCrisisReply();
  }

  if (isGuidanceRequest(lower) && !INTENT_RESPONSES.some((intent) => intent.keys.some((key) => lower.includes(key)))) {
    return "I can guide you better if you tell me the area: weight control, sleep, stress, fitness, diet, mood, or hydration. For example: 'guide me for weight loss' or 'help me with sleep'.";
  }

  for (const intent of INTENT_RESPONSES) {
    if (intent.keys.some((key) => lower.includes(key))) {
      return intent.reply;
    }
  }

  return DEFAULT_REPLY;
}
 
function Chatbot() {
  const [open, setOpen]     = useState(false);
  const [input, setInput]   = useState("");
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hello! I'm your Wellify assistant. Ask me anything about sleep, stress, nutrition, or your wellness journey." },
  ]);
  const msgsEndRef = useRef(null);
 
  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
 
  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: "bot", text: getBotReply(text) }]);
    }, 600);
  };
 
  const handleKey = (e) => { if (e.key === "Enter") send(); };
 
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
              placeholder="Ask me anything…"
            />
            <button className="chat-send" onClick={send} aria-label="Send message"><FiSend aria-hidden="true" /></button>
          </div>
        </div>
      )}
    </>
  );
}
 
export default Chatbot;
 