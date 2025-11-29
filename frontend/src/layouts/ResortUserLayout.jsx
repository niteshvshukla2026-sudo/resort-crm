import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../styles/superAdmin.css";
import { useAuth } from "../context/AuthContext.jsx";

const menuItems = [
  { label: "Dashboard", icon: "ri-dashboard-line", path: "/resort" },
  { type: "section", label: "Purchase" },
  { label: "Create Requisition", icon: "ri-file-list-3-line", path: "/resort/requisitions/create" },
  { label: "My Requisitions", icon: "ri-list-unordered", path: "/resort/requisitions" },
  { label: "POs", icon: "ri-file-paper-2-line", path: "/resort/po" },
  { label: "GRN", icon: "ri-truck-line", path: "/resort/grn" },
  { label: "Reports", icon: "ri-bar-chart-line", path: "/resort/reports" },
];

const ResortUserLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="sa-app-shell">
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
              <div key={idx} className="sa-nav-section">
                {item.label}
              </div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
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

      <div className="sa-main">
        <header className="sa-topbar">
          <div className="sa-topbar-left">
            <select className="sa-resort-switcher">
              <option>All Resorts</option>
            </select>
            <div className="sa-topbar-divider" />
            <div className="sa-breadcrumb">Super Admin / Panel</div>
          </div>

          <div className="sa-topbar-right">
            <div className="sa-search-box">
              <i className="ri-search-line" />
              <input placeholder="Search requisition, PO, vendor..." />
            </div>

            <button className="sa-icon-button" onClick={handleLogout}>
              <i className="ri-logout-circle-r-line" />
            </button>

            <div className="sa-user-pill">
              <div className="sa-avatar-circle">SA</div>
              <div className="sa-user-info">
                <span className="sa-user-name">{user?.name || "Super Admin"}</span>
                <span className="sa-user-role">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="sa-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ResortUserLayout;
