import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { formatDate, formatDateTime, paymentStatusColor } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const TABS = ["upcoming", "normal", "merchandise", "completed", "cancelledRejected"];
const TAB_LABELS = {
  upcoming:           "Upcoming",
  normal:             "Normal",
  merchandise:        "Merchandise",
  completed:          "Completed",
  cancelledRejected:  "Cancelled / Rejected",
};

const RegistrationRow = ({ rec }) => (
  <div className="flex items-center gap-4 p-4 bg-bg-elevated rounded-lg border border-bg-border hover:border-amber-500/20 transition-all animate-fade-in">
    <div className="flex-1 min-w-0">
      <Link
        to={`/events/${rec.eventId || "#"}`}
        className="font-medium text-slate-100 hover:text-amber-400 transition-colors truncate block font-body"
      >
        {rec.eventName}
      </Link>
      <p className="text-xs text-slate-500 mt-0.5 font-body">
        {rec.organizerName} · {rec.eventType === "merchandise" ? "🛍️ Merchandise" : "🎯 Normal"}
      </p>
      <p className="text-xs text-slate-500 font-body">
        {formatDate(rec.schedule?.start)}
        {rec.schedule?.end && ` – ${formatDate(rec.schedule.end)}`}
      </p>
    </div>
    <div className="flex flex-col items-end gap-1">
      <span className={`badge border ${paymentStatusColor(rec.paymentStatus)}`}>
        {rec.participationStatus}
      </span>
      {rec.ticketId && (
        <span className="text-xs text-slate-500 font-mono cursor-pointer hover:text-slate-300 transition-colors font-body" title={rec.ticketId}>
          🎟 {rec.ticketId.slice(0, 14)}…
        </span>
      )}
    </div>
  </div>
);

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    api.get("/users/me/events")
      .then((r) => setData(r.data.dashboard))
      .catch(() => toast.error("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const records = data
    ? activeTab === "upcoming"
      ? data.upcoming
      : data.history?.[activeTab] || []
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">
          Welcome back, <span className="text-amber-500">{user?.firstName}</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-body">Your events and participation history.</p>
      </div>

      {/* Quick stats */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Upcoming",    value: data.upcoming?.length || 0,             color: "text-amber-400" },
            { label: "Normal",      value: data.history?.normal?.length || 0,      color: "text-cyan-400" },
            { label: "Merch Orders",value: data.history?.merchandise?.length || 0, color: "text-purple-400" },
            { label: "Completed",   value: data.history?.completed?.length || 0,   color: "text-green-400" },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 font-body">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex overflow-x-auto border-b border-bg-border">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium font-body transition-all border-b-2 ${
                activeTab === tab
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {TAB_LABELS[tab]}
              {data && (
                <span className="ml-1.5 text-xs">
                  ({activeTab === "upcoming" && tab === "upcoming"
                    ? data.upcoming?.length
                    : data.history?.[tab]?.length || 0})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {loading ? (
            <LoadingSpinner className="py-10" />
          ) : records.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-3xl">🎫</p>
              <p className="text-slate-400 font-body">No events here yet.</p>
              <Link to="/events" className="text-amber-400 text-sm hover:underline font-body">
                Browse upcoming events →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((rec) => (
                <RegistrationRow key={rec.registrationId} rec={rec} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantDashboard;
