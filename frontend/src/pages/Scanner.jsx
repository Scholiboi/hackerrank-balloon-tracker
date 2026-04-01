import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import Navbar from "../components/Navbar";
import { qrScan } from "../api";

const SCAN_TYPES = [
  { value: "lab", label: "Lab Entry", description: "Scan at the entry gate to check in the participant" },
  { value: "seat", label: "Seat Verify", description: "Scan at the lab to verify seat assignment" },
];

function ResultCard({ result, onDismiss }) {
  if (!result) return null;

  const isError = result.type === "error";
  const isAlready = result.action === "already_checked_in";

  const bg = isError
    ? "bg-red-50 border-red-200"
    : isAlready
    ? "bg-amber-50 border-amber-200"
    : "bg-green-50 border-green-200";

  const badge = isError
    ? "bg-red-100 text-red-700"
    : isAlready
    ? "bg-amber-100 text-amber-700"
    : "bg-green-100 text-green-700";

  const statusText = isError
    ? "Error"
    : isAlready
    ? "Already Checked In"
    : result.action === "checked_in"
    ? "Checked In"
    : "Seat Info";

  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>
            {statusText}
          </span>
          {isError ? (
            <p className="mt-2 text-sm text-red-700">{result.message}</p>
          ) : (
            <div className="mt-2 space-y-1">
              <p className="font-semibold text-gray-900">{result.name}</p>
              <p className="text-xs font-mono text-gray-500">{result.hackerrank_id}</p>
              <div className="flex gap-4 mt-1">
                {result.lab && (
                  <span className="text-sm text-gray-600">
                    <span className="font-medium">Lab:</span> {result.lab}
                  </span>
                )}
                {result.seat && (
                  <span className="text-sm text-gray-600">
                    <span className="font-medium">Seat:</span> {result.seat}
                  </span>
                )}
              </div>
              {result.action === "seat_info" && (
                <p className={`text-xs font-semibold mt-1 ${result.checked_in ? "text-green-600" : "text-amber-600"}`}>
                  {result.checked_in ? "Participant has checked in at the gate" : "Not yet checked in at the gate"}
                </p>
              )}
            </div>
          )}
        </div>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 text-lg leading-none ml-2">
          ×
        </button>
      </div>
    </div>
  );
}

export default function Scanner() {
  const [scanType, setScanType] = useState("lab");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const lastScannedRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  async function startScanner() {
    setResult(null);
    lastScannedRef.current = null;
    const qr = new Html5Qrcode("qr-reader");
    html5QrRef.current = qr;
    setScanning(true);
    try {
      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      );
    } catch {
      setScanning(false);
      setResult({ type: "error", message: "Could not access camera. Please allow camera permissions." });
    }
  }

  async function stopScanner() {
    if (html5QrRef.current) {
      await html5QrRef.current.stop().catch(() => {});
      html5QrRef.current = null;
    }
    setScanning(false);
  }

  async function onScanSuccess(decodedText) {
    // Debounce — ignore repeated scans of the same code within 3 seconds
    if (lastScannedRef.current === decodedText) return;
    lastScannedRef.current = decodedText;
    setTimeout(() => { lastScannedRef.current = null; }, 3000);

    setProcessing(true);
    try {
      let payload;
      try {
        payload = JSON.parse(decodedText);
      } catch {
        setResult({ type: "error", message: "Invalid QR code format — expected JSON." });
        return;
      }

      if (!payload.hackerrank_id) {
        setResult({ type: "error", message: 'QR code missing "hackerrank_id" field.' });
        return;
      }

      const data = await qrScan({ ...payload, scan_type: scanType });
      setResult(data);
    } catch (err) {
      setResult({
        type: "error",
        message: err.response?.data?.detail || "Scan failed. Please try again.",
      });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-6 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">QR Scanner</h2>
        <p className="text-sm text-gray-500 mb-5">Scan participant QR codes for lab check-in or seat verification</p>

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {SCAN_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => { setScanType(t.value); setResult(null); }}
              disabled={scanning}
              className={`rounded-xl border p-4 text-left transition-colors ${
                scanType === t.value
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <p className={`font-semibold text-sm ${scanType === t.value ? "text-brand-700" : "text-gray-700"}`}>
                {t.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>

        {/* Scanner viewport */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div id="qr-reader" ref={scannerRef} className={scanning ? "block" : "hidden"} />
          {!scanning && (
            <div className="flex flex-col items-center justify-center py-14 text-gray-400">
              <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 9V5a2 2 0 012-2h4M3 15v4a2 2 0 002 2h4m6-18h4a2 2 0 012 2v4m0 6v4a2 2 0 01-2 2h-4M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
              </svg>
              <p className="text-sm">Camera inactive</p>
            </div>
          )}
        </div>

        {/* Processing indicator */}
        {processing && (
          <div className="text-center text-sm text-brand-600 font-medium mb-3">Processing scan…</div>
        )}

        {/* Result */}
        <ResultCard result={result} onDismiss={() => setResult(null)} />

        {/* Controls */}
        <div className="mt-4 flex gap-3">
          {!scanning ? (
            <button
              onClick={startScanner}
              className="flex-1 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              Start Camera
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
            >
              Stop Camera
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
