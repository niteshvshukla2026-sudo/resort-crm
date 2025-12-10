// src/pages/superAdmin/ItemList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const UOM_OPTIONS = ["Kg", "Ltr", "Nos"];

const emptyForm = () => ({
  _id: undefined,
  name: "",
  code: "",
  itemCategory: "", // will hold category _id
  uom: "",
  brand: "",
  indicativePrice: "",
});

const ItemList = () => {
  const [items, setItems] = useState([]);
  const [itemCategories, setItemCategories] = useState([]); // [{_id,name}]
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

  // -------------------------
  // helper: get category name
  // -------------------------
  const getCategoryName = (idOrName) => {
    if (!idOrName) return "-";
    const cat =
      itemCategories.find(
        (c) => c._id === idOrName || c.name === idOrName
      ) || null;
    return cat?.name || idOrName;
  };

  // -------------------------
  // load items + categories
  // -------------------------
  const loadItems = async () => {
    try {
      setLoading(true);
      setError("");

      const [itemsRes, catsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/items`).catch((err) => {
          console.error("load items error", err);
          return { data: [] };
        }),
        axios.get(`${API_BASE}/api/item-categories`).catch((err) => {
          console.error("load item-categories error", err);
          return { data: [] };
        }),
      ]);

      const cats = Array.isArray(catsRes.data)
        ? catsRes.data.map((c) => ({
            _id: c._id || c.id,
            name: c.name || c.code || "",
          }))
        : [];
      setItemCategories(cats);

      const serverItems = Array.isArray(itemsRes.data)
        ? itemsRes.data.map((it) => ({
            _id: it._id || it.id,
            code: it.code || "",
            name: it.name || "",
            itemCategory:
              typeof it.itemCategory === "object"
                ? it.itemCategory._id || it.itemCategory.id
                : it.itemCategory || "",
            uom: it.uom || "",
            brand: it.brand || "",
            indicativePrice: it.indicativePrice ?? "",
          }))
        : [];

      setItems(serverItems);

      // distinct brands from items
      const brandSet = new Set(
        serverItems.map((i) => i.brand).filter(Boolean)
      );
      setBrands(Array.from(brandSet));
    } catch (err) {
      console.error("loadItems fatal error", err);
      setError("Failed to load items");
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
        itemCategory: form.itemCategory || undefined, // _id
        uom: form.uom,
        brand: form.brand || "",
        indicativePrice: form.indicativePrice
          ? Number(form.indicativePrice)
          : undefined,
      };

      if (form._id) {
        // update
        const res = await axios
          .put(`${API_BASE}/api/items/${form._id}`, payload)
          .catch(() => null);
        if (res?.data) {
          const mapped = {
            _id: res.data._id || res.data.id,
            code: res.data.code || "",
            name: res.data.name || "",
            itemCategory:
              typeof res.data.itemCategory === "object"
                ? res.data.itemCategory._id || res.data.itemCategory.id
                : res.data.itemCategory || "",
            uom: res.data.uom || "",
            brand: res.data.brand || "",
            indicativePrice: res.data.indicativePrice ?? "",
          };
          setItems((p) =>
            p.map((x) =>
              x._id === form._id || x.id === form._id ? mapped : x
            )
          );
        } else {
          setItems((p) =>
            p.map((x) =>
              x._id === form._id || x.id === form._id
                ? { ...x, ...payload }
                : x
            )
          );
        }
      } else {
        // create
        const res = await axios
          .post(`${API_BASE}/api/items`, payload)
          .catch(() => null);
        const mapped = res?.data
          ? {
              _id: res.data._id || res.data.id,
              code: res.data.code || "",
              name: res.data.name || "",
              itemCategory:
                typeof res.data.itemCategory === "object"
                  ? res.data.itemCategory._id || res.data.itemCategory.id
                  : res.data.itemCategory || "",
              uom: res.data.uom || "",
              brand: res.data.brand || "",
              indicativePrice: res.data.indicativePrice ?? "",
            }
          : { ...payload, _id: `local_${Date.now()}` };
        setItems((p) => [mapped, ...p]);
      }

      // new brand add to list (local)
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
      setItems((p) =>
        p.filter(
          (x) => (x._id || x.id || x.code) !== (it._id || it.id || it.code)
        )
      );
      await axios
        .delete(`${API_BASE}/api/items/${it._id || it.id || it.code}`)
        .catch(() => null);
    } catch (err) {
      console.error("delete item error", err);
      setError("Failed to delete item");
      await loadItems();
    }
  };

  // -------------------------
  // filters
  // -------------------------
  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      if (
        filterName &&
        !i.name?.toLowerCase().includes(filterName.toLowerCase())
      )
        return false;
      if (
        filterCode &&
        !i.code?.toLowerCase().includes(filterCode.toLowerCase())
      )
        return false;
      if (
        filterItemCategory &&
        (i.itemCategory || "").toString() !== filterItemCategory
      )
        return false;
      if (
        filterUOM &&
        (i.uom || "").toLowerCase() !== filterUOM.toLowerCase()
      )
        return false;
      if (
        filterBrand &&
        (i.brand || "").toLowerCase() !== filterBrand.toLowerCase()
      )
        return false;
      return true;
    });
  }, [
    items,
    filterName,
    filterCode,
    filterItemCategory,
    filterUOM,
    filterBrand,
  ]);

  // -------------------------
  // CSV upload/export (minimal adjust: itemCategory is name in CSV)
  // -------------------------
  const handleCSVUpload = (file) => {
    setCsvError("");
    if (!file) return;
    setCsvLoading(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
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

      const payloads = parsed.map((p) => {
        const catName =
          p.itemcategory || p.itemCategory || p.category || "";
        const cat =
          itemCategories.find(
            (c) =>
              c.name.toLowerCase() === catName.toLowerCase() ||
              c._id === catName
          ) || null;

        return {
          code: p.code,
          name: p.name,
          itemCategory: cat?._id,
          uom: p.uom,
          brand: p.brand || "",
          indicativePrice: p.indicativeprice
            ? Number(p.indicativeprice)
            : undefined,
        };
      });

      // optimistic local add
      const addedLocal = payloads.map((pl) => ({
        ...pl,
        _id: `local_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      }));
      setItems((prev) => [...prev, ...addedLocal]);

      try {
        for (const pl of payloads) {
          try {
            const res = await axios
              .post(`${API_BASE}/api/items`, pl)
              .catch(() => null);
            if (res?.data) {
              const mapped = {
                _id: res.data._id || res.data.id,
                code: res.data.code || "",
                name: res.data.name || "",
                itemCategory:
                  typeof res.data.itemCategory === "object"
                    ? res.data.itemCategory._id || res.data.itemCategory.id
                    : res.data.itemCategory || "",
                uom: res.data.uom || "",
                brand: res.data.brand || "",
                indicativePrice: res.data.indicativePrice ?? "",
              };
              setItems((prev) =>
                prev.map((it) =>
                  it._id?.startsWith("local_") && it.code === pl.code
                    ? mapped
                    : it
                )
              );
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
    const cols = ["code", "name", "itemCategory", "uom", "brand", "indicativePrice"];
    const rows = [cols.join(",")].concat(
      filteredItems.map((i) =>
        cols
          .map((c) => {
            let val = i[c];
            if (c === "itemCategory") {
              val = getCategoryName(i.itemCategory);
            }
            const s = String(val ?? "");
            if (s.includes(",") || s.includes("\n"))
              return `"${s.replace(/"/g, '""')}"`;
            return s;
          })
          .join(",")
      )
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

  const downloadCSVFormat = () => {
    const cols = ["code", "name", "itemCategory", "uom", "brand", "indicativePrice"];
    const cats = itemCategories.map((c) => c.name);
    const example = ["RICE1", "Basmati Rice 5kg", cats[0] || "", "Kg", "BrandName", "60"];

    const rows = [];
    rows.push(cols.join(","));
    rows.push(example.join(","));
    rows.push(`#CATEGORIES:${cats.join("|")}`);

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
      alert(
        "CSV format downloaded and copied to clipboard (categories provided in metadata lines)."
      );
    } catch {
      alert("CSV format downloaded.");
    }
  };

  // -------------------------
  // UI
  // -------------------------
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
            {csvLoading ? (
              <span style={{ marginLeft: 6 }}>Uploading...</span>
            ) : (
              <span style={{ marginLeft: 6 }}>Upload CSV</span>
            )}
          </label>

          <button
            className="sa-secondary-button"
            onClick={downloadCSVFormat}
            title="Download CSV format with sample row and allowed categories"
          >
            CSV Format
          </button>

          <button
            className="sa-secondary-button"
            onClick={handleExportCSV}
            title="Export filtered items to CSV"
          >
            Export CSV
          </button>

          <button
            className="sa-primary-button"
            type="button"
            onClick={openCreate}
          >
            <i className="ri-add-line" /> Add New Item
          </button>
        </div>
      </div>

      {error && (
        <div className="sa-modal-error" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}
      {csvError && (
        <div className="sa-modal-error" style={{ marginBottom: 8 }}>
          {csvError}
        </div>
      )}

      {/* FILTERS */}
      <div
        className="sa-card"
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <label>
          Name
          <input
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="Search name..."
            style={{ marginLeft: 8 }}
          />
        </label>

        <label>
          Code
          <input
            value={filterCode}
            onChange={(e) => setFilterCode(e.target.value)}
            placeholder="Search code..."
            style={{ marginLeft: 8 }}
          />
        </label>

        <label>
          Item Category
          <select
            value={filterItemCategory}
            onChange={(e) => setFilterItemCategory(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="">All</option>
            {itemCategories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Measurement (UOM)
          <select
            value={filterUOM}
            onChange={(e) => setFilterUOM(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="">All</option>
            {UOM_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>

        <label>
          Brand
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="">All</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
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
          <div style={{ fontSize: "0.9rem" }}>
            No items found. Add your first item or upload a CSV.
          </div>
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
                  <td>{getCategoryName(i.itemCategory)}</td>
                  <td>{i.uom || "-"}</td>
                  <td>{i.brand || "-"}</td>
                  <td>
                    {i.indicativePrice !== undefined &&
                    i.indicativePrice !== ""
                      ? `₹${String(i.indicativePrice)}`
                      : "-"}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button
                      className="sa-secondary-button"
                      onClick={() => {
                        navigator.clipboard?.writeText(JSON.stringify(i));
                        alert("Copied");
                      }}
                      title="Copy JSON"
                    >
                      Copy
                    </button>

                    <button
                      className="sa-secondary-button"
                      onClick={() => openEdit(i)}
                      title="Edit"
                    >
                      Edit
                    </button>

                    <button
                      className="sa-secondary-button"
                      onClick={() => handleDelete(i)}
                      title="Delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create / Edit Item */}
      {showForm && (
        <div
          className="sa-modal-backdrop"
          onClick={() => !saving && setShowForm(false)}
        >
          <div
            className="sa-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 720 }}
          >
            <h3>{form._id ? "Edit Item" : "Add New Item"}</h3>
            <p className="sa-modal-sub">
              Define item — Item Category, Brand, UOM and Indicative Price.
            </p>

            <form className="sa-modal-form" onSubmit={handleSubmit}>
              <label>
                Item Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Basmati Rice 5kg"
                  required
                />
              </label>

              <label>
                Code
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="e.g. RICE1"
                  required
                />
              </label>

              <label>
                Item Category
                <select
                  name="itemCategory"
                  value={form.itemCategory}
                  onChange={handleChange}
                >
                  <option value="">-- none --</option>
                  {itemCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Measurement (UOM)
                <select
                  name="uom"
                  value={form.uom}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select --</option>
                  {UOM_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Brand
                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="Brand name (optional)"
                />
                <small
                  style={{ display: "block", color: "#6b7280", marginTop: 2 }}
                >
                  Type a new brand name to add it.
                </small>
              </label>

              <label>
                Indicative Price (₹)
                <input
                  name="indicativePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.indicativePrice}
                  onChange={handleChange}
                  placeholder="Numeric price per selected UOM"
                />
              </label>

              {error && <div className="sa-modal-error">{error}</div>}

              <div className="sa-modal-actions">
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
                  {saving ? "Saving..." : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemList;
