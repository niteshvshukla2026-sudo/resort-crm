import React, { useEffect, useState } from 'react';
import api from "../utils/api";

const ResortSwitcher = ({ selected, onChange }) => {
  const [resorts, setResorts] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/resort-user/assigned-resorts');
        setResorts(res.data.resorts || []);
      } catch (err) {
        console.error('Failed to load resorts', err);
      }
    }
    load();
  }, []);

  return (
    <select value={selected || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">-- Select Resort --</option>
      {resorts.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
    </select>
  );
};

export default ResortSwitcher;
