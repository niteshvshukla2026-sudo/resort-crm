import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* Dev fallback data */
const DEV_STORES = [
  { _id: "store_main", name: "Main Store" },
  { _id: "store_cold", name: "Cold Store" },
];

const DEV_ITEMS = [
  { _id: "item_1", name: "Milk 1L" },
  { _id: "item_2", name: "Bread Loaf" },
  { _id: "item_3", name: "Egg Tray" },
];

const DEV_VENDORS = [
  { _id: "vend_1", name: "Demo Vendor 1" },
  { _id: "vend_2", name: "Demo Vendor 2" },
];

const DEV_REPLACEMENTS = [
  {
    _id: "rep_1",
    replNo: "REP-2025-001",
    storeId: "store_main",
    date: new Date().toISOString(),
    status: "OPEN", // OPEN / SENT_TO_VENDOR / CLOSED
    vendorId: null,
    lines: [
      { lineId: "ln1", itemId: "item_1", qty: 2, issuedQty: 0, remark: "Damaged pack" },
      { lineId: "ln2", itemId: "item_2", qty: 5, issuedQty: 0, remark: "" },
    ],
  },
];

const newLine = () => ({
  lineId: `ln_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  itemId: "",
  qty: "",
  remark: "",
});

const todayStr = () => new Date().toISOString().slice(0, 10);

const StoreReplacement = () => {
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [replacements, setReplacements] = useState([]);

  // which tab: ADD / ISSUE / GRN
  const [activeTab, setActiveTab] = useState("ADD");

  // Add Replacement form
  const [addForm, setAddForm] = useState({
    storeId: "",
    lines: [newLine()],
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Issue-to-Vendor modal
  const [issueModal, setIssueModal] = useState({
    open: false,
    replacement: null,
    vendorId: "",
    lines: [], // { lineId, itemId, itemName, replQty, issueQty, remark }
  });

  // Replacement GRN modal (Step 3)
  const [grnModal, setGrnModal] = useState({
    open: false,
    replacement: null,
    storeId: "",
    date: todayStr(),
    lines: [], // { lineId, itemId, itemName, issuedQty, receivedQty, remark }
  });

  // ------------ Helpers -------------
  const getStoreName = (id) =>
    stores.find((s) => s._id === id || s.id === id)?.name || id || "-";

  const getItem = (id) =>
    items.find((i) => i._id === id || i.id === id) || null;

  const getItemName = (id) => getItem(id)?.name || id || "-";

  const getVendorName = (id) =>
    vendors.find((v) => v._id === id || v.id === id)?.name || id || "-";

  const generateReplNo = () => {
    const d = new Date();
    const y = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const seq = String(d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()).padStart(5, "0");
    return `REP-${y}${mm}${dd}-${seq}`;
  };

  // ------------ Load master + replacement data -------------
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [storeRes, itemRes, vendorRes, replRes] = await Promise.all([
        axios.get(`${API_BASE}/api/stores`).catch(() => ({ data: DEV_STORES })),
        axios.get(`${API_BASE}/api/items`).catch(() => ({ data: DEV_ITEMS })),
        axios.get(`${API_BASE}/api/vendors`).catch(() => ({ data: DEV_VENDORS })),
        axios.get(`${API_BASE}/api/store-replacements`).catch(() => ({ data: DEV_REPLACEMENTS })),
      ]);

      setStores(
        Array.isArray(storeRes.data) && storeRes.data.length
          ? storeRes.data
          : DEV_STORES
      );
      setItems(
        Array.isArray(itemRes.data) && itemRes.data.length
          ? itemRes.data
          : DEV_ITEMS
      );
      setVendors(
        Array.isArray(vendorRes.data) && vendorRes.data.length
          ? vendorRes.data
          : DEV_VENDORS
      );

      const serverRepl = Array.isArray(replRes.data) ? replRes.data : [];
      const normalized = serverRepl.map((r) => ({
        _id: r._id || r.id,
        replNo: r.replNo || r.repl_no || r.code || "",
        storeId: r.storeId || r.store || r.storeFrom || "",
        date: r.date || r.createdAt || new Date().toISOString(),
        status: r.status || "OPEN",
        vendorId: r.vendorId || r.vendor || null,
        lines:
          (r.lines || []).map((ln) => ({
            lineId: ln.lineId || ln._id || `ln_${Math.floor(Math.random() * 100000)}`,
            itemId: ln.itemId || ln.item || "",
            qty: ln.qty ?? ln.quantity ?? 0,
            issuedQty: ln.issuedQty ?? 0,
            remark: ln.remark || "",
          })) || [],
      }));

      setReplacements(normalized.length ? normalized : DEV_REPLACEMENTS);
    } catch (err) {
      console.error("load store replacement error", err);
      setError("Failed to load store replacement data, using demo data.");
      setStores(DEV_STORES);
      setItems(DEV_ITEMS);
      setVendors(DEV_VENDORS);
      setReplacements(DEV_REPLACEMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------ Add Replacement form handlers -------------
  const updateAddFormField = (name, value) =>
    setAddForm((p) => ({
      ...p,
      [name]: value,
    }));

  const updateAddLine = (idx, field, value) => {
    setAddForm((p) => {
      const arr = [...p.lines];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...p, lines: arr };
    });
  };

  const addLineRow = () =>
    setAddForm((p) => ({
      ...p,
      lines: [...p.lines, newLine()],
    }));

  const removeLineRow = (idx) =>
    setAddForm((p) => ({
      ...p,
      lines: p.lines.filter((_, i) => i !== idx),
    }));

  const validateAddForm = () => {
    if (!addForm.storeId) return "Select Store Name.";
    const validLines = addForm.lines.filter(
      (ln) => ln.itemId && ln.qty && Number(ln.qty) > 0
    );
    if (!validLines.length) return "Add at least one Item with Qty.";
    return null;
  };

  const handleSaveReplacement = async (e) => {
    e.preventDefault();
    const v = validateAddForm();
    if (v) {
      setError(v);
      return;
    }
    setError("");

    const replNo = generateReplNo();
    const payload = {
      replNo,
      storeId: addForm.storeId,
      date: new Date().toISOString(),
      status: "OPEN",
      lines: addForm.lines
        .filter((ln) => ln.itemId && ln.qty && Number(ln.qty) > 0)
        .map((ln) => ({
          itemId: ln.itemId,
          qty: Number(ln.qty),
          remark: ln.remark || "",
        })),
    };

    try {
      setSaving(true);
      const res = await axios
        .post(`${API_BASE}/api/store-replacements`, payload)
        .catch(() => ({ data: { ...payload, _id: `local_${Date.now()}` } }));

      const created = res.data || payload;
      setReplacements((p) => [created, ...p]);

      // reset form
      setAddForm({
        storeId: "",
        lines: [newLine()],
      });
    } catch (err) {
      console.error("save replacement error", err);
      setError(err.response?.data?.message || "Failed to save replacement");
    } finally {
      setSaving(false);
    }
  };

  // ------------ Issue to Vendor (Replacement Store action) -------------
  const openIssueToVendor = (repl) => {
    const modalLines = (repl.lines || []).map((ln) => ({
      lineId: ln.lineId,
      itemId: ln.itemId,
      itemName: getItemName(ln.itemId),
      replQty: ln.qty,
      issueQty: ln.qty - (ln.issuedQty || 0),
      remark: ln.remark || "",
    }));

    setIssueModal({
      open: true,
      replacement: repl,
      vendorId: repl.vendorId || "",
      lines: modalLines,
    });
    setError("");
  };

  const updateIssueLine = (idx, field, value) => {
    setIssueModal((p) => {
      const arr = [...p.lines];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...p, lines: arr };
    });
  };

  const submitIssueToVendor = async () => {
    const { replacement, vendorId, lines } = issueModal;
    if (!replacement) return;
    if (!vendorId) {
      setError("Select Vendor before issuing.");
      return;
    }

    for (const ln of lines) {
      const iq = Number(ln.issueQty || 0);
      if (iq < 0) return setError("Issue quantity cannot be negative.");
      if (iq > Number(ln.replQty || 0))
        return setError("Issue quantity cannot be more than replacement quantity.");
    }

    const payload = {
      vendorId,
      lines: lines.map((ln) => ({
        lineId: ln.lineId,
        itemId: ln.itemId,
        issueQty: Number(ln.issueQty || 0),
        remark: ln.remark || "",
      })),
    };

    try {
      setSaving(true);
      const res = await axios
        .patch(
          `${API_BASE}/api/store-replacements/${
            replacement._id || replacement.id
          }/issue-vendor`,
          payload
        )
        .catch(() => null);

      if (res && res.data) {
        const updated = res.data;
        setReplacements((p) =>
          p.map((x) => (x._id === (replacement._id || replacement.id) ? updated : x))
        );
      } else {
        // optimistic update: set vendor, status, issuedQty in lines
        setReplacements((p) =>
          p.map((x) => {
            if (x._id !== (replacement._id || replacement.id)) return x;
            const mergedLines = (x.lines || []).map((ln) => {
              const match = lines.find((l) => l.lineId === ln.lineId);
              if (!match) return ln;
              return {
                ...ln,
                issuedQty: Number(match.issueQty || 0),
                remark: match.remark || ln.remark,
              };
            });
            return {
              ...x,
              vendorId,
              status: "SENT_TO_VENDOR",
              lines: mergedLines,
            };
          })
        );
      }

      setIssueModal({
        open: false,
        replacement: null,
        vendorId: "",
        lines: [],
      });
    } catch (err) {
      console.error("issue to vendor error", err);
      setError(err.response?.data?.message || "Failed to issue to vendor");
    } finally {
      setSaving(false);
    }
  };

  // ------------ Replacement GRN (Step 3) -------------
  const openGrnModal = (repl) => {
    if (!repl.vendorId) {
      setError("Vendor not set for this replacement. Please Issue to Vendor first.");
      return;
    }

    const modalLines = (repl.lines || []).map((ln) => ({
      lineId: ln.lineId,
      itemId: ln.itemId,
      itemName: getItemName(ln.itemId),
      issuedQty: ln.issuedQty || ln.qty || 0,
      receivedQty: ln.issuedQty || ln.qty || 0,
      remark: "",
    }));

    setGrnModal({
      open: true,
      replacement: repl,
      storeId: repl.storeId || "",
      date: todayStr(),
      lines: modalLines,
    });
    setError("");
  };

  const updateGrnLine = (idx, field, value) => {
    setGrnModal((p) => {
      const arr = [...p.lines];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...p, lines: arr };
    });
  };

  const submitReplacementGrn = async () => {
    const { replacement, storeId, date, lines } = grnModal;
    if (!replacement) return;
    if (!storeId) {
      setError("Select Store for GRN.");
      return;
    }

    for (const ln of lines) {
      const rq = Number(ln.receivedQty || 0);
      if (rq < 0) return setError("Received quantity cannot be negative.");
      if (rq > Number(ln.issuedQty || 0))
        return setError("Received qty cannot be more than issued qty.");
    }

    const payload = {
      storeId,
      grnDate: date,
      lines: lines.map((ln) => ({
        lineId: ln.lineId,
        itemId: ln.itemId,
        issuedQty: Number(ln.issuedQty || 0),
        receivedQty: Number(ln.receivedQty || 0),
        remark: ln.remark || "",
      })),
    };

    try {
      setSaving(true);
      const res = await axios
        .post(
          `${API_BASE}/api/store-replacements/${
            replacement._id || replacement.id
          }/create-grn`,
          payload
        )
        .catch(() => null);

      if (res && res.data) {
        const updated = res.data;
        setReplacements((p) =>
          p.map((x) => (x._id === (replacement._id || replacement.id) ? updated : x))
        );
      } else {
        // optimistic: mark as CLOSED
        setReplacements((p) =>
          p.map((x) =>
            x._id === (replacement._id || replacement.id)
              ? { ...x, status: "CLOSED" }
              : x
          )
        );
      }

      setGrnModal({
        open: false,
        replacement: null,
        storeId: "",
        date: todayStr(),
        lines: [],
      });
    } catch (err) {
      console.error("replacement grn error", err);
      setError(err.response?.data?.message || "Failed to create replacement GRN");
    } finally {
      setSaving(false);
    }
  };

  // ------------ UI -------------
  const tabButtonStyle = (tab) => ({
    padding: "6px 14px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    fontSize: "0.9rem",
    background: activeTab === tab ? "#10b981" : "#111827",
    color: activeTab === tab ? "#0b1120" : "#e5e7eb",
  });

  return (
    <div className="sa-page">
      {/* HEADER */}
      <div className="sa-page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h2>Store Replacement</h2>
          <p>
            Add replacement against store, issue to vendor and finally create
            replacement GRN.
          </p>
        </div>

        <button
          type="button"
          className="sa-secondary-button"
          onClick={loadData}
        >
          Refresh
        </button>
      </div>

      {/* STEP TABS */}
      <div className="sa-card" style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <button style={tabButtonStyle("ADD")} onClick={() => setActiveTab("ADD")}>
          Add Replacement
        </button>
        <button
          style={tabButtonStyle("ISSUE")}
          onClick={() => setActiveTab("ISSUE")}
        >
          Replacement Store / Issue Vendor
        </button>
        <button
          style={tabButtonStyle("GRN")}
          onClick={() => setActiveTab("GRN")}
        >
          Replacement GRN
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="sa-modal-error" style={{ marginBottom: 10 }}>
          {error}
        </div>
      )}

      {/* TAB 1: ADD REPLACEMENT */}
      {activeTab === "ADD" && (
        <div className="sa-card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 8 }}>Add Replacement</h3>
          <form onSubmit={handleSaveReplacement}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <label>
                Store Name
                <select
                  value={addForm.storeId}
                  onChange={(e) => updateAddFormField("storeId", e.target.value)}
                  required
                >
                  <option value="">Select store</option>
                  {stores.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Repl No is auto-generated on save */}
              <label>
                Replacement No.
                <input value="Auto Generated on Save" readOnly />
              </label>
            </div>

            <h4 style={{ marginBottom: 6 }}>Items</h4>
            <table className="sa-table">
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>Item Name</th>
                  <th style={{ width: "15%" }}>Item Qty</th>
                  <th>Reason / Remarks</th>
                  <th style={{ width: "8%" }}></th>
                </tr>
              </thead>
              <tbody>
                {addForm.lines.map((ln, idx) => (
                  <tr key={ln.lineId}>
                    <td>
                      <select
                        value={ln.itemId}
                        onChange={(e) =>
                          updateAddLine(idx, "itemId", e.target.value)
                        }
                        required
                      >
                        <option value="">Select item</option>
                        {items.map((it) => (
                          <option key={it._id || it.id} value={it._id || it.id}>
                            {it.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={ln.qty}
                        onChange={(e) => updateAddLine(idx, "qty", e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        value={ln.remark}
                        onChange={(e) =>
                          updateAddLine(idx, "remark", e.target.value)
                        }
                        placeholder="Damaged / Expired / Others"
                      />
                    </td>
                    <td>
                      {addForm.lines.length > 1 && (
                        <button
                          type="button"
                          className="sa-secondary-button"
                          onClick={() => removeLineRow(idx)}
                        >
                          -
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              type="button"
              className="sa-secondary-button"
              style={{ marginTop: 8 }}
              onClick={addLineRow}
            >
              + Add Item
            </button>

            <div className="sa-modal-actions" style={{ marginTop: 12 }}>
              <button
                type="submit"
                className="sa-primary-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Replacement"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: REPLACEMENT STORE + ISSUE VENDOR */}
      {activeTab === "ISSUE" && (
        <div className="sa-card">
          <h3 style={{ marginBottom: 8 }}>Replacement Store</h3>
          {loading ? (
            <div>Loading replacements...</div>
          ) : (
            <>
              <div style={{ marginBottom: 8, color: "#9ca3af" }}>
                Showing {replacements.length} replacements
              </div>
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Repl No</th>
                    <th>Store</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Vendor</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {replacements.map((r) => (
                    <tr key={r._id}>
                      <td>{r.replNo || r._id}</td>
                      <td>{getStoreName(r.storeId)}</td>
                      <td>{(r.date || "").slice(0, 10)}</td>
                      <td>{(r.lines || []).length}</td>
                      <td>{r.vendorId ? getVendorName(r.vendorId) : "-"}</td>
                      <td>{r.status || "OPEN"}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          className="sa-secondary-button"
                          style={{ padding: "4px 8px", marginRight: 6 }}
                          onClick={() => openIssueToVendor(r)}
                        >
                          Issue to Vendor
                        </button>
                        {/* create GRN shortcut from same table */}
                        <button
                          type="button"
                          className="sa-secondary-button"
                          style={{ padding: "4px 8px" }}
                          onClick={() => openGrnModal(r)}
                        >
                          Create GRN
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* TAB 3: SIMPLE VIEW FOR ISSUED ITEMS (optional summary) */}
      {activeTab === "GRN" && (
        <div className="sa-card">
          <h3 style={{ marginBottom: 8 }}>Replacement Issued Items</h3>
          <p style={{ marginBottom: 8, color: "#9ca3af" }}>
            Select any replacement (with vendor) from &quot;Replacement Store&quot; tab and
            click <strong>Create GRN</strong> to record GRN – Replacement for a store.
          </p>
          <table className="sa-table">
            <thead>
              <tr>
                <th>Repl No</th>
                <th>Store</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {replacements
                .filter((r) => r.vendorId)
                .map((r) => (
                  <tr key={r._id}>
                    <td>{r.replNo}</td>
                    <td>{getStoreName(r.storeId)}</td>
                    <td>{getVendorName(r.vendorId)}</td>
                    <td>{r.status}</td>
                    <td>
                      <button
                        type="button"
                        className="sa-secondary-button"
                        style={{ padding: "4px 8px" }}
                        onClick={() => openGrnModal(r)}
                      >
                        GRN - Replacement
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ISSUE TO VENDOR MODAL (Step 2) */}
      {issueModal.open && (
        <div
          className="sa-modal-backdrop"
          onClick={() =>
            !saving &&
            setIssueModal({
              open: false,
              replacement: null,
              vendorId: "",
              lines: [],
            })
          }
        >
          <div
            className="sa-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 900 }}
          >
            <h3>Issue to Vendor (Replacement)</h3>
            <p className="sa-modal-sub">
              Repl No: {issueModal.replacement?.replNo || "-"} — Store:{" "}
              {getStoreName(issueModal.replacement?.storeId)}
            </p>

            <div
              className="sa-modal-form"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <label>
                Repl No
                <input
                  value={issueModal.replacement?.replNo || ""}
                  readOnly
                />
              </label>

              <label>
                Store Name
                <input
                  value={getStoreName(issueModal.replacement?.storeId)}
                  readOnly
                />
              </label>

              <label>
                Select Vendor
                <select
                  value={issueModal.vendorId}
                  onChange={(e) =>
                    setIssueModal((p) => ({ ...p, vendorId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v._id || v.id} value={v._id || v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <h4 style={{ marginBottom: 6 }}>Items to Issue</h4>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Replacement Qty</th>
                  <th>Issue Qty</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {issueModal.lines.map((ln, idx) => (
                  <tr key={ln.lineId}>
                    <td>{ln.itemName}</td>
                    <td>{ln.replQty}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={ln.issueQty}
                        onChange={(e) =>
                          updateIssueLine(idx, "issueQty", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={ln.remark}
                        onChange={(e) =>
                          updateIssueLine(idx, "remark", e.target.value)
                        }
                        placeholder="optional"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="sa-modal-actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="sa-secondary-button"
                onClick={() =>
                  setIssueModal({
                    open: false,
                    replacement: null,
                    vendorId: "",
                    lines: [],
                  })
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className="sa-primary-button"
                onClick={submitIssueToVendor}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Issue to Vendor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPLACEMENT GRN MODAL (Step 3) */}
      {grnModal.open && (
        <div
          className="sa-modal-backdrop"
          onClick={() =>
            !saving &&
            setGrnModal({
              open: false,
              replacement: null,
              storeId: "",
              date: todayStr(),
              lines: [],
            })
          }
        >
          <div
            className="sa-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 900 }}
          >
            <h3>GRN – Replacement</h3>
            <p className="sa-modal-sub">
              Repl No: {grnModal.replacement?.replNo || "-"} — Vendor:{" "}
              {getVendorName(grnModal.replacement?.vendorId)}
            </p>

            <div
              className="sa-modal-form"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <label>
                Repl No
                <input value={grnModal.replacement?.replNo || ""} readOnly />
              </label>

              <label>
                Vendor
                <input
                  value={getVendorName(grnModal.replacement?.vendorId)}
                  readOnly
                />
              </label>

              <label>
                Select Store
                <select
                  value={grnModal.storeId}
                  onChange={(e) =>
                    setGrnModal((p) => ({ ...p, storeId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select store</option>
                  {stores.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                GRN Date
                <input
                  type="date"
                  value={grnModal.date}
                  onChange={(e) =>
                    setGrnModal((p) => ({ ...p, date: e.target.value }))
                  }
                  required
                />
              </label>
            </div>

            <h4 style={{ marginBottom: 6 }}>Items</h4>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Issued Qty</th>
                  <th>Received Qty</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {grnModal.lines.map((ln, idx) => (
                  <tr key={ln.lineId}>
                    <td>{ln.itemName}</td>
                    <td>{ln.issuedQty}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={ln.receivedQty}
                        onChange={(e) =>
                          updateGrnLine(idx, "receivedQty", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={ln.remark}
                        onChange={(e) =>
                          updateGrnLine(idx, "remark", e.target.value)
                        }
                        placeholder="optional"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="sa-modal-actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="sa-secondary-button"
                onClick={() =>
                  setGrnModal({
                    open: false,
                    replacement: null,
                    storeId: "",
                    date: todayStr(),
                    lines: [],
                  })
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className="sa-primary-button"
                onClick={submitReplacementGrn}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Replacement GRN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreReplacement;
