import { useState } from "react";
import {
  XCircle,
  Users,
  Target,
  Lightbulb,
  Wrench,
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
      setMentors(data);
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId })
      });

      if (!response.ok) throw new Error('Failed to assign mentor');

      // Remove the assigned mentor from the suggested list
      setMentors(prev => prev.filter(m => m.id !== mentorId));
      alert("Mentor assigned successfully!");
    } catch (error) {
      console.error("Error assigning mentor:", error);
      alert("Error assigning mentor.");
    } finally {
      setAssigningId(null);
    }
  };

  return (
      <div className="flex flex-col h-full w-full bg-[#FFFDF5]">
        {/* Header */}
        <div className="p-6 border-b-4 border-black flex items-center justify-between bg-black text-white shrink-0">
          <h2 className="text-2xl font-black uppercase tracking-tight">Project Details</h2>
          <button onClick={onClose} className="text-white hover:text-gray-300 transition-all hover:rotate-90 duration-300">
            <XCircle size={32} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8">

          <div className="bg-white border-4 border-black p-8 mb-8 shadow-[6px_6px_0_0_#000]">
            <h3 className="text-4xl font-black uppercase text-black mb-4 tracking-tighter">
              {project.title || project.name}
            </h3>
            <p className="text-xl text-gray-600 font-bold border-l-4 border-[#4f46e5] pl-4 italic">
              "{project.short_description}"
            </p>
          </div>

          {/* === ML MATCHER BUTTON & LIST === */}
          <div className="bg-white border-4 border-black p-8 mb-8 shadow-[6px_6px_0_0_#000]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-2xl font-black uppercase text-black">AI Suggested Mentors</h4>
              <button
                  onClick={fetchMentors}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Find Mentors"}
              </button>
            </div>

            {mentors.length > 0 && (
                <div className="space-y-4 mt-4">
                  {mentors.map((mentor) => {
                    const score = Math.round((mentor.matchScore || 0) * 100);
                    return (
                        <div key={mentor.id} className="border-2 border-black p-4 flex justify-between items-center bg-gray-50">
                          <div>
                            <p className="font-bold text-lg text-black">{mentor.name}</p>
                            <p className="text-sm text-gray-600 uppercase">{mentor.expertise}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-2xl font-black text-blue-600">{score}%</span>
                            <button
                                onClick={() => handleAssign(mentor.id)}
                                disabled={assigningId === mentor.id}
                                className="px-4 py-2 bg-green-600 text-white font-bold uppercase rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                            >
                              {assigningId === mentor.id ? 'Assigning...' : 'Assign'}
                            </button>
                          </div>
                        </div>
                    );
                  })}
                </div>
            )}
          </div>
          {/* === END ML MATCHER === */}

          {project.problem && (
              <div className="bg-white border-4 border-black p-8 mb-8 shadow-[6px_6px_0_0_#000]">
                <div className="flex items-center gap-4 mb-4 border-b-4 border-black pb-4">
                  <div className="bg-[#f59e0b] text-black p-2 border-2 border-black"><Lightbulb size={24} strokeWidth={2.5} /></div>
                  <h4 className="text-2xl font-black uppercase text-black">Problem Statement</h4>
                </div>
                <p className="text-lg text-gray-800 font-medium leading-relaxed">{project.problem}</p>
              </div>
          )}

        </div>
      </div>
  );
};

export default ProjectDetails;