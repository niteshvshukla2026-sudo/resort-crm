// src/pages/superAdmin/VendorList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// --- 6 dev sample vendors for quick dev/demo (shortened) ---
const DEV_VENDORS = [
  {
    _id: "dev_vendor_1",
    code: "FF001",
    name: "FreshFoods Pvt Ltd",
    contactPerson: "Ravi Kumar",
    phone: "9876500011",
    whatsapp: "9876500011",
    alternatePhone: "",
    email: "sales@freshfoods.com",
    addressLine1: "123 Food St.",
    addressLine2: "Unit 4",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    country: "India",
    vendorType: "Company",
    category: "Food",
    gstNumber: "27AAAAA0000A1Z5",
    panNumber: "AAAAA0000A",
    fssaiNumber: "",
    paymentTerms: "30 Days",
    creditLimit: "50000",
    paymentMode: "Bank Transfer",
    bankName: "State Bank",
    accountNumber: "123456789012",
    ifsc: "SBIN0000001",
    branch: "Mumbai Main",
    deliveryTime: "1",
    minOrderQty: "1",
    status: "Active",
    notes: "Priority supplier",
  },
  {
    _id: "dev_vendor_2",
    code: "GLB02",
    name: "Global Supplies",
    phone: "9876500022",
    email: "contact@globalsupplies.com",
    city: "Goa",
    vendorType: "Distributor",
    category: "Housekeeping",
    status: "Active",
  },
  // add more as needed...
];

const emptyForm = () => ({
  _id: undefined,
  code: "",
  name: "",
  vendorType: "",
  category: "",
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
  country: "",
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
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [fieldErrors, setFieldErrors] = useState({});
  const [categories, setCategories] = useState([]); // item categories from master

  // filters
  const [filterName, setFilterName] = useState("");
  const [filterCode, setFilterCode] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterEmail, setFilterEmail] = useState("");

  // CSV upload
  const [csvError, setCsvError] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);

  // fetch vendors and categories
  const loadVendors = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/api/vendors`).catch(() => ({ data: [] }));
      const serverVendors = Array.isArray(res.data) ? res.data : [];
      const existingIdsOrCodes = new Set(serverVendors.map((v) => v._id || v.id || v.code));
      const toAdd = DEV_VENDORS.filter((s) => !existingIdsOrCodes.has(s._id) && !existingIdsOrCodes.has(s.code));
      setVendors([...serverVendors, ...toAdd]);
    } catch (err) {
      console.error("load vendors error", err);
      setError("Failed to load vendors; using sample data");
      setVendors(DEV_VENDORS);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // expecting your item category master endpoint here
      const res = await axios.get(`${API_BASE}/api/item-categories`).catch(() => ({ data: [] }));
      const cats = Array.isArray(res.data) ? res.data : [];
      // Accept either array of strings or array of objects with { name, code }
      const mapped = cats.map((c) => (typeof c === "string" ? c : c.name || c.code || JSON.stringify(c)));
      setCategories(mapped);
    } catch (err) {
      console.warn("Failed to load categories", err);
      setCategories([]); // fallback empty
    }
  };

  useEffect(() => {
    loadVendors();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateForm = () => {
    setForm(emptyForm());
    setFieldErrors({});
    setError("");
    setShowForm(true);
  };

  const openEditForm = (v) => {
    setForm({
      _id: v._id || v.id,
      code: v.code || "",
      name: v.name || "",
      vendorType: v.vendorType || "",
      category: v.category || "",
      contactPerson: v.contactPerson || "",
      phone: v.phone || "",
      whatsapp: v.whatsapp || "",
      alternatePhone: v.alternatePhone || "",
      email: v.email || "",
      addressLine1: v.addressLine1 || "",
      addressLine2: v.addressLine2 || "",
      city: v.city || v.address || "",
      state: v.state || "",
      pincode: v.pincode || "",
      country: v.country || "",
      gstNumber: v.gstNumber || "",
      panNumber: v.panNumber || "",
      fssaiNumber: v.fssaiNumber || "",
      paymentTerms: v.paymentTerms || "",
      creditLimit: v.creditLimit || "",
      paymentMode: v.paymentMode || "",
      bankName: v.bankName || "",
      accountNumber: v.accountNumber || "",
      ifsc: v.ifsc || "",
      branch: v.branch || "",
      deliveryTime: v.deliveryTime || "",
      minOrderQty: v.minOrderQty || "",
      status: v.status || "Active",
      notes: v.notes || "",
    });
    setFieldErrors({});
    setError("");
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // clear error for field as user types
    setFieldErrors((p) => {
      const copy = { ...p };
      delete copy[name];
      return copy;
    });
    setForm((p) => ({ ...p, [name]: value }));
  };

  // validation helpers
  const isEmpty = (v) => v === undefined || v === null || String(v).trim() === "";

  const validators = {
    code: (v) => (!v ? "Vendor code is required" : undefined),
    name: (v) => (!v ? "Vendor name is required" : undefined),
    phone: (v) =>
      !v
        ? undefined
        : !/^\d{10}$/.test(String(v).trim())
        ? "Phone should be 10 digits"
        : undefined,
    whatsapp: (v) =>
      !v
        ? undefined
        : !/^\d{10}$/.test(String(v).trim())
        ? "WhatsApp should be 10 digits"
        : undefined,
    email: (v) =>
      !v
        ? undefined
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim())
        ? "Invalid email"
        : undefined,
    gstNumber: (v) =>
      !v
        ? undefined
        : !/^[0-9A-Z]{15}$/.test(String(v).trim())
        ? "GSTIN must be 15 chars (alphanumeric uppercase)"
        : undefined,
    panNumber: (v) =>
      !v
        ? undefined
        : !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(v).trim())
        ? "PAN must be 10 chars (AAAAA9999A)"
        : undefined,
    ifsc: (v) =>
      !v
        ? undefined
        : !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(v).trim())
        ? "IFSC invalid (e.g. SBIN0000001)"
        : undefined,
    pincode: (v) =>
      !v
        ? undefined
        : !/^[1-9][0-9]{5}$/.test(String(v).trim())
        ? "Pincode must be 6 digits"
        : undefined,
    accountNumber: (v) =>
      !v
        ? undefined
        : !/^[0-9]{6,20}$/.test(String(v).trim())
        ? "Account number must be 6-20 digits"
        : undefined,
    creditLimit: (v) =>
      !v
        ? undefined
        : isNaN(Number(v))
        ? "Credit limit must be a number"
        : undefined,
    deliveryTime: (v) =>
      !v
        ? undefined
        : !/^\d+$/.test(String(v).trim())
        ? "Delivery time must be whole days number"
        : undefined,
    minOrderQty: (v) =>
      !v
        ? undefined
        : !/^\d+$/.test(String(v).trim())
        ? "MOQ must be a number"
        : undefined,
  };

  const validateAll = () => {
    const keys = Object.keys(validators);
    const newErr = {};
    keys.forEach((k) => {
      const msg = validators[k](form[k]);
      if (msg) newErr[k] = msg;
    });

    // additional required fields
    if (!form.name) newErr.name = "Vendor name is required";
    if (!form.code) newErr.code = "Vendor code is required";
    // category should be selected ideally
    if (!form.category) newErr.category = "Category is required";

    setFieldErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateAll()) {
      setError("Please fix the validation errors");
      return;
    }

    try {
      setSaving(true);
      const payload = { ...form };
      // remove local-only _id on create
      if (!form._id) delete payload._id;

      if (form._id && String(form._id).startsWith("local_")) {
        // local id created earlier; create on server
        const res = await axios.post(`${API_BASE}/api/vendors`, payload).catch(() => null);
        const created = res?.data || { ...payload, _id: form._id };
        setVendors((p) => p.map((x) => (x._id === form._id || x.id === form._id ? created : x)));
      } else if (form._id) {
        const res = await axios.put(`${API_BASE}/api/vendors/${form._id}`, payload).catch(() => null);
        if (res?.data) {
          setVendors((p) => p.map((x) => (x._id === form._id || x.id === form._id ? res.data : x)));
        } else {
          setVendors((p) => p.map((x) => (x._id === form._id || x.id === form._id ? { ...x, ...payload } : x)));
        }
      } else {
        const res = await axios.post(`${API_BASE}/api/vendors`, payload).catch(() => null);
        const created = res?.data || { ...payload, _id: `local_${Date.now()}` };
        setVendors((p) => [created, ...p]);
      }

      setShowForm(false);
      setForm(emptyForm());
      setFieldErrors({});
    } catch (err) {
      console.error("save vendor error", err);
      setError(err?.response?.data?.message || "Failed to save vendor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`Delete vendor ${v.name || v.code}?`)) return;
    try {
      setVendors((p) => p.filter((x) => (x._id || x.id || x.code) !== (v._id || v.id || v.code)));
      await axios.delete(`${API_BASE}/api/vendors/${v._id || v.id || v.code}`).catch(() => null);
    } catch (err) {
      console.error("delete vendor error", err);
      setError("Failed to delete vendor");
      await loadVendors();
    }
  };

  // CSV upload & parsing (supports extended mapping)
  const handleCSVUpload = (file) => {
    setCsvError("");
    if (!file) return;
    setCsvLoading(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      const rows = text.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
      if (rows.length === 0) {
        setCsvError("Empty CSV file");
        setCsvLoading(false);
        return;
      }

      const header = rows[0].split(",").map((h) => h.trim().toLowerCase());
      const headerSet = new Set(header);
      // require at least code and name
      if (!headerSet.has("code") || !headerSet.has("name")) {
        setCsvError("CSV must contain at least: code,name columns");
        setCsvLoading(false);
        return;
      }

      const parsed = [];
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(",").map((c) => c.trim());
        if (cols.length === 0) continue;
        const obj = {};
        for (let c = 0; c < header.length; c++) obj[header[c]] = cols[c] ?? "";
        parsed.push(obj);
      }

      if (parsed.length === 0) {
        setCsvError("No data rows in CSV");
        setCsvLoading(false);
        return;
      }

      const payloads = parsed.map((p) => ({
        code: p.code || "",
        name: p.name || "",
        vendorType: p.vendortype || p.vendor_type || "",
        category: p.category || "",
        contactPerson: p.contactperson || p.contact_person || p.contact || "",
        phone: p.phone || p.contact || "",
        whatsapp: p.whatsapp || "",
        alternatePhone: p.alternatephone || p.altphone || p.alt_phone || "",
        email: p.email || "",
        addressLine1: p.addressline1 || p.address || p.address_line_1 || "",
        addressLine2: p.addressline2 || p.address_line_2 || "",
        city: p.city || "",
        state: p.state || "",
        pincode: p.pincode || p.pin || "",
        country: p.country || "",
        gstNumber: p.gstnumber || p.gst || "",
        panNumber: p.pannumber || p.pan || "",
        fssaiNumber: p.fssainumber || p.fssai || "",
        paymentTerms: p.paymentterms || p.payment_terms || "",
        creditLimit: p.creditlimit || p.credit_limit || "",
        paymentMode: p.paymentmode || p.payment_mode || "",
        bankName: p.bankname || p.bank_name || "",
        accountNumber: p.accountnumber || p.account_number || "",
        ifsc: p.ifsc || "",
        branch: p.branch || "",
        deliveryTime: p.deliverytime || p.leadtime || "",
        minOrderQty: p.minqty || p.min_order_qty || p.min_order_quantity || "",
        status: p.status || "Active",
        notes: p.notes || "",
      }));

      // optimistic add locally
      const localAdded = payloads.map((pl) => ({ ...pl, _id: `local_${Date.now()}_${Math.floor(Math.random() * 1000)}` }));
      setVendors((prev) => [...localAdded, ...prev]);

      // attempt server creates sequentially
      try {
        for (const pl of payloads) {
          try {
            const res = await axios.post(`${API_BASE}/api/vendors`, pl).catch(() => null);
            if (res?.data) {
              // replace local created by code match
              setVendors((prev) => prev.map((it) => (it.code === pl.code ? res.data : it)));
            }
          } catch (err) {
            console.warn("vendor CSV create failed for", pl.code, err);
          }
        }
      } catch (err) {
        console.error("CSV bulk create error", err);
      } finally {
        setCsvLoading(false);
      }
    };

    reader.onerror = () => {
      setCsvError("Failed to read file");
      setCsvLoading(false);
    };

    reader.readAsText(file);
  };

  // Export current filtered list to CSV (extended columns)
  const handleExportCSV = (list) => {
    const cols = [
      "code",
      "name",
      "vendorType",
      "category",
      "contactPerson",
      "phone",
      "whatsapp",
      "alternatePhone",
      "email",
      "addressLine1",
      "addressLine2",
      "city",
      "state",
      "pincode",
      "country",
      "gstNumber",
      "panNumber",
      "fssaiNumber",
      "paymentTerms",
      "creditLimit",
      "paymentMode",
      "bankName",
      "accountNumber",
      "ifsc",
      "branch",
      "deliveryTime",
      "minOrderQty",
      "status",
      "notes",
    ];
    const rows = [cols.join(",")].concat(
      list.map((v) =>
        cols
          .map((c) => {
            const s = String(v[c] ?? "");
            if (s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
            return s;
          })
          .join(",")
      )
    );
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendors-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // filtered vendors
  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      if (filterName && !v.name?.toLowerCase().includes(filterName.toLowerCase())) return false;
      if (filterCode && !v.code?.toLowerCase().includes(filterCode.toLowerCase())) return false;
      if (filterCity && !v.city?.toLowerCase().includes(filterCity.toLowerCase())) return false;
      if (filterPhone && !v.phone?.toLowerCase().includes(filterPhone.toLowerCase())) return false;
      if (filterEmail && !v.email?.toLowerCase().includes(filterEmail.toLowerCase())) return false;
      return true;
    });
  }, [vendors, filterName, filterCode, filterCity, filterPhone, filterEmail]);

  // unique cities for dropdown filter
  const cities = useMemo(() => Array.from(new Set(vendors.map((x) => x.city).filter(Boolean))), [vendors]);

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>Vendors</h2>
          <p>Approved suppliers for all resort purchases.</p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                handleCSVUpload(f);
                e.target.value = "";
              }}
              title="Upload CSV (columns: code,name,contactPerson,phone,email,city,... )"
            />
            {csvLoading ? <span style={{ marginLeft: 6 }}>Uploading...</span> : <span style={{ marginLeft: 6 }}>Upload CSV</span>}
          </label>

          <button className="sa-secondary-button" onClick={() => handleExportCSV(filtered)}>
            Export CSV
          </button>

          <button className="sa-primary-button" type="button" onClick={openCreateForm}>
            <i className="ri-add-line" /> New Vendor
          </button>
        </div>
      </div>

      {error && <div className="sa-modal-error" style={{ marginBottom: 8 }}>{error}</div>}
      {csvError && <div className="sa-modal-error" style={{ marginBottom: 8 }}>{csvError}</div>}

      {/* Filters */}
      <div className="sa-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <label>
          Name
          <input value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="Search name..." style={{ marginLeft: 8 }} />
        </label>

        <label>
          Code
          <input value={filterCode} onChange={(e) => setFilterCode(e.target.value)} placeholder="Code..." style={{ marginLeft: 8 }} />
        </label>

        <label>
          City
          <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label>
          Phone
          <input value={filterPhone} onChange={(e) => setFilterPhone(e.target.value)} placeholder="Phone..." style={{ marginLeft: 8 }} />
        </label>

        <label>
          Email
          <input value={filterEmail} onChange={(e) => setFilterEmail(e.target.value)} placeholder="Email..." style={{ marginLeft: 8 }} />
        </label>

        <div style={{ marginLeft: "auto", color: "#9ca3af" }}>
          Showing {filtered.length} / {vendors.length}
        </div>
      </div>

      <div className="sa-card">
        {loading ? (
          <div>Loading vendors...</div>
        ) : filtered.length === 0 ? (
          <div>No vendors match the filters. Add vendor or try clearing filters.</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Vendor Name</th>
                <th>Contact</th>
                <th>Email</th>
                <th>City</th>
                <th>GST</th>
                <th>Payment Terms</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((v) => (
                <tr key={v._id || v.id || v.code}>
                  <td>{v.code}</td>
                  <td>{v.name}</td>
                  <td>
                    {v.contactPerson ? <div>{v.contactPerson}</div> : null}
                    <div>{v.phone}{v.whatsapp ? ` (wa: ${v.whatsapp})` : ""}</div>
                  </td>
                  <td>{v.email}</td>
                  <td>{v.city}</td>
                  <td>{v.gstNumber}</td>
                  <td>{v.paymentTerms}</td>
                  <td>{v.status}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="sa-secondary-button" onClick={() => openEditForm(v)} title="Edit">
                      <i className="ri-edit-line" />
                    </button>
                    <button className="sa-secondary-button" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(v)); }} title="Copy JSON">
                      <i className="ri-file-copy-line" />
                    </button>
                    <button className="sa-secondary-button" onClick={() => handleDelete(v)} title="Delete">
                      <i className="ri-delete-bin-6-line" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: create/edit */}
      {showForm && (
        <div className="sa-modal-backdrop" onClick={() => !saving && setShowForm(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{form._id ? "Edit Vendor" : "New Vendor"}</h3>
            <p className="sa-modal-sub">Add or update a supplier used in purchase orders.</p>

            <form className="sa-modal-form" onSubmit={handleSubmit}>

              <label>
                Vendor Name *
                <input name="name" value={form.name} onChange={handleChange} placeholder="FreshFoods Supplier" />
                {fieldErrors.name && <div className="sa-field-error">{fieldErrors.name}</div>}
              </label>

              <label>
                Code *
                <input name="code" value={form.code} onChange={handleChange} placeholder="FFS" />
                {fieldErrors.code && <div className="sa-field-error">{fieldErrors.code}</div>}
              </label>

              <label>
                Vendor Type
                <select name="vendorType" value={form.vendorType} onChange={handleChange}>
                  <option value="">Select type</option>
                  <option value="Company">Company</option>
                  <option value="Individual">Individual</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Manufacturer">Manufacturer</option>
                </select>
              </label>

              <label>
                Category * (from Item Category master)
                <select name="category" value={form.category} onChange={handleChange}>
                  <option value="">Select category</option>
                  {categories.length === 0 ? (
                    <option value="">(no categories)</option>
                  ) : (
                    categories.map((c) => <option key={c} value={c}>{c}</option>)
                  )}
                </select>
                {fieldErrors.category && <div className="sa-field-error">{fieldErrors.category}</div>}
              </label>

              <label>
                Contact Person
                <input name="contactPerson" value={form.contactPerson} onChange={handleChange} placeholder="Name" />
              </label>

              <label>
                Phone
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" />
                {fieldErrors.phone && <div className="sa-field-error">{fieldErrors.phone}</div>}
              </label>

              <label>
                WhatsApp
                <input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="WhatsApp number" />
                {fieldErrors.whatsapp && <div className="sa-field-error">{fieldErrors.whatsapp}</div>}
              </label>

              <label>
                Alternate Phone
                <input name="alternatePhone" value={form.alternatePhone} onChange={handleChange} placeholder="Alternate" />
              </label>

              <label>
                Email
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="vendor@example.com" />
                {fieldErrors.email && <div className="sa-field-error">{fieldErrors.email}</div>}
              </label>

              <label>
                Address Line 1
                <input name="addressLine1" value={form.addressLine1} onChange={handleChange} placeholder="Street / Building" />
              </label>

              <label>
                Address Line 2
                <input name="addressLine2" value={form.addressLine2} onChange={handleChange} placeholder="Area / Landmark" />
              </label>

              <label>
                City
                <input name="city" value={form.city} onChange={handleChange} placeholder="City" />
              </label>

              <label>
                State
                <input name="state" value={form.state} onChange={handleChange} placeholder="State" />
              </label>

              <label>
                Pincode
                <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="Pincode" />
                {fieldErrors.pincode && <div className="sa-field-error">{fieldErrors.pincode}</div>}
              </label>

              <label>
                Country
                <input name="country" value={form.country} onChange={handleChange} placeholder="Country" />
              </label>

              <label>
                GST Number
                <input name="gstNumber" value={form.gstNumber} onChange={handleChange} placeholder="GSTIN (15 chars)" />
                {fieldErrors.gstNumber && <div className="sa-field-error">{fieldErrors.gstNumber}</div>}
              </label>

              <label>
                PAN Number
                <input name="panNumber" value={form.panNumber} onChange={handleChange} placeholder="PAN (AAAAA9999A)" />
                {fieldErrors.panNumber && <div className="sa-field-error">{fieldErrors.panNumber}</div>}
              </label>

              <label>
                FSSAI Number
                <input name="fssaiNumber" value={form.fssaiNumber} onChange={handleChange} placeholder="FSSAI (if applicable)" />
              </label>

              <label>
                Payment Terms
                <select name="paymentTerms" value={form.paymentTerms} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Advance">Advance</option>
                  <option value="7 Days">7 Days</option>
                  <option value="15 Days">15 Days</option>
                  <option value="30 Days">30 Days</option>
                </select>
              </label>

              <label>
                Credit Limit
                <input name="creditLimit" value={form.creditLimit} onChange={handleChange} placeholder="Credit limit (number)" />
                {fieldErrors.creditLimit && <div className="sa-field-error">{fieldErrors.creditLimit}</div>}
              </label>

              <label>
                Payment Mode
                <input name="paymentMode" value={form.paymentMode} onChange={handleChange} placeholder="UPI / Bank / Cash" />
              </label>

              <label>
                Bank Name
                <input name="bankName" value={form.bankName} onChange={handleChange} placeholder="Bank name" />
              </label>

              <label>
                Account Number
                <input name="accountNumber" value={form.accountNumber} onChange={handleChange} placeholder="Account number" />
                {fieldErrors.accountNumber && <div className="sa-field-error">{fieldErrors.accountNumber}</div>}
              </label>

              <label>
                IFSC
                <input name="ifsc" value={form.ifsc} onChange={handleChange} placeholder="IFSC code" />
                {fieldErrors.ifsc && <div className="sa-field-error">{fieldErrors.ifsc}</div>}
              </label>

              <label>
                Branch
                <input name="branch" value={form.branch} onChange={handleChange} placeholder="Bank branch" />
              </label>

              <label>
                Delivery Time (days)
                <input name="deliveryTime" value={form.deliveryTime} onChange={handleChange} placeholder="Lead time in days" />
                {fieldErrors.deliveryTime && <div className="sa-field-error">{fieldErrors.deliveryTime}</div>}
              </label>

              <label>
                Minimum Order Qty
                <input name="minOrderQty" value={form.minOrderQty} onChange={handleChange} placeholder="MOQ" />
                {fieldErrors.minOrderQty && <div className="sa-field-error">{fieldErrors.minOrderQty}</div>}
              </label>

              <label>
                Status
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Blacklisted">Blacklisted</option>
                </select>
              </label>

              <label>
                Notes
                <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Internal notes" rows={3} />
              </label>

              {error && <div className="sa-modal-error">{error}</div>}

              <div className="sa-modal-actions">
                <button type="button" className="sa-secondary-button" onClick={() => !saving && setShowForm(false)}>Cancel</button>
                <button type="submit" className="sa-primary-button" disabled={saving}>{saving ? "Saving..." : form._id ? "Update Vendor" : "Save Vendor"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorList;
