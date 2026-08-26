import { useState, useEffect } from "react";
import {
  X,
  Lightbulb,
  Pencil,
  Sparkles,
  Loader2,
  Wrench,
  Code,
  Globe,
  Github,
  Calendar,
  CheckCircle2,
  XCircle,
  Users, // Added for Mentor icon
} from "lucide-react";
import SuggestedMentorsPanel from "../../../components/SuggestedMentorsPanel";

const ProjectDetails = ({ project, onClose, onOpenDecisionModal }) => {
  const [history, setHistory] = useState([]);
  const [assignedMentors, setAssignedMentors] = useState([]);

  // Fetch History and Assigned Mentors when the modal opens
  useEffect(() => {
    if (project?.id) {
      // Fetch History
      fetch(`/api/admin/projects/${project.id}/history`, { credentials: 'include' })
          .then(res => res.json())
          .then(data => setHistory(Array.isArray(data) ? data : []))
          .catch(err => console.error("Error fetching project history:", err));

      // Fetch Assigned Mentors
      fetch(`/api/admin/projects/${project.id}/mentors`, { credentials: 'include' })
          .then(res => res.json())
          .then(data => setAssignedMentors(Array.isArray(data) ? data : []))
          .catch(err => console.error("Error fetching assigned mentors:", err));
    }
  }, [project?.id]);

  if (!project) return null;

  const isApproved = project.approved === true || String(project.status).toLowerCase() === "approved";
  const isRejected = String(project.status).toLowerCase() === "rejected";
  const isPending = !isApproved && !isRejected;

  return (
      <div className="w-full bg-[#F6FAFC] font-sans pb-10">
        {/* Header */}
        <div className="sticky top-0 z-10 p-5 border-b border-[#D6E4EA] flex items-center justify-between bg-white text-[#111827] shrink-0">
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
              className="p-2 rounded-xl text-[#526274] hover:bg-[#F6FAFC] hover:text-[#111827] transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6">
          {/* Basic Meta Card */}
          <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D6E4EA] pb-4">
              <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex px-3 py-1 rounded-full bg-[#EAF8FC] text-[#006F9E] text-xs font-bold border border-[#00ADEF]/20">
                Domain: {project.domain || "General"}
              </span>
                <span className="inline-flex px-3 py-1 rounded-full bg-[#FFF1E3] text-[#E38524] text-xs font-bold border border-[#E38524]/20">
                Stage: {project.stage}
              </span>
                <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        isApproved
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                            : isRejected
                                ? "bg-rose-50 text-rose-800 border border-rose-300"
                                : "bg-amber-50 text-amber-800 border border-amber-300"
                    }`}
                >
                Status: {isApproved ? "APPROVED" : isRejected ? "REJECTED" : "PENDING"}
              </span>
              </div>

              {typeof onOpenDecisionModal === "function" && (
                  <button
                      type="button"
                      onClick={() => onOpenDecisionModal(project, !isApproved)}
                      className="px-3 py-1.5 rounded-xl bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/30 text-xs font-bold hover:bg-[#D6E4EA] transition flex items-center gap-1.5 cursor-pointer"
                      title="Change Project Status"
                  >
                    <Pencil size={14} />
                    Edit Status
                  </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-extrabold text-[#111827] font-['Space_Grotesk'] mb-2">
                  {project.title || project.name}
                </h3>
                <div className="text-xs font-medium text-[#526274] flex items-center gap-1">
                  <Calendar size={14} /> Created: {new Date(project.created_at).toLocaleDateString("en-GB")}
                </div>
              </div>
              <p className="text-sm text-[#526274] italic border-l-4 border-[#00ADEF] pl-4 py-1 bg-[#F6FAFC] rounded-r-xl">
                "{project.short_description || "No short description provided."}"
              </p>
            </div>
          </div>

          {/* Assigned Mentors Panel (New!) */}
          <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#111827] font-bold text-sm border-b border-[#D6E4EA] pb-3">
              <Users size={18} className="text-[#00ADEF]" />
              <span>Currently Assigned Mentors</span>
            </div>
            {assignedMentors.length > 0 ? (
                <div className="space-y-3">
                  {assignedMentors.map((mentor) => (
                      <div key={mentor.id} className="flex items-center gap-3 p-3 bg-[#F6FAFC] rounded-xl border border-[#D6E4EA]">
                        <div className="w-10 h-10 rounded-full bg-[#00ADEF] text-white flex items-center justify-center font-bold text-sm">
                          {mentor.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111827]">{mentor.name}</p>
                          <p className="text-xs text-[#526274] capitalize">{mentor.expertise || "General Expertise"}</p>
                        </div>
                      </div>
                  ))}
                </div>
            ) : (
                <p className="text-xs text-[#526274] italic py-2">No mentors assigned to this project yet. Use the AI panel below to find one!</p>
            )}
          </div>

          {/* AI Suggested Mentors Panel */}
          <SuggestedMentorsPanel projectId={project.id} />

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
                      <span
                          key={index}
                          className="bg-[#F6FAFC] text-[#006F9E] px-3 py-1 text-xs font-bold border border-[#D6E4EA] rounded-full"
                      >
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
                      <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 bg-[#111827] text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-[#526274] transition"
                      >
                        <Github size={16} /> View on GitHub
                      </a>
                  )}
                  {project.demo_url && (
                      <a
                          href={project.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 bg-[#00ADEF] text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-[#006F9E] transition"
                      >
                        <Globe size={16} /> View Live Demo
                      </a>
                  )}
                </div>
              </div>
          )}

          {/* Project History Timeline (Audit Trail) */}
          <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#111827] font-['Space_Grotesk'] border-b border-[#D6E4EA] pb-3">
              Status History & Audit Trail
            </h2>

            {history.length === 0 ? (
                <p className="text-xs text-[#526274] italic">No history recorded yet.</p>
            ) : (
                <div className="relative pl-6 border-l-2 border-[#00ADEF]/30 space-y-6 mt-4">
                  {history.map((log) => (
                      <div key={log.id} className="relative">
                        <div className="absolute -left-[30px] top-1.5 h-4 w-4 rounded-full border-4 border-white bg-[#00ADEF] shadow"></div>
                        <div className="rounded-xl border border-[#D6E4EA] bg-[#F6FAFC] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                          log.actor_role === 'Admin'
                              ? 'bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/20'
                              : 'bg-[#FFF1E3] text-[#E38524] border-[#E38524]/20'
                      }`}>
                        {log.actor_role} Action
                      </span>
                            <span className="text-[10px] font-bold uppercase text-[#526274]">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                          </div>
                          <p className="text-sm font-semibold text-[#111827]">
                            Status set to: <span className="font-bold">{log.status}</span>
                          </p>
                          {log.notes && (
                              <p className="text-xs text-[#526274] mt-1 italic">Notes: "{log.notes}"</p>
                          )}
                          <p className="text-[10px] text-[#526274] mt-2">Acted by: {log.actor_name || 'System'}</p>
                        </div>
                      </div>
                  ))}
                </div>
            )}
          </div>

        </div>
      </div>
  );
};

export default ProjectDetails;