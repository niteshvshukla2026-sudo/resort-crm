import React, { useState } from 'react';
import api from '../../utils/api';
import ResortSwitcher from '../../components/ResortSwitcher';

const GRNEntry = () => {
  const [resort, setResort] = useState('');
  const [store, setStore] = useState('');
  const [vendor, setVendor] = useState('');
  const [po, setPo] = useState('');
  const [items, setItems] = useState([{ item:'', receivedQty:0, rejectedQty:0 }]);
  const [msg, setMsg] = useState('');

  const submit = async () => {
    try {
      const res = await api.post('/resort-user/grn', { resort, store, vendor, po, items });
      setMsg('GRN created: ' + (res.data.grn.grnNo || '—'));
    } catch (err) {
      console.error(err);
      setMsg('Failed to create GRN');
    }
  };

  return (
    <div className="sa-page">
      <h2>GRN Entry</h2>
      <ResortSwitcher selected={resort} onChange={setResort} />
      <label>Store <input value={store} onChange={e=>setStore(e.target.value)} /></label>
      <label>Vendor <input value={vendor} onChange={e=>setVendor(e.target.value)} /></label>
      <label>PO <input value={po} onChange={e=>setPo(e.target.value)} /></label>
      <button onClick={submit}>Create GRN</button>
      {msg && <div>{msg}</div>}
    </div>
  );
};

export default GRNEntry;
