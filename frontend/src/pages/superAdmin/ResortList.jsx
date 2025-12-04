// UPDATED ResortList.jsx with pincode auto-fetch + correct import path
// NOTE: adjust import path if your folder structure differs.

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MAHARASHTRA_LOCATIONS from "../../data/maharashtraLocations";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// --- Flatten district → cities list for datalist ---
const FLAT_MAHA_LIST = MAHARASHTRA_LOCATIONS.flatMap(d =>
  d.cities.map(c => `${d.district} — ${c}`)
);

// Dummy resorts unchanged
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
    renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
      .toISOString()
      .slice(0, 10),
    isActive: true,
  },
];

// Empty form
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
  pincode: "",
  isActive: true,
});

const TIEUP_OPTIONS = ["Managed", "Marketed", "Owned", "Commissionable"];
const QUALITY_OPTIONS = ["5-Star", "4-Star", "3-Star", "Budget"];
const LOCATION_OPTIONS = ["Mainstream", "Offbeat"];

// Date helpers
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
  return `${yyyy}-${pad(mm)}-${pad(dd)}`;
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

  const [filterName, setFilterName] = useState("");
  const [filterCode, setFilterCode] = useState("");
  const [filterLocationZone, setFilterLocationZone] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTieUpCategory, setFilterTieUpCategory] = useState("");
  const [filterQualityCategory, setFilterQualityCategory] = useState("");
  const [filterLocationCategory, setFilterLocationCategory] = useState("");

  // PINCODE STATES
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
      if (info.Status !== "Success" || !info.PostOffice?.length) {
        setPincodeError("Pincode not found");
        return null;
      }
      const first = info.PostOffice[0];
      const autoLocation = `${first.District} — ${first.Name}`;

      setForm(prev => {
        if (prev.locationZone && prev.locationZone.trim() !== "") {
          return { ...prev, pincode: pin };
        }
        return { ...prev, pincode: pin, locationZone: autoLocation };
      });

      setPincodeError("");
    } catch (err) {
      setPincodeError("Failed to fetch pincode info");
    } finally {
      setPincodeLoading(false);
    }
  };

  const debouncedLookup = debounce((pin) => lookupPincode(pin), 500);

  // LOAD RESORTS
  const loadResorts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/resorts`).catch(() => ({ data: [] }));
      const server = Array.isArray(res.data) ? res.data : [];
      const normalize = (r) => ({
        ...r,
        _id: r._id || r.id || `${(r.name || "resort")}_${Math.random()}`,
      });

      const normalizedServer = server.map(normalize);
      const existingIds = new Set(normalizedServer.map(r => r._id));
      const samples = DEV_RESORTS.filter(d => !existingIds.has(d._id)).map(normalize);

      setResorts([...normalizedServer, ...samples]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResorts();
  }, []);

  const generateCodeFromName = (name) => {
    if (!name) return "";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return words.map(w => w[0]).join("").slice(0, 4).toUpperCase();
  };

  useEffect(() => {
    if (!form.renewalDate) return;
    const d = parseDDMMYYYYToDate(form.renewalDate);
    if (!d) return;

    const today = new Date();
    const todayMid = new Date(today.toDateString());
    const status = d < todayMid ? "expired" : "active";
    setForm(p => ({ ...p, fssaiStatus: status }));
  }, [form.renewalDate]);

  // FILTER
  const filtered = useMemo(() => {
    return resorts.filter(r => {
      if (filterName && !r.name?.toLowerCase().includes(filterName.toLowerCase())) return false;
      if (filterCode && !r.code?.toLowerCase().includes(filterCode.toLowerCase())) return false;
      if (filterLocationZone && !r.locationZone?.toLowerCase().includes(filterLocationZone.toLowerCase())) return false;
      if (filterStatus === "active" && r.isActive === false) return false;
      if (filterStatus === "inactive" && r.isActive !== false) return false;
      if (filterTieUpCategory && (r.tieUpCategory || "") !== filterTieUpCategory) return false;
      if (filterQualityCategory && (r.qualityCategory || "") !== filterQualityCategory) return false;
      if (filterLocationCategory && (r.locationCategory || "") !== filterLocationCategory) return false;
      return true;
    });
  }, [resorts, filterName, filterCode, filterLocationZone, filterStatus, filterTieUpCategory, filterQualityCategory, filterLocationCategory]);

  const openCreateForm = () => {
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEditForm = (r) => {
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
      pincode: r.pincode || "",
      isActive: r.isActive !== false,
    });
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm(p => {
      const next = { ...p, [name]: type === "checkbox" ? checked : value };
      if (name === "name") {
        const auto = generateCodeFromName(value);
        if (!p.code || p.code === generateCodeFromName(p.name || "")) {
          next.code = auto;
        }
      }
      return next;
    });

    if (name === "pincode") {
      const pin = value.trim();
      if (/^[1-9][0-9]{5}$/.test(pin)) {
        debouncedLookup(pin);
      } else {
        setPincodeError("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Resort Name required");
    if (!form.address.trim()) return setError("Address required");
    if (!form.locationZone.trim()) return setError("Location required");
    if (!form.ownerName.trim()) return setError("Owner required");
    if (!form.ownerContact.trim()) return setError("Contact required");

    try {
      setSaving(true);
      const payload = {
        ...form,
        code: form.code || generateCodeFromName(form.name || ""),
        noOfKeys: form.noOfKeys ? Number(form.noOfKeys) : undefined,
        renewalDate: form.renewalDate ? parseDDMMYYYYToISO(form.renewalDate) : undefined,
        isActive: !!form.isActive,
      };

      if (form._id) {
        const res = await axios.put(`${API_BASE}/api/resorts/${form._id}`, payload).catch(() => null);
        if (res?.data) {
          setResorts(p => p.map(x => x._id === form._id ? res.data : x));
        }
      } else {
        const res = await axios.post(`${API_BASE}/api/resorts`, payload).catch(() => null);
        const created = res?.data || { ...payload, _id: `local_${Date.now()}` };
        setResorts(p => [created, ...p]);
      }

      setShowForm(false);
      setForm(emptyForm());
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete resort ${r.name}?`)) return;
    setResorts(p => p.filter(x => x._id !== r._id));
    await axios.delete(`${API_BASE}/api/resorts/${r._id}`).catch(() => null);
  };

  const toggleActive = async (r) => {
    const newStatus = !(r.isActive === false);
    setResorts(p => p.map(x => x._id === r._id ? { ...x, isActive: newStatus } : x));
    await axios.put(`${API_BASE}/api/resorts/${r._id}`, { isActive: newStatus }).catch(() => null);
  };

  const exportCSV = (list) => {
    const cols = ["name", "code", "address", "locationZone", "ownerName", "ownerContact", "noOfKeys", "tieUpCategory", "qualityCategory", "locationCategory", "fssaiNumber", "fssaiStatus", "renewalDate", "isActive", "pincode"];

    const rows = [cols.join(",")].concat(list.map((r) => cols.map((c) => {
      let v = r[c];
      if (c === "isActive") v = r.isActive === false ? "false" : "true";
      if (c === "renewalDate" && v) v = formatISOToDDMMYYYY(v);
      return String(v ?? "");
    }).join(",")));

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
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
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="sa-secondary-button" onClick={() => exportCSV(filtered)}>Download</button>
          <button className="sa-primary-button" onClick={openCreateForm}>New Resort</button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="sa-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <label>
          Name
          <input value={filterName} onChange={(e) => setFilterName(e.target.value)} />
        </label>

        <label>
          Code
          <input value={filterCode} onChange={(e) => setFilterCode(e.target.value)} />
        </label>

        <label>
          Location/Zone
          <input list="maha-cities" value={filterLocationZone} onChange={(e) => setFilterLocationZone(e.target.value)} />
        </label>

        <datalist id="maha-cities">
          {FLAT_MAHA_LIST.map(v => <option key={v} value={v} />)}
        </datalist>
      </div>

      {/* LIST */}
      <div className="sa-card">
        {loading ? (
          <div>Loading…</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Location</th>
                <th>Owner</th>
                <th>Keys</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r) => (
                <tr key={r._id}>
                  <td>{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.locationZone}</td>
                  <td>{r.ownerName}</td>
                  <td>{r.noOfKeys ?? "-"}</td>
                  <td>{r.isActive === false ? "Inactive" : "Active"}</td>
                  <td>
                    <button onClick={() => openEditForm(r)}>Edit</button>
                    <button onClick={() => handleDelete(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="sa-modal-backdrop" onClick={() => !saving && setShowForm(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{form._id ? "Edit Resort" : "New Resort"}</h3>

            <form className="sa-modal-form" onSubmit={handleSubmit}>
              <label>
                Resort Name *
                <input name="name" value={form.name} onChange={handleFormChange} required />
              </label>

              <label>
                Code
                <input name="code" value={form.code} onChange={handleFormChange} />
              </label>

              <label>
                Address *
                <textarea name="address" value={form.address} onChange={handleFormChange} required />
              </label>

              <label>
                Pincode
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={handleFormChange}
                  placeholder="6-digit"
                  maxLength={6}
                />
                {pincodeLoading && <small>Checking…</small>}
                {pincodeError && <small style={{ color: "#b91c1c" }}>{pincodeError}</small>}
              </label>

              <label>
                Location / Zone *
                <input
                  list="maha-cities"
                  name="locationZone"
                  value={form.locationZone}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label>
                Owner Name *
                <input name="ownerName" value={form.ownerName} onChange={handleFormChange} required />
              </label>

              <label>
                Owner Contact *
                <input name="ownerContact" value={form.ownerContact} onChange={handleFormChange} required />
              </label>

              <label>
                Owner Email
                <input name="ownerEmail" value={form.ownerEmail} onChange={handleFormChange} />
              </label>

              <label>
                No of Keys
                <input name="noOfKeys" value={form.noOfKeys} onChange={handleFormChange} />
              </label>

              <label>
                FSSAI Number
                <input name="fssaiNumber" value={form.fssaiNumber} onChange={handleFormChange} />
              </label>

              <label>
                Renewal Date
                <input name="renewalDate" value={form.renewalDate} onChange={handleFormChange} />
              </label>

              <div>
                <input type="checkbox" name="isActive" checked={!!form.isActive} onChange={handleFormChange} /> Active
              </div>

              {error && <div style={{ color: "red" }}>{error}</div>}

              <div className="sa-modal-actions">
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResortList;
