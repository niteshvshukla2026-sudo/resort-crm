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

const emptyForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  isdCode: "+91",
  phone: "",
  status: "ACTIVE", // ACTIVE | INACTIVE
  role: "RESORT_USER",
  resorts: [],
  defaultResort: "",
  accountAdmin: false,
});

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [roles, setRoles] = useState([]); // roles for dropdown (merged)
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(emptyForm());

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
    setForm((f) => ({
      ...f,
      role: merged.find((x) => x.key === f.role) ? f.role : "RESORT_USER",
    }));
  };

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

  // Load only roles (when opening Add User screen)
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
    await loadRoles();
    setForm(emptyForm());
    setError("");
    setShowForm(true);
  };

  const handleBackToList = () => {
    if (saving) return;
    setShowForm(false);
    setError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleResortToggle = (id) => {
    setForm((prev) => {
      const exists = prev.resorts.includes(id);
      const nextResorts = exists
        ? prev.resorts.filter((r) => r !== id)
        : [...prev.resorts, id];

      // if defaultResort was removed, reset it
      const nextDefault =
        prev.defaultResort && !nextResorts.includes(prev.defaultResort)
          ? ""
          : prev.defaultResort;

      return {
        ...prev,
        resorts: nextResorts,
        defaultResort: nextDefault,
      };
    });
  };

  const handleDefaultResortChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      defaultResort: value,
      resorts:
        value && !prev.resorts.includes(value)
          ? [...prev.resorts, value]
          : prev.resorts,
    }));
  };

  // Create user (used by both bottom buttons)
  const createUser = async (sendPassword = false) => {
    setError("");

    const fullName = `${form.firstName} ${form.lastName}`.trim();

    if (!fullName || !form.email || !form.password) {
      setError("First Name, Email & Password are required");
      return;
    }

    try {
      setSaving(true);

      // keep backend payload same as old version to avoid breaking API
      const payload = {
        name: fullName,
        email: form.email,
        password: form.password,
        role: form.role,
        resorts: form.resorts,
        // You can later add: status, phone, isdCode, accountAdmin, defaultResort, sendPassword, etc.
      };

      const res = await axios.post(`${API_BASE}/api/users`, payload);

      if (res && res.data) {
        setUsers((prev) => [...prev, res.data]);
        setShowForm(false);
      } else {
        // fallback: reload users list
        await loadData();
        setShowForm(false);
      }

      // If you add backend support for sending password:
      // you can include sendPassword flag in payload above.
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
      .map((r) =>
        typeof r === "object" ? r.name : resorts.find((x) => x._id === r)?.name
      )
      .filter(Boolean)
      .join(", ");
  };

  // ---------- RENDER ----------

  // LIST VIEW (existing page)
  if (!showForm) {
    return (
      <div className="sa-page">
        <div className="sa-page-header">
          <div>
            <h2>Users</h2>
            <p>Create users and assign one or multiple resorts.</p>
          </div>
          <button
            className="sa-primary-button"
            type="button"
            onClick={handleOpenForm}
          >
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
      </div>
    );
  }

  // ADD STAFF VIEW (Djubo-style layout)
  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>ADD STAFF</h2>
          <p>Add your team members and assign resorts & roles.</p>
        </div>
        <button
          type="button"
          className="sa-secondary-button"
          onClick={handleBackToList}
        >
          Back to Users
        </button>
      </div>

      {error && (
        <div className="sa-modal-error" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}

      <div className="sa-card">
        <form
          className="sa-modal-form"
          style={{ maxWidth: 700 }}
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Top basic details */}
          <label>
            First Name
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="First Name"
              required
            />
          </label>

          <label>
            Last Name
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Last Name"
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="user@resort.com"
              required
            />
          </label>

          {/* Password (not in Djubo UI, but needed for your backend) */}
          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </label>

          <label>
            ISD Code
            <input
              name="isdCode"
              value={form.isdCode}
              onChange={handleChange}
              placeholder="+91"
            />
          </label>

          <label>
            Phone Number
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="9876543210"
            />
          </label>

          {/* Status radio like screenshot */}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>Status</div>
            <div
              style={{
                display: "flex",
                gap: 20,
                marginTop: 6,
                fontSize: "0.9rem",
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={form.status === "ACTIVE"}
                  onChange={handleChange}
                />
                Active
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="radio"
                  name="status"
                  value="INACTIVE"
                  checked={form.status === "INACTIVE"}
                  onChange={handleChange}
                />
                In-Active
              </label>
            </div>
          </div>

          {/* Account Admin checkbox */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 12,
              borderTop: "1px solid #eee",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              <input
                type="checkbox"
                name="accountAdmin"
                checked={form.accountAdmin}
                onChange={handleCheckboxChange}
              />
              <span>Account-Admin</span>
            </label>
          </div>

          {/* Role selection (global role) */}
          <label style={{ marginTop: 12 }}>
            Role
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              style={{ maxWidth: 260 }}
            >
              {roles.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label || r.key}
                </option>
              ))}
            </select>
          </label>

          {/* Property / Default Property area to mimic Djubo */}
          <div
            style={{
              marginTop: 18,
              paddingTop: 12,
              borderTop: "1px solid #eee",
              fontSize: "0.9rem",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "12px 24px",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>Property</div>
                <div style={{ fontSize: "0.8rem", color: "#777" }}>
                  1. All-Properties
                </div>
                {/* Multi-select using checkboxes (assign multiple resorts) */}
                <div
                  style={{
                    marginTop: 6,
                    maxHeight: 140,
                    overflowY: "auto",
                    padding: "6px 10px",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                  }}
                >
                  {resorts.length === 0 ? (
                    <div style={{ fontSize: "0.8rem", color: "#777" }}>
                      No resorts found.
                    </div>
                  ) : (
                    resorts.map((r) => (
                      <label
                        key={r._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: "0.8rem",
                          marginBottom: 4,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.resorts.includes(r._id)}
                          onChange={() => handleResortToggle(r._id)}
                        />
                        {r.name}
                      </label>
                    ))
                  )}
                </div>

                <div style={{ marginTop: 8, fontWeight: 600 }}>
                  Default Property
                </div>
                <select
                  name="defaultResort"
                  value={form.defaultResort}
                  onChange={handleDefaultResortChange}
                  style={{ marginTop: 4, width: "100%" }}
                >
                  <option value="">Select</option>
                  {resorts.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                {/* Placeholder block to visually match "Product / Default Product" area in screenshot.
                    Hook it up to actual data later if needed. */}
                <div style={{ fontWeight: 600 }}>Product</div>
                <div style={{ fontSize: "0.8rem", color: "#777" }}>
                  1. All-Products
                </div>
                <select
                  disabled
                  style={{ marginTop: 4, width: "100%", opacity: 0.6 }}
                >
                  <option>Select</option>
                </select>

                <div style={{ marginTop: 8, fontWeight: 600 }}>
                  Default Product
                </div>
                <select
                  disabled
                  style={{ marginTop: 4, width: "100%", opacity: 0.6 }}
                >
                  <option>Select</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bottom buttons like screenshot */}
          <div
            className="sa-modal-actions"
            style={{
              marginTop: 24,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="sa-primary-button"
              disabled={saving}
              onClick={() => createUser(false)}
            >
              {saving ? "Saving..." : "Add New User"}
            </button>

            <button
              type="button"
              className="sa-primary-button"
              disabled={saving}
              onClick={() => createUser(true)}
            >
              {saving ? "Saving..." : "Add New User and Send Password"}
            </button>

            <button
              type="button"
              className="sa-secondary-button"
              onClick={handleBackToList}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserList;
