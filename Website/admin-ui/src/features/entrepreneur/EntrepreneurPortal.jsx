import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  GraduationCap,
  HandCoins,
  Rocket,
  Building2,
  LogOut,
  CircleUserRound,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserRound,
  Layers,
  Calendar,
  Bell,
  Scroll,
  BarChart3,
  Pencil,
} from "lucide-react";
import { getEntrepreneurDashboard } from "../../services/portalService";

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
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [replyInputs, setReplyInputs] = useState({});
  const [replySending, setReplySending] = useState({});
  const [editingReply, setEditingReply] = useState({});

  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");

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

    if (activeTab === "My Mentor") {
      return (
        <div className="space-y-6">
          {mentors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#D6E4EA] p-8 text-center">
              <p className="text-sm font-bold text-[#526274]">
                No mentor assigned yet. Your program coordinator will assign one
                soon.
              </p>
            </div>
          ) : (
            mentors.map((m) => (
              <div
                key={m.assignment_id}
                className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#00ADEF] text-white flex items-center justify-center font-bold text-lg shadow-xs overflow-hidden">
                    {m.mentor_name?.charAt(0)?.toUpperCase() || "M"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#111827]">
                      {m.mentor_name}
                    </h3>
                    <p className="text-xs text-[#526274] font-semibold">
                      {m.mentor_email}
                    </p>
                    <p className="text-xs text-[#006F9E] font-bold mt-1">
                      {m.mentor_expertise || "General Expertise"}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs text-[#526274] font-semibold bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl p-3">
                  <GraduationCap size={14} className="text-[#00ADEF]" />
                  {m.cohort_name ? (
                    <>Cohort: <strong className="text-[#111827]">{m.cohort_name}</strong></>
                  ) : m.project_name ? (
                    <>Project: <strong className="text-[#111827]">{m.project_name}</strong></>
                  ) : (
                    <strong className="text-[#111827]">Assigned Mentor</strong>
                  )}
                  <span className="text-[#D6E4EA]">•</span>
                  Assigned:{" "}
                  <strong className="text-[#111827]">
                    {new Date(m.assigned_at).toLocaleDateString()}
                  </strong>
                </div>
              </div>
            ))
          )}

          {/* Mentorship Sessions & Feedback Section */}
          <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                  Session History &amp; Feedback
                </span>
                <h3 className="text-lg font-bold text-[#111827]">
                  Mentorship Sessions &amp; Feedback
                </h3>
              </div>
            </div>

            {mentorSessions.length === 0 ? (
              <p className="text-sm text-[#526274] font-semibold py-4 text-center">
                No mentorship sessions or feedback logged yet by your mentor.
              </p>
            ) : (
              <div className="space-y-4">
                {mentorSessions.map((s) => (
                  <div
                    key={s.id}
                    className="bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#006F9E]">
                        <Calendar size={14} />
                        {new Date(s.session_date).toLocaleDateString()} • {s.mentor_name}
                      </span>
                    </div>
                    {s.notes && (
                      <div className="mb-3 flex items-start gap-2">
                        <FileText
                          size={15}
                          className="text-[#00ADEF] mt-0.5 shrink-0"
                        />
                        <p className="text-sm text-[#111827] leading-relaxed">
                          <strong className="text-[#111827]">Progress Notes:</strong>{" "}
                          {s.notes}
                        </p>
                      </div>
                    )}
                    {s.feedback && (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 bg-[#FFF1E3]/60 border border-[#E38524]/20 rounded-xl p-3.5">
                          <HandCoins
                            size={16}
                            className="text-[#E38524] mt-0.5 shrink-0"
                          />
                          <p className="text-sm text-[#111827] leading-relaxed">
                            <strong className="text-[#E38524]">Mentor Feedback:</strong>{" "}
                            {s.feedback}
                          </p>
                        </div>

                        {s.entrepreneur_reply && (
                          <div className="space-y-2 ml-4">
                            <div className="flex items-start justify-between gap-2 bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5">
                              <div className="flex items-start gap-2">
                                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-sm text-emerald-900 leading-relaxed">
                                    <strong className="text-emerald-800">Your Reply:</strong> {s.entrepreneur_reply}
                                  </p>
                                  {s.reply_at && (
                                    <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                                      {new Date(s.reply_at).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setReplyInputs({ ...replyInputs, [s.id]: s.entrepreneur_reply });
                                  setEditingReply({ ...editingReply, [s.id]: true });
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-300 rounded-lg px-2.5 py-1 hover:bg-emerald-100 transition shrink-0"
                              >
                                <Pencil size={12} /> Edit
                              </button>
                            </div>

                            {s.mentor_response && (
                              <div className="flex items-start gap-2 bg-[#EAF8FC] border border-[#00ADEF]/20 rounded-xl p-3.5 ml-4">
                                <HandCoins size={16} className="text-[#006F9E] mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-sm text-[#111827] leading-relaxed">
                                    <strong className="text-[#006F9E]">Mentor Follow-up Response:</strong> {s.mentor_response}
                                  </p>
                                  {s.mentor_response_at && (
                                    <span className="text-[10px] text-[#526274] font-semibold block mt-1">
                                      {new Date(s.mentor_response_at).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="pt-2 border-t border-[#D6E4EA]">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder={editingReply[s.id] ? "Edit your reply..." : "Write a message to your mentor..."}
                              value={replyInputs[s.id] || ""}
                              onChange={(e) => setReplyInputs({ ...replyInputs, [s.id]: e.target.value })}
                              onKeyDown={(e) => e.key === "Enter" && handleSendReply(s.id)}
                              className="flex-1 px-3.5 py-2 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium outline-none focus:border-[#00ADEF]"
                            />
                            <button
                              onClick={() => handleSendReply(s.id)}
                              disabled={replySending[s.id] || !replyInputs[s.id]?.trim()}
                              className="px-4 py-2 bg-[#00ADEF] text-white text-xs font-extrabold rounded-xl hover:bg-[#006F9E] disabled:opacity-40 transition shrink-0"
                            >
                              {replySending[s.id] ? "Saving..." : editingReply[s.id] ? "Update" : "Reply"}
                            </button>
                            {editingReply[s.id] && (
                              <button
                                onClick={() => {
                                  setEditingReply({ ...editingReply, [s.id]: false });
                                  setReplyInputs({ ...replyInputs, [s.id]: "" });
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
                      <StageBadge status={p.status || p.stage} />
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
                <table className="w-full text-left text-sm min-w-[700px]">
                  <thead>
                    <tr className="text-[11px] font-extrabold uppercase tracking-wider text-[#526274] border-b border-[#D6E4EA]">
                      <th className="py-3 pr-4">Project</th>
                      <th className="py-3 pr-4">Requested</th>
                      <th className="py-3 pr-4">Approved</th>
                      <th className="py-3 pr-4">Stage</th>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Admin Notes</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funding.map((f) => (
                      <tr
                        key={f.id}
                        className="border-b border-[#D6E4EA] last:border-0"
                      >
                        <td className="py-3 pr-4 font-bold text-[#111827]">
                          {f.project_name}
                        </td>
                        <td className="py-3 pr-4 font-semibold text-[#111827]">
                          {Number(f.amount).toLocaleString()} ETB
                        </td>
                        <td className="py-3 pr-4 font-bold text-emerald-700">
                          {f.approved_amount ? `${Number(f.approved_amount).toLocaleString()} ETB` : "—"}
                        </td>
                        <td className="py-3 pr-4 capitalize text-[#526274] font-semibold">
                          {f.funding_stage || "—"}
                        </td>
                        <td className="py-3 pr-4 text-[#526274] font-semibold">
                          {new Date(f.requested_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4 text-[#526274] text-xs font-medium max-w-[200px] truncate" title={f.notes || ""}>
                          {f.notes || "—"}
                        </td>
                        <td className="py-3">
                          <StageBadge status={f.status} />
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

    if (activeTab === "My Workshops") {
      return (
        <div className="space-y-6">
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
              <a
                href="/v1/workshop"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#E38524] px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs hover:-translate-y-0.5 transition-all"
              >
                Browse Workshops
              </a>
            </div>
            {workshops.length === 0 ? (
              <p className="text-sm text-[#526274] mt-4 font-semibold">
                No workshops enrolled yet.
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
                (user?.name || currentUser.name || "E").charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#111827] truncate">
                {user?.name || currentUser.name || "Entrepreneur"}
              </p>
              <p className="text-[10px] font-semibold text-[#006F9E] flex items-center gap-1">
                <ShieldCheck size={10} className="text-[#00ADEF]" />
                <span className="capitalize">Entrepreneur</span>
              </p>
            </div>
          </div>
          <CircleUserRound size={16} className="text-[#006F9E] shrink-0" />
        </a>

        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#526274]">
            My Incubator
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.label;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.label)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-xs font-bold ${
                  isActive
                    ? "bg-[#EAF8FC] text-[#006F9E] border-l-4 border-[#00ADEF] shadow-xs"
                    : "text-[#526274] hover:bg-[#F6FAFC] hover:text-[#111827]"
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-[#00ADEF]" : "text-[#526274]"}
                />
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto rounded-full bg-[#E38524] text-white min-w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
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
            Entrepreneur Portal
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "Founder"}!
          </h1>
          <p className="mt-2 text-sm text-white/85 max-w-2xl leading-relaxed">
            Track your application, connect with your assigned mentor, follow
            your milestones, and monitor your funding status.
          </p>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default EntrepreneurPortal;
