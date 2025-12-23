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
  resort: "",
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

      // roles api returns array
      setRoles(Array.isArray(roleRes.data) ? roleRes.data : []);

      // resorts api returns { ok, resorts: [] }
      setResorts(
        Array.isArray(resortRes.data?.resorts)
          ? resortRes.data.resorts
          : []
      );
    } catch (err) {
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
        setStores(Array.isArray(res.data) ? res.data : []);
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
      return {
        ...prev,
        stores: exists
          ? prev.stores.filter((s) => s !== id)
          : [...prev.stores, id],
      };
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
        resorts: [form.resort],        // backend expects array
        defaultResort: form.resort,
        stores: form.stores,
        status: form.status,
      };

      await axios.post(`${API_BASE}/users`, payload);

      alert("User created successfully");
      setForm(emptyForm);
      setStores([]);
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
              <option key={r._id} value={r.key}>
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
              {resorts.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
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
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="sa-checkbox-list">
                {stores.map((s) => (
                  <label key={s._id}>
                    <input
                      type="checkbox"
                      checked={form.stores.includes(s._id)}
                      onChange={() => toggleStore(s._id)}
                    />
                    {s.name}
                  </label>
                ))}
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
