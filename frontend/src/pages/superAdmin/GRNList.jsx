// src/pages/superAdmin/GRNList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useResort } from "../../context/ResortContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const GRNList = () => {
  const navigate = useNavigate();
  const { selectedResort } = useResort(); // 🌍 GLOBAL RESORT

  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // FILTER STATES (POList style)
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchText, setSearchText] = useState("");

  // ---------------------------------------
  // LOAD GRNs
  // ---------------------------------------
  const loadGrns = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/grn`);
      setGrns(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("GRN load error", err);
      setError("Failed to load GRNs");
      setGrns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrns();
  }, []);

  // ---------------------------------------
  // APPLY FILTERS (SAFE & FINAL)
  // ---------------------------------------
  const filteredGrns = useMemo(() => {
    return grns.filter((g) => {
      // 🌍 GLOBAL RESORT FILTER
      if (selectedResort) {
        const resortId = g.resort?._id || g.resort;
        if (String(resortId) !== String(selectedResort)) {
          return false;
        }
      }

      // STATUS
      if (statusFilter !== "ALL") {
        const st = (g.status || "").toLowerCase();
        if (st !== statusFilter.toLowerCase()) return false;
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
          g.vendor?.name,
          g.store?.name,
          g.resort?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!blob.includes(q)) return false;
      }

      return true;
    });
  }, [grns, selectedResort, statusFilter, dateFrom, dateTo, searchText]);

  // ---------------------------------------
  // ACTIONS
  // ---------------------------------------
  const viewGrn = (grn) => {
    navigate(`/super-admin/grn/${grn._id}`);
  };

  const deleteGrn = async (grn) => {
    if (!window.confirm(`Delete GRN ${grn.grnNo}?`)) return;
    try {
      await axios.delete(`${API_BASE}/api/grn/${grn._id}`);
      loadGrns();
    } catch (err) {
      console.error(err);
      alert("Failed to delete GRN");
    }
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
          <p>GRNs created from Purchase Orders / Requisitions</p>
        </div>

        <button className="sa-secondary-button" onClick={loadGrns}>
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
                    <td
                      style={{ color: "#4ea1ff", cursor: "pointer" }}
                      onClick={() => viewGrn(g)}
                    >
                      {g.grnNo}
                    </td>
                    <td>{g.po?.poNo || "-"}</td>
                    <td>{g.requisition?.requisitionNo || "-"}</td>
                    <td>{g.vendor?.name || "-"}</td>
                    <td>{g.resort?.name || "-"}</td>
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
