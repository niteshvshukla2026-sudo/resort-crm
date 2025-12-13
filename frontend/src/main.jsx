import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ResortProvider } from "./context/ResortContext.jsx"; // 👈 ADD THIS

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ResortProvider> {/* 👈 ADD THIS */}
          <App />
        </ResortProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
