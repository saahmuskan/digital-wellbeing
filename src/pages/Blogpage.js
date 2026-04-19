import { FiMoon, FiWind, FiCoffee, FiActivity, FiDroplet, FiEdit3 } from "react-icons/fi";

const POSTS = [
  {
    thumb: FiMoon, bg: "#e8f5ee",
    tagBg: "var(--green-light)", tagColor: "var(--green)", tag: "Sleep Science",
    title: "Why 7–9 Hours of Sleep Changes Everything",
    desc: "Research shows deep sleep stages repair the body, consolidate memory and regulate stress hormones.",
  },
  {
    thumb: FiWind, bg: "#fef3dc",
    tagBg: "var(--amber-light)", tagColor: "var(--amber)", tag: "Mental Health",
    title: "5-Minute Mindfulness Practices That Actually Work",
    desc: "Simple evidence-based techniques to reduce anxiety and improve focus throughout your workday.",
  },
  {
    thumb: FiCoffee, bg: "#e8f0fb",
    tagBg: "var(--blue-light)", tagColor: "var(--blue)", tag: "Nutrition",
    title: "Foods That Boost Your Mental Clarity",
    desc: "The gut-brain connection is real. Learn which foods fuel your mind and which ones drain it.",
  },
  {
    thumb: FiActivity, bg: "#fdeef3",
    tagBg: "var(--rose-light)", tagColor: "var(--rose)", tag: "Fitness",
    title: "The Minimum Effective Dose of Exercise",
    desc: "How just 20 minutes of movement per day can dramatically improve your physical wellness score.",
  },
  {
    thumb: FiDroplet, bg: "#e8f5ee",
    tagBg: "var(--green-light)", tagColor: "var(--green)", tag: "Hydration",
    title: "Dehydration and Your Mood: The Hidden Link",
    desc: "Even mild dehydration affects concentration, mood and physical performance in measurable ways.",
  },
  {
    thumb: FiEdit3, bg: "#fef3dc",
    tagBg: "var(--amber-light)", tagColor: "var(--amber)", tag: "Emotional",
    title: "Journaling for Emotional Wellbeing",
    desc: "Writing 5 minutes daily about your emotions can reduce stress and increase self-awareness significantly.",
  },
];
 
function BlogPage() {
  return (
    <div className="blog-wrap">
      <h2>Knowledge Hub</h2>
      <p>Science-backed articles to support your wellness journey.</p>
      <div className="blog-grid">
        {POSTS.map((post) => (
          <div key={post.title} className="blog-card">
            <div className="blog-thumb" style={{ background: post.bg }} aria-hidden="true"><post.thumb /></div>
            <div className="bc-body">
              <div className="bc-tag" style={{ background: post.tagBg, color: post.tagColor }}>
                {post.tag}
              </div>
              <h3>{post.title}</h3>
              <p>{post.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
 
export default BlogPage;