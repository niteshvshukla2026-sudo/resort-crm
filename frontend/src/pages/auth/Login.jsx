import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/auth.css";
import { useAuth } from "../../context/AuthContext.jsx";

const API_BASE =
  (import.meta.env.VITE_API_BASE || "http://localhost:5000") + "/api";

const Login = () => {
  const { login: ctxLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // debug log to ensure values are present
      console.log("login payload:", { email, password });

      if (!email || !password) throw new Error("Email and password required");

      // Send JSON to backend (this guarantees Request Payload is JSON with both fields)
      const res = await axios.post(
        `${API_BASE}/api/auth/login`, // ensure your backend route matches this (or change to /auth/login)
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true, // required if backend sets cookie
        }
      );

      // If your backend returns a JWT in body
      if (res.data?.token) {
        localStorage.setItem("authToken", res.data.token);
      }

      // If you use a context login function, call it to update app state
      if (typeof ctxLogin === "function") {
        try {
          await ctxLogin(email, password);
        } catch (innerErr) {
          // context login may not be necessary if we've already stored token
          console.warn("context login failed (non-fatal)", innerErr);
        }
      }

      navigate("/super-admin/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Login failed");
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
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@resort.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
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
