import { useNavigate } from "react-router-dom";
import { FiBarChart2, FiCpu, FiCalendar, FiBriefcase, FiBookOpen, FiMessageCircle, FiFeather, FiZap, FiTarget, FiShield } from "react-icons/fi";
 
const FEATURES = [
  { icon: FiBarChart2, title: "Smart Scoring", desc: "Get precise physical, mental and emotional wellness scores based on your daily habits." },
  { icon: FiCpu, title: "AI Recommendations", desc: "Receive personalised tips and actionable steps tailored to your unique score profile." },
  { icon: FiCalendar, title: "Book Consultations", desc: "Schedule one-on-one wellness sessions with certified coaches at your convenience." },
  { icon: FiBriefcase, title: "Organisation Wellness", desc: "Measure and improve wellbeing with a wellness index for institutions like schools, colleges, and corporates." },
  { icon: FiBookOpen, title: "Knowledge Hub", desc: "Access curated articles on mental health, nutrition, sleep science and holistic lifestyle." },
  { icon: FiMessageCircle, title: "AI Assistant", desc: "Chat anytime with our wellness assistant for instant advice, tips and emotional support." },
];

const APPROACH = [
  { icon: FiCpu, title: "AI Analysis", desc: "Data-backed evaluation across physical, mental, and emotional dimensions." },
  { icon: FiFeather, title: "Ayurveda Balance", desc: "Your assessment is converted into a Vata, Pitta, Kapha rhythm signal to guide practical daily habits." },
  { icon: FiZap, title: "Energy Diagnostics", desc: "Lifestyle and fatigue signals are interpreted to identify practical improvement points." },
  { icon: FiTarget, title: "Personalized Guidance", desc: "Each user receives guidance tuned to score trends, behavior patterns, and goals." },
];

const HOW_IT_WORKS = [
  "Take your daily wellness assessment",
  "Get your wellness score and insight summary",
  "Book a consultation if deeper support is needed",
  "Follow guidance and track improvement over time",
];

const TRUST_POINTS = ["Science-based", "Non-invasive", "Personalized", "Data-driven"];
 
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
            Open Reminders
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
            <div className="feature-icon" aria-hidden="true"><f.icon /></div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      <section className="home-section">
        <div className="section-head">
          <h2>Our Approach</h2>
          <p>A wellness-company methodology combining modern analytics and holistic practice.</p>
        </div>
        <div className="approach-grid">
          {APPROACH.map((item) => (
            <article key={item.title} className="approach-card">
              <div className="feature-icon" aria-hidden="true"><item.icon /></div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section how-wrap">
        <div className="section-head">
          <h2>How It Works</h2>
          <p>Simple flow from assessment to measurable wellness progress.</p>
        </div>
        <div className="how-grid">
          {HOW_IT_WORKS.map((step, index) => (
            <div key={step} className="how-card">
              <span>{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section trust-wrap">
        <div className="section-head">
          <h2>Why Trust Wellify</h2>
          <p>Assessments are conducted physically using scientific, non-invasive methods.</p>
        </div>
        <div className="trust-pillars">
          {TRUST_POINTS.map((point) => (
            <div key={point} className="trust-pillar"><FiShield aria-hidden="true" /> {point}</div>
          ))}
        </div>
        <p className="science-line">
          The platform integrates AI-driven analysis with Ayurveda rhythm mapping. Your daily responses are interpreted into Vata, Pitta, and Kapha pattern signals and then used to generate non-invasive lifestyle guidance for individual and organizational wellness.
        </p>
      </section>
    </>
  );
}
 
export default Home;







