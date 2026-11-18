export const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
};

export const formatDateTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export const isDeadlinePassed = (deadline) => {
  return deadline && new Date() > new Date(deadline);
};

export const statusColor = (status) => {
  const map = {
    Draft:     "bg-slate-700/50 text-slate-300 border-slate-600",
    Published: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    Ongoing:   "bg-green-500/10 text-green-400 border-green-500/30",
    Completed: "bg-slate-600/30 text-slate-400 border-slate-600",
    Closed:    "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return map[status] || "bg-slate-700/50 text-slate-400";
};

export const paymentStatusColor = (status) => {
  const map = {
    "Not Applicable": "bg-slate-700/50 text-slate-400",
    Pending:  "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    Approved: "bg-green-500/10 text-green-400 border border-green-500/30",
    Rejected: "bg-red-500/10 text-red-400 border border-red-500/20",
  };
  return map[status] || "bg-slate-700/50 text-slate-400";
};

export const eventTypeLabel = (type) =>
  type === "merchandise" ? "🛍️ Merchandise" : "🎯 Normal";

export const eligibilityLabel = (e) => {
  const map = { iiit: "IIIT Only", "non-iiit": "Non-IIIT", all: "Open to All" };
  return map[e] || e;
};

export const formatCurrency = (amount) => {
  if (!amount || amount === 0) return "Free";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

export const getErrorMsg = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  "Something went wrong.";

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const truncate = (str, n = 120) =>
  str && str.length > n ? str.slice(0, n) + "…" : str;
