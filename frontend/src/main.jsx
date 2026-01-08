import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ResortProvider } from "./context/ResortContext.jsx";
import axios from "axios"; // ✅ ADD THIS

/* ===============================
   🔐 GLOBAL AXIOS TOKEN FIX
   =============================== */
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ResortProvider>
          <App />
        </ResortProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
