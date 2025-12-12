import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ResortProvider } from "./context/ResortContext";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ResortProvider>
      <App />
    </ResortProvider>
  </React.StrictMode>
);
