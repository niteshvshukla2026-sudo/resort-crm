import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  (import.meta.env.VITE_API_BASE || "http://localhost:5000") + "/api";

/* ===============================
   EMPTY FORM
================================ */
const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "",
  resorts: [],
  stores: [],
  defaultResort: "",
  status: "ACTIVE",
};

/* ===============================
   COMPONENT
================================ */
const UserCreate = () => {
  const [form, setForm] = useState(emptyForm);

  const [roles, setRoles] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [storesByResort, setStoresByResort] = useState({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ===============================
     LOAD ROLES & RESORTS
  ================================ */
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [roleRes, resortRes] = await Promise.all([
        axios.get(`${API_BASE}/roles`),
        axios.get(`${API_BASE}/resorts`),
      ]);

      setRoles(roleRes.data || []);
      setResorts(resortRes.data || []);
    } catch (err) {
      setError("Failed to load roles or resorts");
    }
  };

  /* ===============================
     LOAD STORES (RESORT-WISE)
  ================================ */
  useEffect(() => {
    if (!form.resorts.length) {
      setStoresByResort({});
      setForm((p) => ({ ...p, stores: [] }));
      return;
    }

    const loadStores = async () => {
      const map = {};

      for (const resortId of form.resorts) {
        try {
          const res = await axios.get(`${API_BASE}/stores`, {
            params: { resort: resortId },
          });
          map[resortId] = res.data || [];
        } catch {
          map[resortId] = [];
        }
      }

      setStoresByResort(map);
    };

    loadStores();
  }, [form.resorts]);

  /* ===============================
     HELPERS
  ================================ */
  const selectedRole = roles.find((r) => r.key === form.role);
  const isSingleStore = selectedRole?.storeMode === "SINGLE";

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      let next = { ...prev, [name]: value };

      if (name === "role") {
        next.resorts = [];
        next.stores = [];
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

  const toggleStore = (id) => {
    setForm((prev) => {
      const exists = prev.stores.includes(id);
      const stores = exists
        ? prev.stores.filter((s) => s !== id)
        : [...prev.stores, id];
      return { ...prev, stores };
    });
  };

  /* ===============================
     SAVE USER
  ================================ */
  const saveUser = async () => {
    if (!form.name || !form.email || !form.password || !form.role) {
      return setError("Name, Email, Password & Role are required");
    }

    if (!form.resorts.length) {
      return setError("At least one resort must be selected");
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        resorts: form.resorts,
        stores: form.stores,
        defaultResort: form.defaultResort || form.resorts[0],
        status: form.status,
      };

      await axios.post(`${API_BASE}/users`, payload);

      alert("User created successfully");
      setForm(emptyForm);
      setStoresByResort({});
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  /* ===============================
     UI
  ================================ */
  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <h2>Create User</h2>
        <p>Assign role, resort & store access</p>
      </div>

      {error && <div className="sa-error">{error}</div>}

      <div className="sa-card" style={{ maxWidth: 700 }}>
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

        {/* ROLE */}
        <label>
          Role *
          <select name="role" value={form.role} onChange={handleChange}>
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
          </>
        )}

        {/* STORES – RESORT WISE */}
        {form.resorts.length > 0 && (
          <>
            <div style={{ marginTop: 20, fontWeight: 600 }}>
              Store Access (Resort-wise)
            </div>

            {form.resorts.map((resortId) => {
              const resort = resorts.find((r) => r._id === resortId);
              const storeList = storesByResort[resortId] || [];

              return (
                <div key={resortId} style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {resort?.name}
                  </div>

                  <div className="sa-checkbox-list">
                    {storeList.length === 0 ? (
                      <div style={{ fontSize: 12, color: "#888" }}>
                        No stores for this resort
                      </div>
                    ) : (
                      storeList.map((s) => (
                        <label key={s._id}>
                          <input
                            type="checkbox"
                            checked={form.stores.includes(s._id)}
                            onChange={() => toggleStore(s._id)}
                          />
                          {s.name}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* STATUS */}
        <label style={{ marginTop: 16 }}>
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

        <div style={{ marginTop: 24 }}>
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
