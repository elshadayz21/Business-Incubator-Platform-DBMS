import { useState } from "react";
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
} from "lucide-react";

const ProjectDetails = ({ project, onClose }) => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState(null);

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
    } catch (error) {
      console.error("Error fetching mentors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (mentorId) => {
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

            <div className="pt-2">
              {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin text-[#00ADEF]" size={24} />
                  </div>
              ) : mentors.length > 0 ? (
                  <div className="space-y-3">
                    {mentors.map((mentor) => {
                      const score = Math.round((mentor.matchScore || 0) * 100);
                      return (
                          <div key={mentor.id} className="flex items-center justify-between p-4 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] hover:border-[#00ADEF]/30 transition">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#00ADEF] text-white flex items-center justify-center font-bold text-sm">
                                {mentor.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#111827]">{mentor.name}</p>
                                <p className="text-xs text-[#526274] capitalize">{mentor.expertise || "General Expertise"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                        <span className="text-sm font-extrabold text-[#006F9E] bg-[#EAF8FC] px-2.5 py-1 rounded-full border border-[#00ADEF]/20">
                          {score}% Match
                        </span>
                              <button
                                  onClick={() => handleAssign(mentor.id)}
                                  disabled={assigningId === mentor.id}
                                  className="px-3 py-1.5 rounded-lg bg-[#E38524] text-white text-xs font-bold border border-[#E38524]/20 hover:bg-[#E38524]/80 disabled:opacity-50 transition"
                              >
                                {assigningId === mentor.id ? "Assigning..." : "Assign"}
                              </button>
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