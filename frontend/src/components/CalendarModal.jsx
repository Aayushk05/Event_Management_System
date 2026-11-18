import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { getErrorMsg } from "../utils/helpers";

const CalendarModal = ({ eventId, eventName, onClose }) => {
  const [links, setLinks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/events/${eventId}/calendar-links`)
      .then((r) => setLinks(r.data))
      .catch((e) => toast.error(getErrorMsg(e)))
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-sm p-6 space-y-5 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Add to Calendar</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-slate-400 font-body">{eventName}</p>

        {loading && (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-bg-border border-t-amber-500" />
          </div>
        )}

        {links && (
          <div className="space-y-3">
            <a
              href={links.googleCalendar}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg border border-bg-border hover:border-amber-500/40 transition-all group"
            >
              <span className="text-xl">📅</span>
              <span className="text-sm font-medium text-slate-300 group-hover:text-amber-400 transition-colors font-body">
                Add to Google Calendar
              </span>
              <svg className="w-4 h-4 text-slate-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <a
              href={links.outlookLive}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg border border-bg-border hover:border-cyan-500/40 transition-all group"
            >
              <span className="text-xl">📧</span>
              <span className="text-sm font-medium text-slate-300 group-hover:text-cyan-400 transition-colors font-body">
                Add to Outlook Calendar
              </span>
              <svg className="w-4 h-4 text-slate-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <a
              href={`/api${links.icsDownload}`}
              download
              className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg border border-bg-border hover:border-green-500/40 transition-all group"
            >
              <span className="text-xl">⬇️</span>
              <span className="text-sm font-medium text-slate-300 group-hover:text-green-400 transition-colors font-body">
                Download .ics File
              </span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarModal;
