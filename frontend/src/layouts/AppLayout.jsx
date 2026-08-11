import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  QrCode,
  CalendarCheck,
  CalendarDays,
  ListChecks,
  Clock,
  Lightbulb,
  BarChart3,
  User,
  LogOut,
  GraduationCap,
  BookOpen,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "../utils/toast";
import { useTheme } from "../hooks/useTheme";

const studentNav = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/student/scan", label: "Scan Attendance", icon: QrCode },
  { to: "/student/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/student/timetable", label: "Timetable", icon: CalendarDays },
  { to: "/student/planner", label: "Planner", icon: ListChecks },
  { to: "/student/free-periods", label: "Free Periods", icon: Clock },
  { to: "/student/suggestions", label: "Suggestions", icon: Lightbulb },
  { to: "/student/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/student/profile", label: "Profile", icon: User },
];

const teacherNav = [
  { to: "/teacher", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/teacher/classes", label: "Classes", icon: BookOpen },
  { to: "/teacher/qr", label: "Generate QR", icon: QrCode },
  { to: "/teacher/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/teacher/timetable", label: "Timetable", icon: CalendarDays },
  { to: "/teacher/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/teacher/profile", label: "Profile", icon: User },
];

function NavItems({ nav, onNavigate }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-primary-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            }`
          }
        >
          <item.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout({ nav }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast("Logged out successfully", "info");
    navigate("/login");
  };

  const brand = (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="rounded-xl bg-primary-600 p-2 text-white shadow-sm">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-bold leading-tight">Smart Curriculum</p>
        <p className="text-xs text-slate-400">Attend. Plan. Learn.</p>
      </div>
    </div>
  );

  const userCard = (
    <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
          {user?.name?.[0] || "U"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-xs capitalize text-slate-500 dark:text-slate-400">{user?.role}</p>
        </div>
        <button
          onClick={toggle}
          title="Toggle dark mode"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          onClick={handleLogout}
          title="Logout"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
        {brand}
        <NavItems nav={nav} />
        {userCard}
      </aside>

      {/* Mobile sidebar */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white dark:bg-slate-900">
            {brand}
            <NavItems nav={nav} onNavigate={() => setOpen(false)} />
            {userCard}
          </aside>
        </div>
      ) : null}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/80">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-600 dark:text-slate-300">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-semibold">Smart Curriculum</span>
          <div className="h-8 w-8 rounded-full bg-primary-600 text-white grid place-items-center text-sm font-bold">
            {user?.name?.[0] || "U"}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export { studentNav, teacherNav };
