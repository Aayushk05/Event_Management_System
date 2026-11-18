import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import EventCard from "../../components/EventCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import toast from "react-hot-toast";
import { getErrorMsg } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";

const ClubDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    api.get(`/participant/clubs/${id}`)
      .then((r) => setData(r.data))
      .catch(() => toast.error("Club not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleFollow = async () => {
    if (!data || user?.role !== "participant") return;
    setToggling(true);
    try {
      if (data.isFollowing) {
        await api.delete(`/participant/follow/${id}`);
        toast.success(`Unfollowed ${data.organizer.organizerName}`);
      } else {
        await api.post(`/participant/follow/${id}`);
        toast.success(`Now following ${data.organizer.organizerName}!`);
      }
      setData((p) => ({ ...p, isFollowing: !p.isFollowing }));
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!data) return <div className="text-center py-20 text-slate-400 font-body">Club not found.</div>;

  const { organizer, isFollowing, events } = data;
  const eventsToShow = tab === "upcoming" ? events.upcoming : events.past;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors font-body">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Clubs
      </button>

      {/* Organizer card */}
      <div className="card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-bg-border flex items-center justify-center text-2xl font-display font-bold text-amber-500">
              {organizer.organizerName[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-slate-100">{organizer.organizerName}</h1>
              <p className="text-sm text-slate-500 font-body">{organizer.category}</p>
            </div>
          </div>

          {user?.role === "participant" && (
            <button
              onClick={toggleFollow}
              disabled={toggling}
              className={`btn-secondary text-sm py-2 ${
                isFollowing ? "border-cyan-500/50 text-cyan-400" : ""
              }`}
            >
              {toggling ? "…" : isFollowing ? "Following" : "+ Follow"}
            </button>
          )}
        </div>

        <p className="text-slate-300 font-body">{organizer.description}</p>

        <div className="flex flex-wrap gap-4 pt-2 border-t border-bg-border text-sm text-slate-400 font-body">
          {organizer.contactEmail && (
            <span>📧 <a href={`mailto:${organizer.contactEmail}`} className="hover:text-amber-400 transition-colors">{organizer.contactEmail}</a></span>
          )}
          {organizer.contactNumber && <span>📞 {organizer.contactNumber}</span>}
        </div>
      </div>

      {/* Events */}
      <div className="space-y-4">
        <div className="flex items-center gap-1 border-b border-bg-border">
          {[
            { key: "upcoming", label: `Upcoming (${events.upcoming?.length || 0})` },
            { key: "past",     label: `Past (${events.past?.length || 0})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium font-body border-b-2 transition-all ${
                tab === key
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {eventsToShow?.length === 0 ? (
          <div className="text-center py-10 text-slate-500 font-body">No {tab} events.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventsToShow.map((ev) => (
              <EventCard key={ev._id} event={ev} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubDetail;
