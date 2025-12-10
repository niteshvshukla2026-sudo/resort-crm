// src/pages/superAdmin/ItemCategoryMaster.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const emptyForm = () => ({ _id: undefined, name: "", code: "", departmentCategory: "" });

const generateCodeFromName = (name = "") => {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w.length <= 4 ? w : w.slice(0, 4)))
    .join("_") || "IC";
  const suffix = Math.floor(Math.random() * 900 + 100); // 100..999
  return `${base}_${suffix}`.slice(0, 20);
};

const ItemCategoryMaster = () => {
  const [itemCategories, setItemCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // filters
  const [filterName, setFilterName] = useState("");
  const [filterDept, setFilterDept] = useState("");

  // -----------------------
  // load data from backend
  // -----------------------
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [icRes, deptRes] = await Promise.all([
        axios.get(`${API_BASE}/api/item-categories`).catch((err) => {
          console.error("load item-categories error:", err);
          setError("Failed to load item categories");
          return { data: [] };
        }),
        axios.get(`${API_BASE}/api/departments`).catch((err) => {
          console.error("load departments error:", err);
          setError("Failed to load departments");
          return { data: [] };
        }),
      ]);

      // ITEM CATEGORIES (backend only)
      const serverIC = Array.isArray(icRes.data)
        ? icRes.data.map((it) => ({
            _id: it._id || it.id,
            name: it.name || "",
            code: it.code || generateCodeFromName(it.name || ""),
            // we store whatever backend sends (id/code/name)
            departmentCategory:
              it.departmentCategory || it.department || it.dept || "",
          }))
        : [];

      setItemCategories(serverIC);

      // DEPARTMENTS
      const deptData = Array.isArray(deptRes.data?.departments)
        ? deptRes.data.departments
        : Array.isArray(deptRes.data)
        ? deptRes.data
        : [];

      const serverDepts = deptData.map((d) => ({
        _id: d._id || d.id,
        name: d.name || "",
        code: d.code || "",
      }));

      setDepartments(serverDepts);
    } catch (err) {
      console.error("loadData fatal error:", err);
      setError("Failed to load item categories / departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------
  // helpers
  // -----------------------

  // filter list for search / dept
  const filtered = useMemo(() => {
    return itemCategories.filter((it) => {
      if (filterName && !it.name?.toLowerCase().includes(filterName.toLowerCase())) return false;
      if (filterDept && (it.departmentCategory || "").toString() !== filterDept) return false;
      return true;
    });
  }, [itemCategories, filterName, filterDept]);

  const openCreateForm = () => {
    setForm(emptyForm());
    setError("");
    setShowForm(true);
  };

  const openEditForm = (it) => {
    setForm({
      _id: it._id || it.id,
      name: it.name || "",
      code: it.code || generateCodeFromName(it.name),
      departmentCategory: it.departmentCategory || "",
    });
    setError("");
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // id/code/value se department ka readable name nikalna
  const getDeptName = (value) => {
    if (!value) return "-";

    const dept =
      departments.find(
        (d) =>
          d._id === value || d.code === value || d.name === value
      ) || null;

    return dept?.name || value;
  };

  // -----------------------
  // create / update submit
  // -----------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.name.trim()) return setError("Item Category name required");
    if (!form.departmentCategory || !form.departmentCategory.trim())
      return setError("Select Department");

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        code: form.code && form.code.trim() ? form.code.trim() : generateCodeFromName(form.name),
        // send both keys so backend whichever uses will work
        department: form.departmentCategory,
        departmentCategory: form.departmentCategory,
      };

      if (form._id) {
        // UPDATE
        const res = await axios
          .put(`${API_BASE}/api/item-categories/${form._id}`, payload)
          .catch((err) => {
            console.error("update item-category error:", err);
            return null;
          });

        if (res?.data) {
          const updated = {
            _id: res.data._id || res.data.id,
            name: res.data.name,
            code: res.data.code,
            departmentCategory:
              res.data.departmentCategory || res.data.department || res.data.dept || payload.department,
          };
          setItemCategories((p) =>
            p.map((x) => (x._id === form._id || x.id === form._id ? updated : x))
          );
        } else {
          // local fallback update
          setItemCategories((p) =>
            p.map((x) => (x._id === form._id || x.id === form._id ? { ...x, ...payload } : x))
          );
        }
      } else {
        // CREATE
        const res = await axios
          .post(`${API_BASE}/api/item-categories`, payload)
          .catch((err) => {
            console.error("create item-category error:", err);
            return null;
          });

        const created = res?.data
          ? {
              _id: res.data._id || res.data.id,
              name: res.data.name,
              code: res.data.code,
              departmentCategory:
                res.data.departmentCategory || res.data.department || res.data.dept || payload.department,
            }
          : { ...payload, _id: `local_${Date.now()}` };

        setItemCategories((p) => [created, ...p]);
      }

      setShowForm(false);
      setForm(emptyForm());
    } catch (err) {
      console.error("save error", err);
      setError(err.response?.data?.message || "Failed to save item category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (it) => {
    if (!window.confirm(`Delete item category ${it.name || it._id}?`)) return;
    try {
      setItemCategories((p) => p.filter((x) => (x._id || x.id) !== (it._id || it.id)));
      await axios.delete(`${API_BASE}/api/item-categories/${it._id || it.id}`).catch(() => null);
    } catch (err) {
      console.error("delete error", err);
      setError("Failed to delete item category");
      await loadData();
    }
  };

  // -----------------------
  // render
  // -----------------------
  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>Item Categories (Master)</h2>
          <p>Create and manage item categories. Assign each item-category to an existing Department.</p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="sa-primary-button" type="button" onClick={openCreateForm}>
            <i className="ri-add-line" /> Add Category
          </button>
        </div>
      </div>

      {error && (
        <div className="sa-modal-error" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div
        className="sa-card"
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <label>
          Item Category
          <input
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="Search category..."
            style={{ marginLeft: 8 }}
          />
        </label>

        <label>
          Department
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="">All</option>
            {departments.map((d) => (
              <option key={d._id || d.code || d.name} value={d._id || d.code || d.name}>
                {d.name || d.code || d._id}
              </option>
            ))}
          </select>
        </label>

        <div style={{ marginLeft: "auto", color: "#9ca3af" }}>
          Showing {filtered.length} / {itemCategories.length}
        </div>
      </div>

      <div className="sa-card">
        {loading ? (
          <div>Loading item categories...</div>
        ) : filtered.length === 0 ? (
          <div>No item categories found. Add one using "Add Category".</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Item Category</th>
                <th>Code</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it._id || it.id || it.code}>
                  <td>{it.name}</td>
                  <td>{it.code}</td>
                  <td>{getDeptName(it.departmentCategory)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="sa-secondary-button" onClick={() => openEditForm(it)} title="Edit">
                      <i className="ri-edit-line" />
                    </button>
                    <button
                      className="sa-secondary-button"
                      onClick={() => {
                        navigator.clipboard?.writeText(JSON.stringify(it));
                        alert("Copied");
                      }}
                      title="Copy JSON"
                    >
                      <i className="ri-file-copy-line" />
                    </button>
                    <button className="sa-secondary-button" onClick={() => handleDelete(it)} title="Delete">
                      <i className="ri-delete-bin-6-line" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create / Edit */}
      {showForm && (
        <div className="sa-modal-backdrop" onClick={() => !saving && setShowForm(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <h3 style={{ marginBottom: 6 }}>{form._id ? "Edit Item Category" : "Add Item Category"}</h3>
            <p className="sa-modal-sub">Give a name, code (auto) and assign a Department.</p>

            <form className="sa-modal-form" onSubmit={handleSubmit}>
              <label>
                Item Category Name *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Utensils"
                  required
                />
              </label>

              <label>
                Code (auto)
                <input
                  name="code"
                  value={form.code || generateCodeFromName(form.name)}
                  disabled
                  style={{ background: "#f3f4f6" }}
                />
              </label>

              <label>
                Department *
                <select
                  name="departmentCategory"
                  value={form.departmentCategory}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d._id || d.code || d.name} value={d._id || d.code || d.name}>
                      {d.name || d.code || d._id}
                    </option>
                  ))}
                </select>
              </label>

              {error && (
                <div className="sa-modal-error" style={{ marginTop: 8 }}>
                  {error}
                </div>
              )}

              <div className="sa-modal-actions" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="sa-secondary-button"
                  onClick={() => !saving && setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="sa-primary-button" disabled={saving}>
                  {saving ? "Saving..." : form._id ? "Update Category" : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemCategoryMaster;
