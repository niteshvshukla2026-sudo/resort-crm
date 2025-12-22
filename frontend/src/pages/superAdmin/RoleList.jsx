import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* ===============================
   MASTER DATA
================================ */
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

const ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"];

/* ===============================
   COMPONENT
================================ */
const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    type: "CUSTOM",
    storeMode: "MULTI",
    permissions: [],
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ===============================
     LOAD ROLES
  ================================ */
  const loadRoles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/roles`);
      setRoles(res.data || []);
    } catch {
      setError("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  /* ===============================
     HELPERS
  ================================ */
  const resetForm = () => {
    setSelectedId(null);
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

  const selectRole = (r) => {
    setSelectedId(r._id);
    setForm({
      name: r.name,
      key: r.key,
      description: r.description || "",
      type: r.type || "CUSTOM",
      storeMode: r.storeMode || "MULTI",
      permissions: r.permissions || [],
    });
    setError("");
  };

  const hasPerm = (mod, act) => {
    const p = form.permissions.find((x) => x.module === mod);
    return p ? p.actions.includes(act) : false;
  };

  const togglePerm = (mod, act) => {
    setForm((prev) => {
      const copy = [...prev.permissions];
      const idx = copy.findIndex((p) => p.module === mod);

      if (idx === -1) {
        copy.push({ module: mod, actions: [act] });
      } else {
        const s = new Set(copy[idx].actions);
        s.has(act) ? s.delete(act) : s.add(act);
        copy[idx].actions = Array.from(s);
      }

      return { ...prev, permissions: copy.filter((p) => p.actions.length) };
    });
  };

  /* ===============================
     SAVE
  ================================ */
  const saveRole = async () => {
    if (!form.name || !form.key) {
      setError("Role name & key are required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (selectedId) {
        const res = await axios.put(
          `${API_BASE}/api/roles/${selectedId}`,
          form
        );
        setRoles((p) => p.map((r) => (r._id === selectedId ? res.data : r)));
      } else {
        const res = await axios.post(`${API_BASE}/api/roles`, form);
        setRoles((p) => [...p, res.data]);
        setSelectedId(res.data._id);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ===============================
     UI
  ================================ */
  return (
    <div className="sa-page sa-roles">
      {/* HEADER */}
      <div className="sa-page-header">
        <div>
          <h2>Role Management</h2>
          <p>Create custom roles and assign permissions module-wise</p>
        </div>
        <button className="sa-primary-button" onClick={resetForm}>
          + New Role
        </button>
      </div>

      <div className="sa-layout">
        {/* LEFT PANEL */}
        <div className="sa-panel sa-panel-left">
          <h4>Roles</h4>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul className="sa-role-list">
              {roles.map((r) => (
                <li
                  key={r._id}
                  className={`sa-role-item ${
                    selectedId === r._id ? "active" : ""
                  }`}
                  onClick={() => selectRole(r)}
                >
                  <div className="name">{r.name}</div>
                  <div className="meta">
                    <span className={`badge ${r.type}`}>
                      {r.type}
                    </span>
                    <span>{r.key}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="sa-panel sa-panel-right">
          <h3>{selectedId ? "Edit Role" : "Create Role"}</h3>

          {/* BASIC DETAILS */}
          <div className="sa-card">
            <div className="sa-form-grid">
              <div>
                <label>Role Name</label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <label>Role Key</label>
                <input
                  value={form.key}
                  disabled={form.type === "SYSTEM"}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      key: e.target.value.toUpperCase(),
                    }))
                  }
                />
              </div>

              <div>
                <label>Store Access</label>
                <select
                  value={form.storeMode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, storeMode: e.target.value }))
                  }
                >
                  <option value="SINGLE">Single Store</option>
                  <option value="MULTI">Multiple Stores</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label>Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
          </div>

          {/* PERMISSIONS */}
          <div className="sa-card">
            <h4>Permissions</h4>

            <div className="sa-permission-table">
              <table>
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
                        <td key={a}>
                          <input
                            type="checkbox"
                            checked={hasPerm(m, a)}
                            onChange={() => togglePerm(m, a)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && <div className="sa-error">{error}</div>}

          {/* ACTIONS */}
          <div className="sa-actions">
            <button
              className="sa-primary-button"
              disabled={saving}
              onClick={saveRole}
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
