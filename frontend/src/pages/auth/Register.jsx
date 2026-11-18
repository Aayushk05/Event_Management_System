import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { getErrorMsg } from "../../utils/helpers";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "",
    participantType: "non-iiit", collegeName: "", contactNumber: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      toast.success("Account created. Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg-base">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/4 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up relative">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-amber-500 tracking-tight">Felicity</h1>
          <p className="text-slate-500 text-sm mt-1 font-body">Create your participant account</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-display font-semibold text-slate-100 mb-6">Register</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Participant type selector */}
            <div>
              <label className="label">Participant Type</label>
              <div className="grid grid-cols-2 gap-2">
                {["iiit", "non-iiit"].map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setForm((p) => ({ ...p, participantType: type }))}
                    className={`py-2.5 rounded-lg border text-sm font-medium font-body transition-all ${
                      form.participantType === type
                        ? "border-amber-500 bg-amber-500/10 text-amber-400"
                        : "border-bg-border bg-bg-elevated text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {type === "iiit" ? "IIIT Student" : "Non-IIIT"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name</label>
                <input className="input" placeholder="Arjun" value={form.firstName} onChange={set("firstName")} required />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input" placeholder="Sharma" value={form.lastName} onChange={set("lastName")} required />
              </div>
            </div>

            <div>
              <label className="label">
                Email{" "}
                {form.participantType === "iiit" && (
                  <span className="text-amber-500/70 text-xs">(must be @iiit.ac.in / @students.iiit.ac.in / @research.iiit.ac.in)</span>
                )}
              </label>
              <input
                type="email" className="input"
                placeholder={form.participantType === "iiit" ? "you@research.iiit.ac.in" : "you@example.com"}
                value={form.email} onChange={set("email")} required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min. 6 characters" value={form.password} onChange={set("password")} required />
            </div>

            <div>
              <label className="label">College / Organization</label>
              <input className="input" placeholder="IIIT Hyderabad" value={form.collegeName} onChange={set("collegeName")} />
            </div>

            <div>
              <label className="label">Contact Number</label>
              <input className="input" placeholder="+91 98765 43210" value={form.contactNumber} onChange={set("contactNumber")} />
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500 font-body">
            Already have an account?{" "}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
