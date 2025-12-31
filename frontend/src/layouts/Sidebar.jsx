import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../utils/permission";

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <aside style={{ width: 240, background: "#111827", color: "#fff" }}>
      <h3 style={{ padding: 16 }}>CRM</h3>

      <nav>
        {hasPermission(user, "dashboard", "view") && (
          <NavLink to="/dashboard">Dashboard</NavLink>
        )}

        {hasPermission(user, "requisition", "view") && (
          <NavLink to="/requisitions">Requisitions</NavLink>
        )}

        {hasPermission(user, "po", "view") && (
          <NavLink to="/po">Purchase Orders</NavLink>
        )}

        {hasPermission(user, "grn", "view") && (
          <NavLink to="/grn">GRN</NavLink>
        )}

        {hasPermission(user, "consumption", "view") && (
          <NavLink to="/consumption">Consumption</NavLink>
        )}

        {hasPermission(user, "inventory", "view") && (
          <NavLink to="/inventory">Inventory</NavLink>
        )}

        {hasPermission(user, "users", "view") && (
          <NavLink to="/users">Users</NavLink>
        )}

        {hasPermission(user, "roles", "view") && (
          <NavLink to="/roles">Roles</NavLink>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
