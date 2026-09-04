import { useState, useEffect, useCallback } from "react";
import {
  Layers,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  RotateCcw,
  Send,
  Loader2,
  Inbox,
  Paperclip,
  Link as LinkIcon,
  History,
  X,
} from "lucide-react";

const statusMeta = (status) => {
  switch (status) {
    case "approved":
      return { label: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 };
    case "changes_requested":
      return { label: "Changes Requested", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: RotateCcw };
    case "rejected":
      return { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-200", icon: X };
    case "submitted":
      return { label: "Awaiting Review", cls: "bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/20", icon: Clock };
    default:
      return { label: "Not Started", cls: "bg-[#F6FAFC] text-[#526274] border-[#D6E4EA]", icon: Clock };
  }
};

const ProgressTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({});
  const [submitTask, setSubmitTask] = useState(null); // task being submitted against
  const [form, setForm] = useState({ title: "", notes: "", link_url: "", file: null });
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState(null); // { task, entries }
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/portal/entrepreneur/progress", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Error loading progress:", err);
      setError("Could not load your progress. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const toggleExpanded = (phaseId) =>
    setExpanded((prev) => {
      const currentlyOpen = prev[phaseId] !== false; // default open
      return { ...prev, [phaseId]: !currentlyOpen };
    });

  const openSubmitForm = (task) => {
    setSubmitTask(task);
    setForm({ title: task.submission_title || task.title, notes: "", link_url: "", file: null });
  };
  const closeSubmitForm = () => {
    setSubmitTask(null);
    setForm({ title: "", notes: "", link_url: "", file: null });
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submitTask) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("task_id", submitTask.id);
      fd.append("title", form.title);
      fd.append("notes", form.notes);
      if (form.link_url) fd.append("link_url", form.link_url);
      if (form.file) fd.append("file", form.file);

      const res = await fetch("/api/portal/entrepreneur/progress/submit", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(result.message || result.error || "Failed to submit work.");
        return;
      }
      closeSubmitForm();
      fetchProgress();
    } catch (err) {
      console.error("Error submitting work:", err);
      alert("Failed to submit work. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openHistory = async (task) => {
    setHistory({ task, entries: [] });
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/portal/entrepreneur/progress/tasks/${task.id}/history`, {
        credentials: "include",
      });
      const entries = await res.json();
      setHistory({ task, entries: Array.isArray(entries) ? entries : [] });
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#D6E4EA]">
        <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={32} />
        <p className="text-[#526274] font-bold text-sm">Loading your progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center">
        <p className="text-sm font-bold text-rose-700">{error}</p>
      </div>
    );
  }

  if (!data?.project) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#D6E4EA] text-center p-6">
        <div className="p-4 bg-[#EAF8FC] rounded-full text-[#00ADEF] mb-3">
          <Inbox size={36} />
        </div>
        <h3 className="text-lg font-bold text-[#111827]">No project yet</h3>
        <p className="text-xs text-[#526274] mt-1 max-w-sm">
          Once you have a project set up with the incubator, phases and tasks will appear here.
        </p>
      </div>
    );
  }

  const phases = data.phases || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#111827] font-['Space_Grotesk']">Progress</h1>
        <p className="text-xs text-[#526274] mt-1">
          Track your journey through each phase and submit work for your mentor to review.
        </p>
      </div>

      {phases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#D6E4EA] text-center p-6">
          <div className="p-4 bg-[#EAF8FC] rounded-full text-[#00ADEF] mb-3">
            <Layers size={36} />
          </div>
          <h3 className="text-lg font-bold text-[#111827]">No phases published yet</h3>
          <p className="text-xs text-[#526274] mt-1 max-w-sm">
            Your program hasn't published a progress roadmap yet — check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {phases.map((phase) => {
            const isOpen = expanded[phase.id] !== false; // default open
            const doneCount = phase.tasks.filter((t) => t.submission_status === "approved").length;
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
                      <h3 className="font-bold text-[#111827] text-sm truncate">{phase.name}</h3>
                      {phase.description && (
                        <p className="text-xs text-[#526274] mt-0.5 truncate">{phase.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20 shrink-0">
                    {doneCount}/{phase.tasks.length} approved
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-[#D6E4EA] divide-y divide-[#D6E4EA]">
                    {phase.tasks.length === 0 ? (
                      <p className="text-xs text-[#526274] italic p-5">No tasks in this phase yet.</p>
                    ) : (
                      phase.tasks.map((task) => {
                        const meta = statusMeta(task.submission_status);
                        const Icon = meta.icon;
                        return (
                          <div key={task.id} className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-sm text-[#111827]">{task.title}</p>
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}
                                >
                                  <Icon size={11} /> {meta.label}
                                </span>
                              </div>
                              {task.description && (
                                <p className="text-xs text-[#526274] mt-1">{task.description}</p>
                              )}
                              {task.due_date && (
                                <p className="text-[10px] font-bold text-[#526274] mt-1.5 flex items-center gap-1">
                                  <Clock size={11} /> Due {new Date(task.due_date).toLocaleDateString()}
                                </p>
                              )}
                              {task.submission_status === "changes_requested" && task.review_feedback && (
                                <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                                  <span className="font-bold">Mentor feedback: </span>
                                  {task.review_feedback}
                                </div>
                              )}
                              {task.submission_status === "approved" && task.review_feedback && (
                                <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
                                  <span className="font-bold">Mentor feedback: </span>
                                  {task.review_feedback}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {task.submission_id && (
                                <button
                                  onClick={() => openHistory(task)}
                                  className="p-2 text-[#526274] hover:text-[#006F9E] hover:bg-[#EAF8FC] rounded-lg transition"
                                  title="View submission history"
                                >
                                  <History size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => openSubmitForm(task)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E38524] text-white text-xs font-bold hover:bg-[#C97019] transition whitespace-nowrap"
                              >
                                <Send size={13} />
                                {task.submission_id ? "Resubmit" : "Submit Work"}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Work Modal */}
      {submitTask && (
        <div
          className="fixed inset-0 bg-[#111827]/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={closeSubmitForm}
        >
          <div
            className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl border border-[#D6E4EA] shadow-lg flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#D6E4EA] flex items-center justify-between bg-[#F6FAFC]">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                  Submit Work
                </span>
                <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk']">
                  {submitTask.title}
                </h2>
              </div>
              <button
                onClick={closeSubmitForm}
                className="p-2 text-[#526274] hover:bg-white hover:text-[#111827] rounded-xl border border-transparent hover:border-[#D6E4EA] transition-all"
              >
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmitWork} className="overflow-y-auto flex-1 p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#526274] mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#526274] mb-1.5">
                  Notes for your mentor
                </label>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Describe what you're submitting and anything you'd like feedback on"
                  className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#526274] mb-1.5 flex items-center gap-1.5">
                  <LinkIcon size={12} /> Link (optional)
                </label>
                <input
                  type="url"
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  placeholder="https://github.com/... or a Google Drive link"
                  className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#526274] mb-1.5 flex items-center gap-1.5">
                  <Paperclip size={12} /> Attach a file (optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                  onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
                  className="w-full text-xs font-medium text-[#526274] file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#EAF8FC] file:text-[#006F9E] hover:file:bg-[#00ADEF]/20"
                />
                <p className="text-[10px] text-[#526274] mt-1">PDF, DOC, DOCX, ZIP, PNG or JPG, up to 10MB.</p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeSubmitForm}
                  className="px-5 py-2.5 rounded-xl border border-[#D6E4EA] text-[#526274] font-bold text-xs uppercase tracking-wider hover:bg-[#F6FAFC] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Work"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {history && (
        <div
          className="fixed inset-0 bg-[#111827]/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setHistory(null)}
        >
          <div
            className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl border border-[#D6E4EA] shadow-lg flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#D6E4EA] flex items-center justify-between bg-[#F6FAFC]">
              <h2 className="text-lg font-bold text-[#111827] font-['Space_Grotesk']">
                Submission History — {history.task.title}
              </h2>
              <button
                onClick={() => setHistory(null)}
                className="p-2 text-[#526274] hover:bg-white hover:text-[#111827] rounded-xl border border-transparent hover:border-[#D6E4EA] transition-all"
              >
                <X size={22} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-3">
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="text-[#00ADEF] animate-spin" size={24} />
                </div>
              ) : history.entries.length === 0 ? (
                <p className="text-xs text-[#526274] italic">No submissions yet.</p>
              ) : (
                history.entries.map((entry) => {
                  const meta = statusMeta(entry.status);
                  const Icon = meta.icon;
                  return (
                    <div key={entry.id} className="p-4 rounded-xl border border-[#D6E4EA] bg-[#F6FAFC]/50">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-bold text-sm text-[#111827]">{entry.title}</p>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}
                        >
                          <Icon size={11} /> {meta.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#526274] mt-1">
                        Submitted {new Date(entry.submitted_at).toLocaleString()}
                      </p>
                      {entry.notes && <p className="text-xs text-[#111827] mt-2">{entry.notes}</p>}
                      {entry.link_url && (
                        <a
                          href={entry.link_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#006F9E] font-bold mt-2 inline-flex items-center gap-1 hover:underline"
                        >
                          <LinkIcon size={12} /> View link
                        </a>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTab;
