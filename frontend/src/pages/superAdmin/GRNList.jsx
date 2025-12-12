// src/pages/superAdmin/GRNList.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ResortContext } from "../../context/ResortContext"; // <-- added

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// row template
const line = () => ({
  lineId: `grn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  item: "",
  poQty: 0,
  receivedQty: "",
  rejectedQty: "",
  acceptedQty: 0,
});

const GRNList = () => {
  const { activeResort } = useContext(ResortContext); // global resort
  const [grnList, setGrnList] = useState([]);
  const [poList, setPoList] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingGrnId, setEditingGrnId] = useState(null); // null -> create, otherwise edit

  const [form, setForm] = useState({
    resort: "",
    store: "",
    vendor: "",
    poId: "",
    grnDate: new Date().toISOString().slice(0, 10),
    lines: [line()],
    grnNo: "",
  });

  const navigate = useNavigate();

  // FILTER STATES
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [resortFilter, setResortFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  // buildUrl helper: appends resort query when activeResort set (and not "all")
  function buildUrl(path) {
    const sep = path.includes("?") ? "&" : "?";
    if (activeResort && activeResort !== "all") {
      return `${API_BASE}${path}${sep}resort=${encodeURIComponent(activeResort)}`;
    }
    return `${API_BASE}${path}`;
  }

  // Load data — strict backend-only fetching, no demo fallback
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // use buildUrl for endpoints that should be resort-scoped
      const [grnRes, poRes, vendorRes, resortRes, storeRes, itemRes] = await Promise.all([
        axios.get(buildUrl("/api/grn")),
        axios.get(buildUrl("/api/po")),
        axios.get(buildUrl("/api/vendors")),
        // resorts list is global — do not scope
        axios.get(`${API_BASE}/api/resorts`),
        axios.get(buildUrl("/api/stores")),
        axios.get(buildUrl("/api/items")),
      ]);

      const serverGrns = Array.isArray(grnRes.data) ? grnRes.data : [];
      // show only GRNs that were created from a PO or a requisition
      const backendOnlyGrns = serverGrns.filter((g) => g.poId || g.requisitionId);

      setGrnList(backendOnlyGrns);
      setPoList(Array.isArray(poRes.data) ? poRes.data : []);
      setVendors(Array.isArray(vendorRes.data) ? vendorRes.data : []);
      setResorts(Array.isArray(resortRes.data) ? resortRes.data : []);
      setStores(Array.isArray(storeRes.data) ? storeRes.data : []);
      setItems(Array.isArray(itemRes.data) ? itemRes.data : []);
    } catch (err) {
      console.error("GRN load error", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to load data from backend";
      setError(msg);
      // Clear lists when backend fails — do not inject demo data
      setGrnList([]);
      setPoList([]);
      setVendors([]);
      setResorts([]);
      setStores([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // reload when activeResort changes and sync page-level resortFilter
  useEffect(() => {
    if (activeResort && activeResort !== "all") setResortFilter(activeResort);
    else setResortFilter("");
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeResort]);

  const viewGrn = (g) => {
    const idOrNo = g._id || g.grnNo;
    if (!idOrNo) return;
    navigate(`/super-admin/grn/${idOrNo}`);
  };

  const openEditGrn = (g) => {
    // prevent editing if approved
    if (g.status === "Approved") return alert("Approved GRN cannot be edited");

    setEditingGrnId(g._id || g.id);
    setForm({
      grnNo: g.grnNo || "",
      resort: g.resort || "",
      store: g.store || "",
      vendor: g.vendor || "",
      poId: g.poId || "",
      grnDate: (g.grnDate || g.date || new Date().toISOString()).slice(0, 10),
      lines:
        (g.lines &&
          g.lines.map((ln) => ({
            lineId: ln.lineId || `grn_${Math.floor(Math.random() * 100000)}`,
            item: ln.item || "",
            poQty: ln.poQty || 0,
            receivedQty: ln.receivedQty || "",
            rejectedQty: ln.rejectedQty || "",
            acceptedQty: ln.acceptedQty || 0,
          }))) || [line()],
    });
    setShowForm(true);
  };

  const handleDelete = async (g) => {
    if (g.status === "Approved") return alert("Approved GRN cannot be deleted");

    if (!window.confirm(`❗ Delete GRN ${g.grnNo}?`)) return;
    try {
      setGrnList((p) => p.filter((x) => x._id !== g._id));
      await axios.delete(`${API_BASE}/api/grn/${g._id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to delete");
      await loadData();
    }
  };

  // helper functions for display and lookup
  const getVendorName = (id) => vendors.find((v) => v._id === id || v.id === id)?.name || id || "-";
  const getResortName = (id) => resorts.find((r) => r._id === id || r.id === id)?.name || id || "-";
  const getStoreName = (id) => stores.find((s) => s._id === id || s.id === id)?.name || id || "-";
  const getPoText = (id) => poList.find((p) => (p._id || p.id) === id)?.poNo || id || "-";
  const getItemName = (id) => items.find((it) => it._id === id || it.id === id)?.name || id || "-";

  // client-side filtering similar to POList/RequisitionList
  const applyFilters = () => {
    return grnList.filter((g) => {
      // STATUS
      if (statusFilter !== "ALL") {
        const st = (g.status || "").toString().toLowerCase();
        if (st !== statusFilter.toLowerCase()) return false;
      }

      // ACTION (example: NeedsAction / Approved / etc)
      if (actionFilter !== "ALL") {
        const isApproved = (g.status || "").toString().toLowerCase() === "approved";
        if (actionFilter === "Approved" && !isApproved) return false;
        if (actionFilter === "NeedsAction" && isApproved) return false;
        // add other action rules as needed
      }

      // RESORT
      if (resortFilter) {
        const val = g.resort || g.resortName || "";
        if (!String(val).toLowerCase().includes(String(resortFilter).toLowerCase())) return false;
      }

      // VENDOR
      if (vendorFilter) {
        const val = g.vendor || "";
        if (!String(val).toLowerCase().includes(String(vendorFilter).toLowerCase())) return false;
      }

      // DATE RANGE (by grnDate)
      if (dateFrom) {
        const gd = g.grnDate ? new Date(g.grnDate).setHours(0, 0, 0, 0) : null;
        const from = new Date(dateFrom).setHours(0, 0, 0, 0);
        if (!gd || gd < from) return false;
      }
      if (dateTo) {
        const gd = g.grnDate ? new Date(g.grnDate).setHours(0, 0, 0, 0) : null;
        const to = new Date(dateTo).setHours(0, 0, 0, 0);
        if (!gd || gd > to) return false;
      }

      // SEARCH
      if (searchText && searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        const fields = [g.grnNo, g.poId, g.vendor, g.store, g.resort];
        const joined = fields.filter(Boolean).join(" ").toLowerCase();
        if (!joined.includes(q)) return false;
      }

      return true;
    });
  };

  const filtered = applyFilters();

  return (
    <div className="sa-page">
      {/* HEADER */}
      <div className="sa-page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h2>GRN (Goods Receipt)</h2>
          <p>GRNs created from Purchase Orders. Manual GRN creation disabled.</p>
        </div>

        {/* NO NEW GRN BUTTON */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="sa-secondary-button"
            onClick={() => {
              loadData();
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="sa-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <label style={{ fontSize: "0.85rem" }}>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ marginLeft: 6 }}>
            <option value="ALL">All</option>
            <option value="Open">Open</option>
            <option value="Approved">Approved</option>
            <option value="Closed">Closed</option>
          </select>
        </label>

        <label style={{ fontSize: "0.85rem" }}>
          Action
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{ marginLeft: 6 }}>
            <option value="ALL">All</option>
            <option value="NeedsAction">Needs Action</option>
            <option value="Approved">Approved</option>
          </select>
        </label>

        <label style={{ fontSize: "0.85rem" }}>
          Resort
          <select value={resortFilter} onChange={(e) => setResortFilter(e.target.value)} style={{ marginLeft: 6 }}>
            <option value="">All Resorts</option>
            {resorts.length > 0
              ? resorts.map((r) => (
                  <option key={r._id || r.id} value={r._id || r.name || r.id}>
                    {r.name}
                  </option>
                ))
              : Array.from(new Set(grnList.map((x) => x.resort))).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
          </select>
        </label>

        <label style={{ fontSize: "0.85rem" }}>
          Vendor
          <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} style={{ marginLeft: 6 }}>
            <option value="">All Vendors</option>
            {vendors.length > 0
              ? vendors.map((v) => (
                  <option key={v._id || v.id} value={v._id || v.name || v.id}>
                    {v.name}
                  </option>
                ))
              : Array.from(new Set(grnList.map((x) => x.vendor))).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
          </select>
        </label>

        <label style={{ fontSize: "0.85rem" }}>
          Date from
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ marginLeft: 6 }} />
        </label>

        <label style={{ fontSize: "0.85rem" }}>
          Date to
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ marginLeft: 6 }} />
        </label>

        <label style={{ flex: 1, minWidth: 220 }}>
          Search
          <input placeholder="GRN / PO / vendor / store" value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ marginLeft: 8, width: "80%" }} />
        </label>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="sa-secondary-button" onClick={() => {
            setStatusFilter("ALL"); setActionFilter("ALL"); setDateFrom(""); setDateTo(""); setResortFilter(""); setVendorFilter(""); setSearchText("");
          }}>
            Clear
          </button>
        </div>
      </div>

      {/* GRN LIST */}
      <div className="sa-card">
        {loading ? (
          <div>Loading…</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>GRN No</th>
                <th>PO No</th>
                <th>Vendor</th>
                <th>Resort</th>
                <th>Store</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((g) => (
                <tr key={g._id}>
                  <td onClick={() => viewGrn(g)} style={{ cursor: "pointer", color: "#0b69ff" }}>
                    {g.grnNo}
                  </td>
                  <td>{getPoText(g.poId || g.po) || "-"}</td>
                  <td>{getVendorName(g.vendor)}</td>
                  <td>{getResortName(g.resort)}</td>
                  <td>{getStoreName(g.store)}</td>
                  <td>{g.grnDate?.slice(0, 10)}</td>
                  <td>{g.status || "Open"}</td>

                  <td style={{ whiteSpace: "nowrap" }}>
                    {/* VIEW */}
                    <span style={{ cursor: "pointer", padding: 6 }} title="View" onClick={() => viewGrn(g)}>
                      <i className="ri-eye-line" />
                    </span>

                    {/* EDIT (Disabled after approval) */}
                    {g.status === "Approved" ? (
                      <span style={{ opacity: 0.4, padding: 6 }}>
                        <i className="ri-edit-line" />
                      </span>
                    ) : (
                      <span style={{ cursor: "pointer", padding: 6 }} title="Edit" onClick={() => openEditGrn(g)}>
                        <i className="ri-edit-line" />
                      </span>
                    )}

                    {/* DELETE (Disabled after approval) */}
                    {g.status === "Approved" ? (
                      <span style={{ opacity: 0.4, padding: 6 }}>
                        <i className="ri-delete-bin-6-line" />
                      </span>
                    ) : (
                      <span style={{ cursor: "pointer", padding: 6 }} title="Delete" onClick={() => handleDelete(g)}>
                        <i className="ri-delete-bin-6-line" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GRNList;
