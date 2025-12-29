import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 LOAD TOKEN ON APP START
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken) {
      setToken(savedToken);
      axios.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
    }

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  // 🔐 LOGIN (USED BY LOGIN PAGE)
  const login = async (email, password) => {
    const res = await axios.post(
      `${API_BASE}/api/auth/login`,
      { email, password },
      { headers: { "Content-Type": "application/json" } }
    );

    const { token, user } = res.data;

    // 🔥 SINGLE SOURCE OF TRUTH
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    axios.defaults.headers.common.Authorization = `Bearer ${token}`;

    setToken(token);
    setUser(user);

    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common.Authorization;
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
