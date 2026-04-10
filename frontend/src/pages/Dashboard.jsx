import React, { useCallback, useEffect, useRef, useState } from "react";
import BalloonRow from "../components/BalloonRow";
import Navbar from "../components/Navbar";
import SeatGrid from "../components/SeatGrid";
import LiveLeaderboard from "../components/LiveLeaderboard";
import { getPendingBalloons, tickBalloon, getLabs, getParticipants, getRecentBalloons } from "../api";
import { RefreshCw, Map, Clock, PackageSearch, List, LayoutGrid, BarChart3 } from "lucide-react";

export default function Dashboard() {
  const [allData, setAllData] = useState([]);
  const [recentBalloons, setRecentBalloons] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [labOptions, setLabOptions] = useState(["All Labs"]);
  const [labFilter, setLabFilter] = useState("All Labs");
  const [view, setView] = useState("queue"); // queue | labs | leaderboard
  const [tickingIds, setTickingIds] = useState(new Set());
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [pending, recent, parts] = await Promise.all([
        getPendingBalloons(),
        getRecentBalloons(),
        getParticipants(),
      ]);
      setAllData(pending);
      setRecentBalloons(recent);
      setParticipants(parts);
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

  const displayedLabs = labFilter === "All Labs" ? labOptions.filter(l => l !== "All Labs") : [labFilter];

  return (
    <div className="min-h-screen bg-neo-yellow/5">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* View Switcher & Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-10">
          <div>
            <h2 className="text-4xl font-black text-black tracking-tight uppercase leading-none mb-4">Command Center</h2>
            <div className="flex p-1.5 bg-black/5 rounded-2xl border-3 border-black w-fit">
              {[
                { id: "queue", label: "Queue", icon: List },
                { id: "labs", label: "Labs", icon: LayoutGrid },
                { id: "leaderboard", label: "Leaderboard", icon: BarChart3 }
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase text-sm transition-all ${view === v.id
                    ? "bg-neo-yellow border-3 border-black shadow-neo-sm translate-x-0.5 translate-y-0.5"
                    : "text-black/50 hover:text-black"
                    }`}
                >
                  <v.icon className="w-4 h-4" />
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col items-end">
              {lastUpdated && (
                <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Updated {lastUpdated.toLocaleTimeString()}
                </p>
              )}
              <div className="flex items-center gap-3">
                <span className="neo-badge bg-black text-white py-2 px-5 text-sm">
                  {filtered.length} Pending
                </span>
                <div className="relative">
                  <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black z-10" />
                  <select
                    value={labFilter}
                    onChange={(e) => setLabFilter(e.target.value)}
                    className="pl-9 pr-10 py-2.5 border-3 border-black rounded-xl font-black bg-white shadow-neo focus:shadow-neo-lg outline-none transition-all appearance-none cursor-pointer text-sm"
                  >
                    {labOptions.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Content */}
        {view === "queue" && (
          <div className="neo-card overflow-hidden bg-white">
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
                            className="px-6 py-5 text-left text-[10px] font-black text-black uppercase tracking-widest whitespace-nowrap"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y-3 divide-black/5">
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
        )}

        {view === "labs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
            {displayedLabs.map((lab) => (
              <SeatGrid
                key={lab}
                labName={lab}
                participants={participants}
                pendingBalloons={allData}
              />
            ))}
          </div>
        )}

        {view === "leaderboard" && (
          <LiveLeaderboard
            participants={participants}
            recentBalloons={recentBalloons}
          />
        )}
      </div>
    </div>
  );
}

