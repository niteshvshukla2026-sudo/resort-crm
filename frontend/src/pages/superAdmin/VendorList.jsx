// src/pages/superAdmin/VendorList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useResort } from "../../context/ResortContext";

const API_BASE =
  (import.meta.env.VITE_API_BASE || "http://localhost:5000") + "/api";

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
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  gstNumber: "",
  panNumber: "",
  fssaiNumber: "",
  paymentTerms: "",
  creditLimit: "",
  paymentMode: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  branch: "",
  deliveryTime: "",
  minOrderQty: "",
  status: "Active",
  notes: "",
});

const VendorList = () => {
  const { selectedResort } = useResort(); // 🌍 GLOBAL RESORT

  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [resorts, setResorts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // filters
  const [filterName, setFilterName] = useState("");
  const [filterCode, setFilterCode] = useState("");

  // ---------------------------------------
  // LOAD VENDORS (RESORT WISE)
  // ---------------------------------------
  const loadVendors = async () => {
    try {
      setLoading(true);
      setError("");

      const url =
        selectedResort && selectedResort !== "ALL"
          ? `${API_BASE}/vendors?resort=${selectedResort}`
          : `${API_BASE}/vendors`;

      const res = await axios.get(url);
      const list = Array.isArray(res.data) ? res.data : [];

      const normalized = list.map((v) => ({
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
      }));

      setVendors(normalized);
    } catch (err) {
      console.error("load vendors error", err);
      setError("Failed to load vendors");
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------
  // LOAD CATEGORIES
  // ---------------------------------------
  const loadCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/item-categories`);
      const arr = Array.isArray(res.data) ? res.data : [];
      setCategories(arr.map((c) => c.name || c.code));
    } catch {
      setCategories([]);
    }
  };

  // ---------------------------------------
  // LOAD RESORTS (FOR FORM)
  // ---------------------------------------
  const loadResorts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/resorts`);
      const arr = res.data?.resorts || res.data || [];
      setResorts(
        arr.map((r) => ({
          id: r._id,
          name: r.name,
        }))
      );
    } catch {
      setResorts([]);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [selectedResort]);

  useEffect(() => {
    loadCategories();
    loadResorts();
  }, []);

  // ---------------------------------------
  // FILTER
  // ---------------------------------------
  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      if (
        filterName &&
        !v.name?.toLowerCase().includes(filterName.toLowerCase())
      )
        return false;
      if (
        filterCode &&
        !v.code?.toLowerCase().includes(filterCode.toLowerCase())
      )
        return false;
      return true;
    });
  }, [vendors, filterName, filterCode]);

  // ---------------------------------------
  // FORM
  // ---------------------------------------
  const openCreateForm = () => {
    if (selectedResort === "ALL") {
      alert("Please select a resort first");
      return;
    }
    setForm({
      ...emptyForm(),
      resorts: [selectedResort], // 🔥 auto attach
    });
    setShowForm(true);
  };

  const openEditForm = (v) => {
    setForm({
      ...emptyForm(),
      ...v,
      resorts: v.resorts || [],
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const toggleCategory = (c) => {
    setForm((p) => {
      const set = new Set(p.categories);
      set.has(c) ? set.delete(c) : set.add(c);
      return { ...p, categories: Array.from(set) };
    });
  };

  const toggleResort = (id) => {
    setForm((p) => {
      const set = new Set(p.resorts);
      set.has(id) ? set.delete(id) : set.add(id);
      return { ...p, resorts: Array.from(set) };
    });
  };

  // ---------------------------------------
  // SAVE
  // ---------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Vendor name required");

    try {
      setSaving(true);

      const payload = {
        ...form,
        resorts:
          form.resorts && form.resorts.length
            ? form.resorts
            : [selectedResort],
      };

      if (form._id) {
        await axios.put(`${API_BASE}/vendors/${form._id}`, payload);
      } else {
        await axios.post(`${API_BASE}/vendors`, payload);
      }

      setShowForm(false);
      setForm(emptyForm());
      loadVendors();
    } catch (err) {
      console.error("save vendor error", err);
      setError("Failed to save vendor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`Delete vendor ${v.name}?`)) return;
    await axios.delete(`${API_BASE}/vendors/${v._id}`);
    loadVendors();
  };

  // ---------------------------------------
  // UI
  // ---------------------------------------
  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>Vendors</h2>
          <p>
            Showing vendors for{" "}
            <strong>
              {selectedResort === "ALL" ? "All Resorts" : "Selected Resort"}
            </strong>
          </p>
        </div>

        <button className="sa-primary-button" onClick={openCreateForm}>
          <i className="ri-add-line" /> New Vendor
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
          {filtered.length} / {vendors.length}
        </div>
      </div>

      {/* List */}
      <div className="sa-card">
        {loading ? (
          <div>Loading vendors...</div>
        ) : filtered.length === 0 ? (
          <div>No vendors found</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
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
                  <td>{v.categories.join(", ")}</td>
                  <td>{v.resorts.join(", ")}</td>
                  <td>{v.status}</td>
                  <td>
                    <button
                      className="sa-secondary-button"
                      onClick={() => openEditForm(v)}
                    >
                      <i className="ri-edit-line" />
                    </button>
                    <button
                      className="sa-secondary-button"
                      onClick={() => handleDelete(v)}
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
            <h3>{form._id ? "Edit Vendor" : "New Vendor"}</h3>

            <form onSubmit={handleSubmit}>
              <label>
                Vendor Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Code
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                />
              </label>

              <label>
                Categories
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {categories.map((c) => (
                    <label key={c}>
                      <input
                        type="checkbox"
                        checked={form.categories.includes(c)}
                        onChange={() => toggleCategory(c)}
                      />{" "}
                      {c}
                    </label>
                  ))}
                </div>
              </label>

              <label>
                Resorts
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {resorts.map((r) => (
                    <label key={r.id}>
                      <input
                        type="checkbox"
                        checked={form.resorts.includes(r.id)}
                        onChange={() => toggleResort(r.id)}
                      />{" "}
                      {r.name}
                    </label>
                  ))}
                </div>
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

export default VendorList;
