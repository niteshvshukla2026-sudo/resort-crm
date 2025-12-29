import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.css";
import api from "../../api/axios";   // ✅ IMPORTANT

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      // ✅ TOKEN STORE (MOST IMPORTANT)
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // ✅ redirect
      navigate("/super-admin/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed"
      );
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
        </div>

        <div className="auth-right">
          <h2>Login</h2>

          <form onSubmit={handleSubmit} className="auth-form">
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <div className="auth-error">{error}</div>}

            <button disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
