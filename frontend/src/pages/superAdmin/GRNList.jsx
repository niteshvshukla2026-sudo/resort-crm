import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// row template
const line = () => ({
  lineId: `grn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  item: "",
  poQty: 0,
  receivedQty: "",
  rejectedQty: "",
  acceptedQty: 0,
});

// --- 5 Dummy GRN samples for dev/demo ---
const DEV_GRN_SAMPLES = [
  {
    _id: "sample_grn_1",
    grnNo: "GRN-2025-101",
    poId: "sample_po_1",
    vendor: "vendor_1",
    resort: "resort_1",
    store: "store_1",
    grnDate: new Date().toISOString(),
    status: "Open",
    lines: [
      { lineId: "ln1", item: "item_1", poQty: 10, receivedQty: 10, rejectedQty: 0, acceptedQty: 10 },
      { lineId: "ln2", item: "item_2", poQty: 5, receivedQty: 5, rejectedQty: 0, acceptedQty: 5 },
    ],
  },
];

const GRNList = () => {
  const [grnList, setGrnList] = useState([]);
  const [poList, setPoList] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingGrnId, setEditingGrnId] = useState(null); // null -> create, otherwise edit

  const [form, setForm] = useState({
    resort: "",
    store: "",
    vendor: "",
    poId: "",
    grnDate: new Date().toISOString().slice(0, 10),
    lines: [line()],
    grnNo: "",
  });

  const navigate = useNavigate();

  // FILTER STATES
  const [statusFilter, setStatusFilter] = useState("ALL"); 
  const [actionFilter, setActionFilter] = useState("ALL"); 
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [resortFilter, setResortFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [grnRes, poRes, vendorRes, resortRes, storeRes, itemRes] = await Promise.all([
        axios.get(`${API_BASE}/api/grn`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/po`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/vendors`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/resorts`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/stores`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/items`).catch(() => ({ data: [] })),
      ]);

      const serverGrns = Array.isArray(grnRes.data) ? grnRes.data : [];
      const existingIds = new Set(serverGrns.map((g) => g._id));
      const samplesToAdd = DEV_GRN_SAMPLES.filter((s) => !existingIds.has(s._id));

      setGrnList([...serverGrns, ...samplesToAdd]);
      setPoList(Array.isArray(poRes.data) ? poRes.data : []);
      setVendors(Array.isArray(vendorRes.data) ? vendorRes.data : []);
      setResorts(Array.isArray(resortRes.data) ? resortRes.data : []);
      setStores(Array.isArray(storeRes.data) ? storeRes.data : []);
      setItems(Array.isArray(itemRes.data) ? itemRes.data : []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const viewGrn = (g) => {
    const idOrNo = g._id || g.grnNo;
    if (!idOrNo) return;
    navigate(`/super-admin/grn/${idOrNo}`);
  };

  const openEditGrn = (g) => {
    // ❌ prevent editing if approved
    if (g.status === "Approved") return alert("Approved GRN cannot be edited");

    setEditingGrnId(g._id || g.id);
    setForm({
      grnNo: g.grnNo || "",
      resort: g.resort || "",
      store: g.store || "",
      vendor: g.vendor || "",
      poId: g.poId || "",
      grnDate: (g.grnDate || g.date || new Date().toISOString()).slice(0, 10),
      lines:
        (g.lines &&
          g.lines.map((ln) => ({
            lineId: ln.lineId || `grn_${Math.floor(Math.random() * 100000)}`,
            item: ln.item || "",
            poQty: ln.poQty || 0,
            receivedQty: ln.receivedQty || "",
            rejectedQty: ln.rejectedQty || "",
            acceptedQty: ln.acceptedQty || 0,
          }))) ||
        [line()],
    });
    setShowForm(true);
  };

  const handleDelete = async (g) => {
    if (g.status === "Approved") return alert("Approved GRN cannot be deleted");

    if (!window.confirm(`❗ Delete GRN ${g.grnNo}?`)) return;
    try {
      setGrnList((p) => p.filter((x) => x._id !== g._id));
      await axios.delete(`${API_BASE}/api/grn/${g._id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to delete");
      await loadData();
    }
  };

  return (
    <div className="sa-page">
      {/* HEADER */}
      <div className="sa-page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h2>GRN (Goods Receipt)</h2>
          <p>GRNs created from Purchase Orders. Manual GRN creation disabled.</p>
        </div>

        {/* 🔥 NO NEW GRN BUTTON */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="sa-secondary-button"
            onClick={() => {
              loadData();
            }}
          >
            Refresh
          </button>
        </div>
      </div>
      
      {/* GRN LIST */}
      <div className="sa-card">
        {loading ? (
          <div>Loading…</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>GRN No</th>
                <th>PO No</th>
                <th>Vendor</th>
                <th>Resort</th>
                <th>Store</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {grnList.map((g) => (
                <tr key={g._id}>
                  <td onClick={() => viewGrn(g)} style={{ cursor: "pointer", color: "#0b69ff" }}>
                    {g.grnNo}
                  </td>
                  <td>{g.poId}</td>
                  <td>{g.vendor}</td>
                  <td>{g.resort}</td>
                  <td>{g.store}</td>
                  <td>{g.grnDate?.slice(0, 10)}</td>
                  <td>{g.status || "Open"}</td>

                  <td style={{ whiteSpace: "nowrap" }}>
                    
                    {/* VIEW */}
                    <span style={{ cursor: "pointer", padding: 6 }} title="View" onClick={() => viewGrn(g)}>
                      <i className="ri-eye-line" />
                    </span>

                    {/* EDIT (Disabled after approval) */}
                    {g.status === "Approved" ? (
                      <span style={{ opacity: 0.4, padding: 6 }}>
                        <i className="ri-edit-line" />
                      </span>
                    ) : (
                      <span style={{ cursor: "pointer", padding: 6 }} title="Edit" onClick={() => openEditGrn(g)}>
                        <i className="ri-edit-line" />
                      </span>
                    )}

                    {/* DELETE (Disabled after approval) */}
                    {g.status === "Approved" ? (
                      <span style={{ opacity: 0.4, padding: 6 }}>
                        <i className="ri-delete-bin-6-line" />
                      </span>
                    ) : (
                      <span style={{ cursor: "pointer", padding: 6 }} title="Delete" onClick={() => handleDelete(g)}>
                        <i className="ri-delete-bin-6-line" />
                      </span>
                    )}

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GRNList;
