import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

const PARTICIPANT_LINKS = [
  { to: "/dashboard",  label: "Dashboard" },
  { to: "/events",     label: "Browse Events" },
  { to: "/clubs",      label: "Clubs" },
  { to: "/profile",    label: "Profile" },
];

const ORGANIZER_LINKS = [
  { to: "/organizer/dashboard",      label: "Dashboard" },
  { to: "/organizer/events/create",  label: "Create Event" },
  { to: "/organizer/profile",        label: "Profile" },
];

const ADMIN_LINKS = [
  { to: "/admin/dashboard",                  label: "Dashboard" },
  { to: "/admin/organizers",                 label: "Manage Clubs" },
  { to: "/admin/password-reset-requests",    label: "Reset Requests" },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    logout();
    navigate("/login");
    toast.success("Logged out.");
  };

  const links =
    user?.role === "organizer" ? ORGANIZER_LINKS :
    user?.role === "admin"     ? ADMIN_LINKS :
    PARTICIPANT_LINKS;

  const accentClass = "font-display text-amber-500 font-bold text-xl tracking-tight";
  const activeLinkClass = "text-amber-400";
  const linkClass = "text-slate-400 hover:text-slate-100 transition-colors text-sm font-medium font-body";

  return (
    <nav className="sticky top-0 z-40 bg-bg-base/90 backdrop-blur-md border-b border-bg-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className={accentClass}>
            Felicity
          </Link>

          {/* Desktop links */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    isActive ? `${linkClass} ${activeLinkClass}` : linkClass
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:block text-slate-500 text-xs font-body">
                  {user.firstName} ·{" "}
                  <span className="text-amber-500 capitalize">{user.role}</span>
                </span>
                <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 px-3">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary text-sm py-1.5 px-4">
                Sign In
              </Link>
            )}

            {/* Mobile menu toggle */}
            {user && (
              <button
                className="md:hidden text-slate-400 hover:text-slate-100"
                onClick={() => setOpen((p) => !p)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {open
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {open && user && (
          <div className="md:hidden py-3 border-t border-bg-border space-y-1 animate-fade-in">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-body ${
                    isActive
                      ? "bg-amber-500/10 text-amber-400"
                      : "text-slate-400 hover:text-slate-100 hover:bg-bg-elevated"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
