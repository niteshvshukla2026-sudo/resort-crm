import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optionally set Authorization header from localStorage auth token if present
try {
  const stored = localStorage.getItem("auth");
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.token) {
      api.defaults.headers.common.Authorization = `Bearer ${parsed.token}`;
    }
  }
} catch (e) {
  // ignore
}
// 🔥 RESPONSE INTERCEPTOR (LOGOUT PROTECTION)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "";

    // ❌ logout ONLY when token really invalid
    if (status === 401) {
      if (
        message.includes("Invalid token") ||
        message.includes("Token expired") ||
        message.includes("Unauthorized")
      ) {
        localStorage.removeItem("auth");
        window.location.href = "/login";
      }
    }

    // ⚠️ IMPORTANT: do NOT auto logout on other errors
    return Promise.reject(error);
  }
);

export default api;
