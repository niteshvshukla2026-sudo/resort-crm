// src/pages/superAdmin/RequisitionList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// row template
const line = () => ({
  lineId: `ln_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  item: "",
  qty: 1,
  remark: "",
});

// --- SAMPLE DATA (5 sample requisitions) ---
const DEV_SAMPLES = [
  {
    _id: "sample_req_1",
    requisitionNo: "REQ-2025-001",
    type: "INTERNAL",
    resort: "Resort A",
    department: "Dept F&B",
    store: "Store Cold",
    vendor: null,
    status: "PENDING",
    date: new Date().toISOString(),
  },
  {
    _id: "sample_req_2",
    requisitionNo: "REQ-2025-002",
    type: "VENDOR",
    resort: "Resort A",
    department: null,
    store: "Store Main",
    vendor: "FreshFoods Pvt Ltd",
    status: "PENDING",
    date: new Date().toISOString(),
  },
  {
    _id: "sample_req_3",
    requisitionNo: "REQ-2025-003",
    type: "INTERNAL",
    resort: "Resort B",
    department: "Housekeeping",
    store: "Store Linen",
    vendor: null,
    status: "APPROVED",
    date: new Date().toISOString(),
  },
  {
    _id: "sample_req_4",
    requisitionNo: "REQ-2025-004",
    type: "INTERNAL",
    resort: "Resort B",
    department: "Maintenance",
    store: "Store Tools",
    vendor: null,
    status: "PENDING",
    date: new Date().toISOString(),
  },
  {
    _id: "sample_req_5",
    requisitionNo: "REQ-2025-005",
    type: "VENDOR",
    resort: "Resort A",
    department: null,
    store: "Store Main",
    vendor: "Global Supplies",
    status: "PENDING",
    date: new Date().toISOString(),
  },
];

const RequisitionList = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // modal/form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // edit existing req id or null for create
  const [form, setForm] = useState({
    type: "INTERNAL",
    resort: "",
    department: "",
    fromStore: "",
    toStore: "",
    store: "",
    vendor: "",
    requiredBy: "",
    lines: [line()],
  });

  // PO modal
  const [poModal, setPoModal] = useState({
    open: false,
    req: null,
    poNo: "",
    vendor: "",
    notes: "",
  });

  // GRN modal
  const [grnModal, setGrnModal] = useState({
    open: false,
    req: null,
    grnNo: "",
    receivedBy: "",
    receivedDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  // FILTER STATES
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [resortFilter, setResortFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL"); // NeedsPO, NeedsGRN, HasPO, HasGRN
  const [searchText, setSearchText] = useState("");

  const navigate = useNavigate();

  // Load table and master data
  const loadData = async () => {
    try {
      setLoading(true);
      const [reqRes, resortRes, deptRes, storeRes, itemRes, vendorRes] =
        await Promise.all([
          axios.get(`${API_BASE}/api/requisitions`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/api/resorts`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/api/departments`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/api/stores`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/api/items`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/api/vendors`).catch(() => ({ data: [] })),
        ]);

      const serverReqs = Array.isArray(reqRes.data) ? reqRes.data : [];
      const existingIds = new Set(serverReqs.map((r) => r._id));
      const samplesToAdd = DEV_SAMPLES.filter((s) => !existingIds.has(s._id));
      setRequisitions([...serverReqs, ...samplesToAdd]);

      setResorts(Array.isArray(resortRes.data) ? resortRes.data : []);
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      setStores(Array.isArray(storeRes.data) ? storeRes.data : []);
      setItems(Array.isArray(itemRes.data) ? itemRes.data : []);
      setVendors(Array.isArray(vendorRes.data) ? vendorRes.data : []);
    } catch (err) {
      console.error("load error", err);
      setError(err.response?.data?.message || "Failed to load requisitions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // name helpers
  const getResortName = (resortRef) => {
    if (!resortRef) return "-";
    const r = resorts.find(
      (x) =>
        x._id === resortRef || x.id === resortRef || x.name === resortRef
    );
    return r ? r.name : resortRef;
  };
  const getDepartmentName = (deptRef) => {
    if (!deptRef) return "-";
    const d = departments.find(
      (x) =>
        x._id === deptRef || x.id === deptRef || x.name === deptRef
    );
    return d ? d.name : deptRef;
  };
  const getStoreName = (storeRef) => {
    if (!storeRef) return "-";
    const s = stores.find(
      (x) =>
        x._id === storeRef || x.id === storeRef || x.name === storeRef
    );
    return s ? s.name : storeRef;
  };
  const getVendorName = (vendorRef) => {
    if (!vendorRef) return "-";
    const v = vendors.find(
      (x) =>
        x._id === vendorRef || x.id === vendorRef || x.name === vendorRef
    );
    return v ? v.name : vendorRef;
  };

  // --------- FORM helpers (create/edit/duplicate) ----------

  const baseEmptyForm = {
    type: "INTERNAL",
    resort: "",
    department: "",
    fromStore: "",
    toStore: "",
    store: "",
    vendor: "",
    requiredBy: "",
    lines: [line()],
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(baseEmptyForm);
    setError("");
    setShowForm(true);
  };

  const openCreateVendorForm = () => {
    setEditingId(null);
    setForm({
      ...baseEmptyForm,
      type: "VENDOR",
    });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (req) => {
    const isInternal = (req.type || "INTERNAL") === "INTERNAL";

    setEditingId(req._id);
    setForm({
      type: req.type || "INTERNAL",
      resort: req.resort || "",
      department: req.department || "",
      fromStore: isInternal ? req.fromStore || "" : "",
      toStore: isInternal ? req.toStore || req.store || "" : "",
      store: !isInternal ? req.store || "" : "",
      vendor: !isInternal ? req.vendor || "" : "",
      requiredBy: req.requiredBy ? req.requiredBy.slice(0, 10) : "",
      lines:
        (req.lines &&
          req.lines.length > 0 &&
          req.lines.map((ln) => ({
            lineId: ln.lineId || `ln_${Math.floor(Math.random() * 100000)}`,
            item: ln.item?._id || ln.item || "",
            qty: ln.qty || 1,
            remark: ln.remark || "",
          }))) || [line()],
    });
    setError("");
    setShowForm(true);
  };

  const openDuplicateAsCreate = (req) => {
    const isInternal = (req.type || "INTERNAL") === "INTERNAL";
    setEditingId(null);
    setForm({
      type: req.type || "INTERNAL",
      resort: req.resort || "",
      department: req.department || "",
      fromStore: isInternal ? req.fromStore || "" : "",
      toStore: isInternal ? req.toStore || req.store || "" : "",
      store: !isInternal ? req.store || "" : "",
      vendor: !isInternal ? req.vendor || "" : "",
      requiredBy: req.requiredBy ? req.requiredBy.slice(0, 10) : "",
      lines:
        (req.lines &&
          req.lines.length > 0 &&
          req.lines.map((ln) => ({
            lineId: `dup_${Math.floor(Math.random() * 100000)}`,
            item: ln.item?._id || ln.item || "",
            qty: ln.qty || 1,
            remark: ln.remark || "",
          }))) || [line()],
    });
    setError("");
    setShowForm(true);
  };

  const updateForm = (e) => {
    const { name, value } = e.target;
    if (name === "type") {
      // switch type: reset store/vendor/department/fromStore/toStore
      setForm((p) => ({
        ...p,
        type: value,
        department: "",
        fromStore: "",
        toStore: "",
        store: "",
        vendor: "",
      }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const updateLine = (idx, field, value) => {
    setForm((p) => {
      const list = [...p.lines];
      list[idx][field] = value;
      return { ...p, lines: list };
    });
  };

  const addLine = () =>
    setForm((p) => ({ ...p, lines: [...p.lines, line()] }));
  const removeLine = (idx) =>
    setForm((p) => ({
      ...p,
      lines: p.lines.filter((_, i) => i !== idx),
    }));

  // ------------ Create / Edit submission -----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.type) return setError("Select requisition type");

    if (form.type === "INTERNAL") {
      if (!form.fromStore)
        return setError("Select From Store for internal requisition");
      if (!form.toStore)
        return setError("Select To Store for internal requisition");
    } else {
      if (!form.vendor) return setError("Select vendor for vendor requisition");
      if (!form.store)
        return setError("Select store to receive goods for vendor requisition");
    }

    if (!form.lines || form.lines.length === 0)
      return setError("Add at least one item");

    for (const ln of form.lines) {
      if (!ln.item) return setError("Each line must have an item selected");
      if (!ln.qty || Number(ln.qty) <= 0)
        return setError("Each line must have quantity > 0");
    }

    // derive resort from selected store (if possible)
    let derivedResort = form.resort || undefined;
    if (form.type === "INTERNAL") {
      const fromStoreObj = stores.find(
        (s) => (s._id || s.id) === form.fromStore
      );
      if (fromStoreObj?.resort) derivedResort = fromStoreObj.resort;
    } else {
      const storeObj = stores.find((s) => (s._id || s.id) === form.store);
      if (storeObj?.resort) derivedResort = storeObj.resort;
    }

    try {
      setSaving(true);
      const payload = {
        type: form.type,
        resort: derivedResort,
        // internal: fromStore/toStore; vendor: store + vendor
        fromStore: form.type === "INTERNAL" ? form.fromStore : undefined,
        toStore: form.type === "INTERNAL" ? form.toStore : undefined,
        department: undefined,
        vendor: form.type === "VENDOR" ? form.vendor || undefined : undefined,
        store:
          form.type === "VENDOR"
            ? form.store || undefined
            : form.toStore || undefined, // for compatibility, store = destination
        requiredBy: form.requiredBy || undefined,
        lines: form.lines.map((x) => ({
          item: x.item,
          qty: Number(x.qty),
          remark: x.remark,
        })),
      };

      let res;
      if (editingId) {
        res = await axios.put(
          `${API_BASE}/api/requisitions/${editingId}`,
          payload
        );
        setRequisitions((p) =>
          p.map((r) => (r._id === editingId ? res.data : r))
        );
      } else {
        res = await axios.post(`${API_BASE}/api/requisitions`, payload);
        setRequisitions((p) => [res.data, ...p]);
      }

      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      console.error("save requisition error", err);
      setError(
        err.response?.data?.message || "Failed to save requisition"
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (req) => {
    if (!window.confirm(`Delete requisition ${req.requisitionNo || req._id}?`))
      return;
    try {
      setRequisitions((p) => p.filter((r) => r._id !== req._id));
      await axios
        .delete(`${API_BASE}/api/requisitions/${req._id}`)
        .catch(() => {
          throw new Error("delete failed");
        });
    } catch (err) {
      console.error("delete error", err);
      setError(
        err.response?.data?.message || "Failed to delete requisition"
      );
      loadData();
    }
  };

  // Approve
  const handleApprove = async (req) => {
    if (req.status === "APPROVED") return;
    if (!window.confirm(`Approve requisition ${req.requisitionNo || req._id}?`))
      return;
    try {
      const res = await axios
        .post(`${API_BASE}/api/requisitions/${req._id}/approve`)
        .catch(() => null);
      if (res && res.data)
        setRequisitions((p) =>
          p.map((r) => (r._id === req._id ? res.data : r))
        );
      else
        setRequisitions((p) =>
          p.map((r) =>
            r._id === req._id ? { ...r, status: "APPROVED" } : r
          )
        );
    } catch (err) {
      console.error("approve error", err);
      setError(
        err.response?.data?.message || "Failed to approve requisition"
      );
    }
  };

  // Hold
  const handleHold = async (req) => {
    if (
      !window.confirm(`Put requisition ${req.requisitionNo || req._id} on hold?`)
    )
      return;
    try {
      const res = await axios
        .post(`${API_BASE}/api/requisitions/${req._id}/hold`)
        .catch(() => null);
      if (res && res.data)
        setRequisitions((p) =>
          p.map((r) => (r._id === req._id ? res.data : r))
        );
      else
        setRequisitions((p) =>
          p.map((r) =>
            r._id === req._id ? { ...r, status: "ON_HOLD" } : r
          )
        );
    } catch (err) {
      console.error("hold error", err);
      setError(
        err.response?.data?.message || "Failed to put requisition on hold"
      );
    }
  };

  // Reject
  const handleReject = async (req) => {
    const reason = window.prompt("Enter rejection reason (optional):", "");
    if (reason === null) return; // cancel
    try {
      const res = await axios
        .post(`${API_BASE}/api/requisitions/${req._id}/reject`, { reason })
        .catch(() => null);
      if (res && res.data)
        setRequisitions((p) =>
          p.map((r) => (r._id === req._id ? res.data : r))
        );
      else
        setRequisitions((p) =>
          p.map((r) =>
            r._id === req._id ? { ...r, status: "REJECTED" } : r
          )
        );
    } catch (err) {
      console.error("reject error", err);
      setError(
        err.response?.data?.message || "Failed to reject requisition"
      );
    }
  };

  // Create Purchase Order (open modal)
  const openCreatePO = (req) => {
    setPoModal({
      open: true,
      req,
      poNo: `PO-${Date.now()}`,
      vendor: req.vendor || "",
      notes: "",
    });
  };

  const submitCreatePO = async () => {
    const { req, poNo, vendor, notes } = poModal;
    if (!poNo) return setError("PO No. is required");
    try {
      setSaving(true);
      const payload = {
        poNo,
        vendor: vendor || undefined,
        notes: notes || undefined,
      };
      const res = await axios
        .post(`${API_BASE}/api/requisitions/${req._id}/create-po`, payload)
        .catch(() => null);

      if (res && res.data) {
        setRequisitions((p) =>
          p.map((r) => (r._id === req._id ? res.data : r))
        );
        const createdPo = res.data.po || {};
        const poIdOrNo = createdPo._id || createdPo.poNo || payload.poNo;
        navigate(`/super-admin/po/${poIdOrNo}`);
      } else {
        setRequisitions((p) =>
          p.map((r) =>
            r._id === req._id
              ? { ...r, status: "PO_CREATED", po: { poNo } }
              : r
          )
        );
        navigate(`/super-admin/po/${poNo}`);
      }

      setPoModal({
        open: false,
        req: null,
        poNo: "",
        vendor: "",
        notes: "",
      });
    } catch (err) {
      console.error("create po error", err);
      setError(err.response?.data?.message || "Failed to create PO");
    } finally {
      setSaving(false);
    }
  };

  // Create GRN (open modal)
  const openCreateGRN = (req) => {
    setGrnModal({
      open: true,
      req,
      grnNo: `GRN-${Date.now()}`,
      receivedBy: "",
      receivedDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  };

  const submitCreateGRN = async () => {
    const { req, grnNo, receivedBy, receivedDate, notes } = grnModal;
    if (!grnNo) return setError("GRN No. is required");
    try {
      setSaving(true);
      const payload = {
        grnNo,
        receivedBy: receivedBy || undefined,
        receivedDate,
        notes: notes || undefined,
      };
      const res = await axios
        .post(`${API_BASE}/api/requisitions/${req._id}/create-grn`, payload)
        .catch(() => null);

      if (res && res.data) {
        setRequisitions((p) =>
          p.map((r) => (r._id === req._id ? res.data : r))
        );
        const createdGrn = res.data.grn || {};
        const grnIdOrNo = createdGrn._id || createdGrn.grnNo || payload.grnNo;
        navigate(`/super-admin/grn/${grnIdOrNo}`);
      } else {
        setRequisitions((p) =>
          p.map((r) =>
            r._id === req._id
              ? { ...r, status: "GRN_CREATED", grn: { grnNo } }
              : r
          )
        );
        navigate(`/super-admin/grn/${grnNo}`);
      }

      setGrnModal({
        open: false,
        req: null,
        grnNo: "",
        receivedBy: "",
        receivedDate: new Date().toISOString().slice(0, 10),
        notes: "",
      });
    } catch (err) {
      console.error("create grn error", err);
      setError(err.response?.data?.message || "Failed to create GRN");
    } finally {
      setSaving(false);
    }
  };

  // View PO / GRN navigation helpers
  const viewPO = (po) => {
    if (!po) return;
    const idOrNo = po._id || po.poNo;
    if (!idOrNo) return;
    navigate(`/super-admin/po/${idOrNo}`);
  };

  const viewGRN = (grn) => {
    if (!grn) return;
    const idOrNo = grn._id || grn.grnNo;
    if (!idOrNo) return;
    navigate(`/super-admin/grn/${idOrNo}`);
  };

  // View requisition
  const handleView = (req) => {
    navigate(`/super-admin/requisition/${req._id}`);
  };

  // FILTERING LOGIC (client-side)
  const applyFilters = () => {
    return requisitions.filter((r) => {
      // STATUS
      if (statusFilter !== "ALL") {
        if (
          (r.status || "PENDING").toUpperCase() !==
          statusFilter.toUpperCase()
        )
          return false;
      }

      // TYPE
      if (typeFilter !== "ALL") {
        if (
          (r.type || "INTERNAL").toUpperCase() !==
          typeFilter.toUpperCase()
        )
          return false;
      }

      // RESORT
      if (resortFilter) {
        const val = r.resort || r.resortName || r.resortRef || r.resort;
        if (!val) return false;
        if (
          !String(val)
            .toLowerCase()
            .includes(String(resortFilter).toLowerCase())
        )
          return false;
      }

      // DATE RANGE
      if (dateFrom) {
        const rd = r.date ? new Date(r.date).setHours(0, 0, 0, 0) : null;
        const from = new Date(dateFrom).setHours(0, 0, 0, 0);
        if (!rd || rd < from) return false;
      }
      if (dateTo) {
        const rd = r.date ? new Date(r.date).setHours(0, 0, 0, 0) : null;
        const to = new Date(dateTo).setHours(0, 0, 0, 0);
        if (!rd || rd > to) return false;
      }

      // ACTION FILTER
      if (actionFilter !== "ALL") {
        const hasPO = !!r.po;
        const hasGRN = !!r.grn;
        if (actionFilter === "NeedsPO" && hasPO) return false;
        if (actionFilter === "NeedsGRN" && hasGRN) return false;
        if (actionFilter === "HasPO" && !hasPO) return false;
        if (actionFilter === "HasGRN" && !hasGRN) return false;
      }

      // SEARCH
      if (searchText && searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        const fields = [
          r.requisitionNo,
          r.department,
          r.store,
          r.vendor,
          r.resort,
        ];
        const joined = fields.filter(Boolean).join(" ").toLowerCase();
        if (!joined.includes(q)) return false;
      }

      return true;
    });
  };

  const filteredList = applyFilters();

  // Reset filters
  const clearFilters = () => {
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setResortFilter("");
    setDateFrom("");
    setDateTo("");
    setActionFilter("ALL");
    setSearchText("");
  };

  // small inline styles for action icons
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
        <div style={{ flex: 1 }}>
          <h2>Requisitions</h2>
          <p>Create and manage internal and vendor requisitions.</p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="sa-primary-button"
            type="button"
            onClick={openCreateForm}
          >
            <i className="ri-add-line"></i> New Internal Requisition
          </button>

          <button
            className="sa-secondary-button"
            type="button"
            onClick={openCreateVendorForm}
          >
            <i className="ri-add-line"></i> New Vendor Requisition
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
      <div
        className="sa-card"
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
      >
        <label style={{ fontSize: "0.85rem" }}>
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ marginLeft: 6 }}
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="REJECTED">Rejected</option>
            <option value="PO_CREATED">PO Created</option>
            <option value="GRN_CREATED">GRN Created</option>
          </select>
        </label>

        <label style={{ fontSize: "0.85rem" }}>
          Type
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ marginLeft: 6 }}
          >
            <option value="ALL">All</option>
            <option value="INTERNAL">Internal</option>
            <option value="VENDOR">Vendor</option>
          </select>
        </label>

        <label style={{ fontSize: "0.85rem" }}>
          Resort
          <select
            value={resortFilter}
            onChange={(e) => setResortFilter(e.target.value)}
            style={{ marginLeft: 6 }}
          >
            <option value="">All Resorts</option>
            {resorts.length > 0
              ? resorts.map((r) => (
                  <option key={r._id || r.id} value={r._id || r.name || r.id}>
                    {r.name}
                  </option>
                ))
              : Array.from(new Set(requisitions.map((x) => x.resort))).map(
                  (name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  )
                )}
          </select>
        </label>

        <label style={{ fontSize: "0.85rem" }}>
          Date from
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ marginLeft: 6 }}
          />
        </label>

        <label style={{ fontSize: "0.85rem" }}>
          Date to
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ marginLeft: 6 }}
          />
        </label>

        <label style={{ fontSize: "0.85rem" }}>
          Action
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ marginLeft: 6 }}
          >
            <option value="ALL">All</option>
            <option value="NeedsPO">Needs PO</option>
            <option value="NeedsGRN">Needs GRN</option>
            <option value="HasPO">Has PO</option>
            <option value="HasGRN">Has GRN</option>
          </select>
        </label>

        <label style={{ flex: 1, minWidth: 220 }}>
          Search
          <input
            placeholder="Requisition no / dept / store / vendor"
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

      {/* Error */}
      {error && <div className="sa-modal-error">{error}</div>}

      {/* LIST */}
      <div className="sa-card">
        {loading ? (
          <div>Loading requisitions...</div>
        ) : (
          <>
            <div
              style={{
                marginBottom: 8,
                color: "#6b7280",
                fontSize: "0.9rem",
              }}
            >
              Showing {filteredList.length} of {requisitions.length} requisitions
            </div>

            <table className="sa-table">
              <thead>
                <tr>
                  <th>Requisition No.</th>
                  <th>Type</th>
                  <th>Resort</th>
                  <th>Dept / Store / Vendor</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredList.map((r) => (
                  <tr key={r._id}>
                    <td>{r.requisitionNo || r._id}</td>
                    <td>{r.type || "INTERNAL"}</td>
                    <td>{getResortName(r.resort)}</td>
                    <td>
                      {r.type === "VENDOR" ? (
                        <>
                          {getVendorName(r.vendor)}
                          {r.store ? ` → ${getStoreName(r.store)}` : ""}
                        </>
                      ) : r.fromStore || r.toStore ? (
                        <>
                          {getStoreName(r.fromStore)} →{" "}
                          {getStoreName(r.toStore || r.store)}
                        </>
                      ) : getDepartmentName(r.department) !== "-" ? (
                        getDepartmentName(r.department)
                      ) : (
                        getStoreName(r.store)
                      )}
                    </td>
                    <td>{r.status || "PENDING"}</td>
                    <td>{r.date ? r.date.slice(0, 10) : "-"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {/* VIEW */}
                      <span
                        style={actionStyle}
                        onClick={() => handleView(r)}
                        title="View"
                      >
                        <i className="ri-eye-line" />
                      </span>

                      {/* DUPLICATE */}
                      <span
                        style={actionStyle}
                        onClick={() => openDuplicateAsCreate(r)}
                        title="Create (Duplicate)"
                      >
                        <i className="ri-file-copy-line" />
                      </span>

                      {/* EDIT */}
                      <span
                        style={actionStyle}
                        onClick={() => openEditForm(r)}
                        title="Edit"
                      >
                        <i className="ri-edit-line" />
                      </span>

                      {/* APPROVE */}
                      <span
                        style={{
                          ...actionStyle,
                          background:
                            r.status === "APPROVED"
                              ? "#052e16"
                              : "transparent",
                        }}
                        onClick={() => handleApprove(r)}
                        title={
                          r.status === "APPROVED"
                            ? "Already approved"
                            : "Approve"
                        }
                      >
                        <i className="ri-checkbox-circle-line" />
                      </span>

                      {/* HOLD */}
                      <span
                        style={actionStyle}
                        onClick={() => handleHold(r)}
                        title="Hold"
                      >
                        <i className="ri-pause-line" />
                      </span>

                      {/* REJECT */}
                      <span
                        style={actionStyle}
                        onClick={() => handleReject(r)}
                        title="Reject"
                      >
                        <i className="ri-close-circle-line" />
                      </span>

                      {/* CREATE PO / VIEW PO */}
                      {r.po ? (
                        <span
                          style={actionStyle}
                          title="View PO"
                          onClick={() => viewPO(r.po)}
                        >
                          <i className="ri-file-paper-line" />
                        </span>
                      ) : (
                        !r.grn && (
                          <span
                            style={actionStyle}
                            onClick={() => openCreatePO(r)}
                            title="Create Purchase Order (PO)"
                          >
                            <i className="ri-shopping-cart-line" />
                          </span>
                        )
                      )}

                      {/* CREATE GRN / VIEW GRN */}
                      {r.grn ? (
                        <span
                          style={actionStyle}
                          title="View GRN"
                          onClick={() => viewGRN(r.grn)}
                        >
                          <i className="ri-inbox-line" />
                        </span>
                      ) : (
                        !r.po && (
                          <span
                            style={actionStyle}
                            onClick={() => openCreateGRN(r)}
                            title="Create GRN"
                          >
                            <i className="ri-add-box-line" />
                          </span>
                        )
                      )}

                      {/* DELETE */}
                      <span
                        style={actionStyle}
                        onClick={() => handleDelete(r)}
                        title="Delete"
                      >
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

      {/* MODAL (Create/Edit) */}
      {showForm && (
        <div
          className="sa-modal-backdrop"
          onClick={() => !saving && setShowForm(false)}
        >
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? "Edit Requisition" : "Create Requisition"}</h3>
            <p className="sa-modal-sub">
              Fill the following details to raise a requisition.
            </p>

            <form className="sa-modal-form" onSubmit={handleSubmit}>
              <label>
                Requisition Type
                <select
                  name="type"
                  value={form.type}
                  onChange={updateForm}
                  required
                >
                  <option value="INTERNAL">
                    Internal (Store → Store transfer)
                  </option>
                  <option value="VENDOR">
                    Vendor (Direct purchase from vendor)
                  </option>
                </select>
              </label>

              {form.type === "INTERNAL" ? (
                <>
                  <label>
                    From Store
                    <select
                      name="fromStore"
                      value={form.fromStore}
                      onChange={updateForm}
                      required
                    >
                      <option value="">-- Select From Store --</option>
                      {stores.map((s) => (
                        <option key={s._id || s.id} value={s._id || s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    To Store
                    <select
                      name="toStore"
                      value={form.toStore}
                      onChange={updateForm}
                      required
                    >
                      <option value="">-- Select To Store --</option>
                      {stores.map((s) => (
                        <option key={s._id || s.id} value={s._id || s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Vendor
                    <select
                      name="vendor"
                      value={form.vendor}
                      onChange={updateForm}
                      required
                    >
                      <option value="">-- Select Vendor --</option>
                      {vendors.map((v) => (
                        <option key={v._id || v.id} value={v._id || v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Store (to receive goods)
                    <select
                      name="store"
                      value={form.store}
                      onChange={updateForm}
                      required
                    >
                      <option value="">-- Select Store --</option>
                      {stores.map((s) => (
                        <option key={s._id || s.id} value={s._id || s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              <label>
                Required On
                <input
                  type="date"
                  name="requiredBy"
                  value={form.requiredBy}
                  onChange={updateForm}
                />
              </label>

              {/* ITEMS TABLE */}
              <div style={{ marginTop: 10 }}>
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Current Stock</th>
                      <th>Qty</th>
                      <th>Remark</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {form.lines.map((ln, idx) => (
                      <tr key={ln.lineId}>
                        <td>
                          <select
                            value={ln.item}
                            onChange={(e) =>
                              updateLine(idx, "item", e.target.value)
                            }
                            required
                          >
                            <option value="">-- Select Item --</option>
                            {items.map((it) => (
                              <option
                                key={it._id || it.id}
                                value={it._id || it.id}
                              >
                                {it.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td style={{ textAlign: "center" }}>
                          {(() => {
                            const it = items.find(
                              (x) =>
                                x._id === ln.item || x.id === ln.item
                            );
                            if (!it) return "-";

                            const stockMap = it.stockByStore || {};
                            const sourceStoreId =
                              form.type === "INTERNAL"
                                ? form.fromStore
                                : form.store;

                            if (sourceStoreId)
                              return stockMap[sourceStoreId] ?? "-";

                            const anyStock = Object.values(stockMap)[0];
                            return anyStock ?? "-";
                          })()}
                        </td>

                        <td>
                          <input
                            type="number"
                            min="1"
                            value={ln.qty}
                            onChange={(e) =>
                              updateLine(idx, "qty", e.target.value)
                            }
                            required
                          />
                        </td>

                        <td>
                          <input
                            value={ln.remark}
                            onChange={(e) =>
                              updateLine(idx, "remark", e.target.value)
                            }
                          />
                        </td>

                        <td>
                          {form.lines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLine(idx)}
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button
                  type="button"
                  onClick={addLine}
                  style={{ marginTop: 5 }}
                >
                  + Add Line
                </button>
              </div>

              {error && <div className="sa-modal-error">{error}</div>}

              <div className="sa-modal-actions">
                <button
                  type="button"
                  className="sa-secondary-button"
                  onClick={() => !saving && setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="sa-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Requisition"
                    : "Save Requisition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO Modal */}
      {poModal.open && (
        <div
          className="sa-modal-backdrop"
          onClick={() =>
            !saving &&
            setPoModal({
              open: false,
              req: null,
              poNo: "",
              vendor: "",
              notes: "",
            })
          }
        >
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create Purchase Order</h3>
            <p className="sa-modal-sub">
              Create PO from this requisition.
            </p>

            <div className="sa-modal-form">
              <label>
                PO No.
                <input
                  value={poModal.poNo}
                  onChange={(e) =>
                    setPoModal((p) => ({ ...p, poNo: e.target.value }))
                  }
                />
              </label>

              <label>
                Vendor
                <input
                  value={poModal.vendor}
                  onChange={(e) =>
                    setPoModal((p) => ({ ...p, vendor: e.target.value }))
                  }
                />
              </label>

              <label>
                Notes (optional)
                <textarea
                  value={poModal.notes}
                  onChange={(e) =>
                    setPoModal((p) => ({ ...p, notes: e.target.value }))
                  }
                />
              </label>

              <div className="sa-modal-actions">
                <button
                  type="button"
                  className="sa-secondary-button"
                  onClick={() =>
                    setPoModal({
                      open: false,
                      req: null,
                      poNo: "",
                      vendor: "",
                      notes: "",
                    })
                  }
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="sa-primary-button"
                  onClick={submitCreatePO}
                  disabled={saving}
                >
                  {saving ? "Creating..." : "Create PO"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRN Modal */}
      {grnModal.open && (
        <div
          className="sa-modal-backdrop"
          onClick={() =>
            !saving &&
            setGrnModal({
              open: false,
              req: null,
              grnNo: "",
              receivedBy: "",
              receivedDate: new Date().toISOString().slice(0, 10),
              notes: "",
            })
          }
        >
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create GRN</h3>
            <p className="sa-modal-sub">
              Record goods received against PO / requisition.
            </p>

            <div className="sa-modal-form">
              <label>
                GRN No.
                <input
                  value={grnModal.grnNo}
                  onChange={(e) =>
                    setGrnModal((p) => ({ ...p, grnNo: e.target.value }))
                  }
                />
              </label>

              <label>
                Received By
                <input
                  value={grnModal.receivedBy}
                  onChange={(e) =>
                    setGrnModal((p) => ({ ...p, receivedBy: e.target.value }))
                  }
                />
              </label>

              <label>
                Received Date
                <input
                  type="date"
                  value={grnModal.receivedDate}
                  onChange={(e) =>
                    setGrnModal((p) => ({
                      ...p,
                      receivedDate: e.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Notes (optional)
                <textarea
                  value={grnModal.notes}
                  onChange={(e) =>
                    setGrnModal((p) => ({ ...p, notes: e.target.value }))
                  }
                />
              </label>

              <div className="sa-modal-actions">
                <button
                  type="button"
                  className="sa-secondary-button"
                  onClick={() =>
                    setGrnModal({
                      open: false,
                      req: null,
                      grnNo: "",
                      receivedBy: "",
                      receivedDate: new Date().toISOString().slice(0, 10),
                      notes: "",
                    })
                  }
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="sa-primary-button"
                  onClick={submitCreateGRN}
                  disabled={saving}
                >
                  {saving ? "Creating..." : "Create GRN"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        td .action-btn .tooltip { display:none; }
        td .action-btn:hover .tooltip { display:block; }
      `}</style>
    </div>
  );
};

export default RequisitionList;
