import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const permissions = user.permissions || [];

    // ❌ No access at all
    if (permissions.length === 0) {
      navigate("/login", { replace: true });
      return;
    }

    // ✅ SUPER ADMIN (always full panel)
    if (user.role?.key === "SUPER_ADMIN" || user.role === "SUPER_ADMIN") {
      navigate("/super-admin/dashboard", { replace: true });
      return;
    }

    // 🔥 ANY OTHER ROLE (AUTO)
    // If user has ANY READ permission → resort panel
    const hasReadAccess = permissions.some(p =>
      p.actions.includes("READ")
    );

    if (hasReadAccess) {
      navigate("/resort", { replace: true });
      return;
    }

    // fallback
    navigate("/login", { replace: true });
  }, [user, navigate]);

  return null;
};

export default Dashboard;
