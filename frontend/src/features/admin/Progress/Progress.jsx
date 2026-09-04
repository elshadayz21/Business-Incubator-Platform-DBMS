import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Layers,
  ListChecks,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Loader2,
  Inbox,
  GripVertical,
} from "lucide-react";
import StatCard from "../../../components/StatCard";

const emptyPhaseForm = { name: "", description: "", cohort_id: "", order_index: 0 };
const emptyTaskForm = { title: "", description: "", due_date: "", order_index: 0 };

const Progress = () => {
  const [phases, setPhases] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cohortFilter, setCohortFilter] = useState("all");
  const [expanded, setExpanded] = useState({});

  const [phaseForm, setPhaseForm] = useState(null); // { ...emptyPhaseForm } or existing phase to edit
  const [taskForm, setTaskForm] = useState(null); // { phase_id, ...emptyTaskForm } or existing task to edit
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [phasesRes, cohortsRes, overviewRes] = await Promise.all([
        fetch(
          `/api/admin/progress/phases${cohortFilter !== "all" ? `?cohortId=${cohortFilter}` : ""}`,
          { credentials: "include" },
        ),
        fetch("/api/admin/cohorts", { credentials: "include" }),
        fetch("/api/admin/progress/overview", { credentials: "include" }),
      ]);
      const phasesData = await phasesRes.json();
      const cohortsData = await cohortsRes.json();
      const overviewData = await overviewRes.json();
      setPhases(Array.isArray(phasesData) ? phasesData : []);
      setCohorts(Array.isArray(cohortsData) ? cohortsData : []);
      setOverview(overviewData);
    } catch (error) {
      console.error("Error fetching progress data:", error);
      setPhases([]);
    } finally {
      setLoading(false);
    }
  }, [cohortFilter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleExpanded = (phaseId) =>
    setExpanded((prev) => ({ ...prev, [phaseId]: !prev[phaseId] }));

  // ---- Phase CRUD ----
  const openNewPhase = () =>
    setPhaseForm({ ...emptyPhaseForm, order_index: phases.length });
  const openEditPhase = (phase) =>
    setPhaseForm({
      id: phase.id,
      name: phase.name,
      description: phase.description || "",
      cohort_id: phase.cohort_id || "",
      order_index: phase.order_index,
    });
  const closePhaseForm = () => setPhaseForm(null);

  const savePhase = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: phaseForm.name,
        description: phaseForm.description,
        cohort_id: phaseForm.cohort_id || null,
        order_index: Number(phaseForm.order_index) || 0,
      };
      const url = phaseForm.id
        ? `/api/admin/progress/phases/${phaseForm.id}`
        : "/api/admin/progress/phases";
      await fetch(url, {
        method: phaseForm.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      closePhaseForm();
      fetchAll();
    } catch (error) {
      console.error("Error saving phase:", error);
    } finally {
      setSaving(false);
    }
  };

  const deletePhase = async (phase) => {
    if (!window.confirm(`Delete "${phase.name}"? This also deletes all its tasks and submissions.`))
      return;
    try {
      await fetch(`/api/admin/progress/phases/${phase.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchAll();
    } catch (error) {
      console.error("Error deleting phase:", error);
    }
  };

  // ---- Task CRUD ----
  const openNewTask = (phase) =>
    setTaskForm({ ...emptyTaskForm, phase_id: phase.id, order_index: phase.tasks.length });
  const openEditTask = (phaseId, task) =>
    setTaskForm({
      id: task.id,
      phase_id: phaseId,
      title: task.title,
      description: task.description || "",
      due_date: task.due_date ? task.due_date.slice(0, 10) : "",
      order_index: task.order_index,
    });
  const closeTaskForm = () => setTaskForm(null);

  const saveTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        phase_id: taskForm.phase_id,
        title: taskForm.title,
        description: taskForm.description,
        due_date: taskForm.due_date || null,
        order_index: Number(taskForm.order_index) || 0,
      };
      const url = taskForm.id
        ? `/api/admin/progress/tasks/${taskForm.id}`
        : "/api/admin/progress/tasks";
      await fetch(url, {
        method: taskForm.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      closeTaskForm();
      fetchAll();
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete task "${task.title}"? This also deletes its submissions.`)) return;
    try {
      await fetch(`/api/admin/progress/tasks/${task.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchAll();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827] font-['Space_Grotesk']">
            Progress Tracking
          </h1>
          <p className="text-xs text-[#526274] mt-1">
            Define phases and tasks entrepreneurs work through, and track submissions.
          </p>
        </div>
        <button
          onClick={openNewPhase}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all shrink-0"
        >
          <Plus size={18} />
          <span>New Phase</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Phases"
          value={overview?.total_phases ?? 0}
          icon={Layers}
          badgeText="Defined"
          accentColor="cyan"
        />
        <StatCard
          title="Tasks"
          value={overview?.total_tasks ?? 0}
          icon={ListChecks}
          badgeText="Across all phases"
          accentColor="cyan"
        />
        <StatCard
          title="Pending Review"
          value={overview?.pending_reviews ?? 0}
          icon={Clock}
          badgeText="Awaiting mentor"
          accentColor="orange"
        />
        <StatCard
          title="Approved"
          value={overview?.approved_submissions ?? 0}
          icon={CheckCircle2}
          badgeText="Submissions"
          accentColor="cyan"
        />
      </div>

      {/* Cohort filter */}
      <div className="bg-white p-4 rounded-2xl border border-[#D6E4EA] shadow-xs flex items-center gap-3">
        <span className="text-xs font-bold text-[#526274] uppercase tracking-wider shrink-0">
          Cohort
        </span>
        <select
          value={cohortFilter}
          onChange={(e) => setCohortFilter(e.target.value)}
          className="w-full sm:w-64 px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
        >
          <option value="all">All (global + every cohort)</option>
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Phases */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#D6E4EA]">
          <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={32} />
          <p className="text-[#526274] font-bold text-sm">Loading phases...</p>
        </div>
      ) : phases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#D6E4EA] text-center p-6">
          <div className="p-4 bg-[#EAF8FC] rounded-full text-[#00ADEF] mb-3">
            <Inbox size={36} />
          </div>
          <h3 className="text-lg font-bold text-[#111827]">No phases yet</h3>
          <p className="text-xs text-[#526274] mt-1 max-w-sm">
            Create your first phase (e.g. "Idea Validation") and add tasks entrepreneurs will
            submit work against.
          </p>
          <button
            onClick={openNewPhase}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all"
          >
            <Plus size={16} /> Create Phase
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {phases.map((phase) => {
            const isOpen = !!expanded[phase.id];
            return (
              <div
                key={phase.id}
                className="bg-white rounded-2xl border border-[#D6E4EA] shadow-xs overflow-hidden"
              >
                <button
                  onClick={() => toggleExpanded(phase.id)}
                  className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-[#F6FAFC] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isOpen ? (
                      <ChevronDown size={18} className="text-[#526274] shrink-0" />
                    ) : (
                      <ChevronRight size={18} className="text-[#526274] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[#111827] text-sm truncate">
                          {phase.name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20">
                          {phase.cohort_name || "Global"}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F6FAFC] text-[#526274] border border-[#D6E4EA]">
                          {phase.tasks.length} task{phase.tasks.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      {phase.description && (
                        <p className="text-xs text-[#526274] mt-1 truncate">{phase.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditPhase(phase)}
                      className="p-2 text-[#526274] hover:text-[#006F9E] hover:bg-[#EAF8FC] rounded-lg transition"
                      title="Edit phase"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => deletePhase(phase)}
                      className="p-2 text-[#526274] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete phase"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[#D6E4EA] p-5 space-y-3 bg-[#F6FAFC]/40">
                    {phase.tasks.length === 0 ? (
                      <p className="text-xs text-[#526274] italic">No tasks in this phase yet.</p>
                    ) : (
                      phase.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start justify-between gap-3 bg-white p-4 rounded-xl border border-[#D6E4EA]"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <GripVertical size={16} className="text-[#D6E4EA] mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-[#111827]">{task.title}</p>
                              {task.description && (
                                <p className="text-xs text-[#526274] mt-0.5">{task.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                {task.due_date && (
                                  <span className="text-[10px] font-bold text-[#526274] flex items-center gap-1">
                                    <Clock size={11} /> Due {new Date(task.due_date).toLocaleDateString()}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold text-[#E38524]">
                                  {task.pending_review_count || 0} pending review
                                </span>
                                <span className="text-[10px] font-bold text-emerald-600">
                                  {task.approved_count || 0} approved
                                </span>
                                <span className="text-[10px] font-bold text-[#526274]">
                                  {task.submission_count || 0} total submissions
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => openEditTask(phase.id, task)}
                              className="p-2 text-[#526274] hover:text-[#006F9E] hover:bg-[#EAF8FC] rounded-lg transition"
                              title="Edit task"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => deleteTask(task)}
                              className="p-2 text-[#526274] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete task"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    <button
                      onClick={() => openNewTask(phase)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-[#00ADEF]/40 text-[#006F9E] text-xs font-bold hover:bg-[#EAF8FC] transition"
                    >
                      <Plus size={14} /> Add Task
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Phase Modal */}
      {phaseForm && (
        <div
          className="fixed inset-0 bg-[#111827]/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={closePhaseForm}
        >
          <div
            className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl border border-[#D6E4EA] shadow-lg flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#D6E4EA] flex items-center justify-between bg-[#F6FAFC]">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                  Progress Tracking
                </span>
                <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk']">
                  {phaseForm.id ? "Edit Phase" : "New Phase"}
                </h2>
              </div>
              <button
                onClick={closePhaseForm}
                className="p-2 text-[#526274] hover:bg-white hover:text-[#111827] rounded-xl border border-transparent hover:border-[#D6E4EA] transition-all"
              >
                <X size={22} />
              </button>
            </div>
            <form onSubmit={savePhase} className="overflow-y-auto flex-1 p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#526274] mb-1.5">
                  Phase Name
                </label>
                <input
                  type="text"
                  required
                  value={phaseForm.name}
                  onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })}
                  placeholder="e.g. Idea Validation"
                  className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#526274] mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={phaseForm.description}
                  onChange={(e) => setPhaseForm({ ...phaseForm, description: e.target.value })}
                  placeholder="What entrepreneurs should accomplish in this phase"
                  className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#526274] mb-1.5">
                  Cohort
                </label>
                <select
                  value={phaseForm.cohort_id}
                  onChange={(e) => setPhaseForm({ ...phaseForm, cohort_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-bold outline-none focus:border-[#00ADEF] cursor-pointer"
                >
                  <option value="">Global (applies to every cohort)</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#526274] mb-1.5">
                  Order
                </label>
                <input
                  type="number"
                  value={phaseForm.order_index}
                  onChange={(e) => setPhaseForm({ ...phaseForm, order_index: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePhaseForm}
                  className="px-5 py-2.5 rounded-xl border border-[#D6E4EA] text-[#526274] font-bold text-xs uppercase tracking-wider hover:bg-[#F6FAFC] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Phase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {taskForm && (
        <div
          className="fixed inset-0 bg-[#111827]/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={closeTaskForm}
        >
          <div
            className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl border border-[#D6E4EA] shadow-lg flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#D6E4EA] flex items-center justify-between bg-[#F6FAFC]">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                  Progress Tracking
                </span>
                <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk']">
                  {taskForm.id ? "Edit Task" : "New Task"}
                </h2>
              </div>
              <button
                onClick={closeTaskForm}
                className="p-2 text-[#526274] hover:bg-white hover:text-[#111827] rounded-xl border border-transparent hover:border-[#D6E4EA] transition-all"
              >
                <X size={22} />
              </button>
            </div>
            <form onSubmit={saveTask} className="overflow-y-auto flex-1 p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#526274] mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Submit business model canvas"
                  className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#526274] mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="What the entrepreneur needs to do / submit"
                  className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#526274] mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#526274] mb-1.5">
                    Order
                  </label>
                  <input
                    type="number"
                    value={taskForm.order_index}
                    onChange={(e) => setTaskForm({ ...taskForm, order_index: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeTaskForm}
                  className="px-5 py-2.5 rounded-xl border border-[#D6E4EA] text-[#526274] font-bold text-xs uppercase tracking-wider hover:bg-[#F6FAFC] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;
