import { useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";

export default function SuggestedMentorsPanel({ projectId, onAssignSuccess }) {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assigningId, setAssigningId] = useState(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/suggested-mentors?limit=5`);
      if (!response.ok) throw new Error("Failed to fetch suggested mentors");

      const data = await response.json();
      setMentors(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (mentorId) => {
    setAssigningId(mentorId);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/assign-mentor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId }),
      });

      if (!response.ok) throw new Error("Failed to assign mentor");

      if (onAssignSuccess) onAssignSuccess(mentorId);
      setMentors((prev) => prev.filter((m) => m.id !== mentorId));
    } catch (err) {
      alert(err.message);
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs font-sans">
      <div className="flex items-center justify-between mb-4 border-b border-[#D6E4EA] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-[#00ADEF]" size={18} />
          <h3 className="text-sm font-bold text-[#111827] font-['Space_Grotesk']">
            AI Suggested Mentors
          </h3>
        </div>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="px-3.5 py-1.5 bg-[#00ADEF] text-white text-xs font-bold rounded-xl hover:bg-[#006F9E] disabled:opacity-50 transition"
        >
          {loading ? "Analyzing..." : "Find Mentors"}
        </button>
      </div>

      {error && <p className="text-rose-600 text-xs mb-3">{error}</p>}

      {mentors.length > 0 && (
        <div className="space-y-3">
          {mentors.map((mentor) => {
            const score = Math.round((mentor.matchScore || 0) * 100);

            return (
              <div
                key={mentor.id}
                className="border border-[#D6E4EA] rounded-xl p-3.5 bg-[#F6FAFC] hover:bg-white transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-xs text-[#111827]">{mentor.name}</p>
                    <p className="text-[11px] text-[#526274]">{mentor.expertise}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#006F9E] bg-[#EAF8FC] px-2 py-0.5 rounded-full border border-[#00ADEF]/20">
                      {score}%
                    </span>
                    <button
                      onClick={() => handleAssign(mentor.id)}
                      disabled={assigningId === mentor.id}
                      className="px-2.5 py-1 bg-[#E38524] text-white text-xs font-bold rounded-lg hover:bg-[#C97019] disabled:opacity-50"
                    >
                      {assigningId === mentor.id ? "..." : "Assign"}
                    </button>
                  </div>
                </div>
                <div className="w-full bg-[#D6E4EA] rounded-full h-1.5">
                  <div
                    className="bg-[#00ADEF] h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && mentors.length === 0 && !error && (
        <p className="text-xs text-[#526274] text-center py-2">
          Click "Find Mentors" to run algorithm matching.
        </p>
      )}
    </div>
  );
}
