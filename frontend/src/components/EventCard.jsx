import { Link } from "react-router-dom";
import { statusColor, formatDate, formatCurrency, eventTypeLabel, eligibilityLabel, truncate } from "../utils/helpers";

const EventCard = ({ event, linkBase = "/events" }) => {
  const status = event.effectiveStatus || event.statusOverride;
  const org = event.organizerId;

  return (
    <Link
      to={`${linkBase}/${event._id || event.id}`}
      className="card p-5 flex flex-col gap-3 hover:border-amber-500/40 hover:shadow-glow transition-all duration-200 group animate-fade-in"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-slate-100 group-hover:text-amber-400 transition-colors truncate">
            {event.name}
          </h3>
          {org && (
            <p className="text-xs text-slate-500 mt-0.5 font-body truncate">
              {org.organizerName}
              {org.category && ` · ${org.category}`}
            </p>
          )}
        </div>
        <span className={`badge border flex-shrink-0 ${statusColor(status)}`}>
          {status}
        </span>
      </div>

      {/* Description */}
      {event.description && (
        <p className="text-sm text-slate-400 leading-relaxed font-body line-clamp-2">
          {truncate(event.description, 100)}
        </p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-2 mt-auto">
        <span className="badge bg-bg-elevated text-slate-400 border border-bg-border">
          {eventTypeLabel(event.type)}
        </span>
        <span className="badge bg-bg-elevated text-slate-400 border border-bg-border">
          {eligibilityLabel(event.eligibility)}
        </span>
        <span className="badge bg-bg-elevated text-slate-400 border border-bg-border">
          {formatCurrency(event.registrationFee)}
        </span>
      </div>

      {/* Date */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-body pt-1 border-t border-bg-border">
        <span>📅 {formatDate(event.startDate)}</span>
        {event.registrationDeadline && (
          <span>Deadline: {formatDate(event.registrationDeadline)}</span>
        )}
      </div>

      {/* Tags */}
      {event.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {event.tags.slice(0, 4).map((tag, i) => (
            <span key={i} className="text-xs bg-amber-500/10 text-amber-500/80 px-2 py-0.5 rounded-full font-body">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
};

export default EventCard;
