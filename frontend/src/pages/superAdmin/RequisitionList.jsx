// src/pages/superAdmin/RequisitionListNew.jsx
// ✅ CLEAN, SIMPLE, NEW REQUISITION LIST (NO LEGACY LOGIC)

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

  /* ---------------- LOAD DATA ---------------- */
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
      setError("Failed to load requisitions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  /* ---------------- SAVE ---------------- */
  const save = async () => {
    try {
      setError("");

      if (!selectedResort || selectedResort === "ALL") {
        return setError("Select resort first");
      }

      if (form.lines.length === 0) return setError("Add at least one item");

      const payload = {
        type: form.type,
        resort: selectedResort,
        fromStore: form.type === "INTERNAL" ? form.fromStore : undefined,
        toStore: form.type === "INTERNAL" ? form.toStore : undefined,
        vendor: form.type === "VENDOR" ? form.vendor : undefined,
        store: form.type === "VENDOR" ? form.store : undefined,
        requiredBy: form.requiredBy,
        lines: form.lines.map((l) => ({
          item: l.item,
          qty: Number(l.qty),
          remark: l.remark,
        })),
      };

      const res = await axios.post(`${API}/requisitions`, payload);
      setList((p) => [res.data, ...p]);
      setShowForm(false);
      setForm({ type: "INTERNAL", fromStore: "", toStore: "", vendor: "", store: "", requiredBy: "", lines: [emptyLine()] });
    } catch (e) {
      setError(e.response?.data?.message || "Save failed");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <h2>Requisitions (New)</h2>
        <button className="sa-primary-button" onClick={() => setShowForm(true)}>+ New</button>
      </div>

      {error && <div className="sa-modal-error">{error}</div>}

      <div className="sa-card">
        {loading ? "Loading..." : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r._id}>
                  <td>{r.requisitionNo || r._id}</td>
                  <td>{r.type}</td>
                  <td>{r.status || "PENDING"}</td>
                  <td>
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

            <label>Type
              <select name="type" value={form.type} onChange={updateForm}>
                <option value="INTERNAL">Internal</option>
                <option value="VENDOR">Vendor</option>
              </select>
            </label>

            {form.type === "INTERNAL" && (
              <>
                <label>From Store
                  <select name="fromStore" value={form.fromStore} onChange={updateForm}>
                    <option value="">--select--</option>
                    {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </label>
                <label>To Store
                  <select name="toStore" value={form.toStore} onChange={updateForm}>
                    <option value="">--select--</option>
                    {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </label>
              </>
            )}

            {form.type === "VENDOR" && (
              <>
                <label>Vendor
                  <select name="vendor" value={form.vendor} onChange={updateForm}>
                    <option value="">--select--</option>
                    {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                  </select>
                </label>
                <label>Store
                  <select name="store" value={form.store} onChange={updateForm}>
                    <option value="">--select--</option>
                    {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </label>
              </>
            )}

            <table className="sa-table">
              <thead><tr><th>Item</th><th>Qty</th><th>Remark</th></tr></thead>
              <tbody>
                {form.lines.map((l, i) => (
                  <tr key={i}>
                    <td>
                      <select value={l.item} onChange={(e) => updateLine(i, "item", e.target.value)}>
                        <option value="">--item--</option>
                        {items.map(it => <option key={it._id} value={it._id}>{it.name}</option>)}
                      </select>
                    </td>
                    <td><input type="number" value={l.qty} onChange={(e) => updateLine(i, "qty", e.target.value)} /></td>
                    <td><input value={l.remark} onChange={(e) => updateLine(i, "remark", e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={addLine}>+ Add Item</button>

            <div className="sa-modal-actions">
              <button onClick={() => setShowForm(false)}>Cancel</button>
              <button className="sa-primary-button" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequisitionListNew;
