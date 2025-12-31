import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../styles/superAdmin.css";
import { useAuth } from "../context/AuthContext.jsx";
import ResortSwitcher from "../components/ResortSwitcher";

/* ================= MENU ================= */
const menuItems = [
  { label: "Dashboard", icon: "ri-dashboard-line", path: "/super-admin/dashboard" },

  { type: "section", label: "Masters" },
  { label: "Resorts", icon: "ri-building-4-line", path: "/super-admin/resorts" },
  { label: "Departments", icon: "ri-team-line", path: "/super-admin/departments" },
  { label: "Items Category", icon: "ri-archive-2-line", path: "/super-admin/item-categories" },
  { label: "Items", icon: "ri-archive-2-line", path: "/super-admin/items" },
  { label: "Stores", icon: "ri-store-2-line", path: "/super-admin/stores" },
  { label: "Vendors", icon: "ri-truck-line", path: "/super-admin/vendors" },
  { label: "Recipes", icon: "ri-book-2-line", path: "/super-admin/recipes" },
  { label: "Users", icon: "ri-user-settings-line", path: "/super-admin/users" },
  { label: "Roles", icon: "ri-user-star-line", path: "/super-admin/roles" },

  { type: "section", label: "Purchase" },
  { label: "Requisitions", icon: "ri-file-list-2-line", path: "/super-admin/requisitions" },
  { label: "Purchase Orders", icon: "ri-file-paper-line", path: "/super-admin/po" },
  { label: "GRN", icon: "ri-archive-stack-line", path: "/super-admin/grn" },
  { label: "Consumption", icon: "ri-goblet-line", path: "/super-admin/consumption" },
  { label: "Store Replacement", icon: "ri-exchange-box-line", path: "/super-admin/store-replacement" },

  { type: "section", label: "Inventory & Reports" },
  { label: "Inventory", icon: "ri-archive-line", path: "/super-admin/inventory" },
  { label: "Reports", icon: "ri-bar-chart-2-line", path: "/super-admin/reports" },
];

const SuperAdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* ================= SAFE ROLE NAME ================= */
  const roleName =
    typeof user?.role === "string"
      ? user.role
      : user?.role?.name || "SUPER_ADMIN";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="sa-app-shell">
      {/* ===== SIDEBAR ===== */}
      <aside className="sa-sidebar">
        <div className="sa-logo-block">
          <div className="sa-logo-circle">R</div>
          <div>
            <h1 className="sa-app-title">Resort Purchase</h1>
            <p className="sa-app-subtitle">Super Admin</p>
          </div>
        </div>

        <nav className="sa-nav">
          {menuItems.map((item, idx) =>
            item.type === "section" ? (
              <div key={`section-${idx}`} className="sa-nav-section">
                {item.label}
              </div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  "sa-nav-item" + (isActive ? " sa-nav-item-active" : "")
                }
              >
                <i className={`sa-nav-icon ${item.icon}`} />
                <span>{item.label}</span>
              </NavLink>
            )
          )}
        </nav>

        <div className="sa-sidebar-footer">
          <div className="sa-mini-badge">v1.0</div>
          <span>All resorts overview</span>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="sa-main">
        {/* ===== TOP BAR ===== */}
        <header className="sa-topbar">
          <div className="sa-topbar-left">
            <ResortSwitcher />
            <div className="sa-topbar-divider" />
            <div className="sa-breadcrumb">Super Admin / Panel</div>
          </div>

          <div className="sa-topbar-right">
            <div className="sa-search-box">
              <i className="ri-search-line" />
              <input placeholder="Search requisition, PO, vendor..." />
            </div>

            <button
              className="sa-icon-button"
              onClick={handleLogout}
              title="Logout"
            >
              <i className="ri-logout-circle-r-line" />
            </button>

            <div className="sa-user-pill">
              <div className="sa-avatar-circle">
                {(user?.name || "SA").charAt(0)}
              </div>
              <div className="sa-user-info">
                <span className="sa-user-name">
                  {user?.name || "Super Admin"}
                </span>
                <span className="sa-user-role">{roleName}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ===== PAGE CONTENT (VERY IMPORTANT) ===== */}
        <main className="sa-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
