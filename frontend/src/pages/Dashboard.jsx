import React, { useCallback, useEffect, useRef, useState } from "react";
import BalloonRow from "../components/BalloonRow";
import Navbar from "../components/Navbar";
import { getPendingBalloons, tickBalloon, getLabs } from "../api";

export default function Dashboard() {
  const [allData, setAllData] = useState([]);
  const [labOptions, setLabOptions] = useState(["All Labs"]);
  const [labFilter, setLabFilter] = useState("All Labs");
  const [tickingIds, setTickingIds] = useState(new Set());
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await getPendingBalloons();
      setAllData(data);
      setLastUpdated(new Date());
    } catch {
      // silently retry on next poll
    }
  }, []);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const labs = await getLabs();
        setLabOptions(["All Labs", ...labs]);
        if (!labFilter || labFilter === "All Labs") {
          setLabFilter("All Labs");
        }
      } catch {
        // keep default if fetch fails
      }
    };
    fetchLabs();
    load();
    intervalRef.current = setInterval(load, 5000);
    return () => clearInterval(intervalRef.current);
  }, [load]);

  async function handleTick(submissionId) {
    setTickingIds((s) => new Set(s).add(submissionId));
    try {
      await tickBalloon(submissionId);
      setAllData((prev) => prev.filter((r) => r.submission_id !== submissionId));
    } catch {
      // keep row if tick fails
    } finally {
      setTickingIds((s) => {
        const next = new Set(s);
        next.delete(submissionId);
        return next;
      });
    }
  }

  const filtered =
    labFilter === "All Labs"
      ? allData
      : allData.filter((r) => r.lab === labFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        {/* Header row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Balloon Queue</h2>
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-0.5">
                Last updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-brand-50 text-brand-700 text-sm font-semibold px-3 py-1.5 rounded-full">
              {filtered.length} pending
            </span>
            <select
              value={labFilter}
              onChange={(e) => setLabFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white flex-1 sm:flex-none"
            >
              {labOptions.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <span className="text-5xl mb-3">🎈</span>
              <p className="font-medium text-gray-500">No pending balloons</p>
              <p className="text-sm mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Time", "HR Username", "Name", "Lab", "Seat", "Challenge", "Balloon", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((s) => (
                    <BalloonRow
                      key={s.submission_id}
                      submission={s}
                      onTick={handleTick}
                      ticking={tickingIds.has(s.submission_id)}
                    />
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
