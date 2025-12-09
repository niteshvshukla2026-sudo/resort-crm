// src/pages/superAdmin/ResortList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

// ---------------- API BASE (same style as DepartmentList) ---------------
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
console.log("ResortList API_BASE =", API_BASE);

const authAxios = axios.create({ baseURL: API_BASE });

authAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// small Maharashtra city list for datalist (keeps UX nice)
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
  "Lonavala",
  "Alibaug",
  "Mahabaleshwar",
  "Matheran",
  "Shirdi",
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
  const day = Number(dd),
    month = Number(mm),
    year = Number(yyyy);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year))
    return "";
  return `${year}-${pad(month)}-${pad(day)}`;
};
const parseDDMMYYYYToDate = (s) => {
  const iso = parseDDMMYYYYToISO(s);
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d) ? null : d;
};

// default empty form
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

// small auto-code from name
const generateCodeFromName = (name = "") => {
  if (!name) return "";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
};

const TIEUP_OPTIONS = ["Managed", "Marketed", "Owned", "Commissionable"];
const QUALITY_OPTIONS = ["5-Star", "4-Star", "3-Star", "Budget"];
const LOCATION_OPTIONS = ["Mainstream", "Offbeat"];

const ResortList = () => {
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [fieldErrors, setFieldErrors] = useState({});

  // Filters
  const [filterName, setFilterName] = useState("");
  const [filterCode, setFilterCode] = useState("");
  const [filterLocationZone, setFilterLocationZone] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTieUpCategory, setFilterTieUpCategory] = useState("");
  const [filterQualityCategory, setFilterQualityCategory] = useState("");
  const [filterLocationCategory, setFilterLocationCategory] = useState("");

  // -------------------- LOAD RESORTS --------------------
  const loadResorts = async () => {
    try {
      setLoading(true);
      setError("");

      // final URL: /api/resorts
      const res = await authAxios.get("/resorts");
      console.log("resorts response:", res.status, res.data);

      // backend: { ok: true, resorts: [...] }
      const server = Array.isArray(res.data?.resorts)
        ? res.data.resorts
        : Array.isArray(res.data)
        ? res.data
        : [];

      const normalized = server.map((r) => ({
        ...r,
        _id: r._id || r.id,
      }));
      setResorts(normalized);
    } catch (err) {
      console.error("loadResorts error", err.response?.status, err.response?.data);
      setError(
        `Failed to load resorts from backend${
          err.response?.status ? ` (Status ${err.response.status})` : ""
        }`
      );
      setResorts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResorts();
  }, []);

  // auto update fssaiStatus when renewalDate changes
  useEffect(() => {
    if (!form.renewalDate) return;
    const rDate = parseDDMMYYYYToDate(form.renewalDate);
    if (!rDate) return;
    const today = new Date();
    const todayMid = new Date(today.toDateString());
    const status = rDate < todayMid ? "expired" : "active";
    setForm((p) => ({ ...p, fssaiStatus: status }));
  }, [form.renewalDate]);

  // Filters logic
  const filtered = useMemo(() => {
    return resorts.filter((r) => {
      if (
        filterName &&
        !r.name?.toLowerCase().includes(filterName.toLowerCase())
      )
        return false;
      if (
        filterCode &&
        !r.code?.toLowerCase().includes(filterCode.toLowerCase())
      )
        return false;
      if (
        filterLocationZone &&
        !r.locationZone
          ?.toLowerCase()
          .includes(filterLocationZone.toLowerCase())
      )
        return false;
      if (filterStatus) {
        if (filterStatus === "active" && r.isActive === false) return false;
        if (filterStatus === "inactive" && r.isActive !== false) return false;
      }
      if (
        filterTieUpCategory &&
        (r.tieUpCategory || "") !== filterTieUpCategory
      )
        return false;
      if (
        filterQualityCategory &&
        (r.qualityCategory || "") !== filterQualityCategory
      )
        return false;
      if (
        filterLocationCategory &&
        (r.locationCategory || "") !== filterLocationCategory
      )
        return false;
      return true;
    });
  }, [
    resorts,
    filterName,
    filterCode,
    filterLocationZone,
    filterStatus,
    filterTieUpCategory,
    filterQualityCategory,
    filterLocationCategory,
  ]);

  // Form handlers
  const openCreateForm = () => {
    setForm(emptyForm());
    setFieldErrors({});
    setError("");
    setShowForm(true);
  };

  const openEditForm = (r) => {
    setForm({
      _id: r._id || r.id,
      name: r.name || "",
      code: r.code || generateCodeFromName(r.name || ""),
      address: r.address || "",
      locationZone: r.locationZone || "",
      ownerName: r.ownerName || "",
      ownerContact: r.ownerContact || "",
      ownerEmail: r.ownerEmail || "",
      ownerResdAddress: r.ownerResdAddress || "",
      ownerOffAddress: r.ownerOffAddress || "",
      noOfKeys: r.noOfKeys ?? "",
      tieUpCategory: r.tieUpCategory || "",
      qualityCategory: r.qualityCategory || "",
      locationCategory: r.locationCategory || "",
      fssaiNumber: r.fssaiNumber || "",
      fssaiStatus: r.fssaiStatus || "",
      renewalDate: r.renewalDate ? formatISOToDDMMYYYY(r.renewalDate) : "",
      isActive: r.isActive !== false,
    });
    setFieldErrors({});
    setError("");
    setShowForm(true);
  };

  const openView = (r) => {
    setViewItem(r);
    setShowView(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => {
      const next = { ...p, [name]: type === "checkbox" ? checked : value };
      if (name === "name") {
        const auto = generateCodeFromName(value);
        if (!p.code || p.code === generateCodeFromName(p.name || "")) {
          next.code = auto;
        }
      }
      return next;
    });
    setFieldErrors((fe) => ({ ...fe, [name]: "" }));
  };

  // validation
  const validateForm = () => {
    const fe = {};
    if (!form.name?.trim()) fe.name = "Resort name is required";
    if (!form.address?.trim()) fe.address = "Address is required";
    if (!form.locationZone?.trim())
      fe.locationZone = "Location/Zone is required";
    if (!form.ownerName?.trim()) fe.ownerName = "Owner name is required";
    if (!form.ownerContact?.trim())
      fe.ownerContact = "Owner contact is required";
    else {
      const digits = (form.ownerContact || "").replace(/\D/g, "");
      if (digits.length !== 10)
        fe.ownerContact = "Owner contact must be 10 digits";
    }
    if (form.ownerEmail) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(form.ownerEmail)) fe.ownerEmail = "Invalid email";
    }
    if (form.noOfKeys !== "" && form.noOfKeys !== null) {
      const n = Number(form.noOfKeys);
      if (!Number.isFinite(n) || n < 0) fe.noOfKeys = "Enter a valid number";
    }
    if (form.renewalDate) {
      const d = parseDDMMYYYYToDate(form.renewalDate);
      if (!d) fe.renewalDate = "Enter renewal date as DD/MM/YYYY";
    }
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  // -------------------- SUBMIT (CREATE / UPDATE) --------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      setError("Please fix the highlighted errors.");
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
        ownerContact: (form.ownerContact || "").replace(/\D/g, ""),
        ownerEmail: form.ownerEmail || undefined,
        ownerResdAddress: form.ownerResdAddress || undefined,
        ownerOffAddress: form.ownerOffAddress || undefined,
        noOfKeys: form.noOfKeys ? Number(form.noOfKeys) : undefined,
        tieUpCategory: form.tieUpCategory || undefined,
        qualityCategory: form.qualityCategory || undefined,
        locationCategory: form.locationCategory || undefined,
        fssaiNumber: form.fssaiNumber || undefined,
        fssaiStatus: form.fssaiStatus || undefined,
        renewalDate: form.renewalDate
          ? parseDDMMYYYYToISO(form.renewalDate)
          : undefined,
        isActive: !!form.isActive,
      };

      if (form._id) {
        // UPDATE: PUT /api/resorts/:id
        const res = await authAxios.put(`/resorts/${form._id}`, payload);
        console.log("update resort res:", res.data);
      } else {
        // CREATE: POST /api/resorts
        const res = await authAxios.post("/resorts", payload);
        console.log("create resort res:", res.data);
      }

      // ✅ Always reload list from backend so UI == DB
      await loadResorts();

      setShowForm(false);
      setForm(emptyForm());
      setFieldErrors({});
    } catch (err) {
      console.error(
        "save resort error",
        err.response?.status,
        err.response?.data,
        err.message
      );
      setError(
        err?.response?.data?.message || "Failed to save resort"
      );
    } finally {
      setSaving(false);
    }
  };

  // -------------------- DELETE --------------------
  const handleDelete = async (r) => {
    if (!window.confirm(`Delete resort ${r.name || r._id}?`)) return;
    try {
      setResorts((p) => p.filter((x) => (x._id || x.id) !== (r._id || r.id)));
      try {
        await authAxios.delete(`/resorts/${r._id || r.id}`);
      } catch (err) {
        console.error(
          "delete resort error",
          err.response?.status,
          err.response?.data
        );
        await loadResorts();
      }
    } catch (err) {
      console.error("delete resort error", err);
      setError("Failed to delete resort");
      await loadResorts();
    }
  };

  // -------------------- RENDER --------------------
  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>Resorts</h2>
          <p>
            All resorts load from backend only. Create/Edit/Delete will persist
            to database.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="sa-secondary-button"
            onClick={() => {
              /* optional export */
            }}
          >
            Download
          </button>

          <button
            className="sa-primary-button"
            type="button"
            onClick={openCreateForm}
          >
            <i className="ri-add-line" /> New Resort
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            fontSize: "0.85rem",
            marginBottom: 8,
            color: "#b91c1c",
            background: "rgba(250,204,210,0.3)",
            padding: 8,
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      {/* Filters */}
      <div
        className="sa-card"
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <label>
          Name
          <input
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="Search name"
            style={{ marginLeft: 8 }}
          />
        </label>

        <label>
          Code
          <input
            value={filterCode}
            onChange={(e) => setFilterCode(e.target.value)}
            placeholder="Code"
            style={{ marginLeft: 8 }}
          />
        </label>

        <label>
          Location/Zone
          <input
            list="maha-cities"
            value={filterLocationZone}
            onChange={(e) => setFilterLocationZone(e.target.value)}
            placeholder="Type or select city/place"
            style={{ marginLeft: 8 }}
          />
        </label>

        <label>
          Status
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label>
          Tie-up Category
          <select
            value={filterTieUpCategory}
            onChange={(e) => setFilterTieUpCategory(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="">--</option>
            {TIEUP_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label>
          Quality Category
          <select
            value={filterQualityCategory}
            onChange={(e) => setFilterQualityCategory(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="">--</option>
            {QUALITY_OPTIONS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </label>

        <label>
          Location Category
          <select
            value={filterLocationCategory}
            onChange={(e) => setFilterLocationCategory(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="">--</option>
            {LOCATION_OPTIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
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
          <div style={{ fontSize: "0.9rem" }}>
            No resorts found. Add one to get started.
          </div>
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
                const formattedRenewal = r.renewalDate
                  ? formatISOToDDMMYYYY(r.renewalDate)
                  : "-";
                return (
                  <tr key={r._id || r.id || r.code}>
                    <td>{r.code}</td>
                    <td>{r.name}</td>
                    <td>{r.locationZone}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.ownerName}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        {r.ownerContact}
                      </div>
                    </td>
                    <td>{r.noOfKeys ?? "-"}</td>
                    <td>{r.tieUpCategory ?? "-"}</td>
                    <td>{r.qualityCategory ?? "-"}</td>
                    <td>{r.locationCategory ?? "-"}</td>
                    <td>
                      <div>{r.fssaiNumber || "-"}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        {r.fssaiStatus ? r.fssaiStatus.toUpperCase() : "-"}
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        Renewal: {formattedRenewal}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`sa-badge ${
                          r.isActive === false
                            ? "sa-badge-muted"
                            : "sa-badge-success"
                        }`}
                      >
                        {r.isActive === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button
                        title="View"
                        className="sa-icon-button"
                        onClick={() => openView(r)}
                        style={{ marginRight: 6 }}
                      >
                        <i className="ri-eye-line" />
                      </button>

                      <button
                        title="Edit"
                        className="sa-icon-button"
                        onClick={() => openEditForm(r)}
                        style={{ marginRight: 6 }}
                      >
                        <i className="ri-edit-line" />
                      </button>

                      <button
                        title="Delete"
                        className="sa-icon-button"
                        onClick={() => handleDelete(r)}
                      >
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
        <div
          className="sa-modal-backdrop"
          onClick={() => !saving && setShowForm(false)}
        >
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
            <h3 style={{ marginBottom: 6 }}>
              {form._id ? "Edit Resort" : "New Resort"}
            </h3>
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
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Resort Name"
                  required
                />
                {fieldErrors.name && (
                  <div className="field-error">{fieldErrors.name}</div>
                )}
              </label>

              <label>
                Code (auto)
                <input
                  name="code"
                  value={form.code}
                  onChange={() => {}}
                  placeholder="Auto-generated code"
                  readOnly
                />
                <small style={{ display: "block", color: "#6b7280" }}>
                  Auto-generated from name; backend will store this.
                </small>
              </label>

              <label>
                Address *
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  placeholder="Street, area, pin"
                  required
                />
                {fieldErrors.address && (
                  <div className="field-error">{fieldErrors.address}</div>
                )}
              </label>

              <label>
                Location / Zone *
                <input
                  list="maha-cities"
                  name="locationZone"
                  value={form.locationZone}
                  onChange={handleFormChange}
                  placeholder="e.g. Mumbai / Pune / Lonavala"
                  required
                />
                {fieldErrors.locationZone && (
                  <div className="field-error">{fieldErrors.locationZone}</div>
                )}
                <small style={{ display: "block", color: "#6b7280" }}>
                  Select from Maharashtra cities or type any other place.
                </small>
              </label>

              <label>
                Owner Name *
                <input
                  name="ownerName"
                  value={form.ownerName}
                  onChange={handleFormChange}
                  placeholder="Owner full name"
                  required
                />
                {fieldErrors.ownerName && (
                  <div className="field-error">{fieldErrors.ownerName}</div>
                )}
              </label>

              <label>
                Owner Contact *
                <input
                  name="ownerContact"
                  value={form.ownerContact}
                  onChange={handleFormChange}
                  placeholder="+91-XXXXXXXXXX"
                  required
                />
                {fieldErrors.ownerContact && (
                  <div className="field-error">{fieldErrors.ownerContact}</div>
                )}
              </label>

              <label>
                Owner Email
                <input
                  type="email"
                  name="ownerEmail"
                  value={form.ownerEmail}
                  onChange={handleFormChange}
                  placeholder="owner@example.com"
                />
                {fieldErrors.ownerEmail && (
                  <div className="field-error">{fieldErrors.ownerEmail}</div>
                )}
              </label>

              <label>
                Owner Resd. Address
                <input
                  name="ownerResdAddress"
                  value={form.ownerResdAddress}
                  onChange={handleFormChange}
                  placeholder="Residential address"
                />
              </label>

              <label>
                Owner Off. Address
                <input
                  name="ownerOffAddress"
                  value={form.ownerOffAddress}
                  onChange={handleFormChange}
                  placeholder="Office address"
                />
              </label>

              <label>
                No of Keys
                <input
                  type="number"
                  name="noOfKeys"
                  min="0"
                  value={form.noOfKeys}
                  onChange={handleFormChange}
                  placeholder="e.g. 20"
                />
                {fieldErrors.noOfKeys && (
                  <div className="field-error">{fieldErrors.noOfKeys}</div>
                )}
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                <label>
                  Tie-up Category
                  <select
                    name="tieUpCategory"
                    value={form.tieUpCategory}
                    onChange={handleFormChange}
                  >
                    <option value="">--</option>
                    {TIEUP_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Quality Category
                  <select
                    name="qualityCategory"
                    value={form.qualityCategory}
                    onChange={handleFormChange}
                  >
                    <option value="">--</option>
                    {QUALITY_OPTIONS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Location Category
                  <select
                    name="locationCategory"
                    value={form.locationCategory}
                    onChange={handleFormChange}
                  >
                    <option value="">--</option>
                    {LOCATION_OPTIONS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                FSSAI License Number
                <input
                  name="fssaiNumber"
                  value={form.fssaiNumber}
                  onChange={handleFormChange}
                  placeholder="FSSAI / license no"
                />
              </label>

              <label>
                FSSAI License Status
                <select
                  name="fssaiStatus"
                  value={form.fssaiStatus}
                  onChange={handleFormChange}
                >
                  <option value="">Select status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="pending">Pending</option>
                </select>
                <small style={{ display: "block", color: "#6b7280" }}>
                  Auto-updates from Renewal Date but you can override.
                </small>
              </label>

              <label>
                Renewal Date (dd/mm/yyyy)
                <input
                  name="renewalDate"
                  value={form.renewalDate}
                  onChange={handleFormChange}
                  placeholder="dd/mm/yyyy"
                />
                {fieldErrors.renewalDate && (
                  <div className="field-error">{fieldErrors.renewalDate}</div>
                )}
                <small style={{ display: "block", color: "#6b7280" }}>
                  Enter date as DD/MM/YYYY. Status will auto-update based on
                  this date.
                </small>
              </label>

              <label
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <input
                  type="checkbox"
                  name="isActive"
                  checked={!!form.isActive}
                  onChange={handleFormChange}
                />
                Active
              </label>

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
                    ? "Update Resort"
                    : "Save Resort"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showView && viewItem && (
        <div
          className="sa-modal-backdrop"
          onClick={() => setShowView(false)}
        >
          <div
            className="sa-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 800 }}
          >
            <h3>
              {viewItem.name}{" "}
              <small style={{ color: "#6b7280" }}>({viewItem.code})</small>
            </h3>
            <p className="sa-modal-sub">Full resort details (read-only)</p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 10,
              }}
            >
              <div>
                <strong>Address</strong>
                <div style={{ color: "#374151" }}>
                  {viewItem.address || "-"}
                </div>
              </div>
              <div>
                <strong>Location / Zone</strong>
                <div style={{ color: "#374151" }}>
                  {viewItem.locationZone || "-"}
                </div>
              </div>
              <div>
                <strong>Owner Name</strong>
                <div style={{ color: "#374151" }}>
                  {viewItem.ownerName || "-"}
                </div>
              </div>
              <div>
                <strong>Owner Contact</strong>
                <div style={{ color: "#374151" }}>
                  {viewItem.ownerContact || "-"}
                </div>
              </div>
              <div>
                <strong>Owner Email</strong>
                <div style={{ color: "#374151" }}>
                  {viewItem.ownerEmail || "-"}
                </div>
              </div>
              <div>
                <strong>No of Keys</strong>
                <div style={{ color: "#374151" }}>
                  {viewItem.noOfKeys ?? "-"}
                </div>
              </div>
              <div>
                <strong>Tie-up Category</strong>
                <div style={{ color: "#374151" }}>
                  {viewItem.tieUpCategory || "-"}
                </div>
              </div>
              <div>
                <strong>Quality Category</strong>
                <div style={{ color: "#374151" }}>
                  {viewItem.qualityCategory || "-"}
                </div>
              </div>
              <div>
                <strong>FSSAI Number</strong>
                <div style={{ color: "#374151" }}>
                  {viewItem.fssaiNumber || "-"}
                </div>
              </div>
              <div>
                <strong>FSSAI Status</strong>
                <div style={{ color: "#374151" }}>
                  {viewItem.fssaiStatus || "-"}
                </div>
              </div>
              <div>
                <strong>Renewal Date</strong>
                <div style={{ color: "#374151" }}>
                  {viewItem.renewalDate
                    ? formatISOToDDMMYYYY(viewItem.renewalDate)
                    : "-"}
                </div>
              </div>
              <div>
                <strong>Residential Address</strong>
                <div style={{ color: "#374151" }}>
                  {viewItem.ownerResdAddress || "-"}
                </div>
              </div>
              <div>
                <strong>Office Address</strong>
                <div style={{ color: "#374151" }}>
                  {viewItem.ownerOffAddress || "-"}
                </div>
              </div>
            </div>

            <div className="sa-modal-actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="sa-secondary-button"
                onClick={() => setShowView(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="sa-primary-button"
                onClick={() => {
                  setShowView(false);
                  openEditForm(viewItem);
                }}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      <datalist id="maha-cities">
        {MAHA_CITIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </div>
  );
};

export default ResortList;
