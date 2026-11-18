import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useForumSocket } from "../../hooks/useSocket";
import LoadingSpinner from "../../components/LoadingSpinner";
import CalendarModal from "../../components/CalendarModal";
import {
  formatDate, formatDateTime, formatCurrency, statusColor, paymentStatusColor,
  eligibilityLabel, eventTypeLabel, isDeadlinePassed, getErrorMsg, truncate,
} from "../../utils/helpers";

const Forum = ({ eventId, isOrganizer }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const { emitTyping, emitStopTyping } = useForumSocket(eventId, {
    onMessage: (msg) => setMessages((p) => [...p, msg]),
    onAnnouncement: (msg) => setMessages((p) => [...p, msg]),
    onDelete: ({ messageId }) =>
      setMessages((p) =>
        p.map((m) => m._id === messageId ? { ...m, isDeleted: true, content: "[Message deleted]" } : m)
      ),
    onPin: ({ messageId, isPinned }) =>
      setMessages((p) => p.map((m) => m._id === messageId ? { ...m, isPinned } : m)),
    onReaction: ({ messageId, reactions }) =>
      setMessages((p) => p.map((m) => m._id === messageId ? { ...m, reactions } : m)),
    onTyping: ({ userId }) => {
      setTypingUsers((p) => [...new Set([...p, userId])]);
      setTimeout(() => setTypingUsers((p) => p.filter((id) => id !== userId)), 3000);
    },
    onStopTyping: ({ userId }) =>
      setTypingUsers((p) => p.filter((id) => id !== userId)),
  });

  useEffect(() => {
    api.get(`/events/${eventId}/forum`)
      .then((r) => setMessages(r.data.messages || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = () => {
    emitTyping();
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(emitStopTyping, 2000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      await api.post(`/events/${eventId}/forum`, {
        content,
        parentId: replyTo?._id || null,
        isAnnouncement: false,
      });
      setContent("");
      setReplyTo(null);
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setSending(false);
    }
  };

  const deleteMsg = async (msgId) => {
    try {
      await api.delete(`/events/${eventId}/forum/${msgId}`);
    } catch (err) {
      toast.error(getErrorMsg(err));
    }
  };

  const pinMsg = async (msgId) => {
    try {
      await api.put(`/events/${eventId}/forum/${msgId}/pin`);
    } catch (err) {
      toast.error(getErrorMsg(err));
    }
  };

  const reactMsg = async (msgId, emoji) => {
    try {
      await api.post(`/events/${eventId}/forum/${msgId}/react`, { emoji });
    } catch {}
  };

  return (
    <div className="space-y-4">
      <h3 className="section-title flex items-center gap-2">
        Discussion Forum
        {messages.length > 0 && (
          <span className="text-xs text-slate-500 font-body font-normal">({messages.length} messages)</span>
        )}
      </h3>

      <div className="card overflow-hidden">
        {/* Messages */}
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {loading && <LoadingSpinner />}
          {!loading && messages.length === 0 && (
            <p className="text-center text-slate-500 py-6 font-body text-sm">No messages yet. Be the first to say something!</p>
          )}
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex gap-3 animate-fade-in ${
                msg.isAnnouncement ? "bg-amber-500/5 border border-amber-500/20 rounded-lg p-3" : ""
              } ${msg.isPinned ? "border border-cyan-500/30 bg-cyan-500/5 rounded-lg p-3" : ""}`}
            >
              <div className="w-8 h-8 rounded-full bg-bg-border flex items-center justify-center text-xs font-display font-bold text-amber-500 flex-shrink-0">
                {msg.authorId?.firstName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-slate-200 font-body">
                    {msg.authorId?.firstName} {msg.authorId?.lastName}
                  </span>
                  {msg.authorId?.role === "organizer" && (
                    <span className="badge bg-amber-500/20 text-amber-400 text-xs">Organizer</span>
                  )}
                  {msg.isAnnouncement && <span className="badge bg-amber-500/20 text-amber-400 text-xs">📢 Announcement</span>}
                  {msg.isPinned && <span className="badge bg-cyan-500/20 text-cyan-400 text-xs">Pinned</span>}
                  <span className="text-xs text-slate-600 ml-auto font-body">
                    {formatDateTime(msg.createdAt)}
                  </span>
                </div>
                <p className={`text-sm font-body leading-relaxed ${msg.isDeleted ? "text-slate-600 italic" : "text-slate-300"}`}>
                  {msg.content}
                </p>

                {/* Reactions */}
                {msg.reactions?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(
                      msg.reactions.reduce((acc, r) => {
                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([emoji, count]) => (
                      <button
                        key={emoji}
                        onClick={() => reactMsg(msg._id, emoji)}
                        className="text-xs bg-bg-border hover:bg-bg-elevated px-2 py-0.5 rounded-full border border-bg-border transition-all font-body"
                      >
                        {emoji} {count}
                      </button>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {!msg.isDeleted && (
                  <div className="flex items-center gap-3 mt-1">
                    {["👍", "❤️", "😂", ""].map((em) => (
                      <button key={em} onClick={() => reactMsg(msg._id, em)} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                        {em}
                      </button>
                    ))}
                    <button
                      onClick={() => setReplyTo(msg)}
                      className="text-xs text-slate-600 hover:text-cyan-400 transition-colors font-body"
                    >
                      Reply
                    </button>
                    {isOrganizer && (
                      <>
                        <button onClick={() => pinMsg(msg._id)} className="text-xs text-slate-600 hover:text-cyan-400 transition-colors font-body">
                          {msg.isPinned ? "Unpin" : "Pin"}
                        </button>
                        <button onClick={() => deleteMsg(msg._id)} className="text-xs text-slate-600 hover:text-red-400 transition-colors font-body">
                          Delete
                        </button>
                      </>
                    )}
                    {msg.authorId?._id === user?.id && !isOrganizer && (
                      <button onClick={() => deleteMsg(msg._id)} className="text-xs text-slate-600 hover:text-red-400 transition-colors font-body">
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {typingUsers.length > 0 && (
            <p className="text-xs text-slate-500 italic font-body animate-pulse">Someone is typing…</p>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply indicator */}
        {replyTo && (
          <div className="px-4 py-2 bg-bg-elevated border-t border-bg-border flex items-center justify-between">
            <p className="text-xs text-slate-400 font-body">
              Replying to <span className="text-amber-400">{replyTo.authorId?.firstName}</span>: {truncate(replyTo.content, 60)}
            </p>
            <button onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-slate-300 ml-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-bg-border flex gap-2">
          <input
            className="input flex-1"
            placeholder="Write a message…"
            value={content}
            onChange={(e) => { setContent(e.target.value); handleTyping(); }}
          />
          <button type="submit" disabled={sending || !content.trim()} className="btn-primary px-4">
            {sending ? "…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [myOrder, setMyOrder] = useState(null);
  const [proofUrl, setProofUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then((r) => {
        setEvent(r.data.event);
        setIsRegistered(r.data.isRegistered);
      })
      .catch(() => toast.error("Event not found."))
      .finally(() => setLoading(false));
  }, [id]);

  // Check for existing order (for merchandise)
  useEffect(() => {
    if (event?.type === "merchandise" && user?.role === "participant") {
      api.get("/users/me/events").then((r) => {
        const allRegs = [
          ...r.data.dashboard.history.merchandise,
          ...r.data.dashboard.history.cancelledRejected,
        ];
        const found = allRegs.find((x) => x.eventId === id || x.eventName === event.name);
        if (found) setMyOrder(found);
      }).catch(() => {});
    }
  }, [event, id]);

  const handleNormalRegister = async () => {
    // Validate required custom form fields before submitting
    const missingFields = (event.customForm || [])
      .filter((field) => {
        if (!field.isRequired) return false;
        const val = formData[field.label];
        if (Array.isArray(val)) return val.length === 0;
        return !val || val.toString().trim() === "";
      })
      .map((f) => f.label);

    if (missingFields.length > 0) {
      toast.error(`Please fill required fields: ${missingFields.join(", ")}`);
      return;
    }

    setRegistering(true);
    try {
      const { data } = await api.post(`/events/${id}/register`, { formData });
      toast.success(`Registered. Ticket: ${data.ticketId}`);
      setIsRegistered(true);
      setShowForm(false);
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setRegistering(false);
    }
  };

  const handleMerchOrder = async (variantId) => {
    setRegistering(true);
    try {
      const { data } = await api.post(`/events/${id}/order`, { variantId, quantity: 1 });
      toast.success(data.message);
      setIsRegistered(true);
      if (data.ticketId) {
        toast.success(`Ticket: ${data.ticketId}`);
      }
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setRegistering(false);
    }
  };

  const handleUploadProof = async () => {
    if (!proofUrl.trim()) return toast.error("Enter a URL for your payment proof.");
    setUploadingProof(true);
    try {
      await api.patch(`/events/${id}/orders/${myOrder?.registrationId}/proof`, { paymentProofUrl: proofUrl });
      toast.success("Payment proof submitted. Awaiting organizer approval.");
      setProofUrl("");
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setUploadingProof(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!event) return <div className="text-center py-20 text-slate-400 font-body">Event not found.</div>;

  const status = event.effectiveStatus;
  const deadline = event.registrationDeadline;
  const deadlinePassed = isDeadlinePassed(deadline);
  const canRegister =
    user?.role === "participant" &&
    !isRegistered &&
    ["Published", "Ongoing"].includes(status) &&
    !deadlinePassed;

  const isParticipantEligible =
    event.eligibility === "all" ||
    (event.eligibility === "iiit" && user?.participantType === "iiit") ||
    (event.eligibility === "non-iiit" && user?.participantType === "non-iiit");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors font-body">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Hero */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`badge border ${statusColor(status)}`}>{status}</span>
              <span className="badge bg-bg-elevated text-slate-400 border border-bg-border">{eventTypeLabel(event.type)}</span>
              <span className="badge bg-bg-elevated text-slate-400 border border-bg-border">{eligibilityLabel(event.eligibility)}</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-100">{event.name}</h1>
            <p className="text-sm text-slate-500 mt-1 font-body">
              by <span className="text-amber-400">{event.organizerId?.organizerName}</span>
              {event.organizerId?.category && ` · ${event.organizerId.category}`}
            </p>
          </div>

          <div className="flex gap-2">
            {isRegistered && (
              <button
                onClick={() => setShowCalendar(true)}
                className="btn-secondary text-sm py-2 flex items-center gap-1.5"
              >
                📅 Add to Calendar
              </button>
            )}
          </div>
        </div>

        <p className="text-slate-300 font-body leading-relaxed">{event.description}</p>

        {/* Tags */}
        {event.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.tags.map((tag, i) => (
              <span key={i} className="text-xs bg-amber-500/10 text-amber-500/80 px-2 py-0.5 rounded-full font-body">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-bg-border">
          {[
            { label: "Event Dates", value: `${formatDate(event.startDate)} – ${formatDate(event.endDate)}` },
            { label: "Reg. Deadline", value: formatDate(deadline), highlight: deadlinePassed && "text-red-400" },
            { label: "Registration Fee", value: formatCurrency(event.registrationFee) },
            { label: "Eligibility", value: eligibilityLabel(event.eligibility) },
            event.registrationLimit && { label: "Registration Limit", value: event.registrationLimit },
            { label: "Contact", value: event.organizerId?.contactEmail || "—" },
          ].filter(Boolean).map((item) => (
            <div key={item.label}>
              <p className="text-xs text-slate-500 mb-0.5 font-body">{item.label}</p>
              <p className={`text-sm font-medium font-body ${item.highlight || "text-slate-200"}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Registration / Order Section */}
      {user?.role === "participant" && (
        <div className="card p-6">
          {isRegistered ? (
            <div className="text-center space-y-3 py-4">
              <p className="text-2xl"></p>
              <p className="font-display font-semibold text-green-400">You're registered!</p>
              <p className="text-sm text-slate-500 font-body">Check your email for the ticket with QR code.</p>
              {myOrder?.paymentStatus === "Pending" && (
                <div className="max-w-sm mx-auto space-y-3 text-left bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-400 font-body">⚠️ Payment proof required</p>
                  <p className="text-xs text-slate-400 font-body">Upload your payment proof (image URL from Cloudinary/Drive) to complete your order.</p>
                  <input
                    className="input text-sm"
                    placeholder="https://... (image URL)"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                  />
                  <button onClick={handleUploadProof} disabled={uploadingProof} className="btn-primary w-full text-sm">
                    {uploadingProof ? "Uploading…" : "Submit Payment Proof"}
                  </button>
                </div>
              )}
            </div>
          ) : !canRegister ? (
            <div className="text-center py-4">
              <p className="text-slate-400 font-body text-sm">
                {deadlinePassed ? "Registration deadline has passed." :
                 !isParticipantEligible ? `This event is for ${eligibilityLabel(event.eligibility)} only.` :
                 status === "Draft" ? "This event is not yet published." :
                 status === "Closed" || status === "Completed" ? "This event is closed." :
                 "Registration not available."}
              </p>
            </div>
          ) : !isParticipantEligible ? (
            <div className="text-center py-4">
              <p className="text-slate-400 font-body text-sm">You are not eligible for this event.</p>
            </div>
          ) : event.type === "normal" ? (
            <div className="space-y-4">
              <h3 className="section-title">Register for this Event</h3>

              {/* Custom form fields */}
              {event.customForm?.length > 0 && (
                <div className="space-y-3">
                  {event.customForm.map((field) => (
                    <div key={field._id}>
                      <label className="label">
                        {field.label}
                        {field.isRequired && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      {field.fieldType === "text" && (
                        <input
                          className="input"
                          required={field.isRequired}
                          value={formData[field.label] || ""}
                          onChange={(e) => setFormData((p) => ({ ...p, [field.label]: e.target.value }))}
                        />
                      )}
                      {field.fieldType === "dropdown" && (
                        <select
                          className="input"
                          required={field.isRequired}
                          value={formData[field.label] || ""}
                          onChange={(e) => setFormData((p) => ({ ...p, [field.label]: e.target.value }))}
                        >
                          <option value="">Select…</option>
                          {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      )}
                      {field.fieldType === "checkbox" && (
                        <div className="space-y-1">
                          {field.options?.map((o) => (
                            <label key={o} className="flex items-center gap-2 text-sm text-slate-300 font-body">
                              <input
                                type="checkbox"
                                className="rounded border-bg-border bg-bg-elevated text-amber-500"
                                checked={(formData[field.label] || []).includes(o)}
                                onChange={(e) => {
                                  const curr = formData[field.label] || [];
                                  setFormData((p) => ({
                                    ...p,
                                    [field.label]: e.target.checked ? [...curr, o] : curr.filter((x) => x !== o),
                                  }));
                                }}
                              />
                              {o}
                            </label>
                          ))}
                        </div>
                      )}
                      {field.fieldType === "file" && (
                        <input
                          className="input"
                          placeholder="Paste file URL (Cloudinary / Google Drive)"
                          required={field.isRequired}
                          value={formData[field.label] || ""}
                          onChange={(e) => setFormData((p) => ({ ...p, [field.label]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button onClick={handleNormalRegister} disabled={registering} className="btn-primary w-full">
                {registering ? "Registering…" : event.registrationFee > 0 ? `Pay ${formatCurrency(event.registrationFee)} & Register` : "Register Now"}
              </button>
            </div>
          ) : (
            /* Merchandise order */
            <div className="space-y-4">
              <h3 className="section-title">Place an Order</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.merchandiseVariants?.map((v) => (
                  <div key={v._id} className="card p-4 space-y-2 border hover:border-amber-500/40 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-200 font-body">{v.size || "—"} / {v.color || "—"}</p>
                        <p className="text-sm text-amber-400 font-body">{formatCurrency(v.price)}</p>
                      </div>
                      <span className={`text-xs font-body ${v.stock > 0 ? "text-green-400" : "text-red-400"}`}>
                        {v.stock > 0 ? `${v.stock} left` : "Out of stock"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleMerchOrder(v._id)}
                      disabled={registering || v.stock === 0}
                      className="btn-primary w-full text-sm py-2"
                    >
                      {v.stock === 0 ? "Out of Stock" : registering ? "Placing…" : "Order Now"}
                    </button>
                  </div>
                ))}
              </div>
              {event.requiresPaymentApproval && (
                <div className="text-xs text-amber-500/80 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 font-body">
                  ⚠️ This event requires payment approval. After ordering, you'll need to upload your payment proof.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Discussion Forum */}
      <Forum eventId={id} isOrganizer={false} />

      {/* Calendar modal */}
      {showCalendar && (
        <CalendarModal eventId={id} eventName={event.name} onClose={() => setShowCalendar(false)} />
      )}
    </div>
  );
};

export default EventDetail;
