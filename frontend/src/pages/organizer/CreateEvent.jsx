import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { getErrorMsg, formatCurrency } from "../../utils/helpers";

const FIELD_TYPES = ["text", "dropdown", "checkbox", "file"];

const defaultForm = {
  name: "", description: "", type: "normal", eligibility: "all",
  registrationDeadline: "", startDate: "", endDate: "",
  registrationLimit: "", registrationFee: 0, tags: "",
  requiresPaymentApproval: false, purchaseLimitPerUser: 1,
};

const CreateEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // if editing
  const isEdit = !!id;

  const [form, setForm]   = useState(defaultForm);
  const [customForm, setCustomForm] = useState([]); // for normal events
  const [variants, setVariants]     = useState([]);  // for merch events
  const [loading, setLoading]       = useState(isEdit);
  const [saving, setSaving]         = useState(false);
  const [existingEvent, setExistingEvent] = useState(null);

  const setF = (k) => (e) =>
    setForm((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  // Load event for editing
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/events/${id}`)
      .then((r) => {
        const ev = r.data.event;
        setExistingEvent(ev);
        setForm({
          name:           ev.name,
          description:    ev.description,
          type:           ev.type,
          eligibility:    ev.eligibility,
          registrationDeadline: ev.registrationDeadline?.slice(0, 16) || "",
          startDate:      ev.startDate?.slice(0, 16) || "",
          endDate:        ev.endDate?.slice(0, 16) || "",
          registrationLimit: ev.registrationLimit || "",
          registrationFee:   ev.registrationFee || 0,
          tags:           ev.tags?.join(", ") || "",
          requiresPaymentApproval: ev.requiresPaymentApproval || false,
          purchaseLimitPerUser:    ev.purchaseLimitPerUser || 1,
        });
        setCustomForm(ev.customForm || []);
        setVariants(ev.merchandiseVariants || []);
      })
      .catch(() => toast.error("Failed to load event."))
      .finally(() => setLoading(false));
  }, [id, isEdit]);
  const addField = () =>
    setCustomForm((p) => [...p, { label: "", fieldType: "text", isRequired: false, options: [] }]);

  const updateField = (i, k, v) =>
    setCustomForm((p) => p.map((f, idx) => idx === i ? { ...f, [k]: v } : f));

  const removeField = (i) =>
    setCustomForm((p) => p.filter((_, idx) => idx !== i));

  const moveField = (i, dir) => {
    const next = [...customForm];
    const swap = i + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[i], next[swap]] = [next[swap], next[i]];
    setCustomForm(next);
  };

  const addOption = (i) =>
    setCustomForm((p) => p.map((f, idx) =>
      idx === i ? { ...f, options: [...(f.options || []), ""] } : f
    ));

  const updateOption = (fi, oi, val) =>
    setCustomForm((p) => p.map((f, idx) =>
      idx === fi
        ? { ...f, options: f.options.map((o, oidx) => oidx === oi ? val : o) }
        : f
    ));
  const addVariant = () =>
    setVariants((p) => [...p, { size: "", color: "", stock: 0, price: 0 }]);

  const updateVariant = (i, k, v) =>
    setVariants((p) => p.map((vr, idx) => idx === i ? { ...vr, [k]: v } : vr));

  const removeVariant = (i) =>
    setVariants((p) => p.filter((_, idx) => idx !== i));
  const handleSubmit = async (statusOverride) => {
    setSaving(true);
    try {
      const fullPayload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        registrationLimit: form.registrationLimit ? Number(form.registrationLimit) : undefined,
        registrationFee:   Number(form.registrationFee || 0),
        statusOverride,
        ...(form.type === "normal"       ? { customForm }     : {}),
        ...(form.type === "merchandise"  ? { merchandiseVariants: variants } : {}),
      };

      const effectiveStatus = existingEvent?.effectiveStatus || existingEvent?.statusOverride || "Draft";
      const payload = (() => {
        if (!isEdit || effectiveStatus === "Draft") return fullPayload;
        if (effectiveStatus === "Published") {
          const allowed = ["description", "registrationDeadline", "registrationLimit", "statusOverride"];
          return allowed.reduce((acc, key) => {
            if (fullPayload[key] !== undefined) acc[key] = fullPayload[key];
            return acc;
          }, {});
        }
        return { statusOverride };
      })();

      if (isEdit) {
        await api.put(`/events/${id}`, payload);
        toast.success(statusOverride === "Published" ? "Published" : "Saved.");
      } else {
        const { data } = await api.post("/events", payload);
        toast.success("Event created as draft.");
        navigate(`/organizer/events/${data.event._id}`);
        return;
      }
      navigate(`/organizer/events/${id}`);
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const status = existingEvent?.effectiveStatus || existingEvent?.statusOverride;
  const isDraft = !status || status === "Draft";
  const isPublished = status === "Published";
  const isOngoingOrCompleted = ["Ongoing", "Completed", "Closed"].includes(status);
  const isLocked = existingEvent?.isFormLocked;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-amber-500" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-300 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="page-title">{isEdit ? "Edit Event" : "Create New Event"}</h1>
      </div>

      {isEdit && status && (
        <div className="text-xs bg-bg-elevated border border-bg-border rounded-lg p-3 text-slate-400 font-body">
          Current status: <span className="text-amber-400 font-medium">{status}</span>.
          {isDraft && " You can freely edit all fields."}
          {isPublished && " Only description, deadline, and limit can be updated."}
          {!isDraft && !isPublished && " Only status can be changed now."}
          {isLocked && " Custom form is locked (registrations received)."}
        </div>
      )}
      <div className="card p-6 space-y-4">
        <h2 className="section-title">Event Details</h2>

        <div>
          <label className="label">Event Name *</label>
          <input className="input" placeholder="e.g. Web Dev Workshop" value={form.name} onChange={setF("name")} disabled={!isDraft} required />
        </div>

        <div>
          <label className="label">Description *</label>
          <textarea className="input min-h-24 resize-none" placeholder="Describe your event…" value={form.description} onChange={setF("description")} disabled={isOngoingOrCompleted} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Event Type *</label>
            <select className="input" value={form.type} onChange={setF("type")} disabled={isEdit}>
              <option value="normal">Normal</option>
              <option value="merchandise">Merchandise</option>
            </select>
          </div>
          <div>
            <label className="label">Eligibility *</label>
            <select className="input" value={form.eligibility} onChange={setF("eligibility")} disabled={!isDraft}>
              <option value="all">Open to All</option>
              <option value="iiit">IIIT Only</option>
              <option value="non-iiit">Non-IIIT Only</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Start Date *</label>
            <input type="datetime-local" className="input" value={form.startDate} onChange={setF("startDate")} disabled={!isDraft} />
          </div>
          <div>
            <label className="label">End Date *</label>
            <input type="datetime-local" className="input" value={form.endDate} onChange={setF("endDate")} disabled={!isDraft} />
          </div>
          <div>
            <label className="label">Reg. Deadline *</label>
            <input type="datetime-local" className="input" value={form.registrationDeadline} onChange={setF("registrationDeadline")} disabled={isOngoingOrCompleted} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Registration Limit <span className="text-slate-600 text-xs">(optional)</span></label>
            <input type="number" className="input" placeholder="e.g. 100" value={form.registrationLimit} onChange={setF("registrationLimit")} disabled={isOngoingOrCompleted} />
          </div>
          {form.type === "normal" && (
            <div>
              <label className="label">Registration Fee (₹)</label>
              <input type="number" className="input" placeholder="0 = Free" value={form.registrationFee} onChange={setF("registrationFee")} disabled={!isDraft} />
            </div>
          )}
        </div>

        <div>
          <label className="label">Tags <span className="text-slate-600 text-xs">(comma-separated)</span></label>
          <input className="input" placeholder="workshop, web, beginner" value={form.tags} onChange={setF("tags")} disabled={!isDraft} />
        </div>
      </div>
      {form.type === "normal" && isDraft && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Registration Form Builder</h2>
            {isLocked && <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20">Locked</span>}
          </div>

          {!isLocked && (
            <p className="text-xs text-slate-500 font-body">Add custom fields for participant registration. Form locks after the first registration.</p>
          )}

          <div className="space-y-3">
            {customForm.map((field, i) => (
              <div key={i} className="bg-bg-elevated rounded-lg border border-bg-border p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Field Label *</label>
                    <input
                      className="input text-sm"
                      placeholder="e.g. GitHub URL"
                      value={field.label}
                      onChange={(e) => updateField(i, "label", e.target.value)}
                      disabled={isLocked}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Field Type</label>
                    <select className="input text-sm" value={field.fieldType} onChange={(e) => updateField(i, "fieldType", e.target.value)} disabled={isLocked}>
                      {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {(field.fieldType === "dropdown" || field.fieldType === "checkbox") && (
                  <div className="space-y-2">
                    <label className="label text-xs">Options</label>
                    {(field.options || []).map((opt, oi) => (
                      <input
                        key={oi}
                        className="input text-sm"
                        placeholder={`Option ${oi + 1}`}
                        value={opt}
                        onChange={(e) => updateOption(i, oi, e.target.value)}
                        disabled={isLocked}
                      />
                    ))}
                    {!isLocked && (
                      <button type="button" onClick={() => addOption(i)} className="text-xs text-cyan-400 hover:underline font-body">
                        + Add option
                      </button>
                    )}
                  </div>
                )}

                {!isLocked && (
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer font-body">
                      <input
                        type="checkbox"
                        className="rounded border-bg-border bg-bg-elevated text-amber-500"
                        checked={field.isRequired}
                        onChange={(e) => updateField(i, "isRequired", e.target.checked)}
                      />
                      Required
                    </label>
                    <div className="flex gap-1 ml-auto">
                      <button type="button" onClick={() => moveField(i, -1)} disabled={i === 0} className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30">↑</button>
                      <button type="button" onClick={() => moveField(i, 1)} disabled={i === customForm.length - 1} className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30">↓</button>
                      <button type="button" onClick={() => removeField(i)} className="p-1 text-red-400/60 hover:text-red-400">✕</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!isLocked && (
            <button type="button" onClick={addField} className="btn-secondary text-sm w-full">
              + Add Field
            </button>
          )}
        </div>
      )}
      {form.type === "merchandise" && isDraft && (
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Merchandise Variants</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Purchase Limit per User</label>
              <input type="number" className="input" min="1" value={form.purchaseLimitPerUser} onChange={setF("purchaseLimitPerUser")} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="payApproval"
                className="rounded border-bg-border bg-bg-elevated text-amber-500"
                checked={form.requiresPaymentApproval}
                onChange={setF("requiresPaymentApproval")}
              />
              <label htmlFor="payApproval" className="text-sm text-slate-300 cursor-pointer font-body">
                Require payment approval
              </label>
            </div>
          </div>

          <div className="space-y-3">
            {variants.map((v, i) => (
              <div key={i} className="bg-bg-elevated rounded-lg border border-bg-border p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="label text-xs">Size</label>
                    <input className="input text-sm" placeholder="M / L / XL" value={v.size} onChange={(e) => updateVariant(i, "size", e.target.value)} />
                  </div>
                  <div>
                    <label className="label text-xs">Color</label>
                    <input className="input text-sm" placeholder="Black / White" value={v.color} onChange={(e) => updateVariant(i, "color", e.target.value)} />
                  </div>
                  <div>
                    <label className="label text-xs">Stock</label>
                    <input type="number" className="input text-sm" min="0" value={v.stock} onChange={(e) => updateVariant(i, "stock", Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="label text-xs">Price (₹)</label>
                    <input type="number" className="input text-sm" min="0" value={v.price} onChange={(e) => updateVariant(i, "price", Number(e.target.value))} />
                  </div>
                </div>
                <button type="button" onClick={() => removeVariant(i)} className="mt-2 text-xs text-red-400/60 hover:text-red-400 font-body">
                  Remove variant
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addVariant} className="btn-secondary text-sm w-full">
            + Add Variant
          </button>
        </div>
      )}
      {isEdit && !isDraft && (
        <div className="card p-5 space-y-3">
          <h2 className="section-title">Status Management</h2>
          <div className="flex flex-wrap gap-2">
            {isPublished && (
              <button onClick={() => handleSubmit("Closed")} className="btn-secondary text-sm">
                Close Registrations
              </button>
            )}
            {(status === "Ongoing") && (
              <button onClick={() => handleSubmit("Completed")} className="btn-primary text-sm">
                Mark as Completed 
              </button>
            )}
            {(status === "Ongoing") && (
              <button onClick={() => handleSubmit("Closed")} className="btn-danger text-sm">
                Close Event
              </button>
            )}
          </div>
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        {isDraft && (
          <>
            <button onClick={() => handleSubmit("Draft")} disabled={saving} className="btn-secondary flex-1">
              {saving ? "Saving…" : isEdit ? "Save Draft" : "Save as Draft"}
            </button>
            <button onClick={() => handleSubmit("Published")} disabled={saving} className="btn-primary flex-1">
              {saving ? "Publishing…" : "Publish Event "}
            </button>
          </>
        )}
        {isPublished && (
          <button onClick={() => handleSubmit("Published")} disabled={saving} className="btn-primary flex-1">
            {saving ? "Updating…" : "Update Event"}
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateEvent;
