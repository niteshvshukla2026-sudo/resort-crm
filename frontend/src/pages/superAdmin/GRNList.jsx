// src/pages/superAdmin/GRNList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useResort } from "../../context/ResortContext";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* ---------------- HELPERS ---------------- */

const getId = (v) => (typeof v === "object" ? v?._id : v || "");

// ✅ PO sirf tab dikhe jab PO se GRN bana ho
const getPoNo = (g) => {
  if (g.po && typeof g.po === "object") {
    return g.po.poNo || "-";
  }
  return "-";
};

// ✅ Requisition sirf tab dikhe jab requisition se bana ho
const getReqNo = (g) => {
  if (g.requisition && typeof g.requisition === "object") {
    return g.requisition.requisitionNo || "-";
  }
  return "-";
};

const getVendorName = (g) =>
  g.vendor?.name ||
  g.requisition?.vendor?.name ||
  "-";

const getResortName = (g) => {
  if (typeof g.resort === "object") return g.resort.name;
  if (typeof g.requisition?.resort === "object")
    return g.requisition.resort.name;
  return "-";
};

const getStoreName = (g) => {
  if (typeof g.store === "object") return g.store.name;
  if (typeof g.requisition?.store === "object")
    return g.requisition.store.name;
  return "-";
};

/* ---------------- COMPONENT ---------------- */

const GRNList = () => {
  const navigate = useNavigate();
  const { selectedResort } = useResort() || {};

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

      const normalize = (r) =>
        Array.isArray(r.data)
          ? r.data
          : Array.isArray(r.data?.data)
          ? r.data.data
          : [];

      setGrns(normalize(grnRes));
      setVendors(normalize(vendorRes));
      setResorts(normalize(resortRes));
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
      // 🌍 global resort
      if (selectedResort && selectedResort !== "ALL") {
        const rid =
          g.resort?._id || g.requisition?.resort?._id;
        if (rid && String(rid) !== String(selectedResort))
          return false;
      }

      if (resortFilter) {
        const rid =
          g.resort?._id || g.requisition?.resort?._id;
        if (rid && String(rid) !== String(resortFilter))
          return false;
      }

      if (vendorFilter) {
        const vid =
          g.vendor?._id ||
          g.requisition?.vendor?._id;
        if (vid && String(vid) !== String(vendorFilter))
          return false;
      }

      if (dateFrom) {
        const d = g.receivedDate
          ? new Date(g.receivedDate)
          : null;
        if (!d || d < new Date(dateFrom)) return false;
      }

      if (dateTo) {
        const d = g.receivedDate
          ? new Date(g.receivedDate)
          : null;
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

  const viewGrn = (g) =>
    navigate(`/super-admin/grn/${g._id}`);

  const deleteGrn = async (g) => {
    if (!window.confirm(`Delete GRN ${g.grnNo}?`))
      return;
    await axios.delete(`${API_BASE}/api/grn/${g._id}`);
    loadData();
  };

  const closeGrn = async (id) => {
    if (!window.confirm("Close this GRN?")) return;
    await axios.post(`${API_BASE}/api/grn/${id}/close`);
    loadData();
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>GRN (Goods Receipt Note)</h2>
          <p>
            GRNs created from Purchase Orders /
            Requisitions
          </p>
        </div>
        <button
          className="sa-secondary-button"
          onClick={loadData}
        >
          Refresh
        </button>
      </div>

      {/* FILTER */}
      <div
        className="sa-card"
        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
      >
        <label>
          Resort
          <select
            value={resortFilter}
            onChange={(e) =>
              setResortFilter(e.target.value)
            }
          >
            <option value="">All</option>
            {resorts.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Vendor
          <select
            value={vendorFilter}
            onChange={(e) =>
              setVendorFilter(e.target.value)
            }
          >
            <option value="">All</option>
            {vendors.map((v) => (
              <option key={v._id} value={v._id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date from
          <input
            type="date"
            value={dateFrom}
            onChange={(e) =>
              setDateFrom(e.target.value)
            }
          />
        </label>

        <label>
          Date to
          <input
            type="date"
            value={dateTo}
            onChange={(e) =>
              setDateTo(e.target.value)
            }
          />
        </label>

        <label style={{ flex: 1 }}>
          Search
          <input
            placeholder="GRN / PO / Requisition / Vendor / Store"
            value={searchText}
            onChange={(e) =>
              setSearchText(e.target.value)
            }
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
                      style={{
                        color: "#4ea1ff",
                        cursor: "pointer",
                      }}
                      onClick={() => viewGrn(g)}
                    >
                      {g.grnNo}
                    </td>
                    <td>{getPoNo(g)}</td>
                    <td>{getReqNo(g)}</td>
                    <td>{getVendorName(g)}</td>
                    <td>{getResortName(g)}</td>
                    <td>{getStoreName(g)}</td>
                    <td>
                      {g.receivedDate
                        ? new Date(
                            g.receivedDate
                          ).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>{g.status || "CREATED"}</td>
                    <td>
                      <div className="action-menu">
                        <button className="action-btn">
                          Actions ▾
                        </button>
                        <div className="action-dropdown">
                          <button
                            onClick={() => viewGrn(g)}
                          >
                            View
                          </button>

                          {g.status === "CREATED" && (
                            <button
                              onClick={() =>
                                closeGrn(g._id)
                              }
                            >
                              Close GRN
                            </button>
                          )}

                          {g.status === "CREATED" && (
                            <button
                              className="danger"
                              onClick={() =>
                                deleteGrn(g)
                              }
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
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
