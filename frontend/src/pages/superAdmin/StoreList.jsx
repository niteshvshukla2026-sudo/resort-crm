import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/axios"; // 🔥 IMPORTANT: interceptor axios
import { useResort } from "../../context/ResortContext";

const emptyForm = () => ({ _id: undefined, name: "" });

const StoreList = () => {
  const { selectedResort } = useResort(); // 🌍 GLOBAL RESORT

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // modal
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // filters
  const [filterName, setFilterName] = useState("");
  const [filterCode, setFilterCode] = useState("");

  // ================= LOAD STORES =================
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      let url = "/stores";
      if (selectedResort && selectedResort !== "ALL") {
        url += `?resort=${selectedResort}`;
      }

      const res = await api.get(url);
      setStores(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("load stores error", err);
      setError("Failed to load stores");
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedResort) return;
    loadData();
  }, [selectedResort]);

  // ================= FILTER =================
  const filtered = useMemo(() => {
    return stores.filter((s) => {
      if (
        filterName &&
        !s.name?.toLowerCase().includes(filterName.toLowerCase())
      )
        return false;

      if (
        filterCode &&
        !s.code?.toLowerCase().includes(filterCode.toLowerCase())
      )
        return false;

      return true;
    });
  }, [stores, filterName, filterCode]);

  // ================= FORM =================
  const openCreateForm = () => {
    if (selectedResort === "ALL") {
      alert("Please select a resort first");
      return;
    }
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEditForm = (s) => {
    setForm({
      _id: s._id,
      name: s.name || "",
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // ================= SAVE =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Store name is required");
      return;
    }

    if (!selectedResort || selectedResort === "ALL") {
      setError("Please select a resort");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        resort: selectedResort,
      };

      if (form._id) {
        await api.put(`/stores/${form._id}`, payload);
      } else {
        await api.post(`/stores`, payload);
      }

      await loadData();
      setShowForm(false);
      setForm(emptyForm());
    } catch (err) {
      console.error("save store error", err);
      setError(err.response?.data?.message || "Failed to save store");
    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (s) => {
    if (!window.confirm(`Delete store "${s.name}"?`)) return;
    try {
      await api.delete(`/stores/${s._id}`);
      await loadData();
    } catch (err) {
      console.error("delete store error", err);
      setError("Failed to delete store");
    }
  };

  // ================= UI =================
  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>Stores</h2>
          <p>
            Showing stores for{" "}
            <strong>
              {selectedResort === "ALL" ? "All Resorts" : "Selected Resort"}
            </strong>
          </p>
        </div>

        <button className="sa-primary-button" onClick={openCreateForm}>
          <i className="ri-add-line" /> New Store
        </button>
      </div>

      {error && <div className="sa-modal-error">{error}</div>}

      {/* Filters */}
      <div className="sa-card" style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Filter name..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
        />
        <input
          placeholder="Filter code..."
          value={filterCode}
          onChange={(e) => setFilterCode(e.target.value)}
        />
        <div style={{ marginLeft: "auto", color: "#9ca3af" }}>
          {filtered.length} / {stores.length}
        </div>
      </div>

      {/* List */}
      <div className="sa-card">
        {loading ? (
          <div>Loading stores...</div>
        ) : filtered.length === 0 ? (
          <div>No stores found</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td>{s.code}</td>
                  <td>
                    <button
                      className="sa-secondary-button"
                      onClick={() => openEditForm(s)}
                    >
                      <i className="ri-edit-line" />
                    </button>
                    <button
                      className="sa-secondary-button"
                      onClick={() => handleDelete(s)}
                    >
                      <i className="ri-delete-bin-6-line" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div
          className="sa-modal-backdrop"
          onClick={() => !saving && setShowForm(false)}
        >
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{form._id ? "Edit Store" : "New Store"}</h3>

            <form onSubmit={handleSubmit}>
              <label>
                Store Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </label>

              {error && <div className="sa-modal-error">{error}</div>}

              <div className="sa-modal-actions">
                <button
                  type="button"
                  className="sa-secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-primary-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreList;
