import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export const AuthProvider = ({ children }) => {
  // set axios base URL for all requests
  axios.defaults.baseURL = API_BASE;

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

  const login = async (credentials) => {
    // credentials: { email, password } or { username, password }
    try {
      let res;
      try {
        res = await axios.post(`${API_BASE}/api/auth/login`, credentials);
  } catch (err) {
    console.error("API call failed:", err);
  }

      const data = res.data;
      // expected response: { token: "...", user: { ... } }
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
      console.error("Login failed:", err?.response?.data || err.message || err);
      return { success: false, error: err?.response?.data || err.message || err };
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
