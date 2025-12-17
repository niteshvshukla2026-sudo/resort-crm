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

  // ---------------------------------------
  // LOAD GRNs
  // ---------------------------------------
  const loadGrns = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/grn`);

      // ✅ ALWAYS ensure array
      const list = Array.isArray(res.data) ? res.data : [];
      setGrns(list);
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
  // FILTER BY RESORT (GLOBAL DROPDOWN)
  // ---------------------------------------
  const filteredGrns = useMemo(() => {
    if (!selectedResort || selectedResort === "ALL") return grns;

    return grns.filter(
      (g) => String(g.resort) === String(selectedResort)
    );
  }, [grns, selectedResort]);

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

        <button
          className="sa-secondary-button"
          onClick={loadGrns}
        >
          Refresh
        </button>
      </div>

      {/* ERROR */}
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
                      style={{ color: "#4ea1ff", cursor: "pointer" }}
                      onClick={() => viewGrn(g)}
                    >
                      {g.grnNo}
                    </td>

                    <td>{g.poId || "-"}</td>
                    <td>{g.vendor || "-"}</td>
                    <td>{g.resort || "-"}</td>
                    <td>{g.store || "-"}</td>
                    <td>
                      {g.grnDate
                        ? new Date(g.grnDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>{g.status || "CREATED"}</td>

                    <td style={{ whiteSpace: "nowrap" }}>
                      {/* VIEW */}
                      <span
                        title="View"
                        style={{ cursor: "pointer", marginRight: 10 }}
                        onClick={() => viewGrn(g)}
                      >
                        <i className="ri-eye-line" />
                      </span>

                      {/* DELETE */}
                      <span
                        title="Delete"
                        style={{ cursor: "pointer", color: "#ff6b6b" }}
                        onClick={() => deleteGrn(g)}
                      >
                        <i className="ri-delete-bin-line" />
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
