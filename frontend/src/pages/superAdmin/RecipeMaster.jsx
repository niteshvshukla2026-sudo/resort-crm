// src/pages/superAdmin/RecipeMaster.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* Dev fallback items */
const DEV_ITEMS = [
  { _id: "item_rice", name: "Rice", uom: "Kg", itemCategory: "Pantry" },
  { _id: "item_oil", name: "Oil", uom: "Ltr", itemCategory: "Cooking Oil" },
  { _id: "item_chicken", name: "Chicken", uom: "Kg", itemCategory: "Meat" },
  { _id: "item_paneer", name: "Paneer", uom: "Kg", itemCategory: "Dairy" },
  { _id: "item_spice", name: "Spice Mix", uom: "Kg", itemCategory: "Pantry" },
];

/* Dev fallback recipe categories */
const DEV_RECIPE_CATS = [
  { _id: "rc_cat_1", name: "Lumpsum", code: "LUMP", type: "LUMPSUM" },
  { _id: "rc_cat_2", name: "By Portion", code: "PORT", type: "RECIPE_PORTION" },
  { _id: "rc_cat_3", name: "By Recipe Lumpsum", code: "R_LUMP", type: "RECIPE_LUMPSUM" },
];

/* Dev fallback recipes (minimal fields) */
const DEV_RECIPES = [
  {
    _id: "dev_rcp_1",
    code: "RCP-001",
    name: "Plain Rice",
    recipeCategoryId: "rc_cat_1",
    type: "LUMPSUM",
    lines: [{ itemId: "item_rice", qty: 10, uom: "Kg", itemCategory: "Pantry" }],
  },
  {
    _id: "dev_rcp_3",
    code: "RCP-003",
    name: "Chicken Curry (50 portions)",
    recipeCategoryId: "rc_cat_2",
    type: "RECIPE_PORTION",
    lines: [
      { itemId: "item_chicken", qty: 10, uom: "Kg", itemCategory: "Meat" },
      { itemId: "item_spice", qty: 0.3, uom: "Kg", itemCategory: "Pantry" },
    ],
  },
];

const UOM_OPTIONS = ["Kg", "Ltr", "Nos"];

const emptyLine = () => ({
  id: `ln_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  itemCategory: "",
  itemId: "",
  qty: "",
  uom: "",
});

const RecipeMaster = () => {
  const [recipes, setRecipes] = useState([]);
  const [items, setItems] = useState([]);
  const [itemCategories, setItemCategories] = useState([]);
  const [recipeCategories, setRecipeCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // filters (minimal)
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  // modals & form
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // null => create
  const [showView, setShowView] = useState(false);
  const [viewing, setViewing] = useState(null);

  // form state (minimal fields only)
  const initialForm = () => ({
    code: "",
    recipeCategoryId: "",
    type: "LUMPSUM",
    name: "",
    lines: [emptyLine()],
  });

  const [form, setForm] = useState(initialForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // load data (items, recipe categories, item categories)
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [recRes, itemRes, catRes, icatRes] = await Promise.all([
        axios.get(`${API_BASE}/api/recipes`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/items`).catch(() => ({ data: DEV_ITEMS })),
        axios.get(`${API_BASE}/api/recipe-categories`).catch(() => ({ data: DEV_RECIPE_CATS })),
        axios.get(`${API_BASE}/api/item-categories`).catch(() => ({ data: null })), // optional endpoint
      ]);

      const serverRecipes = Array.isArray(recRes.data) ? recRes.data : [];
      const serverItems = Array.isArray(itemRes.data) ? itemRes.data : DEV_ITEMS;
      const serverCats = Array.isArray(catRes.data) ? catRes.data : DEV_RECIPE_CATS;

      // determine item categories: prefer item-categories endpoint, else derive from items, else dev fallback
      let serverItemCats = [];
      if (icatRes && Array.isArray(icatRes.data) && icatRes.data.length) {
        serverItemCats = icatRes.data.map((c) => (typeof c === "string" ? c : c.name || c.code || c._id || c.id));
      } else {
        // derive unique categories from items
        serverItemCats = Array.from(new Set((serverItems || DEV_ITEMS).map((it) => (it.itemCategory || it.category || it.item_category || "Uncategorized"))));
      }

      // normalize minimal recipe fields and ensure lines include itemCategory if possible
      const normalized = (Array.isArray(serverRecipes) ? serverRecipes : []).map((r) => ({
        _id: r._id || r.id,
        code: r.code || "",
        name: r.name || "",
        recipeCategoryId: r.recipeCategoryId || r.recipeCategory || "",
        type: r.type || "LUMPSUM",
        lines: Array.isArray(r.lines)
          ? r.lines.map((ln) => ({
              id: ln.id || `ln_${Math.floor(Math.random() * 100000)}`,
              itemCategory: ln.itemCategory || ln.item_category || (() => {
                const item = (serverItems || DEV_ITEMS).find(it => (it._id === ln.itemId || it.id === ln.itemId));
                return item?.itemCategory || item?.category || "";
              })(),
              itemId: ln.itemId || ln.item || "",
              qty: ln.qty ?? "",
              uom: ln.uom || (serverItems.find(it => it._id === ln.itemId || it.id === ln.itemId)?.uom || ""),
            }))
          : [],
      }));

      setRecipes(normalized.length ? normalized : DEV_RECIPES);
      setItems(serverItems);
      setRecipeCategories(serverCats);
      setItemCategories(serverItemCats.length ? serverItemCats : Array.from(new Set(DEV_ITEMS.map(i => i.itemCategory || "Uncategorized"))));
    } catch (err) {
      console.error(err);
      setError("Failed to load recipe data; using sample data");
      setRecipes(DEV_RECIPES);
      setItems(DEV_ITEMS);
      setRecipeCategories(DEV_RECIPE_CATS);
      setItemCategories(Array.from(new Set(DEV_ITEMS.map(i => i.itemCategory || "Uncategorized"))));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  const getCategoryById = (id) => recipeCategories.find((c) => c._id === id || c.id === id) || null;
  const getItem = (id) => items.find((it) => it._id === id || it.id === id) || null;
  const getItemName = (id) => (getItem(id) ? getItem(id).name : id);

  // derived
  const categoryOptions = useMemo(() => recipeCategories, [recipeCategories]);

  // filtered recipes (minimal)
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      if (categoryFilter && (r.recipeCategoryId || "") !== categoryFilter) return false;
      if (searchText && searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        const hay = [r.code, r.name, r._id].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [recipes, categoryFilter, searchText]);

  // form helpers
  const updateFormField = (name, value) => setForm((p) => ({ ...p, [name]: value }));
  const updateLine = (idx, field, value) =>
    setForm((p) => {
      const arr = [...p.lines];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...p, lines: arr };
    });

  const addLine = () => setForm((p) => ({ ...p, lines: [...p.lines, emptyLine()] }));
  const removeLine = (idx) => setForm((p) => ({ ...p, lines: p.lines.filter((_, i) => i !== idx) }));

  // when itemCategory changes in a line, clear itemId and uom
  const onLineCategoryChange = (idx, catVal) => {
    updateLine(idx, "itemCategory", catVal);
    updateLine(idx, "itemId", "");
    updateLine(idx, "uom", "");
  };

  // when item selected, set uom from item (if available)
  const onLineItemChange = (idx, itemId) => {
    const it = getItem(itemId);
    updateLine(idx, "itemId", itemId);
    if (it && it.uom) updateLine(idx, "uom", it.uom);
    else updateLine(idx, "uom", "");
  };

  const handleRecipeCategoryChange = (catId) => {
    const cat = getCategoryById(catId);
    setForm((p) => ({ ...p, recipeCategoryId: catId, type: cat ? (cat.type || p.type) : p.type }));
  };

  // open create / edit / view
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
      type: rcp.type || "LUMPSUM",
      name: rcp.name || "",
      lines:
        (r.lines &&
          r.lines.map((ln) => ({
            id: ln.id || `ln_${Math.floor(Math.random() * 100000)}`,
            itemCategory: ln.itemCategory || getItem(ln.itemId)?.itemCategory || "",
            itemId: ln.itemId || ln.item || "",
            qty: ln.qty ?? "",
            uom: ln.uom || getItem(ln.itemId)?.uom || "",
          }))) ||
        [emptyLine()],
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
      type: rcp.type || "LUMPSUM",
      name: `${rcp.name || "Copy"} (Copy)`,
      lines:
        (rcp.lines &&
          rcp.lines.map((ln) => ({
            id: `dup_${Math.floor(Math.random() * 100000)}`,
            itemCategory: ln.itemCategory || getItem(ln.itemId)?.itemCategory || "",
            itemId: ln.itemId || "",
            qty: ln.qty ?? "",
            uom: ln.uom || getItem(ln.itemId)?.uom || "",
          }))) ||
        [emptyLine()],
    });
    setFormError("");
    setShowForm(true);
  };

  // validation (minimal)
  const validateForm = () => {
    if (!form.code || !form.code.trim()) return "Recipe code required";
    if (!form.name || !form.name.trim()) return "Recipe name required";
    if (!form.recipeCategoryId) return "Select Recipe Category";
    if (!form.lines || form.lines.length === 0) return "Add at least one ingredient";
    for (const ln of form.lines) {
      if (!ln.itemCategory) return "Each ingredient must have an item category";
      if (!ln.itemId) return "Each ingredient must have an item";
      if (!ln.qty || Number(ln.qty) <= 0) return "Each ingredient must have quantity > 0";
      if (!ln.uom) return "Each ingredient must have a UOM (Kg/Ltr/Nos)";
      if (!UOM_OPTIONS.includes(ln.uom)) return "UOM must be one of Kg, Ltr or Nos";
    }
    return null;
  };

  // save (minimal payload)
  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");
    const v = validateForm();
    if (v) return setFormError(v);

    const payload = {
      code: form.code,
      name: form.name,
      recipeCategoryId: form.recipeCategoryId,
      type: form.type,
      lines: (form.lines || []).map((ln) => ({ itemId: ln.itemId, qty: Number(ln.qty), uom: ln.uom, itemCategory: ln.itemCategory })),
    };

    try {
      setSaving(true);
      if (editing && editing._id) {
        const res = await axios.put(`${API_BASE}/api/recipes/${editing._id}`, payload).catch(() => null);
        if (res && res.data) setRecipes((p) => p.map((r) => (r._id === editing._id ? res.data : r)));
        else setRecipes((p) => p.map((r) => (r._id === editing._id ? { ...r, ...payload } : r)));
      } else {
        const res = await axios.post(`${API_BASE}/api/recipes`, payload).catch(() => null);
        if (res && res.data) setRecipes((p) => [res.data, ...p]);
        else setRecipes((p) => [{ ...payload, _id: `local_${Date.now()}` }, ...p]);
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
      await axios.delete(`${API_BASE}/api/recipes/${rcp._id}`).catch(() => null);
    } catch (err) {
      console.error(err);
      setError("Failed to delete recipe");
      await loadData();
    }
  };

  // helper: items for a given category
  const itemsForCategory = (cat) => items.filter((it) => ((it.itemCategory || it.category || it.item_category || "").toString() === (cat || "").toString()));

  return (
    <div className="sa-page">
      <div className="sa-page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h2>Recipe Master</h2>
          <p>Create and manage recipes (minimal fields).</p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="sa-secondary-button" onClick={() => loadData()}>Refresh</button>
          <button className="sa-primary-button" onClick={openCreate}><i className="ri-add-line" /> New Recipe</button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="sa-card" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <label>
          Recipe Category
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            {categoryOptions.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label style={{ flex: 1, minWidth: 200 }}>
          Search
          <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="name / code ..." style={{ marginLeft: 8, width: "70%" }} />
        </label>

        <div style={{ marginLeft: "auto", color: "#9ca3af" }}>Showing {filteredRecipes.length} / {recipes.length}</div>
      </div>

      {error && <div className="sa-modal-error">{error}</div>}

      {/* LIST */}
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
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecipes.map((r) => (
                <tr key={r._id}>
                  <td style={{ color: "#0b69ff", cursor: "pointer" }} onClick={() => openView(r)}>{r.code}</td>
                  <td>{r.name}</td>
                  <td>{getCategoryById(r.recipeCategoryId)?.name || "-"}</td>
                  <td>{r.type}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span title="View" style={{ cursor: "pointer", marginRight: 6 }} onClick={() => openView(r)}><i className="ri-eye-line" /></span>
                    <span title="Duplicate" style={{ cursor: "pointer", marginRight: 6 }} onClick={() => duplicateAsCreate(r)}><i className="ri-file-copy-line" /></span>
                    <span title="Edit" style={{ cursor: "pointer", marginRight: 6 }} onClick={() => openEdit(r)}><i className="ri-edit-line" /></span>
                    <span title="Delete" style={{ cursor: "pointer", marginRight: 6 }} onClick={() => handleDelete(r)}><i className="ri-delete-bin-6-line" /></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showForm && (
        <div className="sa-modal-backdrop" onClick={() => !saving && (setShowForm(false), setEditing(null))}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "Edit Recipe" : "Create Recipe"}</h3>
            <p className="sa-modal-sub">Minimal recipe: code, category, name, and ingredient lines.</p>

            <form className="sa-modal-form" onSubmit={handleSave}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 }}>
                <label>
                  Code
                  <input value={form.code} onChange={(e) => updateFormField("code", e.target.value)} required />
                </label>

                <label>
                  Recipe Category *
                  <select value={form.recipeCategoryId} onChange={(e) => handleRecipeCategoryChange(e.target.value)} required>
                    <option value="">-- Select Recipe Category --</option>
                    {categoryOptions.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Name
                  <input value={form.name} onChange={(e) => updateFormField("name", e.target.value)} required />
                </label>

                <label>
                  Type
                  <input value={form.type} disabled />
                </label>
              </div>

              <h4 style={{ marginTop: 8 }}>Ingredients</h4>
              <div className="sa-card" style={{ padding: 10 }}>
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th style={{ width: "30%" }}>Item Category</th>
                      <th style={{ width: "30%" }}>Item</th>
                      <th style={{ width: "20%" }}>Qty</th>
                      <th style={{ width: "15%" }}>UOM</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.lines.map((ln, idx) => (
                      <tr key={ln.id}>
                        <td>
                          <select
                            value={ln.itemCategory || ""}
                            onChange={(e) => onLineCategoryChange(idx, e.target.value)}
                            required
                          >
                            <option value="">-- Select category --</option>
                            {itemCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>

                        <td>
                          <select
                            value={ln.itemId || ""}
                            onChange={(e) => onLineItemChange(idx, e.target.value)}
                            required
                          >
                            <option value="">-- Select item --</option>
                            {itemsForCategory(ln.itemCategory).map((it) => (
                              <option key={it._id || it.id} value={it._id || it.id}>{it.name}</option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={ln.qty}
                            onChange={(e) => updateLine(idx, "qty", e.target.value)}
                            required
                          />
                        </td>

                        <td>
                          <select
                            value={ln.uom || ""}
                            onChange={(e) => updateLine(idx, "uom", e.target.value)}
                            required
                          >
                            <option value="">-- Select --</option>
                            {UOM_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>

                        <td>{form.lines.length > 1 && <button type="button" onClick={() => removeLine(idx)}>Remove</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button type="button" className="sa-secondary-button" style={{ marginTop: 8 }} onClick={addLine}>+ Add Ingredient</button>

              </div>

              {formError && <div className="sa-modal-error" style={{ marginTop: 8 }}>{formError}</div>}

              <div className="sa-modal-actions" style={{ marginTop: 12 }}>
                <button type="button" className="sa-secondary-button" onClick={() => (!saving && setShowForm(false))}>Cancel</button>
                <button type="submit" className="sa-primary-button" disabled={saving}>{saving ? "Saving..." : editing ? "Update Recipe" : "Save Recipe"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {showView && viewing && (
        <div className="sa-modal-backdrop" onClick={() => setShowView(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{viewing.code} — {viewing.name}</h3>
            <p className="sa-modal-sub">Category: {getCategoryById(viewing.recipeCategoryId)?.name || "-"} — Type: {viewing.type}</p>

            <h4 style={{ marginTop: 8 }}>Ingredients</h4>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>UOM</th>
                </tr>
              </thead>
              <tbody>
                {(viewing.lines || []).map((ln, i) => (
                  <tr key={i}>
                    <td>{getItemName(ln.itemId)}</td>
                    <td>{ln.itemCategory || getItem(ln.itemId)?.itemCategory || "-"}</td>
                    <td>{ln.qty}</td>
                    <td>{ln.uom}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="sa-modal-actions" style={{ marginTop: 12 }}>
              <button type="button" className="sa-secondary-button" onClick={() => setShowView(false)}>Close</button>
              <button type="button" className="sa-primary-button" onClick={() => { setShowView(false); openEdit(viewing); }}>Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeMaster;
