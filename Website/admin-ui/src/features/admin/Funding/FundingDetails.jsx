import { useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  DollarSign,
  Calendar,
  FileText,
  Save,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function FundingDetails({ request, onBack }) {
  const [status, setStatus] = useState(request?.status || "Pending");
  const [notes, setNotes] = useState(request?.notes || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [approvedAmount, setApprovedAmount] = useState(
    request?.approved_amount || request?.amount || ""
  );
  const [negotiations, setNegotiations] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [proposedAmount, setProposedAmount] = useState("");

  // Fetch negotiation history on load
  useEffect(() => {
    if (!request?.id) return;
    fetch(`/api/admin/funding/${request.id}/negotiations`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((res) => {
        if (res?.success) setNegotiations(res.data);
      });
  }, [request?.id]);

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!request?.id) return;

    setLoading(true);
    try {
      await fetch(`/api/admin/funding/${request.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, notes, approvedAmount }),
      });

      setMessage({
        type: "success",
        text: "Funding request status updated successfully!",
      });

      setTimeout(() => {
        onBack();
      }, 1200);
    } catch (error) {
      console.error("Network error updating funding request:", error);
      setMessage({ type: "error", text: "Network error. Please try again." });
    }
    setLoading(false);
  };

  // Handle sending negotiation message / counter-offer
  const handleSendMessage = async () => {
    if (!newMessage.trim() && !proposedAmount) return;
    const res = await fetch(`/api/admin/funding/${request.id}/negotiations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        message: newMessage,
        proposed_amount: proposedAmount || null,
      }),
    });
    const data = await res.json();
    if (data?.success) {
      setNegotiations((prev) => [...prev, data.data]);
      setNewMessage("");
      setProposedAmount("");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D6E4EA] bg-white text-xs font-bold text-[#006F9E] hover:bg-[#EAF8FC] transition shadow-xs"
      >
        <ArrowLeft size={16} /> Back to Funding List
      </button>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
              : "bg-rose-50 text-rose-800 border-rose-300"
          }`}
        >
          <AlertCircle size={16} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Top Section: 2 Columns Info + 1 Column Decision Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Request Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#111827] font-['Space_Grotesk'] border-b border-[#D6E4EA] pb-3">
              Startup &amp; Project Info
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-bold text-[#526274] block mb-0.5">
                  Project Name
                </span>
                <p className="text-base font-extrabold text-[#111827]">
                  {request.project?.name}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#526274] block mb-0.5">
                  Domain
                </span>
                <p className="text-sm font-bold text-[#006F9E]">
                  {request.project?.domain}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#526274] block mb-0.5">
                  Incubation Stage
                </span>
                <span className="inline-flex px-2.5 py-0.5 rounded-full bg-[#EAF8FC] text-[#006F9E] text-xs font-bold border border-[#00ADEF]/20">
                  {request.project?.stage || request.funding_stage}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#526274] block mb-0.5">
                  Requested Amount
                </span>
                <p className="text-xl font-extrabold text-[#E38524] font-['Space_Grotesk']">
                  $
                  {parseFloat(request.amount || 0).toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#111827] font-['Space_Grotesk'] border-b border-[#D6E4EA] pb-3">
              Founder Profile
            </h2>

            {request.founders && request.founders.length > 0 ? (
              <div className="space-y-3">
                {request.founders.map((founder, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-[#F6FAFC] rounded-xl border border-[#D6E4EA]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#00ADEF] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {founder.name
                        ? founder.name.charAt(0).toUpperCase()
                        : "F"}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#111827]">
                        {founder.name}
                      </p>
                      <p className="text-[11px] text-[#526274]">
                        {founder.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#526274] italic">
                No founder info attached.
              </p>
            )}
          </div>

          <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-[#111827] font-['Space_Grotesk'] border-b border-[#D6E4EA] pb-3">
              Request Pitch &amp; Description
            </h2>
            <p className="text-xs text-[#111827] leading-relaxed italic bg-[#F6FAFC] p-4 rounded-xl border border-[#D6E4EA]">
              "{request.description || "No detailed pitch description provided."}"
            </p>
          </div>
        </div>

        {/* Right column: Decision Box */}
        <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-5 h-fit">
          <div className="border-b border-[#D6E4EA] pb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] block">
              Investment Review
            </span>
            <h2 className="text-lg font-bold text-[#111827] font-['Space_Grotesk']">
              Update Request Status
            </h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#526274] mb-1">
              Decision Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
            >
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#526274] mb-1">
              Review Notes &amp; Rationale
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add evaluation comments, conditions, or grant reference notes..."
              rows="4"
              className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#526274] mb-1">
              Approved Amount ($)
            </label>
            <input
              type="number"
              value={approvedAmount}
              onChange={(e) => setApprovedAmount(e.target.value)}
              placeholder="e.g., 35000"
              className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF]"
            />
            <p className="text-[10px] text-[#526274] mt-1 italic">
              Change this if you are offering a different amount than requested.
            </p>
          </div>

          <button
            onClick={handleUpdateStatus}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#E38524] text-white text-xs font-extrabold uppercase shadow-xs hover:bg-[#C97019] disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>Save Status Decision</span>
          </button>
        </div>
      </div>

      {/* Full-Width Negotiation Thread Section */}
      <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#111827] font-['Space_Grotesk'] border-b border-[#D6E4EA] pb-3">
          Negotiation Thread
        </h2>

        <div className="space-y-3 max-h-72 overflow-y-auto">
          {negotiations.length === 0 ? (
            <p className="text-xs text-[#526274] italic">No messages yet.</p>
          ) : (
            negotiations.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-xl border text-xs max-w-[80%] ${
                  n.sender_role === "admin"
                    ? "bg-[#EAF8FC] border-[#00ADEF]/20 ml-auto"
                    : "bg-[#F6FAFC] border-[#D6E4EA]"
                }`}
              >
                <p className="font-bold text-[#111827] mb-0.5">
                  {n.sender_name}{" "}
                  <span className="font-normal text-[#526274]">
                    · {n.sender_role}
                  </span>
                </p>
                {n.message && <p className="text-[#111827]">{n.message}</p>}
                {n.proposed_amount && (
                  <p className="font-bold text-[#E38524] mt-1">
                    Proposed: ${parseFloat(n.proposed_amount).toLocaleString()}
                  </p>
                )}
                <p className="text-[10px] text-[#526274] mt-1">
                  {new Date(n.created_at).toLocaleString("en-US")}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[#D6E4EA] pt-3 space-y-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Send a message to the entrepreneur..."
            rows="2"
            className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={proposedAmount}
              onChange={(e) => setProposedAmount(e.target.value)}
              placeholder="Counter-offer amount (optional)"
              className="flex-1 px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF]"
            />
            <button
              onClick={handleSendMessage}
              className="px-5 py-2.5 rounded-xl bg-[#00ADEF] text-white text-xs font-extrabold uppercase hover:bg-[#078CC8] transition cursor-pointer"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}