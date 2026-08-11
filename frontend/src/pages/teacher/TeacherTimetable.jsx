import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import TimetableGrid from "../../components/TimetableGrid";
import Spinner from "../../components/Spinner";
import { toast } from "../../utils/toast";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PERIODS = [1, 2, 3, 4, 5];

export default function TeacherTimetable() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slotForm, setSlotForm] = useState({
    day: "Mon",
    period: 1,
    type: "class",
    subjectId: "",
    startTime: "09:00",
    endTime: "10:00",
  });

  const load = () => {
    if (!classId) return;
    setLoading(true);
    api
      .get("/timetable", { params: { classId } })
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get("/classes").then((res) => {
      setClasses(res.data.data);
      if (res.data.data[0]) setClassId(res.data.data[0]._id);
    });
  }, []);

  useEffect(load, [classId]);

  const selectedClass = classes.find((c) => c._id === classId);

  const saveSlot = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/timetable", { ...slotForm, classId });
      toast("Timetable slot saved");
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to save slot", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteSlot = async (day, period) => {
    try {
      await api.delete(`/timetable/${classId}/${day}/${period}`);
      toast("Slot deleted", "info");
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to delete", "error");
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Timetable Management"
        subtitle="Set up the weekly schedule for your classes."
        actions={
          <select className="input max-w-xs" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name} · {c.section}</option>
            ))}
          </select>
        }
      />

      <TimetableGrid grouped={data?.grouped} />

      <div className="card mt-6 p-5">
        <h2 className="mb-4 font-semibold">Edit / Add Slot</h2>
        <form onSubmit={saveSlot} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          <div>
            <label className="label">Day</label>
            <select className="input" value={slotForm.day} onChange={(e) => setSlotForm({ ...slotForm, day: e.target.value })}>
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Period</label>
            <select className="input" value={slotForm.period} onChange={(e) => setSlotForm({ ...slotForm, period: Number(e.target.value) })}>
              {PERIODS.map((p) => <option key={p} value={p}>P{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={slotForm.type} onChange={(e) => setSlotForm({ ...slotForm, type: e.target.value })}>
              <option value="class">Class</option>
              <option value="free">Free</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="label">Subject</label>
            <select
              className="input"
              value={slotForm.subjectId}
              onChange={(e) => setSlotForm({ ...slotForm, subjectId: e.target.value })}
              disabled={slotForm.type === "free"}
            >
              <option value="">{slotForm.type === "free" ? "— free period —" : "Select subject"}</option>
              {(selectedClass?.subjects || []).map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Start</label>
            <input type="time" className="input" value={slotForm.startTime} onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })} required />
          </div>
          <div>
            <label className="label">End</label>
            <input type="time" className="input" value={slotForm.endTime} onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })} required />
          </div>
          <div className="flex items-end gap-2 lg:col-span-7">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Slot
            </button>
            {slotForm.subjectId || slotForm.type === "free" ? (
              <button type="button" onClick={() => deleteSlot(slotForm.day, slotForm.period)} className="btn-secondary !text-red-600">
                <Trash2 className="h-4 w-4" /> Delete current
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
