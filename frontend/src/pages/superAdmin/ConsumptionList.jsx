import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "LUMPSUM", label: "Lumpsum" },
  { value: "RECIPE_LUMPSUM", label: "Lumpsum by Recipe" },
  { value: "RECIPE_PORTION", label: "Portion by Recipe" },
  { value: "REPLACEMENT", label: "Store Replacement" },
];

const typeLabel = (type) => {
  if (!type) return "-";
  if (type === "LUMPSUM") return "Lumpsum";
  if (type === "RECIPE_LUMPSUM") return "Lumpsum by Recipe";
  if (type === "RECIPE_PORTION") return "Portion by Recipe";
  if (type === "REPLACEMENT") return "Store Replacement";
  return type;
};

// --- DEV SAMPLES ---
// 4 consume samples (one for each consume type) + 5 transfer (replacement) samples
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

  // 5 replacements (store transfers)
  {
    _id: "dev_rep_1",
    date: new Date().toISOString(),
    type: "REPLACEMENT",
    referenceNo: "REP-2025-001",
    resort: "Resort A",
    department: null,
    storeFrom: { _id: "store_main", name: "Main Store" },
    storeTo: { _id: "store_bar", name: "Bar Store" },
    lines: [{ item: "Beer", qty: 50, uom: "Nos" }],
    notes: "Transfer to bar",
  },
  {
    _id: "dev_rep_2",
    date: new Date().toISOString(),
    type: "REPLACEMENT",
    referenceNo: "REP-2025-002",
    resort: "Resort A",
    department: null,
    storeFrom: { _id: "store_main", name: "Main Store" },
    storeTo: { _id: "store_spa", name: "Spa Store" },
    lines: [{ item: "Towel", qty: 30, uom: "Nos" }],
    notes: "Towels transfer",
  },
  {
    _id: "dev_rep_3",
    date: new Date().toISOString(),
    type: "REPLACEMENT",
    referenceNo: "REP-2025-003",
    resort: "Resort B",
    department: null,
    storeFrom: { _id: "store_cold", name: "Cold Store" },
    storeTo: { _id: "store_kitchen2", name: "Kitchen 2" },
    lines: [{ item: "Vegetables", qty: 100, uom: "Kg" }],
    notes: "Veg transfer",
  },
  {
    _id: "dev_rep_4",
    date: new Date().toISOString(),
    type: "REPLACEMENT",
    referenceNo: "REP-2025-004",
    resort: "Resort C",
    department: null,
    storeFrom: { _id: "store_freezer", name: "Freezer" },
    storeTo: { _id: "store_main", name: "Main Store" },
    lines: [{ item: "Frozen Fish", qty: 40, uom: "Kg" }],
    notes: "Frozen goods to main",
  },
  {
    _id: "dev_rep_5",
    date: new Date().toISOString(),
    type: "REPLACEMENT",
    referenceNo: "REP-2025-005",
    resort: "Resort B",
    department: null,
    storeFrom: { _id: "store_tools", name: "Tools Store" },
    storeTo: { _id: "store_maint", name: "Maintenance Store" },
    lines: [{ item: "Screws", qty: 500, uom: "Nos" }],
    notes: "Maintenance transfer",
  },
];

const ConsumptionList = () => {
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]); // raw merged server + samples
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("consume"); // 'consume' | 'transfer'

  // additional filter states
  const [resortFilter, setResortFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchText, setSearchText] = useState("");

  const navigate = useNavigate();

  // keep tab synced with explicit REPLACEMENT filter
  useEffect(() => {
    if (typeFilter === "REPLACEMENT") setActiveTab("transfer");
    else if (!typeFilter) {
      // keep current tab, no change
    } else {
      setActiveTab("consume");
    }
  }, [typeFilter]);

  const buildParams = () => {
    const params = {};
    // we intentionally keep server call simple: fetch all unless explicit type selected
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
        // if API fails, we'll still fallback to only dev samples
        console.warn("API call failed (consumption). Falling back to samples.", apiErr);
        res = { data: [] };
      }

      const serverData = Array.isArray(res.data) ? res.data : [];
      // merge without duplicates by _id
      const existingIds = new Set(serverData.map((r) => r._id));
      const toAdd = DEV_CONSUMPTION_SAMPLES.filter((s) => !existingIds.has(s._id));
      const merged = [...serverData, ...toAdd];

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

  // apply current UI filters to given dataset and return filtered array
  const applyFiltersTo = (dataset) => {
    return dataset.filter((r) => {
      // tab logic: consume -> exclude replacements unless explicit, transfer -> only replacements
      if (activeTab === "transfer") {
        if (r.type !== "REPLACEMENT") return false;
      } else {
        if (typeFilter) {
          // if user selected a specific type, ensure it matches (this includes possible REPLACEMENT)
          if (r.type !== typeFilter) return false;
        } else {
          // no explicit type & consume tab => exclude replacements
          if (r.type === "REPLACEMENT") return false;
        }
      }

      // resort filter (match by resort string or resort id)
      if (resortFilter) {
        const val = (r.resort || r.resortName || "").toString().toLowerCase();
        if (!val.includes(resortFilter.toLowerCase())) return false;
      }

      // store filter: check storeFrom.name or department name or storeTo
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

      // date range filter
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

      // text search across key fields
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

  // when any filter changes, recalc displayed rows from allRows
  useEffect(() => {
    setRows(applyFiltersTo(allRows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, activeTab, resortFilter, storeFilter, dateFrom, dateTo, searchText, allRows]);

  const onNewClick = () => {
    if (activeTab === "transfer" || typeFilter === "REPLACEMENT") {
      navigate("/super-admin/consumption/new?type=REPLACEMENT");
    } else {
      navigate("/super-admin/consumption/new");
    }
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
    setActiveTab("consume");
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h2>Consumption</h2>
          <p>Record stock consumption by lumpsum/recipe and store replacement.</p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`sa-secondary-button ${activeTab === "consume" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("consume");
                if (typeFilter === "REPLACEMENT") setTypeFilter("");
              }}
            >
              Consume
            </button>
            <button
              className={`sa-secondary-button ${activeTab === "transfer" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("transfer");
                setTypeFilter("REPLACEMENT");
              }}
            >
              Store Transfer
            </button>
          </div>

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
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ marginLeft: 8, marginTop: 4 }}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value ?? "all"} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Resort
          <input
            placeholder="Resort name"
            value={resortFilter}
            onChange={(e) => setResortFilter(e.target.value)}
            style={{ marginLeft: 8 }}
          />
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Store / Dept
          <input
            placeholder="Store or Department"
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            style={{ marginLeft: 8 }}
          />
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
            placeholder="GRN/Ref/Event/Menu/Store/Item..."
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
          <div style={{ fontSize: "0.9rem" }}>
            No {activeTab === "transfer" ? "transfer" : "consumption"} entries found. Click “New” to add one.
          </div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>{activeTab === "transfer" ? "Reference" : "Event / Reference"}</th>
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
                  <td>
                    {row.type === "REPLACEMENT" ? row.referenceNo || "-" : row.eventName || row.menuName || "-"}
                  </td>
                  <td>
                    {row.storeFrom?.name || ""}{" "}
                    {row.storeTo ? `→ ${row.storeTo.name}` : row.department?.name ? `(${row.department.name})` : ""}
                  </td>
                  <td>{row.lines?.length || 0}</td>
                  <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.notes || "-"}
                  </td>
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
