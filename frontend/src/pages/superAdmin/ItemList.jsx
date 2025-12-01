// src/pages/superAdmin/ItemList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// --- 10 dev sample items for quick dev/demo (no dept category) ---
const DEV_ITEMS = [
  { _id: "dev_item_1", code: "RICE1", name: "Basmati Rice 5kg", itemCategory: "Pantry", uom: "Kg", brand: "GrainCo", indicativePrice: 60 },
  { _id: "dev_item_2", code: "OIL1L", name: "Sunflower Oil 1L", itemCategory: "Cooking Oil", uom: "Ltr", brand: "OilPure", indicativePrice: 120 },
  { _id: "dev_item_3", code: "SALT1", name: "Iodized Salt 1kg", itemCategory: "Pantry", uom: "Kg", brand: "SaltWell", indicativePrice: 25 },
  { _id: "dev_item_4", code: "MIL1L", name: "Fresh Milk 1L", itemCategory: "Dairy", uom: "Ltr", brand: "DairyBest", indicativePrice: 45 },
  { _id: "dev_item_5", code: "EGG12", name: "Eggs Pack 12", itemCategory: "Dairy", uom: "Nos", brand: "FarmFresh", indicativePrice: 70 },
  { _id: "dev_item_6", code: "SUGAR5", name: "Sugar 5kg", itemCategory: "Pantry", uom: "Kg", brand: "SweetCo", indicativePrice: 40 },
  { _id: "dev_item_7", code: "SOAP1L", name: "Liquid Soap 1L", itemCategory: "Cleaning", uom: "Ltr", brand: "CleanPro", indicativePrice: 90 },
  { _id: "dev_item_8", code: "BREAD1", name: "Bread Loaf", itemCategory: "Bakery", uom: "Nos", brand: "BakeHouse", indicativePrice: 35 },
  { _id: "dev_item_9", code: "CHICK1", name: "Chicken (1kg)", itemCategory: "Meat", uom: "Kg", brand: "PoultryKing", indicativePrice: 200 },
  { _id: "dev_item_10", code: "CUPP100", name: "Disposable Cups 100pcs", itemCategory: "Housekeeping", uom: "Nos", brand: "PackIt", indicativePrice: 50 },
];

// --- 10 dummy brands
const DEV_BRANDS = ["GrainCo","OilPure","SaltWell","DairyBest","FarmFresh","SweetCo","CleanPro","BakeHouse","PoultryKing","PackIt"];

// fallback categories if server empty
const DEV_ITEM_CATEGORIES = ["Pantry", "Cooking Oil", "Dairy", "Cleaning", "Bakery", "Meat", "Housekeeping"];

const UOM_OPTIONS = ["Kg", "Ltr", "Nos"];

const emptyForm = () => ({
  _id: undefined,
  name: "",
  code: "",
  itemCategory: "",
  uom: "",
  brand: "",
  indicativePrice: "",
});

const ItemList = () => {
  const [items, setItems] = useState([]);
  const [itemCategories, setItemCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // filters
  const [filterName, setFilterName] = useState("");
  const [filterCode, setFilterCode] = useState("");
  const [filterItemCategory, setFilterItemCategory] = useState("");
  const [filterUOM, setFilterUOM] = useState("");
  const [filterBrand, setFilterBrand] = useState("");

  // CSV upload
  const [csvError, setCsvError] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);

  // load items, categories, brands and merge dev samples (avoid duplicates)
  const loadItems = async () => {
    try {
      setLoading(true);
      setError("");

      const [itemsRes, catsRes, brandsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/items`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/item-categories`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/brands`).catch(() => ({ data: [] })),
      ]);

      const serverItems = Array.isArray(itemsRes.data)
        ? itemsRes.data.map((it) => ({
            _id: it._id || it.id || undefined,
            code: it.code || it._id || it.id || "",
            name: it.name || "",
            itemCategory: it.itemCategory || it.item_category || it.category || "",
            uom: it.uom || it.measurement || "",
            brand: it.brand || it.manufacturer || "",
            indicativePrice:
              it.indicativePrice ??
              it.indicative_price ??
              it.price ??
              (typeof it.indicative === "number" ? it.indicative : undefined) ??
              "",
          }))
        : [];

      // merge - add dev items only if code not present
      const existingCodes = new Set(serverItems.map((i) => (i.code || "").toString()));
      const toAdd = DEV_ITEMS.filter((d) => !existingCodes.has(d.code));
      setItems([...serverItems, ...toAdd]);

      // categories
      const serverCats = Array.isArray(catsRes.data)
        ? catsRes.data.map((c) => (typeof c === "string" ? c : c.name || c.code || c._id || c.id))
        : [];
      setItemCategories(serverCats.length ? Array.from(new Set(serverCats)) : DEV_ITEM_CATEGORIES);

      // brands
      const serverBrands = Array.isArray(brandsRes.data)
        ? brandsRes.data.map((b) => (typeof b === "string" ? b : b.name || b.code || b._id || b.id))
        : [];
      setBrands(serverBrands.length ? Array.from(new Set(serverBrands)) : DEV_BRANDS);
    } catch (err) {
      console.error("load items error", err);
      setError("Failed to load items; using sample data");
      setItems(DEV_ITEMS);
      setItemCategories(DEV_ITEM_CATEGORIES);
      setBrands(DEV_BRANDS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setForm(emptyForm());
    setError("");
    setShowForm(true);
  };

  const openEdit = (it) => {
    setForm({
      _id: it._id || it.id,
      code: it.code || "",
      name: it.name || "",
      itemCategory: it.itemCategory || "",
      uom: it.uom || "",
      brand: it.brand || "",
      indicativePrice: it.indicativePrice ?? "",
    });
    setError("");
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name?.trim() || !form.code?.trim() || !form.uom) {
      setError("Item Name, Code & Measurement (UOM) required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        itemCategory: form.itemCategory || "",
        uom: form.uom,
        brand: form.brand || "",
        indicativePrice: form.indicativePrice ? Number(form.indicativePrice) : undefined,
      };

      if (form._id) {
        const res = await axios.put(`${API_BASE}/api/items/${form._id}`, payload).catch(() => null);
        if (res?.data) {
          setItems((p) => p.map((x) => (x._id === form._id || x.id === form._id ? res.data : x)));
        } else {
          setItems((p) => p.map((x) => (x._id === form._id || x.id === form._id ? { ...x, ...payload } : x)));
        }
      } else {
        const res = await axios.post(`${API_BASE}/api/items`, payload).catch(() => null);
        const created = res?.data ? res.data : { ...payload, _id: `local_${Date.now()}` };
        setItems((p) => [created, ...p]);
      }

      // if brand new brand typed, add to brands list (local)
      if (form.brand && !brands.includes(form.brand)) {
        setBrands((b) => [form.brand, ...b]);
      }

      setShowForm(false);
      setForm(emptyForm());
    } catch (err) {
      console.error("save error", err);
      setError(err.response?.data?.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (it) => {
    if (!window.confirm(`Delete item ${it.name || it.code}?`)) return;
    try {
      setItems((p) => p.filter((x) => (x._id || x.id || x.code) !== (it._id || it.id || it.code)));
      await axios.delete(`${API_BASE}/api/items/${it._id || it.id || it.code}`).catch(() => null);
    } catch (err) {
      console.error("delete item error", err);
      setError("Failed to delete item");
      await loadItems();
    }
  };

  // filters
  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      if (filterName && !i.name?.toLowerCase().includes(filterName.toLowerCase())) return false;
      if (filterCode && !i.code?.toLowerCase().includes(filterCode.toLowerCase())) return false;
      if (filterItemCategory && (i.itemCategory || "").toLowerCase() !== filterItemCategory.toLowerCase()) return false;
      if (filterUOM && (i.uom || "").toLowerCase() !== filterUOM.toLowerCase()) return false;
      if (filterBrand && (i.brand || "").toLowerCase() !== filterBrand.toLowerCase()) return false;
      return true;
    });
  }, [items, filterName, filterCode, filterItemCategory, filterUOM, filterBrand]);

  // CSV upload parsing & submit (columns: code,name,itemCategory,uom,brand,indicativePrice)
  const handleCSVUpload = (file) => {
    setCsvError("");
    if (!file) return;
    setCsvLoading(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      // ignore metadata/comment lines beginning with #
      const allRows = text.split(/\r?\n/).map((r) => r.trim());
      const rows = allRows.filter(Boolean).filter((r) => !r.startsWith("#"));
      if (rows.length === 0) {
        setCsvError("Empty CSV");
        setCsvLoading(false);
        return;
      }

      const header = rows[0].split(",").map((h) => h.trim().toLowerCase());
      const headerSet = new Set(header);
      if (!headerSet.has("code") || !headerSet.has("name") || !headerSet.has("uom")) {
        setCsvError("CSV must contain at least: code, name, uom columns");
        setCsvLoading(false);
        return;
      }

      const parsed = [];
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(",").map((c) => c.trim());
        if (cols.length === 0) continue;
        const obj = {};
        for (let c = 0; c < header.length; c++) {
          obj[header[c]] = cols[c] ?? "";
        }
        parsed.push(obj);
      }

      if (parsed.length === 0) {
        setCsvError("No data rows found in CSV");
        setCsvLoading(false);
        return;
      }

      const payloads = parsed.map((p) => ({
        code: p.code,
        name: p.name,
        itemCategory: p.itemcategory || p.itemCategory || "",
        uom: p.uom,
        brand: p.brand || "",
        indicativePrice: p.indicativeprice ? Number(p.indicativeprice) : undefined,
      }));

      // optimistic local add
      const addedLocal = payloads.map((pl) => ({ ...pl, _id: `local_${Date.now()}_${Math.floor(Math.random()*1000)}` }));
      setItems((prev) => [...prev, ...addedLocal]);

      try {
        for (const pl of payloads) {
          try {
            const res = await axios.post(`${API_BASE}/api/items`, pl).catch(() => null);
            if (res?.data) {
              setItems((prev) => prev.map((it) => (it._id?.startsWith("local_") && it.code === pl.code ? res.data : it)));
            }
          } catch (err) {
            console.warn("failed to create item from CSV:", pl.code, err);
          }
        }
      } catch (err) {
        console.error("CSV upload server error", err);
      } finally {
        setCsvLoading(false);
      }
    };

    reader.onerror = () => {
      setCsvError("Failed to read file");
      setCsvLoading(false);
    };

    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    const cols = ["code","name","itemCategory","uom","brand","indicativePrice"];
    const rows = [cols.join(",")].concat(
      filteredItems.map((i) => cols.map((c) => {
        const val = i[c] ?? "";
        const s = String(val ?? "");
        if (s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g,'""')}"`;
        return s;
      }).join(","))
    );
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `items-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // new: download CSV format with metadata comments so user can see dropdown values
  const downloadCSVFormat = () => {
    const cols = ["code","name","itemCategory","uom","brand","indicativePrice"];
    const example = ["RICE1","Basmati Rice 5kg","Pantry","Kg","GrainCo","60"];
    const metaCats = itemCategories.length ? itemCategories : DEV_ITEM_CATEGORIES;
    const metaBrands = brands.length ? brands : DEV_BRANDS;

    const rows = [];
    rows.push(cols.join(","));
    rows.push(example.join(","));
    // metadata lines (start with # so parser ignores them)
    rows.push(`#CATEGORIES:${metaCats.join("|")}`);
    rows.push(`#BRANDS:${metaBrands.join("|")}`);

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `items-csv-format-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    try {
      navigator.clipboard?.writeText(csv);
      alert("CSV format downloaded and copied to clipboard (categories & brands provided in metadata lines).");
    } catch {
      // ignore clipboard errors
      alert("CSV format downloaded. (If supported, format was also copied to clipboard.)");
    }
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>Items</h2>
          <p>Central item master — Item Category, Brand, UOM and Indicative Price.</p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                handleCSVUpload(f);
                e.target.value = "";
              }}
              title="Upload CSV (columns: code,name,itemCategory,uom,brand,indicativePrice)"
            />
            {csvLoading ? <span style={{ marginLeft: 6 }}>Uploading...</span> : <span style={{ marginLeft: 6 }}>Upload CSV</span>}
          </label>

          <button className="sa-secondary-button" onClick={downloadCSVFormat} title="Download CSV format with sample row and allowed categories/brands">
            CSV Format
          </button>

          <button className="sa-secondary-button" onClick={handleExportCSV} title="Export filtered items to CSV">
            Export CSV
          </button>

          <button className="sa-primary-button" type="button" onClick={openCreate}>
            <i className="ri-add-line" /> Add New Item
          </button>
        </div>
      </div>

      {error && <div className="sa-modal-error" style={{ marginBottom: 8 }}>{error}</div>}
      {csvError && <div className="sa-modal-error" style={{ marginBottom: 8 }}>{csvError}</div>}

      {/* FILTERS */}
      <div className="sa-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <label>
          Name
          <input value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="Search name..." style={{ marginLeft: 8 }} />
        </label>

        <label>
          Code
          <input value={filterCode} onChange={(e) => setFilterCode(e.target.value)} placeholder="Search code..." style={{ marginLeft: 8 }} />
        </label>

        <label>
          Item Category
          <select value={filterItemCategory} onChange={(e) => setFilterItemCategory(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            {itemCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label>
          Measurement (UOM)
          <select value={filterUOM} onChange={(e) => setFilterUOM(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            {UOM_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>

        <label>
          Brand
          <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>

        <div style={{ marginLeft: "auto", color: "#9ca3af" }}>
          Showing {filteredItems.length} / {items.length}
        </div>
      </div>

      <div className="sa-card">
        {loading ? (
          <div style={{ fontSize: "0.9rem" }}>Loading items...</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ fontSize: "0.9rem" }}>No items found. Add your first item or upload a CSV.</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Item Name</th>
                <th>Item Category</th>
                <th>Measurement</th>
                <th>Brand</th>
                <th>Indicative Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((i) => (
                <tr key={i._id || i.id || i.code}>
                  <td>{i.code}</td>
                  <td>{i.name}</td>
                  <td>{i.itemCategory || "-"}</td>
                  <td>{i.uom || "-"}</td>
                  <td>{i.brand || "-"}</td>
                  <td>{i.indicativePrice !== undefined && i.indicativePrice !== "" ? `₹${String(i.indicativePrice)}` : "-"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="sa-secondary-button" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(i)); alert("Copied"); }} title="Copy JSON">Copy</button>

                    <button
                      className="sa-secondary-button"
                      onClick={() => openEdit(i)}
                      title="Edit"
                    >
                      Edit
                    </button>

                    <button className="sa-secondary-button" onClick={() => handleDelete(i)} title="Delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create / Edit Item */}
      {showForm && (
        <div className="sa-modal-backdrop" onClick={() => !saving && setShowForm(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <h3>{form._id ? "Edit Item" : "Add New Item"}</h3>
            <p className="sa-modal-sub">Define item — Item Category, Brand, UOM and Indicative Price.</p>

            <form className="sa-modal-form" onSubmit={handleSubmit}>
              <label>
                Item Name
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Basmati Rice 5kg" required />
              </label>

              <label>
                Code
                <input name="code" value={form.code} onChange={handleChange} placeholder="e.g. RICE1" required />
              </label>

              <label>
                Item Category
                <select name="itemCategory" value={form.itemCategory} onChange={handleChange}>
                  <option value="">-- none --</option>
                  {itemCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label>
                Measurement (UOM)
                <select name="uom" value={form.uom} onChange={handleChange} required>
                  <option value="">-- Select --</option>
                  {UOM_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>

              <label>
                Brand
                <select name="brand" value={form.brand} onChange={handleChange}>
                  <option value="">-- none --</option>
                  {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <small style={{ display: "block", color: "#6b7280" }}>If brand not listed, type it in the Brand field and save (it will be added locally).</small>
              </label>

              <label>
                Indicative Price (₹)
                <input name="indicativePrice" type="number" min="0" step="0.01" value={form.indicativePrice} onChange={handleChange} placeholder="Numeric price per selected UOM" />
              </label>

              {error && <div className="sa-modal-error">{error}</div>}

              <div className="sa-modal-actions">
                <button type="button" className="sa-secondary-button" onClick={() => !saving && setShowForm(false)}>Cancel</button>
                <button type="submit" className="sa-primary-button" disabled={saving}>{saving ? "Saving..." : "Save Item"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemList;
