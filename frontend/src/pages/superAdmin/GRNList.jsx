import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useResort } from "../../context/ResortContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const GRNList = () => {
  const navigate = useNavigate();
  const { selectedResort } = useResort(); // 🌍 GLOBAL RESORT

  const [grns, setGrns] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [resorts, setResorts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔎 FILTER STATES (EXACT POList STYLE)
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL / CREATED / POSTED
  const [actionFilter, setActionFilter] = useState("ALL"); // ALL / NeedsPosting / Posted
  const [resortFilter, setResortFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchText, setSearchText] = useState("");

  // ---------------------------------------
  // LOAD DATA
  // ---------------------------------------
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [grnRes, vendorRes, resortRes] = await Promise.all([
        axios.get(`${API_BASE}/api/grn`),
        axios.get(`${API_BASE}/api/vendors`),
        axios.get(`${API_BASE}/api/resorts`),
      ]);

      setGrns(Array.isArray(grnRes.data) ? grnRes.data : []);
      setVendors(Array.isArray(vendorRes.data) ? vendorRes.data : []);
      setResorts(Array.isArray(resortRes.data) ? resortRes.data : []);
    } catch (err) {
      console.error("GRN load error", err);
      setError("Failed to load GRNs");
      setGrns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---------------------------------------
  // HELPERS
  // ---------------------------------------
  const getVendorName = (v) => {
    if (!v) return "-";
    if (typeof v === "object") return v.name || "-";
    return vendors.find((x) => x._id === v || x.id === v)?.name || v;
  };

  const getResortName = (r) => {
    if (!r) return "-";
    if (typeof r === "object") return r.name || "-";
    return resorts.find((x) => x._id === r || x.id === r)?.name || r;
  };

  // ---------------------------------------
  // APPLY FILTERS (SAME AS POList)
  // ---------------------------------------
  const filteredGrns = useMemo(() => {
    return grns.filter((g) => {
      // 🌍 GLOBAL HEADER RESORT FILTER
      if (selectedResort) {
        const rid = g.resort?._id || g.resort;
        if (String(rid) !== String(selectedResort)) return false;
      }

      // STATUS
      if (statusFilter !== "ALL") {
        const st = (g.status || "CREATED").toLowerCase();
        if (st !== statusFilter.toLowerCase()) return false;
      }

      // ACTION
      if (actionFilter !== "ALL") {
        const isPosted = (g.status || "").toLowerCase() === "posted";
        if (actionFilter === "NeedsPosting" && isPosted) return false;
        if (actionFilter === "Posted" && !isPosted) return false;
      }

      // RESORT
      if (resortFilter) {
        const val = g.resort?._id || g.resort || "";
        if (!val.toString().includes(resortFilter)) return false;
      }

      // VENDOR
      if (vendorFilter) {
        const val = g.vendor?._id || g.vendor || "";
        if (!val.toString().includes(vendorFilter)) return false;
      }

      // DATE RANGE
      if (dateFrom) {
        const gd = g.grnDate ? new Date(g.grnDate) : null;
        if (!gd || gd < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const gd = g.grnDate ? new Date(g.grnDate) : null;
        if (!gd || gd > new Date(dateTo)) return false;
      }

      // SEARCH
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const blob = [
          g.grnNo,
          g.po?.poNo,
          g.requisition?.requisitionNo,
          getVendorName(g.vendor),
          getResortName(g.resort),
          g.store?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!blob.includes(q)) return false;
      }

      return true;
    });
  }, [
    grns,
    selectedResort,
    statusFilter,
    actionFilter,
    resortFilter,
    vendorFilter,
    dateFrom,
    dateTo,
    searchText,
  ]);

  // ---------------------------------------
  // ACTIONS
  // ---------------------------------------
  const viewGrn = (g) => navigate(`/super-admin/grn/${g._id}`);

  const deleteGrn = async (g) => {
    if (!window.confirm(`Delete GRN ${g.grnNo}?`)) return;
    try {
      await axios.delete(`${API_BASE}/api/grn/${g._id}`);
      loadData();
    } catch {
      alert("Failed to delete GRN");
    }
  };

  const clearFilters = () => {
    setStatusFilter("ALL");
    setActionFilter("ALL");
    setResortFilter("");
    setVendorFilter("");
    setDateFrom("");
    setDateTo("");
    setSearchText("");
  };

  // ---------------------------------------
  // UI
  // ---------------------------------------
  return (
    <div className="sa-page">
      {/* HEADER */}
      <div className="sa-page-header">
        <div>
          <h2>GRN (Goods Receipt Note)</h2>
          <p>GRNs created from Purchase Orders & Requisitions</p>
        </div>

        <button className="sa-secondary-button" onClick={loadData}>
          Refresh
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="sa-card" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="CREATED">Created</option>
            <option value="POSTED">Posted</option>
          </select>
        </label>

        <label>
          Action
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="NeedsPosting">Needs Posting</option>
            <option value="Posted">Posted</option>
          </select>
        </label>

        <label>
          Resort
          <select value={resortFilter} onChange={(e) => setResortFilter(e.target.value)}>
            <option value="">All Resorts</option>
            {resorts.map((r) => (
              <option key={r._id || r.id} value={r._id || r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Vendor
          <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}>
            <option value="">All Vendors</option>
            {vendors.map((v) => (
              <option key={v._id || v.id} value={v._id || v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date from
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>

        <label>
          Date to
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>

        <label style={{ flex: 1 }}>
          Search
          <input
            placeholder="GRN / PO / Requisition / Vendor / Store"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </label>

        <button className="sa-secondary-button" onClick={clearFilters}>
          Clear
        </button>
      </div>

      {error && <div className="sa-error">{error}</div>}

      {/* TABLE */}
      <div className="sa-card">
        {loading ? (
          <div style={{ padding: 20 }}>Loading...</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>GRN No</th>
                <th>PO</th>
                <th>Requisition</th>
                <th>Vendor</th>
                <th>Resort</th>
                <th>Store</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredGrns.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center" }}>
                    No GRNs found
                  </td>
                </tr>
              ) : (
                filteredGrns.map((g) => (
                  <tr key={g._id}>
                    <td style={{ color: "#4ea1ff", cursor: "pointer" }} onClick={() => viewGrn(g)}>
                      {g.grnNo}
                    </td>
                    <td>{g.po?.poNo || "-"}</td>
                    <td>{g.requisition?.requisitionNo || "-"}</td>
                    <td>{getVendorName(g.vendor)}</td>
                    <td>{getResortName(g.resort)}</td>
                    <td>{g.store?.name || "-"}</td>
                    <td>{g.grnDate ? new Date(g.grnDate).toLocaleDateString() : "-"}</td>
                    <td>{g.status || "CREATED"}</td>
                    <td>
                      <i className="ri-eye-line" onClick={() => viewGrn(g)} />
                      <i
                        className="ri-delete-bin-line"
                        style={{ marginLeft: 10, color: "#ff6b6b" }}
                        onClick={() => deleteGrn(g)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GRNList;
