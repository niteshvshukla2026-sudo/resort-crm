import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";

const AuthContext = createContext(null);

// ===============================
// API BASE
// ===============================
const API_BASE_RAW = import.meta.env.VITE_API_BASE ?? "";
const API_BASE = API_BASE_RAW.replace(/\/+$/, "");

function buildLoginUrl() {
  if (API_BASE.endsWith("/api")) {
    return `${API_BASE}/auth/login`;
  }
  return `${API_BASE}/api/auth/login`;
}

axios.defaults.withCredentials = true;

/* =====================================================
 🔥 USER NORMALIZER (ROLE + PERMISSIONS SAFE)
===================================================== */
function normalizeUser(rawUser) {
  if (!rawUser) return null;

  let roleObj = rawUser.role;

  if (typeof roleObj === "string") {
    roleObj = {
      key: roleObj,
      name: roleObj,
      permissions: [],
    };
  }

  if (typeof roleObj === "object" && !Array.isArray(roleObj.permissions)) {
    roleObj.permissions = [];
  }

  return {
    ...rawUser,
    role: roleObj,
    permissions: roleObj.permissions || [],
  };
}

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

        const safeUser = normalizeUser(parsed.user);
        const storedToken = parsed.token || null;

        setUser(safeUser);
        setToken(storedToken);

        if (storedToken) {
          axios.defaults.headers.common.Authorization =
            `Bearer ${storedToken}`;
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
  // 🚨 AXIOS INTERCEPTOR (NO AUTO LOGOUT)
  // ===================================================
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.status === 401) {
          console.warn(
            "401 received – ignored (no auto logout)"
          );
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // ===============================
  // 🔑 LOGIN (UNIVERSAL RESPONSE HANDLER)
  // ===============================
  const login = async (a, b) => {
    const credentials =
      typeof a === "string" ? { email: a, password: b } : a || {};

    try {
      const res = await axios.post(
        buildLoginUrl(),
        credentials,
        { headers: { "Content-Type": "application/json" } }
      );

      const raw = res?.data || {};

      // 🔥 UNIVERSAL TOKEN PICKER
      const newToken =
        raw.token ||
        raw.accessToken ||
        raw?.data?.token ||
        raw?.data?.accessToken ||
        null;

      // 🔥 UNIVERSAL USER PICKER
      const newUserRaw =
        raw.user ||
        raw?.data?.user ||
        (raw?.data && !raw?.data?.token ? raw.data : null) ||
        null;

      if (!newToken || !newUserRaw) {
        throw new Error("Invalid login response from server");
      }

      const newUser = normalizeUser(newUserRaw);

      setToken(newToken);
      setUser(newUser);

      axios.defaults.headers.common.Authorization =
        `Bearer ${newToken}`;

      localStorage.setItem(
        "auth",
        JSON.stringify({ token: newToken, user: newUser })
      );

      return { success: true };
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
  // 🚪 LOGOUT
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

        // 🔥 DIRECT ACCESS
        permissions: user?.permissions || [],
        role: user?.role || null,
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
