import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// Predefined roles (label + key)
const PREDEFINED_ROLES = [
  { key: "SUPER_ADMIN", label: "Super Admin" },
  { key: "RESORT_USER", label: "Resort User" },
  { key: "APPROVER", label: "Approver" },
  { key: "PURCHASE_MANAGER", label: "Purchase Manager" },
  { key: "STORE_USER", label: "Store User" },
];

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [roles, setRoles] = useState([]); // roles for dropdown (merged)
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "RESORT_USER",
    resorts: [],
  });

  // Load users, resorts and roles
  const loadData = async () => {
    try {
      setLoading(true);
      const [userRes, resortRes, roleRes] = await Promise.all([
        axios.get(`${API_BASE}/api/users`),
        axios.get(`${API_BASE}/api/resorts`),
        axios.get(`${API_BASE}/api/roles`),
      ]);

      setUsers(userRes.data || []);
      setResorts(resortRes.data || []);
      mergeAndSetRoles(roleRes.data || []);
    } catch (err) {
      console.error("loadData error:", err);
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Merge backend roles with predefined roles (avoid duplicates)
  const mergeAndSetRoles = (backendRoles = []) => {
    // backendRoles expected shape: [{ _id, name, key, type, permissions }]
    const backendByKey = (backendRoles || []).reduce((acc, r) => {
      if (r.key) acc[r.key] = r;
      return acc;
    }, {});

    // Start with predefined, then add backend-only roles
    const merged = PREDEFINED_ROLES.map((p) => ({
      key: p.key,
      label: p.label,
      _id: backendByKey[p.key]?._id || null,
      fromBackend: !!backendByKey[p.key],
    }));

    // Add any backend roles that are not in predefined
    backendRoles.forEach((r) => {
      if (!merged.find((m) => m.key === r.key)) {
        merged.push({
          key: r.key,
          label: r.name || r.key,
          _id: r._id,
          fromBackend: true,
        });
      }
    });

    setRoles(merged);
    // Ensure current form.role exists, otherwise default to RESORT_USER
    setForm((f) => ({ ...f, role: merged.find((x) => x.key === f.role) ? f.role : "RESORT_USER" }));
  };

  // Load only roles (use when opening modal to refresh)
  const loadRoles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/roles`);
      mergeAndSetRoles(res.data || []);
    } catch (err) {
      console.error("Failed to load roles:", err);
      // fall back to predefined only
      mergeAndSetRoles([]);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenForm = async () => {
    // refresh roles when opening the modal, so newly created roles appear immediately
    await loadRoles();

    setForm({
      name: "",
      email: "",
      password: "",
      role: "RESORT_USER",
      resorts: [],
    });
    setError("");
    setShowForm(true);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleResortToggle = (id) => {
    setForm((prev) => {
      const exists = prev.resorts.includes(id);
      return {
        ...prev,
        resorts: exists ? prev.resorts.filter((r) => r !== id) : [...prev.resorts, id],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("Name, Email & Password are required");
      return;
    }

    try {
      setSaving(true);
      const res = await axios.post(`${API_BASE}/api/users`, form);
      if (res && res.data) {
        setUsers((prev) => [...prev, res.data]);
        setShowForm(false);
      } else {
        // fallback: reload users list
        await loadData();
        setShowForm(false);
      }
    } catch (err) {
      console.error("create user error:", err);
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const getResortNames = (user) => {
    if (!user.resorts || user.resorts.length === 0) return "-";
    // populated array or ids
    return user.resorts
      .map((r) => (typeof r === "object" ? r.name : resorts.find((x) => x._id === r)?.name))
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>Users</h2>
          <p>Create users and assign 1 or multiple resorts.</p>
        </div>
        <button className="sa-primary-button" type="button" onClick={handleOpenForm}>
          <i className="ri-add-line" /> New User
        </button>
      </div>

      {error && (
        <div className="sa-modal-error" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}

      <div className="sa-card">
        {loading ? (
          <div style={{ fontSize: "0.9rem" }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ fontSize: "0.9rem" }}>No users found.</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Resorts</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id || u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{getResortNames(u)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="sa-modal-backdrop" onClick={() => !saving && setShowForm(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>New User</h3>
            <p className="sa-modal-sub">Create a login and assign which resorts this user can manage.</p>

            <form className="sa-modal-form" onSubmit={handleSubmit}>
              <label>
                Name
                <input name="name" value={form.name} onChange={handleChange} placeholder="Store Incharge" required />
              </label>

              <label>
                Email
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="user@resort.com" required />
              </label>

              <label>
                Password
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
              </label>

              <label>
                Role
                <select name="role" value={form.role} onChange={handleChange}>
                  {/* Render merged roles list */}
                  {roles.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label || r.key}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ fontSize: "0.8rem", marginTop: 6 }}>Resorts (assign one or multiple):</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "6px 10px",
                  marginTop: 4,
                }}
              >
                {resorts.map((r) => (
                  <label
                    key={r._id}
                    style={{
                      fontSize: "0.78rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <input type="checkbox" checked={form.resorts.includes(r._id)} onChange={() => handleResortToggle(r._id)} />
                    {r.name}
                  </label>
                ))}
              </div>

              {error && <div className="sa-modal-error">{error}</div>}

              <div className="sa-modal-actions">
                <button type="button" className="sa-secondary-button" onClick={() => !saving && setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="sa-primary-button" disabled={saving}>
                  {saving ? "Saving..." : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
