// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// VITE_API_BASE should be set in Vercel to your backend base.
// Example (recommended): VITE_API_BASE="https://resort-crm.onrender.com/api"
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// Configure axios defaults once
axios.defaults.baseURL = API_BASE; // use relative paths in calls (e.g. "/auth/login")
axios.defaults.withCredentials = true; // keep if backend uses cookies; ok for token too

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Load stored auth on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed.user || null);
        setToken(parsed.token || null);
        if (parsed.token) {
          axios.defaults.headers.common.Authorization = `Bearer ${parsed.token}`;
        }
      }
    } catch (err) {
      console.error("Failed to parse stored auth:", err);
      localStorage.removeItem("auth");
    }
  }, []);

  /**
   * login supports two signatures:
   *  - login(email, password)
   *  - login({ email, password })
   *
   * IMPORTANT: axios.defaults.baseURL should include /api if you use "/auth/login" below.
   * Example: VITE_API_BASE = "https://resort-crm.onrender.com/api"
   */
  const login = async (a, b) => {
    // normalize credentials
    let credentials;
    if (typeof a === "string") {
      credentials = { email: a, password: b };
    } else {
      credentials = a || {};
    }

    try {
      // Use relative path because baseURL already points to API base (including /api)
     const res = await axios.post("/auth/login", credentials);


      const data = res?.data || {};
      const newToken = data.token || data.accessToken || null;
      const newUser = data.user || data.data || null;

      setToken(newToken);
      setUser(newUser);

      if (newToken) {
        axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      }

      localStorage.setItem("auth", JSON.stringify({ token: newToken, user: newUser }));

      return { success: true, data };
    } catch (err) {
      // Provide structured error info
      const resp = err?.response;
      const errorPayload = resp?.data || err.message || "Login error";
      console.error("Login failed:", errorPayload);
      return { success: false, error: errorPayload, status: resp?.status };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth");
    delete axios.defaults.headers.common.Authorization;
    // If your backend has a logout endpoint that clears cookies, call it here (optional)
    // axios.post('/auth/logout').catch(()=>{});
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
