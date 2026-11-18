import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { getErrorMsg } from "../../utils/helpers";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";

const INTERESTS = ["Technical", "Cultural", "Sports", "Music", "Art", "Gaming", "Finance", "Research"];

const Profile = () => {
  const { user: authUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("profile");
  const [editForm, setEditForm] = useState({});
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/participant/profile"),
      api.get("/participant/clubs"),
    ]).then(([pRes, cRes]) => {
      setProfile(pRes.data.user);
      setEditForm({
        firstName:     pRes.data.user.firstName,
        lastName:      pRes.data.user.lastName,
        contactNumber: pRes.data.user.contactNumber || "",
        collegeName:   pRes.data.user.collegeName || "",
      });
      setClubs(cRes.data.organizers || []);
    }).catch(() => toast.error("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await api.put("/participant/profile", editForm);
      setProfile((p) => ({ ...p, ...editForm }));
      updateUser({ firstName: editForm.firstName });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const handleInterestToggle = async (interest) => {
    const curr = profile.areasOfInterest || [];
    const next = curr.includes(interest) ? curr.filter((x) => x !== interest) : [...curr, interest];
    try {
      await api.put("/participant/preferences", { areasOfInterest: next });
      setProfile((p) => ({ ...p, areasOfInterest: next }));
      toast.success("Interests updated.");
    } catch (err) {
      toast.error(getErrorMsg(err));
    }
  };

  const handleUnfollow = async (orgId, orgName) => {
    try {
      await api.delete(`/participant/follow/${orgId}`);
      setProfile((p) => ({
        ...p,
        followedOrganizers: p.followedOrganizers.filter((o) => o._id !== orgId),
      }));
      toast.success(`Unfollowed ${orgName}.`);
    } catch (err) {
      toast.error(getErrorMsg(err));
    }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirm)
      return toast.error("New passwords don't match.");
    if (pwForm.newPassword.length < 6)
      return toast.error("New password must be at least 6 characters.");
    setSaving(true);
    try {
      await api.put("/participant/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      toast.success("Password changed.");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1 font-body">{profile.email} · <span className="capitalize">{profile.participantType}</span></p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-bg-border gap-1">
        {[
          { key: "profile",  label: "Profile" },
          { key: "interests",label: "Interests" },
          { key: "following",label: "Following" },
          { key: "security", label: "Security" },
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
        <div className="card p-6 space-y-5 animate-fade-in">
          <h2 className="section-title">Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input className="input" value={editForm.firstName || ""} onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" value={editForm.lastName || ""} onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Email <span className="text-slate-600 text-xs">(non-editable)</span></label>
            <input className="input opacity-60 cursor-not-allowed" value={profile.email} disabled />
            {profile.participantType === "iiit" && (
              <p className="text-xs text-slate-500 font-body mt-1">
                IIIT accounts use @iiit.ac.in, @students.iiit.ac.in, or @research.iiit.ac.in.
              </p>
            )}
          </div>
          <div>
            <label className="label">Participant Type <span className="text-slate-600 text-xs">(non-editable)</span></label>
            <input className="input opacity-60 cursor-not-allowed capitalize" value={profile.participantType} disabled />
          </div>
          <div>
            <label className="label">College / Organization</label>
            <input className="input" value={editForm.collegeName || ""} onChange={(e) => setEditForm((p) => ({ ...p, collegeName: e.target.value }))} />
          </div>
          <div>
            <label className="label">Contact Number</label>
            <input className="input" value={editForm.contactNumber || ""} onChange={(e) => setEditForm((p) => ({ ...p, contactNumber: e.target.value }))} />
          </div>
          <button onClick={handleProfileSave} disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}

      {tab === "interests" && (
        <div className="card p-6 space-y-4 animate-fade-in">
          <div>
            <h2 className="section-title">Areas of Interest</h2>
            <p className="text-sm text-slate-500 font-body mt-1">Affects event ordering and recommendations.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => {
              const active = profile.areasOfInterest?.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => handleInterestToggle(i)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium font-body border transition-all ${
                    active
                      ? "bg-amber-500/20 border-amber-500 text-amber-400"
                      : "bg-bg-elevated border-bg-border text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {i}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === "following" && (
        <div className="card p-6 space-y-4 animate-fade-in">
          <h2 className="section-title">Clubs You Follow</h2>
          {profile.followedOrganizers?.length === 0 ? (
            <p className="text-slate-500 text-sm font-body">You're not following any clubs yet.</p>
          ) : (
            <div className="space-y-2">
              {profile.followedOrganizers.map((org) => (
                <div key={org._id} className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg border border-bg-border">
                  <div className="w-8 h-8 rounded-full bg-bg-border flex items-center justify-center text-sm font-display font-bold text-amber-500">
                    {org.organizerName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200 font-body">{org.organizerName}</p>
                    <p className="text-xs text-slate-500 font-body">{org.category}</p>
                  </div>
                  <button
                    onClick={() => handleUnfollow(org._id, org.organizerName)}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors font-body"
                  >
                    Unfollow
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "security" && (
        <div className="card p-6 space-y-5 animate-fade-in">
          <h2 className="section-title">Change Password</h2>
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={pwForm.currentPassword} onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))} />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={pwForm.newPassword} onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} />
          </div>
          <button onClick={handlePasswordChange} disabled={saving} className="btn-primary">
            {saving ? "Changing…" : "Change Password"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
