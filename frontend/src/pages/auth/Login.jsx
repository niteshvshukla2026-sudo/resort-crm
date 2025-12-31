import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.css";
import { useAuth } from "../../context/AuthContext.jsx";

const Login = () => {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* =================================================
     🔥 AUTO REDIRECT AFTER LOGIN (SINGLE SOURCE)
  ================================================= */
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password required");
      return;
    }

    setSubmitting(true);

    try {
      const res = await login(email, password);

      if (!res.success) {
        throw new Error(res.error || "Login failed");
      }

      // ❌ YAHAN navigate NAHI karna
      // redirect useEffect karega (safe)

    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-left">
          <h1>Resort Purchase CRM</h1>
          <p>Centralised purchase & inventory control for all your resorts.</p>
          <ul>
            <li>Multi-resort requisition & PO tracking</li>
            <li>Real-time stock & consumption visibility</li>
            <li>Configurable approval workflow</li>
          </ul>
        </div>

        <div className="auth-right">
          <h2>Login</h2>
          <p className="auth-sub">Sign in as Super Admin or Resort User</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@resort.com"
                autoComplete="username"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </label>

            {error && <div className="auth-error">{error}</div>}

            <button
              type="submit"
              className="auth-button"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
