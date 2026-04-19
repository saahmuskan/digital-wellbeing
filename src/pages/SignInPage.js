import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function SignInPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
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
      signup({ email: form.email, password: form.password });
      navigate("/login", { replace: true });
    } catch (err) {
      if (err.message === "INVALID_EMAIL_DOMAIN") {
        setError("Only @gmail.com email addresses are allowed.");
        return;
      }
      if (err.message === "USER_EXISTS") {
        setError("Account already exists. Please login instead.");
        return;
      }
      setError("Unable to create account. Please try again.");
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>Create Your Account</h2>
        <p>Sign in with your email and password to start your wellness journey.</p>

        <form onSubmit={handleSubmit}>
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
              placeholder="Create password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {error ? <div className="auth-error">{error}</div> : null}

          <button type="submit" className="submit-btn">Create Account and Continue</button>
          <button type="button" className="auth-signin-minimal" onClick={() => navigate("/login")}>Back to Login</button>
        </form>
      </div>
    </div>
  );
}

export default SignInPage;
