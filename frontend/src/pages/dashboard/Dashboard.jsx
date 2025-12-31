import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../utils/permission";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // 🔥 SUPER ADMIN FLOW
    if (hasPermission(user, "requisition", "view")) {
      navigate("/super-admin/dashboard", { replace: true });
      return;
    }

    // 🔥 RESORT USER FLOW
    if (hasPermission(user, "requisition", "create")) {
      navigate("/resort", { replace: true });
      return;
    }
  }, [user, navigate]);

  return null; // ⛔ kuch render hi nahi karega
};

export default Dashboard;
