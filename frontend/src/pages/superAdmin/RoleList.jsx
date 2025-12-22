import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// --------------------
// MASTER MODULES & ACTIONS
// --------------------
const MODULES = [
  "USERS",
  "ROLES",
  "RESORTS",
  "STORES",
  "VENDORS",
  "ITEMS",
  "REQUISITIONS",
  "PO",
  "GRN",
  "REPORTS",
];

const ACTIONS = [
  "CREATE",
  "READ",
  "UPDATE",
  "DELETE",
  "APPROVE",
];

// --------------------
// COMPONENT
// --------------------
const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    type: "CUSTOM", // SYSTEM | CUSTOM
    storeMode: "MULTI", // SINGLE | MULTI
    permissions: [],
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // --------------------
  // LOAD ROLES
  // --------------------
  const loadRoles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/roles`);
      setRoles(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // --------------------
  // HELPERS
  // --------------------
  const resetForm = () => {
    setSelectedRoleId(null);
    setForm({
      name: "",
      key: "",
      description: "",
      type: "CUSTOM",
      storeMode: "MULTI",
      permissions: [],
    });
    setError("");
  };

  const selectRole = (role) => {
    setSelectedRoleId(role._id);
    setForm({
      name: role.name || "",
      key: role.key || "",
      description: role.description || "",
      type: role.type || "CUSTOM",
      storeMode: role.storeMode || "MULTI",
      permissions: role.permissions || [],
    });
    setError("");
  };

  const hasPermission = (module, action) => {
    const p = form.permissions.find((x) => x.module === module);
    return p ? p.actions.includes(action) : false;
  };

  const togglePermission = (module, action) => {
    setForm((prev) => {
      const perms = [...prev.permissions];
      const idx = perms.findIndex((p) => p.module === module);

      if (idx === -1) {
        perms.push({ module, actions: [action] });
      } else {
        const set = new Set(perms[idx].actions);
        set.has(action) ? set.delete(action) : set.add(action);
        perms[idx].actions = Array.from(set);
      }

      return {
        ...prev,
        permissions: perms.filter((p) => p.actions.length > 0),
      };
    });
  };

  // --------------------
  // SAVE ROLE
  // --------------------
  const saveRole = async () => {
    if (!form.name || !form.key) {
      setError("Role name & key are required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (selectedRoleId) {
        const res = await axios.put(
          `${API_BASE}/api/roles/${selectedRoleId}`,
          form
        );
        setRoles((prev) =>
          prev.map((r) => (r._id === selectedRoleId ? res.data : r))
        );
      } else {
        const res = await axios.post(`${API_BASE}/api/roles`, form);
        setRoles((prev) => [...prev, res.data]);
        setSelectedRoleId(res.data._id);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  // --------------------
  // UI
  // --------------------
  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <h2>Role Management</h2>
        <button className="sa-primary-button" onClick={resetForm}>
          + New Role
        </button>
      </div>

      <div className="sa-grid-2">
        {/* LEFT: ROLE LIST */}
        <div className="sa-card">
          <h3>Roles</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul className="sa-list">
              {roles.map((r) => (
                <li
                  key={r._id}
                  className={`sa-list-item ${
                    selectedRoleId === r._id ? "active" : ""
                  }`}
                  onClick={() => selectRole(r)}
                >
                  <div>{r.name}</div>
                  <small>
                    {r.key} • {r.type}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* RIGHT: ROLE FORM */}
        <div className="sa-card">
          <h3>{selectedRoleId ? "Edit Role" : "Create Role"}</h3>

          <label>
            Role Name
            <input
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
            />
          </label>

          <label>
            Role Key
            <input
              value={form.key}
              disabled={form.type === "SYSTEM"}
              onChange={(e) =>
                setForm((p) => ({ ...p, key: e.target.value.toUpperCase() }))
              }
            />
          </label>

          <label>
            Description
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
            />
          </label>

          <label>
            Store Access Mode
            <select
              value={form.storeMode}
              onChange={(e) =>
                setForm((p) => ({ ...p, storeMode: e.target.value }))
              }
            >
              <option value="SINGLE">Single Store</option>
              <option value="MULTI">Multiple Stores</option>
            </select>
          </label>

          {/* PERMISSIONS */}
          <h4 style={{ marginTop: 16 }}>Permissions</h4>

          <div style={{ overflowX: "auto" }}>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Module</th>
                  {ACTIONS.map((a) => (
                    <th key={a}>{a}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((m) => (
                  <tr key={m}>
                    <td>{m}</td>
                    {ACTIONS.map((a) => (
                      <td key={a} style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={hasPermission(m, a)}
                          onChange={() => togglePermission(m, a)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <div className="sa-error">{error}</div>}

          <div style={{ marginTop: 16 }}>
            <button
              className="sa-primary-button"
              onClick={saveRole}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Role"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleList;
