import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import toast from "react-hot-toast";
import { formatDate, formatCurrency, statusColor, eventTypeLabel, getErrorMsg } from "../../utils/helpers";

const StatCard = ({ label, value, color = "text-amber-400" }) => (
  <div className="card p-4 text-center">
    <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
    <p className="text-xs text-slate-500 mt-0.5 font-body">{label}</p>
  </div>
);

const OrganizerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/organiser/dashboard")
      .then((r) => setData(r.data))
      .catch(() => toast.error("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!data) return null;

  const { organizer, eventsSummary, aggregateAnalytics, events } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            <span className="text-amber-500">{organizer.organizerName}</span> Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-body">{organizer.category} · {organizer.contactEmail}</p>
        </div>
        <Link to="/organizer/events/create" className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Event
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Events"    value={eventsSummary.total}                    color="text-slate-200" />
        <StatCard label="Draft"           value={eventsSummary.draft}                    color="text-slate-400" />
        <StatCard label="Published"       value={eventsSummary.published}                color="text-cyan-400" />
        <StatCard label="Ongoing"         value={eventsSummary.ongoing}                  color="text-green-400" />
        <StatCard label="Completed"       value={eventsSummary.completed}                color="text-amber-400" />
        <StatCard label="Revenue"         value={formatCurrency(aggregateAnalytics.totalRevenue)} color="text-amber-400" />
      </div>

      {/* Aggregate Analytics for Completed Events */}
      {eventsSummary.completed > 0 && (
        <div className="card p-5 space-y-3">
          <h2 className="section-title">📊 Completed Events Analytics</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 font-body">Total Registrations</p>
              <p className="text-xl font-display font-bold text-slate-100">{aggregateAnalytics.totalRegistrations}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-body">Total Attendance</p>
              <p className="text-xl font-display font-bold text-green-400">{aggregateAnalytics.totalAttendance}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-body">Total Revenue</p>
              <p className="text-xl font-display font-bold text-amber-400">{formatCurrency(aggregateAnalytics.totalRevenue)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Your Events</h2>
          <Link to="/organizer/events/create" className="text-sm text-amber-400 hover:underline font-body">
            + Create new
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-slate-400 font-body">No events yet.</p>
            <Link to="/organizer/events/create" className="btn-primary mt-4 inline-block">
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev) => (
              <Link
                key={ev.id}
                to={`/organizer/events/${ev.id}`}
                className="card p-4 hover:border-amber-500/40 transition-all group space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold text-slate-100 group-hover:text-amber-400 transition-colors truncate flex-1">
                    {ev.name}
                  </h3>
                  <span className={`badge border flex-shrink-0 ${statusColor(ev.statusOverride)}`}>
                    {ev.statusOverride}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-body">
                  <span>{eventTypeLabel(ev.type)}</span>
                  <span>·</span>
                  <span>📅 {formatDate(ev.startDate)}</span>
                </div>
                <div className="text-xs text-amber-500/60 font-body">
                  View details & analytics →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;
