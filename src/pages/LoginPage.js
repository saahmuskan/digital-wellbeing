import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STRONG_PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const NAME_RULE = /^[A-Za-z][A-Za-z\s.'-]{1,39}$/;

function LoginPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isCreateMode = mode === "create";

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password.trim() || (isCreateMode && !form.name.trim())) {
      setError("Please enter both email and password.");
      return;
    }

    if (isCreateMode) {
      if (!NAME_RULE.test(form.name.trim())) {
        setError("Enter a valid user name (2-40 letters, spaces allowed).");
        return;
      }

      if (!STRONG_PASSWORD_RULE.test(form.password.trim())) {
        setError("Password must be 8+ characters with uppercase, lowercase, number, and symbol.");
        return;
      }
    }

    try {
      if (isCreateMode) {
        signup({ name: form.name.trim(), email: form.email, password: form.password });
        setMode("login");
        setForm((prev) => ({ ...prev, password: "" }));
        setSuccess("Account created successfully. Please login with your credentials.");
      } else {
        login({ email: form.email, password: form.password });
        navigate("/", { replace: true });
      }
    } catch (err) {
      if (err.message === "INVALID_EMAIL_DOMAIN") {
        setError("Only @gmail.com email addresses are allowed.");
        return;
      }
      if (err.message === "INVALID_CREDENTIALS") {
        setError("Incorrect password for this email.");
        return;
      }
      if (err.message === "USER_EXISTS") {
        setError("Account already exists. Please login instead.");
        return;
      }
      setError("Unable to sign in. Please try again.");
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>{isCreateMode ? "Create Your Account" : "Welcome to Wellify"}</h2>
        <p>
          {isCreateMode
            ? "Create a secure account using user name, email and strong password."
            : "Use your email and password to access your personalised wellness dashboard."}
        </p>

        <div className="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            className={`auth-mode-btn${!isCreateMode ? " active" : ""}`}
            onClick={() => switchMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-mode-btn${isCreateMode ? " active" : ""}`}
            onClick={() => switchMode("create")}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isCreateMode ? (
            <div className="field">
              <label>User name</label>
              <input
                name="name"
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          ) : null}

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

          {isCreateMode ? (
            <p className="auth-hint">
              Use at least 8 characters including uppercase, lowercase, number, and symbol.
            </p>
          ) : null}

          {error ? <div className="auth-error">{error}</div> : null}
          {success ? <div className="auth-info">{success}</div> : null}

          <button type="submit" className="submit-btn">
            {isCreateMode ? "Create Account" : "Login and Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
