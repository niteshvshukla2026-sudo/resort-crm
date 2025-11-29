import React from 'react';
import ResortSwitcher from '../../components/ResortSwitcher';
import api from '../../utils/api';

const Reports = () => {
  return (
    <div className="sa-page">
      <h2>Purchase Reports</h2>
      <ResortSwitcher onChange={()=>{}} />
      <ul>
        <li><a href="#" onClick={e=>{e.preventDefault(); alert('Report: Requisition Register (stub)')}}>Requisition Register</a></li>
        <li><a href="#" onClick={e=>{e.preventDefault(); alert('Report: Pending Requisition (stub)')}}>Pending Requisition</a></li>
        <li><a href="#" onClick={e=>{e.preventDefault(); alert('Report: PO Register (stub)')}}>PO Register</a></li>
      </ul>
    </div>
  );
};

export default Reports;
