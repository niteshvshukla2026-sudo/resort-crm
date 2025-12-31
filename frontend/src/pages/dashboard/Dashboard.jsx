import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // SUPER ADMIN
    if (
      user.role === "SUPER_ADMIN" ||
      user.role?.key === "SUPER_ADMIN"
    ) {
      navigate("/super-admin/dashboard", { replace: true });
      return;
    }

    // ANY ROLE WITH DASHBOARD READ
    const hasDashboard = user.permissions?.some(
      (p) =>
        p.module === "DASHBOARD" &&
        p.actions.includes("READ")
    );

    if (hasDashboard) {
      navigate("/resort", { replace: true });
      return;
    }

    // fallback
    navigate("/login", { replace: true });
  }, [user, navigate]);

  return null;
};

export default Dashboard;
