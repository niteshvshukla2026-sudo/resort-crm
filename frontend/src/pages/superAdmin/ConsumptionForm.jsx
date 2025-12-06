// src/pages/superAdmin/ConsumptionForm.jsx
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

const emptyLine = () => ({
  category: "",
  item: "",
  qty: "",
  uom: "",
  remarks: "",
});

const ConsumptionForm = () => {
  const { id } = useParams(); // edit id (optional)
  const navigate = useNavigate();

  const [type, setType] = useState("LUMPSUM");
  const [storeFrom, setStoreFrom] = useState("");
  const [storeTo, setStoreTo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const [lines, setLines] = useState([emptyLine()]);

  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ---- master data ----
  const loadMasters = async () => {
    try {
      const [storeRes, itemRes] = await Promise.all([
        axios.get(`${API_BASE}/api/stores`),
        axios.get(`${API_BASE}/api/items`),
      ]);
      setStores(Array.isArray(storeRes.data) ? storeRes.data : []);
      setItems(Array.isArray(itemRes.data) ? itemRes.data : []);
    } catch (err) {
      console.error("load masters error", err);
      // non-fatal
    }
  };

  // ---- existing entry (edit mode) ----
  const loadExisting = async () => {
    if (!id) return;
    try {
      const res = await axios.get(`${API_BASE}/api/consumption/${id}`);
      const c = res.data || {};
      setType(c.type || "LUMPSUM");
      setStoreFrom(c.storeFrom?._id || c.storeFrom || "");
      setStoreTo(c.storeTo?._id || c.storeTo || "");
      setReferenceNo(c.referenceNo || "");
      setDate(c.date ? c.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setNotes(c.notes || "");
      setLines(
        (c.lines || []).map((ln) => ({
          category: "", // we don't store category in backend; user can pick if needed
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

  // ---- derived: item categories ----
  const itemCategories = Array.from(
    new Set(
      items
        .map(
          (it) =>
            it.category ||
            it.itemCategory ||
            it.categoryName ||
            it.categoryId ||
            ""
        )
        .filter(Boolean)
    )
  );

  // ---- line changes ----
  const handleLineChange = (index, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      let row = { ...next[index] };

      if (field === "category") {
        row.category = value;
        // reset item & uom when category changes
        row.item = "";
        row.uom = "";
      } else if (field === "item") {
        row.item = value;
        const it = items.find((i) => (i._id || i.id) === value);
        if (it) {
          row.uom = it.uom || row.uom;
        }
      } else {
        row[field] = value;
      }

      next[index] = row;
      return next;
    });
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  // ---- validation ----
  const validate = () => {
    if (!type) {
      setError("Type is required.");
      return false;
    }

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

    const validLines = lines.filter((ln) => ln.item && ln.qty && Number(ln.qty) > 0);
    if (validLines.length === 0) {
      setError("Add at least one item line with quantity.");
      return false;
    }

    setError("");
    return true;
  };

  // ---- submit ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      type,
      storeFrom,
      storeTo: type === "REPLACEMENT" ? storeTo : undefined,
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
              : "Record stock consumption (lumpsum / recipe / portion)."}
          </p>
        </div>
      </div>

      <form className="sa-card" onSubmit={handleSubmit}>
        {/* Top grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
            Date
            {/* date is not editable */}
            <input type="date" value={date} disabled />
          </label>

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

          {type === "REPLACEMENT" && (
            <label>
              Reference No.
              <input
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. REP-2025-001"
              />
            </label>
          )}
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <label>
            Notes (optional)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any remarks..."
            />
          </label>
        </div>

        {/* Lines */}
        <h3 style={{ marginBottom: 8 }}>Items</h3>
        <div className="sa-card" style={{ padding: 12, marginBottom: 16 }}>
          <table className="sa-table">
            <thead>
              <tr>
                <th style={{ width: "20%" }}>Category</th>
                <th style={{ width: "30%" }}>Item</th>
                <th style={{ width: "15%" }}>Qty</th>
                <th style={{ width: "15%" }}>UOM</th>
                <th>Remarks</th>
                <th style={{ width: "5%" }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((ln, idx) => {
                const filteredItems = items.filter((it) => {
                  const cat =
                    it.category ||
                    it.itemCategory ||
                    it.categoryName ||
                    it.categoryId ||
                    "";
                  if (!ln.category) return true;
                  return cat === ln.category;
                });

                return (
                  <tr key={idx}>
                    {/* Category dropdown */}
                    <td>
                      <select
                        value={ln.category}
                        onChange={(e) => handleLineChange(idx, "category", e.target.value)}
                      >
                        <option value="">Select category</option>
                        {itemCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Item dropdown (filtered by category) */}
                    <td>
                      <select
                        value={ln.item}
                        onChange={(e) => handleLineChange(idx, "item", e.target.value)}
                        required
                      >
                        <option value="">Select item</option>
                        {filteredItems.map((it) => (
                          <option key={it._id || it.id} value={it._id || it.id}>
                            {it.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Qty */}
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={ln.qty}
                        onChange={(e) => handleLineChange(idx, "qty", e.target.value)}
                        required
                      />
                    </td>

                    {/* UOM auto from item, read-only */}
                    <td>
                      <input
                        value={ln.uom}
                        readOnly
                        placeholder="Auto"
                        style={{ backgroundColor: "#020617", opacity: 0.85 }}
                      />
                    </td>

                    {/* Remarks */}
                    <td>
                      <input
                        value={ln.remarks}
                        onChange={(e) => handleLineChange(idx, "remarks", e.target.value)}
                        placeholder="optional"
                      />
                    </td>

                    <td>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="sa-secondary-button"
                        >
                          -
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
          <div className="sa-modal-error" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div className="sa-modal-actions" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="sa-secondary-button"
            onClick={() => navigate("/super-admin/consumption")}
            disabled={saving}
          >
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
