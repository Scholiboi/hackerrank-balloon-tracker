import React, { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Loader2 } from "lucide-react";

export default function DataTable({ columns, data, onDelete, onEdit, loading, sortBy, sortOrder, onSort }) {
  const [editCell, setEditCell] = useState(null); // { rowId, colKey }
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-black">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-black uppercase tracking-widest text-sm">Loading Records...</p>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-black/40">
        <p className="font-black uppercase tracking-widest text-sm italic">No records found</p>
      </div>
    );
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

  const getSortIcon = (colKey) => {
    if (sortBy !== colKey) return null;
    return sortOrder === "asc" ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead className="bg-black/5 border-b-3 border-black">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleColumnClick(col.key)}
                className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-black uppercase tracking-wider select-none ${
                  onSort ? "cursor-pointer hover:bg-black/10" : ""
                }`}
              >
                <div className="flex items-center">
                  {col.label}
                  {getSortIcon(col.key)}
                </div>
              </th>
            ))}
            {onDelete && <th className="px-3 sm:px-6 py-3 sm:py-4" />}
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-black/5">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-neo-yellow/5 group">
              {columns.map((col) => {
                const isEditing = editCell?.rowId === row.id && editCell?.colKey === col.key;
                return (
                  <td key={col.key} className="px-3 sm:px-6 py-2 sm:py-3 text-black whitespace-nowrap">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 border-2 border-black rounded font-bold text-sm focus:outline-none bg-white min-w-[140px]"
                      />
                    ) : (
                      <span
                        onClick={() => startEdit(row.id, col.key, row[col.key])}
                        className={`font-bold transition-all ${onEdit ? "cursor-text hover:bg-neo-yellow/30 px-2 py-1 rounded-lg border-2 border-transparent hover:border-black/5 block -mx-2" : ""}`}
                        title={onEdit ? "Click to edit" : undefined}
                      >
                        {row[col.key] ?? <span className="text-black/20 italic">empty</span>}
                      </span>
                    )}
                  </td>
                );
              })}
              {onDelete && (
                <td className="px-3 sm:px-6 py-2 sm:py-3 text-right">
                  <button
                    onClick={() => onDelete(row.id)}
                    className="p-2 border-2 border-transparent rounded-lg text-black/30 hover:text-neo-red hover:bg-neo-red/10 hover:border-neo-red transition-all"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
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

