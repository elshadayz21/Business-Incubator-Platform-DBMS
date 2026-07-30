import { useState } from "react";
import {
  ArrowLeft,
  User,
  DollarSign,
  Calendar,
  FileText,
  Save,
  AlertCircle,
  Loader2,
} from "lucide-react";

const electron = window.electron || {};
const invoke =
  electron.invoke ||
  (async () => {
    console.error("Electron IPC not available");
    return null;
  });

export default function FundingDetails({ request, onBack }) {
  const [status, setStatus] = useState(request?.status || "Pending");
  const [notes, setNotes] = useState(request?.notes || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleUpdateStatus = async () => {
    if (!request?.id) return;

    setLoading(true);
    try {
      const result = await invoke("funding:updateStatus", {
        id: request.id,
        status,
        notes,
      });

      if (result.success) {
        setMessage({
          type: "success",
          text: "Funding request updated successfully!",
        });
        setTimeout(() => {
          onBack();
        }, 1500);
      } else {
        setMessage({ type: "error", text: "Failed to update funding request" });
      }
    } catch (error) {
      console.error("Error updating funding request:", error);
      setMessage({ type: "error", text: error.message || "Failed to update" });
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || "";
    const base =
      "inline-flex items-center gap-2 px-3 py-1 text-xs font-black border-2 border-black uppercase shadow-[2px_2px_0_0_black]";

    if (statusLower === "approved") return `${base} bg-green-400 text-black`;
    if (statusLower === "pending") return `${base} bg-yellow-400 text-black`;
    if (statusLower === "rejected") return `${base} bg-red-400 text-black`;
    if (statusLower === "under review") return `${base} bg-blue-400 text-black`;
    return `${base} bg-gray-200 text-gray-600`;
  };

  if (!request) {
    return (
      <div className="p-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white border-2 border-black hover:bg-white hover:text-black font-bold uppercase transition-all shadow-[4px_4px_0_0_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] mb-4"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
          Back
        </button>
        <div className="bg-white border-4 border-black p-8 text-center border-dashed">
          <AlertCircle
            className="mx-auto text-black mb-4"
            size={48}
            strokeWidth={1.5}
          />
          <p className="text-black font-bold text-xl uppercase">
            Funding request not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1920px] mx-auto bg-[#FFFDF5] min-h-screen">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white border-2 border-black hover:bg-white hover:text-black font-black uppercase transition-all shadow-[4px_4px_0_0_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] mb-8"
      >
        <ArrowLeft size={20} strokeWidth={3} />
        Back
      </button>

      <div className="mb-10 border-b-4 border-black pb-6">
        <h1 className="text-4xl md:text-5xl font-black text-black uppercase mb-2 tracking-tight">
          Funding Review
        </h1>
        <p className="text-xl text-gray-600 font-bold border-l-4 border-black pl-4">
          // Review details and update application status
        </p>
      </div>

      {message && (
        <div
          className={`mb-8 border-4 border-black p-4 font-bold uppercase shadow-[4px_4px_0_0_black] flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-400 text-black"
              : "bg-red-400 text-black"
          }`}
        >
          {message.type === "error" && (
            <AlertCircle size={24} strokeWidth={2.5} />
          )}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_black]">
            <h2 className="text-2xl font-black text-black uppercase mb-6 border-b-4 border-black pb-2 inline-block">
              Project Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-black text-gray-500 uppercase mb-1 tracking-wider">
                  Project Name
                </p>
                <p className="text-xl font-black text-black uppercase">
                  {request.project?.name}
                </p>
              </div>
              <div>
                <p className="text-xs font-black text-gray-500 uppercase mb-1 tracking-wider">
                  Domain
                </p>
                <p className="text-xl font-black text-black uppercase">
                  {request.project?.domain}
                </p>
              </div>
              <div>
                <p className="text-xs font-black text-gray-500 uppercase mb-1 tracking-wider">
                  Stage
                </p>
                <span className="inline-block px-3 py-1 bg-black text-white text-sm font-bold border-2 border-black uppercase shadow-[2px_2px_0_0_gray]">
                  {request.project?.stage || request.funding_stage}
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-gray-500 uppercase mb-1 tracking-wider">
                  Current Status
                </p>
                <div className={getStatusColor(request.project?.status)}>
                  {request.project?.status}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_black]">
            <h2 className="text-2xl font-black text-black uppercase mb-6 border-b-4 border-black pb-2 inline-block">
              Founder Information
            </h2>

            {request.founders && request.founders.length > 0 ? (
              <div className="space-y-6">
                {request.founders.map((founder, index) => (
                  <div
                    key={index}
                    className="border-2 border-black p-6 bg-[#FFFDF5] hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-6">
                      {founder.profile_image ? (
                        <img
                          src={founder.profile_image}
                          alt={founder.name}
                          className="w-20 h-20 border-2 border-black object-cover shadow-[4px_4px_0_0_black]"
                        />
                      ) : (
                        <div className="w-20 h-20 border-2 border-black bg-gray-200 flex items-center justify-center shadow-[4px_4px_0_0_black]">
                          <User
                            size={32}
                            strokeWidth={2}
                            className="text-black"
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-xl font-black text-black uppercase mb-1">
                          {founder.name}
                        </p>
                        <p className="text-sm font-bold text-gray-500 lowercase">
                          {founder.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 font-bold uppercase border-2 border-dashed border-gray-300 p-4 text-center">
                No founder information available
              </p>
            )}
          </div>

          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_black]">
            <h2 className="text-2xl font-black text-black uppercase mb-6 border-b-4 border-black pb-2 inline-block">
              Request Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="border-2 border-black p-4 bg-gray-50">
                <p className="text-xs font-black text-gray-500 uppercase mb-2 flex items-center gap-2">
                  <DollarSign size={16} /> Amount Requested
                </p>
                <p className="text-4xl font-black text-black tracking-tighter">
                  $
                  {parseFloat(request.amount || 0).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="border-2 border-black p-4 bg-gray-50">
                <p className="text-xs font-black text-gray-500 uppercase mb-2 flex items-center gap-2">
                  <Calendar size={16} /> Requested Date
                </p>
                <p className="text-xl font-black text-black uppercase">
                  {request.requested_at
                    ? new Date(request.requested_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )
                    : "N/A"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-black text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <FileText size={16} /> Description
                </p>
                <div className="text-black font-medium border-l-4 border-black pl-6 py-2 leading-relaxed">
                  {request.description || "No description provided"}
                </div>
              </div>
            </div>

            {request.reviewed_at && (
              <div className="bg-black text-white p-4 border-2 border-black shadow-[4px_4px_0_0_gray]">
                <p className="text-xs font-bold uppercase mb-1 opacity-70">
                  Last Review
                </p>
                <p className="font-bold uppercase tracking-wide">
                  {new Date(request.reviewed_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  by Admin
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div
            className={`border-4 border-black p-8 shadow-[8px_8px_0_0_black] ${
              status.toLowerCase() === "approved"
                ? "bg-green-50"
                : status.toLowerCase() === "rejected"
                  ? "bg-red-50"
                  : "bg-yellow-50"
            }`}
          >
            <div className="inline-block px-3 py-1 text-xs font-black border-2 border-black bg-white uppercase mb-4 shadow-[2px_2px_0_0_black]">
              Current Status
            </div>
            <p
              className={`text-4xl font-black uppercase tracking-tight ${
                status.toLowerCase() === "approved"
                  ? "text-green-600"
                  : status.toLowerCase() === "rejected"
                    ? "text-red-600"
                    : "text-yellow-600"
              }`}
            >
              {request.status}
            </p>
          </div>

          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_black]">
            <h3 className="text-xl font-black text-black uppercase mb-6 border-b-4 border-black pb-2">
              Update Status
            </h3>

            <div className="mb-6">
              <label className="block text-xs font-black text-gray-700 uppercase mb-2 tracking-wide">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black bg-white focus:outline-none focus:bg-blue-50 font-bold uppercase cursor-pointer shadow-[4px_4px_0_0_black] transition-all"
              >
                <option value="Pending">PENDING</option>
                <option value="Under Review">UNDER REVIEW</option>
                <option value="Approved">APPROVED</option>
                <option value="Rejected">REJECTED</option>
              </select>
            </div>

            <div className="mb-8">
              <label className="block text-xs font-black text-gray-700 uppercase mb-2 tracking-wide">
                Review Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ADD DECISION NOTES HERE..."
                className="w-full px-4 py-3 border-2 border-black bg-white focus:outline-none focus:bg-blue-50 font-bold min-h-[150px] resize-none shadow-[4px_4px_0_0_black] transition-all placeholder:text-gray-400"
              />
            </div>

            <button
              onClick={handleUpdateStatus}
              disabled={loading}
              className={`w-full px-6 py-4 font-black uppercase border-2 border-black transition-all flex items-center justify-center gap-3 text-lg ${
                loading
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed translate-x-[2px] translate-y-[2px] shadow-none"
                  : "bg-black text-white hover:bg-white hover:text-black shadow-[6px_6px_0_0_black] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} /> Updating...
                </>
              ) : (
                <>
                  <Save size={24} strokeWidth={3} /> Update Status
                </>
              )}
            </button>

            <div className="mt-8 pt-6 border-t-4 border-black">
              <p className="text-xs font-black text-gray-500 uppercase mb-4 tracking-widest">
                Status Legend
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 bg-yellow-400 border-2 border-black shadow-[1px_1px_0_0_black]"></span>
                  <span className="text-sm font-bold text-gray-900 uppercase">
                    Pending
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 bg-blue-400 border-2 border-black shadow-[1px_1px_0_0_black]"></span>
                  <span className="text-sm font-bold text-gray-900 uppercase">
                    Under Review
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 bg-green-400 border-2 border-black shadow-[1px_1px_0_0_black]"></span>
                  <span className="text-sm font-bold text-gray-900 uppercase">
                    Approved
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 bg-red-400 border-2 border-black shadow-[1px_1px_0_0_black]"></span>
                  <span className="text-sm font-bold text-gray-900 uppercase">
                    Rejected
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
