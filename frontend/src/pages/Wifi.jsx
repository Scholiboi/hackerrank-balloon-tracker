import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { getWifi, uploadWifi, reassignWifi } from "../api";
import { FileDown, Shuffle, Wifi, WifiOff, Search, AlertTriangle } from "lucide-react";

export default function WifiManager() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | assigned | unassigned
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setCredentials(await getWifi());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function flash(setter, message, duration = 4000) {
    setter(message);
    setTimeout(() => setter(""), duration);
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.confirm(`Upload "${file.name}"? This will REPLACE all existing wifi credentials and re-assign randomly.`)) {
      fileRef.current.value = "";
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await uploadWifi(fd);
      flash(setUploadStatus, `Uploaded ${res.inserted} credentials — ${res.assigned} assigned, ${res.unassigned} unassigned.`);
      setUploadError("");
      await load();
    } catch (err) {
      flash(setUploadError, err.response?.data?.detail || "Upload failed.");
    }
    fileRef.current.value = "";
  }

  async function handleReassign() {
    if (!window.confirm("Re-randomize all wifi assignments? Current assignments will be cleared.")) return;
    try {
      const res = await reassignWifi();
      flash(setUploadStatus, `Re-assigned: ${res.assigned} assigned, ${res.unassigned} unassigned.`);
      await load();
    } catch (err) {
      flash(setUploadError, err.response?.data?.detail || "Reassign failed.");
    }
  }

  const total = credentials.length;
  const assignedCount = credentials.filter((c) => c.hackerrank_id).length;
  const unassignedCount = total - assignedCount;

  const filtered = credentials.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.login_id.toLowerCase().includes(q) ||
      (c.hackerrank_id || "").toLowerCase().includes(q) ||
      (c.participant_name || "").toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "assigned" && c.hackerrank_id) ||
      (filter === "unassigned" && !c.hackerrank_id);
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-black tracking-tight uppercase">Guest Wifi</h2>
            <p className="font-bold text-black/40 text-sm mt-1 uppercase tracking-widest italic">
              {total} credentials · {assignedCount} assigned · {unassignedCount} unassigned
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {uploadStatus && (
              <span className="neo-badge bg-neo-green py-2 px-4 shadow-none border-dashed">{uploadStatus}</span>
            )}
            {uploadError && (
              <span className="neo-badge bg-neo-red py-2 px-4 shadow-none border-dashed">{uploadError}</span>
            )}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} />
            <button
              onClick={handleReassign}
              className="neo-btn bg-white hover:bg-neo-blue transition-colors group"
              disabled={total === 0}
            >
              <Shuffle className="w-4 h-4" />
              Re-assign
            </button>
            <button
              onClick={() => fileRef.current.click()}
              className="neo-btn bg-neo-green transition-colors group"
            >
              <FileDown className="w-4 h-4 group-hover:animate-bounce" />
              Import Excel
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="neo-card p-4 bg-neo-blue w-[calc(33.333%-0.5rem)] sm:flex-1 sm:w-auto flex flex-col items-center justify-center">
            <span className="text-2xl sm:text-3xl font-black">{total}</span>
            <span className="text-xs font-black uppercase mt-1 tracking-wider opacity-60">Total</span>
          </div>
          <div className="neo-card p-4 bg-neo-green w-[calc(33.333%-0.5rem)] sm:flex-1 sm:w-auto flex flex-col items-center justify-center">
            <span className="text-2xl sm:text-3xl font-black">{assignedCount}</span>
            <span className="text-xs font-black uppercase mt-1 tracking-wider opacity-60">Assigned</span>
          </div>
          <div className={`neo-card p-4 w-[calc(33.333%-0.5rem)] sm:flex-1 sm:w-auto flex flex-col items-center justify-center ${unassignedCount > 0 ? "bg-neo-yellow" : "bg-white"}`}>
            <span className="text-2xl sm:text-3xl font-black">{unassignedCount}</span>
            <span className="text-xs font-black uppercase mt-1 tracking-wider opacity-60">Unassigned</span>
          </div>
        </div>

        {total === 0 && !loading && (
          <div className="neo-card p-12 bg-white flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-neo-yellow rounded-xl border-4 border-black flex items-center justify-center mb-4 shadow-neo">
              <WifiOff className="w-8 h-8" />
            </div>
            <p className="text-xl font-black uppercase italic">No credentials loaded</p>
            <p className="text-sm font-bold text-black/40 mt-2">Import an Excel file with <code>login_id</code> and <code>password</code> columns.</p>
          </div>
        )}

        {total > 0 && (
          <div className="neo-card overflow-hidden bg-white">
            <div className="px-4 sm:px-6 py-4 border-b-3 border-black bg-neo-yellow/20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Filter tabs */}
              <div className="flex gap-2">
                {[
                  { key: "all", label: "All" },
                  { key: "assigned", label: "Assigned" },
                  { key: "unassigned", label: "Unassigned" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-4 py-1.5 rounded-xl border-3 border-black text-xs font-black uppercase transition-all ${
                      filter === f.key ? "bg-black text-white shadow-neo-sm" : "bg-white hover:bg-black/5"
                    }`}
                  >
                    {f.label}
                    {f.key === "unassigned" && unassignedCount > 0 && (
                      <span className="ml-1.5 bg-neo-red text-black rounded-full px-1.5 py-0.5 text-[10px]">
                        {unassignedCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ID, login, name..."
                  className="w-full pl-10 pr-4 py-2 border-3 border-black rounded-xl font-bold bg-white outline-none focus:shadow-neo transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-black/5 border-b-2 border-black">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-black uppercase tracking-wider text-xs">Login ID</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-black uppercase tracking-wider text-xs">Password</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-black uppercase tracking-wider text-xs hidden sm:table-cell">Assigned To</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-black uppercase tracking-wider text-xs">Participant</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-black uppercase tracking-wider text-xs">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/5">
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      className={`transition-colors ${
                        !c.hackerrank_id ? "bg-neo-yellow/20 hover:bg-neo-yellow/30" : "hover:bg-black/5"
                      }`}
                    >
                      <td className="px-3 sm:px-6 py-3 sm:py-4 font-black font-mono text-xs sm:text-sm">{c.login_id}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono text-xs sm:text-sm font-bold">{c.password}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono text-xs font-bold text-black/60 hidden sm:table-cell">
                        {c.hackerrank_id || <span className="text-black/30 italic">—</span>}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 font-bold text-sm">
                        {c.participant_name || <span className="text-black/30 italic">—</span>}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        {c.hackerrank_id ? (
                          <span className="neo-badge bg-neo-green py-1 shadow-none text-[11px]">
                            <Wifi className="w-3 h-3 mr-1" /> Assigned
                          </span>
                        ) : (
                          <span className="neo-badge bg-neo-yellow py-1 shadow-none text-[11px] border-dashed">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Unassigned
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
