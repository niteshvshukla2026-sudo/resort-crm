import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useResort } from "../../context/ResortContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// row template
const line = () => ({
  lineId: `grn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  item: "",
  poQty: 0,
  receivedQty: 0,
  rejectedQty: 0,
  acceptedQty: 0,
});

const GRNList = () => {
  const navigate = useNavigate();
  const { selectedResort } = useResort(); // 🌍 GLOBAL RESORT FILTER

  const [grnList, setGrnList] = useState([]);
  const [poList, setPoList] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===============================
  // LOAD DATA
  // ===============================
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        grnRes,
        poRes,
        vendorRes,
        resortRes,
        storeRes,
        itemRes,
      ] = await Promise.all([
        axios.get(`${API_BASE}/api/grn`),
        axios.get(`${API_BASE}/api/po`),
        axios.get(`${API_BASE}/api/vendors`),
        axios.get(`${API_BASE}/api/resorts`),
        axios.get(`${API_BASE}/api/stores`),
        axios.get(`${API_BASE}/api/items`),
      ]);

      const serverGrns = Array.isArray(grnRes.data) ? grnRes.data : [];

      // 🔥 IMPORTANT NORMALIZATION
      const normalizedGrns = serverGrns
        .filter((g) => g.poId || g.requisitionId)
        .map((g) => ({
          ...g,
          lines: Array.isArray(g.lines)
            ? g.lines
            : Array.isArray(g.items)
            ? g.items
            : [],
        }));

      setGrnList(normalizedGrns);
      setPoList(Array.isArray(poRes.data) ? poRes.data : []);
      setVendors(Array.isArray(vendorRes.data) ? vendorRes.data : []);
      setResorts(Array.isArray(resortRes.data) ? resortRes.data : []);
      setStores(Array.isArray(storeRes.data) ? storeRes.data : []);
      setItems(Array.isArray(itemRes.data) ? itemRes.data : []);
    } catch (err) {
      console.error("GRN load error", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load GRN data"
      );
      setGrnList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===============================
  // RESORT FILTER (GLOBAL)
  // ===============================
  const filteredGrns = useMemo(() => {
    if (!selectedResort || selectedResort === "ALL") return grnList;
    return grnList.filter((g) => g.resort === selectedResort);
  }, [grnList, selectedResort]);

  // ===============================
  // HELPERS
  // ===============================
  const viewGrn = (g) => {
    const id = g._id || g.grnNo;
    if (!id) return;
    navigate(`/super-admin/grn/${id}`);
  };

  const getVendorName = (id) =>
    vendors.find((v) => v._id === id)?.name || id || "-";

  const getResortName = (id) =>
    resorts.find((r) => r._id === id)?.name || id || "-";

  const getStoreName = (id) =>
    stores.find((s) => s._id === id)?.name || id || "-";

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="sa-page">
      {/* HEADER */}
      <div className="sa-page-header">
        <div>
          <h2>GRN (Goods Receipt Note)</h2>
          <p>GRNs created from Purchase Orders / Requisitions</p>
        </div>

        <button
          className="sa-secondary-button"
          onClick={loadData}
        >
          Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="sa-alert sa-alert-error">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="sa-card">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>GRN No</th>
                <th>PO</th>
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
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    No GRNs found
                  </td>
                </tr>
              ) : (
                filteredGrns.map((g) => (
                  <tr key={g._id}>
                    <td
                      style={{ cursor: "pointer", color: "#0b69ff" }}
                      onClick={() => viewGrn(g)}
                    >
                      {g.grnNo}
                    </td>
                    <td>{g.poId || "-"}</td>
                    <td>{getVendorName(g.vendor)}</td>
                    <td>{getResortName(g.resort)}</td>
                    <td>{getStoreName(g.store)}</td>
                    <td>{g.grnDate?.slice(0, 10)}</td>
                    <td>{g.status || "OPEN"}</td>

                    <td>
                      <span
                        style={{ cursor: "pointer", padding: 6 }}
                        onClick={() => viewGrn(g)}
                        title="View"
                      >
                        <i className="ri-eye-line" />
                      </span>
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
