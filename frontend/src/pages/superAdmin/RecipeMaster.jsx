// src/pages/superAdmin/RecipeMaster.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* Dev fallback items ONLY if /api/items fails */
const DEV_ITEMS = [
  { _id: "item_rice", name: "Rice", uom: "Kg", itemCategory: "Pantry" },
  { _id: "item_oil", name: "Oil", uom: "Ltr", itemCategory: "Cooking Oil" },
  { _id: "item_chicken", name: "Chicken", uom: "Kg", itemCategory: "Meat" },
  { _id: "item_paneer", name: "Paneer", uom: "Kg", itemCategory: "Dairy" },
  { _id: "item_spice", name: "Spice Mix", uom: "Kg", itemCategory: "Pantry" },
];

const emptyLine = () => ({
  id: `ln_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  itemCategory: "", // will hold itemCategoryId
  itemId: "",
  qty: "",
});

// allowed yield UOMs (dropdown)
const UOM_OPTIONS = ["Kg", "Ltr", "Nos", "Pax"];

const RecipeMaster = () => {
  const [recipes, setRecipes] = useState([]);
  const [items, setItems] = useState([]);
  const [itemCategories, setItemCategories] = useState([]); // [{id,name}]
  const [recipeCategories, setRecipeCategories] = useState([]); // from master
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showView, setShowView] = useState(false);
  const [viewing, setViewing] = useState(null);

  const initialForm = () => ({
    code: "",
    recipeCategoryId: "",
    type: "", // internal only (if backend uses)
    name: "",
    yieldQty: "",
    yieldUom: "",
    lines: [emptyLine()],
  });

  const [form, setForm] = useState(initialForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [recRes, itemRes, rcatRes, icatRes] = await Promise.all([
        axios.get(`${API_BASE}/api/recipes`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/items`).catch(() => ({ data: DEV_ITEMS })),
        axios
          .get(`${API_BASE}/api/recipe-categories`)
          .catch(() => ({ data: [] })), // recipe category master
        axios
          .get(`${API_BASE}/api/item-categories`)
          .catch(() => ({ data: null })), // item category master
      ]);

      const serverRecipes = Array.isArray(recRes.data) ? recRes.data : [];
      const serverItemsRaw = Array.isArray(itemRes.data)
        ? itemRes.data
        : DEV_ITEMS;

      // ---------- Item Categories from master ----------
      let serverItemCats = [];
      if (icatRes && Array.isArray(icatRes.data) && icatRes.data.length) {
        serverItemCats = icatRes.data.map((c) => ({
          id: c._id || c.id || c.code || c.name,
          name: c.name || c.code || c._id || c.id,
        }));
      }

      // If no master, infer from items (dev only)
      if (!serverItemCats.length) {
        const map = new Map();
        (serverItemsRaw.length ? serverItemsRaw : DEV_ITEMS).forEach((it) => {
          const id =
            it.itemCategoryId ||
            it.itemCategory ||
            it.categoryId ||
            it.item_category ||
            it.group ||
            "Uncategorized";
          if (!map.has(id)) {
            map.set(id, { id: id.toString(), name: id.toString() });
          }
        });
        serverItemCats = Array.from(map.values());
      }

      const itemCatNameById = new Map(
        serverItemCats.map((c) => [c.id.toString(), c.name])
      );

      // ---------- Items ----------
      const serverItems = serverItemsRaw.map((it) => {
        const uom =
          it.uom ||
          it.measurement ||
          it.unit ||
          it.unitOfMeasure ||
          it.unit_of_measure ||
          it.uomName ||
          it.measurementUnit ||
          "";

        const catIdRaw =
          it.itemCategoryId ||
          it.itemCategory ||
          it.categoryId ||
          it.item_category ||
          it.group ||
          "";
        const catId = catIdRaw ? catIdRaw.toString() : "";
        const catName =
          itemCatNameById.get(catId) ||
          it.itemCategoryName ||
          it.categoryName ||
          catId;

        return {
          _id: it._id || it.id,
          id: it.id || it._id,
          name: it.name || it.title || "",
          uom,
          itemCategoryId: catId, // for linking
          itemCategoryName: catName, // for display
          ...it,
        };
      });

      // ---------- Recipe Categories from master ----------
      const serverRecipeCats = Array.isArray(rcatRes.data) ? rcatRes.data : [];

      // ---------- Recipes ----------
      const normalizedRecipes = serverRecipes.map((r) => ({
        _id: r._id || r.id,
        code: r.code || "",
        name: r.name || "",
        recipeCategoryId: r.recipeCategoryId || r.recipeCategory || "",
        type: r.type || "",
        yieldQty: r.yieldQty ?? r.yield_qty ?? "",
        yieldUom: r.yieldUom || r.yield_uom || "",
        lines: Array.isArray(r.lines)
          ? r.lines.map((ln) => {
              const item = serverItems.find(
                (it) => it._id === ln.itemId || it.id === ln.itemId
              );
              const lineCatId =
                ln.itemCategoryId ||
                ln.itemCategory ||
                ln.categoryId ||
                item?.itemCategoryId ||
                "";
              return {
                id: ln.id || `ln_${Math.floor(Math.random() * 100000)}`,
                itemCategory: lineCatId ? lineCatId.toString() : "",
                itemId: ln.itemId || ln.item || "",
                qty: ln.qty ?? "",
              };
            })
          : [],
      }));

      setRecipes(normalizedRecipes);
      setItems(serverItems);
      setRecipeCategories(serverRecipeCats);
      setItemCategories(serverItemCats);
    } catch (err) {
      console.error(err);
      setError("Failed to load recipe data");
      setRecipes([]);
      setItems(DEV_ITEMS);
      setRecipeCategories([]);
      const fallbackCats = Array.from(
        new Set(DEV_ITEMS.map((i) => i.itemCategory || "Uncategorized"))
      ).map((id) => ({ id, name: id }));
      setItemCategories(fallbackCats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  const getCategoryById = (id) =>
    recipeCategories.find(
      (c) => c._id === id || c.id === id || (c._id || c.id)?.toString() === id
    ) || null;

  const getItemCategoryName = (id) => {
    if (!id) return "";
    const cat = itemCategories.find(
      (c) => c.id === id || c.id === id.toString()
    );
    return cat ? cat.name : id;
  };

  const getItem = (id) =>
    items.find((it) => it._id === id || it.id === id) || null;
  const getItemName = (id) => (getItem(id) ? getItem(id).name : id);

  // ✅ Recipe Category dropdown:
  //    - master se aayega
  //    - jisko name = "Lumpsum" ya type = "LUMPSUM" ho, usko HIDE kar diya
  const categoryOptions = useMemo(
    () =>
      recipeCategories.filter((c) => {
        const t = (c.type || "").toUpperCase();
        const n = (c.name || "").toLowerCase();
        return t !== "LUMPSUM" && n !== "lumpsum";
      }),
    [recipeCategories]
  );

  const filteredRecipes = useMemo(
    () =>
      recipes.filter((r) => {
        if (
          categoryFilter &&
          (r.recipeCategoryId || "").toString() !== categoryFilter.toString()
        )
          return false;
        if (searchText && searchText.trim()) {
          const q = searchText.trim().toLowerCase();
          const hay = [r.code, r.name, r._id].filter(Boolean).join(" ").toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      }),
    [recipes, categoryFilter, searchText]
  );

  const updateFormField = (name, value) =>
    setForm((p) => ({
      ...p,
      [name]: value,
    }));

  const updateLine = (idx, field, value) =>
    setForm((p) => {
      const arr = [...p.lines];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...p, lines: arr };
    });

  const addLine = () =>
    setForm((p) => ({
      ...p,
      lines: [...p.lines, emptyLine()],
    }));

  const removeLine = (idx) =>
    setForm((p) => ({
      ...p,
      lines: p.lines.filter((_, i) => i !== idx),
    }));

  // ✅ Items list for selected categoryId
  const itemsForCategory = (categoryId) =>
    items.filter(
      (it) =>
        (it.itemCategoryId || it.itemCategory || "").toString() ===
        (categoryId || "").toString()
    );

  // helper: safely map detected uom to allowed options
  const mapToAllowedUom = (uom) =>
    UOM_OPTIONS.includes(uom) ? uom : undefined;

  const onLineCategoryChange = (idx, catVal) => {
    updateLine(idx, "itemCategory", catVal);
    updateLine(idx, "itemId", "");
    updateLine(idx, "qty", "");

    if (!catVal) return;

    const matches = itemsForCategory(catVal);
    if (matches.length === 1) {
      const only = matches[0];
      updateLine(idx, "itemId", only._id || only.id);
      const allowed = mapToAllowedUom(only.uom);
      if (allowed) {
        setForm((p) => ({
          ...p,
          yieldUom: p.yieldUom || allowed,
        }));
      }
    }
  };

  const onLineItemChange = (idx, itemId) => {
    const it = getItem(itemId);
    updateLine(idx, "itemId", itemId);

    if (it && (it.itemCategoryId || it.itemCategory)) {
      updateLine(idx, "itemCategory", (it.itemCategoryId || it.itemCategory).toString());
    }

    const allowed = it ? mapToAllowedUom(it.uom) : undefined;
    if (allowed) {
      setForm((p) => ({
        ...p,
        yieldUom: p.yieldUom || allowed,
      }));
    }
  };

  // Auto-fill yieldUom if all ingredient items same uom
  useEffect(() => {
    const detected = form.lines
      .map((ln) => {
        const it = getItem(ln.itemId);
        const allowed = it ? mapToAllowedUom(it.uom) : undefined;
        return allowed;
      })
      .filter(Boolean);

    if (!detected.length) return;
    const allSame = detected.every((d) => d === detected[0]);
    if (allSame) {
      setForm((p) => ({
        ...p,
        yieldUom: p.yieldUom || detected[0],
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.lines.map((l) => l.itemId).join("||")]);

  const handleRecipeCategoryChange = (catId) => {
    const cat = getCategoryById(catId);
    setForm((p) => ({
      ...p,
      recipeCategoryId: catId,
      type: cat ? cat.type || p.type : p.type,
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm());
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (rcp) => {
    setEditing(rcp);
    setForm({
      code: rcp.code || "",
      recipeCategoryId: rcp.recipeCategoryId || "",
      type: rcp.type || "",
      name: rcp.name || "",
      yieldQty: rcp.yieldQty ?? rcp.yield_qty ?? "",
      yieldUom: rcp.yieldUom || rcp.yield_uom || "",
      lines:
        (rcp.lines &&
          rcp.lines.map((ln) => {
            const item = getItem(ln.itemId);
            const catId =
              ln.itemCategoryId ||
              ln.itemCategory ||
              ln.categoryId ||
              item?.itemCategoryId ||
              "";
            return {
              id: ln.id || `ln_${Math.floor(Math.random() * 100000)}`,
              itemCategory: catId ? catId.toString() : "",
              itemId: ln.itemId || ln.item || "",
              qty: ln.qty ?? "",
            };
          })) || [emptyLine()],
    });
    setFormError("");
    setShowForm(true);
  };

  const openView = (rcp) => {
    setViewing(rcp);
    setShowView(true);
  };

  const duplicateAsCreate = (rcp) => {
    setEditing(null);
    setForm({
      code: `${rcp.code || "RCP"}-COPY`,
      recipeCategoryId: rcp.recipeCategoryId || "",
      type: rcp.type || "",
      name: `${rcp.name || "Copy"} (Copy)`,
      yieldQty: rcp.yieldQty ?? rcp.yield_qty ?? "",
      yieldUom: rcp.yieldUom || rcp.yield_uom || "",
      lines:
        (rcp.lines &&
          rcp.lines.map((ln) => {
            const item = getItem(ln.itemId);
            const catId =
              ln.itemCategoryId ||
              ln.itemCategory ||
              ln.categoryId ||
              item?.itemCategoryId ||
              "";
            return {
              id: `dup_${Math.floor(Math.random() * 100000)}`,
              itemCategory: catId ? catId.toString() : "",
              itemId: ln.itemId || "",
              qty: ln.qty ?? "",
            };
          })) || [emptyLine()],
    });
    setFormError("");
    setShowForm(true);
  };

  const validateForm = () => {
    if (!form.code || !form.code.trim()) return "Recipe code required";
    if (!form.name || !form.name.trim()) return "Recipe name required";
    if (!form.recipeCategoryId) return "Select Recipe Category";
    if (!form.lines || form.lines.length === 0)
      return "Add at least one ingredient";
    for (const ln of form.lines) {
      if (!ln.itemCategory)
        return "Each ingredient must have an item category";
      if (!ln.itemId) return "Each ingredient must have an item";
      if (!ln.qty || Number(ln.qty) <= 0)
        return "Each ingredient must have quantity > 0";
    }
    if (form.yieldQty && Number(form.yieldQty) <= 0)
      return "Yield Qty must be > 0";
    if (form.yieldQty && !form.yieldUom)
      return "Provide Yield UOM when Yield Qty is set";
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");
    const v = validateForm();
    if (v) return setFormError(v);

    const payload = {
      code: form.code,
      name: form.name,
      recipeCategoryId: form.recipeCategoryId,
      type: form.type || undefined,
      yieldQty: form.yieldQty ? Number(form.yieldQty) : undefined,
      yieldUom: form.yieldUom || undefined,
      lines: (form.lines || []).map((ln) => ({
        itemId: ln.itemId,
        qty: Number(ln.qty),
        itemCategory: ln.itemCategory, // this is itemCategoryId
      })),
    };

    try {
      setSaving(true);
      if (editing && editing._id) {
        const res = await axios
          .put(`${API_BASE}/api/recipes/${editing._id}`, payload)
          .catch(() => null);
        if (res && res.data)
          setRecipes((p) =>
            p.map((r) => (r._id === editing._id ? res.data : r))
          );
        else
          setRecipes((p) =>
            p.map((r) => (r._id === editing._id ? { ...r, ...payload } : r))
          );
      } else {
        const res = await axios
          .post(`${API_BASE}/api/recipes`, payload)
          .catch(() => null);
        if (res && res.data) setRecipes((p) => [res.data, ...p]);
        else
          setRecipes((p) => [
            { ...payload, _id: `local_${Date.now()}` },
            ...p,
          ]);
      }

      setShowForm(false);
      setEditing(null);
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || "Failed to save recipe");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rcp) => {
    if (!window.confirm(`Delete recipe ${rcp.code || rcp.name}?`)) return;
    try {
      setRecipes((p) => p.filter((x) => x._id !== rcp._id));
      await axios
        .delete(`${API_BASE}/api/recipes/${rcp._id}`)
        .catch(() => null);
    } catch (err) {
      console.error(err);
      setError("Failed to delete recipe");
      await loadData();
    }
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h2>Recipe Master</h2>
          <p>Create and manage recipes (minimal fields).</p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="sa-secondary-button" onClick={() => loadData()}>
            Refresh
          </button>
          <button className="sa-primary-button" onClick={openCreate}>
            <i className="ri-add-line" /> New Recipe
          </button>
        </div>
      </div>

      <div
        className="sa-card"
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <label>
          Recipe Category
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="">All</option>
            {categoryOptions.map((c) => (
              <option key={c._id || c.id} value={c._id || c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ flex: 1, minWidth: 200 }}>
          Search
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="name / code ..."
            style={{ marginLeft: 8, width: "70%" }}
          />
        </label>

        <div style={{ marginLeft: "auto", color: "#9ca3af" }}>
          Showing {filteredRecipes.length} / {recipes.length}
        </div>
      </div>

      {error && <div className="sa-modal-error">{error}</div>}

      <div className="sa-card">
        {loading ? (
          <div>Loading recipes...</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecipes.map((r) => (
                <tr key={r._id}>
                  <td
                    style={{ color: "#0b69ff", cursor: "pointer" }}
                    onClick={() => openView(r)}
                  >
                    {r.code}
                  </td>
                  <td>{r.name}</td>
                  <td>{getCategoryById(r.recipeCategoryId)?.name || "-"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span
                      title="View"
                      style={{ cursor: "pointer", marginRight: 6 }}
                      onClick={() => openView(r)}
                    >
                      <i className="ri-eye-line" />
                    </span>
                    <span
                      title="Duplicate"
                      style={{ cursor: "pointer", marginRight: 6 }}
                      onClick={() => duplicateAsCreate(r)}
                    >
                      <i className="ri-file-copy-line" />
                    </span>
                    <span
                      title="Edit"
                      style={{ cursor: "pointer", marginRight: 6 }}
                      onClick={() => openEdit(r)}
                    >
                      <i className="ri-edit-line" />
                    </span>
                    <span
                      title="Delete"
                      style={{ cursor: "pointer", marginRight: 6 }}
                      onClick={() => handleDelete(r)}
                    >
                      <i className="ri-delete-bin-6-line" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div
          className="sa-modal-backdrop"
          onClick={() => !saving && (setShowForm(false), setEditing(null))}
        >
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "Edit Recipe" : "Create Recipe"}</h3>
            <p className="sa-modal-sub">
              Minimal recipe: code, category, name, yield and ingredient lines.
            </p>

            <form className="sa-modal-form" onSubmit={handleSave}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0,1fr))",
                  gap: 10,
                }}
              >
                <label>
                  Code
                  <input
                    value={form.code}
                    onChange={(e) => updateFormField("code", e.target.value)}
                    required
                  />
                </label>

                <label>
                  Recipe Category *
                  <select
                    value={form.recipeCategoryId}
                    onChange={(e) => handleRecipeCategoryChange(e.target.value)}
                    required
                  >
                    <option value="">-- Select Recipe Category --</option>
                    {categoryOptions.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Name
                  <input
                    value={form.name}
                    onChange={(e) => updateFormField("name", e.target.value)}
                    required
                  />
                </label>

                <label>
                  Yield Qty
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.yieldQty}
                    onChange={(e) => updateFormField("yieldQty", e.target.value)}
                    placeholder="e.g. 50"
                  />
                </label>

                <label>
                  Yield UOM
                  <select
                    value={form.yieldUom || ""}
                    onChange={(e) => updateFormField("yieldUom", e.target.value)}
                  >
                    <option value="">-- Select UOM --</option>
                    {UOM_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u === "Pax" ? "Pax (persons)" : u}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <h4 style={{ marginTop: 8 }}>Ingredients</h4>
              <div className="sa-card" style={{ padding: 10 }}>
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th style={{ width: "35%" }}>Item Category</th>
                      <th style={{ width: "45%" }}>Item</th>
                      <th style={{ width: "20%" }}>Qty</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.lines.map((ln, idx) => (
                      <tr key={ln.id}>
                        <td>
                          <select
                            value={ln.itemCategory || ""}
                            onChange={(e) =>
                              onLineCategoryChange(idx, e.target.value)
                            }
                            required
                          >
                            <option value="">-- Select category --</option>
                            {itemCategories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <select
                            value={ln.itemId || ""}
                            onChange={(e) =>
                              onLineItemChange(idx, e.target.value)
                            }
                            required
                          >
                            <option value="">-- Select item --</option>
                            {itemsForCategory(ln.itemCategory).map((it) => (
                              <option
                                key={it._id || it.id}
                                value={it._id || it.id}
                              >
                                {it.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={ln.qty}
                            onChange={(e) =>
                              updateLine(idx, "qty", e.target.value)
                            }
                            required
                            placeholder="Qty"
                            style={{ width: "100%" }}
                          />
                        </td>

                        <td>
                          {form.lines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLine(idx)}
                            >
                              Remove
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
                  + Add Ingredient
                </button>
              </div>

              {formError && (
                <div className="sa-modal-error" style={{ marginTop: 8 }}>
                  {formError}
                </div>
              )}

              <div className="sa-modal-actions" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="sa-secondary-button"
                  onClick={() => !saving && setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update Recipe"
                    : "Save Recipe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showView && viewing && (
        <div
          className="sa-modal-backdrop"
          onClick={() => setShowView(false)}
        >
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {viewing.code} — {viewing.name}
            </h3>
            <p className="sa-modal-sub">
              Category: {getCategoryById(viewing.recipeCategoryId)?.name || "-"}
            </p>

            <p>
              Yield: {viewing.yieldQty ?? viewing.yield_qty ?? "-"}{" "}
              {viewing.yieldUom ?? viewing.yield_uom ?? ""}
            </p>

            <h4 style={{ marginTop: 8 }}>Ingredients</h4>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {(viewing.lines || []).map((ln, i) => (
                  <tr key={i}>
                    <td>{getItemName(ln.itemId)}</td>
                    <td>{getItemCategoryName(ln.itemCategory)}</td>
                    <td>{ln.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="sa-modal-actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="sa-secondary-button"
                onClick={() => setShowView(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="sa-primary-button"
                onClick={() => {
                  setShowView(false);
                  openEdit(viewing);
                }}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeMaster;
