import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Building2,
  LogOut,
  CircleUserRound,
  ShieldCheck,
  Plus,
  CalendarPlus,
  StickyNote,
  MessageSquareText,
  Trash2,
  UserRound,
  ClipboardCheck,
  X,
} from "lucide-react";
import {
  getMentorDashboard,
  getMentorSessions,
  createMentorSession,
  deleteMentorSession,
} from "../../services/portalService";

const MentorPortal = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    session_date: "",
    notes: "",
    feedback: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getMentorDashboard();
      setAssignments(result || []);
    } catch (err) {
      console.error("Error loading mentor dashboard:", err);
      setError("Could not load your assignments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const openSessions = async (assignment) => {
    setSelected(assignment);
    setSessionsLoading(true);
    setShowAdd(false);
    setSaveMsg("");
    setForm({ session_date: "", notes: "", feedback: "" });
    try {
      const result = await getMentorSessions(assignment.assignment_id);
      setSessions(result || []);
    } catch (err) {
      console.error("Error loading sessions:", err);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const closeSessions = () => {
    setSelected(null);
    setSessions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.session_date) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const created = await createMentorSession({
        assignment_id: selected.assignment_id,
        session_date: form.session_date,
        notes: form.notes || "",
        feedback: form.feedback || "",
      });
      if (created) {
        setSessions((prev) => [created, ...prev]);
        setShowAdd(false);
        setForm({ session_date: "", notes: "", feedback: "" });
        setSaveMsg("Session logged successfully.");
      }
    } catch (err) {
      console.error("Error creating session:", err);
      setSaveMsg("Failed to log session. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sessionId) => {
    try {
      await deleteMentorSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/v1/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "/v1/auth/login";
  };

  return (
    <div className="flex h-screen bg-[#F6FAFC] font-sans text-[#111827] overflow-hidden selection:bg-[#E38524] selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 h-screen bg-white border-r border-[#D6E4EA] flex flex-col shrink-0 shadow-sm z-30 select-none">
        <div className="p-5 border-b border-[#D6E4EA] bg-[#F6FAFC]">
          <a href="/" className="block">
            <img
              src="/brand/dxvalley-wordmark.jpeg"
              alt="DxValley"
              className="h-10 w-auto object-contain object-left mix-blend-multiply mb-2"
            />
          </a>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#526274] leading-tight">
            <Building2 size={12} className="text-[#00ADEF] shrink-0" />
            <span>Cooperative Bank of Oromia</span>
          </div>
        </div>

        <a
          href="/v1/auth/profile"
          className="px-4 py-3 bg-[#EAF8FC] border-b border-[#D6E4EA] flex items-center justify-between group hover:bg-white transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#00ADEF] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs overflow-hidden">
              {currentUser.profile_image ? (
                <img
                  src={currentUser.profile_image}
                  alt={currentUser.name || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                (currentUser.name || "M").charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#111827] truncate">
                {currentUser.name || "Mentor"}
              </p>
              <p className="text-[10px] font-semibold text-[#006F9E] flex items-center gap-1">
                <ShieldCheck size={10} className="text-[#00ADEF]" />
                <span className="capitalize">Mentor</span>
              </p>
            </div>
          </div>
          <CircleUserRound size={16} className="text-[#006F9E] shrink-0" />
        </a>

        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#526274]">
            Mentorship
          </div>
          <button
            onClick={closeSessions}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-xs font-bold ${
              !selected
                ? "bg-[#EAF8FC] text-[#006F9E] border-l-4 border-[#00ADEF] shadow-xs"
                : "text-[#526274] hover:bg-[#F6FAFC] hover:text-[#111827]"
            }`}
          >
            <Users size={18} className={!selected ? "text-[#00ADEF]" : "text-[#526274]"} />
            <span>My Entrepreneurs</span>
          </button>
        </nav>

        <div className="p-3 border-t border-[#D6E4EA] bg-[#F6FAFC] space-y-2">
          <a
            href="/"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#D6E4EA] bg-white text-xs font-bold text-[#006F9E] hover:bg-[#EAF8FC] hover:border-[#00ADEF] transition-all shadow-2xs"
          >
            <span>View Public Site</span>
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-all"
          >
            <LogOut size={16} />
            <span>Exit / Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        <div className="bg-gradient-to-br from-[#00ADEF] via-[#078CC8] to-[#0878B4] rounded-2xl p-6 md:p-8 text-white shadow-sm">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[.18em] text-white">
            <span className="h-2 w-2 rounded-full bg-[#E38524]" aria-hidden="true" />
            Mentor Portal
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {selected
              ? selected.entrepreneur_name
              : `Welcome back, ${currentUser.name?.split(" ")[0] || "Mentor"}!`}
          </h1>
          <p className="mt-2 text-sm text-white/85 max-w-2xl leading-relaxed">
            {selected
              ? "Log sessions, share feedback, and track progress notes for this entrepreneur."
              : "Manage your assigned entrepreneurs, log mentorship sessions, and provide feedback."}
          </p>
        </div>

        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#00ADEF] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-[#006F9E]">
                Loading your assignments...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center">
            <p className="text-sm font-bold text-rose-700">{error}</p>
          </div>
        ) : selected ? (
          /* -------- Session management view -------- */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#00ADEF] text-white flex items-center justify-center font-bold text-lg shadow-xs overflow-hidden">
                  {selected.entrepreneur_profile_image ? (
                    <img
                      src={selected.entrepreneur_profile_image}
                      alt={selected.entrepreneur_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selected.entrepreneur_name?.charAt(0)?.toUpperCase() || "E"
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111827]">
                    {selected.entrepreneur_name}
                  </h3>
                  <p className="text-xs text-[#526274] font-semibold">
                    {selected.entrepreneur_email}
                    {selected.entrepreneur_company
                      ? ` • ${selected.entrepreneur_company}`
                      : ""}
                  </p>
                  <p className="text-xs text-[#006F9E] font-bold mt-1">
                    Cohort: {selected.cohort_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all shrink-0"
              >
                <Plus size={18} />
                <span>Log Session</span>
              </button>
            </div>

            {saveMsg && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">
                {saveMsg}
              </div>
            )}

            {showAdd && (
              <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                      Session Logging
                    </span>
                    <h3 className="text-lg font-bold text-[#111827]">
                      New Mentorship Session
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAdd(false)}
                    className="text-[#526274] hover:text-[#111827] transition"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-[.15em] text-[#526274] mb-2">
                      Session Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.session_date}
                      onChange={(e) =>
                        setForm({ ...form, session_date: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium outline-none transition focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-[.15em] text-[#526274] mb-2">
                      Progress Notes
                    </label>
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      placeholder="What was discussed, decisions made, next steps..."
                      className="w-full px-4 py-3 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium outline-none transition focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-[.15em] text-[#526274] mb-2">
                      Feedback to Entrepreneur
                    </label>
                    <textarea
                      rows={3}
                      value={form.feedback}
                      onChange={(e) =>
                        setForm({ ...form, feedback: e.target.value })
                      }
                      placeholder="Constructive feedback and encouragement..."
                      className="w-full px-4 py-3 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium outline-none transition focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all disabled:opacity-50"
                    >
                      <CalendarPlus size={16} />
                      {saving ? "Saving..." : "Save Session"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAdd(false)}
                      className="px-5 py-3 rounded-xl border border-[#D6E4EA] bg-white text-xs font-bold text-[#526274] hover:bg-[#F6FAFC] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                    Session History
                  </span>
                  <h3 className="text-lg font-bold text-[#111827]">
                    Logged Sessions ({sessions.length})
                  </h3>
                </div>
              </div>

              {sessionsLoading ? (
                <div className="py-8 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-[#00ADEF] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-[#526274] font-semibold py-4 text-center">
                  No sessions logged yet. Click "Log Session" to record the
                  first one.
                </p>
              ) : (
                <div className="space-y-4">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl p-5"
                    >
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#006F9E]">
                          <ClipboardCheck size={14} />
                          {new Date(s.session_date).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-rose-500 hover:text-rose-700 transition"
                          title="Delete session"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {s.notes && (
                        <div className="mb-3 flex items-start gap-2">
                          <StickyNote
                            size={15}
                            className="text-[#00ADEF] mt-0.5 shrink-0"
                          />
                          <p className="text-sm text-[#111827] leading-relaxed">
                            {s.notes}
                          </p>
                        </div>
                      )}
                      {s.feedback && (
                        <div className="flex items-start gap-2">
                          <MessageSquareText
                            size={15}
                            className="text-[#E38524] mt-0.5 shrink-0"
                          />
                          <p className="text-sm text-[#526274] leading-relaxed">
                            <strong className="text-[#111827]">Feedback:</strong>{" "}
                            {s.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* -------- Assigned entrepreneurs list -------- */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-[#D6E4EA] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20">
                    <Users size={22} />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-extrabold text-[#111827] tracking-tight">
                    {assignments.length}
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#526274]">
                    Assigned Entrepreneurs
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#D6E4EA] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#FFF1E3] text-[#E38524] border border-[#E38524]/20">
                    <ClipboardCheck size={22} />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-extrabold text-[#111827] tracking-tight">
                    {assignments.reduce((acc, a) => acc + (a.session_count || 0), 0)}
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#526274]">
                    Total Sessions Logged
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#D6E4EA] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20">
                    <UserRound size={22} />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-extrabold text-[#111827] tracking-tight">
                    {assignments.filter((a) => a.session_count > 0).length}
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#526274]">
                    Entrepreneurs With Sessions
                  </p>
                </div>
              </div>
            </div>

            {assignments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#D6E4EA] p-8 text-center">
                <p className="text-sm font-bold text-[#526274]">
                  No entrepreneurs are assigned to you yet. The program
                  coordinator will assign you shortly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {assignments.map((a) => (
                  <div
                    key={a.assignment_id}
                    className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-full bg-[#00ADEF] text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden">
                        {a.entrepreneur_profile_image ? (
                          <img
                            src={a.entrepreneur_profile_image}
                            alt={a.entrepreneur_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          a.entrepreneur_name?.charAt(0)?.toUpperCase() || "E"
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#111827] text-sm truncate">
                          {a.entrepreneur_name}
                        </p>
                        <p className="text-xs text-[#526274] font-semibold truncate">
                          {a.entrepreneur_email}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4 text-xs text-[#526274] font-semibold">
                      <p className="flex items-center gap-2">
                        <Building2 size={13} className="text-[#00ADEF]" />
                        {a.entrepreneur_company || "Startup"}
                      </p>
                      <p className="flex items-center gap-2">
                        <ClipboardCheck size={13} className="text-[#00ADEF]" />
                        Cohort: {a.cohort_name} • {a.session_count || 0} sessions
                      </p>
                    </div>
                    <button
                      onClick={() => openSessions(a)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20 text-xs font-bold hover:bg-[#dff2fa] transition-all"
                    >
                      <ClipboardCheck size={15} />
                      Manage Sessions
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorPortal;
