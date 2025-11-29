import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ResortSwitcher from '../../components/ResortSwitcher';
import api from '../../utils/api';
import Modal from '../../components/Modal';
import RequisitionCreate from './RequisitionCreate.jsx';
import './resortDashboard.css';

const StatCard = ({ title, value, subtitle, actionText, actionLink }) => (
  <div className="sa-stat-card">
    <div className="sa-stat-title">{title}</div>
    <div className="sa-stat-value">{value}</div>
    <div className="sa-stat-sub">{subtitle}</div>
    {actionText && actionLink && <Link to={actionLink} className="sa-stat-action">{actionText}</Link>}
  </div>
);

const ResortDashboard = () => {
  const [resort, setResort] = useState('');
  const [stats, setStats] = useState({ totalResorts:0, openRequisitions:0, pendingGRN:0, lowStockItems:0 });
  const [loading, setLoading] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);

  useEffect(() => {
    if (!resort) return;
    setLoading(true);
    api.get(`/resort-user/dashboard-stats/${resort}`)
      .then(res => {
        setStats(res.data || {});
      })
      .catch(err => {
        console.error('Failed to load dashboard stats', err);
      })
      .finally(() => setLoading(false));
  }, [resort]);

  return (
    <div className="sa-page">
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <h2>Resort User Dashboard</h2>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <button className="btn btn-primary" onClick={()=> setShowReqModal(true)}>+ New Requisition</button>
        </div>
      </div>

      <div style={{marginTop:10, marginBottom:20}}>
        <label style={{marginRight:10}}>Current Resort: </label>
        <ResortSwitcher selected={resort} onChange={setResort} />
      </div>

      <div className="sa-card-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
        <StatCard title="Total Resorts" value={stats.totalResorts} subtitle="Active properties" />
        <StatCard title="Open Requisitions" value={stats.openRequisitions} subtitle="Waiting for approval" actionText="+ view" actionLink="/resort/requisitions" />
        <StatCard title="Pending GRN" value={stats.pendingGRN} subtitle="PO received, GRN not done" actionText="Review" actionLink="/resort/grn" />
        <StatCard title="Low Stock Items" value={stats.lowStockItems} subtitle="Below reorder level" actionText="Check now" actionLink="/resort/reports" />
      </div>

      {loading && <div style={{marginTop:20}}>Loading stats...</div>}

      {showReqModal && (
        <Modal title="Create Requisition" onClose={()=> setShowReqModal(false)}>
          <RequisitionCreate onClose={()=> setShowReqModal(false)} />
        </Modal>
      )}

    </div>
  );
};

export default ResortDashboard;
