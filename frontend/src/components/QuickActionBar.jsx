import React from "react";

export default function QuickActionBar({ onNewRequisition }) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onNewRequisition}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        + New Requisition
      </button>
    </div>
  );
}
