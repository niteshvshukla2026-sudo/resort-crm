import React from "react";
import StatCard from "../../components/ui/StatCard.jsx";

const Dashboard = () => {
  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of all resorts, purchases & inventory.</p>
        </div>
        <button className="sa-primary-button">
          <i className="ri-add-line" />
          New Requisition
        </button>
      </div>

      <div className="sa-grid-4">
        <StatCard
          label="Total Resorts"
          value="6"
          subLabel="Active properties"
          trend="+1 new"
          trendType="up"
        />
        <StatCard
          label="Open Requisitions"
          value="24"
          subLabel="Waiting for approval"
          trend="+4 today"
          trendType="up"
        />
        <StatCard
          label="Pending GRN"
          value="8"
          subLabel="PO received, GRN not done"
          trend="-3 vs yesterday"
          trendType="down"
        />
        <StatCard
          label="Low Stock Items"
          value="17"
          subLabel="Below reorder level"
          trend="Check now"
          trendType="up"
        />
      </div>
    </div>
  );
};

export default Dashboard;
