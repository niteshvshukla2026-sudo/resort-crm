// src/pages/superAdmin/ItemCategoryMaster.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// dev-sample categories (used if server empty)
const DEV_ITEM_CATEGORIES = [
  { _id: "dev_ic_1", name: "Utensils", code: "UTEN_101", departmentId: "", departmentName: "" },
  { _id: "dev_ic_2", name: "Glassware", code: "GLAS_102", departmentId: "", departmentName: "" },
  { _id: "dev_ic_3", name: "Cleaning Tools", code: "CLEAN_103", departmentId: "", departmentName: "" },
  { _id: "dev_ic_4", name: "Consumables", code: "CONS_104", departmentId: "", departmentName: "" },
  { _id: "dev_ic_5", name: "Electrics", code: "ELEC_105", departmentId: "", departmentName: "" },
];

const emptyForm = () => ({
  _id: undefined,
  name: "",
  code: "",
  departmentId: "", // store department _id yaha
});

const generateCodeFromName = (name = "") => {
  const base =
    name
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

// helper: map server item-category into UI shape
const mapItemCategory = (it) => {
  const dept = it.department || it.departmentCategory || it.dept || "";
  const departmentId =
    typeof dept === "object" ? dept._id || dept.id || "" : dept || "";
  const departmentName =
    typeof dept === "object" ? dept.name || dept.code || "" : it.departmentName || "";

  return {
    _id: it._id || it.id,
    name: it.name || "",
    code: it.code || generateCodeFromName(it.name || ""),
    departmentId,
    departmentName,
  };
};

// helper: map server department
const mapDepartment = (d) => ({
  _id: d._id || d.id,
  name: d.name || d.departmentName || d.code || "",
  code: d.code || "",
});

const ItemCategoryMaster = () => {
  const [itemCategories, setItemCategories] = useState([]);
  const [departments, setDepartments] = useState([]); // used to populate department dropdown
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // filters
  const [filterName, setFilterName] = useState("");
  const [filterDept, setFilterDept] = useState(""); // department _id

  // load existing item-categories and departments
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [icRes, deptRes] = await Promise.all([
        axios.get(`${API_BASE}/api/item-categories`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/departments`).catch(() => ({ data: [] })),
      ]);

      const serverIC = Array.isArray(icRes.data)
        ? icRes.data.map(mapItemCategory)
        : [];

      // 🔥 IMPORTANT FIX: handle { ok:true, departments:[...] } shape
      const deptDataRaw = deptRes.data || {};
      let deptArray = [];
      if (Array.isArray(deptDataRaw)) {
        deptArray = deptDataRaw;
      } else if (Array.isArray(deptDataRaw.departments)) {
        deptArray = deptDataRaw.departments;
      }
      const serverDepts = deptArray.map(mapDepartment);

      const finalIC = serverIC.length ? serverIC : DEV_ITEM_CATEGORIES;
      setItemCategories(finalIC);
      setDepartments(serverDepts);
    } catch (err) {
      console.error("load error", err);
      setError("Failed to load item categories / departments; using sample data");
      setItemCategories(DEV_ITEM_CATEGORIES);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // filters
  const filtered = useMemo(() => {
    return itemCategories.filter((it) => {
      if (
        filterName &&
        !it.name?.toLowerCase().includes(filterName.toLowerCase())
      )
        return false;
      if (filterDept && it.departmentId !== filterDept) return false;
      return true;
    });
  }, [itemCategories, filterName, filterDept]);

  // open create form
  const openCreateForm = () => {
    setForm(emptyForm());
    setError("");
    setShowForm(true);
  };

  // open edit
  const openEditForm = (it) => {
    setForm({
      _id: it._id || it.id,
      name: it.name || "",
      code: it.code || generateCodeFromName(it.name),
      departmentId: it.departmentId || "",
    });
    setError("");
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // create / update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.name.trim())
      return setError("Item Category name required");
    if (!form.departmentId || !form.departmentId.trim())
      return setError("Select Department Category");

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        code:
          form.code && form.code.trim()
            ? form.code.trim()
            : generateCodeFromName(form.name),
        // backend ke liye: department id ko dono naam se bhej diya
        department: form.departmentId,
        departmentCategory: form.departmentId,
      };

      if (form._id) {
        const res = await axios
          .put(`${API_BASE}/api/item-categories/${form._id}`, payload)
          .catch(() => null);

        if (res?.data) {
          const mapped = mapItemCategory(res.data);
          setItemCategories((p) =>
            p.map((x) =>
              x._id === form._id || x.id === form._id ? mapped : x
            )
          );
        } else {
          // optimistic update if server didn't respond with entity
          const dept = departments.find((d) => d._id === form.departmentId);
          setItemCategories((p) =>
            p.map((x) =>
              x._id === form._id || x.id === form._id
                ? {
                    ...x,
                    name: payload.name,
                    code: payload.code,
                    departmentId: form.departmentId,
                    departmentName: dept?.name || x.departmentName,
                  }
                : x
            )
          );
        }
      } else {
        const res = await axios
          .post(`${API_BASE}/api/item-categories`, payload)
          .catch(() => null);

        const created = res?.data
          ? mapItemCategory(res.data)
          : (() => {
              const dept = departments.find((d) => d._id === form.departmentId);
              return {
                _id: `local_${Date.now()}`,
                name: payload.name,
                code: payload.code,
                departmentId: form.departmentId,
                departmentName: dept?.name || "",
              };
            })();

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
      setItemCategories((p) =>
        p.filter((x) => (x._id || x.id) !== (it._id || it.id))
      );
      await axios
        .delete(`${API_BASE}/api/item-categories/${it._id || it.id}`)
        .catch(() => null);
    } catch (err) {
      console.error("delete error", err);
      setError("Failed to delete item category");
      await loadData();
    }
  };

  const resolveDepartmentName = (departmentId, fallbackName = "") => {
    if (!departmentId && fallbackName) return fallbackName;
    if (!departmentId) return "-";
    const d = departments.find((dept) => dept._id === departmentId);
    return d?.name || fallbackName || "-";
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>Item Categories (Master)</h2>
          <p>
            Create and manage item categories. Assign each item-category to an
            existing Department.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="sa-primary-button"
            type="button"
            onClick={openCreateForm}
          >
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
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span>Item Category</span>
          <input
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="Search category..."
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span>Department Category</span>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="">All</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <div style={{ marginLeft: "auto", color: "#9ca3af", fontSize: 13 }}>
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
                  <td>
                    {resolveDepartmentName(it.departmentId, it.departmentName)}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button
                      className="sa-secondary-button"
                      onClick={() => openEditForm(it)}
                      title="Edit"
                    >
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
                    <button
                      className="sa-secondary-button"
                      onClick={() => handleDelete(it)}
                      title="Delete"
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

      {/* Modal: Create / Edit */}
      {showForm && (
        <div
          className="sa-modal-backdrop"
          onClick={() => !saving && setShowForm(false)}
        >
          <div
            className="sa-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 700 }}
          >
            <h3 style={{ marginBottom: 6 }}>
              {form._id ? "Edit Item Category" : "Add Item Category"}
            </h3>
            <p className="sa-modal-sub">
              Give a name, code (auto) and assign a Department Category.
            </p>

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
                />
              </label>

              <label>
                Department Category *
                <select
                  name="departmentId"
                  value={form.departmentId}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
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
                <button
                  type="submit"
                  className="sa-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : form._id
                    ? "Update Category"
                    : "Save Category"}
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
