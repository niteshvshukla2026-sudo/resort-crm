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

export default api;
