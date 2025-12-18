// src/pages/superAdmin/RequisitionListNew.jsx
// ✅ COMPLETE CLEAN REQUISITION SYSTEM (APPROVAL + PO + GRN + STOCK READY)

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useResort } from "../../context/ResortContext";

const API = (import.meta.env.VITE_API_BASE || "http://localhost:5000") + "/api";

const emptyLine = () => ({ item: "", qty: 1, remark: "" });

const RequisitionListNew = () => {
  const navigate = useNavigate();
  const { selectedResort } = useResort();

  const [list, setList] = useState([]);
  const [stores, setStores] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "INTERNAL",
    fromStore: "",
    toStore: "",
    vendor: "",
    store: "",
    requiredBy: "",
    lines: [emptyLine()],
  });

  /* ---------------- LOAD ---------------- */
  const load = async () => {
    try {
      setLoading(true);
      const [req, st, vd, it] = await Promise.all([
        axios.get(`${API}/requisitions`),
        axios.get(`${API}/stores`),
        axios.get(`${API}/vendors`),
        axios.get(`${API}/items`),
      ]);
      setList(req.data || []);
      setStores(st.data || []);
      setVendors(vd.data || []);
      setItems(it.data || []);
    } catch (e) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ---------------- FORM ---------------- */
  const updateForm = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const updateLine = (i, k, v) => {
    setForm((p) => {
      const lines = [...p.lines];
      lines[i][k] = v;
      return { ...p, lines };
    });
  };

  const addLine = () => setForm((p) => ({ ...p, lines: [...p.lines, emptyLine()] }));

  /* ---------------- CREATE ---------------- */
  const save = async () => {
    try {
      setError("");
      if (!selectedResort || selectedResort === "ALL") return setError("Select resort first");

      const payload = {
        type: form.type,
        resort: selectedResort,
        fromStore: form.type === "INTERNAL" ? form.fromStore : undefined,
        toStore: form.type === "INTERNAL" ? form.toStore : undefined,
        vendor: form.type === "VENDOR" ? form.vendor : undefined,
        store: form.type === "VENDOR" ? form.store : undefined,
        requiredBy: form.requiredBy,
        lines: form.lines.map((l) => ({ item: l.item, qty: Number(l.qty), remark: l.remark })),
      };

      setSaving(true);
      const res = await axios.post(`${API}/requisitions`, payload);
      setList((p) => [res.data, ...p]);
      setShowForm(false);
    } catch (e) {
      setError(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- STATUS ---------------- */
  const updateStatus = async (id, action) => {
    try {
      const res = await axios.post(`${API}/requisitions/${id}/${action}`);
      setList((p) => p.map((r) => (r._id === id ? res.data : r)));
    } catch {
      setError("Status update failed");
    }
  };

  /* ---------------- PO ---------------- */
  const createPO = async (r) => {
    try {
      setSaving(true);
      const res = await axios.post(`${API}/requisitions/${r._id}/create-po`, {
        poNo: `PO-${Date.now()}`,
      });
      navigate(`/super-admin/po/${res.data._id}`);
    } catch {
      setError("PO creation failed");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- GRN ---------------- */
  const createGRN = async (r) => {
    try {
      setSaving(true);
      const res = await axios.post(`${API}/requisitions/${r._id}/create-grn`, {
        grnNo: `GRN-${Date.now()}`,
        challanNo: "AUTO",
        store: r.store || r.toStore,
        items: r.lines.map((l) => ({ item: l.item, qtyRequested: l.qty, qtyReceived: l.qty })),
      });
      navigate(`/super-admin/grn/${res.data._id}`);
    } catch {
      setError("GRN creation failed");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <h2>Requisitions (Clean)</h2>
        <button className="sa-primary-button" onClick={() => setShowForm(true)}>+ New</button>
      </div>

      {error && <div className="sa-modal-error">{error}</div>}

      <div className="sa-card">
        {loading ? "Loading..." : (
          <table className="sa-table">
            <thead>
              <tr><th>No</th><th>Type</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r._id}>
                  <td>{r.requisitionNo || r._id}</td>
                  <td>{r.type}</td>
                  <td>{r.status || "PENDING"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button onClick={() => updateStatus(r._id, "approve")}>Approve</button>
                    <button onClick={() => updateStatus(r._id, "reject")}>Reject</button>
                    {r.type === "VENDOR" && <button onClick={() => createPO(r)}>PO</button>}
                    {r.type === "VENDOR" && <button onClick={() => createGRN(r)}>GRN</button>}
                    <button onClick={() => navigate(`/super-admin/requisition/${r._id}`)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="sa-modal-backdrop">
          <div className="sa-modal">
            <h3>Create Requisition</h3>

            <select name="type" value={form.type} onChange={updateForm}>
              <option value="INTERNAL">Internal</option>
              <option value="VENDOR">Vendor</option>
            </select>

            {form.type === "INTERNAL" && (
              <>
                <select name="fromStore" value={form.fromStore} onChange={updateForm}>
                  <option value="">From Store</option>
                  {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <select name="toStore" value={form.toStore} onChange={updateForm}>
                  <option value="">To Store</option>
                  {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </>
            )}

            {form.type === "VENDOR" && (
              <>
                <select name="vendor" value={form.vendor} onChange={updateForm}>
                  <option value="">Vendor</option>
                  {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
                <select name="store" value={form.store} onChange={updateForm}>
                  <option value="">Store</option>
                  {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </>
            )}

            <table className="sa-table">
              <tbody>
                {form.lines.map((l, i) => (
                  <tr key={i}>
                    <td>
                      <select value={l.item} onChange={(e) => updateLine(i, "item", e.target.value)}>
                        <option value="">Item</option>
                        {items.map(it => <option key={it._id} value={it._id}>{it.name}</option>)}
                      </select>
                    </td>
                    <td><input type="number" value={l.qty} onChange={(e) => updateLine(i, "qty", e.target.value)} /></td>
                    <td><input value={l.remark} onChange={(e) => updateLine(i, "remark", e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={addLine}>+ Item</button>

            <div className="sa-modal-actions">
              <button onClick={() => setShowForm(false)}>Cancel</button>
              <button className="sa-primary-button" onClick={save} disabled={saving}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ==================================================
   🔐 PERMISSIONS (FRONTEND PLACEHOLDER)
   Replace these with real role checks from auth context
================================================== */
const canApprove = () => true;
const canCreatePO = () => true;
const canCreateGRN = () => true;

export default RequisitionListNew;
