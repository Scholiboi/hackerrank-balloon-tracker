import React, { useState } from "react";

export default function DataTable({ columns, data, onDelete, onEdit, loading, sortBy, sortOrder, onSort }) {
  const [editCell, setEditCell] = useState(null); // { rowId, colKey }
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) {
    return <div className="flex justify-center py-12 text-gray-400">Loading…</div>;
  }

  if (!data.length) {
    return <div className="flex justify-center py-12 text-gray-400">No records found.</div>;
  }

  function startEdit(rowId, colKey, currentValue) {
    if (!onEdit) return;
    setEditCell({ rowId, colKey });
    setEditValue(currentValue ?? "");
  }

  async function commitEdit() {
    if (!editCell || saving) return;
    const { rowId, colKey } = editCell;
    setEditCell(null);
    setSaving(true);
    try {
      await onEdit(rowId, colKey, editValue);
    } catch (err) {
      alert(err?.response?.data?.detail || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
    if (e.key === "Escape") setEditCell(null);
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
            {(onDelete) && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              {columns.map((col) => {
                const isEditing = editCell?.rowId === row.id && editCell?.colKey === col.key;
                return (
                  <td key={col.key} className="px-4 py-2 text-gray-700 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 border border-brand-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white min-w-[120px]"
                      />
                    ) : (
                      <span
                        onClick={() => startEdit(row.id, col.key, row[col.key])}
                        className={onEdit ? "cursor-text hover:bg-brand-50 px-1 py-0.5 rounded -mx-1 block" : ""}
                        title={onEdit ? "Click to edit" : undefined}
                      >
                        {row[col.key] ?? <span className="text-gray-300">—</span>}
                      </span>
                    )}
                  </td>
                );
              })}
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
