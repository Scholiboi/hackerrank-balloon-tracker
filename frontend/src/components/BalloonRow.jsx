import React from "react";

const COLOUR_MAP = {
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  yellow: "bg-yellow-100 text-yellow-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
  pink: "bg-pink-100 text-pink-700",
  white: "bg-gray-100 text-gray-700",
};

function BalloonBadge({ colour }) {
  const lower = (colour || "").toLowerCase();
  const cls = COLOUR_MAP[lower] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>
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
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">
        {mins}:{secs}
      </td>
      <td className="px-4 py-3 text-brand-600 font-mono text-xs whitespace-nowrap">
        {submission.hackerrank_id}
      </td>
      <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">
        {submission.name}
      </td>
      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
        {submission.lab}
      </td>
      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
        {submission.seat || "—"}
      </td>
      <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
        {submission.challenge}
      </td>
      <td className="px-4 py-3">
        <BalloonBadge colour={submission.balloon_colour} />
      </td>
      <td className="px-4 py-3 text-right">
        <button
          disabled={ticking}
          onClick={() => onTick(submission.submission_id)}
          className="px-3 py-1 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {ticking ? "…" : "Delivered"}
        </button>
      </td>
    </tr>
  );
}
