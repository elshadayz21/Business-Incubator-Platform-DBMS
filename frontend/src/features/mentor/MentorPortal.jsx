import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Building2,
  Plus,
  CalendarPlus,
  StickyNote,
  MessageSquareText,
  Trash2,
  UserRound,
  ClipboardCheck,
  X,
  Bell,
  Scroll,
  HandCoins,
  GraduationCap,
  Rocket,
  Pencil,
  PanelLeftClose,
  PanelLeftOpen,
  MessageCircle,
} from "lucide-react";
import {
  getMentorDashboard,
  getMentorSessions,
  createMentorSession,
  deleteMentorSession,
} from "../../services/portalService";
import UserMenu from "../../components/UserMenu";
import ChatPanel from "../../components/ChatPanel";

const MentorPortal = () => {
  const [assignments, setAssignments] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [respondingInvId, setRespondingInvId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTabState] = useState(() => {
    return sessionStorage.getItem("mentor_active_tab") || "My Entrepreneurs";
  });

  const setActiveTab = (tab) => {
    sessionStorage.setItem("mentor_active_tab", tab);
    setActiveTabState(tab);
  };
  const [collapsed, setCollapsed] = useState(() => {
    return sessionStorage.getItem("sidebar_collapsed") === "true";
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      sessionStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

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
  const [responseInputs, setResponseInputs] = useState({});
  const [responseSending, setResponseSending] = useState({});
  const [editingResponse, setEditingResponse] = useState({});
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declineSending, setDeclineSending] = useState(false);

  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");

  const handleSendMentorResponse = async (sessionId) => {
    const text = (responseInputs[sessionId] || "").trim();
    if (!text) return;
    setResponseSending((prev) => ({ ...prev, [sessionId]: true }));
    try {
      const res = await fetch(`/api/portal/mentor/sessions/${sessionId}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: text }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setResponseInputs((prev) => ({ ...prev, [sessionId]: "" }));
        setEditingResponse((prev) => ({ ...prev, [sessionId]: false }));
        if (selected) openSessions(selected);
      } else {
        alert(result.error || "Failed to send response.");
      }
    } catch (err) {
      console.error("Error sending response:", err);
      alert("Failed to send response. Please try again.");
    } finally {
      setResponseSending((prev) => ({ ...prev, [sessionId]: false }));
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getMentorDashboard();
      setAssignments(result?.assignments || []);
      setInvitations(result?.invitations || []);
      setNotifications(result?.notifications || []);
      setActivityLogs(result?.activityLogs || []);
    } catch (err) {
      console.error("Error loading mentor dashboard:", err);
      setError("Could not load your dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRespondInvitation = async (invitationId, action, reason = "") => {
    setRespondingInvId(invitationId);
    try {
      const res = await fetch(`/api/portal/mentor/invitations/${invitationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(action === "accept" ? "You have accepted the project mentorship invitation!" : "You have declined the project invitation.");
        setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
        fetchDashboard();
        return true;
      } else {
        alert(data.error || "Failed to process invitation.");
        return false;
      }
    } catch (err) {
      console.error("Error responding to invitation:", err);
      alert("Server error processing your response.");
      return false;
    } finally {
      setRespondingInvId(null);
    }
  };

  const handleConfirmDecline = async () => {
    if (!declineReason.trim()) return;
    setDeclineSending(true);
    const ok = await handleRespondInvitation(declineTarget.id, "decline", declineReason.trim());
    setDeclineSending(false);
    if (ok) {
      setDeclineTarget(null);
      setDeclineReason("");
    }
  };

  useEffect(() => {
    document.title = "Dx Valley ICMS - Mentor Portal";
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (activeTab === "Notifications" && unreadNotifications > 0) {
      fetch("/api/portal/notifications/read", { method: "POST" })
        .then(() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        })
        .catch((err) => console.error("Error marking notifications as read:", err));
    }
  }, [activeTab, unreadNotifications]);

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
    window.location.href = "/admin/login";
  };

  const navItems = [
    { id: 1, icon: Users, label: "My Entrepreneurs" },
    { id: 2, icon: Bell, label: "Notifications", badge: unreadNotifications || null },
    { id: 3, icon: Scroll, label: "Activity Timeline" },
    { id: 4, icon: MessageCircle, label: "Chat" },
  ];

  return (
    <div className="flex h-screen bg-[#F6FAFC] font-sans text-[#111827] overflow-hidden selection:bg-[#E38524] selection:text-white">
      {/* Sidebar */}
      <aside
        className={`h-screen bg-white border-r border-[#D6E4EA] flex flex-col shrink-0 font-sans shadow-sm z-30 select-none transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="p-4 border-b border-[#D6E4EA] bg-[#F6FAFC] flex items-center justify-between">
          {!collapsed ? (
            <>
              <div className="min-w-0 flex-1">
                <a href="/" className="block">
                  <img
                    src="/brand/dxvalley-wordmark.jpeg"
                    alt="DxValley"
                    className="h-9 w-auto object-contain object-left mix-blend-multiply mb-1"
                  />
                </a>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#526274] leading-tight truncate">
                  <Building2 size={12} className="text-[#00ADEF] shrink-0" />
                  <span className="truncate">Cooperative Bank of Oromia</span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg border border-[#D6E4EA] bg-white text-[#526274] hover:bg-[#EAF8FC] hover:text-[#006F9E] transition shrink-0 ml-2"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col items-center justify-center gap-1.5 py-1">
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-2 rounded-xl border border-[#D6E4EA] bg-white text-[#006F9E] hover:bg-[#EAF8FC] transition shadow-xs"
                title="Expand sidebar"
              >
                <PanelLeftOpen size={20} />
              </button>
              <span className="text-[10px] font-extrabold text-[#00ADEF] tracking-tight uppercase">
                Dx
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          <div
            className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#526274] ${
              collapsed ? "text-center text-[9px]" : ""
            }`}
          >
            {collapsed ? "MENU" : "Mentorship"}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.label && !selected;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.label);
                  closeSessions();
                }}
                title={item.label}
                className={`w-full flex items-center rounded-xl transition-all text-xs font-bold ${
                  collapsed ? "justify-center p-3" : "justify-between px-3.5 py-3"
                } ${
                  isActive
                    ? "bg-[#EAF8FC] text-[#006F9E] border-l-4 border-[#00ADEF] shadow-xs"
                    : "text-[#526274] hover:bg-[#F6FAFC] hover:text-[#111827]"
                }`}
              >
                <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                  <Icon
                    size={20}
                    className={isActive ? "text-[#00ADEF]" : "text-[#526274]"}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </div>

                {!collapsed && item.badge ? (
                  <span className="ml-auto rounded-full bg-[#E38524] text-white min-w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex items-center justify-end border-b border-[#D6E4EA] bg-white/95 px-6 py-3 backdrop-blur">
          <UserMenu
            user={currentUser}
            roleLabel="Mentor"
            unreadCount={unreadNotifications}
            onNotifications={() => {
              setActiveTab("Notifications");
              closeSessions();
            }}
            onLogout={handleLogout}
          />
        </header>
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
                Loading your dashboard...
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
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/assets/images/default-avatar.svg";
                      }}
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
                    {selected.cohort_name ? `Cohort: ${selected.cohort_name}` : selected.project_name ? `Project: ${selected.project_name}` : "Assigned Mentorship"}
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
                      {s.entrepreneur_reply && (
                        <div className="space-y-3 mt-3">
                          <div className="flex items-start gap-2 bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5">
                            <MessageSquareText size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm text-emerald-900 leading-relaxed">
                                <strong className="text-emerald-800">Entrepreneur Reply:</strong> {s.entrepreneur_reply}
                              </p>
                              {s.reply_at && (
                                <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                                  {new Date(s.reply_at).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {s.mentor_response && (
                            <div className="flex items-start justify-between gap-2 bg-[#EAF8FC] border border-[#00ADEF]/20 rounded-xl p-3.5 ml-4">
                              <div className="flex items-start gap-2">
                                <MessageSquareText size={15} className="text-[#00ADEF] mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-sm text-[#111827] leading-relaxed">
                                    <strong className="text-[#006F9E]">Your Follow-up Response:</strong> {s.mentor_response}
                                  </p>
                                  {s.mentor_response_at && (
                                    <span className="text-[10px] text-[#526274] font-semibold block mt-1">
                                      {new Date(s.mentor_response_at).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setResponseInputs({ ...responseInputs, [s.id]: s.mentor_response });
                                  setEditingResponse({ ...editingResponse, [s.id]: true });
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006F9E] hover:text-[#00ADEF] bg-white border border-[#00ADEF]/30 rounded-lg px-2.5 py-1 hover:bg-[#dff2fa] transition shrink-0"
                              >
                                <Pencil size={12} /> Edit
                              </button>
                            </div>
                          )}

                          <div className="pt-2 border-t border-[#D6E4EA]">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder={editingResponse[s.id] ? "Edit your response..." : "Reply back to entrepreneur..."}
                                value={responseInputs[s.id] || ""}
                                onChange={(e) => setResponseInputs({ ...responseInputs, [s.id]: e.target.value })}
                                onKeyDown={(e) => e.key === "Enter" && handleSendMentorResponse(s.id)}
                                className="flex-1 px-3.5 py-2 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium outline-none focus:border-[#00ADEF]"
                              />
                              <button
                                onClick={() => handleSendMentorResponse(s.id)}
                                disabled={responseSending[s.id] || !responseInputs[s.id]?.trim()}
                                className="px-4 py-2 bg-[#E38524] text-white text-xs font-extrabold rounded-xl hover:bg-[#C97019] disabled:opacity-40 transition shrink-0"
                              >
                                {responseSending[s.id] ? "Saving..." : editingResponse[s.id] ? "Update" : "Reply"}
                              </button>
                              {editingResponse[s.id] && (
                                <button
                                  onClick={() => {
                                    setEditingResponse({ ...editingResponse, [s.id]: false });
                                    setResponseInputs({ ...responseInputs, [s.id]: "" });
                                  }}
                                  className="px-3 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition shrink-0"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "Notifications" ? (
          /* -------- Notifications view -------- */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                    Alerts
                  </span>
                  <h3 className="text-lg font-bold text-[#111827]">
                    Notifications
                  </h3>
                </div>
                {unreadNotifications > 0 && (
                  <span className="rounded-full bg-[#E38524] text-white px-2.5 py-1 text-[10px] font-bold">
                    {unreadNotifications} unread
                  </span>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-[#526274] mt-4 font-semibold">
                  All caught up! No notifications.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-[#D6E4EA] border border-[#D6E4EA] rounded-xl overflow-hidden">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-4 p-4 ${
                        !n.read
                          ? "border-l-4 border-[#00ADEF] bg-[#EAF8FC]/50"
                          : "bg-white"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#EAF8FC] flex items-center justify-center text-[#006F9E] shrink-0 border border-[#00ADEF]/20">
                        {n.type === "funding" ? (
                          <HandCoins size={16} />
                        ) : n.type === "workshop" ? (
                          <GraduationCap size={16} />
                        ) : n.type === "project" ? (
                          <Rocket size={16} />
                        ) : (
                          <Bell size={16} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#111827] leading-relaxed">
                          {n.message}
                        </p>
                        <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-[#526274]">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "Activity Timeline" ? (
          /* -------- Activity Timeline view -------- */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                    History
                  </span>
                  <h3 className="text-lg font-bold text-[#111827]">
                    Activity Timeline
                  </h3>
                </div>
              </div>
              {activityLogs.length === 0 ? (
                <p className="text-sm text-[#526274] mt-4 font-semibold">
                  No activity yet. Actions you take will appear here.
                </p>
              ) : (
                <div className="mt-6 relative pl-6 border-l-2 border-[#00ADEF]/30 space-y-6">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[30px] top-1.5 h-4 w-4 rounded-full border-4 border-white bg-[#00ADEF] shadow" />
                      <div className="rounded-xl border border-[#D6E4EA] bg-[#F6FAFC] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="rounded-full bg-[#00ADEF] text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            {log.action_type}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-[#526274]">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-[#111827]">
                          {log.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "Chat" ? (
          /* -------- Chat view -------- */
          <ChatPanel currentUser={currentUser} />
        ) : (
          /* -------- Assigned entrepreneurs list -------- */
          <div className="space-y-6">
            {invitations.length > 0 && (
              <div className="bg-[#FFF1E3]/80 border border-[#E38524]/40 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Rocket className="text-[#E38524]" size={20} />
                    <h3 className="text-base font-bold text-[#111827] font-['Space_Grotesk']">
                      Pending Project Mentorship Invitations ({invitations.length})
                    </h3>
                  </div>
                  <span className="text-xs font-extrabold px-3 py-1 bg-[#E38524] text-white rounded-full">
                    Action Required
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="bg-white border border-[#D6E4EA] rounded-xl p-4 shadow-xs space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-sm text-[#111827]">{inv.project_name}</h4>
                          <p className="text-xs text-[#526274] mt-0.5">
                            Domain: <strong className="text-[#111827]">{inv.project_domain || "General"}</strong> • Stage: <strong className="text-[#006F9E]">{inv.project_stage || "Idea"}</strong>
                          </p>
                        </div>
                      </div>

                      {inv.founder_name && (
                        <p className="text-xs text-[#526274]">
                          Lead Founder: <strong className="text-[#111827]">{inv.founder_name}</strong> ({inv.founder_email})
                        </p>
                      )}

                      {inv.message && (
                        <p className="text-xs text-slate-600 italic bg-[#F6FAFC] p-2.5 rounded-lg border border-[#D6E4EA]">
                          "{inv.message}"
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleRespondInvitation(inv.id, "accept")}
                          disabled={respondingInvId === inv.id}
                          className="flex-1 py-2 px-3 bg-[#00ADEF] text-white text-xs font-extrabold rounded-xl hover:bg-[#006F9E] disabled:opacity-50 transition shadow-2xs"
                        >
                          {respondingInvId === inv.id ? "Processing..." : "Accept & Mentor Project"}
                        </button>
                        <button
                          onClick={() => {
                            setDeclineTarget(inv);
                            setDeclineReason("");
                          }}
                          disabled={respondingInvId === inv.id}
                          className="py-2 px-3 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl hover:bg-rose-100 disabled:opacity-50 transition"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/assets/images/default-avatar.svg";
                            }}
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
                        {a.cohort_name ? `Cohort: ${a.cohort_name}` : a.project_name ? `Project: ${a.project_name}` : "Mentorship"} • {a.session_count || 0} sessions
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
        {/* -------- Decline Reason Modal -------- */}
        {declineTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl border border-[#D6E4EA] shadow-xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                    Decline Invitation
                  </span>
                  <h3 className="text-lg font-bold text-[#111827] font-['Space_Grotesk']">
                    Why are you declining "{declineTarget.project_name}"?
                  </h3>
                </div>
                <button
                  onClick={() => setDeclineTarget(null)}
                  disabled={declineSending}
                  className="text-[#526274] hover:text-[#111827] transition disabled:opacity-40"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-xs text-[#526274] leading-relaxed">
                Your reason helps the program coordinator invite another suitable
                mentor and lets the founders know why.
              </p>

              <textarea
                rows={4}
                autoFocus
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. My schedule is full this cohort, the domain is outside my expertise, etc."
                className="w-full px-4 py-3 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium outline-none transition focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20 resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setDeclineTarget(null)}
                  disabled={declineSending}
                  className="px-5 py-3 rounded-xl border border-[#D6E4EA] bg-white text-xs font-bold text-[#526274] hover:bg-[#F6FAFC] disabled:opacity-40 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDecline}
                  disabled={!declineReason.trim() || declineSending}
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider hover:bg-rose-700 disabled:opacity-40 transition"
                >
                  {declineSending ? "Declining..." : "Confirm Decline"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default MentorPortal;
