import React from "react";

export default function SeatGrid({ labName, participants, pendingBalloons }) {
    // Assume seats are 1-20 or 1-22
    // Create a 10x2 grid (vertical)
    // Left column: 1-10, Right column: 11-20
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const columns = [0, 12]; // offsets

    const getParticipantAt = (seat) => {
        return participants.find((p) => p.lab === labName && String(p.seat) === String(seat));
    };

    const isPending = (hackerrankId) => {
        return pendingBalloons.some((b) => b.hackerrank_id === hackerrankId);
    };

    return (
        <div className="neo-card overflow-hidden bg-white border-4 border-black shadow-neo">
            <h3 className="text-xl font-black uppercase text-center bg-neo-yellow py-2 border-b-4 border-black px-6">
                {labName}
            </h3>
            <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-x-3 sm:gap-x-6 gap-y-2 sm:gap-y-3">
                {columns.map((offset) => (
                    <div key={offset} className="flex flex-col gap-3">
                        {rows.map((row) => {
                            const seatNum = row + offset;
                            const p = getParticipantAt(seatNum);
                            const pending = p && isPending(p.hackerrank_id);
                            const balloons = p ? pendingBalloons.filter(b => b.hackerrank_id === p.hackerrank_id) : [];

                            return (
                                <div
                                    key={seatNum}
                                    className={`relative h-14 border-3 border-black rounded-xl p-2 flex items-center justify-between transition-all ${p ? "bg-neo-blue/5" : "bg-black/5 border-dashed"
                                        } ${pending ? "bg-neo-red/20 border-neo-red shadow-neo-sm" : ""}`}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black opacity-40 leading-none">SEAT</span>
                                        <span className={`text-lg font-black ${pending ? "text-neo-red" : ""}`}>
                                            {String(seatNum).padStart(2, "0")}
                                        </span>
                                    </div>

                                    {p && (
                                        <div className="flex-1 ml-3 truncate">
                                            <div className="text-[10px] font-black truncate uppercase leading-none mb-1">
                                                {p.name.split(" ")[0]}
                                            </div>
                                            <div className="flex gap-1 overflow-hidden">
                                                {balloons.map((b, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-3 h-3 rounded-full border-2 border-black shadow-[1px_1px_0_0_black]"
                                                        style={{ backgroundColor: b.balloon_colour?.toLowerCase() || "white" }}
                                                        title={b.challenge}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {pending && (
                                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-neo-red rounded-full border-2 border-black animate-pulse shadow-neo-sm" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            </div>
        </div>
    );
}
