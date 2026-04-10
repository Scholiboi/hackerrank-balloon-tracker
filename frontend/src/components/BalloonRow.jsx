import React from "react";
import { Check, Loader2 } from "lucide-react";

const COLOUR_MAP = {
  red: "bg-[#FF5D5D] text-black",
  blue: "bg-[#7CC5D9] text-black",
  green: "bg-[#8ED670] text-black",
  yellow: "bg-[#B8F0C8] text-black",
  orange: "bg-[#FFB347] text-black",
  purple: "bg-[#B19CD9] text-black",
  pink: "bg-[#FEBDD2] text-black",
  white: "bg-white text-black",
};

function BalloonBadge({ colour }) {
  const lower = (colour || "").toLowerCase();
  const cls = COLOUR_MAP[lower] || "bg-white text-black";
  return (
    <span className={`neo-badge lowercase py-0.5 px-2 text-[11px] ${cls}`}>
      {colour || "—"}
    </span>
  );
}

export default function BalloonRow({ submission, onTick, ticking }) {
  const mins = Math.floor(Number(submission.time_from_start) / 60)
    .toString()
    .padStart(2, "0");
  const secs = (Number(submission.time_from_start) % 60)
    .toString()
    .padStart(2, "0");

  return (
    <tr className="hover:bg-neo-yellow/5 transition-colors border-b border-black/5">
      <td className="px-3 py-2 font-black font-mono text-xs text-black/60 whitespace-nowrap">
        {mins}:{secs}
      </td>
      <td className="px-3 py-2 font-black font-mono text-xs text-black whitespace-nowrap">
        <span className="bg-neo-blue/20 px-1.5 py-0.5 rounded border border-black/10">
          {submission.hackerrank_id}
        </span>
      </td>
      <td className="px-3 py-2 font-black text-black text-xs whitespace-nowrap max-w-[120px] truncate">
        {submission.name}
      </td>
      <td className="px-3 py-2 font-bold text-black/80 whitespace-nowrap uppercase text-xs">
        {submission.lab}
      </td>
      <td className="px-3 py-2 font-bold text-black/80 whitespace-nowrap uppercase text-xs hidden sm:table-cell">
        {submission.seat || "—"}
      </td>
      <td className="px-3 py-2 font-bold text-black/70 max-w-[160px] truncate italic text-xs">
        {submission.challenge}
      </td>
      <td className="px-3 py-2">
        <BalloonBadge colour={submission.balloon_colour} />
      </td>
      <td className="px-3 py-2 text-right whitespace-nowrap">
        <button
          disabled={ticking}
          onClick={() => onTick(submission.submission_id)}
          className="neo-btn bg-neo-green py-1.5 px-3 shadow-neo-sm text-xs uppercase tracking-wide"
        >
          {ticking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Done</>}
        </button>
      </td>
    </tr>
  );
}
