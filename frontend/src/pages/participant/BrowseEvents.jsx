import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import EventCard from "../../components/EventCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getErrorMsg } from "../../utils/helpers";
import toast from "react-hot-toast";

const BrowseEvents = () => {
  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "", type: "", eligibility: "", startDate: "", endDate: "", filter: "",
  });

  const setF = (k) => (e) => setFilters((p) => ({ ...p, [k]: e.target.value }));

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "")
      );
      const [evRes, trRes] = await Promise.all([
        api.get("/events", { params }),
        api.get("/events/trending"),
      ]);
      setEvents(evRes.data.events || []);
      setTrending(trRes.data.trending || []);
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeout = setTimeout(fetchEvents, filters.search ? 400 : 0);
    return () => clearTimeout(timeout);
  }, [filters]);

  const clearFilters = () =>
    setFilters({ search: "", type: "", eligibility: "", startDate: "", endDate: "", filter: "" });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Browse Events</h1>
          <p className="text-slate-500 text-sm mt-1 font-body">{events.length} events found</p>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="card p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            className="input pl-9"
            placeholder="Search events, organizers, tags…"
            value={filters.search}
            onChange={setF("search")}
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto py-2 text-sm" value={filters.type} onChange={setF("type")}>
            <option value="">All Types</option>
            <option value="normal">Normal</option>
            <option value="merchandise">Merchandise</option>
          </select>

          <select className="input w-auto py-2 text-sm" value={filters.eligibility} onChange={setF("eligibility")}>
            <option value="">All Eligibility</option>
            <option value="iiit">IIIT Only</option>
            <option value="non-iiit">Non-IIIT</option>
            <option value="all">Open to All</option>
          </select>

          <select className="input w-auto py-2 text-sm" value={filters.filter} onChange={setF("filter")}>
            <option value="">All Events</option>
            <option value="followed">Followed Clubs</option>
          </select>

          <div className="flex items-center gap-2">
            <input type="date" className="input w-auto py-2 text-sm" value={filters.startDate} onChange={setF("startDate")} placeholder="From" />
            <span className="text-slate-500 text-sm">–</span>
            <input type="date" className="input w-auto py-2 text-sm" value={filters.endDate} onChange={setF("endDate")} placeholder="To" />
          </div>

          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="btn-secondary py-2 text-sm">
              Clear ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Trending section */}
      {trending.length > 0 && !filters.search && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-500">🔥</span>
            <h2 className="section-title">Trending (last 24h)</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {trending.map((ev) => (
              <div key={ev._id} className="flex-shrink-0 w-64">
                <EventCard event={ev} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Events grid */}
      <div className="space-y-3">
        {filters.search || activeFilterCount > 0 ? (
          <h2 className="section-title">Search Results</h2>
        ) : (
          <h2 className="section-title">All Upcoming Events</h2>
        )}

        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : events.length === 0 ? (
          <div className="text-center py-16 space-y-3 card">
            <p className="text-4xl">🔍</p>
            <p className="text-slate-400 font-body">No events match your filters.</p>
            <button onClick={clearFilters} className="btn-secondary text-sm">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev) => (
              <EventCard key={ev._id} event={ev} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseEvents;
