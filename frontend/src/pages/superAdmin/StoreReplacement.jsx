// src/pages/superAdmin/StoreReplacement.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* ---------- Small helpers ---------- */
const statusOf = (r) =>
  (r?.status || "OPEN").toString().toUpperCase();

const getId = (obj) => obj?._id || obj?.id;

/* ---------- TAB 1: Add Replacement ---------- */

const AddReplacementTab = ({ stores, items, reloadReplacements }) => {
  const newLine = () => ({
    id: `ln_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    item: "",
    qty: "",
    reason: "",
  });

  const [storeFrom, setStoreFrom] = useState("");
  const [lines, setLines] = useState([newLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateLine = (idx, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addLine = () => setLines((prev) => [...prev, newLine()]);
  const removeLine = (idx) =>
    setLines((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    if (!storeFrom) return setError("Select Store From");
    const validLines = lines.filter(
      (ln) => ln.item && ln.qty && Number(ln.qty) > 0
    );
    if (!validLines.length)
      return setError("Add at least one item with quantity");

    const payload = {
      storeFrom,
      lines: validLines.map((ln) => ({
        item: ln.item,
        qty: Number(ln.qty),
        reason: ln.reason || undefined,
      })),
    };

    try {
      setSaving(true);
      const res = await axios.post(
        `${API_BASE}/api/replacement`,
        payload
      );
      const created = res.data;
      if (created?.replNo) {
        alert(`Replacement created: ${created.replNo}`);
      } else {
        alert("Replacement created.");
      }
      setStoreFrom("");
      setLines([newLine()]);
      reloadReplacements();
    } catch (err) {
      console.error("create replacement error", err);
      setError(
        err.response?.data?.message ||
          "Failed to create replacement"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="sa-card" onSubmit={handleSave}>
      <h3>Add Replacement</h3>
      <p className="sa-modal-sub">
        Create store replacement and auto stock OUT from selected store.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          margin: "12px 0",
        }}
      >
        <label>
          Store From
          <select
            value={storeFrom}
            onChange={(e) => setStoreFrom(e.target.value)}
            required
          >
            <option value="">Select store</option>
            {stores.map((s) => (
              <option key={getId(s)} value={getId(s)}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h4 style={{ marginTop: 8 }}>Items</h4>
      <div className="sa-card" style={{ padding: 10 }}>
        <table className="sa-table">
          <thead>
            <tr>
              <th style={{ width: "45%" }}>Item</th>
              <th style={{ width: "15%" }}>Qty</th>
              <th>Reason</th>
              <th style={{ width: "5%" }}></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((ln, idx) => (
              <tr key={ln.id}>
                <td>
                  <select
                    value={ln.item}
                    onChange={(e) =>
                      updateLine(idx, "item", e.target.value)
                    }
                    required
                  >
                    <option value="">Select item</option>
                    {items.map((it) => (
                      <option key={getId(it)} value={getId(it)}>
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
                    onChange={(e) =>
                      updateLine(idx, "qty", e.target.value)
                    }
                    required
                  />
                </td>
                <td>
                  <input
                    value={ln.reason}
                    onChange={(e) =>
                      updateLine(idx, "reason", e.target.value)
                    }
                    placeholder="Reason / remarks"
                  />
                </td>
                <td>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      className="sa-secondary-button"
                      onClick={() => removeLine(idx)}
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
          onClick={addLine}
        >
          + Add Item
        </button>
      </div>

      {error && (
        <div className="sa-modal-error" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}

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
  );
};

/* ---------- TAB 2: Issue to Vendor ---------- */

const IssueToVendorTab = ({
  replacements,
  vendors,
  stores,
  reloadReplacements,
}) => {
  const [selected, setSelected] = useState(null);
  const [vendorId, setVendorId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const openRepl = (r) => {
    setSelected(r);
    setVendorId(r.vendor || "");
    setError("");
  };

  const handleSave = async () => {
    if (!selected) return;
    if (!vendorId)
      return setError("Select vendor to issue replacement.");

    try {
      setSaving(true);
      await axios.patch(
        `${API_BASE}/api/replacement/${selected._id}/issue-vendor`,
        { vendor: vendorId }
      );
      alert("Replacement issued to vendor.");
      setSelected(null);
      setVendorId("");
      reloadReplacements();
    } catch (err) {
      console.error("issue vendor error", err);
      setError(
        err.response?.data?.message ||
          "Failed to issue replacement to vendor"
      );
    } finally {
      setSaving(false);
    }
  };

  const openList = replacements.filter(
    (r) => statusOf(r) === "OPEN"
  );

  const getStoreName = (id) =>
    stores.find((s) => getId(s) === id)?.name || id || "-";

  const getVendorName = (id) =>
    vendors.find((v) => getId(v) === id)?.name || id || "-";

  return (
    <div style={{ display: "flex", gap: 12 }}>
      {/* LEFT: list */}
      <div className="sa-card" style={{ flex: 1 }}>
        <h3>Open Replacements</h3>
        <p className="sa-modal-sub">
          Select a replacement and issue it to a vendor.
        </p>

        <table className="sa-table">
          <thead>
            <tr>
              <th>Repl No</th>
              <th>Store From</th>
              <th>Date</th>
              <th>Items</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {openList.map((r) => (
              <tr
                key={r._id}
                style={{
                  cursor: "pointer",
                  background:
                    selected && selected._id === r._id
                      ? "#111827"
                      : "transparent",
                }}
                onClick={() => openRepl(r)}
              >
                <td>{r.replNo || r._id}</td>
                <td>{getStoreName(r.storeFrom)}</td>
                <td>{(r.date || "").slice(0, 10)}</td>
                <td>{(r.lines || []).length}</td>
                <td>{statusOf(r)}</td>
              </tr>
            ))}
            {!openList.length && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center" }}>
                  No open replacements.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* RIGHT: detail / issue form */}
      <div className="sa-card" style={{ flex: 1 }}>
        <h3>Issue to Vendor</h3>
        {selected ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <label>
                Replacement No
                <input
                  value={selected.replNo || selected._id}
                  readOnly
                />
              </label>
              <label>
                Store From
                <input
                  value={getStoreName(selected.storeFrom)}
                  readOnly
                />
              </label>

              <label>
                Vendor
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  required
                >
                  <option value="">Select vendor</option>
                  {vendors.map((v) => (
                    <option key={getId(v)} value={getId(v)}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Current Status
                <input value={statusOf(selected)} readOnly />
              </label>
            </div>

            <h4>Items</h4>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {(selected.lines || []).map((ln, i) => (
                  <tr key={i}>
                    <td>{ln.itemName || ln.item || "-"}</td>
                    <td>{ln.qty}</td>
                    <td>{ln.reason || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {error && (
              <div
                className="sa-modal-error"
                style={{ marginTop: 8 }}
              >
                {error}
              </div>
            )}

            <div className="sa-modal-actions" style={{ marginTop: 10 }}>
              <button
                type="button"
                className="sa-secondary-button"
                onClick={() => {
                  setSelected(null);
                  setVendorId("");
                  setError("");
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="sa-primary-button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save & Mark Sent"}
              </button>
            </div>
          </>
        ) : (
          <p style={{ color: "#9ca3af" }}>
            Select a replacement from the left list to issue it to a
            vendor.
          </p>
        )}
      </div>
    </div>
  );
};

/* ---------- TAB 3: Replacement GRN ---------- */

const ReplacementGrnTab = ({
  replacements,
  vendors,
  stores,
  items,
  reloadReplacements,
}) => {
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const candidates = replacements.filter((r) => {
    const s = statusOf(r);
    return r.vendor && (s === "SENT_TO_VENDOR" || s === "PARTIAL");
  });

  const getStoreName = (id) =>
    stores.find((s) => getId(s) === id)?.name || id || "-";

  const getVendorName = (id) =>
    vendors.find((v) => getId(v) === id)?.name || id || "-";

  const getItemName = (id) =>
    items.find((it) => getId(it) === id)?.name || id || "-";

  const openRepl = (r) => {
    setSelected(r);
    setError("");
    setForm({
      store: r.storeFrom || "",
      date: today,
      lines: (r.lines || []).map((ln) => {
        const sent = ln.qty ?? ln.sentQty ?? 0;
        const received =
          ln.receivedQty != null ? ln.receivedQty : sent;
        return {
          id: ln._id || ln.id || `ln_${Math.random()}`,
          item: ln.item,
          sentQty: sent,
          receivedQty: received,
          remarks: ln.remarks || "",
        };
      }),
    });
  };

  const updateLine = (idx, field, value) => {
    setForm((prev) => {
      const nextLines = [...prev.lines];
      nextLines[idx] = { ...nextLines[idx], [field]: value };
      return { ...prev, lines: nextLines };
    });
  };

  const handleSave = async () => {
    if (!selected || !form) return;
    if (!form.store) return setError("Select store to receive.");
    if (!form.date) return setError("GRN date is required.");

    try {
      setSaving(true);
      const payload = {
        store: form.store,
        date: form.date,
        lines: form.lines.map((ln) => ({
          item: ln.item,
          sentQty: Number(ln.sentQty || 0),
          receivedQty: Number(ln.receivedQty || 0),
          remarks: ln.remarks || undefined,
        })),
      };

      const res = await axios.post(
        `${API_BASE}/api/replacement/${selected._id}/create-grn`,
        payload
      );

      const created = res.data;
      if (created?.grnNo) {
        alert(`Replacement GRN created: ${created.grnNo}`);
      } else {
        alert("Replacement GRN created.");
      }

      setSelected(null);
      setForm(null);
      reloadReplacements();
    } catch (err) {
      console.error("create replacement grn error", err);
      setError(
        err.response?.data?.message ||
          "Failed to create replacement GRN"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 12 }}>
      {/* LEFT: candidate list */}
      <div className="sa-card" style={{ flex: 1 }}>
        <h3>Replacements Pending GRN</h3>
        <p className="sa-modal-sub">
          Select a replacement to record received stock.
        </p>

        <table className="sa-table">
          <thead>
            <tr>
              <th>Repl No</th>
              <th>Vendor</th>
              <th>Store</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((r) => (
              <tr
                key={r._id}
                style={{
                  cursor: "pointer",
                  background:
                    selected && selected._id === r._id
                      ? "#111827"
                      : "transparent",
                }}
                onClick={() => openRepl(r)}
              >
                <td>{r.replNo || r._id}</td>
                <td>{getVendorName(r.vendor)}</td>
                <td>{getStoreName(r.storeFrom)}</td>
                <td>{statusOf(r)}</td>
              </tr>
            ))}
            {!candidates.length && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>
                  No replacements waiting for GRN.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* RIGHT: GRN form */}
      <div className="sa-card" style={{ flex: 1 }}>
        <h3>Replacement GRN</h3>
        {selected && form ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <label>
                Replacement No
                <input
                  value={selected.replNo || selected._id}
                  readOnly
                />
              </label>
              <label>
                Vendor
                <input
                  value={getVendorName(selected.vendor)}
                  readOnly
                />
              </label>

              <label>
                Store (receive in)
                <select
                  value={form.store}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      store: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select store</option>
                  {stores.map((s) => (
                    <option key={getId(s)} value={getId(s)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                GRN Date
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                  required
                />
              </label>
            </div>

            <h4>Items</h4>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Sent Qty</th>
                  <th>Received Qty</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {form.lines.map((ln, idx) => (
                  <tr key={ln.id}>
                    <td>{getItemName(ln.item)}</td>
                    <td>{ln.sentQty}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={ln.receivedQty}
                        onChange={(e) =>
                          updateLine(
                            idx,
                            "receivedQty",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={ln.remarks}
                        onChange={(e) =>
                          updateLine(idx, "remarks", e.target.value)
                        }
                        placeholder="optional"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {error && (
              <div
                className="sa-modal-error"
                style={{ marginTop: 8 }}
              >
                {error}
              </div>
            )}

            <div className="sa-modal-actions" style={{ marginTop: 10 }}>
              <button
                type="button"
                className="sa-secondary-button"
                onClick={() => {
                  setSelected(null);
                  setForm(null);
                  setError("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sa-primary-button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Create Replacement GRN"}
              </button>
            </div>
          </>
        ) : (
          <p style={{ color: "#9ca3af" }}>
            Select a replacement from the left list to create GRN.
          </p>
        )}
      </div>
    </div>
  );
};

/* ---------- PARENT PAGE: StoreReplacement ---------- */

const StoreReplacement = () => {
  const [activeTab, setActiveTab] = useState("ADD"); // ADD | ISSUE | GRN

  const [stores, setStores] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [replacements, setReplacements] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadMastersAndReplacements = async () => {
    try {
      setLoading(true);
      setError("");
      const [storeRes, vendorRes, itemRes, replRes] =
        await Promise.all([
          axios
            .get(`${API_BASE}/api/stores`)
            .catch(() => ({ data: [] })),
          axios
            .get(`${API_BASE}/api/vendors`)
            .catch(() => ({ data: [] })),
          axios
            .get(`${API_BASE}/api/items`)
            .catch(() => ({ data: [] })),
          axios
            .get(`${API_BASE}/api/replacement`)
            .catch(() => ({ data: [] })),
        ]);

      setStores(Array.isArray(storeRes.data) ? storeRes.data : []);
      setVendors(
        Array.isArray(vendorRes.data) ? vendorRes.data : []
      );
      setItems(Array.isArray(itemRes.data) ? itemRes.data : []);
      setReplacements(
        Array.isArray(replRes.data) ? replRes.data : []
      );
    } catch (err) {
      console.error("load replacement data error", err);
      setError(
        err.response?.data?.message ||
          "Failed to load store replacement data"
      );
      setReplacements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMastersAndReplacements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reloadReplacements = async () => {
    try {
      const replRes = await axios
        .get(`${API_BASE}/api/replacement`)
        .catch(() => ({ data: [] }));
      setReplacements(
        Array.isArray(replRes.data) ? replRes.data : []
      );
    } catch (err) {
      console.error("reload replacements error", err);
    }
  };

  return (
    <div className="sa-page">
      <div
        className="sa-page-header"
        style={{ alignItems: "flex-start" }}
      >
        <div>
          <h2>Store Replacement</h2>
          <p>
            Manage store replacements: create, issue to vendor and
            receive back via GRN.
          </p>
        </div>

        <button
          className="sa-secondary-button"
          type="button"
          onClick={loadMastersAndReplacements}
        >
          Refresh
        </button>
      </div>

      <div
        className="sa-card"
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <button
          type="button"
          className={
            activeTab === "ADD"
              ? "sa-primary-button"
              : "sa-secondary-button"
          }
          onClick={() => setActiveTab("ADD")}
        >
          Add Replacement
        </button>
        <button
          type="button"
          className={
            activeTab === "ISSUE"
              ? "sa-primary-button"
              : "sa-secondary-button"
          }
          onClick={() => setActiveTab("ISSUE")}
        >
          Issue to Vendor
        </button>
        <button
          type="button"
          className={
            activeTab === "GRN"
              ? "sa-primary-button"
              : "sa-secondary-button"
          }
          onClick={() => setActiveTab("GRN")}
        >
          Replacement GRN
        </button>

        <div style={{ marginLeft: "auto", color: "#9ca3af" }}>
          {loading ? "Loading..." : `Replacements: ${replacements.length}`}
        </div>
      </div>

      {error && (
        <div className="sa-modal-error" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}

      {activeTab === "ADD" && (
        <AddReplacementTab
          stores={stores}
          items={items}
          reloadReplacements={reloadReplacements}
        />
      )}

      {activeTab === "ISSUE" && (
        <IssueToVendorTab
          replacements={replacements}
          vendors={vendors}
          stores={stores}
          reloadReplacements={reloadReplacements}
        />
      )}

      {activeTab === "GRN" && (
        <ReplacementGrnTab
          replacements={replacements}
          vendors={vendors}
          stores={stores}
          items={items}
          reloadReplacements={reloadReplacements}
        />
      )}
    </div>
  );
};

export default StoreReplacement;
