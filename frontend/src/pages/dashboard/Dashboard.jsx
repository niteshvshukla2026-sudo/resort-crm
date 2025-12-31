import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../utils/permission";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    /* ===============================
       🔥 SUPER ADMIN → FULL DASHBOARD
    =============================== */
    if (
      user.role === "SUPER_ADMIN" ||
      user.role?.name === "SUPER_ADMIN"
    ) {
      navigate("/super-admin/dashboard", { replace: true });
      return;
    }

    /* ===============================
       🔥 NORMAL USERS → COMMON DASHBOARD
       (cards permission-based render honge)
    =============================== */
    const hasAnyReadPermission = [
      "USERS",
      "ROLES",
      "RESORTS",
      "STORES",
      "VENDORS",
      "ITEMS",
      "REQUISTITIONS",
      "PO",
      "GRN",
      "REPORTS",
    ].some((module) =>
      hasPermission(user, module, "READ")
    );

    if (hasAnyReadPermission) {
      navigate("/dashboard", { replace: true });
      return;
    }

    /* ===============================
       ❌ NO ACCESS → LOGIN
    =============================== */
    navigate("/login", { replace: true });
  }, [user, navigate]);

  return null; // intentional redirect-only component
};

export default Dashboard;
