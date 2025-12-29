import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";

const AuthContext = createContext(null);

// ===============================
// 🌍 API BASE
// ===============================
const API_BASE_RAW = import.meta.env.VITE_API_BASE ?? "";
const API_BASE = API_BASE_RAW.replace(/\/+$/, "");

// build correct login URL
const LOGIN_URL = API_BASE.endsWith("/api")
  ? `${API_BASE}/auth/login`
  : `${API_BASE}/api/auth/login`;

// allow cookies if backend ever uses them
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===============================
  // 🔐 LOAD AUTH FROM STORAGE
  // ===============================
  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth");
      if (stored) {
        const parsed = JSON.parse(stored);

        setUser(parsed.user || null);
        setToken(parsed.token || null);

        if (parsed.token) {
          axios.defaults.headers.common.Authorization =
            `Bearer ${parsed.token}`;
        }
      }
    } catch (err) {
      console.error("Auth parse error:", err);
      localStorage.removeItem("auth");
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // 🔥 REQUEST INTERCEPTOR — TOKEN ALWAYS ATTACHED
  // ===================================================
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use(
      (config) => {
        const stored = localStorage.getItem("auth");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.token) {
            config.headers.Authorization = `Bearer ${parsed.token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
    };
  }, []);

  // ===================================================
  // 🚨 RESPONSE INTERCEPTOR (NO AUTO LOGOUT)
  // ===================================================
  useEffect(() => {
    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.status === 401) {
          console.warn("401 received (ignored, no auto logout)");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  // ===============================
  // 🔑 LOGIN (ONLY PLACE)
  // ===============================
  const login = async (email, password) => {
    try {
      const res = await axios.post(
        LOGIN_URL,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = res.data || {};
      const newToken = data.token || null;
      const newUser = data.user || null;

      setToken(newToken);
      setUser(newUser);

      if (newToken) {
        axios.defaults.headers.common.Authorization =
          `Bearer ${newToken}`;
      }

      localStorage.setItem(
        "auth",
        JSON.stringify({ token: newToken, user: newUser })
      );

      return { success: true, data };
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err.message ||
        "Login failed";

      console.error("Login error:", message);

      return { success: false, error: message };
    }
  };

  // ===============================
  // 🚪 LOGOUT (MANUAL ONLY)
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
