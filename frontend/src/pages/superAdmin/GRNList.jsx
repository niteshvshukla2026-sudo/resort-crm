import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

// --- 5 Dummy GRN samples for dev/demo ---
const DEV_GRN_SAMPLES = [
  {
    _id: "sample_grn_1",
    grnNo: "GRN-2025-101",
    poId: "sample_po_1",
    vendor: "vendor_1",
    resort: "resort_1",
    store: "store_1",
    grnDate: new Date().toISOString(),
    status: "Open",
    lines: [
      { lineId: "ln1", item: "item_1", poQty: 10, receivedQty: 10, rejectedQty: 0, acceptedQty: 10 },
      { lineId: "ln2", item: "item_2", poQty: 5, receivedQty: 5, rejectedQty: 0, acceptedQty: 5 },
    ],
  },
  {
    _id: "sample_grn_2",
    grnNo: "GRN-2025-102",
    poId: "sample_po_2",
    vendor: "vendor_2",
    resort: "resort_1",
    store: "store_2",
    grnDate: new Date().toISOString(),
    status: "Open",
    lines: [{ lineId: "ln3", item: "item_3", poQty: 20, receivedQty: 20, rejectedQty: 0, acceptedQty: 20 }],
  },
  {
    _id: "sample_grn_3",
    grnNo: "GRN-2025-103",
    poId: "sample_po_3",
    vendor: "vendor_1",
    resort: "resort_2",
    store: "store_3",
    grnDate: new Date().toISOString(),
    status: "Closed",
    lines: [{ lineId: "ln4", item: "item_2", poQty: 2, receivedQty: 2, rejectedQty: 0, acceptedQty: 2 }],
  },
  {
    _id: "sample_grn_4",
    grnNo: "GRN-2025-104",
    poId: "sample_po_4",
    vendor: "vendor_3",
    resort: "resort_2",
    store: "store_4",
    grnDate: new Date().toISOString(),
    status: "Open",
    lines: [
      { lineId: "ln5", item: "item_4", poQty: 12, receivedQty: 12, rejectedQty: 0, acceptedQty: 12 },
      { lineId: "ln6", item: "item_1", poQty: 6, receivedQty: 6, rejectedQty: 0, acceptedQty: 6 },
    ],
  },
  {
    _id: "sample_grn_5",
    grnNo: "GRN-2025-105",
    poId: "sample_po_5",
    vendor: "vendor_2",
    resort: "resort_1",
    store: "store_1",
    grnDate: new Date().toISOString(),
    status: "Open",
    lines: [{ lineId: "ln7", item: "item_5", poQty: 3, receivedQty: 3, rejectedQty: 0, acceptedQty: 3 }],
  },
];

const GRNList = () => {
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
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL / Open / Approved / Closed
  const [actionFilter, setActionFilter] = useState("ALL"); // ALL / NeedsApproval / Approved / Open
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [resortFilter, setResortFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  // Load all master data + GRN list
  const loadData = async () => {
    try {
      setLoading(true);
      const [grnRes, poRes, vendorRes, resortRes, storeRes, itemRes] = await Promise.all([
        axios.get(`${API_BASE}/api/grn`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/po`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/vendors`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/resorts`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/stores`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/items`).catch(() => ({ data: [] })),
      ]);

      const serverGrns = Array.isArray(grnRes.data) ? grnRes.data : [];
      const existingGrnIds = new Set(serverGrns.map((g) => g._id));
      const samplesToAdd = DEV_GRN_SAMPLES.filter((s) => !existingGrnIds.has(s._id));
      setGrnList([...serverGrns, ...samplesToAdd]);

      const serverPos = Array.isArray(poRes.data) ? poRes.data : [];
      setPoList(serverPos);

      setVendors(Array.isArray(vendorRes.data) ? vendorRes.data : []);
      setResorts(Array.isArray(resortRes.data) ? resortRes.data : []);
      setStores(Array.isArray(storeRes.data) ? storeRes.data : []);
      setItems(Array.isArray(itemRes.data) ? itemRes.data : []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load GRN list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenForm = () => {
    setEditingGrnId(null);
    setForm({
      resort: "",
      store: "",
      vendor: "",
      poId: "",
      grnDate: new Date().toISOString().slice(0, 10),
      lines: [line()],
      grnNo: `GRN-${Date.now()}`,
    });
    setError("");
    setShowForm(true);
  };

  const updateForm = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const updateLine = (idx, field, value) => {
    setForm((p) => {
      const rows = [...p.lines];
      rows[idx][field] = value;

      if (field === "receivedQty" || field === "rejectedQty") {
        const rec = Number(rows[idx].receivedQty || 0);
        const rej = Number(rows[idx].rejectedQty || 0);
        rows[idx].acceptedQty = rec - rej;
      }

      return { ...p, lines: rows };
    });
  };

  const addLine = () => setForm((p) => ({ ...p, lines: [...p.lines, line()] }));
  const removeLine = (idx) => setForm((p) => ({ ...p, lines: p.lines.filter((_, i) => i !== idx) }));

  // When PO is selected → auto load PO items into GRN lines
  const loadPOItems = (poId) => {
    const po = poList.find((p) => (p._id || p.id) === poId);
    if (!po) return;

    const rows = (po.items || []).map((it) => ({
      lineId: `grn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      item: it.item || it.itemId || "",
      poQty: it.qty || it.quantity || 0,
      receivedQty: "",
      rejectedQty: "",
      acceptedQty: 0,
    }));

    setForm((p) => ({
      ...p,
      lines: rows.length ? rows : [line()],
      vendor: po.vendor || p.vendor,
      resort: po.resort || p.resort,
      store: po.store || p.store,
    }));
  };

  // create or update GRN
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.resort) return setError("Select resort");
    if (!form.store) return setError("Select store");
    if (!form.vendor) return setError("Vendor missing (comes from PO or select vendor)");
    if (!form.poId) return setError("Select PO");
    if (!form.lines || form.lines.length === 0) return setError("Add at least one item line");

    for (const ln of form.lines) {
      if (!ln.item) return setError("Each line must have an item");
      if (Number(ln.receivedQty || 0) < 0) return setError("Received qty cannot be negative");
      if (Number(ln.rejectedQty || 0) < 0) return setError("Rejected qty cannot be negative");
    }

    try {
      setSaving(true);
      const payload = {
        grnNo: form.grnNo || undefined,
        resort: form.resort,
        store: form.store,
        vendor: form.vendor,
        poId: form.poId,
        grnDate: form.grnDate,
        lines: form.lines.map((l) => ({
          item: l.item,
          poQty: Number(l.poQty || 0),
          receivedQty: Number(l.receivedQty || 0),
          rejectedQty: Number(l.rejectedQty || 0),
          acceptedQty: Number(l.acceptedQty || 0),
        })),
      };

      if (editingGrnId) {
        const res = await axios.put(`${API_BASE}/api/grn/${editingGrnId}`, payload);
        if (res?.data) {
          setGrnList((p) => p.map((g) => (g._id === editingGrnId ? res.data : g)));
        } else {
          await loadData();
        }
      } else {
        const res = await axios.post(`${API_BASE}/api/grn`, payload);
        const created = res.data || null;
        if (created) {
          setGrnList((p) => [...p, created]);
          const idOrNo = created._id || created.id || created.grnNo;
          if (idOrNo) navigate(`/super-admin/grn/${idOrNo}`);
        } else {
          await loadData();
          navigate("/super-admin/grn");
        }
      }

      setShowForm(false);
      setEditingGrnId(null);
    } catch (err) {
      console.error("Failed to save GRN:", err);
      setError(err.response?.data?.message || "Failed to save GRN");
    } finally {
      setSaving(false);
    }
  };

  // row actions
  const viewGrn = (g) => {
    const idOrNo = g._id || g.id || g.grnNo;
    if (!idOrNo) return;
    navigate(`/super-admin/grn/${idOrNo}`);
  };

  const openEditGrn = (g) => {
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
            item: ln.item || ln.itemId || "",
            poQty: ln.poQty || ln.qty || 0,
            receivedQty: ln.receivedQty || ln.received || "",
            rejectedQty: ln.rejectedQty || ln.rejected || "",
            acceptedQty: ln.acceptedQty || ln.accepted || 0,
          }))) ||
        [line()],
    });
    setShowForm(true);
  };

  const openDuplicateGrn = (g) => {
    setEditingGrnId(null);
    setForm({
      grnNo: `GRN-${Date.now()}`,
      resort: g.resort || "",
      store: g.store || "",
      vendor: g.vendor || "",
      poId: g.poId || "",
      grnDate: new Date().toISOString().slice(0, 10),
      lines:
        (g.lines &&
          g.lines.map((ln) => ({
            lineId: `dup_${Math.floor(Math.random() * 100000)}`,
            item: ln.item || ln.itemId || "",
            poQty: ln.poQty || ln.qty || 0,
            receivedQty: ln.receivedQty || ln.received || "",
            rejectedQty: ln.rejectedQty || ln.rejected || "",
            acceptedQty: ln.acceptedQty || ln.accepted || 0,
          }))) ||
        [line()],
    });
    setShowForm(true);
  };

  const handleDelete = async (g) => {
    if (!window.confirm(`Delete GRN ${g.grnNo || g._id || g.id}?`)) return;
    try {
      setGrnList((p) => p.filter((x) => x._id !== g._id && x.id !== g.id));
      await axios.delete(`${API_BASE}/api/grn/${g._id || g.id}`);
    } catch (err) {
      console.error("delete grn error", err);
      setError(err.response?.data?.message || "Failed to delete GRN");
      await loadData();
    }
  };

  const handleApprove = async (g) => {
    if (g.status === "Approved" || g.status === "APPROVED") return;
    if (!window.confirm(`Approve GRN ${g.grnNo || g._id || g.id}?`)) return;
    try {
      const res = await axios.post(`${API_BASE}/api/grn/${g._id || g.id}/approve`).catch(() => null);
      if (res?.data) {
        setGrnList((p) => p.map((x) => (x._id === g._id || x.id === g.id ? res.data : x)));
      } else {
        setGrnList((p) => p.map((x) => (x._id === g._id || x.id === g.id ? { ...x, status: "Approved" } : x)));
      }
    } catch (err) {
      console.error("approve grn error", err);
      setError(err.response?.data?.message || "Failed to approve GRN");
    }
  };

  // helper display functions
  const getVendorName = (id) => vendors.find((v) => v._id === id || v.id === id)?.name || id || "-";
  const getResortName = (id) => resorts.find((r) => r._id === id || r.id === id)?.name || id || "-";
  const getStoreName = (id) => stores.find((s) => s._id === id || s.id === id)?.name || id || "-";
  const getPoText = (id) => poList.find((p) => (p._id || p.id) === id)?.poNo || id || "-";

  // APPLY FILTERS (client-side)
  const applyFilters = () => {
    return grnList.filter((g) => {
      // STATUS
      if (statusFilter !== "ALL") {
        const st = (g.status || "").toString().toLowerCase();
        if (st !== statusFilter.toLowerCase()) return false;
      }

      // ACTION
      if (actionFilter !== "ALL") {
        const isApproved = (g.status || "").toString().toLowerCase() === "approved";
        if (actionFilter === "NeedsApproval" && isApproved) return false;
        if (actionFilter === "Approved" && !isApproved) return false;
        if (actionFilter === "Open" && (g.status || "").toString().toLowerCase() !== "open") return false;
      }

      // RESORT
      if (resortFilter) {
        const val = g.resort || g.resortName || "";
        if (!val.toString().toLowerCase().includes(resortFilter.toString().toLowerCase())) return false;
      }

      // VENDOR
      if (vendorFilter) {
        const val = g.vendor || "";
        if (!val.toString().toLowerCase().includes(vendorFilter.toString().toLowerCase())) return false;
      }

      // DATE RANGE (grnDate)
      if (dateFrom) {
        const gd = g.grnDate ? new Date(g.grnDate).setHours(0,0,0,0) : null;
        const from = new Date(dateFrom).setHours(0,0,0,0);
        if (!gd || gd < from) return false;
      }
      if (dateTo) {
        const gd = g.grnDate ? new Date(g.grnDate).setHours(0,0,0,0) : null;
        const to = new Date(dateTo).setHours(0,0,0,0);
        if (!gd || gd > to) return false;
      }

      // SEARCH
      if (searchText && searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        const fields = [
          g.grnNo,
          g.poId,
          g.vendor,
          g.store,
          g.resort,
        ];
        const joined = fields.filter(Boolean).join(" ").toLowerCase();
        if (!joined.includes(q)) return false;
      }

      return true;
    });
  };

  const filtered = applyFilters();

  const clearFilters = () => {
    setStatusFilter("ALL");
    setActionFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setResortFilter("");
    setVendorFilter("");
    setSearchText("");
  };

  const actionStyle = {
    display: "inline-block",
    marginLeft: 6,
    cursor: "pointer",
    padding: "6px",
    borderRadius: 6,
    position: "relative",
  };

  return (
    <div className="sa-page">
      {/* HEADER */}
      <div className="sa-page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h2>GRN (Goods Receipt)</h2>
          <p>Create and manage GRN entries from PO deliveries.</p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="sa-primary-button" type="button" onClick={handleOpenForm}>
            <i className="ri-add-line"></i> New GRN
          </button>

          <button
            type="button"
            className="sa-secondary-button"
            onClick={() => {
              loadData();
              clearFilters();
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
            <option value="NeedsApproval">Needs Approval</option>
            <option value="Approved">Approved</option>
            <option value="Open">Open</option>
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
          <input
            placeholder="GRN no / PO no / vendor / store"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ marginLeft: 8, width: "80%" }}
          />
        </label>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="sa-secondary-button" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </div>

      {error && <div className="sa-modal-error">{error}</div>}

      {/* LIST */}
      <div className="sa-card">
        {loading ? (
          <div>Loading GRN entries...</div>
        ) : (
          <>
            <div style={{ marginBottom: 8, color: "#6b7280", fontSize: "0.9rem" }}>
              Showing {filtered.length} of {grnList.length} GRN entries
            </div>

            <table className="sa-table">
              <thead>
                <tr>
                  <th>GRN No.</th>
                  <th>PO No.</th>
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
                  <tr key={g._id || g.id}>
                    <td style={{ cursor: "pointer", color: "#0b69ff" }} onClick={() => viewGrn(g)}>
                      {g.grnNo || g._id}
                    </td>
                    <td>{getPoText(g.poId)}</td>
                    <td>{getVendorName(g.vendor)}</td>
                    <td>{getResortName(g.resort)}</td>
                    <td>{getStoreName(g.store)}</td>
                    <td>{(g.grnDate || g.date || "").slice(0, 10)}</td>
                    <td>{g.status || "Open"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {/* VIEW */}
                      <span style={actionStyle} onClick={() => viewGrn(g)} title="View">
                        <i className="ri-eye-line" />
                      </span>

                      {/* DUPLICATE */}
                      <span style={actionStyle} onClick={() => openDuplicateGrn(g)} title="Create (Duplicate)">
                        <i className="ri-file-copy-line" />
                      </span>

                      {/* EDIT */}
                      <span style={actionStyle} onClick={() => openEditGrn(g)} title="Edit">
                        <i className="ri-edit-line" />
                      </span>

                      {/* APPROVE */}
                      <span
                        style={{
                          ...actionStyle,
                          background: (g.status === "Approved" || g.status === "APPROVED") ? "#052e16" : "transparent",
                        }}
                        onClick={() => handleApprove(g)}
                        title={g.status === "Approved" || g.status === "APPROVED" ? "Already approved" : "Approve"}
                      >
                        <i className="ri-checkbox-circle-line" />
                      </span>

                      {/* DELETE */}
                      <span style={actionStyle} onClick={() => handleDelete(g)} title="Delete">
                        <i className="ri-delete-bin-6-line" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="sa-modal-backdrop" onClick={() => !saving && (setShowForm(false), setEditingGrnId(null))}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingGrnId ? "Edit GRN" : "Create GRN"}</h3>
            <p className="sa-modal-sub">Select PO and enter received items.</p>

            <form className="sa-modal-form" onSubmit={handleSubmit}>
              <label>
                Purchase Order
                <select
                  name="poId"
                  value={form.poId}
                  onChange={(e) => {
                    updateForm(e);
                    loadPOItems(e.target.value);
                  }}
                  required
                >
                  <option value="">-- Select PO --</option>
                  {poList.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.poNo || p.po_number || (p._id || p.id)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                GRN No.
                <input name="grnNo" value={form.grnNo} onChange={updateForm} required />
              </label>

              <label>
                Vendor
                <input value={getVendorName(form.vendor)} disabled />
              </label>

              <label>
                Resort
                <input value={getResortName(form.resort)} disabled />
              </label>

              <label>
                Store
                <input value={getStoreName(form.store)} disabled />
              </label>

              <label>
                GRN Date
                <input type="date" name="grnDate" value={form.grnDate} onChange={updateForm} required />
              </label>

              {/* LINES */}
              <div style={{ marginTop: 10 }}>
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>PO Qty</th>
                      <th>Received</th>
                      <th>Rejected</th>
                      <th>Accepted</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {form.lines.map((ln, idx) => (
                      <tr key={ln.lineId}>
                        <td>
                          <input value={ln.item} disabled />
                        </td>

                        <td style={{ textAlign: "center" }}>{ln.poQty}</td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            value={ln.receivedQty}
                            onChange={(e) => updateLine(idx, "receivedQty", e.target.value)}
                            required
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            value={ln.rejectedQty}
                            onChange={(e) => updateLine(idx, "rejectedQty", e.target.value)}
                          />
                        </td>

                        <td style={{ textAlign: "center" }}>{ln.acceptedQty}</td>

                        <td>{form.lines.length > 1 && <button type="button" onClick={() => removeLine(idx)}>Remove</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button type="button" onClick={addLine} style={{ marginTop: 6 }}>
                  + Add Line
                </button>
              </div>

              {error && <div className="sa-modal-error" style={{ marginTop: 8 }}>{error}</div>}

              <div className="sa-modal-actions" style={{ marginTop: 12 }}>
                <button type="button" className="sa-secondary-button" onClick={() => !saving && (setShowForm(false), setEditingGrnId(null))}>
                  Cancel
                </button>

                <button type="submit" className="sa-primary-button" disabled={saving}>
                  {saving ? "Saving..." : editingGrnId ? "Update GRN" : "Save GRN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* small inline styles for action hover */}
      <style>{`
        td .action-btn .tooltip { display:none; }
        td .action-btn:hover .tooltip { display:block; }
      `}</style>
    </div>
  );
};

export default GRNList;
