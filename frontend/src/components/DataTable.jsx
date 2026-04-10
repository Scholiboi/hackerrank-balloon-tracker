import React, { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Loader2 } from "lucide-react";

export default function DataTable({ columns, data, onDelete, onEdit, loading, sortBy, sortOrder, onSort }) {
  const [editCell, setEditCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-black">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="font-black uppercase tracking-widest text-xs">Loading...</p>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-black/40">
        <p className="font-black uppercase tracking-widest text-xs italic">No records found</p>
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
    onSort(colKey, sortBy === colKey && sortOrder === "asc" ? "desc" : "asc");
  };

  const getSortIcon = (colKey) => {
    if (sortBy !== colKey) return null;
    return sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  function EditableValue({ rowId, colKey, value }) {
    const isEditing = editCell?.rowId === rowId && editCell?.colKey === colKey;
    if (isEditing) {
      return (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-0.5 border-2 border-black rounded font-bold text-xs focus:outline-none bg-white"
        />
      );
    }
    return (
      <span
        onClick={() => startEdit(rowId, colKey, value)}
        className={`font-bold text-xs block truncate ${onEdit ? "cursor-text hover:bg-neo-yellow/40 rounded px-1 -mx-1" : ""}`}
        title={value ?? ""}
      >
        {value ?? <span className="text-black/20 italic">—</span>}
      </span>
    );
  }

  return (
    <>
      {/* ── Mobile card list ── */}
      <div className="block md:hidden divide-y-2 divide-black/10">
        {data.map((row) => (
          <div key={row.id} className="p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              {/* Primary field (first column) */}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase text-black/40 mb-0.5">{columns[0].label}</p>
                <EditableValue rowId={row.id} colKey={columns[0].key} value={row[columns[0].key]} />
              </div>
              {onDelete && (
                <button
                  onClick={() => onDelete(row.id)}
                  className="p-1.5 border-2 border-transparent rounded-lg text-black/30 hover:text-neo-red hover:bg-neo-red/10 hover:border-neo-red transition-all shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Remaining fields in 2-col grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {columns.slice(1).map((col) => (
                <div key={col.key} className="min-w-0">
                  <p className="text-[10px] font-black uppercase text-black/40 mb-0.5">{col.label}</p>
                  <EditableValue rowId={row.id} colKey={col.key} value={row[col.key]} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full table-fixed text-xs border-collapse">
          <thead className="bg-black/5 border-b-3 border-black">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleColumnClick(col.key)}
                  className={`px-3 py-2.5 text-left text-[10px] font-black text-black uppercase tracking-wider select-none whitespace-nowrap ${onSort ? "cursor-pointer hover:bg-black/10" : ""}`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {getSortIcon(col.key)}
                  </div>
                </th>
              ))}
              {onDelete && <th className="px-3 py-2.5 w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-neo-yellow/5 group">
                {columns.map((col) => {
                  const isEditing = editCell?.rowId === row.id && editCell?.colKey === col.key;
                  return (
                    <td key={col.key} className="px-3 py-2 text-black max-w-[180px]">
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={handleKeyDown}
                          className="w-full px-2 py-1 border-2 border-black rounded font-bold text-xs focus:outline-none bg-white min-w-[120px]"
                        />
                      ) : (
                        <span
                          onClick={() => startEdit(row.id, col.key, row[col.key])}
                          className={`font-bold block truncate ${onEdit ? "cursor-text hover:bg-neo-yellow/30 px-1.5 py-0.5 rounded border-2 border-transparent hover:border-black/5 -mx-1.5" : ""}`}
                          title={row[col.key] ?? ""}
                        >
                          {row[col.key] ?? <span className="text-black/20 italic">—</span>}
                        </span>
                      )}
                    </td>
                  );
                })}
                {onDelete && (
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => onDelete(row.id)}
                      className="p-1.5 border-2 border-transparent rounded-lg text-black/30 hover:text-neo-red hover:bg-neo-red/10 hover:border-neo-red transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
