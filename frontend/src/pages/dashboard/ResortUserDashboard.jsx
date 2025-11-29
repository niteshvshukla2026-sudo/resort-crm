import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * ResortUserDashboard.jsx
 * Paste/replace your existing file with this.
 *
 * Uses your project's "sa-*" CSS utility classes (same style as Super Admin).
 * For quick testing it sends header 'x-demo-user' (demo auth). Replace with AuthContext in production.
 */

const API_BASE = import.meta.env.VITE_API_BASE || "";

const demoUser = { id: "user_1", name: "Amit", role: "RESORT_USER", resorts: ["resort_1"] };

const KPIBox = ({ title, value, hint }) => (
  <div className="sa-card" style={{ padding: 18, borderRadius: 12 }}>
    <div style={{ fontSize: 13, color: "#98a1b3" }}>{title}</div>
    <div style={{ marginTop: 12, fontSize: 28, fontWeight: 700 }}>{value}</div>
    {hint && <div style={{ marginTop: 8, fontSize: 12, color: "#6b7a93" }}>{hint}</div>}
  </div>
);

const ResortUserDashboard = () => {
  const [resorts, setResorts] = useState([]);
  const [currentResort, setCurrentResort] = useState("");
  const [kpi, setKpi] = useState({});
  const [requisitions, setRequisitions] = useState([]);
  const [pos, setPos] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // modal state
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    resort: "",
    department: "",
    store: "",
    requiredBy: "",
    lines: [{ lineId: `ln_${Date.now()}`, item: "", qty: 1, remark: "" }],
    type: "INTERNAL", // INTERNAL or VENDOR
    vendor: ""
  });

  // helper to load data
  const demoHeader = { headers: { "x-demo-user": JSON.stringify(demoUser) } };

  useEffect(() => {
    // load resorts (backend /api/resorts)
    const init = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/resorts`).catch(() => ({ data: [{ _id: "resort_1", name: "Blue Lagoon" }] }));
        setResorts(res.data || []);
        // choose first resort that demoUser has or first returned
        const pick = (demoUser.resorts && demoUser.resorts[0]) || (res.data && res.data[0] && res.data[0]._id);
        setCurrentResort(pick || "");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!currentResort) return;
    fetchAll(currentResort);
  }, [currentResort]);

  const fetchAll = async (resortId) => {
    try {
      setLoading(true);
      const [kRes, reqRes, poRes, itRes] = await Promise.all([
        axios.get(`${API_BASE}/api/dashboard/resort/${resortId}/kpi`, demoHeader).catch(() => ({ data: { openRequisitions: 0, pendingApprovals: 0, openPOs: 0, lowStockCount: 0 } })),
        axios.get(`${API_BASE}/api/requisitions?createdBy=${demoUser.id}&resort=${resortId}`, demoHeader).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/po?resort=${resortId}`, demoHeader).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/items?resort=${resortId}`, demoHeader).catch(() => ({ data: [] }))
      ]);

      setKpi(kRes.data || {});
      setRequisitions(reqRes.data || []);
      setPos(poRes.data || []);
      setItems(itRes.data || []);
    } catch (e) {
      console.error("fetchAll error", e);
    } finally {
      setLoading(false);
    }
  };

  // Modal helpers (requisition form)
  const addLine = () => {
    setForm((p) => ({ ...p, lines: [...p.lines, { lineId: `ln_${Date.now()}_${Math.random()}`, item: "", qty: 1, remark: "" }] }));
  };
  const removeLine = (idx) => setForm((p) => ({ ...p, lines: p.lines.filter((_, i) => i !== idx) }));
  const updateLine = (idx, field, value) => {
    setForm((p) => {
      const lines = [...p.lines];
      lines[idx][field] = value;
      return { ...p, lines };
    });
  };

  const openForm = () => {
    setFormError("");
    setForm({
      resort: currentResort || "",
      department: "",
      store: "",
      requiredBy: "",
      lines: [{ lineId: `ln_${Date.now()}`, item: "", qty: 1, remark: "" }],
      type: "INTERNAL",
      vendor: ""
    });
    setShowForm(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.resort) return setFormError("Select resort");
    if (!form.lines || form.lines.length === 0) return setFormError("Add at least one item line");

    // basic validation for vendor type
    if (form.type === "VENDOR" && !form.vendor) return setFormError("Select vendor for vendor requisition");

    try {
      setSaving(true);
      const payload = {
        resort: form.resort,
        department: form.department,
        store: form.store,
        requiredBy: form.requiredBy || new Date(),
        type: form.type,
        vendor: form.vendor || null,
        lines: form.lines.map((l) => ({ item: l.item, qty: Number(l.qty) || 1, remark: l.remark }))
      };
      const res = await axios.post(`${API_BASE}/api/requisitions`, payload, demoHeader);
      // refresh lists
      fetchAll(form.resort);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || "Failed to create requisition");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sa-page">
      {/* Header area: match super admin style */}
      <div className="sa-page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0 }}>Resort Dashboard</h2>
          <p style={{ margin: "4px 0 0 0", color: "#9aa3b2" }}>Quick overview & actions for your assigned resort</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Resort switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ color: "#98a1b3", fontSize: 13 }}>Current Resort</div>
            <select
              value={currentResort || ""}
              onChange={(e) => setCurrentResort(e.target.value)}
              style={{ background: "#0f1720", color: "#fff", borderRadius: 6, padding: "8px 10px", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <option value="">-- Select Resort --</option>
              {resorts.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>

          <button className="sa-primary-button" onClick={openForm} style={{ background: "#16a34a", borderRadius: 20, padding: "8px 16px" }}>
            + New Requisition
          </button>
        </div>
      </div>

      {/* KPIs row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 18 }}>
        <KPIBox title="Open Requisitions" value={kpi.openRequisitions ?? 0} hint="Waiting for approval" />
        <KPIBox title="Pending Approvals" value={kpi.pendingApprovals ?? 0} hint="Need your review" />
        <KPIBox title="Open POs" value={kpi.openPOs ?? 0} hint="POs open for receipt" />
        <KPIBox title="Low Stock Items" value={kpi.lowStockCount ?? 0} hint="Below reorder level" />
      </div>

      {/* Main content: left - requisitions list; right - POs & items */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginTop: 20 }}>
        {/* Left: Requisition list */}
        <div className="sa-card" style={{ padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>My Recent Requisitions</h3>

          {loading ? (
            <div>Loading...</div>
          ) : requisitions.length === 0 ? (
            <div className="text-muted">No requisitions created by you.</div>
          ) : (
            <table className="sa-table" style={{ width: "100%", marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Req No</th>
                  <th>Lines</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.map((r) => (
                  <tr key={r._id}>
                    <td>{r.requisitionNo}</td>
                    <td>{r.lines?.map(l => `${l.item} x ${l.qty}`).join(", ")}</td>
                    <td><span style={{ padding: "4px 8px", borderRadius: 12, background: "#0b1220", color: "#fff" }}>{r.status}</span></td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column: POs and Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="sa-card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>Open POs</h3>
            {pos.length === 0 ? (
              <div className="text-muted">No open POs for this resort.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {pos.map((p) => (
                  <li key={p._id} style={{ padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.01)", marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{p.poNo}</div>
                    <div style={{ color: "#98a1b3", fontSize: 13 }}>{p.vendor || "Vendor"}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#6b7a93" }}>{p.status}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sa-card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>Low / Important Items</h3>
            {items.length === 0 ? (
              <div className="text-muted">No items data.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {items.slice(0, 6).map((it) => (
                  <li key={it._id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{it.name}</div>
                      <div style={{ color: "#98a1b3", fontSize: 12 }}>{it.sku || ""}</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>{Object.values(it.stockByStore || {}).reduce((a,b) => a + b, 0)} in stock</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Requisition Modal */}
      {showForm && (
        <div className="sa-modal-backdrop" onClick={() => !saving && setShowForm(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900 }}>
            <h3>Create Requisition</h3>
            <p className="sa-modal-sub">Fill the following details to raise a requisition.</p>

            <form className="sa-modal-form" onSubmit={submitForm}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>
                  Resort
                  <select name="resort" value={form.resort} onChange={(e) => setForm((p)=>({ ...p, resort: e.target.value }))} required>
                    <option value="">-- Select Resort --</option>
                    {resorts.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </label>

                <label>
                  Requisition Type
                  <select name="type" value={form.type} onChange={(e) => setForm((p)=>({ ...p, type: e.target.value }))}>
                    <option value="INTERNAL">Internal (Store to Store)</option>
                    <option value="VENDOR">Vendor (Buy from vendor)</option>
                  </select>
                </label>

                <label>
                  Department
                  <input name="department" value={form.department} onChange={(e)=>setForm(p=>({...p, department: e.target.value}))} />
                </label>

                <label>
                  Store
                  <input name="store" value={form.store} onChange={(e)=>setForm(p=>({...p, store: e.target.value}))} />
                </label>

                {form.type === "VENDOR" && (
                  <label style={{ gridColumn: "1 / -1" }}>
                    Vendor
                    <input name="vendor" value={form.vendor} onChange={(e)=>setForm(p=>({...p, vendor: e.target.value}))} placeholder="Vendor name or id" />
                  </label>
                )}

                <label>
                  Required By
                  <input type="date" name="requiredBy" value={form.requiredBy} onChange={(e)=>setForm(p=>({...p, requiredBy: e.target.value}))} />
                </label>
              </div>

              {/* Items lines */}
              <div style={{ marginTop: 12 }}>
                <table className="sa-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Remark</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.lines.map((ln, idx) => (
                      <tr key={ln.lineId}>
                        <td>
                          <input value={ln.item} onChange={(e)=>updateLine(idx, "item", e.target.value)} placeholder="Item id or name" required />
                        </td>
                        <td>
                          <input type="number" min="1" value={ln.qty} onChange={(e)=>updateLine(idx, "qty", e.target.value)} required />
                        </td>
                        <td>
                          <input value={ln.remark} onChange={(e)=>updateLine(idx, "remark", e.target.value)} />
                        </td>
                        <td>
                          {form.lines.length > 1 && <button type="button" onClick={()=>removeLine(idx)}>Remove</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button type="button" onClick={addLine} style={{ marginTop: 8 }} className="sa-secondary-button">+ Add Line</button>
              </div>

              {formError && <div className="sa-modal-error" style={{ marginTop: 8 }}>{formError}</div>}

              <div className="sa-modal-actions" style={{ marginTop: 12 }}>
                <button type="button" className="sa-secondary-button" onClick={() => !saving && setShowForm(false)}>Cancel</button>
                <button type="submit" className="sa-primary-button" disabled={saving}>{saving ? "Saving..." : "Save Requisition"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResortUserDashboard;
