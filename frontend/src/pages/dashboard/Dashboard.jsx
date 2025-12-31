import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../utils/permission";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // ✅ SUPER ADMIN (broad access)
    if (
      hasPermission(user, "dashboard", "view") ||
      hasPermission(user, "requisition", "view")
    ) {
      navigate("/super-admin/dashboard", { replace: true });
      return;
    }

    // ✅ RESORT USER
    if (
      hasPermission(user, "requisition", "create") ||
      hasPermission(user, "grn", "create")
    ) {
      navigate("/resort", { replace: true });
      return;
    }

    // ✅ FINAL FALLBACK (VERY IMPORTANT)
    navigate("/login", { replace: true });
  }, [user, navigate]);

  return null; // intentional
};

export default Dashboard;
