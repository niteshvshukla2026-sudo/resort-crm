import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useResort } from "../../context/ResortContext";

// --------------------------------------------------
// ✅ BACKEND BASE URL (always ends with /api)
// --------------------------------------------------
const getApiBase = () => {
  const raw =
    import.meta.env.VITE_API_BASE ||
    (window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "https://resort-crm.onrender.com");

  if (raw.endsWith("/api")) return raw;
  return raw.replace(/\/+$/, "") + "/api";
};

const API_BASE = getApiBase();

// axios instance with baseURL + token
const authAxios = axios.create({ baseURL: API_BASE });

authAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --------------------------------------------------

const emptyForm = () => ({ _id: undefined, name: "", code: "" });

// generate department code from name
const generateCodeFromName = (name = "") => {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => (w.length <= 4 ? w : w.slice(0, 4)))
    .join("_");

  const suffix = Math.floor(Math.random() * 900 + 100);
  return ((base || "DEPT") + "_" + suffix).slice(0, 20);
};

const DepartmentList = () => {
  const { selectedResort } = useResort(); // 🔥 GLOBAL RESORT

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // UI
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // filters
  const [filterName, setFilterName] = useState("");
  const [filterCode, setFilterCode] = useState("");

  // -------------------- LOAD DATA (RESORT-WISE) --------------------
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const url =
        selectedResort && selectedResort !== "ALL"
          ? `/departments?resort=${selectedResort}`
          : "/departments";

      const res = await authAxios.get(url);

      const serverDepts = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.departments)
        ? res.data.departments
        : [];

      setDepartments(
        serverDepts.map((d) => ({
          _id: d._id,
          name: d.name,
          code: d.code,
        }))
      );
    } catch (err) {
      console.error("load departments error", err);
      setError("Failed to load departments");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResort]);

  // -------------------- FILTERS --------------------
  const filtered = useMemo(() => {
    return departments.filter((d) => {
      if (
        filterName &&
        !d.name.toLowerCase().includes(filterName.toLowerCase())
      )
        return false;
      if (
        filterCode &&
        !d.code.toLowerCase().includes(filterCode.toLowerCase())
      )
        return false;
      return true;
    });
  }, [departments, filterName, filterCode]);

  // -------------------- FORM --------------------
  const openCreateForm = () => {
    if (selectedResort === "ALL") {
      alert("Please select a resort first");
      return;
    }
    setForm({ ...emptyForm(), code: generateCodeFromName("") });
    setShowForm(true);
  };

  const openEditForm = (d) => {
    setForm({ _id: d._id, name: d.name, code: d.code });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      setForm((p) => ({
        ...p,
        name: value,
        code: generateCodeFromName(value),
      }));
    }
  };

  // -------------------- SUBMIT --------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Department name is required");
    if (selectedResort === "ALL")
      return setError("Please select a resort");

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        code: generateCodeFromName(form.name),
        resort: selectedResort, // 🔥 AUTO ATTACH
      };

      if (form._id) {
        await authAxios.put(`/departments/${form._id}`, payload);
      } else {
        await authAxios.post("/departments", payload);
      }

      await loadData();
      setShowForm(false);
      setForm(emptyForm());
    } catch (err) {
      console.error("save department error", err);
      setError("Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  // -------------------- DELETE --------------------
  const handleDelete = async (d) => {
    if (!window.confirm(`Delete department "${d.name}"?`)) return;
    try {
      await authAxios.delete(`/departments/${d._id}`);
      await loadData();
    } catch (err) {
      console.error("delete department error", err);
      setError("Failed to delete department");
    }
  };

  // -------------------- RENDER --------------------
  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>Departments</h2>
          <p>
            Showing departments for{" "}
            <strong>
              {selectedResort === "ALL" ? "All Resorts" : "Selected Resort"}
            </strong>
          </p>
        </div>

        <button className="sa-primary-button" onClick={openCreateForm}>
          <i className="ri-add-line" /> New Department
        </button>
      </div>

      {error && <div className="sa-modal-error">{error}</div>}

      {/* Filters */}
      <div className="sa-card" style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Filter name..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
        />
        <input
          placeholder="Filter code..."
          value={filterCode}
          onChange={(e) => setFilterCode(e.target.value)}
        />
        <div style={{ marginLeft: "auto", color: "#9ca3af" }}>
          {filtered.length} / {departments.length}
        </div>
      </div>

      {/* Table */}
      <div className="sa-card">
        {loading ? (
          <div>Loading...</div>
        ) : filtered.length === 0 ? (
          <div>No departments found</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d._id}>
                  <td>{d.name}</td>
                  <td>{d.code}</td>
                  <td>
                    <button
                      className="sa-secondary-button"
                      onClick={() => openEditForm(d)}
                    >
                      <i className="ri-edit-line" />
                    </button>
                    <button
                      className="sa-secondary-button"
                      onClick={() => handleDelete(d)}
                    >
                      <i className="ri-delete-bin-6-line" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="sa-modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{form._id ? "Edit Department" : "New Department"}</h3>

            <form onSubmit={handleSubmit}>
              <label>
                Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Code
                <input value={form.code} disabled />
              </label>

              <div className="sa-modal-actions">
                <button
                  type="button"
                  className="sa-secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-primary-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentList;
