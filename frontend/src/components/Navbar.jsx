import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  HelpCircle,
  LogOut,
  Menu,
  X,
  QrCode,
  Mail,
  Wifi
} from "lucide-react";

const links = [
  { to: "/admin/dashboard", label: "Queue", icon: LayoutDashboard },
  { to: "/admin/attendance", label: "Manual", icon: UserCheck },
  { to: "/admin/scanner", label: "Scanner", icon: QrCode },
  { to: "/admin/participants", label: "Participants", icon: Users },
  { to: "/admin/questions", label: "Questions", icon: HelpCircle },
  { to: "/admin/emails", label: "Emails", icon: Mail },
  { to: "/admin/wifi", label: "Wifi", icon: Wifi },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function logout() {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  }

  return (
    <nav className="bg-white border-b-4 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <span className="text-black font-black text-xl tracking-tight uppercase italic underline decoration-4 decoration-neo-green">
              Code Uncode
            </span>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-2">
              {links.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-2 border-3 border-transparent rounded-xl text-sm font-black transition-all ${location.pathname === to
                    ? "bg-neo-yellow border-black shadow-neo"
                    : "text-black/70 hover:bg-black/5 hover:text-black"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop logout */}
          <button
            onClick={logout}
            className="hidden md:flex items-center gap-2 text-sm font-black text-black px-4 py-2 border-3 border-black rounded-xl bg-neo-pink shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 border-3 border-black rounded-xl bg-white shadow-neo"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu - Modal Overlay */}
      {menuOpen && (
        <>
          {/* Backdrop for click-to-close */}
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
          />

          <div className="fixed top-[72px] right-4 left-4 z-50 md:hidden neo-card bg-neo-green p-4 flex flex-col gap-2 max-w-sm mx-auto animate-in fade-in zoom-in duration-200 origin-top">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Navigation</span>
              <button onClick={() => setMenuOpen(false)}>
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 border-3 border-black rounded-xl text-sm font-black italic transition-all ${location.pathname === to
                  ? "bg-white shadow-neo-sm translate-x-1 translate-y-1"
                  : "bg-white/60 active:translate-x-0.5 active:translate-y-0.5"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}

            <div className="h-px bg-black/10 my-1" />

            <button
              onClick={logout}
              className="flex items-center gap-3 w-full text-left px-4 py-3 border-3 border-black rounded-xl text-sm font-black italic bg-neo-red shadow-neo-sm active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </>
      )}
    </nav>
  );
}

