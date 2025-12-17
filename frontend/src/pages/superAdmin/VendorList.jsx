import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useResort } from "../../context/ResortContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const emptyForm = () => ({
  _id: undefined,
  code: "",
  name: "",
  vendorType: "",
  categories: [],
  resorts: [],
  contactPerson: "",
  phone: "",
  whatsapp: "",
  alternatePhone: "",
  email: "",
  gstNumber: "",
  panNumber: "",
  fssaiNumber: "",
  accountNumber: "",
  status: "Active",
});

const VendorList = () => {
  const { selectedResort } = useResort(); // 🌍 GLOBAL RESORT

  const [vendors, setVendors] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // filters
  const [filterName, setFilterName] = useState("");
  const [filterCode, setFilterCode] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterEmail, setFilterEmail] = useState("");

  // ---------------- LOADERS ----------------

  const loadVendors = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/vendors`);
      const arr = Array.isArray(res.data) ? res.data : [];
      setVendors(
        arr.map((v) => ({
          ...v,
          categories: Array.isArray(v.categories)
            ? v.categories
            : v.category
            ? [v.category]
            : [],
          resorts: Array.isArray(v.resorts)
            ? v.resorts
            : v.resort
            ? [v.resort]
            : [],
        }))
      );
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    const res = await axios.get(`${API_BASE}/api/item-categories`).catch(() => ({
      data: [],
    }));
    setCategories(
      (Array.isArray(res.data) ? res.data : []).map((c) =>
        typeof c === "string" ? c : c.name
      )
    );
  };

  const loadResorts = async () => {
    const res = await axios.get(`${API_BASE}/api/resorts`).catch(() => ({
      data: [],
    }));
    const arr = res.data?.resorts || res.data || [];
    setResorts(
      arr.map((r) => ({
        id: r._id || r.id,
        name: r.name,
      }))
    );
  };

  useEffect(() => {
    loadVendors();
    loadCategories();
    loadResorts();
  }, []);

  // ---------------- VALIDATION ----------------

  const validators = {
    code: (v) => (!v ? "Code required" : undefined),
    name: (v) => (!v ? "Name required" : undefined),
    category: (v) =>
      !v || v.length === 0 ? "Select at least one category" : undefined,
  };

  const validateAll = () => {
    const err = {};
    Object.keys(validators).forEach((k) => {
      const val = k === "category" ? form.categories : form[k];
      const msg = validators[k](val);
      if (msg) err[k] = msg;
    });
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  // ---------------- HANDLERS ----------------

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const toggleCategory = (cat) => {
    setForm((p) => ({
      ...p,
      categories: p.categories.includes(cat)
        ? p.categories.filter((c) => c !== cat)
        : [...p.categories, cat],
    }));
  };

  const toggleResort = (id) => {
    setForm((p) => ({
      ...p,
      resorts: p.resorts.includes(id)
        ? p.resorts.filter((r) => r !== id)
        : [...p.resorts, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateAll()) return;

    try {
      setSaving(true);
      const payload = {
        ...form,
        category: form.categories[0],
      };

      if (form._id) {
        const res = await axios.put(
          `${API_BASE}/api/vendors/${form._id}`,
          payload
        );
        setVendors((p) =>
          p.map((v) => (v._id === form._id ? res.data : v))
        );
      } else {
        const res = await axios.post(`${API_BASE}/api/vendors`, payload);
        setVendors((p) => [res.data, ...p]);
      }

      setShowForm(false);
      setForm(emptyForm());
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v) => {
    if (!window.confirm("Delete vendor?")) return;
    await axios.delete(`${API_BASE}/api/vendors/${v._id}`);
    setVendors((p) => p.filter((x) => x._id !== v._id));
  };

  // ---------------- FILTERED LIST (🔥 RESORT WISE) ----------------

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      // 🌍 Resort filter
      if (selectedResort) {
        const vr = (v.resorts || []).map(String);
        if (!vr.includes(String(selectedResort))) return false;
      }

      if (filterName && !v.name?.toLowerCase().includes(filterName.toLowerCase()))
        return false;
      if (filterCode && !v.code?.toLowerCase().includes(filterCode.toLowerCase()))
        return false;
      if (
        filterPhone &&
        !v.phone?.toLowerCase().includes(filterPhone.toLowerCase())
      )
        return false;
      if (
        filterEmail &&
        !v.email?.toLowerCase().includes(filterEmail.toLowerCase())
      )
        return false;

      return true;
    });
  }, [vendors, selectedResort, filterName, filterCode, filterPhone, filterEmail]);

  const findResortName = (id) =>
    resorts.find((r) => String(r.id) === String(id))?.name || id;

  // ---------------- UI ----------------

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <h2>Vendors</h2>
        <button className="sa-primary-button" onClick={() => setShowForm(true)}>
          + New Vendor
        </button>
      </div>

      {error && <div className="sa-modal-error">{error}</div>}

      <div className="sa-card" style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Name"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
        />
        <input
          placeholder="Code"
          value={filterCode}
          onChange={(e) => setFilterCode(e.target.value)}
        />
        <input
          placeholder="Phone"
          value={filterPhone}
          onChange={(e) => setFilterPhone(e.target.value)}
        />
        <input
          placeholder="Email"
          value={filterEmail}
          onChange={(e) => setFilterEmail(e.target.value)}
        />
        <div style={{ marginLeft: "auto" }}>
          Showing {filtered.length} / {vendors.length}
        </div>
      </div>

      <div className="sa-card">
        {loading ? (
          "Loading..."
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Categories</th>
                <th>Resorts</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v._id}>
                  <td>{v.code}</td>
                  <td>{v.name}</td>
                  <td>{v.phone}</td>
                  <td>{v.categories.join(", ")}</td>
                  <td>{v.resorts.map(findResortName).join(", ")}</td>
                  <td>{v.status}</td>
                  <td>
                    <button onClick={() => setForm(v) || setShowForm(true)}>
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(v)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="sa-modal-backdrop">
          <div className="sa-modal">
            <h3>{form._id ? "Edit Vendor" : "New Vendor"}</h3>

            <form onSubmit={handleSubmit}>
              <input
                name="name"
                placeholder="Vendor Name"
                value={form.name}
                onChange={handleChange}
              />
              {fieldErrors.name && (
                <div className="sa-field-error">{fieldErrors.name}</div>
              )}

              <input
                name="code"
                placeholder="Code"
                value={form.code}
                onChange={handleChange}
              />

              <div>
                {categories.map((c) => (
                  <label key={c}>
                    <input
                      type="checkbox"
                      checked={form.categories.includes(c)}
                      onChange={() => toggleCategory(c)}
                    />
                    {c}
                  </label>
                ))}
              </div>

              <div>
                {resorts.map((r) => (
                  <label key={r.id}>
                    <input
                      type="checkbox"
                      checked={form.resorts.includes(r.id)}
                      onChange={() => toggleResort(r.id)}
                    />
                    {r.name}
                  </label>
                ))}
              </div>

              <div className="sa-modal-actions">
                <button type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
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

export default VendorList;
