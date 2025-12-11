// src/pages/superAdmin/ConsumptionList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "LUMPSUM", label: "Lumpsum" },
  { value: "RECIPE_LUMPSUM", label: "Lumpsum by Recipe" },
  { value: "RECIPE_PORTION", label: "Portion by Recipe" },
];

const typeLabel = (type) => {
  if (!type) return "-";
  if (type === "LUMPSUM") return "Lumpsum";
  if (type === "RECIPE_LUMPSUM") return "Lumpsum by Recipe";
  if (type === "RECIPE_PORTION") return "Portion by Recipe";
  return type;
};

// --- DEV SAMPLES (only non-REPLACEMENT samples kept) ---
const DEV_CONSUMPTION_SAMPLES = [
  {
    _id: "dev_cons_1",
    date: new Date().toISOString(),
    type: "LUMPSUM",
    eventName: "Staff Meal - Kitchen",
    menuName: null,
    resort: "Resort A",
    department: "Kitchen",
    storeFrom: { _id: "store_cold", name: "Cold Store" },
    storeTo: null,
    lines: [{ item: "Rice", qty: 10, uom: "Kg" }],
    notes: "Daily staff meal lumpsum",
  },
  {
    _id: "dev_cons_2",
    date: new Date().toISOString(),
    type: "RECIPE_LUMPSUM",
    eventName: "Wedding Dinner",
    menuName: "Veg Buffet",
    resort: "Resort A",
    department: null,
    storeFrom: { _id: "store_main", name: "Main Store" },
    storeTo: null,
    lines: [{ item: "Paneer", qty: 8, uom: "Kg" }],
    notes: "Recipe lumpsum for wedding",
  },
  {
    _id: "dev_cons_3",
    date: new Date().toISOString(),
    type: "RECIPE_PORTION",
    eventName: "Catering - 50 pax",
    menuName: "Set Menu B",
    resort: "Resort B",
    department: null,
    storeFrom: { _id: "store_cold", name: "Cold Store" },
    storeTo: null,
    lines: [{ item: "Chicken", qty: 25, uom: "Kg" }],
    notes: "Portion consumption by recipe",
  },
  {
    _id: "dev_cons_4",
    date: new Date().toISOString(),
    type: "LUMPSUM",
    eventName: "Banquet - Lumpsum",
    menuName: "Banquet Menu",
    resort: "Resort C",
    department: null,
    storeFrom: { _id: "store_freezer", name: "Freezer" },
    storeTo: null,
    lines: [{ item: "Oil", qty: 20, uom: "Ltr" }],
    notes: "Lumpsum for banquet",
  },
];

const ConsumptionList = () => {
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]); // merged server + samples
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // other filters
  const [resortFilter, setResortFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchText, setSearchText] = useState("");

  const navigate = useNavigate();

  const buildParams = () => {
    const params = {};
    if (typeFilter) params.type = typeFilter;
    return params;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const params = buildParams();
      let res;
      try {
        res = await axios.get(`${API_BASE}/api/consumption`, { params });
      } catch (apiErr) {
        // fallback to empty server data if API errors
        console.warn("API call failed (consumption). Falling back to samples.", apiErr);
        res = { data: [] };
      }

      const serverData = Array.isArray(res.data) ? res.data : [];
      // Remove any server-side REPLACEMENT entries (we don't show replacement on this page)
      const serverNonReplacement = serverData.filter((r) => r.type !== "REPLACEMENT");

      // merge without duplicates by _id
      const existingIds = new Set(serverNonReplacement.map((r) => r._id));
      const toAdd = DEV_CONSUMPTION_SAMPLES.filter((s) => !existingIds.has(s._id));
      const merged = [...serverNonReplacement, ...toAdd];

      setAllRows(merged);
      setRows(applyFiltersTo(merged));
    } catch (err) {
      console.error("load consumption error", err);
      setError("Failed to load consumption entries");
      setAllRows(DEV_CONSUMPTION_SAMPLES);
      setRows(applyFiltersTo(DEV_CONSUMPTION_SAMPLES));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // apply the UI filters to provided dataset
  const applyFiltersTo = (dataset) => {
    return dataset.filter((r) => {
      // exclude replacements always
      if (r.type === "REPLACEMENT") return false;

      // type filter (if selected)
      if (typeFilter) {
        if (r.type !== typeFilter) return false;
      }

      // resort filter
      if (resortFilter) {
        const val = (r.resort || r.resortName || "").toString().toLowerCase();
        if (!val.includes(resortFilter.toLowerCase())) return false;
      }

      // store / dept filter
      if (storeFilter) {
        const storeCandidates = [
          r.storeFrom?.name,
          r.storeTo?.name,
          r.department?.name,
          r.store?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!storeCandidates.includes(storeFilter.toLowerCase())) return false;
      }

      // date range
      if (dateFrom) {
        const d = r.date ? new Date(r.date).setHours(0, 0, 0, 0) : null;
        const from = new Date(dateFrom).setHours(0, 0, 0, 0);
        if (!d || d < from) return false;
      }
      if (dateTo) {
        const d = r.date ? new Date(r.date).setHours(0, 0, 0, 0) : null;
        const to = new Date(dateTo).setHours(0, 0, 0, 0);
        if (!d || d > to) return false;
      }

      // text search across fields
      if (searchText && searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        const fields = [
          r._id,
          r.referenceNo,
          r.eventName,
          r.menuName,
          r.type,
          r.resort,
          r.storeFrom?.name,
          r.storeTo?.name,
          r.department?.name,
          ...(r.lines || []).map((ln) => ln.item),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!fields.includes(q)) return false;
      }

      return true;
    });
  };

  // reapply filters when filter state or allRows change
  useEffect(() => {
    setRows(applyFiltersTo(allRows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, resortFilter, storeFilter, dateFrom, dateTo, searchText, allRows]);

  const onNewClick = () => {
    navigate("/super-admin/consumption/new");
  };

  const onRowClick = (row) => {
    navigate(`/super-admin/consumption/${row._id}`);
  };

  const clearFilters = () => {
    setTypeFilter("");
    setResortFilter("");
    setStoreFilter("");
    setDateFrom("");
    setDateTo("");
    setSearchText("");
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h2>Consumption</h2>
          <p>Record stock consumption by lumpsum / recipe / portion.</p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="sa-primary-button" onClick={onNewClick}>
            <i className="ri-add-line" /> New
          </button>

          <button
            type="button"
            className="sa-secondary-button"
            onClick={() => {
              loadData();
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div
        className="sa-card"
        style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}
      >
        <label style={{ fontSize: "0.9rem" }}>
          Type
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ marginLeft: 8, marginTop: 4 }}>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value ?? "all"} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Resort
          <input placeholder="Resort name" value={resortFilter} onChange={(e) => setResortFilter(e.target.value)} style={{ marginLeft: 8 }} />
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Store / Dept
          <input placeholder="Store or Department" value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} style={{ marginLeft: 8 }} />
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Date from
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ marginLeft: 8 }} />
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Date to
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ marginLeft: 8 }} />
        </label>

        <label style={{ flex: 1, minWidth: 200 }}>
          Search
          <input
            placeholder="Event/Menu/Store/Item..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ marginLeft: 8, width: "80%" }}
          />
        </label>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="sa-secondary-button" onClick={clearFilters}>
            Clear
          </button>
          <div style={{ fontSize: "0.9rem", color: "#9ca3af", alignSelf: "center" }}>
            Showing: {rows.length} / {allRows.length}
          </div>
        </div>
      </div>

      <div className="sa-card">
        {error && (
          <div className="sa-modal-error" style={{ marginBottom: 8 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ fontSize: "0.9rem" }}>Loading...</div>
        ) : rows.length === 0 ? (
          <div style={{ fontSize: "0.9rem" }}>No consumption entries found. Click “New” to add one.</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Event / Reference</th>
                <th>Store / Dept</th>
                <th>Lines</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} style={{ cursor: "pointer" }} onClick={() => onRowClick(row)}>
                  <td>{row.date ? new Date(row.date).toLocaleDateString() : "-"}</td>
                  <td>{typeLabel(row.type)}</td>
                  <td>{row.eventName || row.menuName || row.referenceNo || "-"}</td>
                  <td>
                    {row.storeFrom?.name || ""} {row.storeTo ? `→ ${row.storeTo.name}` : row.department?.name ? `(${row.department.name})` : ""}
                  </td>
                  <td>{row.lines?.length || 0}</td>
                  <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ConsumptionList;
