import { useEffect, useState } from "react";
import {
  Plus,
  Users,
  BookOpen,
  Trash2,
  Loader2,
  GraduationCap,
  ChevronDown,
} from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import Spinner from "../../components/Spinner";
import { toast } from "../../utils/toast";

function AddStudentForm({ classId, onAdded }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", studentId: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/classes/${classId}/students`, form);
      toast("Student added to class");
      setForm({ name: "", email: "", password: "", studentId: "" });
      setOpen(false);
      onAdded();
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to add student", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="btn-secondary w-full !py-2 text-xs">
        <Plus className="h-3.5 w-3.5" /> {open ? "Close" : "Add Student"}
      </button>
      {open ? (
        <form onSubmit={submit} className="mt-3 space-y-2.5 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <input className="input !py-2 text-xs" placeholder="Full name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input !py-2 text-xs" type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input !py-2 text-xs" placeholder="Password *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <input className="input !py-2 text-xs" placeholder="Student ID (optional)" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
          <button type="submit" disabled={saving} className="btn-primary w-full !py-2 text-xs">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />} Save Student
          </button>
        </form>
      ) : null}
    </div>
  );
}

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ name: "", section: "", subjects: [{ name: "", code: "" }] });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get("/classes")
      .then((res) => setClasses(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const createClass = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const subjects = form.subjects.filter((s) => s.name.trim() && s.code.trim());
      await api.post("/classes", { name: form.name, section: form.section, subjects });
      toast("Class created");
      setForm({ name: "", section: "", subjects: [{ name: "", code: "" }] });
      setCreateOpen(false);
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to create class", "error");
    } finally {
      setSaving(false);
    }
  };

  const removeStudent = async (classId, studentId) => {
    try {
      await api.delete(`/classes/${classId}/students/${studentId}`);
      toast("Student removed", "info");
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "Failed", "error");
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Classes"
        subtitle="Create classes, manage students and subjects."
        actions={
          <button onClick={() => setCreateOpen((o) => !o)} className="btn-primary">
            {createOpen ? <ChevronDown className="h-4 w-4 rotate-180" /> : <Plus className="h-4 w-4" />}
            New Class
          </button>
        }
      />

      {createOpen ? (
        <form onSubmit={createClass} className="card mb-6 p-5">
          <h3 className="font-semibold">Create Class</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Class Name *</label>
              <input className="input" placeholder="e.g. CSE 2nd Year" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Section *</label>
              <input className="input" placeholder="e.g. B" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} required />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Subjects</label>
            <div className="space-y-2">
              {form.subjects.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input flex-1 !py-2 text-xs" placeholder="Subject name" value={s.name} onChange={(e) => { const arr = [...form.subjects]; arr[i].name = e.target.value; setForm({ ...form, subjects: arr }); }} />
                  <input className="input w-28 !py-2 text-xs" placeholder="Code" value={s.code} onChange={(e) => { const arr = [...form.subjects]; arr[i].code = e.target.value; setForm({ ...form, subjects: arr }); }} />
                  {form.subjects.length > 1 ? (
                    <button type="button" onClick={() => setForm({ ...form, subjects: form.subjects.filter((_, j) => j !== i) })} className="rounded-lg p-2 text-slate-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setForm({ ...form, subjects: [...form.subjects, { name: "", code: "" }] })} className="btn-secondary mt-2 !py-2 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add Subject
            </button>
          </div>
          <button type="submit" disabled={saving} className="btn-primary mt-4">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />} Create Class
          </button>
        </form>
      ) : null}

      <div className="space-y-4">
        {classes.map((cls) => (
          <div key={cls._id} className="card overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === cls._id ? null : cls._id)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <div className="rounded-xl bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{cls.name} · {cls.section}</h3>
                <p className="text-xs text-slate-400">
                  {cls.students?.length || 0} students · {cls.subjects?.length || 0} subjects
                </p>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition ${expanded === cls._id ? "rotate-180" : ""}`} />
            </button>

            {expanded === cls._id ? (
              <div className="grid gap-5 border-t border-slate-200 p-5 dark:border-slate-800 md:grid-cols-2">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <h4 className="text-sm font-semibold">Students ({cls.students?.length || 0})</h4>
                  </div>
                  <div className="max-h-64 space-y-2 overflow-auto pr-1">
                    {(cls.students || []).map((s) => (
                      <div key={s._id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                        <div className="grid h-7 w-7 place-items-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                          {s.name?.[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{s.name}</p>
                          <p className="truncate text-xs text-slate-400">{s.studentId} · {s.email}</p>
                        </div>
                        <button onClick={() => removeStudent(cls._id, s._id)} className="text-slate-300 hover:text-red-500 dark:text-slate-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {(cls.students || []).length === 0 && <p className="py-4 text-center text-xs text-slate-400">No students yet.</p>}
                  </div>
                  <div className="mt-3">
                    <AddStudentForm classId={cls._id} onAdded={load} />
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    <h4 className="text-sm font-semibold">Subjects</h4>
                  </div>
                  <div className="space-y-2">
                    {(cls.subjects || []).map((s) => (
                      <div key={s._id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                        <span className="text-sm font-medium">{s.name}</span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{s.code}</span>
                      </div>
                    ))}
                    {(cls.subjects || []).length === 0 && <p className="py-4 text-center text-xs text-slate-400">No subjects yet.</p>}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {classes.length === 0 && (
          <div className="card p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-3 font-semibold">No classes yet</h2>
            <p className="mt-1 text-sm text-slate-400">Create your first class to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
