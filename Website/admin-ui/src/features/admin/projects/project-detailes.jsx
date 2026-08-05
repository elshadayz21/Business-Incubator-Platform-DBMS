import { useState } from "react";
import {
  X,
  Lightbulb,
  Sparkles,
  UserCheck,
  CheckCircle,
  Building2,
  Calendar,
} from "lucide-react";

const ProjectDetails = ({ project, onClose }) => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState(null);

  if (!project) return null;

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/suggested-mentors?limit=5`);
      const data = await response.json();
      setMentors(data || []);
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
        body: JSON.stringify({ mentorId }),
      });

      if (!response.ok) throw new Error("Failed to assign mentor");

      setMentors((prev) => prev.filter((m) => m.id !== mentorId));
      alert("Mentor assigned successfully!");
    } catch (error) {
      console.error("Error assigning mentor:", error);
      alert("Error assigning mentor.");
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#F6FAFC] font-sans">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
              className="px-4 py-2 rounded-xl bg-[#00ADEF] text-white text-xs font-bold shadow-xs hover:bg-[#006F9E] disabled:opacity-50 transition"
            >
              {loading ? "Analyzing..." : "Find Mentors"}
            </button>
          </div>

          {mentors.length > 0 && (
            <div className="space-y-3 pt-2">
              {mentors.map((mentor) => {
                const score = Math.round((mentor.matchScore || 0) * 100);
                return (
                  <div
                    key={mentor.id}
                    className="border border-[#D6E4EA] rounded-xl p-4 flex items-center justify-between bg-[#F6FAFC] hover:bg-white transition"
                  >
                    <div>
                      <p className="font-bold text-sm text-[#111827]">{mentor.name}</p>
                      <p className="text-xs text-[#526274]">{mentor.expertise}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm font-extrabold text-[#006F9E] bg-[#EAF8FC] px-2.5 py-1 rounded-full border border-[#00ADEF]/20">
                        {score}% Match
                      </span>
                      <button
                        onClick={() => handleAssign(mentor.id)}
                        disabled={assigningId === mentor.id}
                        className="px-3.5 py-1.5 bg-[#E38524] text-white font-bold text-xs rounded-xl hover:bg-[#C97019] disabled:opacity-50 transition"
                      >
                        {assigningId === mentor.id ? "Assigning..." : "Assign"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
      </div>
    </div>
  );
};

export default ProjectDetails;
