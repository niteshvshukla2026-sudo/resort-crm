import React from "react";

export default function DashboardShell({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">{title || "Dashboard"}</h1>
            {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
          </div>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
