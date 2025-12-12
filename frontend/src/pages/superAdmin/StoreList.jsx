// src/pages/superAdmin/StoreList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

// tumhara backend items ke liye /api/items use kar raha hai
// isliye yahan bhi /api hi rakhenge
const API_BASE =
  (import.meta.env.VITE_API_BASE || "http://localhost:5000") + "/api";

const emptyForm = () => ({ _id: undefined, resort: "", name: "", code: "" });

const StoreList = () => {
  const [stores, setStores] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // UI / modal
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // Filters
  const [filterResort, setFilterResort] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterCode, setFilterCode] = useState("");

  // CSV upload state
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState("");

  // ---------- helpers ----------

  const normalizeResortList = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.resorts)) return payload.resorts;
    return [];
  };

  const normalizeStoreList = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.stores)) return payload.stores;
    return [];
  };

  // find resort id by name (case-insensitive, trimmed)
  const findResortIdByName = (name) => {
    if (!name) return null;
    const target = String(name).trim().toLowerCase();
    const r = resorts.find((x) => (x.name || "").trim().toLowerCase() === target);
    return r ? (r._id || r.id) : null;
  };

  // backend se data lana (stores + resorts)
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      let loadedStores = [];
      let loadedResorts = [];

      try {
        const storeRes = await axios.get(`${API_BASE}/stores`);
        console.log("STORES API DATA:", storeRes.data);
        loadedStores = normalizeStoreList(storeRes.data);
      } catch (e) {
        console.error("Error loading stores:", e);
        setError((prev) => prev || "Failed to load stores from server");
      }

      try {
        const resortRes = await axios.get(`${API_BASE}/resorts`);
        console.log("RESORTS API DATA:", resortRes.data);
        loadedResorts = normalizeResortList(resortRes.data);
      } catch (e) {
        console.error("Error loading resorts:", e);
        setError((prev) => prev || "Failed to load resorts from server");
      }

      setStores(loadedStores);
      setResorts(loadedResorts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // resort id se resort ka name nikalna
  const getResortName = (resortRef) => {
    if (!resortRef) return "-";

    if (typeof resortRef === "object") {
      if (resortRef.name) return resortRef.name;
      const id = resortRef._id || resortRef.id;
      const r = resorts.find((x) => (x._id || x.id) === id);
      return r ? r.name : id || "-";
    }

    const r = resorts.find((x) => (x._id || x.id) === resortRef);
    return r ? r.name : resortRef;
  };

  // filters
  const filtered = useMemo(() => {
    return stores.filter((s) => {
      const resortId =
        typeof s.resort === "object"
          ? s.resort._id || s.resort.id
          : s.resort || s.resortId;

      if (filterResort && resortId !== filterResort) return false;
      if (
        filterName &&
        !s.name?.toLowerCase().includes(filterName.toLowerCase())
      )
        return false;
      if (
        filterCode &&
        !s.code?.toLowerCase().includes(filterCode.toLowerCase())
      )
        return false;
      return true;
    });
  }, [stores, filterResort, filterName, filterCode]);

  // ---------- CRUD ----------

  const openCreateForm = () => {
    setForm(emptyForm());
    setError("");
    setShowForm(true);
  };

  const openEditForm = (s) => {
    const resortId =
      typeof s.resort === "object"
        ? s.resort._id || s.resort.id
        : s.resort || s.resortId || "";

    setForm({
      _id: s._id || s.id,
      resort: resortId,
      name: s.name || "",
      code: s.code || "",
    });
    setError("");
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.resort || !form.name) {
      setError("Resort and Store name required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        resort: form.resort,
        name: form.name,
        code: form.code || undefined,
      };

      if (form._id) {
        const res = await axios
          .put(`${API_BASE}/stores/${form._id}`, payload)
          .catch(() => null);

        if (res?.data) {
          setStores((p) =>
            p.map((x) => (x._id === form._id || x.id === form._id ? res.data : x))
          );
        } else {
          setStores((p) =>
            p.map((x) =>
              x._id === form._id || x.id === form._id ? { ...x, ...payload } : x
            )
          );
        }
      } else {
        const res = await axios
          .post(`${API_BASE}/stores`, payload)
          .catch(() => null);
        const created = res?.data || { ...payload, _id: `local_${Date.now()}` };
        setStores((p) => [created, ...p]);
      }

      setShowForm(false);
      setForm(emptyForm());
    } catch (err) {
      console.error("save store error", err);
      setError(err.response?.data?.message || "Failed to save store");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete store ${s.name || s._id}?`)) return;
    try {
      setStores((p) => p.filter((x) => (x._id || x.id) !== (s._id || s.id)));
      await axios.delete(`${API_BASE}/stores/${s._id || s.id}`).catch(() => null);
    } catch (err) {
      console.error("delete error", err);
      setError("Failed to delete store");
      await loadData();
    }
  };

  // ---------- CSV Upload / Export (updated to use resort name) ----------

  const handleCSVUpload = (file) => {
    setCsvError("");
    if (!file) return;
    setCsvLoading(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      const rows = text
        .split(/\r?\n/)
        .map((r) => r.trim())
        .filter(Boolean);

      if (rows.length <= 1) {
        setCsvError("CSV has no data");
        setCsvLoading(false);
        return;
      }

      const header = rows[0]
        .split(",")
        .map((h) => h.trim().toLowerCase());
      const required = ["name", "resort"];
      for (const r of required) {
        if (!header.includes(r)) {
          setCsvError(`CSV must include columns: ${required.join(",")}`);
          setCsvLoading(false);
          return;
        }
      }

      const parsed = [];
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(",").map((c) => c.trim());
        if (cols.length === 0) continue;
        const obj = {};
        for (let c = 0; c < header.length; c++) obj[header[c]] = cols[c] ?? "";
        parsed.push(obj);
      }

      if (!parsed.length) {
        setCsvError("No rows found in CSV");
        setCsvLoading(false);
        return;
      }

      // Map parsed resort names -> resort ids (if found)
      const parsedWithResolvedResort = parsed.map((p) => {
        const resortName = p.resort ?? "";
        const matchedId = findResortIdByName(resortName);
        return {
          ...p,
          // if matched convert to id, else keep the raw value (so downstream you can see it)
          resolvedResort: matchedId || resortName,
        };
      });

      // Add local previews (use resolvedResort)
      const localAdded = parsedWithResolvedResort.map((p) => ({
        _id: `local_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        resort: p.resolvedResort,
        name: p.name,
        code: p.code || "",
      }));
      setStores((prev) => [...localAdded, ...prev]);

      try {
        for (const p of parsedWithResolvedResort) {
          const payload = {
            resort: p.resolvedResort,
            name: p.name,
            code: p.code || undefined,
          };
          try {
            await axios.post(`${API_BASE}/stores`, payload).catch(() => null);
          } catch (err) {
            console.warn("store csv create failed for", p, err);
          }
        }
      } catch (err) {
        console.error("CSV create sequence failed", err);
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

  const handleExportCSV = (list) => {
    const cols = ["resort", "name", "code"];
    const rows = [cols.join(",")].concat(
      list.map((s) =>
        cols
          .map((c) => {
            let val = s[c];
            if (c === "resort") {
              // IMPORTANT: use resort *name* for export
              val = getResortName(s.resort);
            }
            const str = String(val ?? "");
            if (str.includes(",") || str.includes("\n"))
              return `"${str.replace(/"/g, '""')}"`;
            return str;
          })
          .join(",")
      )
    );
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stores-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // resort dropdown options
  const resortOptions = useMemo(
    () =>
      resorts.map((r) => ({
        id: r._id || r.id,
        name: r.name,
      })),
    [resorts]
  );

  // ---------- UI ----------

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>Stores</h2>
          <p>Define physical stores for each resort to track inventory.</p>
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
              title="Upload CSV (columns: resort,name,code) — resort should be resort NAME"
            />
            <span style={{ marginLeft: 6 }}>
              {csvLoading ? "Uploading..." : "Upload CSV"}
            </span>
          </label>

          <button
            className="sa-secondary-button"
            onClick={() => handleExportCSV(filtered)}
          >
            Export CSV
          </button>

          <button
            className="sa-primary-button"
            type="button"
            onClick={openCreateForm}
          >
            <i className="ri-add-line" /> New Store
          </button>
        </div>
      </div>

      {error && (
        <div className="sa-modal-error" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}
      {csvError && (
        <div className="sa-modal-error" style={{ marginBottom: 8 }}>
          {csvError}
        </div>
      )}

      {/* Filters */}
      <div
        className="sa-card"
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <label>
          Resort
          <select
            value={filterResort}
            onChange={(e) => setFilterResort(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="">All</option>
            {resortOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Store Name
          <input
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="Search name..."
            style={{ marginLeft: 8 }}
          />
        </label>

        <label>
          Code
          <input
            value={filterCode}
            onChange={(e) => setFilterCode(e.target.value)}
            placeholder="Code..."
            style={{ marginLeft: 8 }}
          />
        </label>

        <div style={{ marginLeft: "auto", color: "#9ca3af" }}>
          Showing {filtered.length} / {stores.length}
        </div>
      </div>

      {/* List */}
      <div className="sa-card">
        {loading ? (
          <div>Loading stores...</div>
        ) : filtered.length === 0 ? (
          <div>No stores found. Try clearing filters or add a new store.</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Resort</th>
                <th>Store</th>
                <th>Code</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((s) => (
                <tr key={s._id || s.id}>
                  <td>{getResortName(s.resort)}</td>
                  <td>{s.name}</td>
                  <td>{s.code}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button
                      className="sa-secondary-button"
                      onClick={() => openEditForm(s)}
                      title="Edit"
                    >
                      <i className="ri-edit-line" />
                    </button>
                    <button
                      className="sa-secondary-button"
                      onClick={() => {
                        navigator.clipboard?.writeText(JSON.stringify(s));
                      }}
                      title="Copy JSON"
                    >
                      <i className="ri-file-copy-line" />
                    </button>
                    <button
                      className="sa-secondary-button"
                      onClick={() => handleDelete(s)}
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
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{form._id ? "Edit Store" : "New Store"}</h3>
            <p className="sa-modal-sub">
              Add a physical store for a resort (Main Store / Bar Store / HK
              Store).
            </p>

            <form className="sa-modal-form" onSubmit={handleSubmit}>
              <label>
                Resort
                <select
                  name="resort"
                  value={form.resort}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select resort</option>
                  {resortOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Store Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Main Store / Bar Store..."
                  required
                />
              </label>

              <label>
                Code
                <input
                  name="code"
                  value={form.code}
                  onChange={handleFormChange}
                  placeholder="MAIN / BAR / HK"
                />
              </label>

              {error && <div className="sa-modal-error">{error}</div>}

              <div className="sa-modal-actions">
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
                    ? "Update Store"
                    : "Save Store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreList;
