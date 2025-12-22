import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useResort } from "../../context/ResortContext";

const API_BASE =
  (import.meta.env.VITE_API_BASE || "http://localhost:5000") + "/api";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "LUMPSUM", label: "Lumpsum" },
  { value: "RECIPE_LUMPSUM", label: "Lumpsum by Recipe" },
  { value: "RECIPE_PORTION", label: "Portion by Recipe" },
];

const typeLabel = (t) => {
  if (t === "LUMPSUM") return "Lumpsum";
  if (t === "RECIPE_LUMPSUM") return "Lumpsum by Recipe";
  if (t === "RECIPE_PORTION") return "Portion by Recipe";
  return "-";
};

const ConsumptionList = () => {
  const navigate = useNavigate();
  const { selectedResort } = useResort(); // 🌍 GLOBAL RESORT

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // filters
  const [typeFilter, setTypeFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ================= LOAD DATA =================
  const loadData = async () => {
    if (!selectedResort || selectedResort === "ALL") {
      setRows([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/consumption`, {
        params: { resort: selectedResort },
      });

      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load consumption data");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [selectedResort]);

  // ================= FILTERED ROWS =================
  const filteredRows = rows.filter((r) => {
    if (typeFilter && r.type !== typeFilter) return false;

    if (dateFrom) {
      const d = new Date(r.date);
      if (d < new Date(dateFrom)) return false;
    }

    if (dateTo) {
      const d = new Date(r.date);
      if (d > new Date(dateTo)) return false;
    }

    if (searchText) {
      const q = searchText.toLowerCase();
      const text = [
        r.eventName,
        r.menuName,
        r.notes,
        ...(r.lines || []).map((l) => l.item),
      ]
        .join(" ")
        .toLowerCase();

      if (!text.includes(q)) return false;
    }

    return true;
  });

  // ================= UI =================
  return (
    <div className="sa-page">
      {/* HEADER */}
      <div className="sa-page-header">
        <div>
          <h2>Consumption</h2>
          <p>Stock consumption entries (store-wise)</p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="sa-primary-button"
            onClick={() => navigate("/super-admin/consumption/new")}
          >
            + New
          </button>

          <button className="sa-secondary-button" onClick={loadData}>
            Refresh
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div
        className="sa-card"
        style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
      >
        <label>
          Type
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </label>

        <label>
          Date To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </label>

        <label style={{ flex: 1 }}>
          Search
          <input
            placeholder="Event / Item / Notes"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </label>

        <button
          className="sa-secondary-button"
          onClick={() => {
            setTypeFilter("");
            setSearchText("");
            setDateFrom("");
            setDateTo("");
          }}
        >
          Clear
        </button>
      </div>

      {/* TABLE */}
      <div className="sa-card">
        {error && <div className="sa-modal-error">{error}</div>}

        {loading ? (
          <div>Loading...</div>
        ) : filteredRows.length === 0 ? (
          <div>No consumption records found</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Event / Menu</th>
                <th>Store</th>
                <th>Items</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((r) => (
                <tr
                  key={r._id}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(`/super-admin/consumption/${r._id}`)
                  }
                >
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td>{typeLabel(r.type)}</td>
                  <td>{r.eventName || r.menuName || "-"}</td>
                  <td>{r.storeFrom}</td>
                  <td>{r.lines?.length || 0}</td>
                  <td>{r.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ConsumptionList;
