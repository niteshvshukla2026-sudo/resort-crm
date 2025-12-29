import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.css";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // 🔥 IMPORTANT

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error("Email and password required");
      }

      // ✅ ONLY ONE LOGIN CALL (AuthContext handles token)
      const result = await login(email, password);

      if (!result?.success) {
        throw new Error(result?.error || "Login failed");
      }

      navigate("/super-admin/dashboard");
    } catch (err) {
      console.error("LOGIN ERROR ❌", err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
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
                placeholder="admin@example.com"
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
                required
              />
            </label>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
