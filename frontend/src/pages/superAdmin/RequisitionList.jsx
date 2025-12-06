// src/pages/superAdmin/RequisitionList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE =
  (import.meta.env.VITE_API_BASE || "http://localhost:5000") + "/api/v1";

// helper to create a new line
const newLine = () => ({
  lineId: `ln_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  item: "",
  qty: 1,
  remark: "",
});

// Dev fallback data (minimal)
const DEV_SAMPLES = [
  {
    _id: "sample_req_1",
    requisitionNo: "REQ-2025-001",
    type: "INTERNAL",
    resort: "Demo Resort A",
    fromStore: "Main Store",
    toStore: "Cold Store",
    vendor: null,
    status: "PENDING",
    date: new Date().toISOString(),
    lines: [
      { lineId: "ln1", item: "dev_item_1", qty: 10, remark: "" },
      { lineId: "ln2", item: "dev_item_2", qty: 5, remark: "" },
    ],
  },
  {
    _id: "sample_req_2",
    requisitionNo: "REQ-2025-002",
    type: "VENDOR",
    resort: "Demo Resort A",
    department: null,
    store: "Main Store",
    vendor: "dev_vendor_1",
    status: "PENDING",
    date: new Date().toISOString(),
    lines: [{ lineId: "ln3", item: "dev_item_3", qty: 2, remark: "urgent" }],
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

  // Requisition form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    type: "INTERNAL",
    resort: "",
    department: "",
    fromStore: "",
    toStore: "",
    store: "",
    vendor: "",
    requiredBy: "",
    lines: [newLine()],
  });

  // PO modal state (items auto from requisition; vendor/resort/store derived)
  const [poModal, setPoModal] = useState({
    open: false,
    req: null,
    poNo: "",
    poDate: new Date().toISOString().slice(0, 10),
    items: [],
    subTotal: 0,
    taxPercent: 0,
    taxAmount: 0,
    total: 0,
  });

  // GRN modal state (matches PO approach — items auto from requisition)
  const [grnModal, setGrnModal] = useState({
    open: false,
    req: null,
    grnNo: "",
    receivedBy: "",
    receivedDate: new Date().toISOString().slice(0, 10),
    items: [], // { lineId, item, itemName, qtyRequested, qtyReceived, remark }
  });

  // filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [resortFilter, setResortFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [searchText, setSearchText] = useState("");

  const navigate = useNavigate();

  // load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [reqRes, resortRes, deptRes, storeRes, itemRes, vendorRes] =
        await Promise.all([
          axios.get(`${API_BASE}/requisitions`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/resorts`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/departments`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/stores`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/items`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/vendors`).catch(() => ({ data: [] })),
        ]);

      const serverReqs = Array.isArray(reqRes.data) ? reqRes.data : [];
      const existingReqIds = new Set(serverReqs.map((r) => r._id));
      const samplesToAdd = DEV_SAMPLES.filter((s) => !existingReqIds.has(s._id));
      setRequisitions([...serverReqs, ...samplesToAdd]);

      setResorts(Array.isArray(resortRes.data) ? resortRes.data : []);
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      setStores(Array.isArray(storeRes.data) ? storeRes.data : []);
      setItems(Array.isArray(itemRes.data) ? itemRes.data : []);
      setVendors(Array.isArray(vendorRes.data) ? vendorRes.data : []);
    } catch (err) {
      console.error("load error", err);
      setError("Failed to load requisitions. Using demo data.");
      setResorts([]);
      setDepartments([]);
      setStores([]);
      setItems([]);
      setVendors([]);
      setRequisitions(DEV_SAMPLES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  // lookup helpers
  const lookupName = (list, ref) => {
    if (!ref) return "-";
    const found = list.find(
      (x) =>
        x._id === ref || x.id === ref || x.name === ref || x.code === ref
    );
    return found ? found.name || found.code || ref : ref;
  };
  const getResortName = (r) => lookupName(resorts, r);
  const getDepartmentName = (d) => lookupName(departments, d);
  const getStoreName = (s) => lookupName(stores, s);
  const getVendorName = (v) => lookupName(vendors, v);
  const getItemName = (itId) => lookupName(items, itId);

  // Requisition form helpers
  const baseEmptyForm = {
    type: "INTERNAL",
    resort: "",
    department: "",
    fromStore: "",
    toStore: "",
    store: "",
    vendor: "",
    requiredBy: "",
    lines: [newLine()],
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(baseEmptyForm);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (req) => {
    setEditingId(req._id);
    setForm({
      type: req.type || "INTERNAL",
      resort: req.resort || "",
      department: req.department || "",
      fromStore: req.fromStore || "",
      toStore: req.toStore || req.store || "",
      store: req.store || "",
      vendor: req.vendor || "",
      requiredBy: req.requiredBy ? req.requiredBy.slice(0, 10) : "",
      lines:
        (req.lines &&
          req.lines.length > 0 &&
          req.lines.map((ln) => ({
            lineId: ln.lineId || `ln_${Math.floor(Math.random() * 100000)}`,
            item: ln.item?._id || ln.item || "",
            qty: ln.qty || 1,
            remark: ln.remark || "",
          }))) ||
        [newLine()],
    });
    setError("");
    setShowForm(true);
  };

  const openDuplicateAsCreate = (req) => {
    setEditingId(null);
    setForm({
      type: req.type || "INTERNAL",
      resort: req.resort || "",
      department: req.department || "",
      fromStore: req.fromStore || "",
      toStore: req.toStore || req.store || "",
      store: req.store || "",
      vendor: req.vendor || "",
      requiredBy: req.requiredBy ? req.requiredBy.slice(0, 10) : "",
      lines:
        (req.lines &&
          req.lines.length > 0 &&
          req.lines.map((ln) => ({
            lineId: `dup_${Math.floor(Math.random() * 100000)}`,
            item: ln.item?._id || ln.item || "",
            qty: ln.qty || 1,
            remark: ln.remark || "",
          }))) ||
        [newLine()],
    });
    setError("");
    setShowForm(true);
  };

  const updateForm = (e) => {
    const { name, value } = e.target;
    if (name === "type") {
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
    setForm((p) => ({ ...p, lines: [...p.lines, newLine()] }));
  const removeLine = (idx) =>
    setForm((p) => ({ ...p, lines: p.lines.filter((_, i) => i !== idx) }));

  // create/update requisition
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
      if (!form.vendor)
        return setError("Select vendor for vendor requisition");
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

    // derive resort from selected store if not selected
    let derivedResort = form.resort || undefined;
    if (form.type === "INTERNAL") {
      const from = stores.find((s) => (s._id || s.id) === form.fromStore);
      if (from?.resort) derivedResort = from.resort;
    } else {
      const st = stores.find((s) => (s._id || s.id) === form.store);
      if (st?.resort) derivedResort = st.resort;
    }

    try {
      setSaving(true);
      const payload = {
        type: form.type,
        resort: derivedResort,
        fromStore: form.type === "INTERNAL" ? form.fromStore : undefined,
        toStore: form.type === "INTERNAL" ? form.toStore : undefined,
        department: form.department || undefined,
        vendor:
          form.type === "VENDOR" ? form.vendor || undefined : undefined,
        store:
          form.type === "VENDOR"
            ? form.store || undefined
            : form.toStore || undefined,
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
          `${API_BASE}/requisitions/${editingId}`,
          payload
        );
        setRequisitions((p) =>
          p.map((r) => (r._id === editingId ? res.data : r))
        );
      } else {
        res = await axios.post(`${API_BASE}/requisitions`, payload);
        setRequisitions((p) => [res.data, ...p]);
      }

      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      console.error("save requisition error", err);
      setError(err.response?.data?.message || "Failed to save requisition");
    } finally {
      setSaving(false);
    }
  };

  // delete
  const handleDelete = async (req) => {
    if (!window.confirm(`Delete requisition ${req.requisitionNo || req._id}?`))
      return;
    try {
      setRequisitions((p) => p.filter((r) => r._id !== req._id));
      await axios.delete(`${API_BASE}/requisitions/${req._id}`);
    } catch (err) {
      console.error("delete error", err);
      setError(err.response?.data?.message || "Failed to delete requisition");
      loadData();
    }
  };

  // approve / hold / reject
  const handleApprove = async (req) => {
    if (req.status === "APPROVED") return;
    if (!window.confirm(`Approve requisition ${req.requisitionNo || req._id}?`))
      return;
    try {
      const res = await axios.post(
        `${API_BASE}/requisitions/${req._id}/approve`
      );
      if (res?.data)
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
      setError(err.response?.data?.message || "Failed to approve requisition");
    }
  };

  const handleHold = async (req) => {
    if (
      !window.confirm(`Put requisition ${req.requisitionNo || req._id} on hold?`)
    )
      return;
    try {
      const res = await axios.post(
        `${API_BASE}/requisitions/${req._id}/hold`
      );
      if (res?.data)
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
      setError(err.response?.data?.message || "Failed to put requisition on hold");
    }
  };

  const handleReject = async (req) => {
    const reason = window.prompt("Enter rejection reason (optional):", "");
    if (reason === null) return;
    try {
      const res = await axios.post(
        `${API_BASE}/requisitions/${req._id}/reject`,
        { reason }
      );
      if (res?.data)
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
      setError(err.response?.data?.message || "Failed to reject requisition");
    }
  };

  // ------------------ PO modal ------------------
  const openCreatePO = (req) => {
    const isVendor =
      (req.type || "INTERNAL").toUpperCase() === "VENDOR";
    const status = (req.status || "PENDING").toUpperCase();

    // Only vendor requisition + must be approved
    if (!isVendor) {
      setError("PO can be created only for Vendor requisitions.");
      return;
    }
    if (status !== "APPROVED") {
      setError("Approve the requisition before creating a PO.");
      return;
    }

    // map requisition lines to PO item rows
    const itemsPayload = (req.lines || []).map((ln) => {
      const itemId = ln.item?._id || ln.item;
      const itemObj = items.find((it) => (it._id || it.id) === itemId);
      const rate =
        ln.expectedRate || ln.rate || itemObj?.indicativePrice || 0;
      const name =
        (ln.item && ln.item.name) || (itemObj ? itemObj.name : "");
      const qtyVal = ln.qty || 0;
      return {
        lineId: ln.lineId || `ln_${Math.floor(Math.random() * 100000)}`,
        item: itemId,
        itemName: name,
        qty: qtyVal,
        rate,
        amount: Number((qtyVal * rate).toFixed(2)),
        remark: ln.remark || "",
      };
    });

    const sub = itemsPayload.reduce((s, i) => s + Number(i.amount || 0), 0);

    setPoModal({
      open: true,
      req,
      poNo: `PO-${Date.now()}`,
      poDate: new Date().toISOString().slice(0, 10),
      items: itemsPayload,
      subTotal: sub,
      taxPercent: 0,
      taxAmount: 0,
      total: sub,
    });
  };

  const submitCreatePO = async () => {
    const { req, poNo, items: poItems, poDate, taxPercent } = poModal;
    if (!poNo) return setError("PO No. is required");

    const vendorId = req.vendor || undefined;
    const deliverTo = req.toStore || req.store || undefined;
    const resortId = req.resort || undefined;

    if (!vendorId)
      return setError(
        "Requisition has no vendor assigned (cannot create PO)"
      );
    if (!deliverTo)
      return setError(
        "Requisition has no destination store (cannot create PO)"
      );
    if (!poItems || poItems.length === 0)
      return setError("PO must have at least one item");

    for (const it of poItems) {
      if (!it.item) return setError("Each PO line must have an item id");
      if (!it.qty || Number(it.qty) <= 0)
        return setError("Each PO line qty must be > 0");
      if (it.rate == null || Number(it.rate) < 0)
        return setError("Each PO line rate must be >= 0");
    }

    try {
      setSaving(true);
      const itemsPayload = poItems.map((it) => {
        const qty = Number(it.qty);
        const rate = Number(it.rate);
        const amount = qty * rate;
        return { item: it.item, qty, rate, amount, remark: it.remark || "" };
      });
      const subTotal = itemsPayload.reduce((s, i) => s + i.amount, 0);
      const taxAmt = Number(((taxPercent || 0) / 100) * subTotal);
      const total = subTotal + taxAmt;

      const payload = {
        poNo,
        vendor: vendorId,
        resort: resortId,
        deliverTo,
        poDate,
        items: itemsPayload,
        subTotal,
        taxPercent: taxPercent || 0,
        taxAmount: taxAmt,
        total,
      };

      const res = await axios.post(
        `${API_BASE}/requisitions/${req._id}/create-po`,
        payload
      );

      if (res?.data?.requisition) {
        setRequisitions((p) =>
          p.map((r) => (r._id === req._id ? res.data.requisition : r))
        );
        const createdPo = res.data.po;
        const poIdOrNo =
          (createdPo && (createdPo._id || createdPo.code)) || poNo;
        setPoModal({ open: false, req: null, poNo: "", items: [] });
        navigate(`/super-admin/po/${poIdOrNo}`);
      } else if (res?.data) {
        const createdPo = res.data;
        setRequisitions((p) =>
          p.map((r) =>
            r._id === req._id
              ? {
                  ...r,
                  status: "PO_CREATED",
                  po: { code: createdPo.code || poNo, _id: createdPo._id },
                }
              : r
          )
        );
        setPoModal({ open: false, req: null, poNo: "", items: [] });
        const poIdOrNo = createdPo._id || createdPo.code || poNo;
        navigate(`/super-admin/po/${poIdOrNo}`);
      } else {
        setRequisitions((p) =>
          p.map((r) =>
            r._id === req._id
              ? { ...r, status: "PO_CREATED", po: { poNo } }
              : r
          )
        );
        setPoModal({ open: false, req: null, poNo: "", items: [] });
        navigate(`/super-admin/po/${poNo}`);
      }
    } catch (err) {
      console.error("create po error", err);
      setError(err.response?.data?.message || "Failed to create PO");
    } finally {
      setSaving(false);
    }
  };

  // ------------------ GRN modal ------------------

  // Open GRN modal:
  //  - Only Vendor requisition
  //  - Must be approved
  //  - If PO exists => cannot create from requisition (must create from PO)
  const openCreateGRN = (req) => {
    const isVendor =
      (req.type || "INTERNAL").toUpperCase() === "VENDOR";
    const status = (req.status || "PENDING").toUpperCase();

    if (!isVendor) {
      setError("GRN can be created only for Vendor requisitions.");
      return;
    }

    if (req.po) {
      setError(
        "This requisition already has a PO — create GRN from the PO page."
      );
      return;
    }

    if (status !== "APPROVED") {
      setError("Approve the requisition before creating a GRN.");
      return;
    }

    // Map requisition lines to GRN rows
    const itemsPayload = (req.lines || []).map((ln) => {
      const itemId = ln.item?._id || ln.item;
      const itemObj = items.find((it) => (it._id || it.id) === itemId);
      const name =
        (ln.item && ln.item.name) || (itemObj ? itemObj.name : "");
      const qtyRequested = ln.qty || 0;
      return {
        lineId: ln.lineId || `ln_${Math.floor(Math.random() * 100000)}`,
        item: itemId,
        itemName: name,
        qtyRequested,
        qtyReceived: qtyRequested, // default full
        remark: ln.remark || "",
      };
    });

    setGrnModal({
      open: true,
      req,
      grnNo: `GRN-${Date.now()}`,
      receivedBy: "",
      receivedDate: new Date().toISOString().slice(0, 10),
      items: itemsPayload,
    });
  };

  // Update received qty / remark per line
  const updateGrnLine = (idx, field, value) => {
    setGrnModal((p) => {
      const list = [...(p.items || [])];
      list[idx] = { ...list[idx], [field]: value };
      return { ...p, items: list };
    });
  };

  // Submit GRN
  const submitCreateGRN = async () => {
    const { req, grnNo, receivedBy, receivedDate, items: grnItems } = grnModal;
    if (!grnNo) return setError("GRN No. is required");
    if (!grnItems || grnItems.length === 0)
      return setError("GRN must include at least one item");

    if (req.po)
      return setError(
        "PO exists for this requisition — create GRN from PO instead."
      );

    // validate items
    for (const it of grnItems) {
      if (!it.item) return setError("Each GRN line must have an item");
      if (it.qtyReceived == null || Number(it.qtyReceived) < 0)
        return setError("Each GRN line received qty must be >= 0");
    }

    try {
      setSaving(true);
      const itemsPayload = grnItems.map((it) => ({
        item: it.item,
        qtyRequested: Number(it.qtyRequested || 0),
        qtyReceived: Number(it.qtyReceived || 0),
        remark: it.remark || "",
      }));

      const payload = {
        grnNo,
        receivedBy: receivedBy || undefined,
        receivedDate,
        items: itemsPayload,
        store: req.toStore || req.store || undefined,
      };

      const res = await axios.post(
        `${API_BASE}/requisitions/${req._id}/create-grn`,
        payload
      );

      if (res?.data?.requisition) {
        setRequisitions((p) =>
          p.map((r) => (r._id === req._id ? res.data.requisition : r))
        );
        const createdGrn = res.data.grn || res.data;
        const grnIdOrNo =
          createdGrn?._id || createdGrn?.code || grnNo;
        setGrnModal({
          open: false,
          req: null,
          grnNo: "",
          receivedBy: "",
          receivedDate: new Date().toISOString().slice(0, 10),
          items: [],
        });
        navigate(`/super-admin/grn/${grnIdOrNo}`);
      } else {
        setRequisitions((p) =>
          p.map((r) =>
            r._id === req._id
              ? { ...r, status: "GRN_CREATED", grn: { grnNo } }
              : r
          )
        );
        setGrnModal({
          open: false,
          req: null,
          grnNo: "",
          receivedBy: "",
          receivedDate: new Date().toISOString().slice(0, 10),
          items: [],
        });
        navigate(`/super-admin/grn/${grnNo}`);
      }
    } catch (err) {
      console.error("create grn error", err);
      setError(err.response?.data?.message || "Failed to create GRN");
    } finally {
      setSaving(false);
    }
  };

  // navigation helpers
  const viewPO = (po) => {
    if (!po) return;
    const idOrNo = po._id || po.code;
    if (!idOrNo) return;
    navigate(`/super-admin/po/${idOrNo}`);
  };

  const viewGRN = (grn) => {
    if (!grn) return;
    const idOrNo = grn._id || grn.code;
    if (!idOrNo) return;
    navigate(`/super-admin/grn/${idOrNo}`);
  };

  const handleView = (req) => {
    navigate(`/super-admin/requisition/${req._id}`);
  };

  // current stock helper
  const renderCurrentStock = (ln) => {
    const it = items.find((x) => x._id === ln.item || x.id === ln.item);
    if (!it) return "-";
    const stockMap = it.stockByStore || {};
    const storeIds = Object.keys(stockMap);
    if (!storeIds.length) return "-";
    const rows = storeIds.map((id) => {
      const s = stores.find((st) => (st._id || st.id) === id);
      const name = s?.name || id;
      const qty = Number(stockMap[id] || 0);
      return { name, qty };
    });
    const total = rows.reduce((sum, r) => sum + r.qty, 0);
    const tooltip = rows.map((r) => `${r.name}: ${r.qty}`).join("\n");
    return (
      <span title={tooltip} style={{ cursor: "help" }}>
        {total}
      </span>
    );
  };

  // filtering
  const applyFilters = () => {
    return requisitions.filter((r) => {
      if (statusFilter !== "ALL") {
        if (
          (r.status || "PENDING").toUpperCase() !==
          statusFilter.toUpperCase()
        )
          return false;
      }
      if (typeFilter !== "ALL") {
        if (
          (r.type || "INTERNAL").toUpperCase() !==
          typeFilter.toUpperCase()
        )
          return false;
      }
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
      if (actionFilter !== "ALL") {
        const hasPO = !!r.po;
        const hasGRN = !!r.grn;
        if (actionFilter === "NeedsPO" && hasPO) return false;
        if (actionFilter === "NeedsGRN" && hasGRN) return false;
        if (actionFilter === "HasPO" && !hasPO) return false;
        if (actionFilter === "HasGRN" && !hasGRN) return false;
      }
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
  const clearFilters = () => {
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setResortFilter("");
    setDateFrom("");
    setDateTo("");
    setActionFilter("ALL");
    setSearchText("");
  };

  const actionStyle = {
    display: "inline-block",
    marginLeft: 6,
    cursor: "pointer",
    padding: 6,
    borderRadius: 6,
    position: "relative",
  };
  const disabledActionStyle = {
    ...actionStyle,
    opacity: 0.4,
    cursor: "not-allowed",
  };

  return (
    <div className="sa-page">
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
            <i className="ri-add-line"></i> New Requisition
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

      <div
        className="sa-card"
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
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

      {error && <div className="sa-modal-error">{error}</div>}

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
                {filteredList.map((r) => {
                  const status = (r.status || "PENDING").toUpperCase();
                  const type = (r.type || "INTERNAL").toUpperCase();
                  const isVendor = type === "VENDOR";
                  const isApproved = status === "APPROVED";
                  const hasPO = !!r.po;
                  const hasGRN = !!r.grn;
                  const canCreatePO =
                    isVendor && isApproved && !hasPO && !hasGRN;
                  const canCreateGRN =
                    isVendor && isApproved && !hasGRN && !hasPO;

                  return (
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
                        <span
                          style={actionStyle}
                          onClick={() => handleView(r)}
                          title="View"
                        >
                          <i className="ri-eye-line" />
                        </span>
                        <span
                          style={actionStyle}
                          onClick={() => openDuplicateAsCreate(r)}
                          title="Create (Duplicate)"
                        >
                          <i className="ri-file-copy-line" />
                        </span>
                        <span
                          style={actionStyle}
                          onClick={() => openEditForm(r)}
                          title="Edit"
                        >
                          <i className="ri-edit-line" />
                        </span>

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

                        <span
                          style={actionStyle}
                          onClick={() => handleHold(r)}
                          title="Hold"
                        >
                          <i className="ri-pause-line" />
                        </span>

                        <span
                          style={actionStyle}
                          onClick={() => handleReject(r)}
                          title="Reject"
                        >
                          <i className="ri-close-circle-line" />
                        </span>

                        {/* PO create/view (only Vendor requisition) */}
                        {isVendor && (
                          <>
                            {hasPO ? (
                              <span
                                style={actionStyle}
                                title="View PO"
                                onClick={() => viewPO(r.po)}
                              >
                                <i className="ri-file-paper-line" />
                              </span>
                            ) : canCreatePO ? (
                              <span
                                style={actionStyle}
                                onClick={() => openCreatePO(r)}
                                title="Create Purchase Order (PO)"
                              >
                                <i className="ri-shopping-cart-line" />
                              </span>
                            ) : (
                              <span
                                style={disabledActionStyle}
                                title="Approve requisition before creating PO"
                              >
                                <i className="ri-shopping-cart-line" />
                              </span>
                            )}
                          </>
                        )}

                        {/* GRN create/view (only Vendor requisition) */}
                        {isVendor && (
                          <>
                            {hasGRN ? (
                              <span
                                style={actionStyle}
                                title="View GRN"
                                onClick={() => viewGRN(r.grn)}
                              >
                                <i className="ri-inbox-line" />
                              </span>
                            ) : hasPO ? (
                              // disabled GRN because PO exists
                              <span
                                style={disabledActionStyle}
                                title="PO created — create GRN from PO page"
                              >
                                <i className="ri-inbox-line" />
                              </span>
                            ) : canCreateGRN ? (
                              <span
                                style={actionStyle}
                                onClick={() => openCreateGRN(r)}
                                title="Create GRN"
                              >
                                <i className="ri-add-box-line" />
                              </span>
                            ) : (
                              <span
                                style={disabledActionStyle}
                                title="Approve requisition before creating GRN"
                              >
                                <i className="ri-add-box-line" />
                              </span>
                            )}
                          </>
                        )}

                        <span
                          style={actionStyle}
                          onClick={() => handleDelete(r)}
                          title="Delete"
                        >
                          <i className="ri-delete-bin-6-line" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Create / Edit Requisition Modal */}
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

              {/* items */}
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
                              <option key={it._id || it.id} value={it._id || it.id}>
                                {it.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {renderCurrentStock(ln)}
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
            setPoModal({ open: false, req: null, poNo: "", items: [] })
          }
        >
          <div
            className="sa-modal large"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 980 }}
          >
            <h3>Create Purchase Order</h3>
            <p className="sa-modal-sub">
              This PO will be created from the selected requisition. Vendor and
              delivery store are taken from the requisition.
            </p>

            <div className="sa-modal-form">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <label>
                  Approved Requisition (read-only)
                  <input
                    value={
                      poModal.req?.requisitionNo || poModal.req?._id || ""
                    }
                    readOnly
                  />
                </label>

                <label>
                  PO No.
                  <input
                    value={poModal.poNo || ""}
                    onChange={(e) =>
                      setPoModal((p) => ({ ...p, poNo: e.target.value }))
                    }
                    placeholder="PO-YYYY-XXX"
                  />
                </label>

                <label>
                  Vendor (from requisition)
                  <input
                    value={getVendorName(poModal.req?.vendor) || ""}
                    readOnly
                  />
                </label>

                <label>
                  Resort (from requisition)
                  <input
                    value={getResortName(poModal.req?.resort) || ""}
                    readOnly
                  />
                </label>

                <label>
                  Delivery Store (from requisition)
                  <input
                    value={
                      getStoreName(
                        poModal.req?.toStore || poModal.req?.store
                      ) || ""
                    }
                    readOnly
                  />
                </label>

                <label>
                  PO Date
                  <input
                    type="date"
                    value={
                      poModal.poDate || new Date().toISOString().slice(0, 10)
                    }
                    onChange={(e) =>
                      setPoModal((p) => ({ ...p, poDate: e.target.value }))
                    }
                  />
                </label>
              </div>

              {/* Items table */}
              <div style={{ marginTop: 12 }}>
                <table className="sa-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "45%" }}>Item</th>
                      <th style={{ width: "12%" }}>Qty</th>
                      <th style={{ width: "12%" }}>Rate</th>
                      <th style={{ width: "12%" }}>Amount</th>
                      <th style={{ width: "19%" }}>Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(poModal.items || []).map((ln, idx) => (
                      <tr key={ln.lineId || idx}>
                        <td>
                          {ln.itemName || getItemName(ln.item) || ln.item}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={ln.qty}
                            readOnly
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={ln.rate}
                            onChange={(e) => {
                              const v = Number(e.target.value || 0);
                              setPoModal((p) => {
                                const newItems = [...(p.items || [])];
                                newItems[idx] = {
                                  ...newItems[idx],
                                  rate: v,
                                  amount: Number(
                                    (
                                      v *
                                      Number(newItems[idx].qty || 0)
                                    ).toFixed(2)
                                  ),
                                };
                                const sub = newItems.reduce(
                                  (s, i) => s + Number(i.amount || 0),
                                  0
                                );
                                const tax =
                                  ((p.taxPercent || 0) / 100) * sub;
                                return {
                                  ...p,
                                  items: newItems,
                                  subTotal: sub,
                                  taxAmount: tax,
                                  total: sub + tax,
                                };
                              });
                            }}
                          />
                        </td>
                        <td>{Number(ln.amount || 0).toFixed(2)}</td>
                        <td>
                          <input
                            value={ln.remark || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setPoModal((p) => {
                                const newItems = [...(p.items || [])];
                                newItems[idx] = {
                                  ...newItems[idx],
                                  remark: v,
                                };
                                return { ...p, items: newItems };
                              });
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* totals */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                  marginTop: 12,
                }}
              >
                <div style={{ width: 360, textAlign: "right" }}>
                  <div style={{ marginBottom: 6 }}>
                    Subtotal:{" "}
                    <strong>{(poModal.subTotal || 0).toFixed(2)}</strong>
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    Tax %{" "}
                    <input
                      type="number"
                      min="0"
                      value={poModal.taxPercent || 0}
                      onChange={(e) => {
                        const tp = Number(e.target.value || 0);
                        setPoModal((p) => {
                          const st =
                            p.items?.reduce(
                              (s, i) => s + Number(i.amount || 0),
                              0
                            ) || 0;
                          const taxAmt = (tp / 100) * st;
                          return {
                            ...p,
                            taxPercent: tp,
                            taxAmount: taxAmt,
                            subTotal: st,
                            total: st + taxAmt,
                          };
                        });
                      }}
                      style={{ width: 70, marginLeft: 8 }}
                    />
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    Tax Amount:{" "}
                    <strong>{(poModal.taxAmount || 0).toFixed(2)}</strong>
                  </div>
                  <div style={{ marginTop: 8, fontSize: "1.05rem" }}>
                    Total:{" "}
                    <strong>
                      {(
                        poModal.total || poModal.subTotal || 0
                      ).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* actions */}
              <div className="sa-modal-actions" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="sa-secondary-button"
                  onClick={() =>
                    setPoModal({
                      open: false,
                      req: null,
                      poNo: "",
                      items: [],
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
              items: [],
            })
          }
        >
          <div
            className="sa-modal large"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 980 }}
          >
            <h3>Create GRN</h3>
            <p className="sa-modal-sub">
              Record goods received against the selected requisition. Vendor and
              store are taken from the requisition.
            </p>

            <div className="sa-modal-form">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <label>
                  Approved Requisition (read-only)
                  <input
                    value={
                      grnModal.req?.requisitionNo || grnModal.req?._id || ""
                    }
                    readOnly
                  />
                </label>

                <label>
                  GRN No.
                  <input
                    value={grnModal.grnNo || ""}
                    onChange={(e) =>
                      setGrnModal((p) => ({ ...p, grnNo: e.target.value }))
                    }
                  />
                </label>

                <label>
                  Received By
                  <input
                    value={grnModal.receivedBy || ""}
                    onChange={(e) =>
                      setGrnModal((p) => ({
                        ...p,
                        receivedBy: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Received Date
                  <input
                    type="date"
                    value={
                      grnModal.receivedDate ||
                      new Date().toISOString().slice(0, 10)
                    }
                    onChange={(e) =>
                      setGrnModal((p) => ({
                        ...p,
                        receivedDate: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Vendor (from requisition)
                  <input
                    value={getVendorName(grnModal.req?.vendor) || ""}
                    readOnly
                  />
                </label>

                <label>
                  Store (from requisition)
                  <input
                    value={
                      getStoreName(
                        grnModal.req?.toStore || grnModal.req?.store
                      ) || ""
                    }
                    readOnly
                  />
                </label>
              </div>

              {/* Items table */}
              <div style={{ marginTop: 12 }}>
                <table className="sa-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "45%" }}>Item</th>
                      <th style={{ width: "12%" }}>Requested Qty</th>
                      <th style={{ width: "12%" }}>Received Qty</th>
                      <th style={{ width: "12%" }}>Balance</th>
                      <th style={{ width: "19%" }}>Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(grnModal.items || []).map((ln, idx) => (
                      <tr key={ln.lineId || idx}>
                        <td>
                          {ln.itemName || getItemName(ln.item) || ln.item}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={ln.qtyRequested}
                            readOnly
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={ln.qtyReceived}
                            onChange={(e) => {
                              const v = Number(e.target.value || 0);
                              updateGrnLine(idx, "qtyReceived", v);
                            }}
                          />
                        </td>
                        <td>
                          {Number(
                            (ln.qtyRequested || 0) - (ln.qtyReceived || 0)
                          ).toFixed(2)}
                        </td>
                        <td>
                          <input
                            value={ln.remark || ""}
                            onChange={(e) =>
                              updateGrnLine(idx, "remark", e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* actions */}
              <div className="sa-modal-actions" style={{ marginTop: 12 }}>
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
                      items: [],
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
        .sa-modal.large { max-height: 85vh; overflow: auto; }
      `}</style>
    </div>
  );
};

export default RequisitionList;
