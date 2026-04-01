import React from "react";

export default function DataTable({ columns, data, onDelete, loading, sortBy, sortOrder, onSort }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12 text-gray-400">Loading…</div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex justify-center py-12 text-gray-400">No records found.</div>
    );
  }

  const handleColumnClick = (colKey) => {
    if (!onSort) return;
    if (sortBy === colKey) {
      onSort(colKey, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSort(colKey, "asc");
    }
  };

  const getSortIndicator = (colKey) => {
    if (sortBy !== colKey) return "";
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleColumnClick(col.key)}
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                  onSort ? "cursor-pointer hover:bg-gray-100" : ""
                }`}
              >
                {col.label}
                {getSortIndicator(col.key)}
              </th>
            ))}
            {onDelete && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                  {row[col.key] ?? "—"}
                </td>
              ))}
              {onDelete && (
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onDelete(row.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
