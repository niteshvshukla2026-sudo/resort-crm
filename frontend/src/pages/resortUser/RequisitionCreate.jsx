import React, { useState } from 'react';
import api from '../../utils/api';
import ResortSwitcher from '../../components/ResortSwitcher';

const RequisitionCreate = ({ onClose }) => {
  const [resort, setResort] = useState('');
  const [department, setDepartment] = useState('');
  const [lines, setLines] = useState([{ item: '', qty: 1, remark: '' }]);
  const [message, setMessage] = useState('');

  const addLine = () => setLines(prev => [...prev, { item:'', qty:1, remark:'' }]);
  const removeLine = (idx) => setLines(prev => prev.filter((_,i)=>i!==idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { resort, department, lines };
      const res = await api.post('/resort-user/requisitions', payload);
      setMessage('Requisition created: ' + (res.data.requisition.requisitionNo || '—'));
      if (onClose) {
        setTimeout(()=> onClose(), 800);
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to create requisition');
    }
  };

  return (
    <div>
      <ResortSwitcher selected={resort} onChange={setResort} />
      <form onSubmit={handleSubmit}>
        <div style={{marginTop:8}}>
          <label>Department / Store<br/>
            <input value={department} onChange={e=>setDepartment(e.target.value)} required />
          </label>
        </div>
        <table style={{width:'100%', marginTop:8}}>
          <thead><tr><th>Item</th><th>Qty</th><th>Remark</th><th></th></tr></thead>
          <tbody>
            {lines.map((ln, idx) => (
              <tr key={idx}>
                <td><input value={ln.item} onChange={e=>{ const v=e.target.value; setLines(prev=>{ const n=[...prev]; n[idx].item=v; return n; }); }} required /></td>
                <td><input type="number" min="1" value={ln.qty} onChange={e=>{ const v=Number(e.target.value); setLines(prev=>{ const n=[...prev]; n[idx].qty=v; return n; }); }} /></td>
                <td><input value={ln.remark} onChange={e=>{ const v=e.target.value; setLines(prev=>{ const n=[...prev]; n[idx].remark=v; return n; }); }} /></td>
                <td>{idx>0 && <button type="button" onClick={()=>removeLine(idx)}>Remove</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{marginTop:8}}>
          <button type="button" onClick={addLine}>Add Line</button>{' '}
          <button type="submit">Submit Requisition</button>{' '}
          {onClose && <button type="button" onClick={onClose}>Close</button>}
        </div>
      </form>
      {message && <div style={{marginTop:8}}>{message}</div>}
    </div>
  );
};

export default RequisitionCreate;
