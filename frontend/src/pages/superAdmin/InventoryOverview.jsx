import React, { useEffect, useState } from "react";
import axios from "axios";
import { useResort } from "../../context/ResortContext";

const API_BASE =
  (import.meta.env.VITE_API_BASE || "http://localhost:5000") + "/api";

const InventoryOverview = () => {
  const { selectedResort } = useResort();
  const [activeTab, setActiveTab] = useState("snapshot");

  // ---------- guards ----------
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
          { k: "snapshot", l: "Snapshot" },
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

      {activeTab === "snapshot" && <SnapshotTab />}
      {activeTab === "store" && <StoreStockTab />}
      {activeTab === "ledger" && <ItemLedgerTab />}
      {activeTab === "reorder" && <ReorderTab />}
    </div>
  );
};

/* ================= SNAPSHOT ================= */

const SnapshotTab = () => {
  const { selectedResort } = useResort();
  const [data, setData] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE}/inventory/snapshot`, {
        params: { resort: selectedResort },
      })
      .then((res) => setData(res.data || null))
      .catch(() => setData(null));
  }, [selectedResort]);

  if (!data) return <div className="sa-card">Loading snapshot...</div>;

  return (
    <div className="sa-grid-4">
      <div className="sa-card sa-report-kpi">
        <div className="sa-report-kpi-label">Total Stock Value</div>
        <div className="sa-report-kpi-value">₹ {data.totalValue || 0}</div>
      </div>
      <div className="sa-card sa-report-kpi">
        <div className="sa-report-kpi-label">Items in Stock</div>
        <div className="sa-report-kpi-value">{data.totalItems || 0}</div>
      </div>
      <div className="sa-card sa-report-kpi">
        <div className="sa-report-kpi-label">Slow Moving</div>
        <div className="sa-report-kpi-value">{data.slowMoving || 0}</div>
      </div>
      <div className="sa-card sa-report-kpi">
        <div className="sa-report-kpi-label">Near Expiry</div>
        <div className="sa-report-kpi-value">{data.nearExpiry || 0}</div>
      </div>
    </div>
  );
};

/* ================= STORE STOCK ================= */

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

  return (
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
          {rows.map((r) => (
            <tr key={r._id}>
              <td>{r.storeName}</td>
              <td>{r.itemName}</td>
              <td>{r.uom}</td>
              <td>{r.closingQty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ================= ITEM LEDGER ================= */

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
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.date}</td>
              <td>{r.docType}</td>
              <td>{r.refNo}</td>
              <td>{r.storeName}</td>
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

/* ================= REORDER ================= */

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
            <th>Min</th>
            <th>Reorder</th>
            <th>Stock</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r._id}>
              <td>{r.storeName}</td>
              <td>{r.itemName}</td>
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
