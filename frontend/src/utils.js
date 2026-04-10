const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/**
 * Normalise an ISO string to always have timezone info.
 * Bare strings like "2026-04-10T20:27:00" (no Z/offset) are treated as UTC.
 */
function asUTC(isoString) {
  if (!isoString) return isoString;
  const hasTz = isoString.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(isoString);
  return hasTz ? isoString : isoString + "Z";
}

/**
 * Format an ISO timestamp for display in IST.
 * Returns { date: "15 Jan 2024", time: "09:30" } or null if falsy.
 */
export function formatIST(isoString) {
  if (!isoString) return null;
  const d = new Date(asUTC(isoString));
  const date = d.toLocaleDateString("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { date, time };
}

/**
 * Convert an ISO string to a datetime-local input value (YYYY-MM-DDTHH:mm) in IST.
 */
export function toDatetimeLocalIST(isoString) {
  if (!isoString) return "";
  const ist = new Date(new Date(asUTC(isoString)).getTime() + IST_OFFSET_MS);
  const pad = (n) => String(n).padStart(2, "0");
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}T${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`;
}

/**
 * Parse a datetime-local value (treated as IST) back to a UTC ISO string.
 */
export function fromDatetimeLocalIST(datetimeLocal) {
  if (!datetimeLocal) return null;
  // Append IST offset so Date parses it correctly regardless of browser timezone
  return new Date(datetimeLocal + "+05:30").toISOString();
}

/**
 * Format just the time portion of an ISO string in IST, 24-hr (HH:mm).
 */
export function timeIST(isoString) {
  if (!isoString) return "";
  return new Date(asUTC(isoString)).toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
