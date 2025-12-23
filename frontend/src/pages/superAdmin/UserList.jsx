import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  (import.meta.env.VITE_API_BASE || "http://localhost:5000") + "/api";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "",
  resorts: [],
  defaultResort: "",
  status: "ACTIVE",
};

const UserCreate = () => {
  const [form, setForm] = useState(emptyForm);
  const [roles, setRoles] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ======================
     LOAD ROLES & RESORTS
  ====================== */
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [roleRes, resortRes] = await Promise.all([
        axios.get(`${API_BASE}/roles`),
        axios.get(`${API_BASE}/resorts`),
      ]);

      setRoles(roleRes.data || []);
      setResorts(resortRes.data || []);
    } catch (e) {
      setError("Failed to load roles or resorts");
    }
  };

  /* ======================
     HELPERS
  ====================== */
  const selectedRole = roles.find((r) => r.key === form.role);
  const isSingleStore = selectedRole?.storeMode === "SINGLE";

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      let next = { ...prev, [name]: value };

      if (name === "role" && isSingleStore) {
        next.resorts = [];
        next.defaultResort = "";
      }

      return next;
    });
  };

  const toggleResort = (id) => {
    setForm((prev) => {
      const exists = prev.resorts.includes(id);
      const resorts = exists
        ? prev.resorts.filter((r) => r !== id)
        : [...prev.resorts, id];

      return {
        ...prev,
        resorts,
        defaultResort:
          prev.defaultResort && !resorts.includes(prev.defaultResort)
            ? ""
            : prev.defaultResort,
      };
    });
  };

  /* ======================
     SAVE USER
  ====================== */
  const saveUser = async () => {
    if (!form.name || !form.email || !form.password || !form.role) {
      return setError("All required fields must be filled");
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role, // role KEY
        resorts: form.resorts,
        defaultResort: form.defaultResort,
        status: form.status,
      };

      await axios.post(`${API_BASE}/users`, payload);

      alert("User created successfully");
      setForm(emptyForm);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  /* ======================
     UI
  ====================== */
  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <h2>Create User</h2>
        <p>Assign role and resort access</p>
      </div>

      {error && <div className="sa-error">{error}</div>}

      <div className="sa-card" style={{ maxWidth: 600 }}>
        <label>
          Full Name *
          <input
            value={form.name}
            onChange={(e) =>
              setForm((p) => ({ ...p, name: e.target.value }))
            }
          />
        </label>

        <label>
          Email *
          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((p) => ({ ...p, email: e.target.value }))
            }
          />
        </label>

        <label>
          Password *
          <input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((p) => ({ ...p, password: e.target.value }))
            }
          />
        </label>

        <label>
          Role *
          <select
            value={form.role}
            onChange={handleChange}
            name="role"
          >
            <option value="">Select role</option>
            {roles.map((r) => (
              <option key={r._id} value={r.key}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        {selectedRole && (
          <div style={{ fontSize: 12, color: "#777" }}>
            Store access:{" "}
            {isSingleStore ? "Single Store" : "Multiple Stores"}
          </div>
        )}

        {/* RESORT SELECTION */}
        {form.role && (
          <>
            <div style={{ marginTop: 16, fontWeight: 600 }}>
              Resort Access
            </div>

            {isSingleStore ? (
              <select
                value={form.resorts[0] || ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    resorts: e.target.value ? [e.target.value] : [],
                    defaultResort: e.target.value,
                  }))
                }
              >
                <option value="">Select resort</option>
                {resorts.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="sa-checkbox-list">
                {resorts.map((r) => (
                  <label key={r._id}>
                    <input
                      type="checkbox"
                      checked={form.resorts.includes(r._id)}
                      onChange={() => toggleResort(r._id)}
                    />
                    {r.name}
                  </label>
                ))}
              </div>
            )}

            <label>
              Default Resort
              <select
                value={form.defaultResort}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    defaultResort: e.target.value,
                  }))
                }
              >
                <option value="">Select</option>
                {resorts
                  .filter((r) => form.resorts.includes(r._id))
                  .map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </label>
          </>
        )}

        <label>
          Status
          <select
            value={form.status}
            onChange={(e) =>
              setForm((p) => ({ ...p, status: e.target.value }))
            }
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>

        <div style={{ marginTop: 20 }}>
          <button
            className="sa-primary-button"
            disabled={saving}
            onClick={saveUser}
          >
            {saving ? "Saving..." : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCreate;
