import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { getErrorMsg } from "../../utils/helpers";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname;
  const ROLE_HOME = { participant: "/dashboard", organizer: "/organizer/dashboard", admin: "/admin/dashboard" };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.token, data.user);
      toast.success(`Welcome, ${data.user.firstName}`);
      navigate(from || ROLE_HOME[data.user.role] || "/dashboard", { replace: true });
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg-base">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-amber-500 tracking-tight">Felicity</h1>
          <p className="text-slate-500 text-sm mt-1 font-body">IIIT Hyderabad · Event Management</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-display font-semibold text-slate-100 mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500 font-body">
            New participant?{" "}
            <Link to="/register" className="text-amber-400 hover:text-amber-300 transition-colors">
              Create an account
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4 font-body">
          Organizer &amp; Admin accounts are provisioned by the system.
        </p>
      </div>
    </div>
  );
};

export default Login;
