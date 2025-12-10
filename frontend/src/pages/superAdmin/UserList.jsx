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
  status: "ACTIVE",
  role: "RESORT_USER",
  resorts: [],
  defaultResort: "",
  accountAdmin: false,
});

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [roles, setRoles] = useState([]); // merged roles (with storeMode)
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(emptyForm());

  // Merge backend roles with predefined roles (avoid duplicates)
  const mergeAndSetRoles = (backendRoles = []) => {
    const backendByKey = (backendRoles || []).reduce((acc, r) => {
      if (r.key) acc[r.key] = r;
      return acc;
    }, {});

    const merged = PREDEFINED_ROLES.map((p) => ({
      key: p.key,
      label: p.label,
      _id: backendByKey[p.key]?._id || null,
      fromBackend: !!backendByKey[p.key],
      storeMode: backendByKey[p.key]?.storeMode || "MULTI", // default multi if not set
    }));

    backendRoles.forEach((r) => {
      if (!merged.find((m) => m.key === r.key)) {
        merged.push({
          key: r.key,
          label: r.name || r.key,
          _id: r._id,
          fromBackend: true,
          storeMode: r.storeMode || "MULTI",
        });
      }
    });

    setRoles(merged);
    setForm((f) => ({
      ...f,
      role: merged.find((x) => x.key === f.role) ? f.role : "RESORT_USER",
    }));
  };

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

  const loadRoles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/roles`);
      mergeAndSetRoles(res.data || []);
    } catch (err) {
      console.error("Failed to load roles:", err);
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
    setForm((prev) => {
      let next = { ...prev, [name]: value };

      if (name === "role") {
        const roleMeta = roles.find((r) => r.key === value);
        const isSingle = roleMeta?.storeMode === "SINGLE";
        if (isSingle) {
          const first = prev.resorts[0] || "";
          next.resorts = first ? [first] : [];
          next.defaultResort = first || "";
        }
      }

      return next;
    });
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

  const handleSingleResortChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      resorts: value ? [value] : [],
      defaultResort: value || "",
    }));
  };

  const createUser = async (sendPassword = false) => {
    setError("");

    const fullName = `${form.firstName} ${form.lastName}`.trim();

    if (!fullName || !form.email || !form.password) {
      setError("First Name, Email & Password are required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: fullName,
        email: form.email,
        password: form.password,
        role: form.role,
        resorts: form.resorts,
        // optionally: status, phone, isdCode, accountAdmin, defaultResort, sendPassword
      };

      const res = await axios.post(`${API_BASE}/api/users`, payload);

      if (res && res.data) {
        setUsers((prev) => [...prev, res.data]);
        setShowForm(false);
      } else {
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
    return (user.resorts || [])
      .map((r) =>
        typeof r === "object" ? r.name : resorts.find((x) => x._id === r)?.name
      )
      .filter(Boolean)
      .join(", ");
  };

  // LIST VIEW
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

  // ADD STAFF VIEW
  const selectedRoleMeta = roles.find((r) => r.key === form.role);
  const isSingleStoreRole = selectedRoleMeta?.storeMode === "SINGLE";

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

          {selectedRoleMeta && (
            <div style={{ fontSize: 12, marginTop: 4, color: "#777" }}>
              Store access for this role:{" "}
              {isSingleStoreRole ? "Single Store" : "Multi Store"}
            </div>
          )}

          {/* Property / Store allocation */}
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

                {/* SINGLE STORE MODE */}
                {isSingleStoreRole ? (
                  <>
                    <select
                      style={{ marginTop: 6, width: "100%" }}
                      value={form.resorts[0] || ""}
                      onChange={handleSingleResortChange}
                    >
                      <option value="">Select</option>
                      {resorts.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name}
                        </option>
                      ))}
                    </select>

                    <div style={{ marginTop: 8, fontWeight: 600 }}>
                      Default Property
                    </div>
                    <select
                      style={{ marginTop: 4, width: "100%" }}
                      value={form.defaultResort || form.resorts[0] || ""}
                      onChange={handleSingleResortChange}
                    >
                      <option value="">Select</option>
                      {resorts.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    {/* MULTI STORE MODE */}
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
                  </>
                )}
              </div>

              <div>
                {/* Product area – placeholder like Djubo */}
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

          {error && <div className="sa-modal-error">{error}</div>}

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
