import React, { useEffect, useState } from "react";
import axios from "axios";
import { useResort } from "../../context/ResortContext";

const API_BASE =
  (import.meta.env.VITE_API_BASE || "http://localhost:5000") + "/api";

/* =========================
   HELPERS
========================= */
const newLine = () => ({
  lineId: `ln_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  itemId: "",
  qty: "",
  remark: "",
});

const todayStr = () => new Date().toISOString().slice(0, 10);

/* =========================
   COMPONENT
========================= */
const StoreReplacement = () => {
  const { selectedResort } = useResort(); // 🌍 GLOBAL RESORT

  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [replacements, setReplacements] = useState([]);

  const [activeTab, setActiveTab] = useState("ADD");

  const [addForm, setAddForm] = useState({
    storeId: "",
    lines: [newLine()],
  });

  const [issueModal, setIssueModal] = useState({
    open: false,
    replacement: null,
    vendorId: "",
    lines: [],
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     LOAD DATA (RESORT WISE)
  ========================= */
  const loadData = async () => {
    if (!selectedResort || selectedResort === "ALL") {
      setStores([]);
      setItems([]);
      setVendors([]);
      setReplacements([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [storeRes, itemRes, vendorRes, replRes] = await Promise.all([
        axios.get(`${API_BASE}/stores`, {
          params: { resort: selectedResort },
        }),
        axios.get(`${API_BASE}/items`, {
          params: { resort: selectedResort },
        }),
        axios.get(`${API_BASE}/vendors`, {
          params: { resort: selectedResort },
        }),
        axios.get(`${API_BASE}/store-replacements`, {
          params: { resort: selectedResort },
        }),
      ]);

      setStores(storeRes.data || []);
      setItems(itemRes.data || []);
      setVendors(vendorRes.data || []);
      setReplacements(replRes.data || []);
    } catch (err) {
      console.error("LOAD STORE REPLACEMENT ERROR", err);
      setError("Failed to load store replacement data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [selectedResort]);

  /* =========================
     ADD REPLACEMENT
  ========================= */
  const updateAddLine = (idx, field, value) => {
    setAddForm((p) => {
      const arr = [...p.lines];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...p, lines: arr };
    });
  };

  const addLineRow = () =>
    setAddForm((p) => ({ ...p, lines: [...p.lines, newLine()] }));

  const removeLineRow = (idx) =>
    setAddForm((p) => ({
      ...p,
      lines: p.lines.filter((_, i) => i !== idx),
    }));

  const validateAdd = () => {
    if (!addForm.storeId) return "Store required";
    const valid = addForm.lines.filter(
      (l) => l.itemId && Number(l.qty) > 0
    );
    if (!valid.length) return "Add at least one item";
    return null;
  };

  const submitAddReplacement = async (e) => {
    e.preventDefault();
    const v = validateAdd();
    if (v) return setError(v);

    try {
      setSaving(true);
      const res = await axios.post(`${API_BASE}/store-replacements`, {
        resort: selectedResort,
        storeId: addForm.storeId,
        date: todayStr(),
        status: "OPEN",
        lines: addForm.lines
          .filter((l) => l.itemId && Number(l.qty) > 0)
          .map((l) => ({
            itemId: l.itemId,
            qty: Number(l.qty),
            remark: l.remark || "",
          })),
      });

      setReplacements((p) => [res.data, ...p]);
      setAddForm({ storeId: "", lines: [newLine()] });
    } catch (err) {
      console.error("CREATE REPLACEMENT ERROR", err);
      setError("Failed to create replacement");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     ISSUE TO VENDOR
  ========================= */
  const openIssueModal = (rep) => {
    setIssueModal({
      open: true,
      replacement: rep,
      vendorId: rep.vendorId || "",
      lines: rep.lines.map((l) => ({
        lineId: l.lineId || l._id,
        itemId: l.itemId,
        replQty: l.qty,
        issueQty: l.qty - (l.issuedQty || 0),
        remark: l.remark || "",
      })),
    });
  };

  const updateIssueLine = (idx, field, value) => {
    setIssueModal((p) => {
      const arr = [...p.lines];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...p, lines: arr };
    });
  };

  const submitIssueVendor = async () => {
    if (!issueModal.vendorId)
      return setError("Vendor required");

    try {
      setSaving(true);
      const res = await axios.patch(
        `${API_BASE}/store-replacements/${issueModal.replacement._id}/issue-vendor`,
        {
          vendorId: issueModal.vendorId,
          lines: issueModal.lines.map((l) => ({
            itemId: l.itemId,
            issueQty: Number(l.issueQty || 0),
            remark: l.remark || "",
          })),
        }
      );

      setReplacements((p) =>
        p.map((x) =>
          x._id === issueModal.replacement._id ? res.data : x
        )
      );

      setIssueModal({ open: false, replacement: null });
    } catch (err) {
      console.error("ISSUE VENDOR ERROR", err);
      setError("Failed to issue to vendor");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     UI
  ========================= */
  if (!selectedResort) {
    return <div className="sa-card">Select resort first</div>;
  }

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <h2>Store Replacement</h2>
        <button onClick={loadData} className="sa-secondary-button">
          Refresh
        </button>
      </div>

      {error && <div className="sa-modal-error">{error}</div>}

      {/* ================= ADD ================= */}
      <div className="sa-card">
        <h3>Add Replacement</h3>
        <form onSubmit={submitAddReplacement}>
          <select
            value={addForm.storeId}
            onChange={(e) =>
              setAddForm((p) => ({ ...p, storeId: e.target.value }))
            }
          >
            <option value="">Select Store</option>
            {stores.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          <table className="sa-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Remark</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {addForm.lines.map((l, i) => (
                <tr key={l.lineId}>
                  <td>
                    <select
                      value={l.itemId}
                      onChange={(e) =>
                        updateAddLine(i, "itemId", e.target.value)
                      }
                    >
                      <option value="">Item</option>
                      {items.map((it) => (
                        <option key={it._id} value={it._id}>
                          {it.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={l.qty}
                      onChange={(e) =>
                        updateAddLine(i, "qty", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={l.remark}
                      onChange={(e) =>
                        updateAddLine(i, "remark", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    {addForm.lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineRow(i)}
                      >
                        ❌
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button type="button" onClick={addLineRow}>
            + Add Item
          </button>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Replacement"}
          </button>
        </form>
      </div>

      {/* ================= LIST ================= */}
      <div className="sa-card">
        <h3>Replacement List</h3>
        {loading ? (
          "Loading..."
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Items</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {replacements.map((r) => (
                <tr key={r._id}>
                  <td>
                    {stores.find((s) => s._id === r.storeId)?.name}
                  </td>
                  <td>{r.lines.length}</td>
                  <td>
                    {vendors.find((v) => v._id === r.vendorId)?.name || "-"}
                  </td>
                  <td>{r.status}</td>
                  <td>
                    <button onClick={() => openIssueModal(r)}>
                      Issue Vendor
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= ISSUE MODAL ================= */}
      {issueModal.open && (
        <div className="sa-modal-backdrop">
          <div className="sa-modal">
            <h3>Issue to Vendor</h3>

            <select
              value={issueModal.vendorId}
              onChange={(e) =>
                setIssueModal((p) => ({ ...p, vendorId: e.target.value }))
              }
            >
              <option value="">Vendor</option>
              {vendors.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.name}
                </option>
              ))}
            </select>

            <table className="sa-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Issue Qty</th>
                </tr>
              </thead>
              <tbody>
                {issueModal.lines.map((l, i) => (
                  <tr key={l.lineId}>
                    <td>
                      {items.find((it) => it._id === l.itemId)?.name}
                    </td>
                    <td>
                      <input
                        type="number"
                        value={l.issueQty}
                        onChange={(e) =>
                          updateIssueLine(i, "issueQty", e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={submitIssueVendor} disabled={saving}>
              Save
            </button>
            <button onClick={() => setIssueModal({ open: false })}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreReplacement;
