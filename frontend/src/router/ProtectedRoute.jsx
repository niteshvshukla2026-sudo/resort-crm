import React from "react";
import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = ({ children }) => {
  const { loading } = useAuth();

  // wait for auth restore
  if (loading) return null;

  // 🔥 FINAL FIX:
  // NEVER redirect to login automatically
  // Login will happen ONLY manually

  return children;
};

export default ProtectedRoute;
