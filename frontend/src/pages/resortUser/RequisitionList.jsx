import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import ResortSwitcher from '../../components/ResortSwitcher';
import { Link } from 'react-router-dom';

const RequisitionList = () => {
  const [resort, setResort] = useState('');
  const [list, setList] = useState([]);

  useEffect(() => {
    if (!resort) return;
    async function load() {
      try {
        const res = await api.get(`/resort-user/requisitions/${resort}`);
        setList(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [resort]);

  return (
    <div className="sa-page">
      <h2>Requisitions</h2>
      <ResortSwitcher selected={resort} onChange={setResort} />
      <table>
        <thead><tr><th>No</th><th>Date</th><th>Status</th><th>Items</th></tr></thead>
        <tbody>
          {list.map(r => (
            <tr key={r._id}>
              <td>{r.requisitionNo}</td>
              <td>{r.date || '-'}</td>
              <td>{r.status}</td>
              <td>{r.totalItems}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RequisitionList;
