import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useResort } from "../../context/ResortContext";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* ---------------- HELPERS ---------------- */

const findById = (list, id) =>
  list.find((x) => String(x._id) === String(id));

const getPoNo = (g) =>
  typeof g.po === "object" ? g.po.poNo || "-" : "-";

const getReqNo = (g) =>
  typeof g.requisition === "object"
    ? g.requisition.requisitionNo || "-"
    : "-";

const getVendorName = (g, vendors) => {
  if (typeof g.vendor === "object") return g.vendor.name;
  const v = findById(vendors, g.vendor);
  return v?.name || "-";
};

const getResortName = (g, resorts) => {
  if (typeof g.resort === "object") return g.resort.name;
  const r = findById(resorts, g.resort);
  return r?.name || "-";
};

const getStoreName = (g, stores) => {
  if (typeof g.store === "object") return g.store.name;
  const s = findById(stores, g.store);
  return s?.name || "-";
};

// ✅ DATE HANDLER (MOST IMPORTANT FIX)
const getGrnDate = (g) => {
  const d = g.receivedDate || g.grnDate || g.createdAt;
  return d ? new Date(d).toLocaleDateString() : "-";
};

/* ---------------- COMPONENT ---------------- */

const GRNList = () => {
  const navigate = useNavigate();
  const { selectedResort } = useResort() || {};

  const [grns, setGrns] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [stores, setStores] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [resortFilter, setResortFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchText, setSearchText] = useState("");

  /* ---------------- LOAD DATA ---------------- */

  const normalize = (r) =>
    Array.isArray(r.data)
      ? r.data
      : Array.isArray(r.data?.data)
      ? r.data.data
      : [];

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [grnRes, vendorRes, resortRes, storeRes] =
        await Promise.all([
          axios.get(`${API_BASE}/api/grn`),
          axios.get(`${API_BASE}/api/vendors`),
          axios.get(`${API_BASE}/api/resorts`),
          axios.get(`${API_BASE}/api/stores`),
        ]);

      setGrns(normalize(grnRes));
      setVendors(normalize(vendorRes));
      setResorts(normalize(resortRes));
      setStores(normalize(storeRes));
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
      if (selectedResort && selectedResort !== "ALL") {
        if (String(g.resort) !== String(selectedResort))
          return false;
      }

      if (resortFilter && String(g.resort) !== resortFilter)
        return false;

      if (vendorFilter && String(g.vendor) !== vendorFilter)
        return false;

      const d = g.receivedDate || g.grnDate || g.createdAt;
      if (dateFrom && (!d || new Date(d) < new Date(dateFrom)))
        return false;

      if (dateTo && (!d || new Date(d) > new Date(dateTo)))
        return false;

      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const blob = [
          g.grnNo,
          getPoNo(g),
          getReqNo(g),
          getVendorName(g, vendors),
          getStoreName(g, stores),
          getResortName(g, resorts),
        ]
          .join(" ")
          .toLowerCase();
        if (!blob.includes(q)) return false;
      }

      return true;
    });
  }, [
    grns,
    vendors,
    resorts,
    stores,
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

  const closeGrn = async (id) => {
    if (!window.confirm("Close this GRN?")) return;
    await axios.post(`${API_BASE}/api/grn/${id}/close`);
    loadData();
  };

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
                    <td>{getPoNo(g)}</td>
                    <td>{getReqNo(g)}</td>
                    <td>{getVendorName(g, vendors)}</td>
                    <td>{getResortName(g, resorts)}</td>
                    <td>{getStoreName(g, stores)}</td>
                    <td>{getGrnDate(g)}</td>
                    <td>{g.status || "CREATED"}</td>

                    {/* ICON ACTIONS */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      {/* VIEW */}
                      <i
                        className="ri-eye-line"
                        title="View GRN"
                        style={{ cursor: "pointer", marginRight: 14 }}
                        onClick={() => viewGrn(g)}
                      />

                      {/* CLOSE GRN */}
                      {g.status === "CREATED" && (
                        <i
                          className="ri-lock-line"
                          title="Close GRN"
                          style={{
                            cursor: "pointer",
                            marginRight: 14,
                            color: "#22c55e",
                          }}
                          onClick={() => closeGrn(g._id)}
                        />
                      )}

                      {/* DELETE */}
                      {g.status === "CREATED" && (
                        <i
                          className="ri-delete-bin-6-line"
                          title="Delete GRN"
                          style={{
                            cursor: "pointer",
                            color: "#ef4444",
                          }}
                          onClick={() => deleteGrn(g)}
                        />
                      )}
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
