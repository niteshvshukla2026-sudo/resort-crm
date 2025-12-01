// src/pages/superAdmin/VendorList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// --- small dev sample vendors ---
const DEV_VENDORS = [
  {
    _id: "dev_vendor_1",
    code: "FFP_1234",
    name: "FreshFoods",
    contactPerson: "Ravi Kumar",
    phone: "9876500011",
    whatsapp: "9876500011",
    email: "sales@freshfoods.com",
    addressLine1: "123 Food St.",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    country: "India",
    vendorType: "Company",
    category: "Food",
    gstNumber: "27AAAAA0000A1Z5",
    panNumber: "AAAAA0000A",
    paymentTerms: "30 Days",
    creditLimit: "50000",
    paymentMode: "Bank Transfer",
    status: "Active",
    notes: "Priority supplier",
  },
  {
    _id: "dev_vendor_2",
    code: "GLB_2345",
    name: "GlobalSupplies",
    phone: "9876500022",
    email: "contact@globalsupplies.com",
    city: "Goa",
    vendorType: "Distributor",
    category: "Housekeeping",
    status: "Active",
  },
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
  const [categories, setCategories] = useState([]);

  // filters
  const [filterName, setFilterName] = useState("");
  const [filterCode, setFilterCode] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterEmail, setFilterEmail] = useState("");

  // CSV upload
  const [csvError, setCsvError] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);

  // --- load vendors and categories ---
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
      const res = await axios.get(`${API_BASE}/api/item-categories`).catch(() => ({ data: [] }));
      const cats = Array.isArray(res.data) ? res.data : [];
      const mapped = cats.map((c) => (typeof c === "string" ? c : c.name || c.code || JSON.stringify(c)));
      setCategories(mapped);
    } catch (err) {
      console.warn("Failed to load categories", err);
      setCategories([]);
    }
  };

  useEffect(() => {
    loadVendors();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- sanitizers and helpers ---
  const sanitizeLetters = (v) => String(v || "").replace(/[^A-Za-z ]+/g, "");
  const sanitizeDigits = (v) => String(v || "").replace(/\D+/g, "");
  const sanitizeDecimal = (v) => String(v || "").replace(/[^0-9.]/g, "");

  const isEmpty = (v) => v === undefined || v === null || String(v).trim() === "";

  // Strict regexes
  const regex = {
    name: /^[A-Za-z ]+$/, // only alphabets and spaces
    phone: /^\d{10}$/,
    whatsapp: /^\d{10}$/,
    alternatePhone: /^\d{10}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    gst:
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, // common GSTIN format
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
    pincode: /^[1-9][0-9]{5}$/,
    accountNumber: /^[0-9]{6,20}$/,
    integer: /^\d+$/,
    decimal: /^\d+(\.\d+)?$/,
    codeAllowed: /^[A-Z0-9_]+$/, // generated code will be uppercase + digits + underscore
  };

  // Generate vendor code from name: initials of up to 4 words + last 4 digits of timestamp
  const generateCodeFromName = (name) => {
    if (!name) return "";
    const words = name
      .replace(/[^A-Za-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 4);
    if (words.length === 0) return `VEND_${String(Date.now()).slice(-4)}`;
    const initials = words.map((w) => w[0].toUpperCase()).join("");
    const suffix = String(Date.now()).slice(-4);
    let base = `${initials}_${suffix}`;
    // ensure uniqueness among current vendors
    const existingCodes = new Set(vendors.map((v) => (v.code || "").toUpperCase()));
    if (!existingCodes.has(base)) return base;
    // if clash, append random 2-digit
    return `${initials}_${suffix}${Math.floor(Math.random() * 90 + 10)}`;
  };

  // ensure code uniqueness (local check) - returns unique uppercase code
  const ensureUniqueCode = (candidate) => {
    if (!candidate) return candidate;
    const up = candidate.toUpperCase();
    const existing = new Set(vendors.map((v) => (v.code || "").toUpperCase()));
    if (!existing.has(up)) return up;
    // append short suffix until unique
    for (let i = 1; i < 1000; i++) {
      const tryCode = `${up}_${i}`;
      if (!existing.has(tryCode)) return tryCode;
    }
    return `${up}_${Date.now().toString().slice(-4)}`;
  };

  // --- validators (strict) ---
  const validators = {
    code: (v) => {
      if (!v) return "Vendor code is required";
      if (!regex.codeAllowed.test(String(v).toUpperCase())) return "Code may contain only A-Z,0-9 and underscore";
      return undefined;
    },
    name: (v) => {
      if (!v) return "Vendor name is required";
      if (!regex.name.test(String(v).trim())) return "Name must contain only letters and spaces";
      return undefined;
    },
    phone: (v) => {
      if (isEmpty(v)) return undefined;
      if (!regex.phone.test(String(v).trim())) return "Phone must be exactly 10 digits";
      return undefined;
    },
    whatsapp: (v) => {
      if (isEmpty(v)) return undefined;
      if (!regex.whatsapp.test(String(v).trim())) return "WhatsApp must be exactly 10 digits";
      return undefined;
    },
    alternatePhone: (v) => {
      if (isEmpty(v)) return undefined;
      if (!regex.alternatePhone.test(String(v).trim())) return "Alternate phone must be exactly 10 digits";
      return undefined;
    },
    email: (v) => {
      if (isEmpty(v)) return undefined;
      if (!regex.email.test(String(v).trim())) return "Invalid email format";
      return undefined;
    },
    gstNumber: (v) => {
      if (isEmpty(v)) return undefined;
      if (!regex.gst.test(String(v).trim())) return "GSTIN invalid (must follow 15-char GSTIN pattern)";
      return undefined;
    },
    panNumber: (v) => {
      if (isEmpty(v)) return undefined;
      if (!regex.pan.test(String(v).trim())) return "PAN invalid (format AAAAA9999A)";
      return undefined;
    },
    ifsc: (v) => {
      if (isEmpty(v)) return undefined;
      if (!regex.ifsc.test(String(v).trim())) return "IFSC invalid (e.g. SBIN0000001)";
      return undefined;
    },
    pincode: (v) => {
      if (isEmpty(v)) return undefined;
      if (!regex.pincode.test(String(v).trim())) return "Pincode must be 6 digits and not start with 0";
      return undefined;
    },
    accountNumber: (v) => {
      if (isEmpty(v)) return undefined;
      if (!regex.accountNumber.test(String(v).trim())) return "Account number must be 6-20 digits";
      return undefined;
    },
    creditLimit: (v) => {
      if (isEmpty(v)) return undefined;
      if (!regex.decimal.test(String(v).trim())) return "Credit limit must be a number";
      return undefined;
    },
    deliveryTime: (v) => {
      if (isEmpty(v)) return undefined;
      if (!regex.integer.test(String(v).trim())) return "Delivery time must be whole days (integer)";
      return undefined;
    },
    minOrderQty: (v) => {
      if (isEmpty(v)) return undefined;
      if (!regex.integer.test(String(v).trim())) return "MOQ must be a whole number";
      return undefined;
    },
    category: (v) => {
      if (!v) return "Category is required";
      return undefined;
    },
  };

  const validateAll = () => {
    const newErr = {};
    Object.keys(validators).forEach((k) => {
      const msg = validators[k](form[k]);
      if (msg) newErr[k] = msg;
    });
    setFieldErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  // --- form handlers & sanitizing on input ---
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

  // updated handleChange with sanitization
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((p) => {
      let newVal = value;

      // sanitization rules
      if (name === "name" || name === "contactPerson") {
        newVal = sanitizeLetters(value);
      } else if (
        name === "phone" ||
        name === "whatsapp" ||
        name === "alternatePhone" ||
        name === "pincode" ||
        name === "accountNumber" ||
        name === "minOrderQty" ||
        name === "deliveryTime"
      ) {
        newVal = sanitizeDigits(value);
      } else if (name === "creditLimit") {
        newVal = sanitizeDecimal(value);
      } else if (name === "code") {
        // normalize code: uppercase, replace spaces with underscore, remove other invalid chars
        newVal = String(value || "").toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
      }

      const updated = { ...p, [name]: newVal };

      // auto-generate code when name changes AND code is empty
      if (name === "name" && (p.code === "" || p.code === undefined)) {
        const gen = generateCodeFromName(newVal);
        updated.code = ensureUniqueCode(gen);
      }

      return updated;
    });

    // clear field error
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  // paste handlers for extra safety
  const handlePasteLetters = (ev, fieldName) => {
    ev.preventDefault();
    const text = (ev.clipboardData || window.clipboardData).getData("text");
    const sanitized = sanitizeLetters(text);
    setForm((p) => {
      const updated = { ...p, [fieldName]: sanitized };
      if (fieldName === "name" && (p.code === "" || p.code === undefined)) {
        updated.code = ensureUniqueCode(generateCodeFromName(sanitized));
      }
      return updated;
    });
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[fieldName];
      return copy;
    });
  };

  const handlePasteDigits = (ev, fieldName, limit) => {
    ev.preventDefault();
    const text = (ev.clipboardData || window.clipboardData).getData("text");
    let sanitized = sanitizeDigits(text);
    if (limit) sanitized = sanitized.slice(0, limit);
    setForm((p) => ({ ...p, [fieldName]: sanitized }));
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[fieldName];
      return copy;
    });
  };

  const handlePasteDecimal = (ev, fieldName) => {
    ev.preventDefault();
    const text = (ev.clipboardData || window.clipboardData).getData("text");
    const sanitized = sanitizeDecimal(text);
    setForm((p) => ({ ...p, [fieldName]: sanitized }));
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[fieldName];
      return copy;
    });
  };

  const handleGenerateCode = () => {
    const gen = generateCodeFromName(form.name || "");
    setForm((p) => ({ ...p, code: ensureUniqueCode(gen) }));
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.code;
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateAll()) {
      setError("Please fix validation errors.");
      return;
    }

    try {
      setSaving(true);
      const payload = { ...form };
      if (!form._id) delete payload._id;
      if (payload.code) payload.code = ensureUniqueCode(String(payload.code).toUpperCase());

      if (form._id && String(form._id).startsWith("local_")) {
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

  // CSV upload & parsing (strict mapping still allows import but validations applied on edit/save)
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

      const payloads = parsed.map((p) => {
        const nameVal = p.name || "";
        const codeVal = p.code || generateCodeFromName(nameVal);
        return {
          code: ensureUniqueCode(String(codeVal).toUpperCase()),
          name: nameVal,
          vendorType: p.vendortype || p.vendor_type || "",
          category: p.category || "",
          contactPerson: p.contactperson || p.contact_person || p.contact || "",
          phone: p.phone || p.contact || "",
          whatsapp: p.whatsapp || "",
          alternatePhone: p.alternatephone || p.altphone || p.alt_phone || "",
          email: p.email || "",
          addressLine1: p.address || "",
          addressLine2: p.addressline2 || "",
          city: p.city || "",
          state: p.state || "",
          pincode: p.pincode || "",
          country: p.country || "",
          gstNumber: p.gstnumber || "",
          panNumber: p.pannumber || "",
          paymentTerms: p.paymentterms || "",
          creditLimit: p.creditlimit || "",
          paymentMode: p.paymentmode || "",
          bankName: p.bankname || "",
          accountNumber: p.accountnumber || "",
          ifsc: p.ifsc || "",
          branch: p.branch || "",
          deliveryTime: p.deliverytime || "",
          minOrderQty: p.minqty || "",
          status: p.status || "Active",
          notes: p.notes || "",
        };
      });

      // optimistic add locally
      const localAdded = payloads.map((pl) => ({ ...pl, _id: `local_${Date.now()}_${Math.floor(Math.random() * 1000)}` }));
      setVendors((prev) => [...localAdded, ...prev]);

      // attempt server creates sequentially
      try {
        for (const pl of payloads) {
          try {
            const res = await axios.post(`${API_BASE}/api/vendors`, pl).catch(() => null);
            if (res?.data) {
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

  // export CSV (same extended columns)
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
              title="Upload CSV (columns: code,name,... )"
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
            <p className="sa-modal-sub">Add or update a supplier used in purchase orders. (Strict validations enabled)</p>

            <form className="sa-modal-form" onSubmit={handleSubmit}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label style={{ flex: 1 }}>
                  Vendor Name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    onPaste={(e) => handlePasteLetters(e, "name")}
                    placeholder="Only letters and spaces"
                  />
                  {fieldErrors.name && <div className="sa-field-error">{fieldErrors.name}</div>}
                </label>

                <label style={{ width: 260 }}>
                  Code *
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      name="code"
                      value={form.code}
                      onChange={handleChange}
                      onPaste={(e) => {
                        e.preventDefault();
                        const text = (e.clipboardData || window.clipboardData).getData("text");
                        const sanitized = String(text || "").toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
                        setForm((p) => ({ ...p, code: ensureUniqueCode(sanitized) }));
                        setFieldErrors((prev) => { const c = { ...prev }; delete c.code; return c; });
                      }}
                      placeholder="Auto generated from name"
                    />
                    <button type="button" className="sa-secondary-button" onClick={handleGenerateCode}>Generate</button>
                  </div>
                  {fieldErrors.code && <div className="sa-field-error">{fieldErrors.code}</div>}
                </label>
              </div>

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
                <input
                  name="contactPerson"
                  value={form.contactPerson}
                  onChange={handleChange}
                  onPaste={(e) => handlePasteLetters(e, "contactPerson")}
                  placeholder="Only letters and spaces"
                />
                {form.contactPerson && !/^[A-Za-z ]+$/.test(String(form.contactPerson).trim()) && <div className="sa-field-error">Contact person must be letters and spaces only</div>}
              </label>

              <label>
                Phone
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  onPaste={(e) => handlePasteDigits(e, "phone", 10)}
                  placeholder="10 digits"
                />
                {fieldErrors.phone && <div className="sa-field-error">{fieldErrors.phone}</div>}
              </label>

              <label>
                WhatsApp
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  onPaste={(e) => handlePasteDigits(e, "whatsapp", 10)}
                  placeholder="10 digits"
                />
                {fieldErrors.whatsapp && <div className="sa-field-error">{fieldErrors.whatsapp}</div>}
              </label>

              <label>
                Alternate Phone
                <input
                  name="alternatePhone"
                  value={form.alternatePhone}
                  onChange={handleChange}
                  onPaste={(e) => handlePasteDigits(e, "alternatePhone", 10)}
                  placeholder="10 digits"
                />
                {fieldErrors.alternatePhone && <div className="sa-field-error">{fieldErrors.alternatePhone}</div>}
              </label>

              <label>
                Email
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="vendor@example.com" />
                {fieldErrors.email && <div className="sa-field-error">{fieldErrors.email}</div>}
              </label>

              <label>
                Address Line 1
                <input name="addressLine1" value={form.addressLine1} onChange={handleChange} />
              </label>

              <label>
                Address Line 2
                <input name="addressLine2" value={form.addressLine2} onChange={handleChange} />
              </label>

              <label>
                City
                <input name="city" value={form.city} onChange={handleChange} />
              </label>

              <label>
                State
                <input name="state" value={form.state} onChange={handleChange} />
              </label>

              <label>
                Pincode
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  onPaste={(e) => handlePasteDigits(e, "pincode", 6)}
                  placeholder="6 digits"
                />
                {fieldErrors.pincode && <div className="sa-field-error">{fieldErrors.pincode}</div>}
              </label>

              <label>
                Country
                <input name="country" value={form.country} onChange={handleChange} />
              </label>

              <label>
                GST Number
                <input name="gstNumber" value={form.gstNumber} onChange={handleChange} placeholder="15 char GSTIN" />
                {fieldErrors.gstNumber && <div className="sa-field-error">{fieldErrors.gstNumber}</div>}
              </label>

              <label>
                PAN Number
                <input name="panNumber" value={form.panNumber} onChange={handleChange} placeholder="PAN (AAAAA9999A)" />
                {fieldErrors.panNumber && <div className="sa-field-error">{fieldErrors.panNumber}</div>}
              </label>

              <label>
                FSSAI Number
                <input name="fssaiNumber" value={form.fssaiNumber} onChange={handleChange} />
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
                <input
                  name="creditLimit"
                  value={form.creditLimit}
                  onChange={handleChange}
                  onPaste={(e) => handlePasteDecimal(e, "creditLimit")}
                  placeholder="Numeric"
                />
                {fieldErrors.creditLimit && <div className="sa-field-error">{fieldErrors.creditLimit}</div>}
              </label>

              <label>
                Payment Mode
                <input name="paymentMode" value={form.paymentMode} onChange={handleChange} placeholder="UPI / Bank / Cash" />
              </label>

              <label>
                Bank Name
                <input name="bankName" value={form.bankName} onChange={handleChange} />
              </label>

              <label>
                Account Number
                <input
                  name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
                  onPaste={(e) => handlePasteDigits(e, "accountNumber", 20)}
                  placeholder="6-20 digits"
                />
                {fieldErrors.accountNumber && <div className="sa-field-error">{fieldErrors.accountNumber}</div>}
              </label>

              <label>
                IFSC
                <input name="ifsc" value={form.ifsc} onChange={handleChange} placeholder="IFSC" />
                {fieldErrors.ifsc && <div className="sa-field-error">{fieldErrors.ifsc}</div>}
              </label>

              <label>
                Branch
                <input name="branch" value={form.branch} onChange={handleChange} />
              </label>

              <label>
                Delivery Time (days)
                <input
                  name="deliveryTime"
                  value={form.deliveryTime}
                  onChange={handleChange}
                  onPaste={(e) => handlePasteDigits(e, "deliveryTime")}
                  placeholder="Integer days"
                />
                {fieldErrors.deliveryTime && <div className="sa-field-error">{fieldErrors.deliveryTime}</div>}
              </label>

              <label>
                Minimum Order Qty
                <input
                  name="minOrderQty"
                  value={form.minOrderQty}
                  onChange={handleChange}
                  onPaste={(e) => handlePasteDigits(e, "minOrderQty")}
                  placeholder="Integer"
                />
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
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />
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
