import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  GraduationCap,
  HandCoins,
  Rocket,
  Building2,
  CheckCircle2,
  Clock,
  UserRound,
  Layers,
  Calendar,
  Bell,
  Scroll,
  BarChart3,
  Pencil,
  PanelLeftClose,
  PanelLeftOpen,
  MessageCircle,
} from "lucide-react";
import { getEntrepreneurDashboard } from "../../services/portalService";
import UserMenu from "../../components/UserMenu";
import ChatPanel from "../../components/ChatPanel";

const STAGES = ["idea", "mvp", "scale-up"];

const statusStyle = (status = "") => {
  const s = status.toLowerCase();
  if (["accepted", "approved", "active", "funded", "in_progress"].includes(s))
    return { label: status, cls: "bg-green-50 text-green-700 border-green-200" };
  if (["pending", "review", "under_review", "requested"].includes(s))
    return { label: status, cls: "bg-amber-50 text-amber-700 border-amber-200" };
  if (["rejected", "inactive", "denied", "cancelled"].includes(s))
    return { label: status, cls: "bg-rose-50 text-rose-700 border-rose-200" };
  return { label: status, cls: "bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/20" };
};

const StageBadge = ({ status }) => {
  const { label, cls } = statusStyle(status);
  return (
      <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cls}`}
      >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {label}
    </span>
  );
};

const EntrepreneurPortal = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTabState] = useState(() => {
    return sessionStorage.getItem("entrepreneur_active_tab") || "Dashboard";
  });

  // FIX: Moved mentorFilter state to the top level so it doesn't break React Hooks rules!
  const [mentorFilter, setMentorFilter] = useState('all');
  // State to hold the mentor we want to chat with
  const [activeChatContact, setActiveChatContact] = useState(null);
  // State for unread chat messages
  const [unreadMessages, setUnreadMessages] = useState(0);
    const [activityLogPage, setActivityLogPage] = useState(1);
    const [notificationPage, setNotificationPage] = useState(1);
    const [fundingPage, setFundingPage] = useState(1);
    const [browseWorkshops, setBrowseWorkshops] = useState([]);
    const [browseLoading, setBrowseLoading] = useState(false);
    const [enrolling, setEnrolling] = useState({});
    const [showBrowseCatalog, setShowBrowseCatalog] = useState(false);
  const setActiveTab = (tab) => {
    sessionStorage.setItem("entrepreneur_active_tab", tab);
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
  const [replyInputs, setReplyInputs] = useState({});
  const [replySending, setReplySending] = useState({});
  const [editingReply, setEditingReply] = useState({});

  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");

  // Function to handle starting a chat
  // Function to handle starting a chat
  const handleStartChat = (mentor) => {
    if (!mentor.is_assigned) {
      alert("Warning: You can only start conversations with your own assigned mentors!");
      return;
    }

    // Format the mentor data so ChatPanel can read it
    const contactData = {
      id: mentor.mentor_id,
      name: mentor.mentor_name,
      email: mentor.mentor_email,
      role: 'mentor'
    };
    setActiveChatContact(contactData);
    setActiveTab("Chat"); // Switch to the Chat tab instantly!
  };

  const handleSendReply = async (sessionId) => {
    const text = (replyInputs[sessionId] || "").trim();
    if (!text) return;
    setReplySending((prev) => ({ ...prev, [sessionId]: true }));
    try {
      const res = await fetch(`/api/portal/entrepreneur/sessions/${sessionId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: text }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setReplyInputs((prev) => ({ ...prev, [sessionId]: "" }));
        setEditingReply((prev) => ({ ...prev, [sessionId]: false }));
        fetchData();
      } else {
        alert(result.error || "Failed to send reply.");
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Failed to send reply. Please try again.");
    } finally {
      setReplySending((prev) => ({ ...prev, [sessionId]: false }));
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getEntrepreneurDashboard();
      setData(result);
    } catch (err) {
      console.error("Error loading entrepreneur dashboard:", err);
      setError("Could not load your dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

    const fetchBrowseWorkshops = useCallback(async () => {
        try {
            setBrowseLoading(true);
            const res = await fetch("/api/portal/entrepreneur/workshops/browse", {
                credentials: "include",
            });
            const data = await res.json();
            setBrowseWorkshops(data.workshops || []);
        } catch (err) {
            console.error("Error loading workshops:", err);
            setBrowseWorkshops([]);
        } finally {
            setBrowseLoading(false);
        }
    }, []);

  const user = data?.user;
  const application = data?.application;
  const projects = data?.projects || [];
  const cohorts = data?.cohorts || [];
  const mentors = data?.mentors || [];
  const mentorSessions = data?.mentorSessions || [];
  const funding = data?.funding || [];
  const milestones = data?.milestones || [];
  const workshops = data?.workshops || [];
  const notifications = data?.notifications || [];
  const activityLogs = data?.activityLogs || [];
  const stats = data?.stats || [];
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    document.title = "Dx Valley ICMS - Entrepreneur Portal";
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "Notifications" && notifications.length > 0 && unreadNotifications > 0) {
      fetch("/api/portal/notifications/read", { method: "POST" })
          .then(() => {
            setData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                notifications: prev.notifications.map((n) => ({ ...n, read: true })),
              };
            });
          })
          .catch((err) => console.error("Error marking notifications as read:", err));
    }
  }, [activeTab, notifications.length, unreadNotifications]);

    // Fetch unread chat messages for the sidebar badge
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await fetch("/api/portal/chat/unread-count", { credentials: "include" });
                const data = await res.json();
                setUnreadMessages(data.count || 0);
            } catch (e) {}
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, [activeTab]); // Re-check when they switch tabs

    // Load workshop catalog data when the My Workshops tab opens
    useEffect(() => {
        if (activeTab === "My Workshops") {
            fetchBrowseWorkshops();
        }
    }, [activeTab, fetchBrowseWorkshops]);
    const handleLoadMoreNotifications = async () => {
        try {
            const nextPage = notificationPage + 1;
            const res = await fetch(`/api/portal/entrepreneur/notifications?page=${nextPage}`, { credentials: "include" });
            const data = await res.json();

            if (data.notifications && data.notifications.length > 0) {
                setData((prev) => prev ? { ...prev, notifications: [...prev.notifications, ...data.notifications] } : prev);
                setNotificationPage(nextPage);
            } else {
                alert("No more notifications.");
            }
        } catch (err) { console.error(err); }
    };

    const handleLoadMoreFunding = async () => {
        try {
            const nextPage = fundingPage + 1;
            const res = await fetch(`/api/portal/entrepreneur/funding?page=${nextPage}`, { credentials: "include" });
            const data = await res.json();

            if (data.funding && data.funding.length > 0) {
                setData((prev) => prev ? { ...prev, funding: [...prev.funding, ...data.funding] } : prev);
                setFundingPage(nextPage);
            } else {
                alert("No more funding requests.");
            }
        } catch (err) { console.error(err); }
    };
    const handleLoadMoreLogs = async () => {
        try {
            const nextPage = activityLogPage + 1;
            const res = await fetch(`/api/portal/entrepreneur/activity-logs?page=${nextPage}`, { credentials: "include" });
            const data = await res.json();

            if (data.logs && data.logs.length > 0) {
                // Append the new logs to the end of the current list
                setData((prev) => prev ? { ...prev, activityLogs: [...prev.activityLogs, ...data.logs] } : prev);
                setActivityLogPage(nextPage);
            } else {
                alert("No more activity logs to load.");
            }
        } catch (err) {
            console.error("Error loading more logs:", err);
        }
    };


    const handleEnrollWorkshop = async (workshopId) => {
        if (enrolling[workshopId]) return;
        setEnrolling((prev) => ({ ...prev, [workshopId]: true }));
        try {
            const response = await fetch(`/v1/workshop/${workshopId}/attend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            const result = await response.json();
            if (response.ok) {
                window.alert("Successfully enrolled! It now appears above in My Enrolled Workshops.");
                await fetchBrowseWorkshops();
                fetchData();
            } else {
                window.alert(result.message || "Failed to enroll.");
            }
        } catch (err) {
            console.error("Enroll error:", err);
            window.alert("An error occurred while enrolling.");
        } finally {
            setEnrolling((prev) => ({ ...prev, [workshopId]: false }));
        }
    };

    const handleCancelFromBrowse = async (workshopId) => {
        if (!window.confirm("Are you sure you want to cancel your enrollment in this workshop?")) return;
        try {
            const response = await fetch(`/v1/workshop/${workshopId}/attend`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            if (response.ok) {
                window.alert("Enrollment cancelled.");
                await fetchBrowseWorkshops();
                fetchData();
            } else {
                const result = await response.json();
                window.alert(result.message || "Failed to cancel.");
            }
        } catch (err) {
            console.error("Cancel error:", err);
            window.alert("An error occurred while cancelling.");
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

  const handleCancelEnrollment = async (workshopId) => {
    if (!window.confirm("Are you sure you want to cancel your enrollment in this workshop?")) return;
    try {
      const response = await fetch(`/v1/workshop/${workshopId}/attend`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (response.ok) {
        window.alert("Workshop enrollment successfully cancelled!");
        fetchData();
      } else {
        window.alert(result.message || "Failed to cancel enrollment.");
      }
    } catch (err) {
      console.error("Cancel enrollment error:", err);
      window.alert("An error occurred while cancelling your enrollment.");
    }
  };

  const handleFounderFundingResponse = async (requestId, action) => {
    if (!window.confirm(`Are you sure you want to ${action === 'Founder Accepted' ? 'accept' : 'decline'} this funding offer?`)) return;
    try {
      const response = await fetch(`/api/public/funding/${requestId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        window.alert('Your response has been recorded!');
        fetchData();
      } else {
        const data = await response.json();
        window.alert(data.message || 'Failed to update status.');
      }
    } catch (err) {
      console.error('Error responding to funding:', err);
      window.alert('An error occurred.');
    }
  };

  const handleUpdateFundingStatus = async (requestId, newStatus) => {
    if (!window.confirm(`Are you sure you want to set this funding request to '${newStatus}'?`)) return;
    try {
      const response = await fetch(`/v1/funding/${requestId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes: "Reviewed by investor." }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        window.alert(`Funding request successfully ${newStatus.toLowerCase()}!`);
        fetchData();
      } else {
        window.alert(result.message || "Failed to update request status.");
      }
    } catch (err) {
      console.error("Request status update error:", err);
      window.alert("An error occurred while updating the status.");
    }
  };

  const currentStageIndex = milestones.length
      ? Math.max(
          0,
          ...milestones.map((m) => STAGES.indexOf(m.stage?.toLowerCase())),
      )
      : 0;
  const stagePercent = Math.min(
      100,
      Math.round(((currentStageIndex + 1) / STAGES.length) * 100),
  );

  const navItems = [
    { id: 1, icon: Rocket, label: "Dashboard" },
    { id: 2, icon: FileText, label: "My Application" },
    { id: 3, icon: UserRound, label: "My Mentor" },
    { id: 4, icon: Layers, label: "My Program" },
    { id: 5, icon: HandCoins, label: "Funding" },
    { id: 6, icon: GraduationCap, label: "My Workshops" },
    { id: 7, icon: Bell, label: "Notifications", badge: unreadNotifications || null },
    { id: 8, icon: Scroll, label: "Activity Timeline" },
    { id: 9, icon: BarChart3, label: "Platform Stats" },
    { id: 10, icon: MessageCircle, label: "Chat", badge: unreadMessages || null },
  ];

  const renderContent = () => {
    if (loading) {
      return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#00ADEF] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-[#006F9E]">
                Loading your dashboard...
              </p>
            </div>
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

    const appStatus = application ? statusStyle(application.status) : null;

    if (activeTab === "My Application") {
      return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                  Incubation Application
                </span>
                  <h3 className="text-lg font-bold text-[#111827]">
                    {application?.full_name || user?.name}
                  </h3>
                </div>
                {application ? (
                    <StageBadge status={application.status} />
                ) : (
                    <StageBadge status="Not submitted" />
                )}
              </div>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-[#F6FAFC] rounded-xl p-4 border border-[#D6E4EA]">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#526274] mb-1">
                    Submitted
                  </p>
                  <p className="font-bold text-[#111827]">
                    {application
                        ? new Date(application.created_at).toLocaleDateString()
                        : "—"}
                  </p>
                </div>
                <div className="bg-[#F6FAFC] rounded-xl p-4 border border-[#D6E4EA]">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#526274] mb-1">
                    Last Updated
                  </p>
                  <p className="font-bold text-[#111827]">
                    {application
                        ? new Date(application.updated_at).toLocaleDateString()
                        : "—"}
                  </p>
                </div>
              </div>
              {application?.startup_idea && (
                  <div className="mt-4">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#526274] mb-2">
                      Startup Idea
                    </p>
                    <p className="text-sm text-[#111827] leading-relaxed bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl p-4">
                      {application.startup_idea}
                    </p>
                  </div>
              )}
            </div>
          </div>
      );
    }

    // --- MY MENTOR TAB (SIMPLIFIED TABLE WITH CHAT ACTION) ---
    if (activeTab === "My Mentor") {
      const filteredMentors = mentorFilter === 'assigned' ? mentors.filter(m => m.is_assigned) : mentors;

      return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#111827]">Mentor Directory</h3>
                  <p className="text-sm text-[#526274]">Browse all available mentors in the ecosystem.</p>
                </div>
                <div className="flex items-center gap-2 bg-[#F6FAFC] p-1 rounded-xl border border-[#D6E4EA]">
                  <button
                      onClick={() => setMentorFilter('all')}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition ${mentorFilter === 'all' ? 'bg-[#00ADEF] text-white shadow-xs' : 'text-[#526274]'}`}
                  >
                    All Mentors
                  </button>
                  <button
                      onClick={() => setMentorFilter('assigned')}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition ${mentorFilter === 'assigned' ? 'bg-[#00ADEF] text-white shadow-xs' : 'text-[#526274]'}`}
                  >
                    My Mentors
                  </button>
                </div>
              </div>

              {filteredMentors.length === 0 ? (
                  <p className="text-sm font-bold text-[#526274] py-8 text-center">
                    {mentorFilter === 'assigned' ? "You have no mentors assigned to your projects or workshops yet." : "No mentors found in the system."}
                  </p>
              ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                      <tr className="bg-[#F6FAFC] text-[#526274] uppercase tracking-wider text-xs font-extrabold border-b border-[#D6E4EA]">
                        <th className="p-4">Mentor Name</th>
                        <th className="p-4 hidden md:table-cell">Domain</th>
                        <th className="p-4 text-right">Status</th>
                        <th className="p-4 text-right">Action</th> {/* ADDED ACTION HEADER */}
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D6E4EA]">
                      {filteredMentors.map((m) => (
                          <tr key={m.mentor_id} className="hover:bg-[#F6FAFC] transition">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#00ADEF] text-white flex items-center justify-center font-bold text-sm shrink-0">
                                  {m.mentor_name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-[#111827]">{m.mentor_name}</p>
                                  <p className="text-xs text-[#526274]">{m.mentor_email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 hidden md:table-cell text-sm text-[#111827] font-medium">
                              {m.domain || "General"}
                            </td>
                            <td className="p-4 text-right">
                              {m.is_assigned ? (
                                  <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20">
                              Your Mentor
                            </span>
                              ) : (
                                  <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                              Available
                            </span>
                              )}
                            </td>
                            {/* ADDED CHAT BUTTON CELL */}
                            <td className="p-4 text-right">
                              <button
                                  onClick={() => handleStartChat(m)}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                                      m.is_assigned
                                          ? 'bg-[#E38524] text-white hover:bg-[#C97019]'
                                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  }`}
                              >
                                <MessageCircle size={12} /> Chat
                              </button>
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
              )}
            </div>
          </div>
      );
    }

    if (activeTab === "My Program") {
      return (
          <div className="space-y-6">
            {cohorts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#D6E4EA] p-8 text-center">
                  <p className="text-sm font-bold text-[#526274]">
                    You are not enrolled in a cohort yet.
                  </p>
                </div>
            ) : (
                cohorts.map((c) => (
                    <div
                        key={c.id}
                        className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                      Cohort Membership
                    </span>
                          <h3 className="text-lg font-bold text-[#111827]">
                            {c.name}
                          </h3>
                        </div>
                        <StageBadge status={c.status} />
                      </div>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="bg-[#F6FAFC] rounded-xl p-4 border border-[#D6E4EA]">
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#526274] mb-1">
                            Type
                          </p>
                          <p className="font-bold text-[#111827] capitalize">{c.type}</p>
                        </div>
                        <div className="bg-[#F6FAFC] rounded-xl p-4 border border-[#D6E4EA]">
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#526274] mb-1">
                            Start — End
                          </p>
                          <p className="font-bold text-[#111827]">
                            {c.start_date
                                ? new Date(c.start_date).toLocaleDateString()
                                : "—"}{" "}
                            —{" "}
                            {c.end_date ? new Date(c.end_date).toLocaleDateString() : "—"}
                          </p>
                        </div>
                        <div className="bg-[#F6FAFC] rounded-xl p-4 border border-[#D6E4EA]">
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#526274] mb-1">
                            Current Stage
                          </p>
                          <p className="font-bold text-[#111827] capitalize">
                            {c.current_stage || "idea"}
                          </p>
                        </div>
                      </div>
                    </div>
                ))
            )}

            <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                  My Projects
                </span>
                  <h3 className="text-lg font-bold text-[#111827]">Startups</h3>
                </div>
                <a
                    href="/v1/projects/new"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#E38524] px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs hover:-translate-y-0.5 transition-all"
                >
                  <span className="text-sm leading-none">+</span>
                  New Project
                </a>
              </div>
              {projects.length === 0 ? (
                  <p className="text-sm text-[#526274] mt-4 font-semibold">
                    No projects linked to your account yet.
                  </p>
              ) : (
                  <div className="mt-4 space-y-3">
                    {projects.map((p) => (
                        <div
                            key={p.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl p-4"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#111827] text-sm">{p.name}</p>
                            <p className="text-xs text-[#526274] font-semibold mt-0.5">
                              {p.domain || "General"} • {p.role_in_project || "Founder"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <StageBadge status={p.approved ? "approved" : (p.status || p.stage)} />
                            <a
                                href={`/v1/projects/${p.id}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#D6E4EA] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#006F9E] hover:bg-[#EAF8FC] hover:border-[#00ADEF] transition-all"
                            >
                              View Details
                            </a>
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>
          </div>
      );
    }

      if (activeTab === "Funding") {
          return (
              <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
                      <div className="flex items-center justify-between">
                          <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                  Funding Status
                </span>
                              <h3 className="text-lg font-bold text-[#111827]">
                                  Funding Requests
                              </h3>
                          </div>
                          <a
                              href="/v1/funding/new"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#E38524] px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs hover:-translate-y-0.5 transition-all"
                          >
                              <span className="text-sm leading-none">+</span>
                              Request Funding
                          </a>
                      </div>
                      {funding.length === 0 ? (
                          <p className="text-sm text-[#526274] mt-4 font-semibold">
                              No funding requests yet.
                          </p>
                      ) : (
                          <div className="mt-4 overflow-x-auto">
                              <table className="w-full text-left text-sm min-w-[800px]">
                                  <thead>
                                  <tr className="text-[11px] font-extrabold uppercase tracking-wider text-[#526274] border-b border-[#D6E4EA]">
                                      <th className="py-3 pr-4">Project</th>
                                      <th className="py-3 pr-4">Requested</th>
                                      <th className="py-3 pr-4">Offered</th>
                                      <th className="py-3 pr-4">Reason / Notes</th>
                                      <th className="py-3">Action</th>
                                  </tr>
                                  </thead>
                                  <tbody>
                                  {funding.map((f) => (
                                      <tr key={f.id} className="border-b border-[#D6E4EA] last:border-0 align-top">

                                          {/* Project + Status Badge */}
                                          <td className="py-3 pr-4 font-bold text-[#111827]">
                                              {f.project_name}
                                              <div className="mt-1 block">
                                                  <StageBadge status={f.status} />
                                              </div>
                                          </td>

                                          {/* Requested Amount */}
                                          <td className="py-3 pr-4 font-semibold text-[#526274]">
                                              {Number(f.amount).toLocaleString()} ETB
                                          </td>

                                          {/* Offered Amount */}
                                          <td className="py-3 pr-4 font-bold text-green-600">
                                              {f.approved_amount ? `${Number(f.approved_amount).toLocaleString()} ETB` : "—"}
                                          </td>

                                          {/* Reason */}
                                          <td className="py-3 pr-4 text-[#526274] italic max-w-[250px]">
                                              {f.notes ? `"${f.notes}"` : "No notes provided."}
                                          </td>

                                          <td className="py-3">
                                              {f.status === 'Offer Under Review' && (f.founder_action === 'Pending' || !f.founder_action) ? (
                                                  <select
                                                      defaultValue=""
                                                      onChange={(e) => {
                                                          if(e.target.value) handleFounderFundingResponse(f.id, e.target.value);
                                                      }}
                                                      className="w-full px-2 py-1.5 border border-[#D6E4EA] rounded-lg text-xs font-bold text-[#111827] focus:ring-1 focus:ring-[#00ADEF] bg-white"
                                                  >
                                                      <option value="" disabled>Select Action...</option>
                                                      <option value="Founder Accepted">Accept Offer</option>
                                                      <option value="Founder Declined">Decline Offer</option>
                                                  </select>
                                              ) : f.founder_action === 'Founder Accepted' ? (
                                                  <span className="text-[10px] font-bold text-green-700 uppercase">Accepted</span>
                                              ) : f.founder_action === 'Founder Declined' ? (
                                                  <span className="text-[10px] font-bold text-rose-700 uppercase">Declined</span>
                                              ) : (
                                                  <span className="text-[10px] font-bold text-[#526274]">—</span>
                                              )}
                                          </td>
                                      </tr>
                                  ))}
                                  </tbody>
                              </table>
                          </div>
                      )}
                  </div>

                  {/* LOAD MORE FUNDING BUTTON */}
                  <div className="flex justify-center mt-6">
                      <button
                          onClick={handleLoadMoreFunding}
                          className="px-6 py-2.5 rounded-xl bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20 text-xs font-bold uppercase tracking-wider hover:bg-[#D6E4EA] transition"
                      >
                          Load More
                      </button>
                  </div>

              </div>
          );
      }

      if (activeTab === "My Workshops") {
          return (
              <div className="space-y-6">
                  {/* Section 1: Enrolled (your existing content) */}
                  <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
                      <div className="flex items-center justify-between">
                          <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                  Learning
                </span>
                              <h3 className="text-lg font-bold text-[#111827]">
                                  My Enrolled Workshops
                              </h3>
                          </div>
                          <button
                              onClick={() => {
                                  const next = !showBrowseCatalog;
                                  setShowBrowseCatalog(next);
                                  // Fetch fresh data when expanding
                                  if (next) fetchBrowseWorkshops();
                                  // Scroll after React paints the section
                                  if (next) {
                                      setTimeout(() => {
                                          document.getElementById("all-workshops-section")?.scrollIntoView({ behavior: "smooth" });
                                      }, 50);
                                  }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#E38524] px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs hover:-translate-y-0.5 transition-all"
                          >
                              {showBrowseCatalog ? "Hide Workshops" : "Browse Workshops"}
                          </button>
                      </div>
                      {workshops.length === 0 ? (
                          <p className="text-sm text-[#526274] mt-4 font-semibold">
                              No workshops enrolled yet. Scroll down to browse and enroll!
                          </p>
                      ) : (
                          <div className="mt-4 space-y-3">
                              {workshops.map((w) => (
                                  <div
                                      key={w.id}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl p-4"
                                  >
                                      <div className="min-w-0 flex-1">
                                          <p className="font-bold text-[#111827] text-sm">{w.title}</p>
                                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#526274] font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-[#00ADEF]" />
                            {w.schedule
                                ? new Date(w.schedule).toLocaleDateString()
                                : "TBD"}
                        </span>
                                              {w.category && (
                                                  <span className="rounded-full bg-[#EAF8FC] text-[#006F9E] px-2 py-0.5 text-[10px] font-bold border border-[#00ADEF]/20">
                            {w.category}
                          </span>
                                              )}
                                              {w.attended && (
                                                  <span className="rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-[10px] font-bold border border-green-200">
                            Attended
                          </span>
                                              )}
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                          <StageBadge status={w.status || "enrolled"} />
                                          <a
                                              href={`/v1/workshop/${w.id}`}
                                              className="inline-flex items-center gap-1 rounded-lg border border-[#D6E4EA] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#006F9E] hover:bg-[#EAF8FC] hover:border-[#00ADEF] transition-all"
                                          >
                                              Details
                                          </a>
                                          {w.status !== "completed" && (
                                              <button
                                                  onClick={() => handleCancelEnrollment(w.id)}
                                                  className="inline-flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-rose-600 transition-all"
                                              >
                                                  Cancel
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  {/* Section 2: Browse All Workshops (revealed on demand) */}
                  {showBrowseCatalog && (
                      <div id="all-workshops-section" className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs scroll-mt-4">

                      <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                  Catalog
                </span>
                          <h3 className="text-lg font-bold text-[#111827]">
                              All Workshops
                          </h3>
                          <p className="text-sm text-[#526274] mt-1">
                              Browse every workshop and enroll in the ones you need.
                          </p>
                      </div>

                      {browseLoading ? (
                          <div className="h-40 flex items-center justify-center">
                              <div className="w-10 h-10 border-4 border-[#00ADEF] border-t-transparent rounded-full animate-spin" />
                          </div>
                      ) : browseWorkshops.length === 0 ? (
                          <p className="text-sm font-bold text-[#526274] py-8 text-center">
                              No workshops available yet.
                          </p>
                      ) : (
                          <div className="mt-4 overflow-x-auto">
                              <table className="w-full text-left border-collapse min-w-[760px]">
                                  <thead>
                                  <tr className="bg-[#F6FAFC] text-[#526274] uppercase tracking-wider text-xs font-extrabold border-b border-[#D6E4EA]">
                                      <th className="p-4">Workshop</th>
                                      <th className="p-4 hidden md:table-cell">Date</th>
                                      <th className="p-4 hidden md:table-cell">Mentor</th>
                                      <th className="p-4 hidden md:table-cell">Seats</th>
                                      <th className="p-4">Status</th>
                                      <th className="p-4 text-right">Action</th>
                                  </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#D6E4EA] text-sm">
                                  {browseWorkshops.map((w) => (
                                      <tr key={w.id} className="hover:bg-[#F6FAFC] transition align-top">
                                          <td className="p-4">
                                              <p className="font-bold text-[#111827]">{w.title}</p>
                                              {w.category && (
                                                  <span className="rounded-full bg-[#EAF8FC] text-[#006F9E] px-2 py-0.5 text-[10px] font-bold border border-[#00ADEF]/20 mt-1 inline-block">
                                                      {w.category}
                                                  </span>
                                              )}
                                          </td>
                                          <td className="p-4 hidden md:table-cell text-[#526274] font-semibold whitespace-nowrap">
                                              {w.start_date
                                                  ? new Date(w.start_date).toLocaleDateString()
                                                  : "TBD"}
                                          </td>
                                          <td className="p-4 hidden md:table-cell text-[#111827] font-medium">
                                              {w.mentor_name || "—"}
                                          </td>
                                          <td className="p-4 hidden md:table-cell text-[#526274] font-semibold">
                                              {w.enrolled_count ?? 0}/{w.capacity ?? "∞"}
                                          </td>
                                          <td className="p-4">
                                              <StageBadge status={w.status || "scheduled"} />
                                          </td>
                                          <td className="p-4 text-right">
                                              {w.is_enrolled ? (
                                                  <div className="flex items-center justify-end gap-2">
                                                      <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 text-[10px] font-bold uppercase">
                                                          Enrolled
                                                      </span>
                                                      {w.status !== "completed" && (
                                                          <button
                                                              onClick={() => handleCancelFromBrowse(w.id)}
                                                              className="rounded-lg bg-rose-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-rose-600 transition-all"
                                                          >
                                                              Cancel
                                                          </button>
                                                      )}
                                                  </div>
                                              ) : w.status === "full" ? (
                                                  <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase">
                                                      Full
                                                  </span>
                                              ) : w.status === "completed" ? (
                                                  <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase">
                                                      Completed
                                                  </span>
                                              ) : (
                                                  <button
                                                      onClick={() => handleEnrollWorkshop(w.id)}
                                                      disabled={enrolling[w.id]}
                                                      className="rounded-lg bg-[#E38524] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs hover:bg-[#C97019] transition-all disabled:opacity-60"
                                                  >
                                                      {enrolling[w.id] ? "Enrolling..." : "Enroll"}
                                                  </button>
                                              )}
                                          </td>
                                      </tr>
                                  ))}
                                  </tbody>
                              </table>
                          </div>
                      )}
                      </div>
                  )}
              </div>
          );
      }

      if (activeTab === "Notifications") {
          return (
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

                      {/* LOAD MORE NOTIFICATIONS BUTTON */}
                      <div className="flex justify-center mt-6">
                          <button
                              onClick={handleLoadMoreNotifications}
                              className="px-6 py-2.5 rounded-xl bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20 text-xs font-bold uppercase tracking-wider hover:bg-[#D6E4EA] transition"
                          >
                              Load More
                          </button>
                      </div>

                  </div>
              </div>
          );
      }

      if (activeTab === "Activity Timeline") {
          return (
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

                              <div className="flex justify-center mt-8">
                                  <button
                                      onClick={handleLoadMoreLogs}
                                      className="px-6 py-2.5 rounded-xl bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20 text-xs font-bold uppercase tracking-wider hover:bg-[#D6E4EA] transition"
                                  >
                                      Load More
                                  </button>
                              </div>s
                          </div>
                      )}
                  </div>
              </div>
          );
      }
    if (activeTab === "Platform Stats") {
      const metricsMeta = {
        total_users: { label: "Total Members", icon: UserRound, color: "bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/20" },
        total_projects: { label: "Projects Registered", icon: Rocket, color: "bg-green-50 text-green-700 border-green-200" },
        total_workshops: { label: "Workshops Conducted", icon: GraduationCap, color: "bg-[#FFF1E3] text-[#E38524] border-[#E38524]/20" },
        total_funding_requested: { label: "Funding Requests", icon: HandCoins, color: "bg-rose-50 text-rose-700 border-rose-200" },
        total_funding_approved: { label: "Approved Fundings", icon: CheckCircle2, color: "bg-purple-50 text-purple-700 border-purple-200" },
      };
      return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                  Analytics
                </span>
                  <h3 className="text-lg font-bold text-[#111827]">
                    Platform Aggregated Stats
                  </h3>
                </div>
              </div>
              {stats.length === 0 ? (
                  <p className="text-sm text-[#526274] mt-4 font-semibold">
                    No stats available yet.
                  </p>
              ) : (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {stats.map((s) => {
                      const meta = metricsMeta[s.metric_key] || {
                        label: s.metric_key,
                        icon: BarChart3,
                        color: "bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/20",
                      };
                      const Icon = meta.icon;
                      return (
                          <div
                              key={s.metric_key}
                              className="bg-[#F6FAFC] border border-[#D6E4EA] rounded-2xl p-5"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div
                                  className={`w-11 h-11 rounded-xl flex items-center justify-center border ${meta.color}`}
                              >
                                <Icon size={22} />
                              </div>
                              <span className="text-[10px] font-bold text-[#006F9E] bg-[#EAF8FC] border border-[#00ADEF]/20 rounded-full px-2 py-0.5">
                          Active
                        </span>
                            </div>
                            <p className="text-xs font-extrabold uppercase tracking-wider text-[#526274] mb-1">
                              {meta.label}
                            </p>
                            <p className="text-3xl font-extrabold tracking-tight text-[#111827]">
                              {s.metric_value}
                            </p>
                            <p className="mt-3 text-[10px] font-bold uppercase text-[#526274] border-t border-[#D6E4EA] pt-2">
                              Last Sync:{" "}
                              {new Date(s.updated_at).toLocaleString()}
                            </p>
                          </div>
                      );
                    })}
                  </div>
              )}
            </div>
          </div>
      );
    }

    if (activeTab === "Chat") {
      return <ChatPanel currentUser={currentUser} initialContact={activeChatContact} />;
    }

    // Default: Dashboard
    return (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#D6E4EA] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20">
                  <FileText size={22} />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-extrabold text-[#111827] tracking-tight">
                  {application ? (
                      <span
                          className={`text-lg font-bold ${
                              appStatus?.cls.includes("green")
                                  ? "text-green-700"
                                  : appStatus?.cls.includes("amber")
                                      ? "text-amber-700"
                                      : appStatus?.cls.includes("rose")
                                          ? "text-rose-700"
                                          : "text-[#006F9E]"
                          }`}
                      >
                    {application.status}
                  </span>
                  ) : (
                      "Not submitted"
                  )}
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-[#526274]">
                  Application Status
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D6E4EA] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#FFF1E3] text-[#E38524] border border-[#E38524]/20">
                  <UserRound size={22} />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-extrabold text-[#111827] tracking-tight">
                  {mentors[0]?.mentor_name || "None"}
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-[#526274]">
                  Assigned Mentor
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D6E4EA] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20">
                  <Layers size={22} />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-extrabold text-[#111827] tracking-tight">
                  {stagePercent}%
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-[#526274]">
                  Program Progress
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D6E4EA] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#FFF1E3] text-[#E38524] border border-[#E38524]/20">
                  <HandCoins size={22} />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-extrabold text-[#111827] tracking-tight">
                  {funding.length}
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-[#526274]">
                  Funding Requests
                </p>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                Milestones
              </span>
                <h3 className="text-lg font-bold text-[#111827]">
                  Startup Progress
                </h3>
              </div>
              <span className="text-xs font-bold text-[#006F9E]">
              {stagePercent}% complete
            </span>
            </div>

            <div className="flex items-center justify-between mb-6">
              {STAGES.map((stage, index) => {
                const reached = index <= currentStageIndex;
                const Icon = reached ? CheckCircle2 : Clock;
                return (
                    <div key={stage} className="flex flex-col items-center gap-2 flex-1">
                      <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                              reached
                                  ? "bg-[#00ADEF] border-[#00ADEF] text-white"
                                  : "bg-white border-[#D6E4EA] text-[#C4D3DC]"
                          }`}
                      >
                        <Icon size={18} />
                      </div>
                      <span
                          className={`text-[11px] font-extrabold uppercase tracking-wider ${
                              reached ? "text-[#006F9E]" : "text-[#C4D3DC]"
                          }`}
                      >
                    {stage}
                  </span>
                    </div>
                );
              })}
            </div>

            {milestones.length === 0 ? (
                <p className="text-sm text-[#526274] font-semibold">
                  No milestones recorded yet.
                </p>
            ) : (
                <div className="space-y-3">
                  {milestones.map((m, i) => (
                      <div
                          key={i}
                          className="flex items-center gap-3 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl px-4 py-3 text-sm"
                      >
                        <CheckCircle2 size={18} className="text-[#00ADEF] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[#111827] capitalize">
                            {m.stage}
                          </p>
                          <p className="text-xs text-[#526274] font-semibold">
                            {m.source === "project"
                                ? `Project: ${m.project_name}`
                                : `Cohort: ${m.cohort_name}`}
                          </p>
                        </div>
                        <span className="text-xs text-[#526274] font-semibold">
                    {new Date(m.updated_at).toLocaleDateString()}
                  </span>
                      </div>
                  ))}
                </div>
            )}
          </div>

          {/* Recent funding */}
          <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                Funding Status
              </span>
                <h3 className="text-lg font-bold text-[#111827]">
                  Recent Requests
                </h3>
              </div>
            </div>
            {funding.length === 0 ? (
                <p className="text-sm text-[#526274] font-semibold">
                  No funding requests yet.
                </p>
            ) : (
                <div className="space-y-3">
                  {funding.slice(0, 4).map((f) => (
                      <div
                          key={f.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl px-4 py-3"
                      >
                        <div>
                          <p className="font-bold text-[#111827] text-sm">
                            {f.project_name}
                          </p>
                          <p className="text-xs text-[#526274] font-semibold">
                            {Number(f.amount).toLocaleString()} ETB •{" "}
                            {new Date(f.requested_at).toLocaleDateString()}
                          </p>
                        </div>
                        <StageBadge status={f.status} />
                      </div>
                  ))}
                </div>
            )}
          </div>
        </div>
    );
  };

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
              {collapsed ? "MENU" : "My Incubator"}
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.label;
              return (
                  <button
                      key={item.id}
                      onClick={() => setActiveTab(item.label)}
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
                user={user || currentUser}
                roleLabel="Entrepreneur"
                unreadCount={unreadNotifications}
                onNotifications={() => setActiveTab("Notifications")}
                onLogout={handleLogout}
            />
          </header>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {renderContent()}
          </div>
        </div>
      </div>
  );
};

export default EntrepreneurPortal;