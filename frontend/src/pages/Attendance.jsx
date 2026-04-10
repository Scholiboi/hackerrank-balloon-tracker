import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { checkIn, getAttendance, getAttendanceStats, undoCheckIn, updateAttendance } from "../api";
import { Search, UserCheck, Users, XCircle, Clock, Trash2 } from "lucide-react";

function toDatetimeLocal(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StatCard({ label, value, colour }) {
  return (
    <div className={`neo-card p-4 sm:p-6 ${colour} flex flex-col items-center justify-center flex-1 min-w-[120px]`}>
      <span className="text-3xl sm:text-4xl font-black">{value}</span>
      <span className="text-xs font-black uppercase mt-1 tracking-wider opacity-60 text-center">{label}</span>
    </div>
  );
}

function EditableCell({ value, type = "text", onSave, className = "" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  function start() {
    setDraft(type === "datetime-local" ? toDatetimeLocal(value) : (value ?? ""));
    setEditing(true);
  }

  async function commit() {
    setEditing(false);
    let parsed = draft;
    if (type === "datetime-local") {
      parsed = draft ? new Date(draft).toISOString() : null;
    }
    if (parsed !== value) await onSave(parsed);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    if (e.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="px-2 py-1 border-2 border-black rounded font-bold text-xs focus:outline-none bg-white w-full min-w-[140px]"
      />
    );
  }

  return (
    <span
      onClick={start}
      className={`cursor-text hover:bg-neo-yellow/30 px-2 py-1 rounded-lg border-2 border-transparent hover:border-black/5 transition-all block font-bold truncate ${className}`}
      title="Click to edit"
    >
      {value || <span className="text-black/20 italic">empty</span>}
    </span>
  );
}

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [checkInInput, setCheckInInput] = useState("");
  const [checkInType, setCheckInType] = useState("college");
  const [checkInError, setCheckInError] = useState("");
  const [checkInSuccess, setCheckInSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [recs, st] = await Promise.all([getAttendance(), getAttendanceStats()]);
      setRecords(recs);
      setStats(st);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleEdit(id, field, value) {
    try {
      const updated = await updateAttendance(id, { [field]: value });
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    } catch (err) {
      alert(err?.response?.data?.detail || "Save failed.");
    }
  }

  async function handleCheckIn(e) {
    e.preventDefault();
    const id = checkInInput.trim();
    if (!id) return;
    setCheckInError("");
    setCheckInSuccess("");
    try {
      const rec = await checkIn(id, checkInType);
      const timeKey = checkInType === "college" ? "college_check_in_at" : "lab_check_in_at";
      const checkInTime = rec[timeKey] ? new Date(rec[timeKey]).toLocaleTimeString() : "unknown";
      const label = checkInType === "college" ? "College Check-in" : "Lab Check-in";
      setCheckInSuccess(`${rec.name || id} — ${label} recorded at ${checkInTime}`);
      setCheckInInput("");
      await load();
    } catch (err) {
      const label = checkInType === "college" ? "College Check-in" : "Lab Check-in";
      setCheckInError(err.response?.data?.detail || `${label} failed.`);
    }
    setTimeout(() => { setCheckInSuccess(""); setCheckInError(""); }, 4000);
  }

  async function handleUndo(id) {
    if (!window.confirm("Delete this attendance record? Both College and Lab check-in times will be removed.")) return;
    await undoCheckIn(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setStats((s) => s ? { ...s, checked_in: s.checked_in - 1, not_checked_in: s.not_checked_in + 1 } : s);
  }

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.hackerrank_id.toLowerCase().includes(q) ||
      (r.name || "").toLowerCase().includes(q) ||
      (r.lab || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-3xl font-black text-black mb-8 tracking-tight uppercase">Attendance Management</h2>

        {/* Stats */}
        {stats && (
          <div className="flex flex-wrap gap-4 mb-8">
            <StatCard label="Total Contestants" value={stats.total_participants} colour="bg-neo-blue" />
            <StatCard label="In Building" value={stats.checked_in} colour="bg-neo-green" />
            <StatCard label="In Lab" value={stats.lab_checked_in || 0} colour="bg-neo-yellow" />
            <StatCard label="Absent" value={stats.not_checked_in} colour="bg-neo-red" />
          </div>
        )}

        {/* Check-in form */}
        <div className="neo-card p-6 mb-8 bg-white">
          <p className="text-sm font-black text-black uppercase mb-4 flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Express Check-In (College / Lab)
          </p>
          <form onSubmit={handleCheckIn} className="space-y-4">
            <div className="relative">
              <input
                value={checkInInput}
                onChange={(e) => setCheckInInput(e.target.value)}
                placeholder="Type HackerRank ID…"
                autoFocus
                className="w-full px-4 py-4 rounded-xl border-3 border-black text-lg font-black bg-white shadow-neo focus:shadow-neo-lg outline-none transition-all placeholder-black/30"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm font-black cursor-pointer group">
                  <div className={`w-5 h-5 border-3 border-black rounded-full flex items-center justify-center transition-all ${checkInType === "college" ? "bg-neo-green" : "bg-white"}`}>
                    {checkInType === "college" && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                  </div>
                  <input type="radio" name="checkInType" value="college" checked={checkInType === "college"} onChange={(e) => setCheckInType(e.target.value)} className="hidden" />
                  <span>COLLEGE CHECK-IN</span>
                </label>
                <label className="flex items-center gap-2 text-sm font-black cursor-pointer group">
                  <div className={`w-5 h-5 border-3 border-black rounded-full flex items-center justify-center transition-all ${checkInType === "lab" ? "bg-neo-blue" : "bg-white"}`}>
                    {checkInType === "lab" && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                  </div>
                  <input type="radio" name="checkInType" value="lab" checked={checkInType === "lab"} onChange={(e) => setCheckInType(e.target.value)} className="hidden" />
                  <span>LAB CHECK-IN</span>
                </label>
              </div>
              <button
                type="submit"
                className="neo-btn bg-black text-white px-8 py-3 uppercase tracking-widest text-sm"
              >
                Confirm
              </button>
            </div>
          </form>
          {checkInError && (
            <div className="mt-4 neo-badge bg-neo-red w-full justify-center py-2 shadow-none border-dashed border-2">
              <XCircle className="w-4 h-4 mr-2" /> {checkInError}
            </div>
          )}
          {checkInSuccess && (
            <div className="mt-4 neo-badge bg-neo-green w-full justify-center py-2 shadow-none border-dashed border-2">
              <UserCheck className="w-4 h-4 mr-2" /> {checkInSuccess}
            </div>
          )}
        </div>

        {/* Search + table */}
        <div className="neo-card overflow-hidden bg-white">
          <div className="px-6 py-4 border-b-3 border-black bg-neo-yellow/20 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-black italic">
                {filtered.length} matching participants
              </span>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border-3 border-black rounded-xl font-bold bg-white outline-none focus:shadow-neo transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/5 border-b-2 border-black">
                <tr>
                  <th className="px-6 py-4 text-left font-black uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left font-black uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left font-black uppercase tracking-wider">Lab</th>
                  <th className="px-6 py-4 text-left font-black uppercase tracking-wider">College Log</th>
                  <th className="px-6 py-4 text-left font-black uppercase tracking-wider">Lab Log</th>
                  <th className="px-6 py-4 text-center font-black uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/5">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-neo-yellow/5">
                    <td className="px-6 py-4 font-black font-mono text-xs">{r.hackerrank_id}</td>
                    <td className="px-6 py-4 font-bold text-sm">{r.name || <span className="text-black/20 italic text-xs">—</span>}</td>
                    <td className="px-6 py-4 font-bold text-sm">{r.lab || <span className="text-black/20 italic text-xs">—</span>}</td>
                    <td className="px-6 py-4">
                      <EditableCell value={r.college_check_in_at} type="datetime-local" onSave={(v) => handleEdit(r.id, "college_check_in_at", v)} className="font-mono text-[11px]" />
                    </td>
                    <td className="px-6 py-4">
                      <EditableCell value={r.lab_check_in_at} type="datetime-local" onSave={(v) => handleEdit(r.id, "lab_check_in_at", v)} className="font-mono text-[11px]" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleUndo(r.id)}
                        className="p-2 border-2 border-black rounded-lg hover:bg-neo-red transition-colors"
                        title="Delete attendance record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

