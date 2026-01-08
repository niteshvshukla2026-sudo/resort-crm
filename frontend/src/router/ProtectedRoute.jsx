import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  // wait till auth restore
  if (loading) return null;

  // 🔥 FINAL FIX: token is the source of truth
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // role check ONLY if user exists
  if (
    allowedRoles &&
    user &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
