import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";

const AuthContext = createContext(null);

// VITE_API_BASE (can be with or without /api)
const API_BASE_RAW = import.meta.env.VITE_API_BASE ?? "";
const API_BASE = API_BASE_RAW.replace(/\/+$/, "");

// Ensure correct login URL
function buildLoginUrl() {
  if (API_BASE.endsWith("/api")) {
    return `${API_BASE}/auth/login`;
  }
  return `${API_BASE}/api/auth/login`;
}

// allow cookies if needed
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===============================
  // 🔐 LOAD AUTH FROM LOCAL STORAGE
  // ===============================
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
      console.error("Auth storage parse error:", err);
      localStorage.removeItem("auth");
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // 🚨 AXIOS INTERCEPTOR (NO AUTO LOGOUT – VERY IMPORTANT)
  // ===================================================
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;

        // ❌ NEVER AUTO LOGOUT
        if (status === 401) {
          console.warn(
            "401 received (ignored) – user will NOT be logged out automatically"
          );
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // ===============================
  // 🔑 LOGIN
  // ===============================
  const login = async (a, b) => {
    let credentials;

    if (typeof a === "string") {
      credentials = { email: a, password: b };
    } else {
      credentials = a || {};
    }

    try {
      const res = await axios.post(buildLoginUrl(), credentials, {
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
      const status = err?.response?.status;
      const message =
        err?.response?.data?.message ||
        err.message ||
        "Login failed";

      console.error("Login error:", message);

      return { success: false, status, error: message };
    }
  };

  // ===============================
  // 🚪 LOGOUT (ONLY MANUAL)
  // ===============================
  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("auth");
    delete axios.defaults.headers.common.Authorization;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ===============================
// 🪝 HOOK
// ===============================
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
