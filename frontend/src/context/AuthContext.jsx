import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
const LOGIN_URL = `${API_BASE}/api/auth/login`;

axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 LOAD TOKEN ON APP START
  useEffect(() => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      const { token, user } = JSON.parse(stored);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  // 🔥 ATTACH TOKEN TO EVERY REQUEST (THIS FIXES 401)
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const stored = localStorage.getItem("auth");
      if (stored) {
        const { token } = JSON.parse(stored);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  // 🔑 LOGIN
  const login = async (email, password) => {
    const res = await axios.post(
      LOGIN_URL,
      { email, password },
      { headers: { "Content-Type": "application/json" } }
    );

    const { token, user } = res.data;

    setToken(token);
    setUser(user);

    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("auth", JSON.stringify({ token, user }));

    return res.data;
  };

  // 🚪 LOGOUT
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth");
    delete axios.defaults.headers.common.Authorization;
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, loading, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
