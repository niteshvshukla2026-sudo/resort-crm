import React, { useEffect, useState } from "react";
import axios from "axios";
import { useResort } from "../../context/ResortContext";

const API_BASE =
  (import.meta.env.VITE_API_BASE || "http://localhost:5000") + "/api";

const InventoryOverview = () => {
  const { selectedResort } = useResort();
  const [activeTab, setActiveTab] = useState("store");

  if (!selectedResort || selectedResort === "ALL") {
    return (
      <div className="sa-card">
        <h3>Please select a resort</h3>
        <p>Inventory works only with a selected resort.</p>
      </div>
    );
  }

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>Inventory</h2>
          <p>Real-time stock derived from GRN, Consumption & Replacement</p>
        </div>
      </div>

      {/* TABS */}
      <div className="sa-card" style={{ display: "flex", gap: 8 }}>
        {[
          { k: "store", l: "Store-wise Stock" },
          { k: "ledger", l: "Item Ledger" },
          { k: "reorder", l: "Low Stock / Reorder" },
        ].map((t) => (
          <button
            key={t.k}
            className={`sa-tab ${activeTab === t.k ? "active" : ""}`}
            onClick={() => setActiveTab(t.k)}
          >
            {t.l}
          </button>
        ))}
      </div>

      {activeTab === "store" && <StoreStockTab />}
      {activeTab === "ledger" && <ItemLedgerTab />}
      {activeTab === "reorder" && <ReorderTab />}
    </div>
  );
};

/* ======================================================
   STORE-WISE STOCK  (✅ MAIN FIXED & WORKING)
====================================================== */

const StoreStockTab = () => {
  const { selectedResort } = useResort();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/inventory/store-stock`, {
        params: { resort: selectedResort },
      })
      .then((res) => setRows(res.data || []))
      .catch(() => setRows([]));
  }, [selectedResort]);

  const totalStores = new Set(rows.map((r) => r.store)).size;
  const totalItems = new Set(rows.map((r) => r.item)).size;
  const totalQty = rows.reduce(
    (sum, r) => sum + Number(r.closingQty || 0),
    0
  );

  return (
    <>
      {/* KPI SUMMARY */}
      <div className="sa-grid-3" style={{ marginBottom: 16 }}>
        <div className="sa-card sa-report-kpi">
          <div className="sa-report-kpi-label">Stores</div>
          <div className="sa-report-kpi-value">{totalStores}</div>
        </div>
        <div className="sa-card sa-report-kpi">
          <div className="sa-report-kpi-label">Items</div>
          <div className="sa-report-kpi-value">{totalItems}</div>
        </div>
        <div className="sa-card sa-report-kpi">
          <div className="sa-report-kpi-label">Total Qty</div>
          <div className="sa-report-kpi-value">{totalQty}</div>
        </div>
      </div>

      {/* TABLE */}
      <div className="sa-card">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Store</th>
              <th>Item</th>
              <th>UOM</th>
              <th>Closing Qty</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  No stock available
                </td>
              </tr>
            )}

            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.store}</td>
                <td>{r.item}</td>
                <td>{r.uom}</td>
                <td>{r.closingQty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

/* ======================================================
   ITEM LEDGER (API READY – UI READY)
====================================================== */

const ItemLedgerTab = () => {
  const { selectedResort } = useResort();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/inventory/ledger`, {
        params: { resort: selectedResort },
      })
      .then((res) => setRows(res.data || []))
      .catch(() => setRows([]));
  }, [selectedResort]);

  return (
    <div className="sa-card">
      <table className="sa-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Doc Type</th>
            <th>Ref No</th>
            <th>Store</th>
            <th>In</th>
            <th>Out</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                Ledger not available
              </td>
            </tr>
          )}

          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.date}</td>
              <td>{r.docType}</td>
              <td>{r.refNo}</td>
              <td>{r.store}</td>
              <td>{r.inQty}</td>
              <td>{r.outQty}</td>
              <td>{r.balanceQty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ======================================================
   LOW STOCK / REORDER (FRONTEND SAFE)
====================================================== */

const ReorderTab = () => {
  const { selectedResort } = useResort();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/inventory/reorder`, {
        params: { resort: selectedResort },
      })
      .then((res) => setRows(res.data || []))
      .catch(() => setRows([]));
  }, [selectedResort]);

  return (
    <div className="sa-card">
      <table className="sa-table">
        <thead>
          <tr>
            <th>Store</th>
            <th>Item</th>
            <th>Min Qty</th>
            <th>Reorder Qty</th>
            <th>Stock</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No low stock items
              </td>
            </tr>
          )}

          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.store}</td>
              <td>{r.item}</td>
              <td>{r.minQty}</td>
              <td>{r.reorderQty}</td>
              <td>{r.stockQty}</td>
              <td>
                <span className="sa-badge sa-badge-danger">LOW</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryOverview;
