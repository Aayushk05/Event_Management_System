import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useForumSocket } from "../../hooks/useSocket";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  formatDate, formatDateTime, formatCurrency, statusColor,
  paymentStatusColor, eventTypeLabel, eligibilityLabel, getErrorMsg, truncate,
} from "../../utils/helpers";

const QRScanner = ({ eventId, onScan }) => {
  const scannerRef = useRef(null);
  const [active, setActive] = useState(false);
  const [manualTicketId, setManualTicketId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const containerId = "qr-scanner-container";

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop();
          setActive(false);
          await handleScan(decodedText);
        },
        () => {}
      );
      setActive(true);
    } catch (err) {
      toast.error("Camera access denied or not available.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setActive(false);
  };

  useEffect(() => () => { stopScanner(); }, []);

  const handleScan = async (ticketId) => {
    if (!ticketId?.trim()) return;
    setScanning(true);
    setLastResult(null);
    try {
      const { data } = await api.post(`/events/${eventId}/scan`, { ticketId: ticketId.trim() });
      setLastResult({ ok: true, message: data.message, participant: data.participant, liveDashboard: data.liveDashboard });
      toast.success(data.message);
      onScan && onScan(data.liveDashboard);
    } catch (err) {
      const msg = getErrorMsg(err);
      setLastResult({ ok: false, message: msg });
      toast.error(msg);
    } finally {
      setScanning(false);
      setManualTicketId("");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const scanner = new Html5Qrcode("qr-file-scanner");
      const result = await scanner.scanFile(file, true);
      await handleScan(result);
    } catch {
      toast.error("Could not decode QR code from image.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Camera scanner */}
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-200 font-display">Camera Scan</h3>
          <div id={containerId} className="w-full rounded-lg overflow-hidden bg-bg-base min-h-[200px]" />
          <div className="flex gap-2">
            {!active ? (
              <button onClick={startScanner} className="btn-primary text-sm flex-1">Start Camera</button>
            ) : (
              <button onClick={stopScanner} className="btn-secondary text-sm flex-1">Stop Camera</button>
            )}
          </div>
        </div>

        {/* Manual / file */}
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-200 font-display">Manual Entry / File</h3>
          <div>
            <label className="label text-xs">Enter Ticket ID</label>
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm"
                placeholder="TKT-..."
                value={manualTicketId}
                onChange={(e) => setManualTicketId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan(manualTicketId)}
              />
              <button onClick={() => handleScan(manualTicketId)} disabled={scanning || !manualTicketId} className="btn-primary text-sm px-3">
                {scanning ? "…" : "Scan"}
              </button>
            </div>
          </div>

          <div>
            <label className="label text-xs">Upload QR Image</label>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="input text-sm cursor-pointer" />
            <div id="qr-file-scanner" className="hidden" />
          </div>

          {lastResult && (
            <div className={`p-3 rounded-lg border text-sm font-body ${
              lastResult.ok
                ? "bg-green-500/10 border-green-500/30 text-green-300"
                : "bg-red-500/10 border-red-500/20 text-red-300"
            }`}>
              <p className="font-medium">{lastResult.ok ? "" : ""} {lastResult.message}</p>
              {lastResult.ok && lastResult.participant && (
                <p className="text-xs mt-1 text-slate-400">
                  {lastResult.participant.firstName} {lastResult.participant.lastName} · {lastResult.participant.email}
                </p>
              )}
              {lastResult.liveDashboard && (
                <p className="text-xs mt-1 text-slate-400">
                  Scanned: {lastResult.liveDashboard.scanned} / {lastResult.liveDashboard.totalRegistrations}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OrganizerForum = ({ eventId }) => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const { emitTyping, emitStopTyping } = useForumSocket(eventId, {
    onMessage: (msg) => setMessages((p) => [...p, msg]),
    onAnnouncement: (msg) => setMessages((p) => [...p, msg]),
    onDelete: ({ messageId }) =>
      setMessages((p) => p.map((m) => m._id === messageId ? { ...m, isDeleted: true, content: "[Message deleted]" } : m)),
    onPin: ({ messageId, isPinned }) =>
      setMessages((p) => p.map((m) => m._id === messageId ? { ...m, isPinned } : m)),
    onReaction: ({ messageId, reactions }) =>
      setMessages((p) => p.map((m) => m._id === messageId ? { ...m, reactions } : m)),
  });

  useEffect(() => {
    api.get(`/events/${eventId}/forum`)
      .then((r) => setMessages(r.data.messages || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      await api.post(`/events/${eventId}/forum`, { content, isAnnouncement });
      setContent("");
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setSending(false);
    }
  };

  const deleteMsg = async (msgId) => {
    try { await api.delete(`/events/${eventId}/forum/${msgId}`); }
    catch (err) { toast.error(getErrorMsg(err)); }
  };

  const pinMsg = async (msgId) => {
    try { await api.put(`/events/${eventId}/forum/${msgId}/pin`); }
    catch (err) { toast.error(getErrorMsg(err)); }
  };

  return (
    <div className="space-y-3">
      <h3 className="section-title">Forum Moderation</h3>
      <div className="card overflow-hidden">
        <div className="p-4 max-h-80 overflow-y-auto space-y-2">
          {loading && <LoadingSpinner />}
          {!loading && messages.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-4 font-body">No messages yet.</p>
          )}
          {messages.map((msg) => (
            <div key={msg._id} className={`flex gap-2 text-sm animate-fade-in ${msg.isAnnouncement ? "bg-amber-500/5 border border-amber-500/20 rounded-lg p-2" : ""}`}>
              <div className="flex-1">
                <span className="font-medium text-slate-300 font-body mr-2">
                  {msg.authorId?.firstName} {msg.authorId?.lastName}
                  {msg.authorId?.role === "organizer" && <span className="ml-1 text-xs text-amber-400">(you)</span>}
                </span>
                <span className={msg.isDeleted ? "text-slate-600 italic font-body" : "text-slate-400 font-body"}>{msg.content}</span>
                {msg.isPinned && <span className="ml-2 text-xs text-cyan-400"></span>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => pinMsg(msg._id)} className="text-xs text-slate-600 hover:text-cyan-400 px-1 font-body">
                  {msg.isPinned ? "Unpin" : "Pin"}
                </button>
                {!msg.isDeleted && (
                  <button onClick={() => deleteMsg(msg._id)} className="text-xs text-slate-600 hover:text-red-400 px-1 font-body">
                    Del
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={sendMessage} className="p-3 border-t border-bg-border space-y-2">
          <div className="flex gap-2">
            <input
              className="input flex-1 text-sm"
              placeholder={isAnnouncement ? "Post an announcement…" : "Reply to participants…"}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button type="submit" disabled={sending || !content.trim()} className={isAnnouncement ? "btn-primary text-sm px-3" : "btn-secondary text-sm px-3"}>
              {sending ? "…" : isAnnouncement ? "📢 Post" : "Send"}
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer font-body">
            <input type="checkbox" className="rounded border-bg-border bg-bg-elevated text-amber-500" checked={isAnnouncement} onChange={(e) => setIsAnnouncement(e.target.checked)} />
            Post as announcement
          </label>
        </form>
      </div>
    </div>
  );
};

const OrganizerEventDetail = () => {
  const { id } = useParams();
  const [details, setDetails] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("");
  const [iiitFilter, setIiitFilter] = useState("");
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideAttended, setOverrideAttended] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchDetails = useCallback(() => {
    return api.get(`/events/${id}/organizer-details`).then((r) => setDetails(r.data));
  }, [id]);

  const fetchAttendance = useCallback(() => {
    return api.get(`/events/${id}/attendance`).then((r) => setAttendance(r.data));
  }, [id]);

  const fetchPendingOrders = useCallback(() => {
    return api.get(`/events/${id}/orders/pending`).then((r) => setPendingOrders(r.data.orders || []));
  }, [id]);

  useEffect(() => {
    Promise.all([fetchDetails(), fetchAttendance(), fetchPendingOrders()])
      .catch(() => toast.error("Failed to load event details."))
      .finally(() => setLoading(false));
  }, []);

  const exportParticipants = async () => {
    try {
      const res = await api.get(`/events/${id}/export-participants`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a"); a.href = url; a.download = "participants.csv"; a.click();
    } catch { toast.error("Export failed."); }
  };

  const exportAttendance = async () => {
    try {
      const res = await api.get(`/events/${id}/attendance/export`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a"); a.href = url; a.download = "attendance.csv"; a.click();
    } catch { toast.error("Export failed."); }
  };

  const approveOrder = async (regId) => {
    setProcessing(regId);
    try {
      await api.put(`/events/${id}/orders/${regId}/approve`);
      toast.success("Order approved. Ticket sent.");
      fetchPendingOrders();
      fetchDetails();
    } catch (err) { toast.error(getErrorMsg(err)); }
    finally { setProcessing(null); }
  };

  const rejectOrder = async (regId) => {
    setProcessing(regId);
    try {
      await api.put(`/events/${id}/orders/${regId}/reject`);
      toast.success("Order rejected.");
      fetchPendingOrders();
    } catch (err) { toast.error(getErrorMsg(err)); }
    finally { setProcessing(null); }
  };

  const submitOverride = async () => {
    if (!overrideReason.trim()) return toast.error("Reason is required.");
    try {
      await api.put(`/events/${id}/attendance/${overrideModal}/override`, {
        attended: overrideAttended,
        reason: overrideReason,
      });
      toast.success("Attendance overridden.");
      fetchAttendance();
      setOverrideModal(null);
      setOverrideReason("");
    } catch (err) { toast.error(getErrorMsg(err)); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!details) return null;

  const { overview, analytics, participants } = details;

  const filteredParticipants = participants.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchAttendance = !attendanceFilter || p.attendance === attendanceFilter;
    const matchIiit = !iiitFilter || p.participantType === iiitFilter;
    return matchSearch && matchAttendance && matchIiit;
  });

  const TABS = [
    { key: "overview",      label: "Overview" },
    { key: "participants",  label: `Participants (${participants.length})` },
    { key: "attendance",    label: `Attendance${attendance ? ` (${attendance.summary.present}/${attendance.summary.total})` : ""}` },
    { key: "qr",            label: "QR Scanner" },
    ...(pendingOrders.length > 0 ? [{ key: "orders", label: `Pending Orders (${pendingOrders.length})` }] : []),
    { key: "forum",         label: "Forum" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className={`badge border ${statusColor(overview.status)}`}>{overview.status}</span>
            <span className="badge bg-bg-elevated text-slate-400 border border-bg-border">{eventTypeLabel(overview.type)}</span>
          </div>
          <h1 className="page-title">{overview.name}</h1>
          <p className="text-slate-500 text-sm font-body">{formatDate(overview.dates.start)} – {formatDate(overview.dates.end)}</p>
        </div>
        <Link to={`/organizer/events/edit/${id}`} className="btn-secondary text-sm">
          Edit Event
        </Link>
      </div>

      {/* Analytics bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Registrations", value: analytics.totalRegistrations,   color: "text-cyan-400" },
          { label: "Attended",      value: analytics.attendanceCount,       color: "text-green-400" },
          { label: "Att. Rate",     value: analytics.attendanceRate,        color: "text-amber-400" },
          { label: "Revenue",       value: formatCurrency(analytics.revenue), color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-body">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto">
        <div className="flex border-b border-bg-border gap-1 min-w-max">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium font-body border-b-2 whitespace-nowrap transition-all ${
                tab === key ? "border-amber-500 text-amber-400" : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="card p-6 space-y-4 animate-fade-in">
          <h2 className="section-title">Event Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Status",      value: overview.status },
              { label: "Type",        value: eventTypeLabel(overview.type) },
              { label: "Eligibility", value: eligibilityLabel(overview.eligibility) },
              { label: "Start Date",  value: formatDate(overview.dates.start) },
              { label: "End Date",    value: formatDate(overview.dates.end) },
              { label: "Pricing",     value: formatCurrency(overview.pricing) },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-slate-500 font-body">{item.label}</p>
                <p className="text-sm font-medium text-slate-200 font-body">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participants tab */}
      {tab === "participants" && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input flex-1 min-w-48 text-sm"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="input w-auto text-sm py-2" value={attendanceFilter} onChange={(e) => setAttendanceFilter(e.target.value)}>
              <option value="">All Attendance</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
            <select className="input w-auto text-sm py-2" value={iiitFilter} onChange={(e) => setIiitFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="iiit">IIIT</option>
              <option value="non-iiit">Non-IIIT</option>
            </select>
            <button onClick={exportParticipants} className="btn-secondary text-sm py-2">
              ⬇ CSV
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-bg-border bg-bg-elevated">
                  <tr>
                    {["Name", "Email", "Type", "Reg Date", "Payment", "Attendance", "Ticket"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-medium font-body whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-border">
                  {filteredParticipants.map((p, i) => (
                    <tr key={i} className="hover:bg-bg-elevated transition-colors">
                      <td className="px-4 py-3 text-slate-200 font-body whitespace-nowrap">{p.name}</td>
                      <td className="px-4 py-3 text-slate-400 font-body">{p.email}</td>
                      <td className="px-4 py-3 text-slate-400 font-body capitalize">{p.participantType}</td>
                      <td className="px-4 py-3 text-slate-400 font-body whitespace-nowrap">{formatDate(p.registrationDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${paymentStatusColor(p.paymentStatus)}`}>{p.paymentStatus}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${p.attendance === "Present" ? "bg-green-500/10 text-green-400" : "bg-slate-700/50 text-slate-400"}`}>
                          {p.attendance}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.ticketId || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredParticipants.length === 0 && (
                <p className="text-center py-8 text-slate-500 font-body text-sm">No participants match filters.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance tab */}
      {tab === "attendance" && attendance && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-4 gap-3 flex-1">
              {[
                { label: "Total",   value: attendance.summary.total,   color: "text-slate-200" },
                { label: "Present", value: attendance.summary.present, color: "text-green-400" },
                { label: "Absent",  value: attendance.summary.absent,  color: "text-red-400" },
                { label: "Rate",    value: attendance.summary.rate,    color: "text-amber-400" },
              ].map((s) => (
                <div key={s.label} className="card p-3 text-center">
                  <p className={`text-xl font-display font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 font-body">{s.label}</p>
                </div>
              ))}
            </div>
            <button onClick={exportAttendance} className="btn-secondary text-sm ml-4">⬇ CSV</button>
          </div>

          {/* Scanned */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-bg-border flex items-center justify-between">
              <h3 className="text-sm font-medium text-green-400 font-body">Present ({attendance.scanned.length})</h3>
            </div>
            <div className="divide-y divide-bg-border max-h-64 overflow-y-auto">
              {attendance.scanned.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="text-slate-200 font-body">{s.participant.firstName} {s.participant.lastName}</p>
                    <p className="text-xs text-slate-500 font-body">{s.participant.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-body">{formatDateTime(s.attendanceTimestamp)}</p>
                    {s.manualOverride && <span className="text-xs text-amber-400/60 font-body">manual</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Not scanned */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-bg-border">
              <h3 className="text-sm font-medium text-slate-400 font-body"> Not Yet Scanned ({attendance.notScanned.length})</h3>
            </div>
            <div className="divide-y divide-bg-border max-h-64 overflow-y-auto">
              {attendance.notScanned.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="text-slate-200 font-body">{s.participant.firstName} {s.participant.lastName}</p>
                    <p className="text-xs text-slate-500 font-body">{s.participant.email}</p>
                  </div>
                  <button
                    onClick={() => setOverrideModal(s.participant._id + "_" + i)}
                    className="text-xs text-amber-400/60 hover:text-amber-400 font-body"
                  >
                    Override
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner tab */}
      {tab === "qr" && (
        <div className="animate-fade-in">
          <QRScanner eventId={id} onScan={(live) => {
            if (attendance) {
              setAttendance((p) => p ? { ...p, summary: { ...p.summary, present: live.scanned, absent: live.remaining } } : p);
            }
          }} />
        </div>
      )}

      {/* Pending orders tab */}
      {tab === "orders" && (
        <div className="space-y-3 animate-fade-in">
          <h2 className="section-title">Pending Payment Approvals</h2>
          {pendingOrders.length === 0 ? (
            <div className="card p-10 text-center text-slate-500 font-body">No pending orders.</div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <div key={order.registrationId} className="card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-200 font-body">
                        {order.participant.firstName} {order.participant.lastName}
                      </p>
                      <p className="text-sm text-slate-500 font-body">{order.participant.email}</p>
                      {order.variant && (
                        <p className="text-sm text-slate-400 font-body mt-1">
                          {order.variant.size} / {order.variant.color} · {formatCurrency(order.variant.price)} × {order.quantity}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 font-body">Placed: {formatDateTime(order.placedAt)}</p>
                    </div>
                    <span className={`badge border ${paymentStatusColor(order.paymentStatus)}`}>{order.paymentStatus}</span>
                  </div>

                  {order.paymentProofUrl ? (
                    <div>
                      <p className="text-xs text-slate-500 font-body mb-1">Payment Proof:</p>
                      <a href={order.paymentProofUrl} target="_blank" rel="noreferrer"
                        className="text-sm text-cyan-400 hover:underline font-body break-all">
                        {order.paymentProofUrl}
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-500/60 font-body">⚠️ No payment proof uploaded yet.</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => approveOrder(order.registrationId)}
                      disabled={processing === order.registrationId}
                      className="btn-primary text-sm flex-1"
                    >
                      {processing === order.registrationId ? "…" : "Approve & Generate Ticket"}
                    </button>
                    <button
                      onClick={() => rejectOrder(order.registrationId)}
                      disabled={processing === order.registrationId}
                      className="btn-danger text-sm flex-1"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Forum tab */}
      {tab === "forum" && <OrganizerForum eventId={id} />}

      {/* Manual Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <h2 className="section-title">Manual Attendance Override</h2>
            <div>
              <label className="label">Set Attendance</label>
              <select className="input" value={overrideAttended ? "true" : "false"} onChange={(e) => setOverrideAttended(e.target.value === "true")}>
                <option value="true">Present</option>
                <option value="false">Absent</option>
              </select>
            </div>
            <div>
              <label className="label">Reason *</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Why is this override needed?"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setOverrideModal(null); setOverrideReason(""); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={submitOverride} className="btn-primary flex-1">Apply Override</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerEventDetail;
