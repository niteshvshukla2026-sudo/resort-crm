// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ResortProvider } from "./context/ResortContext";
import App from "./App";
import "./index.css"; // if you have global css

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("No #root element found in index.html");
}

const root = createRoot(rootEl);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <ResortProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ResortProvider>
    </AuthProvider>
  </React.StrictMode>
);
