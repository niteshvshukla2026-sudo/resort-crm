import React from "react";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../utils/permission";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h2>Dashboard</h2>

      {hasPermission(user, "requisition", "view") && <div>Requisitions</div>}
      {hasPermission(user, "grn", "view") && <div>GRN</div>}
      {hasPermission(user, "inventory", "view") && <div>Inventory</div>}
      {hasPermission(user, "consumption", "view") && <div>Consumption</div>}
    </div>
  );
};

export default Dashboard;
