// src/pages/superAdmin/InventoryOverview.jsx
import React, { useState } from "react";

const InventoryOverview = () => {
  const [activeTab, setActiveTab] = useState("snapshot");
  const [filters, setFilters] = useState({
    resort: "all",
    store: "all",
    item: "",
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
          <h2>Inventory</h2>
          <p>High level stock overview & reorder alerts across all resorts.</p>
        </div>
      </div>

      {/* Tabs + filters */}
      <div className="sa-card sa-report-filters">
        <div className="sa-tabs">
          <button
            type="button"
            className={`sa-tab ${activeTab === "snapshot" ? "active" : ""}`}
            onClick={() => setActiveTab("snapshot")}
          >
            Snapshot
          </button>
          <button
            type="button"
            className={`sa-tab ${activeTab === "store" ? "active" : ""}`}
            onClick={() => setActiveTab("store")}
          >
            Store-wise Stock
          </button>
          <button
            type="button"
            className={`sa-tab ${activeTab === "ledger" ? "active" : ""}`}
            onClick={() => setActiveTab("ledger")}
          >
            Item Stock Ledger
          </button>
          <button
            type="button"
            className={`sa-tab ${activeTab === "reorder" ? "active" : ""}`}
            onClick={() => setActiveTab("reorder")}
          >
            Low Stock / Reorder
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

          {(activeTab === "store" || activeTab === "ledger" || activeTab === "reorder") && (
            <div className="sa-report-filter-group">
              <label>Store</label>
              <select
                name="store"
                value={filters.store}
                onChange={handleFilterChange}
              >
                <option value="all">All Stores</option>
                <option value="main">Main Store</option>
                <option value="bar">Bar Store</option>
                <option value="hk">HK Store</option>
              </select>
            </div>
          )}

          {activeTab === "ledger" && (
            <div className="sa-report-filter-group">
              <label>Item</label>
              <input
                name="item"
                value={filters.item}
                onChange={handleFilterChange}
                placeholder="Search item..."
              />
            </div>
          )}

          {(activeTab === "store" ||
            activeTab === "ledger" ||
            activeTab === "reorder") && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "snapshot" && <SnapshotTab />}
      {activeTab === "store" && <StoreStockTab />}
      {activeTab === "ledger" && <ItemLedgerTab />}
      {activeTab === "reorder" && <ReorderTab />}
    </div>
  );
};

/* ----- TAB 1: SNAPSHOT ----- */

const SnapshotTab = () => {
  return (
    <>
      <div className="sa-grid-4">
        <div className="sa-card sa-report-kpi">
          <div className="sa-report-kpi-label">Total Stock Value</div>
          <div className="sa-report-kpi-value">₹ 18,40,000</div>
          <div className="sa-report-kpi-sub">All resorts · Last valuation</div>
        </div>
        <div className="sa-card sa-report-kpi">
          <div className="sa-report-kpi-label">Items in Stock</div>
          <div className="sa-report-kpi-value">462</div>
          <div className="sa-report-kpi-sub">Unique SKUs</div>
        </div>
        <div className="sa-card sa-report-kpi">
          <div className="sa-report-kpi-label">Slow Moving</div>
          <div className="sa-report-kpi-value">27</div>
          <div className="sa-report-kpi-sub">No movement in 90 days</div>
        </div>
        <div className="sa-card sa-report-kpi">
          <div className="sa-report-kpi-label">Near Expiry</div>
          <div className="sa-report-kpi-value">9</div>
          <div className="sa-report-kpi-sub">Next 30 days</div>
        </div>
      </div>

      <div className="sa-grid-2" style={{ marginTop: 16 }}>
        <div className="sa-card">
          <div className="sa-card-title">Top 5 items by value</div>
          <table className="sa-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Store</th>
                <th>Qty</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Imported Whisky 750ml</td>
                <td>Beachside - Bar Store</td>
                <td>120</td>
                <td>₹ 3,60,000</td>
              </tr>
              <tr>
                <td>House Wine</td>
                <td>Beachside - Bar Store</td>
                <td>80</td>
                <td>₹ 1,80,000</td>
              </tr>
              <tr>
                <td>Room Linen Set</td>
                <td>Hillview - HK Store</td>
                <td>150</td>
                <td>₹ 1,25,000</td>
              </tr>
              <tr>
                <td>Coffee Beans</td>
                <td>Beachside - Main Store</td>
                <td>60</td>
                <td>₹ 95,000</td>
              </tr>
              <tr>
                <td>LED Bulbs</td>
                <td>Hillview - Engineering</td>
                <td>200</td>
                <td>₹ 75,000</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="sa-card">
          <div className="sa-card-title">Slow moving items</div>
          <table className="sa-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Store</th>
                <th>Last Issue</th>
                <th>Qty in Stock</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Decorative Candles</td>
                <td>Beachside - Main Store</td>
                <td>12 Aug 2025</td>
                <td>45</td>
              </tr>
              <tr>
                <td>Spare Kettles</td>
                <td>Hillview - HK Store</td>
                <td>03 Jul 2025</td>
                <td>18</td>
              </tr>
              <tr>
                <td>Engineering Tool Kit</td>
                <td>City Hotel - Engineering</td>
                <td>10 Jun 2025</td>
                <td>6</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

/* ----- TAB 2: STORE-WISE STOCK ----- */

const StoreStockTab = () => {
  const rows = [
    {
      resort: "Beachside Resort",
      store: "Main Store",
      item: "Mineral Water 1L",
      uom: "Bottle",
      closing: 320,
      value: "₹ 9,600",
    },
    {
      resort: "Beachside Resort",
      store: "Bar Store",
      item: "Imported Whisky 750ml",
      uom: "Bottle",
      closing: 120,
      value: "₹ 3,60,000",
    },
    {
      resort: "Hillview Resort",
      store: "HK Store",
      item: "Room Freshener",
      uom: "Bottle",
      closing: 140,
      value: "₹ 21,000",
    },
  ];

  return (
    <div className="sa-card">
      <div className="sa-card-title">Store-wise current stock</div>
      <table className="sa-table">
        <thead>
          <tr>
            <th>Resort</th>
            <th>Store</th>
            <th>Item</th>
            <th>UOM</th>
            <th>Closing Qty</th>
            <th>Stock Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              <td>{r.resort}</td>
              <td>{r.store}</td>
              <td>{r.item}</td>
              <td>{r.uom}</td>
              <td>{r.closing}</td>
              <td>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ----- TAB 3: ITEM LEDGER ----- */

const ItemLedgerTab = () => {
  const rows = [
    {
      date: "20 Nov 2025",
      docType: "GRN",
      ref: "GRN-2025-0060",
      store: "Beachside - Main Store",
      inQty: 80,
      outQty: 0,
      balance: 320,
    },
    {
      date: "18 Nov 2025",
      docType: "Issue",
      ref: "ISS-2025-0214",
      store: "Beachside - F&B",
      inQty: 0,
      outQty: 40,
      balance: 240,
    },
    {
      date: "15 Nov 2025",
      docType: "GRN",
      ref: "GRN-2025-0052",
      store: "Beachside - Main Store",
      inQty: 120,
      outQty: 0,
      balance: 280,
    },
  ];

  return (
    <div className="sa-card">
      <div className="sa-card-title">Item stock ledger (example item)</div>
      <table className="sa-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Doc Type</th>
            <th>Ref No</th>
            <th>Store / Dept</th>
            <th>In</th>
            <th>Out</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              <td>{r.date}</td>
              <td>{r.docType}</td>
              <td>{r.ref}</td>
              <td>{r.store}</td>
              <td>{r.inQty}</td>
              <td>{r.outQty}</td>
              <td>{r.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ----- TAB 4: LOW STOCK / REORDER ----- */

const ReorderTab = () => {
  const rows = [
    {
      resort: "Beachside Resort",
      store: "Main Store",
      item: "Mineral Water 1L",
      uom: "Bottle",
      min: 200,
      reorder: 250,
      max: 600,
      stock: 180,
      status: "Below Min",
    },
    {
      resort: "Hillview Resort",
      store: "HK Store",
      item: "Room Linen Set",
      uom: "Set",
      min: 80,
      reorder: 100,
      max: 200,
      stock: 70,
      status: "Below Min",
    },
    {
      resort: "Beachside Resort",
      store: "Bar Store",
      item: "House Wine",
      uom: "Bottle",
      min: 40,
      reorder: 60,
      max: 150,
      stock: 45,
      status: "Reorder",
    },
  ];

  return (
    <div className="sa-card">
      <div className="sa-card-title">Items below min / reorder level</div>
      <table className="sa-table">
        <thead>
          <tr>
            <th>Resort</th>
            <th>Store</th>
            <th>Item</th>
            <th>UOM</th>
            <th>Min</th>
            <th>Reorder</th>
            <th>Max</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Create</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              <td>{r.resort}</td>
              <td>{r.store}</td>
              <td>{r.item}</td>
              <td>{r.uom}</td>
              <td>{r.min}</td>
              <td>{r.reorder}</td>
              <td>{r.max}</td>
              <td>{r.stock}</td>
              <td>
                <span
                  className={
                    r.status === "Below Min"
                      ? "sa-badge sa-badge-danger"
                      : "sa-badge sa-badge-warning"
                  }
                >
                  {r.status}
                </span>
              </td>
              <td>
                <button className="sa-table-action">
                  <i className="ri-add-line" />
                  Req.
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryOverview;
