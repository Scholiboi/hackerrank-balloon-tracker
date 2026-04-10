import React, { useState } from "react";
import { User, X, Info } from "lucide-react";

export default function LiveLeaderboard({ participants, recentBalloons }) {
    const [selected, setSelected] = useState(null);

    // Map participants to their latest balloon color
    const participantLatestBalloons = participants.map((p) => {
        const latest = recentBalloons.find((b) => b.hackerrank_id === p.hackerrank_id);
        return {
            ...p,
            latestColor: latest ? latest.balloon_colour : null,
            latestChallenge: latest ? latest.challenge : null,
            latestTime: latest ? latest.time_from_start : null,
        };
    });

    // Ensure 90 slots for the 10x9 grid
    const gridSlots = Array.from({ length: 90 }, (_, i) => participantLatestBalloons[i] || null);

    return (
        <div className="relative">
            <div className="neo-card p-6 bg-white border-4 border-black shadow-neo">
                <div className="flex items-center justify-between mb-6 border-b-4 border-black -mx-6 -mt-6 bg-neo-pink py-3 px-6">
                    <h3 className="text-xl font-black uppercase flex items-center gap-2">
                        <Info className="w-5 h-5" /> Live Signal Grid
                    </h3>
                    <span className="hidden sm:inline text-xs font-black uppercase opacity-60">10 × 9 Configuration</span>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 sm:gap-2">
                    {gridSlots.map((p, i) => (
                        <button
                            key={i}
                            onClick={() => p && setSelected(p)}
                            disabled={!p}
                            className={`aspect-square border-3 border-black rounded-lg transition-all transform hover:scale-110 active:scale-95 shadow-neo-sm hover:shadow-neo ${p?.latestColor
                                ? ""
                                : p
                                    ? "bg-black/5 border-dashed"
                                    : "bg-black/2 opacity-20 border-dotted"
                                }`}
                            style={p?.latestColor ? { backgroundColor: p.latestColor.toLowerCase() } : {}}
                            title={p ? `${p.name} - ${p.latestChallenge || 'No Signal'}` : "Empty"}
                        >
                            {p?.latestColor && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full blur-[1px]" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-4 items-center justify-center">
                    <div className="flex items-center gap-2 text-xs font-black uppercase">
                        <div className="w-3 h-3 bg-white border-2 border-black border-dashed rounded" /> No Solve
                    </div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase">
                        <div className="w-3 h-3 bg-neo-yellow border-2 border-black rounded" /> Solved
                    </div>
                    <p className="text-[10px] font-bold text-black/50 italic ml-auto mr-0 sm:mr-auto">Click a node to reveal identity</p>
                </div>
            </div>

            {/* Identity Reveal Modal */}
            {selected && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setSelected(null)}
                    />
                    <div className="relative neo-card bg-white p-8 max-w-sm w-full border-4 border-black shadow-neo-lg animate-in zoom-in duration-300">
                        <button
                            onClick={() => setSelected(null)}
                            className="absolute -top-3 -right-3 p-1.5 bg-neo-red border-3 border-black rounded-lg shadow-neo hover:translate-x-0.5 hover:translate-y-0.5"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div
                                className="w-24 h-24 rounded-full border-4 border-black shadow-neo mb-6 flex items-center justify-center"
                                style={{ backgroundColor: selected.latestColor?.toLowerCase() || '#f0f0f0' }}
                            >
                                <User className="w-12 h-12 text-black/20" />
                            </div>

                            <h4 className="text-2xl font-black uppercase tracking-tight mb-1">{selected.name}</h4>
                            <p className="text-sm font-bold text-black/40 mb-6 uppercase tracking-widest">@{selected.hackerrank_id}</p>

                            <div className="w-full space-y-3">
                                <div className="flex items-center justify-between p-3 bg-black/5 rounded-xl border-2 border-black/10">
                                    <span className="text-xs font-black uppercase opacity-50">Location</span>
                                    <span className="text-sm font-black">{selected.lab} / {selected.seat}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-black/5 rounded-xl border-2 border-black/10">
                                    <span className="text-xs font-black uppercase opacity-50">Latest Solve</span>
                                    <span className="text-sm font-black">{selected.latestChallenge || 'N/A'}</span>
                                </div>
                                {selected.latestTime && (
                                    <div className="flex items-center justify-between p-3 bg-neo-yellow/20 rounded-xl border-2 border-black/20">
                                        <span className="text-xs font-black uppercase opacity-50">Signal Time</span>
                                        <span className="text-sm font-black">{selected.latestTime}'</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
