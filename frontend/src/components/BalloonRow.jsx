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
    <span className={`neo-badge lowercase py-1 px-3 ${cls}`}>
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
    <tr className="hover:bg-neo-yellow/5 transition-colors border-b-2 border-black/5">
      <td className="px-3 sm:px-6 py-3 sm:py-4 font-black font-mono text-xs text-black/60 whitespace-nowrap">
        {mins}:{secs}
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 font-black font-mono text-xs text-black whitespace-nowrap">
        <span className="bg-neo-blue/20 px-2 py-1 rounded border-2 border-black/10">
          {submission.hackerrank_id}
        </span>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 font-black text-black whitespace-nowrap text-sm sm:text-base">
        {submission.name}
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 font-bold text-black/80 whitespace-nowrap uppercase text-xs sm:text-sm">
        {submission.lab}
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 font-bold text-black/80 whitespace-nowrap uppercase text-xs sm:text-sm">
        {submission.seat || "—"}
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 font-bold text-black/70 max-w-[140px] sm:max-w-xs truncate italic text-xs sm:text-sm">
        {submission.challenge}
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <BalloonBadge colour={submission.balloon_colour} />
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
        <button
          disabled={ticking}
          onClick={() => onTick(submission.submission_id)}
          className="neo-btn bg-neo-green py-2 px-4 shadow-neo text-xs uppercase tracking-wider"
        >
          {ticking ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Delivered</>}
        </button>
      </td>
    </tr>
  );
}

