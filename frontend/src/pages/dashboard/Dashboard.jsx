import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../utils/permission";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;        // ⏳ wait for auth hydrate
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    /* ===============================
       🟢 SUPER ADMIN → FULL PANEL
    =============================== */
    if (
      user.role === "SUPER_ADMIN" ||
      user.role?.key === "SUPER_ADMIN"
    ) {
      navigate("/super-admin/dashboard", { replace: true });
      return;
    }

    /* ===============================
       🔥 CUSTOM ROLES (AUTO ROUTING)
       Rule:
       - If can CREATE / READ Requisition → Resort Panel
       - If can CREATE / APPROVE PO / GRN → Resort Panel
    =============================== */

    const canUseResortPanel =
      hasPermission(user, "REQUISITIONS", "CREATE") ||
      hasPermission(user, "REQUISITIONS", "READ") ||
      hasPermission(user, "PO", "CREATE") ||
      hasPermission(user, "PO", "APPROVE") ||
      hasPermission(user, "GRN", "CREATE") ||
      hasPermission(user, "GRN", "APPROVE");

    if (canUseResortPanel) {
      navigate("/resort", { replace: true });
      return;
    }

    /* ===============================
       ❌ NO VALID PERMISSION
    =============================== */
    console.warn("No dashboard permission for user:", user);
    navigate("/login", { replace: true });

  }, [user, loading, navigate]);

  return null; // intentional redirect-only component
};

export default Dashboard;
