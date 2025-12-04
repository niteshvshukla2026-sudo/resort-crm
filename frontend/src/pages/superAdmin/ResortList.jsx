// src/pages/superAdmin/ResortList.jsx
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
    ownerContact: "+91-9876543210",
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
  { _id: "dev_res_2", name: "Coral Cove", code: "CC", address: "Port Lane", locationZone: "Andaman", ownerName: "Asha", ownerContact: "+91-8888888888", ownerEmail: "asha@example.com", ownerResdAddress: "", ownerOffAddress: "", noOfKeys: 20, tieUpCategory: "Marketed", qualityCategory: "4-Star", locationCategory: "Offbeat", fssaiNumber: "", fssaiStatus: "", renewalDate: "", isActive: true },
  { _id: "dev_res_3", name: "Palm Grove", code: "PG", address: "Hill Road", locationZone: "Kerala", ownerName: "Vijay", ownerContact: "+91-7777777777", ownerEmail: "", ownerResdAddress: "", ownerOffAddress: "", noOfKeys: 15, tieUpCategory: "Owned", qualityCategory: "3-Star", locationCategory: "Offbeat", fssaiNumber: "", fssaiStatus: "", renewalDate: "", isActive: true },
  { _id: "dev_res_4", name: "Hillside Retreat", code: "HR", address: "Top Hill", locationZone: "Ooty", ownerName: "Suresh", ownerContact: "+91-6666666666", ownerEmail: "", ownerResdAddress: "", ownerOffAddress: "", noOfKeys: 10, tieUpCategory: "Commissionable", qualityCategory: "4-Star", locationCategory: "Mainstream", fssaiNumber: "FSSAIX", fssaiStatus: "expired", renewalDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0,10), isActive: false },
  { _id: "dev_res_5", name: "Sunset Point", code: "SP", address: "Sunset Blvd", locationZone: "Goa", ownerName: "Anita", ownerContact: "+91-5555555555", ownerEmail: "", ownerResdAddress: "", ownerOffAddress: "", noOfKeys: 25, tieUpCategory: "Managed", qualityCategory: "5-Star", locationCategory: "Mainstream", fssaiNumber: "", fssaiStatus: "", renewalDate: "", isActive: true },
  { _id: "dev_res_6", name: "Lagoon View", code: "LV", address: "Lagoon St", locationZone: "Lakshadweep", ownerName: "Kumar", ownerContact: "+91-4444444444", ownerEmail: "", ownerResdAddress: "", ownerOffAddress: "", noOfKeys: 12, tieUpCategory: "Marketed", qualityCategory: "4-Star", locationCategory: "Offbeat", fssaiNumber: "", fssaiStatus: "", renewalDate: "", isActive: true },
  { _id: "dev_res_7", name: "Riverbend Inn", code: "RI", address: "River Lane", locationZone: "Assam", ownerName: "Rita", ownerContact: "+91-3333333333", ownerEmail: "", ownerResdAddress: "", ownerOffAddress: "", noOfKeys: 8, tieUpCategory: "Owned", qualityCategory: "3-Star", locationCategory: "Offbeat", fssaiNumber: "", fssaiStatus: "", renewalDate: "", isActive: false },
  { _id: "dev_res_8", name: "Forest Whisper", code: "FW", address: "Forest Road", locationZone: "Coorg", ownerName: "Vikram", ownerContact: "+91-2222222222", ownerEmail: "", ownerResdAddress: "", ownerOffAddress: "", noOfKeys: 30, tieUpCategory: "Commissionable", qualityCategory: "4-Star", locationCategory: "Offbeat", fssaiNumber: "", fssaiStatus: "", renewalDate: "", isActive: true },
  { _id: "dev_res_9", name: "Dunes Hotel", code: "DH", address: "Desert Rd", locationZone: "Rajasthan", ownerName: "Pankaj", ownerContact: "+91-1111111111", ownerEmail: "", ownerResdAddress: "", ownerOffAddress: "", noOfKeys: 50, tieUpCategory: "Managed", qualityCategory: "5-Star", locationCategory: "Mainstream", fssaiNumber: "", fssaiStatus: "", renewalDate: "", isActive: true },
  { _id: "dev_res_10", name: "Crystal Sands", code: "CS", address: "Sands Ave", locationZone: "Pondicherry", ownerName: "Geeta", ownerContact: "+91-9999999999", ownerEmail: "", ownerResdAddress: "", ownerOffAddress: "", noOfKeys: 18, tieUpCategory: "Marketed", qualityCategory: "4-Star", locationCategory: "Mainstream", fssaiNumber: "", fssaiStatus: "", renewalDate: "", isActive: true },
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
  renewalDate: "", // will be dd/mm/yyyy string for display
  pincode: "",
  isActive: true,
});

const TIEUP_OPTIONS = ["Managed", "Marketed", "Owned", "Commissionable"];
const QUALITY_OPTIONS = ["5-Star", "4-Star", "3-Star", "Budget"];
const LOCATION_OPTIONS = ["Mainstream", "Offbeat"];

// --- Extensive Maharashtra cities & popular places (searchable via datalist) ---
import MAHARASHTRA_LOCATIONS from "../data/maharashtraLocations";

const FLAT_MAHA_LIST = MAHARASHTRA_LOCATIONS.flatMap(d =>
  d.cities.map(c => `${d.district} — ${c}`)
);

// helpers for date formatting/parsing
const pad = (n) => String(n).padStart(2, "0");

const formatISOToDDMMYYYY = (iso) => {
  if (!iso) return "";
  // allow iso like "2025-12-31" or full ISO with time
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
  // basic sanity check
  const day = Number(dd), month = Number(mm), year = Number(yyyy);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return "";
  // Construct ISO yyyy-mm-dd
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

  // pincode lookup state
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const debounceRef = React.useRef(null);

  const debounce = (fn, wait = 500) => {
    return (...args) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fn(...args), wait);
    };
  };

  const lookupPincode = async (pin) => {
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setPincodeError("Enter a valid 6-digit pincode");
      return null;
    }
    try {
      setPincodeLoading(true);
      setPincodeError("");
      const res = await axios.get(`https://api.postalpincode.in/pincode/${pin}`);
      if (!Array.isArray(res.data) || res.data.length === 0) {
        setPincodeError("Pincode lookup failed");
        return null;
      }
      const info = res.data[0];
      if (info.Status !== "Success" || !info.PostOffice || info.PostOffice.length === 0) {
        setPincodeError("Pincode not found");
        return null;
      }

      const first = info.PostOffice[0];
      const autoLocation = `${first.District} — ${first.Name}`;

      setForm(prev => {
        // don't override a manually entered locationZone
        if (prev.locationZone && prev.locationZone.trim() !== "") {
          return { ...prev, pincode: pin };
        }
        return { ...prev, pincode: pin, locationZone: autoLocation };
      });

      setPincodeError("");
      return { info };
    } catch (err) {
      console.error("pincode lookup error", err);
      setPincodeError("Failed to fetch pincode info");
      return null;
    } finally {
      setPincodeLoading(false);
    }
  };

  const debouncedLookup = debounce((pin) => {
    lookupPincode(pin);
  }, 500);

  // Filters (names match form fields)
  const [filterName, setFilterName] = useState("");
  const [filterCode, setFilterCode] = useState("");
  const [filterLocationZone, setFilterLocationZone] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // "", "active", "inactive"
  const [filterTieUpCategory, setFilterTieUpCategory] = useState("");
  const [filterQualityCategory, setFilterQualityCategory] = useState("");
  const [filterLocationCategory, setFilterLocationCategory] = useState("");

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
    // compare only date part (midnight)
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

  // form handlers
  const openCreateForm = () => {
    setForm(emptyForm());
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
      noOfKeys: r.noOfKeys || "",
      tieUpCategory: r.tieUpCategory || "",
      qualityCategory: r.qualityCategory || "",
      locationCategory: r.locationCategory || "",
      fssaiNumber: r.fssaiNumber || "",
      fssaiStatus: r.fssaiStatus || "",
      // convert ISO stored renewalDate -> dd/mm/yyyy for display
      renewalDate: r.renewalDate ? formatISOToDDMMYYYY(r.renewalDate) : "",
      isActive: r.isActive !== false,
    });
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

    // if editing pincode field, trigger lookup when length==6 numeric
    if (e.target.name === "pincode") {
      const pin = (e.target.value || "").trim();
      if (/^[1-9][0-9]{5}$/.test(pin)) {
        debouncedLookup(pin);
      } else {
        setPincodeError("");
      }
    }
  }; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name?.trim()) return setError("Resort Name is required");
    if (!form.address?.trim()) return setError("Address is required");
    if (!form.locationZone?.trim()) return setError("Location / Zone is required");
    if (!form.ownerName?.trim()) return setError("Owner Name is required");
    if (!form.ownerContact?.trim()) return setError("Owner Contact is required");

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
        // convert displayed dd/mm/yyyy back to ISO (yyyy-mm-dd) for storage/payload
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
      // if renewalDate exists and looks like ISO, format to dd/mm/yyyy for export readability
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

          <button className="sa-primary-button" type="button" onClick={openCreateForm}>
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
          {/* searchable dropdown using datalist for Maharashtra cities */}
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
                      {/* Actions: View / Edit / Delete (icons) */}
                      <button title="View" className="sa-icon-button" onClick={() => openView(r)} style={{ marginRight: 6 }}>
                        <i className="ri-eye-line" />
                      </button>

                      <button title="Edit" className="sa-icon-button" onClick={() => openEditForm(r)} style={{ marginRight: 6 }}>
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
                <input name="name" value={form.name} onChange={handleFormChange} placeholder="Resort Name" required />
              </label>

              <label>
                Code (auto)
                <input name="code" value={form.code} onChange={handleFormChange} placeholder="Auto-generated code" />
                <small style={{display:"block", color:"#6b7280"}}>Auto-generated from name; you may override.</small>
              </label>

              <label>
                Address *
                <textarea name="address" value={form.address} onChange={handleFormChange} placeholder="Street, area, pin" required />
              </label>

              <label>
                Location / Zone *
                {/* datalist gives a searchable dropdown experience */}
                <input list="maha-cities" name="locationZone" value={form.locationZone} onChange={handleFormChange} placeholder="e.g. Mumbai / Pune / Lonavala" required />
                <small style={{display:"block", color:"#6b7280"}}>Select from Maharashtra cities or type any other place.</small>
              </label>

              <label>
                Owner Name *
                <input name="ownerName" value={form.ownerName} onChange={handleFormChange} placeholder="Owner full name" required />
              </label>

              <label>
                Owner Contact *
                <input name="ownerContact" value={form.ownerContact} onChange={handleFormChange} placeholder="+91-XXXXXXXXXX" required />
              </label>

              <label>
                Pincode
                <input
                  name="pincode"
                  value={form.pincode || ""}
                  onChange={handleFormChange}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                {pincodeLoading && <small style={{display:"block"}}>Checking pincode…</small>}
                {pincodeError && <small style={{display:"block", color:'#b91c1c'}}>{pincodeError}</small>}
                <small style={{display:"block", color:"#6b7280"}}>Enter pincode to auto-fill Location/District</small>
              </label>

              <label>
                Owner Email
                <input type="email" name="ownerEmail" value={form.ownerEmail} onChange={handleFormChange} placeholder="owner@example.com" />
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
                <input type="number" name="noOfKeys" min="0" value={form.noOfKeys} onChange={handleFormChange} placeholder="e.g. 20" />
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
                <input name="fssaiNumber" value={form.fssaiNumber} onChange={handleFormChange} placeholder="FSSAI / license no" />
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
                {/* switched to text input to accept dd/mm/yyyy */}
                <input
                  name="renewalDate"
                  value={form.renewalDate}
                  onChange={handleFormChange}
                  placeholder="dd/mm/yyyy"
                />
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
              <button type="button" className="sa-primary-button" onClick={() => { setShowView(false); openEditForm(viewItem); }}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* datalist for Maharashtra cities (used by both filter and form inputs) */}
      <datalist id="maha-cities">
  {FLAT_MAHA_LIST.map((v) => <option key={v} value={v} />)}
</datalist>
    </div>
  );
};

export default ResortList;
