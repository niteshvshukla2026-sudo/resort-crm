import React, { useEffect, useState } from "react";
import api from "../../api/axios"; // 👈 same axios instance jo CRM me use ho raha hai

/* =====================================================
   REPORTS OVERVIEW – FINAL PRODUCTION VERSION
===================================================== */

const ReportsOverview = () => {
  const [activeTab, setActiveTab] = useState("item-stock");

  const [filters, setFilters] = useState({
    resortId: "all",
    storeId: "all",
    itemId: "all",
    userId: "all",
    from: "",
    to: "",
  });

  const [meta, setMeta] = useState({
    resorts: [],
    stores: [],
    items: [],
    users: [],
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ===============================
     LOAD FILTER MASTER DATA
  =============================== */
  useEffect(() => {
    const loadMeta = async () => {
      const [resorts, stores, items, users] = await Promise.all([
        api.get("/resorts"),
        api.get("/stores"),
        api.get("/items"),
        api.get("/users"),
      ]);

      setMeta({
        resorts: resorts.data || [],
        stores: stores.data || [],
        items: items.data || [],
        users: users.data || [],
      });
    };

    loadMeta();
  }, []);

  /* ===============================
     LOAD REPORT DATA
  =============================== */
  useEffect(() => {
    loadReport();
    // eslint-disable-next-line
  }, [activeTab, filters]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/${activeTab}`, {
        params: filters,
      });
      setRows(res.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  /* ===============================
     DOWNLOAD REPORT
  =============================== */
  const downloadReport = () => {
    const params = new URLSearchParams({ ...filters, download: true });
    window.open(
      `${import.meta.env.VITE_API_BASE}/api/reports/${activeTab}?${params.toString()}`,
      "_blank"
    );
  };

  const onFilterChange = (e) => {
    setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  return (
    <div className="sa-page">
      {/* ================= HEADER ================= */}
      <div className="sa-page-header">
        <div>
          <h2>Reports</h2>
          <p>Resort, store, item, stock & user activity reports</p>
        </div>
        <button className="sa-primary-button" onClick={downloadReport}>
          <i className="ri-download-2-line" /> Download
        </button>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="sa-card sa-report-filters">
        <div className="sa-tabs">
          <Tab label="Item Stock" value="item-stock" {...{ activeTab, setActiveTab }} />
          <Tab label="Store Stock" value="store-stock" {...{ activeTab, setActiveTab }} />
          <Tab label="Purchase" value="purchase" {...{ activeTab, setActiveTab }} />
          <Tab label="Consumption" value="consumption" {...{ activeTab, setActiveTab }} />
          <Tab label="User Activity" value="user-activity" {...{ activeTab, setActiveTab }} />
          <Tab label="Audit Logs" value="audit-logs" {...{ activeTab, setActiveTab }} />
        </div>

        <div className="sa-report-filter-row">
          <Filter label="Resort">
            <select name="resortId" value={filters.resortId} onChange={onFilterChange}>
              <option value="all">All Resorts</option>
              {meta.resorts.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Filter>

          <Filter label="Store">
            <select name="storeId" value={filters.storeId} onChange={onFilterChange}>
              <option value="all">All Stores</option>
              {meta.stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Filter>

          <Filter label="Item">
            <select name="itemId" value={filters.itemId} onChange={onFilterChange}>
              <option value="all">All Items</option>
              {meta.items.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.name}
                </option>
              ))}
            </select>
          </Filter>

          <Filter label="User">
            <select name="userId" value={filters.userId} onChange={onFilterChange}>
              <option value="all">All Users</option>
              {meta.users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Filter>

          <Filter label="From">
            <input type="date" name="from" value={filters.from} onChange={onFilterChange} />
          </Filter>

          <Filter label="To">
            <input type="date" name="to" value={filters.to} onChange={onFilterChange} />
          </Filter>
        </div>
      </div>

      {/* ================= REPORT TABLE ================= */}
      <div className="sa-card">
        <div className="sa-card-title">
          {activeTab.replace("-", " ").toUpperCase()}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  {rows[0] &&
                    Object.keys(rows[0]).map((h) => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    {Object.values(r).map((c, j) => (
                      <td key={j}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ===============================
   SMALL COMPONENTS
=============================== */

const Tab = ({ label, value, activeTab, setActiveTab }) => (
  <button
    type="button"
    className={`sa-tab ${activeTab === value ? "active" : ""}`}
    onClick={() => setActiveTab(value)}
  >
    {label}
  </button>
);

const Filter = ({ label, children }) => (
  <div className="sa-report-filter-group">
    <label>{label}</label>
    {children}
  </div>
);

export default ReportsOverview;
