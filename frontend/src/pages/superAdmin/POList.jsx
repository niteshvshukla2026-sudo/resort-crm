import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// helper to create a new empty line (PO)
const newLine = () => ({
  lineId: `po_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  item: "",
  qty: 1,
  rate: "",
  amount: 0,
});

// --- 5 Dummy PO Samples for dev/demo ---
const DEV_PO_SAMPLES = [
  {
    _id: "sample_po_1",
    poNo: "PO-2025-001",
    requisitionId: "sample_req_1",
    vendor: "vendor_1",
    resort: "resort_1",
    store: "store_1",
    poDate: new Date().toISOString(),
    status: "Open",
    items: [
      { item: "item_1", qty: 10, rate: 50, amount: 500 },
      { item: "item_2", qty: 5, rate: 200, amount: 1000 },
    ],
  },
  {
    _id: "sample_po_2",
    poNo: "PO-2025-002",
    requisitionId: "sample_req_2",
    vendor: "vendor_2",
    resort: "resort_1",
    store: "store_2",
    poDate: new Date().toISOString(),
    status: "Open",
    items: [{ item: "item_3", qty: 20, rate: 30, amount: 600 }],
  },
  {
    _id: "sample_po_3",
    poNo: "PO-2025-003",
    requisitionId: "sample_req_3",
    vendor: "vendor_1",
    resort: "resort_2",
    store: "store_3",
    poDate: new Date().toISOString(),
    status: "Closed",
    items: [{ item: "item_2", qty: 2, rate: 200, amount: 400 }],
    grn: { grnNo: "GRN-2025-010", _id: "sample_grn_3" },
  },
  {
    _id: "sample_po_4",
    poNo: "PO-2025-004",
    requisitionId: "sample_req_4",
    vendor: "vendor_3",
    resort: "resort_2",
    store: "store_4",
    poDate: new Date().toISOString(),
    status: "Open",
    items: [
      { item: "item_4", qty: 12, rate: 75, amount: 900 },
      { item: "item_1", qty: 6, rate: 50, amount: 300 },
    ],
  },
  {
    _id: "sample_po_5",
    poNo: "PO-2025-005",
    requisitionId: "sample_req_5",
    vendor: "vendor_2",
    resort: "resort_1",
    store: "store_1",
    poDate: new Date().toISOString(),
    status: "Open",
    items: [{ item: "item_5", qty: 3, rate: 1500, amount: 4500 }],
  },
];

const POList = () => {
  const [poList, setPoList] = useState([]);
  // only approved AND without PO/GRN (we'll filter)
  const [requisitions, setRequisitions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // modal / edit states
  const [showForm, setShowForm] = useState(false);
  const [editingPoId, setEditingPoId] = useState(null); // null -> create, else edit
  const [form, setForm] = useState({
    requisitionId: "",
    vendor: "",
    resort: "",
    store: "",
    poDate: new Date().toISOString().slice(0, 10),
    lines: [newLine()],
    poNo: "",
  });

  // GRN modal state
  const [grnModal, setGrnModal] = useState({
    open: false,
    po: null,
    grnNo: "",
    receivedBy: "",
    receivedDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const navigate = useNavigate();

  // FILTER STATES
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL / Open / Approved / Closed
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [resortFilter, setResortFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL"); // ALL / NeedsGRN / HasGRN / Approved / Open
  const [searchText, setSearchText] = useState("");

  // Load existing POs and master data (approved requisitions)
  const loadData = async () => {
    try {
      setLoading(true);
      const [
        poRes,
        reqRes,
        vendorRes,
        resortRes,
        storeRes,
        itemRes,
      ] = await Promise.all([
        axios.get(`${API_BASE}/api/po`).catch(() => ({ data: [] })),
        // Fetch approved requisitions (backend query may differ) — we will filter for no po/grn
        axios.get(`${API_BASE}/api/requisitions?status=Approved`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/vendors`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/resorts`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/stores`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/items`).catch(() => ({ data: [] })),
      ]);

      // PO list from server
      const poData = Array.isArray(poRes.data) ? poRes.data : [];

      // merge server PO list with dev samples (avoid duplicates by _id)
      const existingIds = new Set(poData.map((p) => p._id));
      const samplesToAdd = DEV_PO_SAMPLES.filter((s) => !existingIds.has(s._id));
      setPoList([...poData, ...samplesToAdd]);

      // Requisitions: include only those that don't already have a PO or GRN
      const reqData = Array.isArray(reqRes.data) ? reqRes.data : [];
      const filteredReqs = reqData.filter((r) => {
        const hasPo = !!(r.po || r.poId || r.po_no || r.poNo);
        const hasGrn = !!(r.grn || r.grnId || r.grn_no || r.grnNo);
        return !hasPo && !hasGrn;
      });

      // Also remove requisitions referenced by our dummy PO samples (so they are not reusable)
      const sampleReqIds = new Set(DEV_PO_SAMPLES.map((s) => s.requisitionId));
      const filteredReqsExcludingSamples = filteredReqs.filter((r) => !sampleReqIds.has(r._id || r.id));

      setRequisitions(filteredReqsExcludingSamples);

      setVendors(Array.isArray(vendorRes.data) ? vendorRes.data : []);
      setResorts(Array.isArray(resortRes.data) ? resortRes.data : []);
      setStores(Array.isArray(storeRes.data) ? storeRes.data : []);
      setItems(Array.isArray(itemRes.data) ? itemRes.data : []);
    } catch (err) {
      console.error("loadData error", err);
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open blank create form
  const handleOpenForm = () => {
    setEditingPoId(null);
    setForm({
      requisitionId: "",
      vendor: "",
      resort: "",
      store: "",
      poDate: new Date().toISOString().slice(0, 10),
      lines: [newLine()],
      poNo: "",
    });
    setError("");
    setShowForm(true);
  };

  // Prefill on select requisition
  const onSelectRequisition = (reqId) => {
    if (!reqId) {
      setForm((p) => ({ ...p, requisitionId: "", lines: [newLine()], vendor: "", resort: "", store: "" }));
      return;
    }
    const req = requisitions.find((r) => (r._id || r.id) === reqId);
    if (!req) return;

    const reqLines = req.lines || req.items || req.requestedItems || [];
    const prefilledLines = (reqLines || []).map((it) => ({
      lineId: `po_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      item: (it.item?._id || it.item || it.itemId) || "",
      qty: it.qty || it.quantity || 1,
      rate: it.rate || "",
      amount: (it.qty || it.quantity || 0) * (it.rate || 0),
    }));

    setForm((p) => ({
      ...p,
      requisitionId: reqId,
      vendor: req.vendor || p.vendor || "",
      resort: req.resort || p.resort || "",
      store: req.store || p.store || "",
      lines: prefilledLines.length ? prefilledLines : [newLine()],
      poNo: "",
    }));
  };

  // Prefill for edit
  const openEditPo = (po) => {
    setEditingPoId(po._id || po.id);
    setForm({
      requisitionId: po.requisitionId || "",
      vendor: po.vendor || "",
      resort: po.resort || "",
      store: po.store || "",
      poDate: (po.poDate || po.date || new Date().toISOString()).slice(0, 10),
      lines:
        (po.items &&
          po.items.map((it) => ({
            lineId: it.lineId || `po_${Math.floor(Math.random() * 100000)}`,
            item: it.item || it.itemId || "",
            qty: it.qty || 1,
            rate: it.rate || 0,
            amount: it.amount || (it.qty || 1) * (it.rate || 0),
          }))) ||
        [newLine()],
      poNo: po.poNo || po.po_number || "",
    });
    setShowForm(true);
  };

  // Duplicate (prefill create form from existing PO)
  const openDuplicatePo = (po) => {
    setEditingPoId(null); // create mode
    setForm({
      requisitionId: po.requisitionId || "",
      vendor: po.vendor || "",
      resort: po.resort || "",
      store: po.store || "",
      poDate: new Date().toISOString().slice(0, 10),
      lines:
        (po.items &&
          po.items.map((it) => ({
            lineId: `dup_${Math.floor(Math.random() * 100000)}`,
            item: it.item || it.itemId || "",
            qty: it.qty || 1,
            rate: it.rate || 0,
            amount: it.amount || (it.qty || 1) * (it.rate || 0),
          }))) ||
        [newLine()],
      poNo: `PO-${Date.now()}`,
    });
    setShowForm(true);
  };

  const updateForm = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const updateLine = (idx, field, value) => {
    setForm((p) => {
      const lines = [...p.lines];
      lines[idx][field] = value;
      if (field === "qty" || field === "rate") {
        const qty = Number(lines[idx].qty || 0);
        const rate = Number(lines[idx].rate || 0);
        lines[idx].amount = qty * rate;
      }
      return { ...p, lines };
    });
  };

  const addLine = () => setForm((p) => ({ ...p, lines: [...p.lines, newLine()] }));
  const removeLine = (idx) => setForm((p) => ({ ...p, lines: p.lines.filter((_, i) => i !== idx) }));

  // create or update PO
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.vendor) return setError("Select vendor");
    if (!form.resort) return setError("Select resort");
    if (!form.store) return setError("Select delivery store");
    if (!form.lines || form.lines.length === 0) return setError("Add item lines");
    for (const ln of form.lines) {
      if (!ln.item) return setError("Each line must have item selected");
      if (!ln.qty || Number(ln.qty) <= 0) return setError("Each line must have quantity > 0");
    }

    try {
      setSaving(true);
      const payload = {
        requisitionId: form.requisitionId || undefined,
        vendor: form.vendor,
        resort: form.resort,
        store: form.store,
        poDate: form.poDate,
        poNo: form.poNo || undefined,
        items: form.lines.map((l) => ({ item: l.item, qty: Number(l.qty), rate: Number(l.rate || 0), amount: Number(l.amount || 0) })),
      };

      if (editingPoId) {
        const res = await axios.put(`${API_BASE}/api/po/${editingPoId}`, payload);
        if (res?.data) {
          setPoList((p) => p.map((x) => (x._id === editingPoId || x.id === editingPoId ? res.data : x)));
        } else {
          await loadData();
        }
      } else {
        const res = await axios.post(`${API_BASE}/api/po`, payload);
        const created = res.data || null;
        if (created) {
          setPoList((p) => [...p, created]);
          // if PO was created from a requisition, remove that requisition from available list
          if (created.requisitionId) {
            setRequisitions((prev) => prev.filter((r) => (r._id || r.id) !== created.requisitionId));
          }
          // navigate to PO page if id available
          const idOrNo = created._id || created.id || created.poNo || created.po_number;
          if (idOrNo) navigate(`/super-admin/po/${idOrNo}`);
        } else {
          await loadData();
          navigate("/super-admin/po");
        }
      }

      setShowForm(false);
      setEditingPoId(null);
    } catch (err) {
      console.error("save PO error", err);
      setError(err.response?.data?.message || "Failed to save PO");
    } finally {
      setSaving(false);
    }
  };

  // delete PO
  const handleDelete = async (po) => {
    if (!window.confirm(`Delete PO ${po.poNo || po._id || po.id}?`)) return;
    try {
      // optimistic remove
      setPoList((p) => p.filter((x) => x._id !== po._id && x.id !== po.id));
      await axios.delete(`${API_BASE}/api/po/${po._id || po.id}`);
    } catch (err) {
      console.error("delete po error", err);
      setError(err.response?.data?.message || "Failed to delete PO");
      await loadData();
    }
  };

  // approve PO
  const handleApprove = async (po) => {
    if (po.status === "Approved" || po.status === "APPROVED") return;
    if (!window.confirm(`Approve PO ${po.poNo || po._id || po.id}?`)) return;
    try {
      const res = await axios.post(`${API_BASE}/api/po/${po._id || po.id}/approve`).catch(() => null);
      if (res?.data) {
        setPoList((p) => p.map((x) => (x._id === po._id || x.id === po.id ? res.data : x)));
      } else {
        setPoList((p) => p.map((x) => (x._id === po._id || x.id === po.id ? { ...x, status: "Approved" } : x)));
      }
    } catch (err) {
      console.error("approve po error", err);
      setError(err.response?.data?.message || "Failed to approve PO");
    }
  };

  // GRN modal open (create)
  const openCreateGrn = (po) => {
    setGrnModal({
      open: true,
      po,
      grnNo: `GRN-${Date.now()}`,
      receivedBy: "",
      receivedDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  };

  const submitCreateGrn = async () => {
    const { po, grnNo, receivedBy, receivedDate, notes } = grnModal;
    if (!po) return;
    if (!grnNo) return setError("GRN No. is required");
    try {
      setSaving(true);
      const payload = { grnNo, receivedBy: receivedBy || undefined, receivedDate, notes: notes || undefined };
      const res = await axios.post(`${API_BASE}/api/po/${po._id || po.id}/create-grn`, payload).catch(() => null);
      if (res?.data) {
        // update PO in list with returned object
        const updated = res.data;
        setPoList((p) => p.map((x) => (x._id === (po._id || po.id) || x.id === (po._id || po.id) ? updated : x)));
        // navigate to GRN view if returned id
        const idOrNo = (updated.grn && (updated.grn._id || updated.grn.grnNo)) || payload.grnNo;
        if (idOrNo) navigate(`/super-admin/grn/${idOrNo}`);
      } else {
        // optimistic: mark this PO as having GRN
        setPoList((p) => p.map((x) => (x._id === (po._id || po.id) ? { ...x, grn: { grnNo } } : x)));
        navigate(`/super-admin/grn/${grnNo}`);
      }
      setGrnModal({ open: false, po: null, grnNo: "", receivedBy: "", receivedDate: new Date().toISOString().slice(0, 10), notes: "" });
    } catch (err) {
      console.error("create grn error", err);
      setError(err.response?.data?.message || "Failed to create GRN");
    } finally {
      setSaving(false);
    }
  };

  // View PO / GRN navigation helpers
  const viewPo = (po) => {
    const idOrNo = po._id || po.id || po.poNo || po.po_number;
    if (!idOrNo) return;
    navigate(`/super-admin/po/${idOrNo}`);
  };

  const viewGrn = (grn) => {
    const idOrNo = grn._id || grn.id || grn.grnNo || grn.grn_number;
    if (!idOrNo) return;
    navigate(`/super-admin/grn/${idOrNo}`);
  };

  // helper display functions
  const getVendorName = (id) => vendors.find((v) => v._id === id || v.id === id)?.name || id || "-";
  const getResortName = (id) => resorts.find((r) => r._id === id || r.id === id)?.name || id || "-";
  const getStoreName = (id) => stores.find((s) => s._id === id || s.id === id)?.name || id || "-";
  const getReqText = (id) => (requisitions.find((r) => (r._id || r.id) === id)?.requisitionNo) || id || "-";

  // APPLY FILTERS (client-side)
  const applyFilters = () => {
    return poList.filter((p) => {
      // STATUS
      if (statusFilter !== "ALL") {
        const st = (p.status || "").toString().toLowerCase();
        if (st !== statusFilter.toLowerCase()) return false;
      }

      // ACTION
      if (actionFilter !== "ALL") {
        const hasGrn = !!p.grn;
        const isApproved = (p.status || "").toString().toLowerCase() === "approved";
        if (actionFilter === "NeedsGRN" && hasGrn) return false;
        if (actionFilter === "HasGRN" && !hasGrn) return false;
        if (actionFilter === "Approved" && !isApproved) return false;
        if (actionFilter === "Open" && (p.status || "").toString().toLowerCase() !== "open") return false;
      }

      // RESORT
      if (resortFilter) {
        const val = p.resort || p.resortName || p.resortId || "";
        if (!val.toString().toLowerCase().includes(resortFilter.toString().toLowerCase())) return false;
      }

      // VENDOR
      if (vendorFilter) {
        const val = p.vendor || "";
        if (!val.toString().toLowerCase().includes(vendorFilter.toString().toLowerCase())) return false;
      }

      // DATE RANGE
      if (dateFrom) {
        const pd = p.poDate ? new Date(p.poDate).setHours(0,0,0,0) : null;
        const from = new Date(dateFrom).setHours(0,0,0,0);
        if (!pd || pd < from) return false;
      }
      if (dateTo) {
        const pd = p.poDate ? new Date(p.poDate).setHours(0,0,0,0) : null;
        const to = new Date(dateTo).setHours(0,0,0,0);
        if (!pd || pd > to) return false;
      }

      // SEARCH
      if (searchText && searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        const fields = [
          p.poNo,
          p.po_number,
          p.requisitionId,
          p.vendor,
          p.store,
          p.resort,
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
    setDateFrom("");
    setDateTo("");
    setResortFilter("");
    setVendorFilter("");
    setActionFilter("ALL");
    setSearchText("");
  };

  // action icon style
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
      {/* Header */}
      <div className="sa-page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h2>Purchase Orders</h2>
          <p>Generate & manage purchase orders created from approved requisitions.</p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="sa-primary-button" type="button" onClick={handleOpenForm}>
            <i className="ri-add-line"></i> New PO
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
            <option value="NeedsGRN">Needs GRN</option>
            <option value="HasGRN">Has GRN</option>
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
              : Array.from(new Set(poList.map((x) => x.resort))).map((name) => (
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
              : Array.from(new Set(poList.map((x) => x.vendor))).map((name) => (
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
            placeholder="PO no / requisition / vendor / store"
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
          <div>Loading purchase orders...</div>
        ) : (
          <>
            <div style={{ marginBottom: 8, color: "#6b7280", fontSize: "0.9rem" }}>
              Showing {filtered.length} of {poList.length} purchase orders
            </div>

            <table className="sa-table">
              <thead>
                <tr>
                  <th>PO No.</th>
                  <th>Requisition</th>
                  <th>Vendor</th>
                  <th>Resort</th>
                  <th>Store</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((po) => (
                  <tr key={po._id || po.id || po.poNo}>
                    <td style={{ cursor: "pointer", color: "#0b69ff" }} onClick={() => viewPo(po)}>
                      {po.poNo || po.po_number || (po._id || "-")}
                    </td>
                    <td>{getReqText(po.requisitionId)}</td>
                    <td>{getVendorName(po.vendor)}</td>
                    <td>{getResortName(po.resort)}</td>
                    <td>{getStoreName(po.store)}</td>
                    <td>{(po.poDate || po.date || "").slice(0, 10)}</td>
                    <td>{po.status || "Open"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {/* VIEW */}
                      <span style={actionStyle} onClick={() => viewPo(po)} title="View">
                        <i className="ri-eye-line" />
                      </span>

                      {/* DUPLICATE (create from PO) */}
                      <span style={actionStyle} onClick={() => openDuplicatePo(po)} title="Create (Duplicate)">
                        <i className="ri-file-copy-line" />
                      </span>

                      {/* EDIT */}
                      <span style={actionStyle} onClick={() => openEditPo(po)} title="Edit">
                        <i className="ri-edit-line" />
                      </span>

                      {/* APPROVE */}
                      <span
                        style={{
                          ...actionStyle,
                          background: (po.status === "Approved" || po.status === "APPROVED") ? "#052e16" : "transparent",
                        }}
                        onClick={() => handleApprove(po)}
                        title={po.status === "Approved" || po.status === "APPROVED" ? "Already approved" : "Approve"}
                      >
                        <i className="ri-checkbox-circle-line" />
                      </span>

                      {/* CREATE GRN / VIEW GRN */}
                      {po.grn ? (
                        <span style={actionStyle} title="View GRN" onClick={() => viewGrn(po.grn)}>
                          <i className="ri-inbox-line" />
                        </span>
                      ) : (
                        <span style={actionStyle} title="Create GRN" onClick={() => openCreateGrn(po)}>
                          <i className="ri-add-box-line" />
                        </span>
                      )}

                      {/* DELETE */}
                      <span style={actionStyle} onClick={() => handleDelete(po)} title="Delete">
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

      {/* Modal: Create / Edit PO */}
      {showForm && (
        <div className="sa-modal-backdrop" onClick={() => !saving && (setShowForm(false), setEditingPoId(null))}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingPoId ? "Edit PO" : "Create PO"}</h3>
            <p className="sa-modal-sub">Create or edit a purchase order.</p>

            <form className="sa-modal-form" onSubmit={handleSubmit}>
              <label>
                Approved Requisition (optional)
                <select
                  name="requisitionId"
                  value={form.requisitionId || ""}
                  onChange={(e) => onSelectRequisition(e.target.value)}
                >
                  <option value="">-- Select Approved Requisition --</option>
                  {requisitions.map((r) => (
                    <option key={r._id || r.id} value={r._id || r.id}>
                      {r.requisitionNo || (r._id || r.id)} — {r.resortName || r.resort || "-"} — {r.date?.slice(0, 10) || "-"}
                    </option>
                  ))}
                </select>
                <small style={{ display: "block", color: "#6b7280", marginTop: 6 }}>
                  Only approved requisitions that don't already have PO/GRN are listed.
                </small>
              </label>

              <label>
                PO No.
                <input name="poNo" value={form.poNo || ""} onChange={updateForm} placeholder="PO-YYYY-XXX" />
              </label>

              <label>
                Vendor
                <select name="vendor" value={form.vendor || ""} onChange={updateForm} required>
                  <option value="">-- Select Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v._id || v.id} value={v._id || v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Resort
                <select name="resort" value={form.resort || ""} onChange={updateForm} required>
                  <option value="">-- Select Resort --</option>
                  {resorts.map((r) => (
                    <option key={r._id || r.id} value={r._id || r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Delivery Store
                <select name="store" value={form.store || ""} onChange={updateForm} required>
                  <option value="">-- Select Store --</option>
                  {stores.filter((s) => !form.resort || s.resort === form.resort).map((s) => (
                    <option key={s._id || s.id} value={s._1d || s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                PO Date
                <input type="date" name="poDate" value={form.poDate} onChange={updateForm} required />
              </label>

              {/* Item lines table */}
              <div style={{ marginTop: 10 }}>
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {form.lines.map((ln, idx) => (
                      <tr key={ln.lineId}>
                        <td>
                          <select value={ln.item || ""} onChange={(e) => updateLine(idx, "item", e.target.value)} required>
                            <option value="">-- Select Item --</option>
                            {items.map((it) => (
                              <option key={it._id || it.id} value={it._id || it.id}>
                                {it.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <input type="number" min="1" value={ln.qty} onChange={(e) => updateLine(idx, "qty", e.target.value)} required />
                        </td>

                        <td>
                          <input type="number" min="0" value={ln.rate} onChange={(e) => updateLine(idx, "rate", e.target.value)} required />
                        </td>

                        <td style={{ textAlign: "center" }}>{ln.amount}</td>

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
                <button type="button" className="sa-secondary-button" onClick={() => !saving && (setShowForm(false), setEditingPoId(null))}>
                  Cancel
                </button>

                <button type="submit" className="sa-primary-button" disabled={saving}>
                  {saving ? "Saving..." : editingPoId ? "Update PO" : "Save PO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRN Modal */}
      {grnModal.open && (
        <div className="sa-modal-backdrop" onClick={() => !saving && setGrnModal({ open: false, po: null, grnNo: "", receivedBy: "", receivedDate: new Date().toISOString().slice(0, 10), notes: "" })}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create GRN</h3>
            <p className="sa-modal-sub">Create GRN for PO: {grnModal.po?.poNo || grnModal.po?.po_number || grnModal.po?._id}</p>

            <div className="sa-modal-form">
              <label>
                GRN No.
                <input value={grnModal.grnNo} onChange={(e) => setGrnModal((p) => ({ ...p, grnNo: e.target.value }))} />
              </label>

              <label>
                Received By
                <input value={grnModal.receivedBy} onChange={(e) => setGrnModal((p) => ({ ...p, receivedBy: e.target.value }))} />
              </label>

              <label>
                Received Date
                <input type="date" value={grnModal.receivedDate} onChange={(e) => setGrnModal((p) => ({ ...p, receivedDate: e.target.value }))} />
              </label>

              <label>
                Notes (optional)
                <textarea value={grnModal.notes} onChange={(e) => setGrnModal((p) => ({ ...p, notes: e.target.value }))} />
              </label>

              <div className="sa-modal-actions">
                <button type="button" className="sa-secondary-button" onClick={() => setGrnModal({ open: false, po: null, grnNo: "", receivedBy: "", receivedDate: new Date().toISOString().slice(0, 10), notes: "" })}>
                  Cancel
                </button>
                <button type="button" className="sa-primary-button" onClick={submitCreateGrn} disabled={saving}>
                  {saving ? "Creating..." : "Create GRN"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* small inline style for action hover (optional) */}
      <style>{`
        td .action-btn .tooltip { display:none; }
        td .action-btn:hover .tooltip { display:block; }
      `}</style>
    </div>
  );
};

export default POList;
