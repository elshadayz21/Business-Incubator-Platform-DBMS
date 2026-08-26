import { useState, useEffect } from "react";
import { Sparkles, Send, CheckCircle2, Clock } from "lucide-react";

export default function SuggestedMentorsPanel({ projectId, onAssignSuccess }) {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [invitingId, setInvitingId] = useState(null);
  const [invitations, setInvitations] = useState({});

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/invitations`);
      if (response.ok) {
        const data = await response.json();
        const map = {};
        if (Array.isArray(data?.data)) {
          data.data.forEach((inv) => {
            map[inv.mentor_id] = { status: inv.status, reason: inv.decline_reason };
          });
        }
        setInvitations(map);
      }
    } catch (e) {
      console.error("Error fetching invitations:", e);
    }
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/suggested-mentors?limit=5`);
      if (!response.ok) throw new Error("Failed to fetch suggested mentors");

      const data = await response.json();
      setMentors(data?.mentors || data || []);
      fetchInvitations();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchInvitations();
    }
  }, [projectId]);

  const hasAcceptedMentor = Object.values(invitations).some((i) => i?.status === "accepted");
  const hasPendingInvitation = Object.values(invitations).some((i) => i?.status === "pending");

  const handleInvite = async (mentorId) => {
    if (hasAcceptedMentor) {
      alert("❌ This project already has an accepted mentor assigned.");
      return;
    }
    if (hasPendingInvitation && invitations[mentorId]?.status !== "pending") {
      alert("❌ An invitation is already pending for this project. You can invite another mentor after it is declined.");
      return;
    }
    setInvitingId(mentorId);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/invite-mentor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId, message: "We invite your expertise to mentor this startup project." }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("📩 " + (data.message || "Interest invitation sent to mentor successfully!"));
        setInvitations((prev) => ({
          ...prev,
          [mentorId]: { status: "pending", reason: null },
        }));
        await fetchInvitations();
      } else {
        alert("❌ " + (data.message || "Failed to send invitation."));
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setInvitingId(null);
    }
  };

  const handleAssign = async (mentorId) => {
    if (hasAcceptedMentor) {
      alert("❌ This project already has an accepted mentor assigned.");
      return;
    }
    setAssigningId(mentorId);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/assign-mentor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setInvitations((prev) => ({
          ...prev,
          [mentorId]: { status: "accepted", reason: null },
        }));
        await fetchInvitations();
        if (onAssignSuccess) onAssignSuccess(mentorId);
        setMentors((prev) => prev.filter((m) => m.id !== mentorId));
      } else {
        alert("❌ " + (data.message || "Failed to assign mentor."));
      }
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

      {hasAcceptedMentor && (
        <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl mb-3">
          ✓ Mentor Assigned: A mentor has accepted the invitation for this project.
        </p>
      )}

      {!hasAcceptedMentor && hasPendingInvitation && (
        <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-xl mb-3">
          ⏳ Invitation Pending: You can invite another mentor once the current invitation is declined.
        </p>
      )}

      {error && <p className="text-rose-600 text-xs mb-3">{error}</p>}

      {mentors.length > 0 && (
        <div className="space-y-3">
          {mentors.map((mentor) => {
            const score = Math.round((mentor.matchScore || 0) * 100);
            const status = invitations[mentor.id]?.status;
            const declineReason = invitations[mentor.id]?.reason;

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

                    {status === "pending" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                        <Clock size={12} />
                        Invited (Pending)
                      </span>
                    ) : status === "accepted" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        <CheckCircle2 size={12} />
                        Accepted
                      </span>
                    ) : status === "declined" ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                          Declined
                        </span>
                        {declineReason && (
                          <span
                            className="text-[9px] italic text-rose-600 max-w-[14rem] text-right leading-snug"
                            title={declineReason}
                          >
                            "{declineReason.length > 60 ? declineReason.slice(0, 60) + "…" : declineReason}"
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInvite(mentor.id)}
                        disabled={invitingId === mentor.id || hasAcceptedMentor || hasPendingInvitation}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#00ADEF] text-white text-xs font-bold rounded-lg hover:bg-[#006F9E] disabled:opacity-40 transition"
                        title={hasAcceptedMentor ? "Project already has an accepted mentor" : hasPendingInvitation ? "An invitation is already pending for this project" : "Send pre-assignment interest request to mentor"}
                      >
                        <Send size={12} />
                        {invitingId === mentor.id ? "Sending..." : "Request Interest"}
                      </button>
                    )}

                    {!hasAcceptedMentor && status !== "accepted" && (
                      <button
                        onClick={() => handleAssign(mentor.id)}
                        disabled={assigningId === mentor.id || hasAcceptedMentor}
                        className="px-2.5 py-1 bg-[#E38524] text-white text-xs font-bold rounded-lg hover:bg-[#C97019] disabled:opacity-40 transition"
                        title={hasAcceptedMentor ? "Project already has an accepted mentor" : "Directly assign mentor to project"}
                      >
                        {assigningId === mentor.id ? "..." : "Direct Assign"}
                      </button>
                    )}
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
