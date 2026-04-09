import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";
import { Lock, LogIn, ShieldCheck, Loader2 } from "lucide-react";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("admin_token")) navigate("/admin/dashboard", { replace: true });
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = await login(password);
      localStorage.setItem("admin_token", token);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-black mb-6 shadow-neo rotate-3">
            <ShieldCheck className="text-neo-green w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-black tracking-tight uppercase italic underline decoration-neo-pink decoration-4">
            Code Uncode
          </h1>
          <p className="text-xs font-black text-black/40 mt-3 uppercase tracking-[0.2em]">
            Restricted Access — Phase VI
          </p>
        </div>

        <div className="neo-card bg-white p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-black uppercase tracking-widest mb-2 ml-1">
                <Lock className="w-3 h-3" />
                Access Key
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                className="w-full px-5 py-4 rounded-xl border-3 border-black text-lg font-black bg-white shadow-neo focus:shadow-neo-lg outline-none transition-all placeholder-black/10"
              />
            </div>
            {error && (
              <div className="neo-badge bg-neo-red w-full justify-center py-3 shadow-none border-dashed border-2">
                <p className="text-xs font-black uppercase italic">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="neo-btn w-full py-4 bg-neo-green text-black uppercase tracking-widest text-sm"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Authenticate
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-10">
          <a href="/" className="text-[10px] font-black uppercase text-black/30 hover:text-black transition-colors tracking-widest underline decoration-2 decoration-neo-blue decoration-dashed">
            ← Return to public portal
          </a>
        </p>
      </div>
    </div>
  );
}

