import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useResort } from "../../context/ResortContext";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* ---------------- HELPERS ---------------- */

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
  g.po?.poNo || g.po?.po_number || g.po || "-";

const getReqNo = (g) =>
  g.requisition?.requisitionNo || g.requisition || "-";

/* ---------------- COMPONENT ---------------- */

const GRNList = () => {
  const navigate = useNavigate();
  const { selectedResort } = useResort();

  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- LOAD DATA ---------------- */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/grn`);
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      setGrns(data);
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

  /* ---------------- FILTER (GLOBAL RESORT) ---------------- */

  const filteredGrns = useMemo(() => {
    return grns.filter((g) => {
      if (selectedResort && selectedResort !== "ALL") {
        const rid = getResortId(g);
        if (rid && String(rid) !== String(selectedResort)) return false;
      }
      return true;
    });
  }, [grns, selectedResort]);

  /* ---------------- ACTIONS ---------------- */

  const viewGrn = (g) => {
    navigate(`/super-admin/grn/${g._id}`);
  };

  const closeGrn = async (g) => {
    if (!window.confirm(`Close GRN ${g.grnNo}?`)) return;

    try {
      await axios.post(`${API_BASE}/api/grn/${g._id}/close`);
      loadData();
    } catch (e) {
      alert("Failed to close GRN");
    }
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

      {error && <div className="sa-error">{error}</div>}

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
                <th style={{ width: 120 }}>Actions</th>
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
                      onClick={() => viewGrn(g)}
                      style={{ color: "#4ea1ff", cursor: "pointer" }}
                    >
                      {g.grnNo}
                    </td>

                    <td>{getPoNo(g)}</td>
                    <td>{getReqNo(g)}</td>
                    <td>{getVendorName(g)}</td>
                    <td>{getResortName(g)}</td>
                    <td>{getStoreName(g)}</td>

                    <td>
                      {g.grnDate
                        ? new Date(g.grnDate).toLocaleDateString()
                        : g.receivedDate
                        ? new Date(g.receivedDate).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>{g.status || "CREATED"}</td>

                    <td style={{ whiteSpace: "nowrap" }}>
                      {/* VIEW */}
                      <i
                        className="ri-eye-line"
                        title="View GRN"
                        style={{ cursor: "pointer" }}
                        onClick={() => viewGrn(g)}
                      />

                      {/* CLOSE */}
                      {g.status === "CREATED" && (
                        <i
                          className="ri-lock-line"
                          title="Close GRN"
                          style={{
                            marginLeft: 14,
                            cursor: "pointer",
                            color: "#facc15",
                          }}
                          onClick={() => closeGrn(g)}
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
