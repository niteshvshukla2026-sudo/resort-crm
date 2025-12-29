import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/auth.css";

const API_BASE =
  import.meta.env.VITE_API_BASE || "https://resort-crm.onrender.com";

const Login = () => {
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
      if (!email || !password) {
        throw new Error("Email and password required");
      }

      const res = await axios.post(
        `${API_BASE}/api/auth/login`,
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      // 🔥 IMPORTANT: token SAME NAME me store karo
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
      } else {
        throw new Error("Token not received from server");
      }

      navigate("/super-admin/dashboard");
    } catch (err) {
      console.error("LOGIN ERROR ❌", err);
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
