import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { useResort } from "../../context/ResortContext";

/* ---------------- HELPERS ---------------- */

const findById = (list, id) =>
  list.find((x) => String(x._id) === String(id));

const getVendorName = (g, vendors) => {
  if (typeof g.vendor === "object") return g.vendor?.name || "-";
  const v = findById(vendors, g.vendor);
  return v?.name || "-";
};

const getResortName = (g, resorts) => {
  if (typeof g.resort === "object") return g.resort?.name || "-";
  const r = findById(resorts, g.resort);
  return r?.name || "-";
};

const getStoreName = (g, stores) => {
  if (typeof g.store === "object") return g.store?.name || "-";
  const s = findById(stores, g.store);
  return s?.name || "-";
};

const getGrnDate = (g) => {
  const d = g.grnDate || g.receivedDate || g.createdAt;
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

  /* ---------------- LOAD DATA ---------------- */

  const normalize = (r) =>
    Array.isArray(r?.data) ? r.data : [];

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [grnRes, vendorRes, resortRes, storeRes] =
        await Promise.all([
          api.get("/api/grn", {
            params: { resort: selectedResort },
          }),
          api.get("/api/vendors"),
          api.get("/api/resorts"),
          api.get("/api/stores", {
            params: { resort: selectedResort },
          }),
        ]);

      setGrns(normalize(grnRes));
      setVendors(normalize(vendorRes));
      setResorts(normalize(resortRes));
      setStores(normalize(storeRes));
    } catch (err) {
      console.error("GRN LOAD ERROR ❌", err);
      setError("Failed to load GRNs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedResort]);

  /* ---------------- ACTIONS ---------------- */

  const viewGrn = (g) => {
    navigate(`/super-admin/grn/${g._id}`);
  };

  const closeGrn = async (g) => {
    if (!window.confirm(`Close GRN ${g.grnNo}? Stock will be updated.`))
      return;
    try {
      await api.post(`/api/grn/${g._id}/close`);
      loadData();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to close GRN");
    }
  };

  const deleteGrn = async (g) => {
    if (!window.confirm(`Delete GRN ${g.grnNo}?`)) return;
    try {
      await api.delete(`/api/grn/${g._id}`);
      loadData();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete GRN");
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
                <th>Vendor</th>
                <th>Resort</th>
                <th>Store</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {grns.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    No GRNs found
                  </td>
                </tr>
              ) : (
                grns.map((g) => (
                  <tr key={g._id}>
                    <td
                      style={{ color: "#4ea1ff", cursor: "pointer" }}
                      onClick={() => viewGrn(g)}
                    >
                      {g.grnNo}
                    </td>

                    <td>{getVendorName(g, vendors)}</td>
                    <td>{getResortName(g, resorts)}</td>
                    <td>{getStoreName(g, stores)}</td>
                    <td>{getGrnDate(g)}</td>
                    <td>{(g.status || "CREATED").toUpperCase()}</td>

                    {/* ACTION ICONS */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      <i
                        className="ri-eye-line"
                        title="View"
                        style={{ cursor: "pointer", marginRight: 12 }}
                        onClick={() => viewGrn(g)}
                      />

                      {g.status === "CREATED" && (
                        <>
                          <i
                            className="ri-lock-line"
                            title="Close"
                            style={{
                              cursor: "pointer",
                              marginRight: 12,
                              color: "#22c55e",
                            }}
                            onClick={() => closeGrn(g)}
                          />

                          <i
                            className="ri-delete-bin-line"
                            title="Delete"
                            style={{
                              cursor: "pointer",
                              color: "#ef4444",
                            }}
                            onClick={() => deleteGrn(g)}
                          />
                        </>
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
