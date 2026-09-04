import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Loader2,
  Inbox,
  Link as LinkIcon,
  Paperclip,
  Filter,
  X,
  ThumbsUp,
  ThumbsDown,
  MessageSquareWarning,
} from "lucide-react";

const statusMeta = (status) => {
  switch (status) {
    case "approved":
      return { label: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 };
    case "changes_requested":
      return { label: "Changes Requested", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: RotateCcw };
    case "rejected":
      return { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle };
    default:
      return { label: "Awaiting Review", cls: "bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/20", icon: Clock };
  }
};

const ProgressReview = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("submitted");
  const [reviewTarget, setReviewTarget] = useState(null); // { submission, decision }
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/portal/mentor/progress/submissions?status=${statusFilter}`, {
        credentials: "include",
      });
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading submissions:", err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const openReview = (submission, decision) => {
    setReviewTarget({ submission, decision });
    setFeedback("");
  };
  const closeReview = () => setReviewTarget(null);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewTarget) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/portal/mentor/progress/submissions/${reviewTarget.submission.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: reviewTarget.decision, feedback }),
        },
      );
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(result.error || "Failed to submit review.");
        return;
      }
      closeReview();
      fetchSubmissions();
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === "submitted").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827] font-['Space_Grotesk']">Progress Review</h1>
          <p className="text-xs text-[#526274] mt-1">
            Review work submitted by your mentee startups and give feedback.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[#526274]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
          >
            <option value="submitted">Awaiting Review</option>
            <option value="approved">Approved</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {statusFilter === "submitted" && !loading && (
        <div className="bg-[#EAF8FC] border border-[#00ADEF]/20 rounded-2xl p-4 text-xs font-bold text-[#006F9E]">
          {pendingCount} submission{pendingCount === 1 ? "" : "s"} waiting on your review
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#D6E4EA]">
          <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={32} />
          <p className="text-[#526274] font-bold text-sm">Loading submissions...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#D6E4EA] text-center p-6">
          <div className="p-4 bg-[#EAF8FC] rounded-full text-[#00ADEF] mb-3">
            <Inbox size={36} />
          </div>
          <h3 className="text-lg font-bold text-[#111827]">Nothing here</h3>
          <p className="text-xs text-[#526274] mt-1 max-w-sm">
            {statusFilter === "submitted"
              ? "No submissions are waiting on your review right now."
              : "No submissions match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const meta = statusMeta(sub.status);
            const Icon = meta.icon;
            return (
              <div key={sub.id} className="bg-white rounded-2xl border border-[#D6E4EA] shadow-xs p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F6FAFC] text-[#526274] border border-[#D6E4EA]">
                        {sub.project_name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20">
                        {sub.phase_name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}
                      >
                        <Icon size={11} /> {meta.label}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-[#111827] mt-2">{sub.task_title}</p>
                    <p className="text-[11px] text-[#526274]">
                      Submitted by {sub.submitted_by_name || "the team"} on{" "}
                      {new Date(sub.submitted_at).toLocaleString()}
                    </p>
                    {sub.notes && <p className="text-xs text-[#111827] mt-2">{sub.notes}</p>}
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {sub.link_url && (
                        <a
                          href={sub.link_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#006F9E] font-bold inline-flex items-center gap-1 hover:underline"
                        >
                          <LinkIcon size={12} /> View link
                        </a>
                      )}
                      {sub.file_path && (
                        <a
                          href={sub.file_path}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#006F9E] font-bold inline-flex items-center gap-1 hover:underline"
                        >
                          <Paperclip size={12} /> {sub.file_name || "Attached file"}
                        </a>
                      )}
                    </div>
                    {sub.review_status && sub.review_feedback && (
                      <div className="mt-3 p-3 rounded-xl bg-[#F6FAFC] border border-[#D6E4EA] text-xs text-[#111827]">
                        <span className="font-bold">Your feedback: </span>
                        {sub.review_feedback}
                      </div>
                    )}
                  </div>

                  {sub.status === "submitted" && (
                    <div className="flex sm:flex-col items-stretch gap-2 shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => openReview(sub, "approved")}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition whitespace-nowrap"
                      >
                        <ThumbsUp size={14} /> Approve
                      </button>
                      <button
                        onClick={() => openReview(sub, "changes_requested")}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition whitespace-nowrap"
                      >
                        <MessageSquareWarning size={14} /> Request Changes
                      </button>
                      <button
                        onClick={() => openReview(sub, "rejected")}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 transition whitespace-nowrap"
                      >
                        <ThumbsDown size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <div
          className="fixed inset-0 bg-[#111827]/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={closeReview}
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl border border-[#D6E4EA] shadow-lg flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#D6E4EA] flex items-center justify-between bg-[#F6FAFC]">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                  {statusMeta(reviewTarget.decision).label}
                </span>
                <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk']">
                  {reviewTarget.submission.task_title}
                </h2>
              </div>
              <button
                onClick={closeReview}
                className="p-2 text-[#526274] hover:bg-white hover:text-[#111827] rounded-xl border border-transparent hover:border-[#D6E4EA] transition-all"
              >
                <X size={22} />
              </button>
            </div>
            <form onSubmit={submitReview} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#526274] mb-1.5">
                  Feedback {reviewTarget.decision !== "approved" && "(recommended)"}
                </label>
                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={
                    reviewTarget.decision === "approved"
                      ? "Optional note to the team"
                      : "Let the team know what to change"
                  }
                  className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeReview}
                  className="px-5 py-2.5 rounded-xl border border-[#D6E4EA] text-[#526274] font-bold text-xs uppercase tracking-wider hover:bg-[#F6FAFC] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressReview;
