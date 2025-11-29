import React from "react";

export default function KPIcard({ title, value, subtitle, icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="mt-2 text-2xl font-semibold">{value}</div>
          {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
        </div>
        {icon && <div className="text-3xl text-gray-300">{icon}</div>}
      </div>
    </div>
  );
}
