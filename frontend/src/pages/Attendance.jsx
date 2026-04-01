import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { checkIn, getAttendance, getAttendanceStats, undoCheckIn } from "../api";

function StatCard({ label, value, colour }) {
  return (
    <div className={`rounded-xl p-4 sm:p-5 ${colour} flex flex-col items-center justify-center flex-1 min-w-[90px]`}>
      <span className="text-2xl sm:text-3xl font-bold">{value}</span>
      <span className="text-xs font-medium mt-0.5 opacity-75 text-center">{label}</span>
    </div>
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
      setCheckInSuccess(`${rec.name || id} checked in at ${checkInTime}`);
      setCheckInInput("");
      await load();
    } catch (err) {
      setCheckInError(err.response?.data?.detail || "Check-in failed.");
    }
    setTimeout(() => { setCheckInSuccess(""); setCheckInError(""); }, 4000);
  }

  async function handleUndo(id) {
    if (!window.confirm("Undo this check-in?")) return;
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Attendance</h2>

        {/* Stats */}
        {stats && (
          <div className="flex gap-3 mb-5">
            <StatCard label="Total" value={stats.total_participants} colour="bg-gray-100 text-gray-700" />
            <StatCard label="Checked In" value={stats.checked_in} colour="bg-green-100 text-green-700" />
            <StatCard label="Not In" value={stats.not_checked_in} colour="bg-amber-100 text-amber-700" />
          </div>
        )}

        {/* Check-in form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Quick Check-In</p>
          <form onSubmit={handleCheckIn} className="space-y-3">
            <input
              value={checkInInput}
              onChange={(e) => setCheckInInput(e.target.value)}
              placeholder="HackerRank ID…"
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="checkInType" value="college" checked={checkInType === "college"} onChange={(e) => setCheckInType(e.target.value)} className="accent-brand-600" />
                <span>College Check-In</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="checkInType" value="lab" checked={checkInType === "lab"} onChange={(e) => setCheckInType(e.target.value)} className="accent-brand-600" />
                <span>Lab Check-In</span>
              </label>
              <button
                type="submit"
                className="ml-auto px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
              >
                Check In
              </button>
            </div>
          </form>
          {checkInError && (
            <div className="mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <p className="text-sm text-red-600">{checkInError}</p>
            </div>
          )}
          {checkInSuccess && (
            <div className="mt-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              <p className="text-sm text-green-700">{checkInSuccess}</p>
            </div>
          )}
        </div>

        {/* Search + table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-gray-500 font-medium">
              {filtered.length} of {records.length} shown
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name / ID / lab…"
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-64"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12 text-gray-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex justify-center py-12 text-gray-400">
              {records.length === 0 ? "No check-ins yet." : "No results match your filter."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["HackerRank ID", "Name", "Lab", "Seat", "College Check-In", "Lab Check-In", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-brand-600 text-xs whitespace-nowrap">{r.hackerrank_id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{r.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.lab || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.seat || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {r.college_check_in_at ? new Date(r.college_check_in_at).toLocaleTimeString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {r.lab_check_in_at ? new Date(r.lab_check_in_at).toLocaleTimeString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleUndo(r.id)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                        >
                          Undo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
