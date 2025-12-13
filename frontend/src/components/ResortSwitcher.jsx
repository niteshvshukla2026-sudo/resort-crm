import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useResort } from "../context/ResortContext";

const ResortSwitcher = () => {
  const { selectedResort, setSelectedResort } = useResort();
  const [resorts, setResorts] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        // ✅ api already has /api prefix
        const res = await api.get("/resorts");
        setResorts(res.data || []);
      } catch (err) {
        console.error("Failed to load resorts", err);
      }
    }
    load();
  }, []);

  return (
    <select
      value={selectedResort}
      onChange={(e) => setSelectedResort(e.target.value)}
      className="sa-resort-switcher"
    >
      <option value="ALL">All Resorts</option>

      {resorts.map((r) => (
        <option key={r._id} value={r._id}>
          {r.name}
        </option>
      ))}
    </select>
  );
};

export default ResortSwitcher;
