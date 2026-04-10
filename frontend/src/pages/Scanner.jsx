import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import Navbar from "../components/Navbar";
import { qrScan } from "../api";
import { QrCode, Camera, CameraOff, CheckCircle2, AlertCircle, X, ShieldCheck, MapPin, User, Loader2 } from "lucide-react";

const SCAN_TYPES = [
  {
    value: "lab",
    label: "College Check-in",
    description: "Verify participant arrival at the main entrance",
    color: "bg-neo-green",
    icon: ShieldCheck
  },
  { 
    value: "seat", 
    label: "Lab Verify", 
    description: "Scan inside specific labs for seat allocation",
    color: "bg-neo-blue",
    icon: MapPin
  },
];

function ResultCard({ result, onDismiss }) {
  if (!result) return null;

  const isError = result.type === "error";
  const isAlready = result.action === "already_checked_in";

  const colorClass = isError
    ? "bg-neo-red"
    : isAlready
    ? "bg-neo-yellow"
    : "bg-neo-green";

  const statusText = isError
    ? "Error"
    : isAlready
    ? "Already College Checked In"
    : result.action === "checked_in"
    ? "College Checked In"
    : "Seat Info";

  return (
    <div className={`neo-card ${colorClass} p-5 relative mt-4`}>
      <button 
        onClick={onDismiss} 
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black text-white hover:scale-110 transition-transform shadow-neo-sm"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shrink-0 shadow-neo-sm">
          {isError ? (
            <AlertCircle className="text-white w-6 h-6" />
          ) : (
            <CheckCircle2 className="text-white w-6 h-6" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-black text-white rounded">
              {statusText}
            </span>
          </div>

          {isError ? (
            <p className="font-black text-sm uppercase italic">{result.message}</p>
          ) : (
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-black text-black uppercase truncate leading-tight">
                  {result.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <User className="w-3 h-3 text-black/40" />
                  <p className="text-xs font-black font-mono text-black/40 uppercase">
                    {result.hackerrank_id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {result.lab && (
                  <div className="bg-black/5 rounded-lg p-2 border-2 border-dashed border-black/20">
                    <p className="text-[10px] font-black uppercase text-black/40">Lab</p>
                    <p className="text-sm font-black text-black">{result.lab}</p>
                  </div>
                )}
                {result.seat && (
                  <div className="bg-black/5 rounded-lg p-2 border-2 border-dashed border-black/20">
                    <p className="text-[10px] font-black uppercase text-black/40">Seat</p>
                    <p className="text-sm font-black text-black">{result.seat}</p>
                  </div>
                )}
              </div>

              {result.action === "seat_info" && (
                <div className={`neo-badge w-full justify-center py-2 ${result.checked_in ? "bg-black text-white" : "bg-white/50 border-dashed"}`}>
                  <p className="text-[10px] font-black uppercase italic">
                    {result.checked_in ? "College Check-in Verified" : "Awaiting College Check-in"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
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
        { fps: 15, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      );
    } catch {
      setScanning(false);
      setResult({ type: "error", message: "Camera access denied. Check permissions." });
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
    if (lastScannedRef.current === decodedText) return;
    lastScannedRef.current = decodedText;
    setTimeout(() => { lastScannedRef.current = null; }, 3000);

    setProcessing(true);
    try {
      let payload;
      try {
        payload = JSON.parse(decodedText);
      } catch {
        setResult({ type: "error", message: "Invalid code format." });
        return;
      }

      const hackerrank_id = payload.hackerrank_id || payload.hr_id;
      if (!hackerrank_id) {
        setResult({ type: "error", message: "Missing ID." });
        return;
      }

      const data = await qrScan({ ...payload, hackerrank_id, scan_type: scanType });
      setResult(data);
    } catch (err) {
      setResult({
        type: "error",
        message: err.response?.data?.detail || "Scan request failed.",
      });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-neo rotate-3 shrink-0">
            <QrCode className="text-neo-pink w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-black uppercase italic leading-none">Security</h2>
            <p className="text-[10px] font-black uppercase text-black/40 mt-1 tracking-widest">
              Live Credential Verification
            </p>
          </div>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {SCAN_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => { setScanType(t.value); setResult(null); }}
              disabled={scanning}
              className={`neo-card p-5 text-left transition-all relative overflow-hidden group ${
                scanType === t.value
                  ? `${t.color} scale-[0.98] shadow-none`
                  : "bg-white hover:bg-gray-50 opacity-60"
              } disabled:cursor-not-allowed`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center shadow-neo-sm">
                  <t.icon className={`w-5 h-5 ${scanType === t.value ? "text-white" : "text-white/40"}`} />
                </div>
                {scanType === t.value && (
                  <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                )}
              </div>
              <p className="font-black text-xs uppercase italic text-black leading-tight mb-1">
                {t.label}
              </p>
              <p className="text-[9px] font-black uppercase text-black/40 leading-relaxed">
                {t.description}
              </p>
            </button>
          ))}
        </div>

        {/* Scanner viewport */}
        <div className="neo-card bg-black shadow-neo-lg overflow-hidden relative aspect-square max-w-[340px] mx-auto mb-8">
          <div id="qr-reader" ref={scannerRef} className={`${scanning ? "block" : "hidden"} w-full h-full`} />
          
          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 p-8 text-center">
              <CameraOff className="w-16 h-16 mb-4 stroke-[1.5]" />
              <p className="font-black uppercase italic text-xs tracking-widest underline decoration-neo-red decoration-2">
                Scanner Suspended
              </p>
            </div>
          )}

          {/* Scanner Overlay UI */}
          {scanning && (
            <div className="absolute inset-0 pointer-events-none border-[40px] border-black/60 flex items-center justify-center">
              <div className="w-full h-full border-2 border-neo-green/50 relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-neo-green" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-neo-green" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-neo-green" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-neo-green" />
                
                {/* Scanning line animation */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-neo-green/80 shadow-[0_0_15px_rgba(142,214,112,0.8)] animate-[scan_2s_linear_infinite]" />
              </div>
            </div>
          )}
        </div>

        {/* Processing State */}
        {processing && (
          <div className="neo-badge bg-black text-white w-full justify-center py-4 mb-4 gap-3 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-neo-blue" />
            <p className="text-xs font-black uppercase tracking-widest italic">Decrypting...</p>
          </div>
        )}

        {/* Result */}
        <ResultCard result={result} onDismiss={() => setResult(null)} />

        {/* Start/Stop Controls */}
        <div className="mt-8">
          {!scanning ? (
            <button
              onClick={startScanner}
              className="neo-btn w-full py-5 bg-black text-white uppercase italic tracking-[0.2em] shadow-neo-lg hover:bg-neo-green hover:text-black transition-all group"
            >
              <Camera className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              Initialize Lens
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="neo-btn w-full py-5 bg-neo-red text-black uppercase italic tracking-[0.2em] shadow-none border-dashed"
            >
              <CameraOff className="w-6 h-6" />
              Cease Operation
            </button>
          )}
        </div>

        <p className="text-center mt-12 text-[9px] font-black uppercase text-black/20 tracking-[0.3em]">
          Automated Enforcement System v2.4
        </p>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        #qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}

