import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const StoreTransferRules = () => {
  const [resorts, setResorts] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedResort, setSelectedResort] = useState("");
  const [selectedFromStore, setSelectedFromStore] = useState("");

  // rulesMap[toStoreId] = { id, allowed }
  const [rulesMap, setRulesMap] = useState({});
  const [loadingMasters, setLoadingMasters] = useState(false);
  const [loadingRules, setLoadingRules] = useState(false);
  const [error, setError] = useState("");

  const loadMasters = async () => {
    try {
      setLoadingMasters(true);
      const [resortRes, storeRes] = await Promise.all([
        axios.get(`${API_BASE}/api/resorts`),
        axios.get(`${API_BASE}/api/stores`),
      ]);
      setResorts(resortRes.data || []);
      setStores(storeRes.data || []);
    } catch (err) {
      console.error("load masters error", err);
      setError("Failed to load resorts/stores");
    } finally {
      setLoadingMasters(false);
    }
  };

  const loadRules = async () => {
    if (!selectedFromStore) {
      setRulesMap({});
      return;
    }
    try {
      setLoadingRules(true);
      setError("");

      const params = { fromStore: selectedFromStore };
      if (selectedResort) params.resort = selectedResort;

      const res = await axios.get(`${API_BASE}/api/store-transfer-rules`, {
        params,
      });

      const map = {};
      (res.data || []).forEach((r) => {
        map[r.toStore?._id || r.toStore] = {
          id: r._id,
          allowed: r.isAllowed,
        };
      });
      setRulesMap(map);
    } catch (err) {
      console.error("load rules error", err);
      setError("Failed to load transfer rules");
    } finally {
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    loadMasters();
  }, []);

  useEffect(() => {
    loadRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResort, selectedFromStore]);

  const handleToggle = async (toStoreId) => {
    if (!selectedFromStore) return;

    const current = rulesMap[toStoreId];
    const newAllowed = !(current?.allowed);

    try {
      setError("");

      // optimistic update
      setRulesMap((prev) => ({
        ...prev,
        [toStoreId]: {
          ...(prev[toStoreId] || {}),
          allowed: newAllowed,
        },
      }));

      if (newAllowed) {
        // turn ON
        if (current && current.id) {
          await axios.put(
            `${API_BASE}/api/store-transfer-rules/${current.id}`,
            { isAllowed: true }
          );
        } else {
          const res = await axios.post(
            `${API_BASE}/api/store-transfer-rules`,
            {
              resort: selectedResort || null,
              fromStore: selectedFromStore,
              toStore: toStoreId,
              isAllowed: true,
            }
          );
          setRulesMap((prev) => ({
            ...prev,
            [toStoreId]: { id: res.data._id, allowed: true },
          }));
        }
      } else {
        // turn OFF
        if (current && current.id) {
          await axios.delete(
            `${API_BASE}/api/store-transfer-rules/${current.id}`
          );
          setRulesMap((prev) => {
            const next = { ...prev };
            delete next[toStoreId];
            return next;
          });
        } else {
          setRulesMap((prev) => {
            const next = { ...prev };
            delete next[toStoreId];
            return next;
          });
        }
      }
    } catch (err) {
      console.error("toggle rule error", err);
      setError(
        err.response?.data?.message ||
          "Failed to update rule, please try again"
      );
      loadRules();
    }
  };

  const filteredStores = stores.filter((s) => {
    if (!selectedResort) return true;
    if (s.resort && typeof s.resort === "object") {
      return s.resort._id === selectedResort;
    }
    if (typeof s.resort === "string") {
      return s.resort === selectedResort;
    }
    return true;
  });

  const fromStoreObj = stores.find((s) => s._id === selectedFromStore);

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>Store Transfer Rules</h2>
          <p>
            Decide which stores can transfer stock to which other stores.
            Applied when saving store replacement entries.
          </p>
        </div>
      </div>

      <div className="sa-card" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <label>
            Resort (optional)
            <select
              value={selectedResort}
              onChange={(e) => {
                setSelectedResort(e.target.value);
                setSelectedFromStore("");
                setRulesMap({});
              }}
            >
              <option value="">All Resorts</option>
              {resorts.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            From Store
            <select
              value={selectedFromStore}
              onChange={(e) => setSelectedFromStore(e.target.value)}
            >
              <option value="">Select store</option>
              {filteredStores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p style={{ marginTop: 8, fontSize: "0.8rem", opacity: 0.8 }}>
          Select a <strong>From Store</strong> and tick which stores it can
          transfer to. Same-store transfers are not allowed.
        </p>
      </div>

      <div className="sa-card">
        {loadingMasters && <div>Loading stores...</div>}

        {error && (
          <div className="sa-modal-error" style={{ marginBottom: 8 }}>
            {error}
          </div>
        )}

        {!selectedFromStore ? (
          <div style={{ fontSize: "0.9rem" }}>
            Please select a <strong>From Store</strong> to configure rules.
          </div>
        ) : (
          <>
            <h3 style={{ marginBottom: 8 }}>
              From: {fromStoreObj?.name || "Store"}
            </h3>

            {loadingRules ? (
              <div>Loading rules...</div>
            ) : (
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>To Store</th>
                    <th style={{ width: 120, textAlign: "center" }}>
                      Allowed?
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStores
                    .filter((s) => s._id !== selectedFromStore)
                    .map((store) => {
                      const rule = rulesMap[store._id];
                      const allowed = rule?.allowed ?? false;
                      return (
                        <tr key={store._id}>
                          <td>{store.name}</td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={allowed}
                              onChange={() => handleToggle(store._id)}
                            />
                          </td>
                        </tr>
                      );
                    })}

                  {filteredStores.filter(
                    (s) => s._id !== selectedFromStore
                  ).length === 0 && (
                    <tr>
                      <td colSpan={2}>
                        No other stores found for this resort.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StoreTransferRules;
