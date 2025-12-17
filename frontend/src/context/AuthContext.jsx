// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// VITE_API_BASE from env (may or may not include /api)
const API_BASE_RAW = import.meta.env.VITE_API_BASE ?? "";

// Create a normalized base (no trailing slash)
const API_BASE = API_BASE_RAW.replace(/\/+$/, "");

// Helper: build correct login URL ensuring exactly one /api prefix
function buildLoginUrl() {
  if (API_BASE.endsWith("/api")) {
    return `${API_BASE}/auth/login`;
  }
  return `${API_BASE}/api/auth/login`;
}

axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // 🔐 Load auth from storage
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

  // 🔥 ADD THIS: axios response interceptor (MOST IMPORTANT FIX)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;

        // ❌ Logout ONLY if token is invalid/expired
        if (status === 401) {
          console.warn("401 detected → logging out");
          logout();
        }

        // ❗ DO NOT logout on 400 / 404 / 500
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  /**
   * login supports:
   *  - login(email, password)
   *  - login({ email, password })
   */
  const login = async (a, b) => {
    let credentials;
    if (typeof a === "string") {
      credentials = { email: a, password: b };
    } else {
      credentials = a || {};
    }

    const url = buildLoginUrl();
    try {
      const res = await axios.post(url, credentials, {
        headers: { "Content-Type": "application/json" },
      });

      const data = res?.data || {};
      const newToken = data.token || data.accessToken || null;
      const newUser = data.user || data.data || null;

      setToken(newToken);
      setUser(newUser);

      if (newToken) {
        axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      }

      localStorage.setItem(
        "auth",
        JSON.stringify({ token: newToken, user: newUser })
      );

      return { success: true, data };
    } catch (err) {
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
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
