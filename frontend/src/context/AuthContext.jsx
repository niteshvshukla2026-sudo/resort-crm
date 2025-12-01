import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// VITE_API_BASE should be set in Vercel to your backend base (include /api if you prefer)
// e.g. VITE_API_BASE="https://resort-crm.onrender.com/api"
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// set axios defaults once
if (API_BASE) {
  axios.defaults.baseURL = API_BASE; // now requests should be relative: '/auth/login'
} else {
  // intentionally leave baseURL empty so wrong/missing env becomes obvious
  axios.defaults.baseURL = "";
}
// If your backend uses cookies for auth, keep this true. If you use token in body, it's not necessary.
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

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
   */
  const login = async (emailOrCreds, maybePassword) => {
    // normalize credentials
    let credentials;
    if (typeof emailOrCreds === "string") {
      credentials = { email: emailOrCreds, password: maybePassword };
    } else {
      credentials = emailOrCreds || {};
    }

    try {
      // Use relative path because axios.defaults.baseURL is set to API_BASE
      const res = await axios.post("/auth/login", credentials);

      // If the backend sets cookie-based auth, token might be null and cookie used.
      const data = res?.data || {};
      const newToken = data.token || data.accessToken || null;
      const newUser = data.user || data.data || null;

      setToken(newToken);
      setUser(newUser);
      if (newToken) {
        axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      }
      // persist
      localStorage.setItem("auth", JSON.stringify({ token: newToken, user: newUser }));
      return { success: true, data };
    } catch (err) {
      // Distinguish network / response errors
      console.error("Login failed:", err);
      const resp = err?.response;
      const errorPayload = resp?.data || err.message || "Login error";
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
