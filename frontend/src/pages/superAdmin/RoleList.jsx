// frontend/src/pages/superAdmin/RoleList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/**
 * Predefined role templates.
 * Keys here are the role keys you'll use (e.g. SUPER_ADMIN).
 * For each template define module -> actions array. Module names should match backend modules.
 *
 * When you press "Apply Template", we will iterate backend-returned `modules` and `actions`
 * and apply intersection (i.e. only actions that actually exist in `actions` are used).
 *
 * You can adjust these templates to match your business policies.
 */
const ROLE_TEMPLATES = {
  SUPER_ADMIN: {
    label: "Super Admin (full access)",
    modules: {
      // example modules - may be filtered by actual modules from backend
      USERS: ["CREATE", "READ", "UPDATE", "DELETE"],
      ROLES: ["CREATE", "READ", "UPDATE", "DELETE"],
      RESORTS: ["CREATE", "READ", "UPDATE", "DELETE"],
      VENDORS: ["CREATE", "READ", "UPDATE", "DELETE"],
      ITEMS: ["CREATE", "READ", "UPDATE", "DELETE"],
      REQUISITIONS: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
      PO: ["CREATE", "READ", "UPDATE", "DELETE"],
      GRN: ["CREATE", "READ", "UPDATE", "DELETE"],
      REPORTS: ["READ"],
    },
  },

  RESORT_USER: {
    label: "Resort User (operational)",
    modules: {
      REQUISITIONS: ["CREATE", "READ"],
      ITEMS: ["READ"],
      STORES: ["READ"],
      REPORTS: ["READ"],
    },
  },

  APPROVER: {
    label: "Approver (requisition approvals)",
    modules: {
      REQUISITIONS: ["READ", "APPROVE", "COMMENT"],
      REPORTS: ["READ"],
    },
  },

  PURCHASE_MANAGER: {
    label: "Purchase Manager (PO & vendor)",
    modules: {
      REQUISITIONS: ["READ"],
      PO: ["CREATE", "READ", "UPDATE"],
      VENDORS: ["READ", "UPDATE"],
      ITEMS: ["READ", "UPDATE"],
      REPORTS: ["READ"],
    },
  },

  STORE_USER: {
    label: "Store / Store Incharge",
    modules: {
      GRN: ["CREATE", "READ"],
      ITEMS: ["READ", "UPDATE_STOCK"],
      REQUISITIONS: ["READ"],
    },
  },
};

const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [actions, setActions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  const [templateKey, setTemplateKey] = useState(""); // template dropdown

  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    type: "CUSTOM",
    permissions: [], // [{ module: 'MODULE_KEY', actions: ['CREATE','READ'] }]
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // --- API calls ---

  const loadMeta = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/roles/meta`);
      // Expect res.data = { modules: ['MODULE1','MODULE2'], actions: ['CREATE','READ', ...] }
      setModules(res.data.modules || []);
      setActions(res.data.actions || []);
    } catch (err) {
      console.error("Failed to load roles meta", err);
      // fallback minimal modules/actions if backend doesn't provide meta
      setModules((prev) => prev.length ? prev : ["USERS","ROLES","RESORTS","REQUISITIONS","PO","GRN","ITEMS","VENDORS","REPORTS"]);
      setActions((prev) => prev.length ? prev : ["CREATE","READ","UPDATE","DELETE","APPROVE","COMMENT"]);
    }
  };

  const loadRoles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/roles`);
      setRoles(res.data || []);
    } catch (err) {
      console.error("Failed to load roles", err);
      setError("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      loadMeta();
      loadRoles();
    } catch (e) {
      console.error("init error", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- helpers ---

  const clearError = () => setError("");

  const selectRole = (role) => {
    setSelectedRoleId(role._id);
    setForm({
      name: role.name || "",
      key: role.key || "",
      description: role.description || "",
      type: role.type || "CUSTOM",
      permissions: role.permissions || [],
    });
    setTemplateKey(""); // reset template selection when selecting saved role
    clearError();
  };

  const startNewRole = () => {
    setSelectedRoleId(null);
    setForm({
      name: "",
      key: "",
      description: "",
      type: "CUSTOM",
      permissions: [],
    });
    setTemplateKey("");
    clearError();
  };

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    // prevent changing key for saved system roles
    if (selectedRoleId && form.type === "SYSTEM" && name === "key") return;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearError();
  };

  const hasPermission = (moduleKey, action) => {
    const perm = form.permissions.find((p) => p.module === moduleKey);
    return perm ? perm.actions.includes(action) : false;
  };

  const togglePermission = (moduleKey, action) => {
    setForm((prev) => {
      const perms = [...prev.permissions];
      const idx = perms.findIndex((p) => p.module === moduleKey);

      if (idx === -1) {
        perms.push({ module: moduleKey, actions: [action] });
      } else {
        const set = new Set(perms[idx].actions || []);
        if (set.has(action)) set.delete(action);
        else set.add(action);
        perms[idx].actions = Array.from(set);
      }

      const cleaned = perms.filter((p) => p.actions && p.actions.length);
      return { ...prev, permissions: cleaned };
    });
    clearError();
  };

  // Apply a predefined role template (merge/replace permissions)
  const applyTemplate = (tplKey, replaceExisting = true) => {
    if (!tplKey) return;
    const tpl = ROLE_TEMPLATES[tplKey];
    if (!tpl) return;

    // build permissions array aligned with backend modules/actions
    const newPerms = modules.map((mod) => {
      const allowed = (tpl.modules && tpl.modules[mod]) || tpl.modules && tpl.modules[mod.toUpperCase()] || [];
      // filter allowed by actual actions available
      const finalActions = allowed.filter((a) => actions.includes(a));
      return finalActions.length ? { module: mod, actions: finalActions } : null;
    }).filter(Boolean);

    setForm((prev) => {
      const updated = replaceExisting ? newPerms : mergePermissions(prev.permissions, newPerms);
      return {
        ...prev,
        permissions: updated,
        // if applying a system template, set type to SYSTEM and set key (if not editing existing)
        type: tplKey === "SUPER_ADMIN" ? "SYSTEM" : prev.type,
        key: prev.key || tplKey, // only prefill key if creating new role
        name: prev.name || tpl.label || prev.name,
      };
    });
    setTemplateKey(tplKey);
    clearError();
  };

  // merge existing perms with template perms (union)
  const mergePermissions = (existing = [], addition = []) => {
    const map = new Map();
    existing.forEach((p) => map.set(p.module, new Set(p.actions || [])));
    addition.forEach((p) => {
      const s = map.get(p.module) || new Set();
      (p.actions || []).forEach((a) => s.add(a));
      map.set(p.module, s);
    });
    const merged = Array.from(map.entries()).map(([module, set]) => ({ module, actions: Array.from(set) }));
    return merged;
  };

  // Remove a specific module permission entirely
  const removeModulePermissions = (moduleKey) => {
    setForm((prev) => ({ ...prev, permissions: prev.permissions.filter((p) => p.module !== moduleKey) }));
  };

  const handleSave = async () => {
    if (!form.name || !form.key) {
      setError("Role name & key are required");
      return;
    }

    // Do not allow creating/editing reserved SYSTEM keys unless allowed
    if (form.type === "SYSTEM" && selectedRoleId === null) {
      setError("Cannot create new SYSTEM role from UI. Use custom roles or ask system admin.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (selectedRoleId) {
        const res = await axios.put(`${API_BASE}/api/roles/${selectedRoleId}`, {
          name: form.name,
          description: form.description,
          permissions: form.permissions,
          // do not allow key/type change for system roles
        });
        setRoles((prev) => prev.map((r) => (r._id === selectedRoleId ? res.data : r)));
      } else {
        const res = await axios.post(`${API_BASE}/api/roles`, {
          name: form.name,
          key: form.key,
          description: form.description,
          type: "CUSTOM",
          permissions: form.permissions,
        });
        setRoles((prev) => [...prev, res.data]);
        setSelectedRoleId(res.data._id);
      }
      clearError();
    } catch (err) {
      console.error("save error", err);
      setError(err.response?.data?.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  // UI helpers: display friendly label for a module
  const prettyModule = (m) => (typeof m === "string" ? m.replace(/_/g, " ") : m);

  return (
    <div className="sa-page sa-page-roles">
      <div className="sa-page-header">
        <div>
          <h2>User Roles</h2>
          <p>Define system & custom roles with module-wise permissions.</p>
        </div>
      </div>

      <div className="sa-roles-layout">
        {/* LEFT LIST */}
        <div className="sa-roles-left">
          <div className="sa-roles-section-title">Roles</div>

          {loading ? (
            <div>Loading roles...</div>
          ) : (
            <ul className="sa-roles-list">
              {roles.map((r) => (
                <li
                  key={r._id}
                  className={
                    "sa-role-pill " +
                    (selectedRoleId === r._id ? "active" : "") +
                    (r.type === "SYSTEM" ? " system" : "")
                  }
                  onClick={() => selectRole(r)}
                >
                  <div className="sa-role-name">{r.name}</div>
                  <div className="sa-role-sub">
                    {(r.type || "CUSTOM").toLowerCase()} • {r.key}
                  </div>
                </li>
              ))}
              {!loading && roles.length === 0 && (
                <li className="sa-role-sub">No roles created yet.</li>
              )}
            </ul>
          )}

          <button className="sa-primary-button" onClick={startNewRole}>
            <i className="ri-add-line" /> New Custom Role
          </button>

          {/* Quick templates list (small) */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Quick Templates</div>
            {Object.keys(ROLE_TEMPLATES).map((k) => (
              <button
                key={k}
                type="button"
                className="sa-secondary-button"
                style={{ display: "block", marginBottom: 6, width: "100%", textAlign: "left" }}
                onClick={() => {
                  startNewRole();
                  applyTemplate(k, true);
                }}
                title={ROLE_TEMPLATES[k].label}
              >
                {k} — {ROLE_TEMPLATES[k].label}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT DETAILS */}
        <div className="sa-roles-right">
          <div className="sa-card" style={{ marginBottom: 12 }}>
            <h3>Basic Details</h3>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <label>Role Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleBasicChange}
                  placeholder="Store Incharge / Front Office..."
                />
              </div>

              <div style={{ width: 220 }}>
                <label>Key</label>
                <input
                  name="key"
                  value={form.key}
                  onChange={handleBasicChange}
                  placeholder="STORE_USER"
                  disabled={!!selectedRoleId && form.type === "SYSTEM"}
                />
              </div>

              <div style={{ width: 180 }}>
                <label>Type</label>
                <select name="type" value={form.type} onChange={handleBasicChange} disabled={!!selectedRoleId && form.type === "SYSTEM"}>
                  <option value="CUSTOM">CUSTOM</option>
                  <option value="SYSTEM">SYSTEM</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleBasicChange}
                rows={2}
                placeholder="Short description for this role..."
              />
            </div>

            {/* Template dropdown (for new or editing custom roles) */}
            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">-- Use role template (optional) --</option>
                {Object.keys(ROLE_TEMPLATES).map((k) => (
                  <option key={k} value={k}>
                    {k} — {ROLE_TEMPLATES[k].label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="sa-secondary-button"
                onClick={() => applyTemplate(templateKey, true)}
                disabled={!templateKey}
              >
                Apply Template
              </button>
              <button
                type="button"
                className="sa-secondary-button"
                onClick={() => applyTemplate(templateKey, false)}
                disabled={!templateKey}
                title="Merge template with existing permissions"
              >
                Merge
              </button>
            </div>
          </div>

          <div className="sa-card">
            <h3>Permissions</h3>
            <p className="sa-modal-sub">Tick what this role can do in each module.</p>

            <div className="sa-role-permission-table" style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Module</th>
                    {actions.map((a) => (
                      <th key={a} style={{ whiteSpace: "nowrap" }}>
                        {a}
                      </th>
                    ))}
                    <th style={{ width: 60 }}>Clear</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((m) => (
                    <tr key={m}>
                      <td style={{ minWidth: 160 }}>{prettyModule(m)}</td>
                      {actions.map((a) => (
                        <td key={a} style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={hasPermission(m, a)}
                            onChange={() => togglePermission(m, a)}
                            aria-label={`${m}-${a}`}
                          />
                        </td>
                      ))}
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="sa-secondary-button"
                          onClick={() => removeModulePermissions(m)}
                        >
                          Clear
                        </button>
                      </td>
                    </tr>
                  ))}
                  {modules.length === 0 && (
                    <tr>
                      <td colSpan={actions.length + 2}>No modules metadata loaded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {error && (
              <div className="sa-modal-error" style={{ marginTop: 8 }}>
                {error}
              </div>
            )}

            <div className="sa-modal-actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="sa-primary-button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleList;
