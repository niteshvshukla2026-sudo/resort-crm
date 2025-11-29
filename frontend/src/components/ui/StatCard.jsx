import React from "react";

const StatCard = ({ label, value, subLabel, trend, trendType }) => {
  return (
    <div className="sa-card sa-stat-card">
      <div className="sa-stat-label">{label}</div>
      <div className="sa-stat-value">{value}</div>
      <div className="sa-stat-bottom">
        <span className="sa-stat-sublabel">{subLabel}</span>
        {trend && (
          <span className={`sa-stat-trend ${trendType === "up" ? "up" : "down"}`}>
            <i className={trendType === "up" ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
