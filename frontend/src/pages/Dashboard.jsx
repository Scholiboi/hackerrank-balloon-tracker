import React, { useCallback, useEffect, useRef, useState } from "react";
import BalloonRow from "../components/BalloonRow";
import Navbar from "../components/Navbar";
import { getPendingBalloons, tickBalloon, getLabs } from "../api";
import { RefreshCw, Map, Clock, PackageSearch } from "lucide-react";

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
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-black tracking-tight">Balloon Queue</h2>
            {lastUpdated && (
              <p className="text-xs font-bold text-black/50 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="neo-badge bg-neo-yellow py-2 px-4 text-sm scale-110">
              {filtered.length} pending
            </span>
            <div className="relative flex items-center">
              <Map className="absolute left-3 w-4 h-4 text-black" />
              <select
                value={labFilter}
                onChange={(e) => setLabFilter(e.target.value)}
                className="pl-9 pr-8 py-2 border-3 border-black rounded-xl font-bold bg-white shadow-neo focus:shadow-neo-lg outline-none transition-all appearance-none cursor-pointer"
              >
                {labOptions.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="neo-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-black">
              <div className="bg-neo-pink p-6 rounded-full border-4 border-black mb-6 shadow-neo">
                <PackageSearch className="w-16 h-16" />
              </div>
              <p className="text-2xl font-black italic">Queue is clear!</p>
              <p className="font-bold text-black/60 mt-2">All balloons delivered.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-neo-yellow/30 border-b-3 border-black">
                  <tr>
                    {["Time", "HR Username", "Name", "Lab", "Seat", "Challenge", "Balloon", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-left text-xs font-black text-black uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10">
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

