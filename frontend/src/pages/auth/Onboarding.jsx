import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { getErrorMsg } from "../../utils/helpers";

const INTERESTS = ["Technical", "Cultural", "Sports", "Music", "Art", "Gaming", "Finance", "Research"];

const Onboarding = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [interests, setInterests] = useState([]);
  const [followedOrgs, setFollowedOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    api.get("/participant/clubs").then((r) => setClubs(r.data.organizers || [])).catch(() => {});
  }, []);

  const toggleInterest = (i) =>
    setInterests((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i]);

  const toggleOrg = (id) =>
    setFollowedOrgs((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put("/participant/preferences", {
        areasOfInterest: interests,
        followedOrganizers: followedOrgs,
      });
      toast.success("Preferences saved");
      navigate("/dashboard");
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg-base">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg animate-slide-up relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-slate-100">
            Welcome to <span className="text-amber-500">Felicity</span> 
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-body">
            Let's personalize your experience. You can skip and do this later.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? "bg-amber-500" : "bg-bg-border"}`} />
          ))}
        </div>

        <div className="card p-6 space-y-5">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="section-title mb-1">Areas of Interest</h2>
                <p className="text-sm text-slate-500 font-body">Select topics you care about. Events are sorted by your interests.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleInterest(i)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium font-body border transition-all ${
                      interests.includes(i)
                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                        : "bg-bg-elevated border-bg-border text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => navigate("/dashboard")} className="btn-secondary flex-1">
                  Skip for now
                </button>
                <button onClick={() => setStep(2)} className="btn-primary flex-1">
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="section-title mb-1">Follow Clubs & Organizers</h2>
                <p className="text-sm text-slate-500 font-body">Get updates and see their events first.</p>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {clubs.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => toggleOrg(c._id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      followedOrgs.includes(c._id)
                        ? "border-cyan-500/50 bg-cyan-500/5"
                        : "border-bg-border bg-bg-elevated hover:border-slate-500"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-bg-border flex items-center justify-center text-sm font-display font-bold text-amber-500 flex-shrink-0">
                      {c.organizerName?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate font-body">{c.organizerName}</p>
                      <p className="text-xs text-slate-500 font-body">{c.category}</p>
                    </div>
                    {followedOrgs.includes(c._id) && (
                      <span className="text-cyan-400 text-xs font-body">Following</span>
                    )}
                  </button>
                ))}
                {clubs.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4 font-body">No clubs available yet.</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                  ← Back
                </button>
                <button onClick={handleSave} disabled={loading} className="btn-primary flex-1">
                  {loading ? "Saving…" : "Save & Continue"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
