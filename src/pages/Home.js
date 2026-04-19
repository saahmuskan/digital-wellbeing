import { useNavigate } from "react-router-dom";
 
const FEATURES = [
  { icon: "📊", title: "Smart Scoring",        desc: "Get precise physical, mental and emotional wellness scores based on your daily habits." },
  { icon: "🤖", title: "AI Recommendations",   desc: "Receive personalised tips and actionable steps tailored to your unique score profile." },
  { icon: "📅", title: "Book Consultations",    desc: "Schedule one-on-one wellness sessions with certified coaches at your convenience." },
  { icon: "🏢", title: "Organisation Wellness", desc: "Measure and improve team wellbeing with our company wellness index and workforce insights." },
  { icon: "📚", title: "Knowledge Hub",         desc: "Access curated articles on mental health, nutrition, sleep science and holistic lifestyle." },
  { icon: "💬", title: "AI Assistant",          desc: "Chat anytime with our wellness assistant for instant advice, tips and emotional support." },
];
 
const TRUST = [
  { num: "12K+", label: "Users tracked" },
  { num: "94%",  label: "Report improvement" },
  { num: "3",    label: "Wellness dimensions" },
  { num: "AI",   label: "Powered insights" },
];
 
function Home() {
  const navigate = useNavigate();
 
  return (
    <>
      <div className="hero">
        <h1>Your path to<br /><em>holistic wellness</em></h1>
        <p>Understand your physical, mental and emotional health with intelligent insights that actually guide you forward.</p>
        <div className="hero-ctas">
          <button className="btn-primary lg" onClick={() => navigate("/assessment")}>
            Take Free Assessment
          </button>
          <button className="btn-outline lg" onClick={() => navigate("/blog")}>
            Explore Resources
          </button>
        </div>
        <div className="trust-row">
          {TRUST.map((t) => (
            <div key={t.label} className="trust-item">
              <div className="trust-num">{t.num}</div>
              <div className="trust-label">{t.label}</div>
            </div>
          ))}
        </div>
      </div>
 
      <div className="features-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </>
  );
}
 
export default Home;
 