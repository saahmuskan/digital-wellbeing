import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      login({ name: form.name, email: form.email, password: form.password });
      navigate("/", { replace: true });
    } catch (err) {
      if (err.message === "INVALID_EMAIL_DOMAIN") {
        setError("Only @gmail.com email addresses are allowed.");
        return;
      }
      if (err.message === "INVALID_CREDENTIALS") {
        setError("Incorrect password for this email.");
        return;
      }
      setError("Unable to sign in. Please try again.");
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>Welcome to Wellify</h2>
        <p>Use your email and password to keep your weekly wellness data personal.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Name (optional)</label>
            <input
              name="name"
              type="text"
              placeholder="e.g. Muskan"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {error ? <div className="auth-error">{error}</div> : null}

          <button type="submit" className="submit-btn">
            Login and Continue
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
