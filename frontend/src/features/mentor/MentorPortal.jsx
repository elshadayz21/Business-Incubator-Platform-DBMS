import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Building2,
  MessageSquareText,
  ClipboardCheck,
  X,
  Bell,
  Scroll,
  HandCoins,
  GraduationCap,
  Rocket,
  PanelLeftClose,
  PanelLeftOpen,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import { getMentorDashboard } from "../../services/portalService";
import UserMenu from "../../components/UserMenu";
import ChatPanel from "../../components/ChatPanel";
import ProgressReview from "./ProgressReview";

const MentorPortal = () => {
  const [assignments, setAssignments] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [respondingInvId, setRespondingInvId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTabState] = useState(() => {
    return sessionStorage.getItem("mentor_active_tab") || "My Mentees";
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

  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declineSending, setDeclineSending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [chatContact, setChatContact] = useState(null);

  // Deep-link support: an email "new message" notification links back with
  // ?openChat=<userId>. App.jsx stashes that id in sessionStorage (it
  // survives the login redirect for signed-out visitors); once this portal
  // mounts we consume it once, jump to the Chat tab, and hand the id to
  // ChatPanel so it can open that conversation.
  const [openChatId, setOpenChatId] = useState(null);
  useEffect(() => {
    const pending = sessionStorage.getItem("pending_open_chat");
    if (pending) {
      sessionStorage.removeItem("pending_open_chat");
      setOpenChatId(pending);
      setActiveTab("Chat");
    }
  }, []);

  // Same idea for other notification emails (mentor invitation/session
  // updates), which deep-link to a specific tab rather than a chat contact.
  useEffect(() => {
    const pendingTab = sessionStorage.getItem("pending_open_tab");
    if (pendingTab) {
      sessionStorage.removeItem("pending_open_tab");
      setActiveTab(pendingTab);
    }
  }, []);

  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getMentorDashboard();
      setAssignments(result?.assignments || []);
      setCurrentPage(1);
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
    { id: 1, icon: Users, label: "My Mentees" },
    { id: 5, icon: TrendingUp, label: "Progress" },
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
            const isActive = activeTab === item.label;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.label);
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
            }}
            onLogout={handleLogout}
          />
        </header>
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">

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
          <ChatPanel currentUser={currentUser} initialContact={chatContact} openContactId={openChatId} />
        ) : activeTab === "Progress" ? (
          /* -------- Progress Review view -------- */
          <ProgressReview />
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

            {assignments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#D6E4EA] p-8 text-center">
                <p className="text-sm font-bold text-[#526274]">
                  No mentees are assigned to you yet. The program
                  coordinator will assign you shortly.
                </p>
              </div>
            ) : (
              (() => {
                const totalPages = Math.ceil(assignments.length / rowsPerPage);
                const safeCurrent = Math.min(currentPage, totalPages);
                const startIdx = (safeCurrent - 1) * rowsPerPage;
                const paginated = assignments.slice(startIdx, startIdx + rowsPerPage);
                return (
                  <>
                    <div className="overflow-x-auto rounded-2xl border border-[#D6E4EA] shadow-xs">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-[#F0F7FA] text-[#526274] text-xs font-bold uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4">#</th>
                            <th className="px-6 py-4">Entrepreneur</th>
                            <th className="px-6 py-4">Company</th>
                            <th className="px-6 py-4">Cohort / Project</th>
                            <th className="px-6 py-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D6E4EA]">
                          {paginated.map((a, idx) => (
                            <tr
                              key={a.assignment_id}
                              className="bg-white hover:bg-[#F0F7FA] transition-all"
                            >
                              <td className="px-6 py-4 text-xs font-bold text-[#526274]">
                                {startIdx + idx + 1}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-[#00ADEF] text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden flex-shrink-0">
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
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-[#526274]">
                                  <Building2 size={13} className="text-[#00ADEF] flex-shrink-0" />
                                  {a.entrepreneur_company || "Startup"}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-[#526274]">
                                  <ClipboardCheck size={13} className="text-[#00ADEF] flex-shrink-0" />
                                  {a.cohort_name ? `Cohort: ${a.cohort_name}` : a.project_name ? `Project: ${a.project_name}` : "Mentorship"}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => {
                                    setChatContact({
                                      id: a.entrepreneur_id,
                                      name: a.entrepreneur_name,
                                      email: a.entrepreneur_email,
                                      role: "entrepreneur",
                                      profile_image: a.entrepreneur_profile_image || null,
                                    });
                                    setActiveTab("Chat");
                                  }}
                                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20 text-xs font-bold hover:bg-[#dff2fa] transition-all"
                                >
                                  <MessageSquareText size={15} />
                                  Contact
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-xs font-semibold text-[#526274]">
                          Showing {startIdx + 1}–{Math.min(startIdx + rowsPerPage, assignments.length)} of {assignments.length} entrepreneurs
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={safeCurrent === 1}
                            className="px-4 py-2 rounded-xl text-xs font-bold border border-[#D6E4EA] bg-white text-[#526274] hover:bg-[#F0F7FA] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            Previous
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                                page === safeCurrent
                                  ? "bg-[#00ADEF] text-white shadow-sm"
                                  : "bg-white text-[#526274] border border-[#D6E4EA] hover:bg-[#F0F7FA]"
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                          <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={safeCurrent === totalPages}
                            className="px-4 py-2 rounded-xl text-xs font-bold border border-[#D6E4EA] bg-white text-[#526274] hover:bg-[#F0F7FA] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()
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
