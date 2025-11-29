import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const TYPE_OPTIONS = [
  { value: "LUMPSUM", label: "Lumpsum" },
  { value: "RECIPE_LUMPSUM", label: "By Recipe – Lumpsum" },
  { value: "RECIPE_PORTION", label: "By Recipe – Portion" },
  { value: "REPLACEMENT", label: "Store Replacement" },
];

const emptyLine = () => ({ item: "", qty: "", uom: "", remarks: "" });

const ConsumptionForm = () => {
  const { id } = useParams(); // edit id (optional)
  const navigate = useNavigate();

  const [type, setType] = useState("RECIPE_LUMPSUM");
  const [resort, setResort] = useState("");
  const [department, setDepartment] = useState("");
  const [storeFrom, setStoreFrom] = useState("");
  const [storeTo, setStoreTo] = useState("");
  const [eventName, setEventName] = useState("");
  const [menuName, setMenuName] = useState("");
  const [pax, setPax] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");

  const [lines, setLines] = useState([emptyLine()]);

  const [resorts, setResorts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // load dropdown masters
  const loadMasters = async () => {
    try {
      const [resortRes, deptRes, storeRes, itemRes] = await Promise.all([
        axios.get(`${API_BASE}/api/resorts`),
        axios.get(`${API_BASE}/api/departments`),
        axios.get(`${API_BASE}/api/stores`),
        axios.get(`${API_BASE}/api/items`),
      ]);
      setResorts(Array.isArray(resortRes.data) ? resortRes.data : []);
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      setStores(Array.isArray(storeRes.data) ? storeRes.data : []);
      setItems(Array.isArray(itemRes.data) ? itemRes.data : []);
    } catch (err) {
      console.error("load masters error", err);
      // non-fatal - dropdowns may be empty
    }
  };

  // load existing consumption when editing
  const loadExisting = async () => {
    if (!id) return;
    try {
      const res = await axios.get(`${API_BASE}/api/consumption/${id}`);
      const c = res.data || {};
      setType(c.type || "RECIPE_LUMPSUM");
      setResort(c.resort?._id || c.resort || "");
      setDepartment(c.department?._id || c.department || "");
      setStoreFrom(c.storeFrom?._id || c.storeFrom || "");
      setStoreTo(c.storeTo?._id || c.storeTo || "");
      setEventName(c.eventName || "");
      setMenuName(c.menuName || "");
      setPax(c.pax || "");
      setDate(c.date ? c.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setReferenceNo(c.referenceNo || "");
      setNotes(c.notes || "");
      setLines(
        (c.lines || []).map((ln) => ({
          item: ln.item?._id || ln.item || "",
          qty: ln.qty ?? "",
          uom: ln.uom || "",
          remarks: ln.remarks || "",
        })) || [emptyLine()]
      );
    } catch (err) {
      console.error("load consumption error", err);
      setError("Failed to load existing consumption entry");
    }
  };

  useEffect(() => {
    loadMasters();
    loadExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handle line changes; auto-fill uom when item selected
  const handleLineChange = (index, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };

      if (field === "item") {
        const it = items.find((i) => (i._id || i.id) === value);
        if (it) row.uom = it.uom || row.uom;
      }

      next[index] = row;
      return next;
    });
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const validate = () => {
    if (!resort) {
      setError("Resort is required.");
      return false;
    }
    if (!type) {
      setError("Type is required.");
      return false;
    }

    // storeFrom required for most types except possibly LUMPSUM? We'll require it for all consumption types.
    if (!storeFrom) {
      setError("Store From is required.");
      return false;
    }

    if (type === "REPLACEMENT") {
      if (!storeTo) {
        setError("Store To is required for replacement.");
        return false;
      }
      if (!referenceNo) {
        setError("Reference No. is required for replacement.");
        return false;
      }
    }

    if (type === "RECIPE_LUMPSUM" || type === "RECIPE_PORTION") {
      // require menuName or eventName (prefer menu)
      if (!menuName && !eventName) {
        setError("Please provide Menu Name or Event Name for recipe consumption.");
        return false;
      }
      // pax required for recipe lumpsum
      if (type === "RECIPE_LUMPSUM" && (!pax || Number(pax) <= 0)) {
        setError("Pax is required and must be > 0 for Lumpsum by Recipe.");
        return false;
      }
    }

    // lines validation
    const validLines = lines.filter((ln) => ln.item && ln.qty && Number(ln.qty) > 0);
    if (validLines.length === 0) {
      setError("Add at least one item line with quantity.");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      type,
      resort,
      department: department || undefined,
      storeFrom,
      storeTo: type === "REPLACEMENT" ? storeTo : undefined,
      eventName: type === "REPLACEMENT" ? undefined : eventName || undefined,
      menuName: type === "REPLACEMENT" ? undefined : menuName || undefined,
      pax: type === "RECIPE_LUMPSUM" ? Number(pax) : undefined,
      referenceNo: type === "REPLACEMENT" ? referenceNo : undefined,
      date,
      notes: notes || undefined,
      lines: lines
        .filter((ln) => ln.item && ln.qty && Number(ln.qty) > 0)
        .map((ln) => ({
          item: ln.item,
          qty: Number(ln.qty),
          uom: ln.uom || "",
          remarks: ln.remarks || "",
        })),
    };

    try {
      setSaving(true);
      if (id) {
        await axios.put(`${API_BASE}/api/consumption/${id}`, payload);
      } else {
        await axios.post(`${API_BASE}/api/consumption`, payload);
      }
      navigate("/super-admin/consumption");
    } catch (err) {
      console.error("save consumption error", err);
      setError(err.response?.data?.message || "Failed to save consumption entry");
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = id ? "Edit Consumption" : "New Consumption";

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>{pageTitle}</h2>
          <p>
            {type === "REPLACEMENT"
              ? "Record stock movement between stores."
              : "Record stock consumption (lumpsum / recipe lumpsum / portion)."}
          </p>
        </div>
      </div>

      <form className="sa-card" onSubmit={handleSubmit}>
        {/* top grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)} required>
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Resort
            <select value={resort} onChange={(e) => setResort(e.target.value)} required>
              <option value="">Select resort</option>
              {resorts.map((r) => (
                <option key={r._id || r.id} value={r._id || r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Department (optional)
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">--</option>
              {departments.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>

          {/* Conditional fields based on type */}
          {type === "REPLACEMENT" ? (
            <label>
              Reference No.
              <input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="e.g. REP-2025-001" />
            </label>
          ) : (
            <>
              <label>
                Event / Function Name
                <input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Wedding Dinner / Conference..." />
              </label>

              <label>
                Menu Name
                <input value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder="Buffet A / Set Menu B..." />
              </label>

              {type === "RECIPE_LUMPSUM" && (
                <label>
                  Pax (No. of people)
                  <input type="number" min="1" value={pax} onChange={(e) => setPax(e.target.value)} />
                </label>
              )}
            </>
          )}

          <label>
            Store From
            <select value={storeFrom} onChange={(e) => setStoreFrom(e.target.value)} required>
              <option value="">Select store</option>
              {stores.map((s) => (
                <option key={s._id || s.id} value={s._id || s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          {type === "REPLACEMENT" && (
            <label>
              Store To
              <select value={storeTo} onChange={(e) => setStoreTo(e.target.value)} required>
                <option value="">Select store</option>
                {stores.map((s) => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <label>
            Notes (optional)
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any remarks..." />
          </label>
        </div>

        {/* Lines */}
        <h3 style={{ marginBottom: 8 }}>Items</h3>
        <div className="sa-card" style={{ padding: 12, marginBottom: 16 }}>
          <table className="sa-table">
            <thead>
              <tr>
                <th style={{ width: "35%" }}>Item</th>
                <th style={{ width: "15%" }}>Qty</th>
                <th style={{ width: "15%" }}>UOM</th>
                <th>Remarks</th>
                <th style={{ width: "5%" }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((ln, idx) => (
                <tr key={idx}>
                  <td>
                    <select
                      value={ln.item}
                      onChange={(e) => handleLineChange(idx, "item", e.target.value)}
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
                      onChange={(e) => handleLineChange(idx, "qty", e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      value={ln.uom}
                      onChange={(e) => handleLineChange(idx, "uom", e.target.value)}
                      placeholder="Kg / Ltr / Nos"
                    />
                  </td>
                  <td>
                    <input
                      value={ln.remarks}
                      onChange={(e) => handleLineChange(idx, "remarks", e.target.value)}
                      placeholder="optional"
                    />
                  </td>
                  <td>
                    {lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(idx)} className="sa-secondary-button">
                        -
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button type="button" className="sa-secondary-button" style={{ marginTop: 8 }} onClick={addLine}>
            + Add Item
          </button>
        </div>

        {error && (
          <div className="sa-modal-error" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div className="sa-modal-actions" style={{ marginTop: 8 }}>
          <button type="button" className="sa-secondary-button" onClick={() => navigate("/super-admin/consumption")} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="sa-primary-button" disabled={saving}>
            {saving ? "Saving..." : "Save Consumption"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConsumptionForm;
