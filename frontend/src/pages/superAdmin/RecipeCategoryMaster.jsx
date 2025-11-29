// src/pages/superAdmin/RecipeMaster.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* Dev fallback items */
const DEV_ITEMS = [
  { _id: "item_rice", name: "Rice", uom: "Kg", unitCost: 40 },
  { _id: "item_oil", name: "Oil", uom: "Ltr", unitCost: 150 },
  { _id: "item_chicken", name: "Chicken", uom: "Kg", unitCost: 200 },
  { _id: "item_paneer", name: "Paneer", uom: "Kg", unitCost: 320 },
  { _id: "item_spice", name: "Spice Mix", uom: "Kg", unitCost: 500 },
];

/* Dev fallback recipe categories */
const DEV_RECIPE_CATS = [
  { _id: "rc_cat_1", name: "Lumpsum - Single fixed cost (Lumpsum)", code: "LUMP_101", type: "LUMPSUM", description: "Single fixed-cost recipe" },
  { _id: "rc_cat_2", name: "By Portion - Recipe scaled per portion", code: "PORT_102", type: "RECIPE_PORTION", description: "Recipe measured per portion" },
  { _id: "rc_cat_3", name: "By Lumpsum (Recipe) - Lumpsum measured as recipe batch", code: "R_LUMP_103", type: "RECIPE_LUMPSUM", description: "Lumpsum measured as recipe batch" },
];

/* Dev fallback recipes */
const DEV_RECIPES = [
  {
    _id: "dev_rcp_1",
    code: "RCP-001",
    name: "Plain Rice",
    recipeCategoryId: "rc_cat_1",
    type: "LUMPSUM",
    resort: "Resort A",
    department: "Kitchen",
    yieldQty: 10,
    yieldUOM: "Kg",
    yieldPortions: null,
    instructions: "Boil rice in salted water.",
    lines: [{ itemId: "item_rice", qty: 10, uom: "Kg", wastePercent: 2 }],
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "dev_rcp_3",
    code: "RCP-003",
    name: "Chicken Curry (50 portions)",
    recipeCategoryId: "rc_cat_2",
    type: "RECIPE_PORTION",
    resort: "Resort B",
    department: "Kitchen",
    yieldQty: null,
    yieldUOM: "Portion",
    yieldPortions: 50,
    instructions: "Recipe for 50 portions.",
    lines: [
      { itemId: "item_chicken", qty: 10, uom: "Kg", wastePercent: 5 },
      { itemId: "item_spice", qty: 0.3, uom: "Kg", wastePercent: 0.5 },
    ],
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
];

const emptyLine = () => ({ id: `ln_${Date.now()}_${Math.floor(Math.random() * 1000)}`, itemId: "", qty: "", uom: "", wastePercent: 0 });

// canonical type labels (value is key used in DB)
const TYPE_OPTIONS = [
  { key: "LUMPSUM", label: "Lumpsum - Single fixed cost (Lumpsum)" },
  { key: "RECIPE_PORTION", label: "By Portion - Recipe scaled per portion" },
  { key: "RECIPE_LUMPSUM", label: "By Lumpsum (Recipe) - Lumpsum measured as recipe batch" },
];

const RecipeMaster = () => {
  const [recipes, setRecipes] = useState([]);
  const [items, setItems] = useState([]);
  const [recipeCategories, setRecipeCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [resortFilter, setResortFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  // modals & form
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // null => create
  const [showView, setShowView] = useState(false);
  const [viewing, setViewing] = useState(null);

  // inline add category modal state
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatForm, setNewCatForm] = useState({ name: "", type: "LUMPSUM", description: "" });
  const [addCatError, setAddCatError] = useState("");

  // form state
  const initialForm = () => ({
    code: "",
    recipeCategoryId: "",
    recipeCategoryName: "",
    type: "LUMPSUM",
    name: "",
    resort: "",
    department: "",
    yieldQty: "",
    yieldUOM: "",
    yieldPortions: "",
    instructions: "",
    lines: [emptyLine()],
    status: "DRAFT",
  });

  const [form, setForm] = useState(initialForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // load all data
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [recRes, itemRes, catRes] = await Promise.all([
        axios.get(`${API_BASE}/api/recipes`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/items`).catch(() => ({ data: DEV_ITEMS })),
        axios.get(`${API_BASE}/api/recipe-categories`).catch(() => ({ data: DEV_RECIPE_CATS })),
      ]);

      const serverRecipes = Array.isArray(recRes.data) ? recRes.data : [];
      const serverItems = Array.isArray(itemRes.data) ? itemRes.data : DEV_ITEMS;
      const serverCats = Array.isArray(catRes.data) ? catRes.data : DEV_RECIPE_CATS;

      // normalize recipes (ensure recipeCategoryId present)
      const normalizedRecipes = serverRecipes.map((r) => ({
        ...r,
        recipeCategoryId: r.recipeCategoryId || r.recipeCategory || r.categoryId || "",
        type: r.type || "LUMPSUM",
        lines: Array.isArray(r.lines) ? r.lines : [],
      }));

      const finalRecipes = normalizedRecipes.length ? normalizedRecipes : DEV_RECIPES;

      setRecipes(finalRecipes);
      setItems(serverItems);
      setRecipeCategories(serverCats);
    } catch (err) {
      console.error("load error", err);
      setError("Failed to load recipes/categories/items; using sample data");
      setRecipes(DEV_RECIPES);
      setItems(DEV_ITEMS);
      setRecipeCategories(DEV_RECIPE_CATS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  // helpers: get category by id
  const getCategoryById = (id) => recipeCategories.find((c) => c._id === id || c.id === id) || null;

  // derived filters
  const categoryOptions = useMemo(() => recipeCategories, [recipeCategories]);
  const resortOptions = useMemo(() => Array.from(new Set(recipes.map((r) => (r.resort || "").toString()).filter(Boolean))), [recipes]);
  const deptOptions = useMemo(() => Array.from(new Set(recipes.map((r) => (r.department || "").toString()).filter(Boolean))), [recipes]);

  // filtered recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      if (categoryFilter && (r.recipeCategoryId || "") !== categoryFilter) return false;
      if (typeFilter && r.type !== typeFilter) return false;
      if (resortFilter && !(r.resort || "").toLowerCase().includes(resortFilter.toLowerCase())) return false;
      if (deptFilter && !(r.department || "").toLowerCase().includes(deptFilter.toLowerCase())) return false;
      if (statusFilter && (r.status || "").toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (searchText && searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        const hay = [r.code, r.name, r.instructions, r._id, r.resort, r.department].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [recipes, categoryFilter, typeFilter, resortFilter, deptFilter, statusFilter, searchText]);

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

  // item lookup
  const getItem = (id) => items.find((it) => it._id === id || it.id === id) || null;
  const getItemName = (id) => (getItem(id) ? getItem(id).name : id);

  // set recipeCategory selection and auto-set type from category
  const handleRecipeCategoryChange = (catId) => {
    const cat = getCategoryById(catId);
    setForm((p) => ({
      ...p,
      recipeCategoryId: catId,
      recipeCategoryName: cat ? cat.name : "",
      type: cat ? (cat.type || p.type) : p.type,
    }));
  };

  // open create
  const openCreate = () => {
    setEditing(null);
    setForm(initialForm());
    setFormError("");
    setShowForm(true);
  };

  // open edit
  const openEdit = (rcp) => {
    setEditing(rcp);
    setForm({
      code: rcp.code || "",
      recipeCategoryId: rcp.recipeCategoryId || rcp.recipeCategory || "",
      recipeCategoryName: getCategoryById(rcp.recipeCategoryId || rcp.recipeCategory || "")?.name || "",
      type: rcp.type || "LUMPSUM",
      name: rcp.name || "",
      resort: rcp.resort || "",
      department: rcp.department || "",
      yieldQty: rcp.yieldQty ?? "",
      yieldUOM: rcp.yieldUOM || "",
      yieldPortions: rcp.yieldPortions ?? "",
      instructions: rcp.instructions || "",
      lines:
        (rcp.lines &&
          rcp.lines.map((ln) => ({
            id: ln.id || `ln_${Math.floor(Math.random() * 100000)}`,
            itemId: ln.itemId || ln.item || "",
            qty: ln.qty ?? "",
            uom: ln.uom || "",
            wastePercent: ln.wastePercent ?? 0,
          }))) ||
        [emptyLine()],
      status: rcp.status || "DRAFT",
    });
    setFormError("");
    setShowForm(true);
  };

  // duplicate
  const duplicateAsCreate = (rcp) => {
    setEditing(null);
    setForm({
      code: `${rcp.code || "RCP"}-COPY`,
      recipeCategoryId: rcp.recipeCategoryId || rcp.recipeCategory || "",
      recipeCategoryName: getCategoryById(rcp.recipeCategoryId || rcp.recipeCategory || "")?.name || "",
      type: rcp.type || "LUMPSUM",
      name: `${rcp.name || "Copy"} (Copy)`,
      resort: rcp.resort || "",
      department: rcp.department || "",
      yieldQty: rcp.yieldQty ?? "",
      yieldUOM: rcp.yieldUOM || "",
      yieldPortions: rcp.yieldPortions ?? "",
      instructions: rcp.instructions || "",
      lines:
        (rcp.lines &&
          rcp.lines.map((ln) => ({
            id: `dup_${Math.floor(Math.random() * 100000)}`,
            itemId: ln.itemId || ln.item || "",
            qty: ln.qty ?? "",
            uom: ln.uom || "",
            wastePercent: ln.wastePercent ?? 0,
          }))) ||
        [emptyLine()],
      status: "DRAFT",
    });
    setFormError("");
    setShowForm(true);
  };

  // view
  const openView = (rcp) => {
    setViewing(rcp);
    setShowView(true);
  };

  // cost preview for form
  const costPreview = useMemo(() => {
    let total = 0;
    for (const ln of form.lines || []) {
      const it = getItem(ln.itemId);
      const unitCost = it?.unitCost ?? 0;
      const qty = Number(ln.qty || 0);
      const waste = Number(ln.wastePercent || 0);
      const netQty = qty * (1 + waste / 100);
      total += netQty * unitCost;
    }

    let perYield = null;
    let perPortion = null;
    if (form.type === "RECIPE_LUMPSUM") {
      const yieldQ = Number(form.yieldQty || 1);
      perYield = yieldQ ? total : total;
    }
    if (form.type === "RECIPE_PORTION") {
      const portions = Number(form.yieldPortions || 1);
      perPortion = portions ? total / portions : total;
    }
    return { totalIngredientCost: total, perYieldCost: perYield, perPortionCost: perPortion };
  }, [form, items]);

  // validation
  const validateForm = () => {
    if (!form.code || !form.code.trim()) return "Recipe code required";
    if (!form.name || !form.name.trim()) return "Recipe name required";
    if (!form.recipeCategoryId) return "Select Recipe Category";
    if (!form.resort) return "Resort required";
    if (form.type === "RECIPE_LUMPSUM" && (!form.yieldQty || Number(form.yieldQty) <= 0)) return "Yield qty required for lumpsum recipe";
    if (form.type === "RECIPE_PORTION" && (!form.yieldPortions || Number(form.yieldPortions) <= 0)) return "Yield portions required for portion recipe";
    if (!form.lines || form.lines.length === 0) return "Add at least one ingredient";
    for (const ln of form.lines) {
      if (!ln.itemId) return "Each ingredient must have an item";
      if (!ln.qty || Number(ln.qty) <= 0) return "Each ingredient must have quantity > 0";
    }
    return null;
  };

  // save recipe
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
      resort: form.resort,
      department: form.department || undefined,
      yieldQty: form.type === "RECIPE_LUMPSUM" ? Number(form.yieldQty || 0) : undefined,
      yieldUOM: form.type === "RECIPE_LUMPSUM" ? form.yieldUOM || undefined : undefined,
      yieldPortions: form.type === "RECIPE_PORTION" ? Number(form.yieldPortions || 0) : undefined,
      instructions: form.instructions || undefined,
      status: form.status || "DRAFT",
      lines: (form.lines || []).map((ln) => ({
        itemId: ln.itemId,
        qty: Number(ln.qty),
        uom: ln.uom || (getItem(ln.itemId)?.uom || ""),
        wastePercent: Number(ln.wastePercent || 0),
      })),
    };

    try {
      setSaving(true);
      if (editing && editing._id) {
        const res = await axios.put(`${API_BASE}/api/recipes/${editing._id}`, payload).catch(() => null);
        if (res && res.data) {
          setRecipes((p) => p.map((r) => (r._id === editing._id ? res.data : r)));
        } else {
          setRecipes((p) => p.map((r) => (r._id === editing._id ? { ...r, ...payload, _id: r._id } : r)));
        }
      } else {
        const res = await axios.post(`${API_BASE}/api/recipes`, payload).catch(() => null);
        if (res && res.data) {
          setRecipes((p) => [res.data, ...p]);
        } else {
          const temp = { ...payload, _id: `local_${Date.now()}`, createdAt: new Date().toISOString() };
          setRecipes((p) => [temp, ...p]);
        }
      }

      setShowForm(false);
      setEditing(null);
    } catch (err) {
      console.error("save recipe error", err);
      setFormError(err.response?.data?.message || "Failed to save recipe");
    } finally {
      setSaving(false);
    }
  };

  // delete
  const handleDelete = async (rcp) => {
    if (!window.confirm(`Delete recipe ${rcp.code || rcp.name}?`)) return;
    try {
      setRecipes((p) => p.filter((x) => x._id !== rcp._id));
      await axios.delete(`${API_BASE}/api/recipes/${rcp._id}`).catch(() => null);
    } catch (err) {
      console.error("delete error", err);
      setError("Failed to delete recipe");
      await loadData();
    }
  };

  // activate
  const handleActivate = async (rcp) => {
    if (!window.confirm(`Activate recipe ${rcp.code || rcp.name}?`)) return;
    try {
      const res = await axios.post(`${API_BASE}/api/recipes/${rcp._id}/activate`).catch(() => null);
      if (res && res.data) setRecipes((p) => p.map((x) => (x._id === rcp._id ? res.data : x)));
      else setRecipes((p) => p.map((x) => (x._id === rcp._id ? { ...x, status: "ACTIVE" } : x)));
    } catch (err) {
      console.error("activate error", err);
      setError("Failed to activate recipe");
    }
  };

  // create new recipe category inline
  const createNewRecipeCategory = async () => {
    setAddCatError("");
    const name = (newCatForm.name || "").trim();
    if (!name) return setAddCatError("Name required");
    const payload = { name: newCatForm.name.trim(), type: newCatForm.type, description: newCatForm.description || "" };

    try {
      const res = await axios.post(`${API_BASE}/api/recipe-categories`, payload).catch(() => null);
      const created = res?.data ? { _id: res.data._id || res.data.id, ...res.data } : { ...payload, _id: `local_rc_${Date.now()}` };

      // add to local categories and select it
      setRecipeCategories((prev) => [created, ...prev]);
      setForm((f) => ({ ...f, recipeCategoryId: created._id, recipeCategoryName: created.name, type: created.type || f.type }));

      // reset & close
      setNewCatForm({ name: "", type: "LUMPSUM", description: "" });
      setShowAddCat(false);
      setAddCatError("");
    } catch (err) {
      console.error("create category error", err);
      setAddCatError("Failed to create category");
    }
  };

  const formatCost = (n) => (typeof n === "number" ? n.toFixed(2) : "-");

  return (
    <div className="sa-page">
      <div className="sa-page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h2>Recipe Master</h2>
          <p>Create and manage recipes. Recipe Category is selected from Recipe Category master (you can add here).</p>
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
            {categoryOptions.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </label>

        <label>
          Type
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            <option value="LUMPSUM">Lumpsum</option>
            <option value="RECIPE_LUMPSUM">By Recipe - Lumpsum</option>
            <option value="RECIPE_PORTION">By Recipe - Portion</option>
          </select>
        </label>

        <label>
          Resort
          <select value={resortFilter} onChange={(e) => setResortFilter(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            {resortOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>

        <label>
          Department
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            {deptOptions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>

        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
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
                <th>Resort</th>
                <th>Dept</th>
                <th>Yield</th>
                <th>Cost Preview</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecipes.map((r) => {
                const totalCost = (r.lines || []).reduce((s, ln) => {
                  const it = getItem(ln.itemId);
                  const cost = (it?.unitCost ?? 0) * (Number(ln.qty || 0) * (1 + (Number(ln.wastePercent || 0) / 100)));
                  return s + cost;
                }, 0);

                const yieldText = r.type === "RECIPE_PORTION" ? `${r.yieldPortions || "-"} portions` : r.yieldQty ? `${r.yieldQty} ${r.yieldUOM || ""}` : "-";
                const cat = getCategoryById(r.recipeCategoryId);

                return (
                  <tr key={r._id}>
                    <td style={{ color: "#0b69ff", cursor: "pointer" }} onClick={() => openView(r)}>{r.code}</td>
                    <td>{r.name}</td>
                    <td>{cat ? cat.name : "-"}</td>
                    <td>{r.type}</td>
                    <td>{r.resort || "-"}</td>
                    <td>{r.department || "-"}</td>
                    <td>{yieldText}</td>
                    <td>{formatCost(totalCost)}</td>
                    <td>{r.status || "DRAFT"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span title="View" style={{ cursor: "pointer", marginRight: 6 }} onClick={() => openView(r)}><i className="ri-eye-line" /></span>
                      <span title="Duplicate" style={{ cursor: "pointer", marginRight: 6 }} onClick={() => duplicateAsCreate(r)}><i className="ri-file-copy-line" /></span>
                      <span title="Edit" style={{ cursor: "pointer", marginRight: 6 }} onClick={() => openEdit(r)}><i className="ri-edit-line" /></span>
                      <span title="Activate" style={{ cursor: "pointer", marginRight: 6 }} onClick={() => handleActivate(r)}><i className="ri-checkbox-circle-line" /></span>
                      <span title="Delete" style={{ cursor: "pointer", marginRight: 6 }} onClick={() => handleDelete(r)}><i className="ri-delete-bin-6-line" /></span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showForm && (
        <div className="sa-modal-backdrop" onClick={() => !saving && (setShowForm(false), setEditing(null))}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "Edit Recipe" : "Create Recipe"}</h3>
            <p className="sa-modal-sub">Fill recipe details and ingredient lines. Recipe Category drives the recipe type.</p>

            <form className="sa-modal-form" onSubmit={handleSave}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
                <label>
                  Code
                  <input value={form.code} onChange={(e) => updateFormField("code", e.target.value)} required />
                </label>

                <label>
                  Recipe Category *
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select value={form.recipeCategoryId} onChange={(e) => handleRecipeCategoryChange(e.target.value)} required>
                      <option value="">-- Select Recipe Category --</option>
                      {categoryOptions.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <button type="button" className="sa-secondary-button" onClick={() => { setShowAddCat(true); setAddCatError(""); }} title="Add Category">
                      + Add Category
                    </button>
                  </div>
                </label>

                <label>
                  Name
                  <input value={form.name} onChange={(e) => updateFormField("name", e.target.value)} required />
                </label>

                <label>
                  Type
                  <input value={form.type} disabled />
                </label>

                <label>
                  Resort
                  <input value={form.resort} onChange={(e) => updateFormField("resort", e.target.value)} required />
                </label>

                <label>
                  Department
                  <input value={form.department} onChange={(e) => updateFormField("department", e.target.value)} />
                </label>

                {form.type === "RECIPE_LUMPSUM" && (
                  <>
                    <label>
                      Yield Qty
                      <input type="number" min="0" value={form.yieldQty} onChange={(e) => updateFormField("yieldQty", e.target.value)} />
                      <small style={{ display: "block", color: "#6b7280" }}>Yield amount produced per batch</small>
                    </label>

                    <label>
                      Yield UOM
                      <input value={form.yieldUOM} onChange={(e) => updateFormField("yieldUOM", e.target.value)} />
                    </label>
                  </>
                )}

                {form.type === "RECIPE_PORTION" && (
                  <label>
                    Yield Portions
                    <input type="number" min="1" value={form.yieldPortions} onChange={(e) => updateFormField("yieldPortions", e.target.value)} />
                    <small style={{ display: "block", color: "#6b7280" }}>Number of portions this recipe yields</small>
                  </label>
                )}

                <label>
                  Status
                  <select value={form.status} onChange={(e) => updateFormField("status", e.target.value)}>
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </label>
              </div>

              <label style={{ marginTop: 10 }}>
                Instructions
                <textarea rows={3} value={form.instructions} onChange={(e) => updateFormField("instructions", e.target.value)} />
              </label>

              {/* Ingredients */}
              <h4 style={{ marginTop: 8 }}>Ingredients</h4>
              <div className="sa-card" style={{ padding: 10 }}>
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40%" }}>Item</th>
                      <th style={{ width: "15%" }}>Qty</th>
                      <th style={{ width: "15%" }}>UOM</th>
                      <th style={{ width: "15%" }}>Waste %</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.lines.map((ln, idx) => (
                      <tr key={ln.id}>
                        <td>
                          <select value={ln.itemId} onChange={(e) => updateLine(idx, "itemId", e.target.value)} required>
                            <option value="">-- Select item --</option>
                            {items.map((it) => (
                              <option key={it._id || it.id} value={it._id || it.id}>
                                {it.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input type="number" min="0" value={ln.qty} onChange={(e) => updateLine(idx, "qty", e.target.value)} required />
                        </td>
                        <td>
                          <input value={ln.uom || (getItem(ln.itemId)?.uom || "")} onChange={(e) => updateLine(idx, "uom", e.target.value)} />
                        </td>
                        <td>
                          <input type="number" min="0" value={ln.wastePercent} onChange={(e) => updateLine(idx, "wastePercent", e.target.value)} />
                        </td>
                        <td>{form.lines.length > 1 && <button type="button" onClick={() => removeLine(idx)}>Remove</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button type="button" className="sa-secondary-button" style={{ marginTop: 8 }} onClick={addLine}>+ Add Ingredient</button>

                <div style={{ marginTop: 12, borderTop: "1px dashed #e5e7eb", paddingTop: 8 }}>
                  <strong>Cost Preview</strong>
                  <div style={{ marginTop: 6 }}>
                    Total ingredient cost: <strong>₹ {formatCost(costPreview.totalIngredientCost)}</strong>
                    {form.type === "RECIPE_LUMPSUM" && <div>Cost per yield: <strong>₹ {formatCost(costPreview.perYieldCost ?? costPreview.totalIngredientCost)}</strong></div>}
                    {form.type === "RECIPE_PORTION" && <div>Cost per portion: <strong>₹ {formatCost(costPreview.perPortionCost ?? costPreview.totalIngredientCost)}</strong></div>}
                  </div>
                </div>
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

      {/* INLINE: Add Recipe Category Modal */}
      {showAddCat && (
        <div className="sa-modal-backdrop" onClick={() => setShowAddCat(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h3>Add Recipe Category</h3>
            <p className="sa-modal-sub">Create a recipe category (type determines recipe behaviour).</p>

            <label>
              Name *
              <input value={newCatForm.name} onChange={(e) => setNewCatForm((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. Lumpsum - Single fixed cost (Lumpsum)" />
            </label>

            <label>
              Type *
              <select value={newCatForm.type} onChange={(e) => setNewCatForm((s) => ({ ...s, type: e.target.value }))}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </label>

            <label>
              Description
              <input value={newCatForm.description} onChange={(e) => setNewCatForm((s) => ({ ...s, description: e.target.value }))} placeholder="Optional description" />
            </label>

            {addCatError && <div className="sa-modal-error">{addCatError}</div>}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="sa-secondary-button" onClick={() => setShowAddCat(false)}>Cancel</button>
              <button className="sa-primary-button" onClick={createNewRecipeCategory}>Save Category</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {showView && viewing && (
        <div className="sa-modal-backdrop" onClick={() => setShowView(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{viewing.code} — {viewing.name}</h3>
            <p className="sa-modal-sub">Category: {getCategoryById(viewing.recipeCategoryId)?.name || "-"} — Type: {viewing.type}</p>

            <div style={{ marginTop: 8 }}>
              <strong>Resort:</strong> {viewing.resort || "-"} <br />
              <strong>Department:</strong> {viewing.department || "-"} <br />
              <strong>Yield:</strong> {viewing.type === "RECIPE_PORTION" ? `${viewing.yieldPortions || "-"} portions` : `${viewing.yieldQty || "-"} ${viewing.yieldUOM || ""}`} <br />
            </div>

            <h4 style={{ marginTop: 8 }}>Ingredients</h4>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>UOM</th>
                  <th>Waste %</th>
                </tr>
              </thead>
              <tbody>
                {(viewing.lines || []).map((ln, i) => (
                  <tr key={i}>
                    <td>{getItemName(ln.itemId)}</td>
                    <td>{ln.qty}</td>
                    <td>{ln.uom}</td>
                    <td>{ln.wastePercent ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4 style={{ marginTop: 8 }}>Instructions</h4>
            <div style={{ whiteSpace: "pre-wrap", color: "#374151" }}>{viewing.instructions || "-"}</div>

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
