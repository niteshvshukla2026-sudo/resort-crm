import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useResort } from "../../context/ResortContext";

const API_BASE =
  (import.meta.env.VITE_API_BASE || "http://localhost:5000") + "/api";

const TYPE_OPTIONS = [
  { value: "LUMPSUM", label: "Lumpsum" },
  { value: "RECIPE_LUMPSUM", label: "By Recipe – Lumpsum" },
  { value: "RECIPE_PORTION", label: "By Recipe – Portion" },
];

const emptyLine = () => ({
  category: "",
  item: "",
  recipe: "",
  qty: "",
  uom: "",
  remarks: "",
});

const getId = (v) => (typeof v === "object" ? v?._id : v);

const ConsumptionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedResort } = useResort(); // 🌍 GLOBAL RESORT

  const [type, setType] = useState("LUMPSUM");
  const [storeFrom, setStoreFrom] = useState("");
  const [date] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const [lines, setLines] = useState([emptyLine()]);

  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isRecipeType =
    type === "RECIPE_LUMPSUM" || type === "RECIPE_PORTION";

  // ================= LOAD MASTERS (STRICT RESORT-WISE) =================
  const loadMasters = async () => {
    if (!selectedResort || selectedResort === "ALL") {
      setStores([]);
      setItems([]);
      setRecipes([]);
      setCategories([]);
      return;
    }

    try {
      const [storeRes, itemRes, recipeRes, catRes] = await Promise.all([
        axios.get(`${API_BASE}/stores`, {
          params: { resort: selectedResort },
        }),
        axios.get(`${API_BASE}/items`, {
          params: { resort: selectedResort },
        }),
        axios.get(`${API_BASE}/recipes`, {
          params: { resort: selectedResort },
        }),
        axios.get(`${API_BASE}/item-categories`, {
          params: { resort: selectedResort },
        }),
      ]);

      setStores(storeRes.data || []);
      setItems(itemRes.data || []);
      setRecipes(recipeRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error("Load masters error", err);
    }
  };

  useEffect(() => {
    loadMasters();
    // eslint-disable-next-line
  }, [selectedResort]);

  // ================= LOAD CONSUMPTION (EDIT MODE) =================
  useEffect(() => {
    if (!id) return;

    const loadConsumption = async () => {
      try {
        const res = await axios.get(`${API_BASE}/consumption/${id}`);
        const c = res.data;

        setType(c.type);
        setStoreFrom(getId(c.storeFrom));
        setNotes(c.notes || "");

        setLines(
          (c.lines || []).map((l) => ({
            category: getId(l.category) || "",
            item: getId(l.item) || "",
            recipe: getId(l.recipe) || "",
            qty: l.qty,
            uom: l.uom || "",
            remarks: l.remarks || "",
          }))
        );
      } catch (err) {
        console.error("Load consumption failed", err);
      }
    };

    loadConsumption();
  }, [id]);

  // ================= FILTER RECIPES BY TYPE =================
  const filteredRecipes = recipes.filter((r) => {
    if (type === "RECIPE_LUMPSUM" && r.type !== "RECIPE_LUMPSUM") return false;
    if (type === "RECIPE_PORTION" && r.type !== "RECIPE_PORTION") return false;
    return true;
  });

  // ================= LINE HANDLING =================
  const handleLineChange = (idx, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      const row = { ...next[idx] };

      if (field === "category") {
        row.category = value;
        row.item = "";
        row.uom = "";
      } else if (field === "item") {
        row.item = value;
        const it = items.find((i) => String(i._id) === String(value));
        if (it) {
          row.uom = it.uom || "";
          row.category = getId(it.itemCategory) || row.category;
        }
      } else {
        row[field] = value;
      }

      next[idx] = row;
      return next;
    });
  };

  const addLine = () => setLines((p) => [...p, emptyLine()]);
  const removeLine = (idx) =>
    setLines((p) => p.filter((_, i) => i !== idx));

  // ================= VALIDATION =================
  const validate = () => {
    if (!storeFrom) {
      setError("Store is required");
      return false;
    }

    const validLines = isRecipeType
      ? lines.filter((l) => l.recipe && Number(l.qty) > 0)
      : lines.filter((l) => l.item && Number(l.qty) > 0);

    if (validLines.length === 0) {
      setError("Add at least one valid line");
      return false;
    }

    setError("");
    return true;
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      resort: selectedResort,
      type,
      storeFrom,
      date,
      notes,
      lines: isRecipeType
        ? lines
            .filter((l) => l.recipe && l.qty)
            .map((l) => ({
              recipe: l.recipe,
              qty: Number(l.qty),
              remarks: l.remarks,
            }))
        : lines
            .filter((l) => l.item && l.qty)
            .map((l) => ({
              item: l.item,
              qty: Number(l.qty),
              uom: l.uom,
              category: l.category,
              remarks: l.remarks,
            })),
    };

    try {
      setSaving(true);
      if (id) {
        await axios.put(`${API_BASE}/consumption/${id}`, payload);
      } else {
        await axios.post(`${API_BASE}/consumption`, payload);
      }
      navigate("/super-admin/consumption");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ================= UI =================
  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <h2>{id ? "Edit Consumption" : "New Consumption"}</h2>
      </div>

      <form className="sa-card" onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Store From
            <select
              value={storeFrom}
              onChange={(e) => setStoreFrom(e.target.value)}
            >
              <option value="">Select Store</option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <h3 style={{ marginTop: 16 }}>
          {isRecipeType ? "Recipes" : "Items"}
        </h3>

        <table className="sa-table">
          <thead>
            <tr>
              {!isRecipeType && <th>Category</th>}
              <th>{isRecipeType ? "Recipe" : "Item"}</th>
              <th>Qty</th>
              {!isRecipeType && <th>UOM</th>}
              <th>Remarks</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((ln, idx) => (
              <tr key={idx}>
                {!isRecipeType && (
                  <td>
                    <select
                      value={ln.category}
                      onChange={(e) =>
                        handleLineChange(idx, "category", e.target.value)
                      }
                    >
                      <option value="">All</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                )}

                <td>
                  {isRecipeType ? (
                    <select
                      value={ln.recipe}
                      onChange={(e) =>
                        handleLineChange(idx, "recipe", e.target.value)
                      }
                    >
                      <option value="">Select Recipe</option>
                      {filteredRecipes.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={ln.item}
                      onChange={(e) =>
                        handleLineChange(idx, "item", e.target.value)
                      }
                    >
                      <option value="">Select Item</option>
                      {items
                        .filter(
                          (it) =>
                            !ln.category ||
                            String(getId(it.itemCategory)) ===
                              String(ln.category)
                        )
                        .map((it) => (
                          <option key={it._id} value={it._id}>
                            {it.name}
                          </option>
                        ))}
                    </select>
                  )}
                </td>

                <td>
                  <input
                    type="number"
                    value={ln.qty}
                    onChange={(e) =>
                      handleLineChange(idx, "qty", e.target.value)
                    }
                  />
                </td>

                {!isRecipeType && <td>{ln.uom}</td>}

                <td>
                  <input
                    value={ln.remarks}
                    onChange={(e) =>
                      handleLineChange(idx, "remarks", e.target.value)
                    }
                  />
                </td>

                <td>
                  {lines.length > 1 && (
                    <button type="button" onClick={() => removeLine(idx)}>
                      ❌
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
          onClick={addLine}
        >
          + Add
        </button>

        {error && <div className="sa-modal-error">{error}</div>}

        <div className="sa-modal-actions">
          <button
            type="button"
            className="sa-secondary-button"
            onClick={() => navigate("/super-admin/consumption")}
          >
            Cancel
          </button>
          <button className="sa-primary-button" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConsumptionForm;
