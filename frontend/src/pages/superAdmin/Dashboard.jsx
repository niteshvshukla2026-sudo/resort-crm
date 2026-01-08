import React, { useEffect, useState } from "react";
import axios from "axios";
import { useResort } from "../../context/ResortContext";
import StatCard from "../../components/ui/StatCard.jsx";

const API_BASE =
  (import.meta.env.VITE_API_BASE || "http://localhost:5000") + "/api";

const Dashboard = () => {
  const { selectedResort } = useResort();

  const [days, setDays] = useState(7);
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [stockValue, setStockValue] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedResort || selectedResort === "ALL") return;

    setLoading(true);

    // 🔹 KPI (with date filter)
    axios
      .get(
        `${API_BASE}/dashboard/resort/${selectedResort}/kpi?days=${days}`
      )
      .then((res) => {
        setStats(res.data);
        setStockValue(res.data.stockValue || 0);
      });

    // 🔹 Charts
    axios
      .get(
        `${API_BASE}/dashboard/resort/${selectedResort}/charts?days=${days}`
      )
      .then((res) => setChart(res.data));

    // 🔹 Low stock
    axios
      .get(`${API_BASE}/inventory/store-stock?resort=${selectedResort}`)
      .then((res) =>
        setLowStock(res.data.filter((i) => i.closingQty < 10))
      )
      .finally(() => setLoading(false));
  }, [selectedResort, days]);

  return (
    <div className="sa-page">
      {/* ================= HEADER ================= */}
      <div className="sa-page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of all resorts, purchases & inventory.</p>
        </div>

        {/* DATE FILTER */}
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="sa-select"
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
        </select>
      </div>

      {/* ================= AUTO ALERTS ================= */}
      {stats?.pendingGrn > 0 && (
        <div className="sa-alert warning">
          ⚠️ {stats.pendingGrn} GRN pending. Please close GRN.
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="sa-alert danger">
          🚨 {lowStock.length} items below reorder level.
        </div>
      )}

      {/* ================= KPI CARDS ================= */}
      <div className="sa-grid-4">
        <StatCard
          label="Total Stores"
          value={stats?.totalStores ?? "—"}
          subLabel="Active stores"
        />

        <StatCard
          label="Open Requisitions"
          value={stats?.openRequisitions ?? "—"}
          subLabel="Pending / approved"
          trend={
            stats?.trendReq >= 0
              ? `+${stats.trendReq} today`
              : `${stats.trendReq} today`
          }
          trendType={stats?.trendReq >= 0 ? "up" : "down"}
        />

        <StatCard
          label="Pending GRN"
          value={stats?.pendingGrn ?? "—"}
          subLabel="GRN not closed"
        />

        <StatCard
          label="Stock Value"
          value={`₹ ${stockValue.toLocaleString("en-IN")}`}
          subLabel="Current inventory value"
        />
      </div>

      {/* ================= ACTIVITY CHART ================= */}
      {chart && (
        <div className="sa-card mt-4">
          <h4>Activity Overview</h4>

          {chart.labels.map((l, i) => (
            <div key={l} style={{ marginBottom: 10 }}>
              <strong>{l}</strong>
              <div className="sa-bar">
                <div
                  className="sa-bar-fill"
                  style={{ width: `${chart.values[i] * 5}px` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= LOW STOCK TABLE ================= */}
      <div className="sa-card mt-4">
        <h4>Low Stock Items</h4>

        {loading ? (
          <p>Loading...</p>
        ) : lowStock.length === 0 ? (
          <p>No low stock items 🎉</p>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Item</th>
                <th>Qty</th>
                <th>UOM</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((r, i) => (
                <tr key={i}>
                  <td>{r.store}</td>
                  <td>{r.item}</td>
                  <td className="danger">{r.closingQty}</td>
                  <td>{r.uom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
