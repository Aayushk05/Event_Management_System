import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { getErrorMsg, formatDateTime, copyToClipboard } from "../../utils/helpers";
import LoadingSpinner from "../../components/LoadingSpinner";

const PasswordResetRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [comment, setComment] = useState({});
  const [newPasswords, setNewPasswords] = useState({});
  const [filter, setFilter] = useState("Pending");

  const fetchRequests = () =>
    api.get("/admin/password-reset-requests").then((r) => setRequests(r.data.requests || []));

  useEffect(() => {
    fetchRequests().catch(() => toast.error("Failed to load requests.")).finally(() => setLoading(false));
  }, []);

  const approveRequest = async (id, orgName) => {
    setProcessing(id);
    try {
      const { data } = await api.put(`/admin/password-reset-requests/${id}/approve`, {
        comment: comment[id] || "",
      });
      setNewPasswords((p) => ({ ...p, [id]: data.newPassword }));
      await fetchRequests();
      toast.success(`Approved. New password generated for ${orgName}.`);
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setProcessing(null);
    }
  };

  const rejectRequest = async (id, orgName) => {
    setProcessing(id);
    try {
      await api.put(`/admin/password-reset-requests/${id}/reject`, {
        comment: comment[id] || "",
      });
      await fetchRequests();
      toast.success(`Request from ${orgName} rejected.`);
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const filtered = filter === "All" ? requests : requests.filter((r) => r.status === filter);

  const counts = {
    Pending:  requests.filter((r) => r.status === "Pending").length,
    Approved: requests.filter((r) => r.status === "Approved").length,
    Rejected: requests.filter((r) => r.status === "Rejected").length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Password Reset Requests</h1>
        <p className="text-slate-500 text-sm mt-1 font-body">
          {counts.Pending} pending · {counts.Approved} approved · {counts.Rejected} rejected
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["Pending", "Approved", "Rejected", "All"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium font-body border transition-all ${
              filter === f
                ? "bg-amber-500/20 border-amber-500 text-amber-400"
                : "bg-bg-elevated border-bg-border text-slate-400 hover:border-slate-500"
            }`}
          >
            {f} {f !== "All" && `(${counts[f] || 0})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 font-body">
          No {filter.toLowerCase()} requests.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => (
            <div key={req._id} className="card p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge border text-xs ${
                      req.status === "Pending"  ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                      req.status === "Approved" ? "bg-green-500/10 text-green-400 border-green-500/30" :
                      "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>{req.status}</span>
                    <span className="text-xs text-slate-500 font-body">{req.organizerId?.category}</span>
                  </div>
                  <h3 className="font-display font-semibold text-slate-100">
                    {req.organizerId?.organizerName}
                  </h3>
                  <p className="text-xs text-slate-500 font-body">{req.userId?.email}</p>
                </div>
                <span className="text-xs text-slate-500 font-body whitespace-nowrap">
                  {formatDateTime(req.createdAt)}
                </span>
              </div>

              {/* Reason */}
              <div className="bg-bg-elevated rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-0.5 font-body">Reason</p>
                <p className="text-sm text-slate-300 font-body">{req.reason}</p>
              </div>

              {/* Admin comment field */}
              {req.adminComment && (
                <div className="bg-bg-elevated rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-0.5 font-body">Admin Comment</p>
                  <p className="text-sm text-slate-300 font-body">{req.adminComment}</p>
                </div>
              )}

              {/* New password reveal */}
              {newPasswords[req._id] && (
                <div className="bg-amber-500/5 border border-amber-500/30 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-medium text-amber-400 font-body">
                    New password generated. Share securely - shown once only.
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-amber-400 font-mono text-sm">{newPasswords[req._id]}</code>
                    <button
                      onClick={async () => {
                        const ok = await copyToClipboard(newPasswords[req._id]);
                        if (ok) toast.success("Copied");
                      }}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              {req.status === "Pending" && (
                <div className="space-y-3">
                  <div>
                    <label className="label text-xs">Comment (optional)</label>
                    <input
                      className="input text-sm"
                      placeholder="Add a note for the organizer…"
                      value={comment[req._id] || ""}
                      onChange={(e) => setComment((p) => ({ ...p, [req._id]: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => approveRequest(req._id, req.organizerId?.organizerName)}
                      disabled={processing === req._id}
                      className="btn-primary flex-1"
                    >
                      {processing === req._id ? "Processing…" : "Approve & Generate Password"}
                    </button>
                    <button
                      onClick={() => rejectRequest(req._id, req.organizerId?.organizerName)}
                      disabled={processing === req._id}
                      className="btn-danger flex-1"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordResetRequests;
