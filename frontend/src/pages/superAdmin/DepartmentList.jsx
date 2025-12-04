// src/pages/superAdmin/DepartmentList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// simplified dev samples (only name + code)
const DEV_DEPT_SAMPLES = [
  { _id: "dev_dept_1", name: "Food & Beverage", code: "FOOD_BEV_123" },
  { _id: "dev_dept_2", name: "Housekeeping", code: "HOUSEKPG_456" },
  { _id: "dev_dept_3", name: "Engineering", code: "ENG_789" },
  { _id: "dev_dept_4", name: "Front Office", code: "FRONT_OFF_234" },
  { _id: "dev_dept_5", name: "Banquets", code: "BANQ_345" },
  { _id: "dev_dept_6", name: "Security", code: "SEC_567" },
  { _id: "dev_dept_7", name: "IT", code: "IT_678" },
  { _id: "dev_dept_8", name: "Spa & Wellness", code: "SPA_890" },
  { _id: "dev_dept_9", name: "Retail Outlet", code: "RETAIL_012" },
  { _id: "dev_dept_10", name: "Purchasing", code: "PUR_901" },
];

const emptyForm = () => ({ _id: undefined, name: "", code: "" });

// generate a short code from name; ensure alnum + underscores, uppercase
const generateCodeFromName = (name = "") => {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "") // remove special chars
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3) // use up to 3 words
    .map((w) => (w.length <= 4 ? w : w.slice(0, 4)))
    .join("_");

  // append small random suffix to avoid collisions (keeps deterministic length)
  const suffix = Math.floor(Math.random() * 900 + 100); // 100..999
  const code = (base || "DEPT") + "_" + suffix;
  return code.slice(0, 20); // limit length
};

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // UI
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [showView, setShowView] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  // filters (only name/code)
  const [filterName, setFilterName] = useState("");
  const [filterCode, setFilterCode] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/api/departments`).catch(() => ({ data: [] }));
      const serverDepts = Array.isArray(res.data) ? res.data : [];
      // normalize to have only _id, name, code
      const normalized = serverDepts.map((d) => ({
        _id: d._id || d.id,
        name: d.name || d.title || "",
        code: d.code || (d.name ? generateCodeFromName(d.name) : generateCodeFromName("DEPT")),
      }));
      const existingIds = new Set(normalized.map((d) => d._id || d.id));
      const samplesToAdd = DEV_DEPT_SAMPLES.filter((s) => !existingIds.has(s._id));
      setDepartments([...normalized, ...samplesToAdd]);
    } catch (err) {
      console.error("load error", err);
      setError("Failed to load departments; using sample data");
      setDepartments(DEV_DEPT_SAMPLES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filters
  const filtered = useMemo(() => {
    return departments.filter((d) => {
      if (filterName && !d.name?.toLowerCase().includes(filterName.toLowerCase())) return false;
      if (filterCode && !d.code?.toLowerCase().includes(filterCode.toLowerCase())) return false;
      return true;
    });
  }, [departments, filterName, filterCode]);

  // open create
  const openCreateForm = () => {
    setForm(emptyForm());
    setError("");
    // auto-generate a placeholder code so user sees it
    setForm((f) => ({ ...f, code: generateCodeFromName("") }));
    setShowForm(true);
  };

  // open edit (name editable; code always readonly and regenerated only on name change)
  const openEditForm = (d) => {
    setForm({
      _id: d._id || d.id,
      name: d.name || "",
      code: d.code || generateCodeFromName(d.name || ""),
    });
    setError("");
    setShowForm(true);
  };

  // when name changes, update code automatically (auto-generated)
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      // update name and regenerate code deterministically (we keep suffix random to reduce collisions)
      // generateCodeFromName uses random suffix; acceptable for auto-gen
      setForm((p) => ({ ...p, name: value, code: generateCodeFromName(value) }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  // submit (create or update) — payload only { name, code }
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.name.trim()) return setError("Department name is required");

    try {
      setSaving(true);
      // always use auto-generated code based on final name (don't trust external edits)
      const codeToUse = generateCodeFromName(form.name);

      const payload = { name: form.name.trim(), code: codeToUse };

      if (form._id) {
        const res = await axios.put(`${API_BASE}/api/departments/${form._id}`, payload).catch(() => null);
        if (res?.data) {
          setDepartments((p) =>
            p.map((x) =>
              x._id === form._id || x.id === form._id
                ? { _id: res.data._id || res.data.id, name: res.data.name, code: res.data.code }
                : x
            )
          );
        } else {
          setDepartments((p) => p.map((x) => (x._id === form._id || x.id === form._id ? { ...x, ...payload } : x)));
        }
      } else {
        const res = await axios.post(`${API_BASE}/api/departments`, payload).catch(() => null);
        const created = res?.data ? { _id: res.data._id || res.data.id, name: res.data.name, code: res.data.code } : { ...payload, _id: `local_${Date.now()}` };
        setDepartments((p) => [created, ...p]);
      }

      setShowForm(false);
      setForm(emptyForm());
    } catch (err) {
      console.error("save error", err);
      setError(err.response?.data?.message || "Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (d) => {
    if (!window.confirm(`Delete department ${d.name || d._id}?`)) return;
    try {
      setDepartments((p) => p.filter((x) => (x._id || x.id) !== (d._id || d.id)));
      await axios.delete(`${API_BASE}/api/departments/${d._id || d.id}`).catch(() => null);
    } catch (err) {
      console.error("delete error", err);
      setError("Failed to delete department");
      await loadData();
    }
  };

  const openView = (d) => {
    setViewItem(d);
    setShowView(true);
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>Departments</h2>
          <p>Only Department Name is required — Code is auto-generated.</p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="sa-primary-button" type="button" onClick={openCreateForm}>
            <i className="ri-add-line" /> New Department
          </button>
        </div>
      </div>

      {error && <div className="sa-modal-error" style={{ marginBottom: 8 }}>{error}</div>}

      {/* Filters */}
      <div className="sa-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <label>
          Department Name
          <input value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="Search name..." style={{ marginLeft: 8 }} />
        </label>

        <label>
          Code
          <input value={filterCode} onChange={(e) => setFilterCode(e.target.value)} placeholder="Code..." style={{ marginLeft: 8 }} />
        </label>

        <div style={{ marginLeft: "auto", color: "#9ca3af" }}>
          Showing {filtered.length} / {departments.length}
        </div>
      </div>

      {/* List */}
      <div className="sa-card">
        {loading ? (
          <div>Loading departments...</div>
        ) : filtered.length === 0 ? (
          <div>No departments found. Try clearing filters or add a new department.</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Code</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((d) => (
                <tr key={d._id || d.id || d.name}>
                  <td>{d.name}</td>
                  <td>{d.code}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="sa-secondary-button" onClick={() => openView(d)} title="View" style={{ marginRight: 6 }}>
                      <i className="ri-eye-line" />
                    </button>

                    <button className="sa-secondary-button" onClick={() => openEditForm(d)} title="Edit" style={{ marginRight: 6 }}>
                      <i className="ri-edit-line" />
                    </button>

                    <button className="sa-secondary-button" onClick={() => handleDelete(d)} title="Delete">
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
          <div className="sa-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <h3 style={{ marginBottom: 6 }}>{form._id ? "Edit Department" : "New Department"}</h3>
            <p className="sa-modal-sub">Enter department name; code will be auto-generated.</p>

            <form className="sa-modal-form" onSubmit={handleSubmit} style={{ overflow: "auto", paddingRight: 8 }}>
              <label>
                Department Name *
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Food & Beverage" required />
              </label>

              <label>
                Code (auto)
                <input name="code" value={form.code || generateCodeFromName(form.name)} onChange={() => {}} placeholder="Auto-generated" disabled style={{ background: "#f3f4f6" }} />
              </label>

              {error && <div className="sa-modal-error" style={{ marginTop: 8 }}>{error}</div>}

              <div className="sa-modal-actions" style={{ marginTop: 12 }}>
                <button type="button" className="sa-secondary-button" onClick={() => !saving && setShowForm(false)}>
                  Cancel
                </button>

                <button type="submit" className="sa-primary-button" disabled={saving}>
                  {saving ? "Saving..." : form._id ? "Update Department" : "Save Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showView && viewItem && (
        <div className="sa-modal-backdrop" onClick={() => setShowView(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3>{viewItem.name}</h3>
            <p className="sa-modal-sub">Department details (read-only)</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
              <div>
                <strong>Name</strong>
                <div style={{ color: "#374151" }}>{viewItem.name || "-"}</div>
              </div>
              <div>
                <strong>Code</strong>
                <div style={{ color: "#374151" }}>{viewItem.code || "-"}</div>
              </div>
            </div>

            <div className="sa-modal-actions" style={{ marginTop: 12 }}>
              <button type="button" className="sa-secondary-button" onClick={() => setShowView(false)}>Close</button>
              <button type="button" className="sa-primary-button" onClick={() => { setShowView(false); openEditForm(viewItem); }}>Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentList;
