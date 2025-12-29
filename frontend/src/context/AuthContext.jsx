import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../api/axios"; // ✅ frontend/src/api/axios.js

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==================================================
  // 🔁 APP LOAD → RESTORE SESSION
  // ==================================================
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (savedToken) setToken(savedToken);
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (err) {
      console.error("Auth restore error", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================================================
  // 🔐 LOGIN
  // ==================================================
  const login = async (email, password) => {
    const res = await api.post("/auth/login", {
      email,
      password,
    });

    const { token, user } = res.data;

    // save to localStorage
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setToken(token);
    setUser(user);

    return res.data;
  };

  // ==================================================
  // 🔓 LOGOUT
  // ==================================================
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  // ==================================================
  // 🔄 REFRESH USER (optional but useful)
  // ==================================================
  const refreshUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      return res.data;
    } catch (err) {
      logout();
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ==================================================
// 🔥 HOOK
// ==================================================
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
