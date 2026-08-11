import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import { User, Mail, IdCard, Shield, LogOut, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "../utils/toast";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const rows = [
    { icon: User, label: "Full Name", value: user?.name },
    { icon: Mail, label: "Email", value: user?.email },
    { icon: IdCard, label: user?.role === "student" ? "Student ID" : "Teacher ID", value: user?.studentId || user?.teacherId || "—" },
    { icon: Shield, label: "Role", value: user?.role?.toUpperCase() },
    { icon: GraduationCap, label: "Class", value: user?.classId ? `${user.classId.name} ${user.classId.section || ""}` : "—" },
  ];

  const handleLogout = () => {
    logout();
    toast("Logged out", "info");
    navigate("/login");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profile" subtitle="Your account details" />

      <div className="card overflow-hidden">
        <div className="flex items-center gap-4 border-b border-slate-200 bg-gradient-to-r from-primary-600 to-indigo-600 p-6 text-white dark:border-slate-800">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 text-2xl font-bold">
            {user?.name?.[0] || "U"}
          </div>
          <div>
            <h2 className="text-lg font-bold">{user?.name}</h2>
            <p className="text-sm text-primary-100">Smart Curriculum Account</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <r.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-slate-400">{r.label}</p>
                <p className="truncate text-sm font-medium">{r.value || "—"}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 p-6 dark:border-slate-800">
          <button onClick={handleLogout} className="btn-primary w-full !bg-red-600 hover:!bg-red-700">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
