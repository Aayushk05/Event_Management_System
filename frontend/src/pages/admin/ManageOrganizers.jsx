import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { getErrorMsg, copyToClipboard } from "../../utils/helpers";
import LoadingSpinner from "../../components/LoadingSpinner";

const CATEGORIES = ["Technical", "Cultural", "Sports", "Music", "Arts", "Finance", "Research", "Social", "Other"];

const ManageOrganizers = () => {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCreds, setNewCreds] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [form, setForm] = useState({ organizerName: "", category: "", description: "" });
  const [search, setSearch] = useState("");

  const fetchOrganizers = () =>
    api.get("/admin/organizers").then((r) => setOrganizers(r.data.organizers || []));

  useEffect(() => {
    fetchOrganizers().catch(() => toast.error("Failed to load organizers.")).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.organizerName || !form.category || !form.description)
      return toast.error("All fields are required.");
    setCreating(true);
    try {
      const { data } = await api.post("/admin/organizers", form);
      setNewCreds(data.credentials);
      setForm({ organizerName: "", category: "", description: "" });
      setShowCreate(false);
      await fetchOrganizers();
      toast.success(`${data.organizer.organizerName} created!`);
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (userId, currentStatus, name) => {
    setProcessing(userId);
    try {
      const { data } = await api.put(`/admin/organizers/${userId}/toggle-status`);
      await fetchOrganizers();
      toast.success(`${name} ${data.isActive ? "enabled" : "disabled"}.`);
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (userId, name) => {
    setProcessing(userId);
    try {
      await api.delete(`/admin/organizers/${userId}`);
      await fetchOrganizers();
      setConfirmDelete(null);
      toast.success(`${name} permanently deleted.`);
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setProcessing(null);
    }
  };

  const filteredOrgs = organizers.filter(
    (o) =>
      o.organizerName.toLowerCase().includes(search.toLowerCase()) ||
      o.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Manage Clubs & Organizers</h1>
          <p className="text-slate-500 text-sm mt-1 font-body">{organizers.length} clubs registered.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Club
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input className="input pl-9" placeholder="Search clubs…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-bg-border bg-bg-elevated">
              <tr>
                {["Club", "Category", "Login Email", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-medium font-body whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border">
              {filteredOrgs.map((org) => (
                <tr key={org._id} className="hover:bg-bg-elevated transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-bg-border flex items-center justify-center text-xs font-display font-bold text-amber-500 flex-shrink-0">
                        {org.organizerName[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-200 font-body">{org.organizerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-body">{org.category}</td>
                  <td className="px-4 py-3 text-slate-400 font-body text-xs">{org.userId?.email}</td>
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
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleStatus(org.userId?._id, org.userId?.isActive, org.organizerName)}
                        disabled={processing === org.userId?._id}
                        className={`text-xs py-1 px-2 rounded border font-body transition-all ${
                          org.userId?.isActive
                            ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                            : "border-green-500/20 text-green-400 hover:bg-green-500/10"
                        }`}
                      >
                        {processing === org.userId?._id ? "…" : org.userId?.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ userId: org.userId?._id, name: org.organizerName })}
                        className="text-xs py-1 px-2 rounded border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 font-body transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrgs.length === 0 && (
            <p className="text-center py-10 text-slate-500 font-body text-sm">No clubs found.</p>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="section-title">Add New Club</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 font-body">
              Login credentials will be auto-generated. Share them securely with the club.
            </p>
            <div>
              <label className="label">Club Name *</label>
              <input className="input" placeholder="e.g. Programming Club" value={form.organizerName} onChange={(e) => setForm((p) => ({ ...p, organizerName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Category *</label>
              <select className="input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                <option value="">Select category…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea className="input resize-none" rows={3} placeholder="Brief description of the club…" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="btn-primary flex-1">
                {creating ? "Creating…" : "Create Club"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {newCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 space-y-5 border border-amber-500/30 animate-slide-up">
            <div className="text-center">
              <p className="text-2xl mb-2"></p>
              <h2 className="section-title text-amber-400">Club Created!</h2>
              <p className="text-xs text-slate-500 font-body mt-1">
                Share these credentials with the club. The password is shown <strong>once only</strong>.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Login Email", value: newCreds.email },
                { label: "Password",    value: newCreds.password },
              ].map(({ label, value }) => (
                <div key={label} className="bg-bg-elevated rounded-lg border border-bg-border p-3">
                  <p className="text-xs text-slate-500 mb-1 font-body">{label}</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm text-amber-400 font-mono break-all">{value}</code>
                    <button
                      onClick={async () => {
                        const ok = await copyToClipboard(value);
                        if (ok) toast.success(`${label} copied!`);
                      }}
                      className="text-slate-500 hover:text-slate-300 flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-xs text-red-400/80 font-body">
              ⚠️ Copy and save these credentials now. The password cannot be retrieved later.
            </div>

            <button onClick={() => setNewCreds(null)} className="btn-primary w-full">
              Done - I've saved the credentials
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <h2 className="section-title text-red-400">⚠️ Permanently Delete</h2>
            <p className="text-sm text-slate-300 font-body">
              Delete <strong className="text-slate-100">{confirmDelete.name}</strong>? This will remove all their events, registrations, and messages. <strong>This cannot be undone.</strong>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => handleDelete(confirmDelete.userId, confirmDelete.name)}
                disabled={processing === confirmDelete.userId}
                className="btn-danger flex-1"
              >
                {processing === confirmDelete.userId ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrganizers;
