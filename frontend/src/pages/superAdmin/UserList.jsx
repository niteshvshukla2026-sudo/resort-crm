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
  resort: "", // ✅ single resort
  stores: [],
  status: "ACTIVE",
};

/* ===============================
   COMPONENT
================================ */
const UserCreate = () => {
  const [form, setForm] = useState(emptyForm);

  const [roles, setRoles] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [stores, setStores] = useState([]);

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

      // 🔐 SAFE ARRAY HANDLING
      setRoles(
        Array.isArray(roleRes.data)
          ? roleRes.data
          : Array.isArray(roleRes.data?.data)
          ? roleRes.data.data
          : []
      );

      setResorts(
        Array.isArray(resortRes.data)
          ? resortRes.data
          : Array.isArray(resortRes.data?.data)
          ? resortRes.data.data
          : []
      );
    } catch (err) {
      console.error(err);
      setError("Failed to load roles or resorts");
    }
  };

  /* ===============================
     LOAD STORES (RESORT WISE)
  ================================ */
  useEffect(() => {
    if (!form.resort) {
      setStores([]);
      setForm((p) => ({ ...p, stores: [] }));
      return;
    }

    axios
      .get(`${API_BASE}/stores`, {
        params: { resort: form.resort },
      })
      .then((res) => {
        setStores(
          Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.data)
            ? res.data.data
            : []
        );
      })
      .catch(() => {
        setStores([]);
      });
  }, [form.resort]);

  /* ===============================
     HELPERS
  ================================ */
  const selectedRole = roles.find((r) => r.key === form.role);
  const isSingleStore = selectedRole?.storeMode === "SINGLE";

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

    if (!form.resort) {
      return setError("Resort selection is required");
    }

    if (!form.stores.length) {
      return setError("At least one store must be selected");
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        resorts: [form.resort], // ✅ backend compatible
        defaultResort: form.resort,
        stores: form.stores,
        status: form.status,
      };

      await axios.post(`${API_BASE}/users`, payload);

      alert("User created successfully");
      setForm(emptyForm);
    } catch (err) {
      console.error(err);
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

      <div className="sa-card" style={{ maxWidth: 650 }}>
        {/* BASIC INFO */}
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
          <select
            value={form.role}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                role: e.target.value,
                resort: "",
                stores: [],
              }))
            }
          >
            <option value="">Select role</option>
            {roles.map((r) => (
              <option key={r._id || r.id} value={r.key}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        {/* RESORT */}
        {form.role && (
          <label>
            Resort *
            <select
              value={form.resort}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  resort: e.target.value,
                  stores: [],
                }))
              }
            >
              <option value="">Select resort</option>
              {resorts.map((r) => {
                const resortId = r._id || r.id;
                return (
                  <option key={resortId} value={resortId}>
                    {r.name}
                  </option>
                );
              })}
            </select>
          </label>
        )}

        {/* STORES */}
        {form.resort && (
          <>
            <div style={{ marginTop: 16, fontWeight: 600 }}>
              Store Access
            </div>

            {isSingleStore ? (
              <select
                value={form.stores[0] || ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    stores: e.target.value ? [e.target.value] : [],
                  }))
                }
              >
                <option value="">Select store</option>
                {stores.map((s) => {
                  const storeId = s._id || s.id;
                  return (
                    <option key={storeId} value={storeId}>
                      {s.name}
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="sa-checkbox-list">
                {stores.map((s) => {
                  const storeId = s._id || s.id;
                  return (
                    <label key={storeId}>
                      <input
                        type="checkbox"
                        checked={form.stores.includes(storeId)}
                        onChange={() => toggleStore(storeId)}
                      />
                      {s.name}
                    </label>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* STATUS */}
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
