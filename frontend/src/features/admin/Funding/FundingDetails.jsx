
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
  const [approvedAmount, setApprovedAmount] = useState(request?.approved_amount || request?.amount || "");

  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (request?.id) {
      fetch(`/api/admin/funding/${request.id}/history`, { credentials: 'include' })
          .then(res => res.json())
          .then(data => setHistory(Array.isArray(data) ? data : []))
          .catch(err => console.error("Error fetching history:", err));
    }
  }, [request?.id]);
  const handleUpdateStatus = async () => {
    if (!request?.id) return;

    setLoading(true);
    try {
      // Send the request to update the status
      await fetch(`/api/admin/funding/${request.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, notes, approvedAmount }) // <--- ONLY THIS LINE CHANGED!
      });

      // just show the success message!
      setMessage({
        type: "success",
        text: "Funding request status updated successfully!",
      });

      // Go back to the list after 1.2 seconds
      setTimeout(() => {
        onBack();
      }, 1200);

    } catch (error) {
      // This will only trigger if the network is completely disconnected
      console.error("Network error updating funding request:", error);
      setMessage({ type: "error", text: "Network error. Please try again." });
    }
    setLoading(false);
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Request Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#111827] font-['Space_Grotesk'] border-b border-[#D6E4EA] pb-3">
              Startup &amp; Project Info
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-bold text-[#526274] block mb-0.5">Project Name</span>
                <p className="text-base font-extrabold text-[#111827]">{request.project?.name}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#526274] block mb-0.5">Domain</span>
                <p className="text-sm font-bold text-[#006F9E]">{request.project?.domain}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#526274] block mb-0.5">Incubation Stage</span>
                <span className="inline-flex px-2.5 py-0.5 rounded-full bg-[#EAF8FC] text-[#006F9E] text-xs font-bold border border-[#00ADEF]/20">
                  {request.project?.stage || request.funding_stage}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#526274] block mb-0.5">Requested Amount</span>
                <p className="text-xl font-extrabold text-[#E38524] font-['Space_Grotesk']">
                  ${parseFloat(request.amount || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
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
                  <div key={idx} className="flex items-center gap-3 p-3 bg-[#F6FAFC] rounded-xl border border-[#D6E4EA]">
                    <div className="w-10 h-10 rounded-full bg-[#00ADEF] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {founder.name ? founder.name.charAt(0).toUpperCase() : "F"}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#111827]">{founder.name}</p>
                      <p className="text-[11px] text-[#526274]">{founder.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#526274] italic">No founder info attached.</p>
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
            <label className="block text-xs font-bold text-[#526274] mb-1">Decision Status</label>
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
            <label className="block text-xs font-bold text-[#526274] mb-1">Review Notes &amp; Rationale</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add evaluation comments, conditions, or grant reference notes..."
              rows="4"
              className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#526274] mb-1">Approved Amount ($)</label>
            <input
                type="number"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                placeholder="e.g., 35000"
                className="w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF]"
            />
            <p className="text-[10px] text-[#526274] mt-1 italic">Change this if you are offering a different amount than requested.</p>
          </div>

          <button
            onClick={handleUpdateStatus}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#E38524] text-white text-xs font-extrabold uppercase shadow-xs hover:bg-[#C97019] disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Save Status Decision</span>
          </button>
          {/* Funding History Timeline */}
          <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-4 lg:col-span-3">
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
    </div>
  );
}
