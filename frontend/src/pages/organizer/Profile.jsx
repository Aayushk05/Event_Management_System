import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { getErrorMsg, formatDateTime } from "../../utils/helpers";
import LoadingSpinner from "../../components/LoadingSpinner";

const OrganizerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState({});
  const [testingDiscord, setTestingDiscord] = useState(false);
  const [resetRequests, setResetRequests] = useState([]);
  const [resetReason, setResetReason] = useState("");
  const [requestingReset, setRequestingReset] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/organiser/profile"),
      api.get("/organiser/password-reset-requests"),
    ]).then(([pRes, rRes]) => {
      setProfile(pRes.data.organizer);
      setForm({
        organizerName:      pRes.data.organizer.organizerName,
        category:           pRes.data.organizer.category,
        description:        pRes.data.organizer.description,
        contactEmail:       pRes.data.organizer.contactEmail,
        contactNumber:      pRes.data.organizer.contactNumber || "",
        discordWebhookUrl:  pRes.data.organizer.discordWebhookUrl || "",
      });
      setResetRequests(rRes.data.requests || []);
    }).catch(() => toast.error("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/organiser/profile", form);
      setProfile(data.organizer);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const testDiscord = async () => {
    if (!form.discordWebhookUrl) return toast.error("Enter a Discord webhook URL first.");
    setTestingDiscord(true);
    // Save first
    try {
      await api.put("/organiser/profile", { discordWebhookUrl: form.discordWebhookUrl });
      await api.post("/organiser/profile/test-discord");
      toast.success("Discord test sent");
    } catch (err) {
      toast.error("Discord test failed: " + getErrorMsg(err));
    } finally {
      setTestingDiscord(false);
    }
  };

  const submitResetRequest = async () => {
    if (!resetReason.trim()) return toast.error("Please provide a reason.");
    setRequestingReset(true);
    try {
      await api.post("/organiser/password-reset-request", { reason: resetReason });
      toast.success("Password reset request submitted. Admin will action it.");
      setResetReason("");
      // Refresh requests
      const { data } = await api.get("/organiser/password-reset-requests");
      setResetRequests(data.requests || []);
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setRequestingReset(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!profile) return null;

  const setF = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const hasPending = resetRequests.some((r) => r.status === "Pending");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Organizer Profile</h1>
        <p className="text-slate-500 text-sm mt-1 font-body">{profile.organizerName} · {profile.category}</p>
      </div>

      <div className="flex border-b border-bg-border gap-1">
        {[
          { key: "profile",   label: "Profile" },
          { key: "discord",   label: "Discord" },
          { key: "security",  label: "Security" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium font-body border-b-2 transition-all ${
              tab === key ? "border-amber-500 text-amber-400" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="card p-6 space-y-4 animate-fade-in">
          <h2 className="section-title">Club Information</h2>
          <div>
            <label className="label">Organizer Name</label>
            <input className="input" value={form.organizerName} onChange={setF("organizerName")} />
          </div>
          <div>
            <label className="label">Category</label>
            <input className="input" placeholder="Technical / Cultural / Sports…" value={form.category} onChange={setF("category")} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-24 resize-none" value={form.description} onChange={setF("description")} />
          </div>
          <div>
            <label className="label">Contact Email</label>
            <input type="email" className="input" value={form.contactEmail} onChange={setF("contactEmail")} />
          </div>
          <div>
            <label className="label">Contact Number</label>
            <input className="input" placeholder="+91 …" value={form.contactNumber} onChange={setF("contactNumber")} />
          </div>
          <div>
            <label className="label">Login Email <span className="text-slate-600 text-xs">(non-editable)</span></label>
            <input className="input opacity-60 cursor-not-allowed" value={profile.userId?.email || "—"} disabled />
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}

      {tab === "discord" && (
        <div className="card p-6 space-y-4 animate-fade-in">
          <div>
            <h2 className="section-title">Discord Webhook</h2>
            <p className="text-sm text-slate-500 font-body mt-1">
              New published events will automatically post to your Discord channel.
            </p>
          </div>
          <div>
            <label className="label">Webhook URL</label>
            <input
              className="input"
              placeholder="https://discord.com/api/webhooks/…"
              value={form.discordWebhookUrl}
              onChange={setF("discordWebhookUrl")}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-secondary flex-1">
              {saving ? "Saving…" : "Save Webhook"}
            </button>
            <button onClick={testDiscord} disabled={testingDiscord} className="btn-cyan flex-1">
              {testingDiscord ? "Testing…" : "Test Webhook "}
            </button>
          </div>
          <div className="bg-bg-elevated border border-bg-border rounded-lg p-4 text-xs text-slate-500 font-body space-y-1">
            <p className="font-medium text-slate-400">How to set up:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open your Discord server settings → Integrations → Webhooks</li>
              <li>Create a new webhook and copy the URL</li>
              <li>Paste it above and save</li>
              <li>Click "Test Webhook" to verify</li>
            </ol>
          </div>
        </div>
      )}

      {tab === "security" && (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-6 space-y-4">
            <div>
              <h2 className="section-title">Password Reset</h2>
              <p className="text-sm text-slate-500 font-body mt-1">
                Password resets are handled by the Admin. Submit a request below and the Admin will generate a new password for you.
              </p>
            </div>

            {hasPending ? (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                <p className="text-sm text-amber-400 font-body"> You have a pending reset request. Please wait for Admin to action it.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="label">Reason for Reset *</label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="e.g. Forgot my password, account access issue…"
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                  />
                </div>
                <button onClick={submitResetRequest} disabled={requestingReset} className="btn-primary">
                  {requestingReset ? "Submitting…" : "Request Password Reset"}
                </button>
              </div>
            )}
          </div>

          {/* Reset request history */}
          {resetRequests.length > 0 && (
            <div className="card p-5 space-y-3">
              <h3 className="section-title">Reset Request History</h3>
              <div className="space-y-2">
                {resetRequests.map((req) => (
                  <div key={req._id} className="bg-bg-elevated rounded-lg border border-bg-border p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`badge border text-xs ${
                        req.status === "Pending"  ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                        req.status === "Approved" ? "bg-green-500/10 text-green-400 border-green-500/30" :
                        "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>{req.status}</span>
                      <span className="text-xs text-slate-500 font-body">{formatDateTime(req.createdAt)}</span>
                    </div>
                    <p className="text-slate-400 font-body">{req.reason}</p>
                    {req.adminComment && (
                      <p className="text-xs text-slate-500 mt-1 font-body">Admin: {req.adminComment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizerProfile;
