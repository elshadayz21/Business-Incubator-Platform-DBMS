import { useState, useEffect, useCallback } from "react";
import {
  X,
  Lightbulb,
  Sparkles,
  Loader2,
  Wrench,
  Code,
  Globe,
  Github,
  Check,
  Calendar,
  Users,
  Target,
  FileText,
  Send,
  Clock,
} from "lucide-react";

const ProjectDetails = ({ project, onClose }) => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [invitingId, setInvitingId] = useState(null);
  const [invitations, setInvitations] = useState({});
  const [currentMentor, setCurrentMentor] = useState(null);
  const [removingMentor, setRemovingMentor] = useState(false);

  const fetchInvitations = useCallback(async () => {
    if (!project?.id) return;
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/invitations`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const map = {};
        if (Array.isArray(data?.data)) {
          data.data.forEach((inv) => {
            map[inv.mentor_id] = { status: inv.status, reason: inv.decline_reason };
          });
        }
        setInvitations(map);
        setCurrentMentor(data?.currentMentor || null);
      }
    } catch (e) {
      console.error("Error fetching invitations:", e);
    }
  }, [project?.id]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  if (!project) return null;

  // --- AI MENTOR LOGIC ---
  const fetchMentors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/suggested-mentors`, {
        credentials: 'include'
      });
      const data = await response.json();
      setMentors(data.mentors || []);
      fetchInvitations();
    } catch (error) {
      console.error("Error fetching mentors:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasAcceptedMentor = Object.values(invitations).some((i) => i?.status === "accepted");
  const hasPendingInvitation = Object.values(invitations).some((i) => i?.status === "pending");

  const handleReplaceMentor = async () => {
    const label = currentMentor?.mentor_name || "the current mentor";
    if (!window.confirm(`Remove ${label} from this project so a new mentor can be assigned?`)) return;
    setRemovingMentor(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/remove-mentor`, {
        method: "POST",
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert("✅ " + (data.message || "Mentor removed. You can now invite another mentor."));
      } else {
        alert("❌ " + (data.message || "Failed to remove mentor."));
      }
    } catch (err) {
      console.error("Error removing mentor:", err);
      alert("❌ " + (err.message || "Error removing mentor."));
    } finally {
      setRemovingMentor(false);
      fetchInvitations();
    }
  };

  const handleInvite = async (mentorId) => {
    if (hasAcceptedMentor || currentMentor) {
      alert("❌ This project already has an assigned mentor. Use \"Replace Mentor\" first.");
      return;
    }
    if (hasPendingInvitation && invitations[mentorId]?.status !== "pending") {
      alert("❌ An invitation is already pending for this project. You can invite another mentor after it is declined.");
      return;
    }
    setInvitingId(mentorId);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/invite-mentor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ mentorId, message: "We invite your expertise to mentor this startup project." }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("📩 " + (data.message || "Interest invitation sent to mentor successfully!"));
        setInvitations((prev) => ({ ...prev, [mentorId]: "pending" }));
      } else {
        alert("❌ " + (data.message || "Failed to send invitation."));
      }
    } catch (err) {
      console.error("Error sending invitation:", err);
      alert("❌ " + (err.message || "Error sending invitation."));
    } finally {
      setInvitingId(null);
    }
  };

  const handleAssign = async (mentorId) => {
    if (hasAcceptedMentor || currentMentor) {
      alert("❌ This project already has an assigned mentor. Use \"Replace Mentor\" first.");
      return;
    }
    setAssigningId(mentorId);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/assign-mentor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ mentorId }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Remove the mentor from the list
        setMentors((prev) => prev.filter((m) => m.id !== mentorId));
        alert("✅ Mentor assigned successfully!");
      } else {
        // Backend rejected it (e.g., already has a mentor)
        alert("❌ " + result.message);
      }
    } catch (error) {
      console.error("Error assigning mentor:", error);
      alert("Error assigning mentor.");
    } finally {
      setAssigningId(null);
    }
  };

  return (
      <div className="w-full bg-[#F6FAFC] font-sans pb-10">
        {/* Header */}
        <div className="p-5 border-b border-[#D6E4EA] flex items-center justify-between bg-white text-[#111827] shrink-0">
          <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] block">
            Startup Profile
          </span>
            <h2 className="text-xl font-bold font-['Space_Grotesk'] text-[#111827]">
              {project.title || project.name}
            </h2>
          </div>
          <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#526274] hover:bg-[#F6FAFC] hover:text-[#111827] transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6">

          {/* Basic Meta Card */}
          <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D6E4EA] pb-4">
              <div>
              <span className="inline-flex px-3 py-1 rounded-full bg-[#EAF8FC] text-[#006F9E] text-xs font-bold border border-[#00ADEF]/20 mr-2">
                Domain: {project.domain || "General"}
              </span>
                <span className="inline-flex px-3 py-1 rounded-full bg-[#FFF1E3] text-[#E38524] text-xs font-bold border border-[#E38524]/20">
                Stage: {project.stage}
              </span>
              </div>
              <div className="text-xs font-medium text-[#526274] flex items-center gap-1">
                <Calendar size={14} /> Created: {new Date(project.created_at).toLocaleDateString("en-GB")}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-[#111827] font-['Space_Grotesk'] mb-2">
                {project.title || project.name}
              </h3>
              <p className="text-sm text-[#526274] italic border-l-4 border-[#00ADEF] pl-4 py-1 bg-[#F6FAFC] rounded-r-xl">
                "{project.short_description || "No short description provided."}"
              </p>
            </div>
          </div>

          {/* AI Suggested Mentors Panel */}
          <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#D6E4EA] pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#EAF8FC] text-[#00ADEF]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#111827] font-['Space_Grotesk']">
                    AI Suggested Mentors
                  </h4>
                  <p className="text-xs text-[#526274]">
                    Match mentor expertise to startup domain via TF-IDF algorithm
                  </p>
                </div>
              </div>
              <button
                  onClick={fetchMentors}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-[#00ADEF] text-white text-xs font-bold shadow-xs hover:bg-[#006F9E] disabled:opacity-50 transition shrink-0"
              >
                {loading ? "Analyzing..." : "Find Mentors"}
              </button>
            </div>

            {hasAcceptedMentor && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 text-emerald-800 flex flex-wrap items-center gap-2.5 font-bold text-xs">
                <Check size={18} className="text-emerald-600 shrink-0" />
                <span className="flex-1 min-w-[12rem]">
                  Mentor Assigned: {currentMentor?.mentor_name || "A mentor"} has accepted the invitation and is assigned to this project. Further invitations are restricted.
                </span>
                <button
                  onClick={handleReplaceMentor}
                  disabled={removingMentor}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-40 transition shrink-0"
                  title="Remove the current mentor so a new one can be invited"
                >
                  <X size={14} />
                  {removingMentor ? "Removing..." : "Replace Mentor"}
                </button>
              </div>
            )}

            {!hasAcceptedMentor && currentMentor && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-amber-800 flex flex-wrap items-center gap-2.5 font-bold text-xs">
                <Clock size={18} className="text-amber-600 shrink-0" />
                <span className="flex-1 min-w-[12rem]">
                  {currentMentor.account_removed
                    ? `The assigned mentor's account no longer exists (was: ${currentMentor.mentor_name || "Unknown"}). Replace them to invite a new mentor.`
                    : `${currentMentor.mentor_name} is still listed as this project's mentor, but no accepted invitation was found. You can replace them.`}
                </span>
                <button
                  onClick={handleReplaceMentor}
                  disabled={removingMentor}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-40 transition shrink-0"
                  title="Remove the current mentor so a new one can be invited"
                >
                  <X size={14} />
                  {removingMentor ? "Removing..." : "Replace Mentor"}
                </button>
              </div>
            )}

            {!hasAcceptedMentor && hasPendingInvitation && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-amber-800 flex items-center gap-2.5 font-bold text-xs">
                <Clock size={18} className="text-amber-600 shrink-0" />
                <span>Invitation Pending: A request is awaiting response from a mentor. You can invite another mentor once it is declined.</span>
              </div>
            )}

            <div className="pt-2">
              {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin text-[#00ADEF]" size={24} />
                  </div>
              ) : mentors.length > 0 ? (
                  <div className="space-y-3">
                    {mentors.map((mentor) => {
                      const score = Math.round((mentor.matchScore || 0) * 100);
                      const status = invitations[mentor.id]?.status;
                      const declineReason = invitations[mentor.id]?.reason;

                      return (
                          <div key={mentor.id} className="flex flex-wrap items-center justify-between gap-3 p-4 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] hover:border-[#00ADEF]/30 transition">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#00ADEF] text-white flex items-center justify-center font-bold text-sm">
                                {mentor.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#111827]">{mentor.name}</p>
                                <p className="text-xs text-[#526274] capitalize">{mentor.expertise || "General Expertise"}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-[#006F9E] bg-[#EAF8FC] px-2.5 py-1 rounded-full border border-[#00ADEF]/20">
                                {score}% Match
                              </span>

                              {status === "pending" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-bold border border-amber-200">
                                  <Clock size={14} />
                                  Invited (Pending)
                                </span>
                              ) : status === "accepted" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl bg-green-50 text-green-700 font-bold border border-green-200">
                                  <Check size={14} />
                                  Accepted &amp; Assigned
                                </span>
                              ) : status === "declined" ? (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold border border-rose-200">
                                    <X size={14} />
                                    Declined
                                  </span>
                                  {declineReason && (
                                    <span
                                      className="text-[10px] italic text-rose-600 max-w-[18rem] text-right leading-snug"
                                      title={declineReason}
                                    >
                                      "{declineReason.length > 80 ? declineReason.slice(0, 80) + "…" : declineReason}"
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <button
                                    onClick={() => handleInvite(mentor.id)}
                                    disabled={invitingId === mentor.id || hasAcceptedMentor || hasPendingInvitation || !!currentMentor}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00ADEF] text-white text-xs font-bold hover:bg-[#006F9E] disabled:opacity-40 transition shadow-2xs"
                                    title={hasAcceptedMentor || currentMentor ? "Project already has a mentor assigned — use Replace Mentor" : hasPendingInvitation ? "An invitation is already pending for this project" : "Send pre-assignment interest request to mentor"}
                                >
                                  <Send size={13} />
                                  {invitingId === mentor.id ? "Sending..." : "Request Interest"}
                                </button>
                              )}

                              {!hasAcceptedMentor && status !== "accepted" && !currentMentor && (
                                <button
                                    onClick={() => handleAssign(mentor.id)}
                                    disabled={assigningId === mentor.id || hasAcceptedMentor || !!currentMentor}
                                    className="px-3 py-1.5 rounded-xl bg-[#E38524] text-white text-xs font-bold border border-[#E38524]/20 hover:bg-[#C97019] disabled:opacity-40 transition"
                                    title={hasAcceptedMentor || currentMentor ? "Project already has a mentor assigned — use Replace Mentor" : "Directly assign mentor to project"}
                                >
                                  {assigningId === mentor.id ? "Assigning..." : "Direct Assign"}
                                </button>
                              )}
                            </div>
                          </div>
                      );
                    })}
                  </div>
              ) : (
                  <p className="text-center text-xs text-[#526274] py-4">
                    Click "Find Mentors" to see AI matches based on project domain.
                  </p>
              )}
            </div>
          </div>






          {/* Problem Statement */}
          {project.problem && (
              <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-[#E38524] font-bold text-sm border-b border-[#D6E4EA] pb-3">
                  <Lightbulb size={18} />
                  <span>Problem Statement</span>
                </div>
                <p className="text-sm text-[#111827] leading-relaxed font-medium">
                  {project.problem}
                </p>
              </div>
          )}

          {/* Solution */}
          {project.solution && (
              <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-[#00ADEF] font-bold text-sm border-b border-[#D6E4EA] pb-3">
                  <Wrench size={18} />
                  <span>Solution</span>
                </div>
                <p className="text-sm text-[#111827] leading-relaxed font-medium">
                  {project.solution}
                </p>
              </div>
          )}

          {/* Tech Stack */}
          {project.tech_stack && (
              <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-[#111827] font-bold text-sm border-b border-[#D6E4EA] pb-3">
                  <Code size={18} />
                  <span>Tech Stack</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.tech_stack.split(",").map((tech, index) => (
                      <span key={index} className="bg-[#F6FAFC] text-[#006F9E] px-3 py-1 text-xs font-bold border border-[#D6E4EA] rounded-full">
                  {tech.trim()}
                </span>
                  ))}
                </div>
              </div>
          )}

          {/* Project Links */}
          {(project.github_url || project.demo_url) && (
              <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-[#111827] font-bold text-sm border-b border-[#D6E4EA] pb-3">
                  <Globe size={18} />
                  <span>Project Links</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {project.github_url && (
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#111827] text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-[#526274] transition">
                        <Github size={16} /> View on GitHub
                      </a>
                  )}
                  {project.demo_url && (
                      <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#00ADEF] text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-[#006F9E] transition">
                        <Globe size={16} /> View Live Demo
                      </a>
                  )}
                </div>
              </div>
          )}
        </div>
      </div>
  );
};

export default ProjectDetails;