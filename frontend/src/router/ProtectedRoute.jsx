import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../utils/permission";

const ProtectedRoute = ({ module, action, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  /* ===============================
     ⏳ WAIT FOR AUTH TO LOAD
  =============================== */
  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  /* ===============================
     🔒 NOT LOGGED IN
  =============================== */
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  /* ===============================
     🟢 SUPER ADMIN → FULL ACCESS
  =============================== */
  if (
    user?.role === "SUPER_ADMIN" ||
    user?.role?.key === "SUPER_ADMIN"
  ) {
    return children;
  }

  /* ===============================
     🔐 PERMISSION CHECK (OPTIONAL)
  =============================== */
  if (module && action) {
    const allowed = hasPermission(user, module, action);

    if (!allowed) {
      console.warn(
        `Permission denied → ${module}:${action}`,
        user
      );

      // 🔥 SAFE FALLBACK (NO LOOP)
      return <Navigate to="/dashboard" replace />;
    }
  }

  /* ===============================
     ✅ ALLOWED
  =============================== */
  return children;
};

export default ProtectedRoute;
