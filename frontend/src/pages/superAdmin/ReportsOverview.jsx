import React, { useState } from "react";

const ReportsOverview = () => {
  const [activeTab, setActiveTab] = useState("purchase");
  const [filters, setFilters] = useState({
    resort: "all",
    from: "",
    to: "",
  });

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>Reports</h2>
          <p>Purchase, stock & consumption analytics for all resorts.</p>
        </div>
        <button className="sa-primary-button" type="button">
          <i className="ri-download-2-line" /> Export
        </button>
      </div>

      {/* Filters */}
      <div className="sa-card sa-report-filters">
        <div className="sa-tabs">
          <button
            type="button"
            className={`sa-tab ${activeTab === "purchase" ? "active" : ""}`}
            onClick={() => setActiveTab("purchase")}
          >
            Purchase Summary
          </button>
          <button
            type="button"
            className={`sa-tab ${activeTab === "stock" ? "active" : ""}`}
            onClick={() => setActiveTab("stock")}
          >
            Stock Ledger
          </button>
          <button
            type="button"
            className={`sa-tab ${activeTab === "consumption" ? "active" : ""}`}
            onClick={() => setActiveTab("consumption")}
          >
            Consumption Report
          </button>
        </div>

        <div className="sa-report-filter-row">
          <div className="sa-report-filter-group">
            <label>Resort</label>
            <select
              name="resort"
              value={filters.resort}
              onChange={handleFilterChange}
            >
              <option value="all">All Resorts</option>
              <option value="beachside">Beachside Resort</option>
              <option value="hillview">Hillview Resort</option>
            </select>
          </div>
          <div className="sa-report-filter-group">
            <label>From</label>
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
            />
          </div>
          <div className="sa-report-filter-group">
            <label>To</label>
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "purchase" && <PurchaseSummary />}
      {activeTab === "stock" && <StockLedger />}
      {activeTab === "consumption" && <ConsumptionReport />}
    </div>
  );
};

const PurchaseSummary = () => {
  const rows = [
    {
      resort: "Beachside Resort",
      vendor: "FreshFoods Supplier",
      orders: 12,
      value: "₹ 4,25,000",
    },
    {
      resort: "Hillview Resort",
      vendor: "Beverage Distributors",
      orders: 8,
      value: "₹ 2,10,000",
    },
  ];

  return (
    <>
      <div className="sa-grid-3">
        <div className="sa-card sa-report-kpi">
          <div className="sa-report-kpi-label">Total PO Value</div>
          <div className="sa-report-kpi-value">₹ 9,80,000</div>
          <div className="sa-report-kpi-sub">Last 30 days</div>
        </div>
        <div className="sa-card sa-report-kpi">
          <div className="sa-report-kpi-label">Vendors</div>
          <div className="sa-report-kpi-value">18</div>
          <div className="sa-report-kpi-sub">With active PO</div>
        </div>
        <div className="sa-card sa-report-kpi">
          <div className="sa-report-kpi-label">Avg. PO Value</div>
          <div className="sa-report-kpi-value">₹ 54,000</div>
          <div className="sa-report-kpi-sub">Per order</div>
        </div>
      </div>

      <div className="sa-card" style={{ marginTop: 16 }}>
        <div className="sa-card-title">Resort & vendor-wise purchase</div>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Resort</th>
              <th>Vendor</th>
              <th>No. of POs</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx}>
                <td>{r.resort}</td>
                <td>{r.vendor}</td>
                <td>{r.orders}</td>
                <td>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const StockLedger = () => {
  const rows = [
    {
      item: "Mineral Water 1L",
      store: "Beachside - Main Store",
      opening: 120,
      inQty: 80,
      outQty: 60,
      closing: 140,
    },
    {
      item: "Room Freshener",
      store: "Hillview - HK Store",
      opening: 40,
      inQty: 30,
      outQty: 20,
      closing: 50,
    },
  ];

  return (
    <div className="sa-card">
      <div className="sa-card-title">Item-wise in/out balance</div>
      <table className="sa-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Store</th>
            <th>Opening</th>
            <th>In</th>
            <th>Out</th>
            <th>Closing</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              <td>{r.item}</td>
              <td>{r.store}</td>
              <td>{r.opening}</td>
              <td>{r.inQty}</td>
              <td>{r.outQty}</td>
              <td>{r.closing}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ConsumptionReport = () => {
  const rows = [
    {
      resort: "Beachside Resort",
      department: "F&B",
      item: "Mineral Water 1L",
      qty: 220,
    },
    {
      resort: "Hillview Resort",
      department: "Housekeeping",
      item: "Room Freshener",
      qty: 65,
    },
  ];

  return (
    <div className="sa-card">
      <div className="sa-card-title">Department / outlet-wise usage</div>
      <table className="sa-table">
        <thead>
          <tr>
            <th>Resort</th>
            <th>Department</th>
            <th>Item</th>
            <th>Consumed Qty</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              <td>{r.resort}</td>
              <td>{r.department}</td>
              <td>{r.item}</td>
              <td>{r.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportsOverview;
