import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";

const AuthContext = createContext(null);

/* ======================================================
   🌍 API BASE (supports with/without /api)
====================================================== */
const API_BASE_RAW = import.meta.env.VITE_API_BASE ?? "";
const API_BASE = API_BASE_RAW.replace(/\/+$/, "");

function buildLoginUrl() {
  return API_BASE.endsWith("/api")
    ? `${API_BASE}/auth/login`
    : `${API_BASE}/api/auth/login`;
}

// allow cookies if needed
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ======================================================
     🔐 RESTORE AUTH FROM LOCAL STORAGE (RELOAD SAFE)
  ===================================================== */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth");
      if (stored) {
        const parsed = JSON.parse(stored);

        if (parsed?.token) {
          setToken(parsed.token);
          axios.defaults.headers.common.Authorization =
            `Bearer ${parsed.token}`;
        }

        if (parsed?.user) {
          setUser(parsed.user);
        }
      }
    } catch (err) {
      console.error("Auth storage parse error:", err);
      localStorage.removeItem("auth");
    } finally {
      setLoading(false); // 🔥 MUST for ProtectedRoute
    }
  }, []);

  /* ======================================================
     🚨 AXIOS RESPONSE INTERCEPTOR
     ❌ NEVER AUTO LOGOUT
  ===================================================== */
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;

        if (status === 401) {
          // ❗ Do NOT logout automatically
          console.warn(
            "[Auth] 401 received – ignored to prevent forced logout"
          );
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  /* ======================================================
     🔑 LOGIN
  ===================================================== */
  const login = async (a, b) => {
    const credentials =
      typeof a === "string"
        ? { email: a, password: b }
        : a || {};

    try {
      const res = await axios.post(buildLoginUrl(), credentials, {
        headers: { "Content-Type": "application/json" },
      });

      const data = res?.data || {};
      const newToken = data.token || data.accessToken || null;
      const newUser = data.user || data.data || null;

      if (!newToken || !newUser) {
        throw new Error("Invalid login response");
      }

      setToken(newToken);
      setUser(newUser);

      axios.defaults.headers.common.Authorization =
        `Bearer ${newToken}`;

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

      console.error("[Auth] Login error:", message);

      return { success: false, status, error: message };
    }
  };

  /* ======================================================
     🚪 LOGOUT (MANUAL ONLY)
  ===================================================== */
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

/* ======================================================
   🪝 HOOK
====================================================== */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};

export default AuthContext;
