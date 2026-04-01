import React, { useEffect, useRef, useState } from "react";
import { lookupPortal } from "../api";

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
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 flex flex-col items-center justify-start pt-10 sm:pt-16 px-4">
      <div className="w-full max-w-md sm:max-w-lg">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          {/* Logo placeholder — swap with <img> later */}
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-600 mb-4 shadow-lg">
            <span className="text-white font-black text-2xl sm:text-3xl leading-none">CU</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-700 mb-1 tracking-tight">
            Code Uncode
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">Find your seat for the contest</p>
        </div>

        {/* Search box */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or HackerRank ID…"
            className="w-full pl-10 pr-12 py-3.5 rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-800 placeholder-gray-400 text-base bg-white"
            autoFocus
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
        )}

        {/* No results */}
        {results !== null && results.length === 0 && !loading && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">No participant found for "{query}"</p>
          </div>
        )}

        {/* Results */}
        {results && results.length > 0 && (
          <div className="mt-4 space-y-3">
            {results.map((p) => (
              <div
                key={p.hackerrank_id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-lg leading-tight truncate">{p.name}</p>
                    <p className="text-brand-600 font-mono text-sm mt-0.5">{p.hackerrank_id}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {p.lab && (
                      <span className="bg-brand-50 text-brand-700 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                        {p.lab}
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                      p.checked_in
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {p.checked_in ? "✓ Checked In" : "Not Checked In"}
                    </span>
                  </div>
                </div>

                {(p.seat || p.location) && (
                  <div className="pt-3 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {p.seat && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Seat</p>
                        <p className="text-gray-700 text-sm font-medium">{p.seat}</p>
                      </div>
                    )}
                    {p.location && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Location</p>
                        <p className="text-gray-700 text-sm font-medium">{p.location}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-300 mt-10 pb-8">
          Admin?{" "}
          <a href="/admin/login" className="text-brand-500 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
