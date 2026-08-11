import { Link } from "react-router-dom";
import {
  GraduationCap,
  QrCode,
  CalendarDays,
  Sparkles,
  BarChart3,
  Clock,
  ArrowRight,
  CheckCircle2,
  LogIn,
  AlertTriangle,
  Bell,
} from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "QR Attendance",
    desc: "Time-limited, unique QR sessions. Scan, validate, done — attendance recorded in seconds.",
  },
  {
    icon: CalendarDays,
    title: "Smart Timetable",
    desc: "Daily timetable with automatic free-period detection for every student.",
  },
  {
    icon: Sparkles,
    title: "Personalized Planner",
    desc: "Rule-based daily plans that turn free periods into productive learning time.",
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    desc: "Real-time dashboards for attendance trends, subject-wise stats and warnings.",
  },
];

const steps = [
  { title: "Generate QR", desc: "Teacher picks class, subject and period, then starts a unique QR session." },
  { title: "Scan to mark", desc: "Student scans the QR with the in-app camera. Backend validates instantly." },
  { title: "Plan & learn", desc: "Free periods become revision, practice and preview time automatically." },
];

const problemPoints = [
  "Manual attendance wastes 5–10 minutes of every class and is error-prone.",
  "No structured guidance for free periods — students waste 20+ hours a month.",
  "Teachers can't spot low-attendance students until it's too late.",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-primary-600 p-2 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Smart Curriculum</p>
              <p className="text-xs text-slate-400">Attend. Plan. Learn.</p>
            </div>
          </div>
          <Link to="/login" className="btn-primary !py-2">
            <LogIn className="h-4 w-4" /> Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-emerald-50 dark:from-primary-950/40 dark:via-slate-950 dark:to-emerald-950/30" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-300">
            <Sparkles className="h-3.5 w-3.5" /> Hackathon Prototype
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            Smart Curriculum
            <span className="block bg-gradient-to-r from-primary-600 to-indigo-500 bg-clip-text text-transparent">
              Activity & Attendance
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">Attend. Plan. Learn.</span> One
            platform that combines QR attendance, smart timetables, free-period detection and
            personalized academic planning.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/login" className="btn-primary !px-6 !py-3 text-base">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="btn-secondary !px-6 !py-3 text-base">
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">The Problem</h2>
            <ul className="mt-5 space-y-3">
              {problemPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Our Solution</h2>
            <ul className="mt-5 space-y-3">
              {[
                "QR-based attendance in under 3 seconds — no wasted class time.",
                "Automatic free-period detection with personalized study plans.",
                "Real-time analytics so teachers can intervene early.",
              ].map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="card p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white">
                {i + 1}
              </div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Everything in one platform</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div key={i} className="card p-6 transition hover:-translate-y-1 hover:shadow-md">
                <div className="mb-4 inline-flex rounded-xl bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <div className="card bg-gradient-to-br from-primary-600 to-indigo-600 p-10 text-white">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to transform your campus?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-primary-100">
            Try the live demo with one click — teacher and student accounts are pre-seeded.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/login" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary-700 shadow-sm transition hover:bg-primary-50">
              Login as Teacher
            </Link>
            <Link to="/login" className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Login as Student
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 dark:border-slate-800">
        Smart Curriculum Activity & Attendance · Attend. Plan. Learn. · Built for Hackathon 2026
      </footer>
    </div>
  );
}
