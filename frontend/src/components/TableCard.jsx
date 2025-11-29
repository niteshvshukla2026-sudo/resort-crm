import React from "react";

export default function TableCard({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-medium text-gray-700 mb-3">{title}</h3>
      <div>{children}</div>
    </div>
  );
}
