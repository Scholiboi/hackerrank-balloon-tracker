import React, { useEffect, useRef, useState } from "react";
import { lookupPortal } from "../api";
import { Search, CheckCircle2, Circle, ExternalLink, LogIn, Loader2 } from "lucide-react";

export default function Portal() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setError("");
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const data = await lookupPortal(query.trim());
        setResults(data);
      } catch {
        setError("Could not reach the server. Please try again.");
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-10 sm:pt-16 px-4">
      <div className="w-full max-w-md sm:max-w-lg">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black mb-4 shadow-neo">
            <span className="text-white font-black text-2xl sm:text-3xl leading-none">CU</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-black mb-1 tracking-tight">
            Code Uncode
          </h1>
          <p className="text-black/60 font-medium text-sm sm:text-base">Find your seat for the contest</p>
        </div>

        {/* Search box */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black pointer-events-none">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or HackerRank ID…"
            className="w-full pl-12 pr-12 py-4 rounded-xl border-3 border-black shadow-neo focus:outline-none focus:shadow-neo-lg text-black placeholder-black/40 text-base bg-white transition-all font-bold"
            autoFocus
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-black">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm font-bold text-neo-red text-center">{error}</p>
        )}

        {/* No results */}
        {results !== null && results.length === 0 && !loading && (
          <div className="mt-8 text-center bg-white border-3 border-black p-4 rounded-xl shadow-neo">
            <p className="text-black font-bold text-sm">No participant found for "{query}"</p>
          </div>
        )}

        {/* Results */}
        {results && results.length > 0 && (
          <div className="mt-6 space-y-4">
            {results.map((p) => (
              <div
                key={p.hackerrank_id}
                className="neo-card p-5"
              >
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-black text-lg leading-tight truncate">{p.name}</p>
                    <p className="font-mono text-sm mt-1 bg-neo-yellow px-2 py-0.5 border-2 border-black rounded inline-block">
                      {p.hackerrank_id}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {p.lab && (
                      <span className="neo-badge bg-neo-blue">
                        {p.lab}
                      </span>
                    )}
                    <span className={`neo-badge ${
                      p.checked_in
                        ? "bg-neo-green text-black"
                        : "bg-white text-black/50 border-black/30 shadow-none"
                    }`}>
                      {p.checked_in ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Checked In</>
                      ) : (
                        <><Circle className="w-3 h-3 mr-1" /> Not Checked In</>
                      )}
                    </span>
                  </div>
                </div>

                {p.seat && (
                  <div className="pt-3 border-t-2 border-dashed border-black/20">
                    <p className="text-[10px] text-black/50 uppercase font-black mb-1">Seat Assignment</p>
                    <p className="text-black text-sm font-bold bg-neo-pink/30 p-2 rounded border-2 border-black border-dashed">
                      {p.seat}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-10">
          <a
            href="https://www.hackerrank.com/djsce-regionalsixseven"
            target="_blank"
            rel="noopener noreferrer"
            className="neo-btn bg-neo-green"
          >
            <ExternalLink className="w-5 h-5 font-black" />
            Open Contest
          </a>
        </div>

        <p className="text-center text-xs font-bold text-black/40 mt-8 pb-8 flex items-center justify-center gap-1">
          Admin?{" "}
          <a href="/admin/login" className="text-black hover:underline flex items-center gap-1">
            <LogIn className="w-3 h-3" />
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

