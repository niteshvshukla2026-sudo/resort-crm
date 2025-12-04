// src/pages/superAdmin/ResortList.jsx
// UPDATED: hard-coded Maharashtra locations + full field validation (inline errors)

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// --- 10 dummy resorts for dev/demo ---
const DEV_RESORTS = [
  {
    _id: "dev_res_1",
    name: "Azure Bay Resort",
    code: "AZB",
    address: "Beach Road, Goa",
    locationZone: "Goa",
    ownerName: "Ramesh Kumar",
    ownerContact: "+919876543210",
    ownerEmail: "ramesh@example.com",
    ownerResdAddress: "House 12, Goa",
    ownerOffAddress: "Office Address",
    noOfKeys: 40,
    tieUpCategory: "Managed",
    qualityCategory: "5-Star",
    locationCategory: "Mainstream",
    fssaiNumber: "FSSAI12345",
    fssaiStatus: "active",
    renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().slice(0,10),
    isActive: true,
  },
];

const emptyForm = () => ({
  _id: undefined,
  name: "",
  code: "",
  address: "",
  locationZone: "",
  ownerName: "",
  ownerContact: "",
  ownerEmail: "",
  ownerResdAddress: "",
  ownerOffAddress: "",
  noOfKeys: "",
  tieUpCategory: "",
  qualityCategory: "",
  locationCategory: "",
  fssaiNumber: "",
  fssaiStatus: "",
  renewalDate: "",
  isActive: true,
});

const TIEUP_OPTIONS = ["Managed", "Marketed", "Owned", "Commissionable"];
const QUALITY_OPTIONS = ["5-Star", "4-Star", "3-Star", "Budget"];
const LOCATION_OPTIONS = ["Mainstream", "Offbeat"];

// --- Maharashtra cities & popular places (searchable via datalist) ---
const MAHA_CITIES = [
  "Mumbai",
  "Pune",
  "Nagpur",
  "Nashik",
  "Thane",
  "Aurangabad",
  "Solapur",
  "Kolhapur",
  "Amravati",
  "Nanded",
  "Ahmednagar",
  "Jalgaon",
  "Akola",
  "Latur",
  "Sangli",
  "Satara",
  "Ratnagiri",
  "Sindhudurg",
  "Palghar",
  "Raigad",
  "Chandrapur",
  "Gondia",
  "Buldhana",
  "Yavatmal",
  "Beed",
  "Parbhani",
  "Osmanabad",
  "Hingoli",
  "Jalna",
  "Washim",
  "Wardha",
  "Kalyan",
  "Dombivli",
  "Panvel",
  "Karjat",
  "Mahabaleshwar",
  "Lonavala",
  "Khandala",
  "Alibaug",
  "Matheran",
  "Panchgani",
  "Dapoli",
  "Devgad",
  "Chiplun",
  "Baramati",
  "Shirdi",
  "Malegaon",
  "Bhiwandi",
  "Vasai",
];

// helpers for date formatting/parsing
const pad = (n) => String(n).padStart(2, "0");

const formatISOToDDMMYYYY = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const parseDDMMYYYYToISO = (s) => {
  if (!s) return "";
  const parts = s.split("/");
  if (parts.length !== 3) return "";
  const [dd, mm, yyyy] = parts.map((p) => p.trim());
  if (!dd || !mm || !yyyy) return "";
  const day = Number(dd), month = Number(mm), year = Number(yyyy);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return "";
  return `${year}-${pad(month)}-${pad(day)}`;
};

const parseDDMMYYYYToDate = (s) => {
  const iso = parseDDMMYYYYToISO(s);
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d) ? null : d;
};

const ResortList = () => {
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [form, setForm] = useState(emptyForm());

  // Filters (names match form fields)
  const [filterName, setFilterName] = useState("");
  const [filterCode, setFilterCode] = useState("");
  const [filterLocationZone, setFilterLocationZone] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // "", "active", "inactive"
  const [filterTieUpCategory, setFilterTieUpCategory] = useState("");
  const [filterQualityCategory, setFilterQualityCategory] = useState("");
  const [filterLocationCategory, setFilterLocationCategory] = useState("");

  // validation state
  const [formErrors, setFormErrors] = useState({});

  const validators = {
    name: (v) => {
      if (!v || !v.trim()) return "Resort name is required";
      if (!/^[A-Za-z\s]+$/.test(v)) return "Only letters and spaces allowed";
      if (v.trim().length < 2) return "Too short";
      return "";
    },
    code: (v) => {
      if (!v || !v.trim()) return "Code required";
      return "";
    },
    address: (v) => {
      if (!v || !v.trim()) return "Address is required";
      return "";
    },
    locationZone: (v) => {
      if (!v || !v.trim()) return "Location/Zone is required";
      return "";
    },
    ownerName: (v) => {
      if (!v || !v.trim()) return "Owner name is required";
      if (!/^[A-Za-z\s]+$/.test(v)) return "Only letters and spaces allowed";
      return "";
    },
    ownerContact: (v) => {
      const digits = (v || "").replace(/\D/g, "");
      if (!digits) return "Owner contact is required";
      if (!/^\d{10}$/.test(digits)) return "Phone must be 10 digits";
      return "";
    },
    ownerEmail: (v) => {
      if (!v) return "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Invalid email";
      return "";
    },
    noOfKeys: (v) => {
      if (v === undefined || v === null || v === "") return "";
      if (!/^\d+$/.test(String(v))) return "Only numbers allowed";
      return "";
    },
    fssaiNumber: (v) => {
      if (!v) return "";
      if (!/^[A-Za-z0-9\-\/]+$/.test(v)) return "Invalid FSSAI number";
      return "";
    },
    renewalDate: (v) => {
      if (!v) return "";
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return "Use DD/MM/YYYY";
      return "";
    }
  };

  const validateField = (name, value) => {
    const fn = validators[name];
    if (!fn) return "";
    return fn(value);
  };

  const validateAll = (data) => {
    const keys = Object.keys(validators);
    const errors = {};
    keys.forEach((k) => {
      const err = validateField(k, data[k]);
      if (err) errors[k] = err;
    });
    return errors;
  };

  // Load resorts from server and merge with dev samples (no duplicates)
  const loadResorts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/api/resorts`).catch(() => ({ data: [] }));
      const server = Array.isArray(res.data) ? res.data : [];

      const normalize = (r) => ({
        ...r,
        _id: r._id || r.id || `${(r.name || "resort")}_${Math.floor(Math.random()*100000)}`,
      });

      const normalizedServer = server.map(normalize);
      const existingIds = new Set(normalizedServer.map((r) => r._id));
      const existingCodes = new Set(normalizedServer.map((r) => (r.code || "").toString().toLowerCase()));

      const samplesToAdd = DEV_RESORTS.filter(
        (d) => !existingIds.has(d._id) && !existingCodes.has((d.code || "").toString().toLowerCase())
      ).map(normalize);

      const merged = [...normalizedServer, ...samplesToAdd];

      if (merged.length === 0) {
        setResorts(DEV_RESORTS.map(normalize));
      } else {
        setResorts(merged);
      }
    } catch (err) {
      console.error("loadResorts error", err);
      setError("Failed to load resorts; using sample data");
      setResorts(DEV_RESORTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResorts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-generate code from resort name
  const generateCodeFromName = (name) => {
    if (!name) return "";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return words.map((w) => w[0]).join("").slice(0, 4).toUpperCase();
  };

  // Auto update FSSAI status when renewalDate changes
  useEffect(() => {
    if (!form.renewalDate) return;
    const rDate = parseDDMMYYYYToDate(form.renewalDate);
    if (!rDate) return;
    const today = new Date();
    const todayMid = new Date(today.toDateString());
    const status = rDate < todayMid ? "expired" : "active";
    setForm((p) => ({ ...p, fssaiStatus: status }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.renewalDate]);

  // Filters
  const filtered = useMemo(() => {
    return resorts.filter((r) => {
      if (filterName && !r.name?.toLowerCase().includes(filterName.toLowerCase())) return false;
      if (filterCode && !r.code?.toLowerCase().includes(filterCode.toLowerCase())) return false;
      if (filterLocationZone && !r.locationZone?.toLowerCase().includes(filterLocationZone.toLowerCase())) return false;
      if (filterStatus) {
        if (filterStatus === "active" && r.isActive === false) return false;
        if (filterStatus === "inactive" && r.isActive !== false) return false;
      }
      if (filterTieUpCategory && (r.tieUpCategory || "") !== filterTieUpCategory) return false;
      if (filterQualityCategory && (r.qualityCategory || "") !== filterQualityCategory) return false;
      if (filterLocationCategory && (r.locationCategory || "") !== filterLocationCategory) return false;
      return true;
    });
  }, [resorts, filterName, filterCode, filterLocationZone, filterStatus, filterTieUpCategory, filterQualityCategory, filterLocationCategory]);

  // form handlers (sanitization + immediate per-field validation)
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    let nextValue = type === "checkbox" ? checked : value;

    if (name === "ownerContact") {
      nextValue = (nextValue || "").replace(/\D/g, "").slice(0, 10);
    }

    if (name === "noOfKeys") {
      nextValue = (nextValue || "").replace(/[^0-9]/g, "");
    }

    if (name === "name" || name === "ownerName") {
      nextValue = (nextValue || "").replace(/[^A-Za-z\s]/g, "");
    }

    setForm((p) => {
      const next = { ...p, [name]: nextValue };
      if (name === "name") {
        const auto = generateCodeFromName(nextValue);
        if (!p.code || p.code === generateCodeFromName(p.name || "")) {
          next.code = auto;
        }
      }
      return next;
    });

    const err = validateField(name, nextValue);
    setFormErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const allErrors = validateAll(form);
    if (!form.name?.trim()) allErrors.name = allErrors.name || "Resort Name is required";
    if (!form.address?.trim()) allErrors.address = allErrors.address || "Address is required";
    if (!form.locationZone?.trim()) allErrors.locationZone = allErrors.locationZone || "Location / Zone is required";
    if (!form.ownerName?.trim()) allErrors.ownerName = allErrors.ownerName || "Owner Name is required";
    if (!form.ownerContact?.trim()) allErrors.ownerContact = allErrors.ownerContact || "Owner Contact is required";

    Object.keys(allErrors).forEach((k) => { if (!allErrors[k]) delete allErrors[k]; });

    setFormErrors(allErrors);

    if (Object.keys(allErrors).length > 0) {
      setError("Please fix the highlighted fields");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        code: form.code || generateCodeFromName(form.name || ""),
        address: form.address,
        locationZone: form.locationZone,
        ownerName: form.ownerName,
        ownerContact: form.ownerContact,
        ownerEmail: form.ownerEmail || undefined,
        ownerResdAddress: form.ownerResdAddress || undefined,
        ownerOffAddress: form.ownerOffAddress || undefined,
        noOfKeys: form.noOfKeys ? Number(form.noOfKeys) : undefined,
        tieUpCategory: form.tieUpCategory || undefined,
        qualityCategory: form.qualityCategory || undefined,
        locationCategory: form.locationCategory || undefined,
        fssaiNumber: form.fssaiNumber || undefined,
        fssaiStatus: form.fssaiStatus || undefined,
        renewalDate: form.renewalDate ? parseDDMMYYYYToISO(form.renewalDate) : undefined,
        isActive: !!form.isActive,
      };

      if (form._id) {
        const res = await axios.put(`${API_BASE}/api/resorts/${form._id}`, payload).catch(() => null);
        if (res?.data) {
          setResorts((p) => p.map((x) => (x._id === form._id || x.id === form._id ? res.data : x)));
        } else {
          setResorts((p) => p.map((x) => (x._id === form._id || x.id === form._id ? { ...x, ...payload } : x)));
        }
      } else {
        const res = await axios.post(`${API_BASE}/api/resorts`, payload).catch(() => null);
        const created = res?.data || { ...payload, _id: `local_${Date.now()}` };
        setResorts((p) => [created, ...p]);
      }

      setShowForm(false);
      setForm(emptyForm());
      setFormErrors({});
    } catch (err) {
      console.error("save resort error", err);
      setError(err.response?.data?.message || "Failed to save resort");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete resort ${r.name || r._id}?`)) return;
    try {
      setResorts((p) => p.filter((x) => (x._id || x.id) !== (r._id || r.id)));
      await axios.delete(`${API_BASE}/api/resorts/${r._id || r.id}`).catch(() => null);
    } catch (err) {
      console.error("delete resort error", err);
      setError("Failed to delete resort");
      await loadResorts();
    }
  };

  const toggleActive = async (r) => {
    try {
      const newStatus = !(r.isActive !== false);
      setResorts((p) => p.map((x) => (x._id === r._id ? { ...x, isActive: newStatus } : x)));
      await axios.put(`${API_BASE}/api/resorts/${r._id || r.id}`, { isActive: newStatus }).catch(() => null);
    } catch (err) {
      console.error("toggle active error", err);
      setError("Failed to update status");
      await loadResorts();
    }
  };

  // export filtered CSV
  const exportCSV = (list) => {
    const cols = ["name","code","address","locationZone","ownerName","ownerContact","noOfKeys","tieUpCategory","qualityCategory","locationCategory","fssaiNumber","fssaiStatus","renewalDate","isActive"];
    const rows = [cols.join(",")].concat(list.map((r) => cols.map((c) => {
      let v = r[c];
      if (c === "isActive") v = r.isActive === false ? "false" : "true";
      if (c === "renewalDate" && v) {
        v = formatISOToDDMMYYYY(v);
      }
      const s = String(v ?? "");
      if (s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g,'""')}"`;
      return s;
    }).join(",")));
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resorts-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>Resorts</h2>
          <p>Manage all properties connected to this purchase system.</p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="sa-secondary-button" onClick={() => exportCSV(filtered)}>
            Download
          </button>

          <button className="sa-primary-button" type="button" onClick={() => { setForm(emptyForm()); setFormErrors({}); setShowForm(true); }}>
            <i className="ri-add-line" /> New Resort
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            fontSize: "0.85rem",
            marginBottom: "8px",
            color: "#b91c1c",
            background: "rgba(250, 204, 210, 0.3)",
            padding: "8px",
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      {/* Filters */}
      <div
        className="sa-card"
        style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}
      >
        <label>
          Name
          <input value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="Search name" style={{ marginLeft: 8 }} />
        </label>

        <label>
          Code
          <input value={filterCode} onChange={(e) => setFilterCode(e.target.value)} placeholder="Code" style={{ marginLeft: 8 }} />
        </label>

        <label>
          Location/Zone
          <input list="maha-cities" value={filterLocationZone} onChange={(e) => setFilterLocationZone(e.target.value)} placeholder="Type or select city/place" style={{ marginLeft: 8 }} />
        </label>

        <label>
          Status
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label>
          Tie-up Category
          <select value={filterTieUpCategory} onChange={(e) => setFilterTieUpCategory(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">--</option>
            {TIEUP_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label>
          Quality Category
          <select value={filterQualityCategory} onChange={(e) => setFilterQualityCategory(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">--</option>
            {QUALITY_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </label>

        <label>
          Location Category
          <select value={filterLocationCategory} onChange={(e) => setFilterLocationCategory(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">--</option>
            {LOCATION_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>

        <div style={{ marginLeft: "auto", color: "#6b7280" }}>
          Showing {filtered.length} of {resorts.length}
        </div>
      </div>

      {/* List */}
      <div className="sa-card">
        {loading ? (
          <div style={{ fontSize: "0.9rem" }}>Loading resorts...</div>
        ) : filtered.length === 0 ? (
          <div style={{ fontSize: "0.9rem" }}>No resorts found. Add one to get started.</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Location/Zone</th>
                <th>Owner</th>
                <th>No of Keys</th>
                <th>Tie-up</th>
                <th>Quality</th>
                <th>Loc Category</th>
                <th>FSSAI</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r) => {
                const formattedRenewal = r.renewalDate ? formatISOToDDMMYYYY(r.renewalDate) : "-";
                return (
                  <tr key={r._id || r.id || r.code}>
                    <td>{r.code}</td>
                    <td>{r.name}</td>
                    <td>{r.locationZone}</td>
                    <td>
                      <div style={{fontWeight:500}}>{r.ownerName}</div>
                      <div style={{fontSize:12,color:"#6b7280"}}>{r.ownerContact}</div>
                    </td>
                    <td>{r.noOfKeys ?? "-"}</td>
                    <td>{r.tieUpCategory ?? "-"}</td>
                    <td>{r.qualityCategory ?? "-"}</td>
                    <td>{r.locationCategory ?? "-"}</td>
                    <td>
                      <div>{r.fssaiNumber || "-"}</div>
                      <div style={{fontSize:11, color:"#6b7280"}}>{r.fssaiStatus ? r.fssaiStatus.toUpperCase() : "-"}</div>
                      <div style={{fontSize:11, color:"#6b7280"}}>Renewal: {formattedRenewal}</div>
                    </td>
                    <td>
                      <span className={`sa-badge ${r.isActive === false ? "sa-badge-muted" : "sa-badge-success"}`}>
                        {r.isActive === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button title="View" className="sa-icon-button" onClick={() => { setViewItem(r); setShowView(true); }} style={{ marginRight: 6 }}>
                        <i className="ri-eye-line" />
                      </button>

                      <button title="Edit" className="sa-icon-button" onClick={() => {
                        setForm({
                          _id: r._id,
                          name: r.name || "",
                          code: r.code || generateCodeFromName(r.name),
                          address: r.address || "",
                          locationZone: r.locationZone || "",
                          ownerName: r.ownerName || "",
                          ownerContact: r.ownerContact || "",
                          ownerEmail: r.ownerEmail || "",
                          ownerResdAddress: r.ownerResdAddress || "",
                          ownerOffAddress: r.ownerOffAddress || "",
                          noOfKeys: r.noOfKeys || "",
                          tieUpCategory: r.tieUpCategory || "",
                          qualityCategory: r.qualityCategory || "",
                          locationCategory: r.locationCategory || "",
                          fssaiNumber: r.fssaiNumber || "",
                          fssaiStatus: r.fssaiStatus || "",
                          renewalDate: r.renewalDate ? formatISOToDDMMYYYY(r.renewalDate) : "",
                          isActive: r.isActive !== false,
                        });
                        setFormErrors({});
                        setShowForm(true);
                      }} style={{ marginRight: 6 }}>
                        <i className="ri-edit-line" />
                      </button>

                      <button title="Delete" className="sa-icon-button" onClick={() => handleDelete(r)}>
                        <i className="ri-delete-bin-6-line" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create / Edit */}
      {showForm && (
        <div className="sa-modal-backdrop" onClick={() => !saving && setShowForm(false)}>
          <div
            className="sa-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3 style={{ marginBottom: 6 }}>{form._id ? "Edit Resort" : "New Resort"}</h3>
            <p className="sa-modal-sub" style={{ marginBottom: 10 }}>
              Add or update a property which will be available for transactions.
            </p>

            <form
              className="sa-modal-form"
              onSubmit={handleSubmit}
              style={{ overflow: "auto", paddingRight: 8 }}
            >
              <label>
                Resort Name *
                <input name="name" value={form.name} onChange={handleFormChange} onBlur={() => setFormErrors(prev => ({ ...prev, name: validateField('name', form.name) }))} placeholder="Resort Name" required />
                {formErrors.name && <small style={{ color: "#b91c1c", display: "block" }}>{formErrors.name}</small>}
              </label>

              <label>
                Code (auto)
                <input name="code" value={form.code} onChange={handleFormChange} placeholder="Auto-generated code" />
                {formErrors.code && <small style={{ color: "#b91c1c", display: "block" }}>{formErrors.code}</small>}
                <small style={{display:"block", color:"#6b7280"}}>Auto-generated from name; you may override.</small>
              </label>

              <label>
                Address *
                <textarea name="address" value={form.address} onChange={handleFormChange} onBlur={() => setFormErrors(prev => ({ ...prev, address: validateField('address', form.address) }))} placeholder="Street, area, pin" required />
                {formErrors.address && <small style={{ color: "#b91c1c", display: "block" }}>{formErrors.address}</small>}
              </label>

              <label>
                Location / Zone *
                <input list="maha-cities" name="locationZone" value={form.locationZone} onChange={handleFormChange} onBlur={() => setFormErrors(prev => ({ ...prev, locationZone: validateField('locationZone', form.locationZone) }))} placeholder="e.g. Mumbai / Pune / Lonavala" required />
                {formErrors.locationZone && <small style={{ color: "#b91c1c", display: "block" }}>{formErrors.locationZone}</small>}
                <small style={{display:"block", color:"#6b7280"}}>Select from Maharashtra cities or type any other place.</small>
              </label>

              <label>
                Owner Name *
                <input name="ownerName" value={form.ownerName} onChange={handleFormChange} onBlur={() => setFormErrors(prev => ({ ...prev, ownerName: validateField('ownerName', form.ownerName) }))} placeholder="Owner full name" required />
                {formErrors.ownerName && <small style={{ color: "#b91c1c", display: "block" }}>{formErrors.ownerName}</small>}
              </label>

              <label>
                Owner Contact *
                <input name="ownerContact" value={form.ownerContact} onChange={handleFormChange} onBlur={() => setFormErrors(prev => ({ ...prev, ownerContact: validateField('ownerContact', form.ownerContact) }))} placeholder="10-digit phone" inputMode="numeric" maxLength={10} required />
                {formErrors.ownerContact && <small style={{ color: "#b91c1c", display: "block" }}>{formErrors.ownerContact}</small>}
              </label>

              <label>
                Owner Email
                <input type="email" name="ownerEmail" value={form.ownerEmail} onChange={handleFormChange} onBlur={() => setFormErrors(prev => ({ ...prev, ownerEmail: validateField('ownerEmail', form.ownerEmail) }))} placeholder="owner@example.com" />
                {formErrors.ownerEmail && <small style={{ color: "#b91c1c", display: "block" }}>{formErrors.ownerEmail}</small>}
              </label>

              <label>
                Owner Resd. Address
                <input name="ownerResdAddress" value={form.ownerResdAddress} onChange={handleFormChange} placeholder="Residential address" />
              </label>

              <label>
                Owner Off. Address
                <input name="ownerOffAddress" value={form.ownerOffAddress} onChange={handleFormChange} placeholder="Office address" />
              </label>

              <label>
                No of Keys
                <input type="number" name="noOfKeys" min="0" value={form.noOfKeys} onChange={handleFormChange} onBlur={() => setFormErrors(prev => ({ ...prev, noOfKeys: validateField('noOfKeys', form.noOfKeys) }))} placeholder="e.g. 20" />
                {formErrors.noOfKeys && <small style={{ color: "#b91c1c", display: "block" }}>{formErrors.noOfKeys}</small>}
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                <label>
                  Tie-up Category
                  <select name="tieUpCategory" value={form.tieUpCategory} onChange={handleFormChange}>
                    <option value="">--</option>
                    {TIEUP_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>

                <label>
                  Quality Category
                  <select name="qualityCategory" value={form.qualityCategory} onChange={handleFormChange}>
                    <option value="">--</option>
                    {QUALITY_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                  </select>
                </label>

                <label>
                  Location Category
                  <select name="locationCategory" value={form.locationCategory} onChange={handleFormChange}>
                    <option value="">--</option>
                    {LOCATION_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
              </div>

              <label>
                FSSAI License Number
                <input name="fssaiNumber" value={form.fssaiNumber} onChange={handleFormChange} onBlur={() => setFormErrors(prev => ({ ...prev, fssaiNumber: validateField('fssaiNumber', form.fssaiNumber) }))} placeholder="FSSAI / license no" />
                {formErrors.fssaiNumber && <small style={{ color: "#b91c1c", display: "block" }}>{formErrors.fssaiNumber}</small>}
              </label>

              <label>
                FSSAI License Status
                <select name="fssaiStatus" value={form.fssaiStatus} onChange={handleFormChange}>
                  <option value="">Select status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="pending">Pending</option>
                </select>
                <small style={{display:"block", color:"#6b7280"}}>Auto-updates from Renewal Date but you can override.</small>
              </label>

              <label>
                Renewal Date (dd/mm/yyyy)
                <input
                  name="renewalDate"
                  value={form.renewalDate}
                  onChange={handleFormChange}
                  onBlur={() => setFormErrors(prev => ({ ...prev, renewalDate: validateField('renewalDate', form.renewalDate) }))}
                  placeholder="dd/mm/yyyy"
                />
                {formErrors.renewalDate && <small style={{ color: "#b91c1c", display: "block" }}>{formErrors.renewalDate}</small>}
                <small style={{ display: "block", color: "#6b7280" }}>Enter date as DD/MM/YYYY. Status will auto-update based on this date.</small>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" name="isActive" checked={!!form.isActive} onChange={handleFormChange} />
                Active
              </label>

              {error && <div className="sa-modal-error" style={{ marginTop: 8 }}>{error}</div>}

              <div className="sa-modal-actions" style={{ marginTop: 12 }}>
                <button type="button" className="sa-secondary-button" onClick={() => !saving && setShowForm(false)}>
                  Cancel
                </button>

                <button type="submit" className="sa-primary-button" disabled={saving}>
                  {saving ? "Saving..." : form._id ? "Update Resort" : "Save Resort"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal (read-only full form) */}
      {showView && viewItem && (
        <div className="sa-modal-backdrop" onClick={() => setShowView(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <h3>{viewItem.name} <small style={{color:"#6b7280"}}>({viewItem.code})</small></h3>
            <p className="sa-modal-sub">Full resort details (read-only)</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              <div>
                <strong>Address</strong>
                <div style={{ color: "#374151" }}>{viewItem.address || "-"}</div>
              </div>
              <div>
                <strong>Location / Zone</strong>
                <div style={{ color: "#374151" }}>{viewItem.locationZone || "-"}</div>
              </div>

              <div>
                <strong>Owner Name</strong>
                <div style={{ color: "#374151" }}>{viewItem.ownerName || "-"}</div>
              </div>
              <div>
                <strong>Owner Contact</strong>
                <div style={{ color: "#374151" }}>{viewItem.ownerContact || "-"}</div>
              </div>

              <div>
                <strong>Owner Email</strong>
                <div style={{ color: "#374151" }}>{viewItem.ownerEmail || "-"}</div>
              </div>
              <div>
                <strong>No of Keys</strong>
                <div style={{ color: "#374151" }}>{viewItem.noOfKeys ?? "-"}</div>
              </div>

              <div>
                <strong>Tie-up Category</strong>
                <div style={{ color: "#374151" }}>{viewItem.tieUpCategory || "-"}</div>
              </div>
              <div>
                <strong>Quality Category</strong>
                <div style={{ color: "#374151" }}>{viewItem.qualityCategory || "-"}</div>
              </div>

              <div>
                <strong>Location Category</strong>
                <div style={{ color: "#374151" }}>{viewItem.locationCategory || "-"}</div>
              </div>
              <div>
                <strong>FSSAI Number</strong>
                <div style={{ color: "#374151" }}>{viewItem.fssaiNumber || "-"}</div>
              </div>

              <div>
                <strong>FSSAI Status</strong>
                <div style={{ color: "#374151" }}>{viewItem.fssaiStatus || "-"}</div>
              </div>
              <div>
                <strong>Renewal Date</strong>
                <div style={{ color: "#374151" }}>{viewItem.renewalDate ? formatISOToDDMMYYYY(viewItem.renewalDate) : "-"}</div>
              </div>

              <div>
                <strong>Residential Address</strong>
                <div style={{ color: "#374151" }}>{viewItem.ownerResdAddress || "-"}</div>
              </div>
              <div>
                <strong>Office Address</strong>
                <div style={{ color: "#374151" }}>{viewItem.ownerOffAddress || "-"}</div>
              </div>
            </div>

            <div className="sa-modal-actions" style={{ marginTop: 12 }}>
              <button type="button" className="sa-secondary-button" onClick={() => setShowView(false)}>Close</button>
              <button type="button" className="sa-primary-button" onClick={() => { setShowView(false); setShowForm(true); }}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* datalist for Maharashtra cities (used by both filter and form inputs) */}
      <datalist id="maha-cities">
        {MAHA_CITIES.map((c) => <option key={c} value={c} />)}
      </datalist>
    </div>
  );
};

export default ResortList;
