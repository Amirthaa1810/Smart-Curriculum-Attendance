import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, LogIn, User as UserIcon, BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "../utils/toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const quickFill = (r) => {
    setRole(r);
    setEmail(r === "student" ? "student@demo.com" : "teacher@demo.com");
    setPassword(r === "student" ? "student123" : "teacher123");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      toast(`Welcome back, ${user.name}!`);
      navigate(user.role === "teacher" ? "/teacher" : "/student");
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid login credentials";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-emerald-50 px-4 py-10 dark:from-primary-950/40 dark:via-slate-950 dark:to-emerald-950/30">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2.5">
          <div className="rounded-xl bg-primary-600 p-2 text-white">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="text-base font-bold leading-tight">Smart Curriculum</p>
            <p className="text-xs text-slate-400">Attend. Plan. Learn.</p>
          </div>
        </Link>

        <div className="card p-6 sm:p-8">
          <h1 className="text-xl font-bold">Sign in to your account</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Use the demo accounts to explore instantly.
          </p>

          {/* Role toggle */}
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {[
              { r: "student", label: "Student", icon: UserIcon },
              { r: "teacher", label: "Teacher", icon: BookOpen },
            ].map(({ r, label, icon: Icon }) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r);
                  setError("");
                }}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  role === r
                    ? "bg-white text-primary-700 shadow-sm dark:bg-slate-900 dark:text-primary-300"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder={role === "student" ? "student@demo.com" : "teacher@demo.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            ) : null}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              <LogIn className="h-4 w-4" />
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-3 dark:border-slate-700">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
              Demo accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => quickFill("student")} className="btn-secondary !px-2 !py-2 text-xs">
                <UserIcon className="h-3.5 w-3.5" /> student@demo.com
              </button>
              <button onClick={() => quickFill("teacher")} className="btn-secondary !px-2 !py-2 text-xs">
                <BookOpen className="h-3.5 w-3.5" /> teacher@demo.com
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">Password: student123 / teacher123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
