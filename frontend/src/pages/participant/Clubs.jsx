import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import toast from "react-hot-toast";
import { getErrorMsg } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";

const Clubs = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    api.get("/participant/clubs")
      .then((r) => setClubs(r.data.organizers || []))
      .catch(() => toast.error("Failed to load clubs."))
      .finally(() => setLoading(false));
  }, []);

  const toggleFollow = async (club) => {
    if (user?.role !== "participant") return;
    setToggling(club._id);
    try {
      if (club.isFollowing) {
        await api.delete(`/participant/follow/${club._id}`);
        toast.success(`Unfollowed ${club.organizerName}`);
      } else {
        await api.post(`/participant/follow/${club._id}`);
        toast.success(`Now following ${club.organizerName}!`);
      }
      setClubs((p) =>
        p.map((c) => c._id === club._id ? { ...c, isFollowing: !c.isFollowing } : c)
      );
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setToggling(null);
    }
  };

  const filtered = clubs.filter(
    (c) =>
      c.organizerName.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Clubs & Organizers</h1>
        <p className="text-slate-500 text-sm mt-1 font-body">{clubs.length} clubs registered on Felicity</p>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          className="input pl-9"
          placeholder="Search clubs or categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingSpinner className="py-16" />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-slate-400 font-body">No clubs found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((club) => (
            <div key={club._id} className="card p-5 space-y-3 hover:border-amber-500/30 transition-all group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-bg-border flex items-center justify-center text-lg font-display font-bold text-amber-500 flex-shrink-0">
                    {club.organizerName[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-slate-100 truncate group-hover:text-amber-400 transition-colors">
                      {club.organizerName}
                    </h3>
                    <p className="text-xs text-slate-500 font-body">{club.category}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-400 font-body line-clamp-2">
                {club.description || "No description provided."}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <Link
                  to={`/clubs/${club._id}`}
                  className="btn-secondary text-xs py-1.5 px-3 flex-1 text-center"
                >
                  View Events
                </Link>
                {user?.role === "participant" && (
                  <button
                    onClick={() => toggleFollow(club)}
                    disabled={toggling === club._id}
                    className={`text-xs py-1.5 px-3 rounded-lg border font-medium font-body transition-all flex-1 ${
                      club.isFollowing
                        ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                        : "border-bg-border bg-bg-elevated text-slate-400 hover:border-amber-500/50 hover:text-amber-400"
                    }`}
                  >
                    {toggling === club._id ? "…" : club.isFollowing ? "Following" : "+ Follow"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clubs;
