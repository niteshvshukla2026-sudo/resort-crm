import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// row template (only for edit/view safety)
const line = () => ({
  lineId: `grn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  item: "",
  poQty: 0,
  receivedQty: "",
  rejectedQty: "",
  acceptedQty: 0,
});

const GRNList = () => {
  const navigate = useNavigate();

  const [grnList, setGrnList] = useState([]);
  const [poList, setPoList] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // FILTER STATES
  const [resortFilter, setResortFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  // ---------------- LOAD DATA ----------------
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

      // ✅ ONLY VALID BACKEND GRNs (created from PO or requisition)
      const validGrns = serverGrns.filter(
        (g) => g.poId || g.requisitionId
      );

      setGrnList(validGrns);
      setPoList(poRes.data || []);
      setVendors(vendorRes.data || []);
      setResorts(resortRes.data || []);
      setStores(storeRes.data || []);
      setItems(itemRes.data || []);
    } catch (err) {
      console.error("GRN load error", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load GRNs"
      );
      setGrnList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- FILTERED LIST ----------------
  const filteredGrns = useMemo(() => {
    return grnList.filter((g) => {
      // Resort filter
      if (resortFilter && resortFilter !== "ALL") {
        if (String(g.resort) !== String(resortFilter)) return false;
      }

      // Search
      if (searchText) {
        const t = searchText.toLowerCase();
        if (
          !String(g.grnNo || "").toLowerCase().includes(t) &&
          !String(g.vendor || "").toLowerCase().includes(t)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [grnList, resortFilter, searchText]);

  // ---------------- ACTIONS ----------------
  const viewGrn = (g) => {
    const id = g._id || g.grnNo;
    if (!id) return;
    navigate(`/super-admin/grn/${id}`);
  };

  const handleDelete = async (g) => {
    if (g.status === "Approved") {
      alert("Approved GRN cannot be deleted");
      return;
    }

    if (!window.confirm(`Delete GRN ${g.grnNo}?`)) return;

    try {
      await axios.delete(`${API_BASE}/api/grn/${g._id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete GRN");
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="sa-page">
      {/* HEADER */}
      <div className="sa-page-header">
        <div>
          <h2>GRN (Goods Receipt Note)</h2>
          <p>GRNs created from Vendor Requisitions / Purchase Orders</p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="sa-secondary-button" onClick={loadData}>
            Refresh
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="sa-card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            value={resortFilter}
            onChange={(e) => setResortFilter(e.target.value)}
          >
            <option value="">All Resorts</option>
            {resorts.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search GRN no / vendor"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {/* ERROR */}
      {error && <div className="sa-error">{error}</div>}

      {/* LIST */}
      <div className="sa-card">
        {loading ? (
          <div>Loading…</div>
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
                    <td>{g.vendor || "-"}</td>
                    <td>
                      {resorts.find((r) => r._id === g.resort)?.name || "-"}
                    </td>
                    <td>
                      {stores.find((s) => s._id === g.store)?.name || "-"}
                    </td>
                    <td>{g.grnDate?.slice(0, 10)}</td>
                    <td>{g.status || "OPEN"}</td>

                    <td style={{ whiteSpace: "nowrap" }}>
                      <span
                        title="View"
                        style={{ cursor: "pointer", padding: 6 }}
                        onClick={() => viewGrn(g)}
                      >
                        <i className="ri-eye-line" />
                      </span>

                      {g.status === "Approved" ? (
                        <span style={{ opacity: 0.4, padding: 6 }}>
                          <i className="ri-delete-bin-6-line" />
                        </span>
                      ) : (
                        <span
                          title="Delete"
                          style={{ cursor: "pointer", padding: 6 }}
                          onClick={() => handleDelete(g)}
                        >
                          <i className="ri-delete-bin-6-line" />
                        </span>
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
