// src/pages/superAdmin/ConsumptionForm.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const TYPE_OPTIONS = [
  { value: "LUMPSUM", label: "Lumpsum" },
  { value: "RECIPE_LUMPSUM", label: "By Recipe – Lumpsum" },
  { value: "RECIPE_PORTION", label: "By Recipe – Portion" },
];

// now also supports recipe field
const emptyLine = () => ({
  category: "",
  item: "",
  recipe: "",
  qty: "",
  uom: "",
  remarks: "",
});

const ConsumptionForm = () => {
  const { id } = useParams(); // edit id (optional)
  const navigate = useNavigate();

  const [type, setType] = useState("LUMPSUM");
  const [storeFrom, setStoreFrom] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [referenceNo, setReferenceNo] = useState(""); // optional kept

  const [lines, setLines] = useState([emptyLine()]);

  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isRecipeType = type === "RECIPE_LUMPSUM" || type === "RECIPE_PORTION";

  // ---- master data ----
  const loadMasters = async () => {
    try {
      const [storeRes, itemRes, recipeRes] = await Promise.all([
        axios.get(`${API_BASE}/api/stores`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/items`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/recipes`).catch(() => ({ data: [] })),
      ]);

      setStores(Array.isArray(storeRes.data) ? storeRes.data : []);
      setItems(Array.isArray(itemRes.data) ? itemRes.data : []);
      setRecipes(Array.isArray(recipeRes.data) ? recipeRes.data : []);
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
      const existingType = c.type || "LUMPSUM";
      const entryIsRecipeType =
        existingType === "RECIPE_LUMPSUM" || existingType === "RECIPE_PORTION";

      setType(existingType);
      setStoreFrom(c.storeFrom?._id || c.storeFrom || "");
      setDate(c.date ? c.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setNotes(c.notes || "");
      setReferenceNo(c.referenceNo || "");

      setLines(
        (c.lines || []).map((ln) => ({
          category: "",
          recipe: entryIsRecipeType ? ln.recipe?._id || ln.recipe || "" : "",
          item: !entryIsRecipeType ? ln.item?._id || ln.item || "" : "",
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

  // ---- derived: item categories (id + name) ----
  // Build a map from item master so we render friendly category names
  const categoryMap = {};
  items.forEach((it) => {
    if (!it) return;
    // try common possible fields for category id and label
    const id =
      it.categoryId ||
      it.category ||
      it.itemCategory ||
      (typeof it.category === "string" ? it.category : "");
    const name =
      it.categoryName ||
      it.categoryLabel ||
      it.itemCategoryName ||
      it.category ||
      id;
    if (id) categoryMap[id] = name;
  });
  const itemCategories = Object.keys(categoryMap).map((k) => ({
    id: k,
    name: categoryMap[k],
  }));

  // ---- line changes ----
  const handleLineChange = (index, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      let row = { ...next[index] };

      if (field === "category") {
        row.category = value;
        row.item = "";
        row.uom = "";
      } else if (field === "item") {
        row.item = value;
        const it = items.find((i) => (i._id || i.id) === value);
        if (it) {
          // common possible uom fields (adjust if your master uses a different key)
          row.uom = it.uom || it.UOM || it.unit || it.unitOfMeasure || it.measure || row.uom || "";
          // keep category in sync if possible
          const catId =
            it.categoryId ||
            it.category ||
            it.itemCategory ||
            "";
          if (catId) row.category = catId;
        } else {
          row.uom = row.uom || "";
        }
      } else if (field === "recipe") {
        row.recipe = value;
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

    let validLines;
    if (isRecipeType) {
      validLines = lines.filter((ln) => ln.recipe && ln.qty && Number(ln.qty) > 0);
    } else {
      validLines = lines.filter((ln) => ln.item && ln.qty && Number(ln.qty) > 0);
    }

    if (validLines.length === 0) {
      setError(isRecipeType ? "Add at least one recipe with quantity." : "Add at least one item line with quantity.");
      return false;
    }

    setError("");
    return true;
  };

  // ---- submit ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    let linePayload;
    if (isRecipeType) {
      // for recipe types, send recipe + qty + remarks
      linePayload = lines
        .filter((ln) => ln.recipe && ln.qty && Number(ln.qty) > 0)
        .map((ln) => ({
          recipe: ln.recipe,
          qty: Number(ln.qty),
          remarks: ln.remarks || "",
        }));
    } else {
      // for normal types, send item + qty + uom + remarks
      linePayload = lines
        .filter((ln) => ln.item && ln.qty && Number(ln.qty) > 0)
        .map((ln) => ({
          item: ln.item,
          qty: Number(ln.qty),
          uom: ln.uom || "",
          remarks: ln.remarks || "",
        }));
    }

    const payload = {
      type,
      storeFrom,
      date,
      notes: notes || undefined,
      referenceNo: referenceNo || undefined,
      lines: linePayload,
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
          <p>{isRecipeType ? "Record stock consumption by recipe." : "Record stock consumption (lumpsum / recipe / portion)."}</p>
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
            {/* date is fixed, not editable */}
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
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <label>
            Notes (optional)
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any remarks..." />
          </label>
        </div>

        {/* Lines */}
        <h3 style={{ marginBottom: 8 }}>{isRecipeType ? "Recipes" : "Items"}</h3>
        <div className="sa-card" style={{ padding: 12, marginBottom: 16 }}>
          <table className="sa-table">
            <thead>
              {isRecipeType ? (
                <tr>
                  <th style={{ width: "45%" }}>Recipe</th>
                  <th style={{ width: "15%" }}>Consumed Qty</th>
                  <th>Remarks</th>
                  <th style={{ width: "5%" }}></th>
                </tr>
              ) : (
                <tr>
                  <th style={{ width: "20%" }}>Category</th>
                  <th style={{ width: "30%" }}>Item</th>
                  <th style={{ width: "15%" }}>Qty</th>
                  <th style={{ width: "15%" }}>UOM</th>
                  <th>Remarks</th>
                  <th style={{ width: "5%" }}></th>
                </tr>
              )}
            </thead>
            <tbody>
              {lines.map((ln, idx) => {
                if (isRecipeType) {
                  // recipe-based rows
                  return (
                    <tr key={idx}>
                      <td>
                        <select value={ln.recipe} onChange={(e) => handleLineChange(idx, "recipe", e.target.value)} required>
                          <option value="">Select recipe</option>
                          {recipes.map((rc) => (
                            <option key={rc._id || rc.id} value={rc._id || rc.id}>
                              {rc.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <input type="number" min="0" value={ln.qty} onChange={(e) => handleLineChange(idx, "qty", e.target.value)} required />
                      </td>

                      <td>
                        <input value={ln.remarks} onChange={(e) => handleLineChange(idx, "remarks", e.target.value)} placeholder="optional" />
                      </td>

                      <td>
                        {lines.length > 1 && (
                          <button type="button" onClick={() => removeLine(idx)} className="sa-secondary-button">
                            -
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }

                // normal item-based rows
                const filteredItems = items.filter((it) => {
                  const cat =
                    it.categoryId ||
                    it.category ||
                    it.itemCategory ||
                    it.categoryName ||
                    it.categoryId ||
                    "";
                  if (!ln.category) return true;
                  return String(cat) === String(ln.category);
                });

                return (
                  <tr key={idx}>
                    {/* Category */}
                    <td>
                      <select value={ln.category} onChange={(e) => handleLineChange(idx, "category", e.target.value)}>
                        <option value="">Select category</option>
                        {itemCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Item */}
                    <td>
                      <select
                        value={ln.item}
                        onChange={(e) => handleLineChange(idx, "item", e.target.value)}
                        required
                        disabled={items.length === 0}
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
                      <input type="number" min="0" value={ln.qty} onChange={(e) => handleLineChange(idx, "qty", e.target.value)} required />
                    </td>

                    {/* UOM auto from item (read-only, readable color) */}
                    <td>
                      <input
                        value={ln.uom}
                        readOnly
                        placeholder="Auto"
                        style={{
                          backgroundColor: "#020617",
                          opacity: 0.95,
                          color: "#fff",
                          border: "1px solid rgba(255,255,255,0.06)",
                          padding: "6px 8px",
                        }}
                      />
                    </td>

                    {/* Remarks */}
                    <td>
                      <input value={ln.remarks} onChange={(e) => handleLineChange(idx, "remarks", e.target.value)} placeholder="optional" />
                    </td>

                    <td>
                      {lines.length > 1 && (
                        <button type="button" onClick={() => removeLine(idx)} className="sa-secondary-button">
                          -
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button type="button" className="sa-secondary-button" style={{ marginTop: 8 }} onClick={addLine}>
            {isRecipeType ? "+ Add Recipe" : "+ Add Item"}
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
