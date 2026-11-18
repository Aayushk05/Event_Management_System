import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const [organizers, setOrganizers] = useState([]);
  const [pendingResets, setPendingResets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/admin/organizers"),
      api.get("/admin/password-reset-requests"),
    ]).then(([oRes, rRes]) => {
      setOrganizers(oRes.data.organizers || []);
      setPendingResets((rRes.data.requests || []).filter((r) => r.status === "Pending"));
    }).catch(() => toast.error("Failed to load admin data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const activeOrgs    = organizers.filter((o) => o.userId?.isActive);
  const disabledOrgs  = organizers.filter((o) => !o.userId?.isActive);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1 font-body">System overview and quick actions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Clubs",    value: organizers.length,     color: "text-slate-200" },
          { label: "Active",         value: activeOrgs.length,     color: "text-green-400" },
          { label: "Disabled",       value: disabledOrgs.length,   color: "text-red-400" },
          { label: "Pending Resets", value: pendingResets.length,  color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-body">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/admin/organizers" className="card p-5 hover:border-amber-500/40 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-xl">🏢</div>
            <div>
              <h3 className="font-display font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">
                Manage Clubs / Organizers
              </h3>
              <p className="text-xs text-slate-500 font-body mt-0.5">
                {organizers.length} clubs · Create, enable, disable, or delete
              </p>
            </div>
          </div>
        </Link>

        <Link to="/admin/password-reset-requests" className="card p-5 hover:border-amber-500/40 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-xl">🔐</div>
            <div>
              <h3 className="font-display font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">
                Password Reset Requests
              </h3>
              <p className="text-xs text-slate-500 font-body mt-0.5">
                {pendingResets.length} pending · Review and approve or reject
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent organizers */}
      <div className="space-y-3">
        <h2 className="section-title">Recent Clubs</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-bg-border bg-bg-elevated">
                <tr>
                  {["Name", "Category", "Email", "Status", "Joined"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-medium font-body">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border">
                {organizers.slice(0, 10).map((org) => (
                  <tr key={org._id} className="hover:bg-bg-elevated transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200 font-body">{org.organizerName}</td>
                    <td className="px-4 py-3 text-slate-400 font-body">{org.category}</td>
                    <td className="px-4 py-3 text-slate-400 font-body text-xs">{org.contactEmail}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        org.userId?.isActive
                          ? "bg-green-500/10 text-green-400 border border-green-500/30"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {org.userId?.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-body text-xs">
                      {new Date(org.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {organizers.length === 0 && (
              <p className="text-center py-8 text-slate-500 font-body text-sm">No clubs yet.</p>
            )}
          </div>
        </div>
        {organizers.length > 10 && (
          <Link to="/admin/organizers" className="text-sm text-amber-400 hover:underline font-body">
            View all {organizers.length} clubs →
          </Link>
        )}
      </div>

      {/* Pending resets */}
      {pendingResets.length > 0 && (
        <div className="space-y-3">
          <h2 className="section-title text-amber-400">
            ⚠️ {pendingResets.length} Pending Password Reset Request{pendingResets.length > 1 ? "s" : ""}
          </h2>
          <div className="space-y-2">
            {pendingResets.map((req) => (
              <div key={req._id} className="card p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-200 font-body">{req.organizerId?.organizerName}</p>
                  <p className="text-xs text-slate-500 font-body">{req.reason}</p>
                </div>
                <Link to="/admin/password-reset-requests" className="btn-primary text-sm py-1.5">
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
