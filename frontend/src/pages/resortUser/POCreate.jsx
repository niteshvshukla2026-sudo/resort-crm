import React, { useState } from 'react';
import api from '../../utils/api';
import ResortSwitcher from '../../components/ResortSwitcher';

const POCreate = () => {
  const [resort, setResort] = useState('');
  const [vendor, setVendor] = useState('');
  const [items, setItems] = useState([{ item:'', qty:1, rate:0 }]);
  const [msg, setMsg] = useState('');

  const add = () => setItems(p=>[...p,{item:'',qty:1,rate:0}]);

  const submit = async () => {
    try {
      const res = await api.post('/resort-user/po', { resort, vendor, items });
      setMsg('PO created: ' + (res.data.po.poNo || '—'));
    } catch (err) {
      console.error(err);
      setMsg('Failed to create PO');
    }
  };

  return (
    <div className="sa-page">
      <h2>Create PO</h2>
      <ResortSwitcher selected={resort} onChange={setResort} />
      <label>Vendor <input value={vendor} onChange={e=>setVendor(e.target.value)} /></label>
      <div>
        {items.map((it,idx)=>(
          <div key={idx}>
            <input placeholder="Item" value={it.item} onChange={e=>{ const v=e.target.value; setItems(p=>{ const n=[...p]; n[idx].item=v; return n; }); }} />
            <input type="number" value={it.qty} onChange={e=>{ const v=Number(e.target.value); setItems(p=>{ const n=[...p]; n[idx].qty=v; return n; }); }} />
            <input type="number" value={it.rate} onChange={e=>{ const v=Number(e.target.value); setItems(p=>{ const n=[...p]; n[idx].rate=v; return n; }); }} />
          </div>
        ))}
      </div>
      <button onClick={add}>Add Item</button>
      <button onClick={submit}>Create PO</button>
      {msg && <div>{msg}</div>}
    </div>
  );
};

export default POCreate;
