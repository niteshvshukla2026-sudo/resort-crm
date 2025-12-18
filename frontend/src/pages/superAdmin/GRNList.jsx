import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useResort } from "../../context/ResortContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* ---------------- HELPERS ---------------- */

// GRN schema me status nahi hai → default CREATED
const normalizeStatus = () => "CREATED";

const getId = (v) => (typeof v === "object" ? v?._id : v || "");

const getResortId = (g) =>
  getId(g.resort) || getId(g.requisition?.resort);

const getResortName = (g) =>
  g.resort?.name || g.requisition?.resort?.name || "-";

const getVendorName = (g) =>
  g.vendor?.name || g.requisition?.vendor?.name || "-";

const getStoreName = (g) =>
  g.store?.name || g.requisition?.store?.name || "-";

const getPoNo = (g) =>
  g.po?.poNo || g.po || "-";

const getReqNo = (g) =>
  g.requisition?.requisitionNo || g.requisition || "-";

/* ---------------- COMPONENT ---------------- */
const GRNList = () => {
  const navigate = useNavigate();
  const { selectedResort } = useResort();

  const [grns, setGrns] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [resorts, setResorts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [resortFilter, setResortFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchText, setSearchText] = useState("");

  /* ---------------- LOAD DATA ---------------- */
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
      setVendors(vendorRes.data || []);
      setResorts(resortRes.data || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load GRNs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ---------------- FILTER ---------------- */
  const filteredGrns = useMemo(() => {
    return grns.filter((g) => {
      // 🌍 Global resort
      if (selectedResort && selectedResort !== "ALL") {
        const rid = getResortId(g);
        if (rid && String(rid) !== String(selectedResort)) return false;
      }

      if (resortFilter) {
        const rid = getResortId(g);
        if (rid && String(rid) !== String(resortFilter)) return false;
      }

      if (vendorFilter) {
        const vid = getId(g.vendor) || getId(g.requisition?.vendor);
        if (vid && String(vid) !== String(vendorFilter)) return false;
      }

      if (dateFrom) {
        const d = g.receivedDate ? new Date(g.receivedDate) : null;
        if (!d || d < new Date(dateFrom)) return false;
      }

      if (dateTo) {
        const d = g.receivedDate ? new Date(g.receivedDate) : null;
        if (!d || d > new Date(dateTo)) return false;
      }

      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const blob = [
          g.grnNo,
          getPoNo(g),
          getReqNo(g),
          getVendorName(g),
          getStoreName(g),
          getResortName(g),
        ]
          .join(" ")
          .toLowerCase();

        if (!blob.includes(q)) return false;
      }

      return true;
    });
  }, [
    grns,
    selectedResort,
    resortFilter,
    vendorFilter,
    dateFrom,
    dateTo,
    searchText,
  ]);

  /* ---------------- ACTIONS ---------------- */
  const viewGrn = (g) => navigate(`/super-admin/grn/${g._id}`);

  const deleteGrn = async (g) => {
    if (!window.confirm(`Delete GRN ${g.grnNo}?`)) return;
    await axios.delete(`${API_BASE}/api/grn/${g._id}`);
    loadData();
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>GRN (Goods Receipt Note)</h2>
          <p>GRNs created from Purchase Orders / Requisitions</p>
        </div>
        <button className="sa-secondary-button" onClick={loadData}>
          Refresh
        </button>
      </div>

      {/* FILTER */}
      <div className="sa-card" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <label>
          Resort
          <select value={resortFilter} onChange={(e) => setResortFilter(e.target.value)}>
            <option value="">All</option>
            {resorts.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </label>

        <label>
          Vendor
          <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}>
            <option value="">All</option>
            {vendors.map((v) => (
              <option key={v._id} value={v._id}>{v.name}</option>
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
                    <td onClick={() => viewGrn(g)} style={{ color: "#4ea1ff", cursor: "pointer" }}>
                      {g.grnNo}
                    </td>
                    <td>{getPoNo(g)}</td>
                    <td>{getReqNo(g)}</td>
                    <td>{getVendorName(g)}</td>
                    <td>{getResortName(g)}</td>
                    <td>{getStoreName(g)}</td>
                    <td>{g.receivedDate ? new Date(g.receivedDate).toLocaleDateString() : "-"}</td>
                    <td>{normalizeStatus()}</td>
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
