import React, { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Search,
  DollarSign,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Briefcase,
  Layers,
} from "lucide-react";
import FundingDetails from "./FundingDetails";
import StatCard from "../../../components/StatCard";

const electron = window.electron || {};
const invoke =
  electron.invoke ||
  (async () => {
    return [];
  });

export default function Funding() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0,
  });

  const calculateStats = useCallback((requests) => {
    const newStats = {
      total: requests.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      totalAmount: 0,
    };

    requests.forEach((req) => {
      newStats.totalAmount += parseFloat(req.amount || 0);
      if (req.status.toLowerCase() === "pending") newStats.pending++;
      else if (req.status.toLowerCase() === "approved") newStats.approved++;
      else if (req.status.toLowerCase() === "rejected") newStats.rejected++;
    });

    setStats(newStats);
  }, []);

  const fetchFundingRequests = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = [];
      if (filterStatus !== "all") queryParams.push(`status=${filterStatus}`);
      if (filterStage !== "all")
        queryParams.push(`funding_stage=${filterStage}`);

      const query = queryParams.length > 0 ? "?" + queryParams.join("&") : "";
      const data = await invoke("funding:getAll", query);
      const requests = data?.data || [];

      setFundingRequests(requests);
      calculateStats(requests);
    } catch (error) {
      console.error("Error fetching funding:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterStage, calculateStats]);

  const fetchDashboard = useCallback(async () => {
    try {
      await invoke("funding:getDashboard");
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    }
  }, []);

  useEffect(() => {
    fetchFundingRequests();
    fetchDashboard();
  }, [fetchFundingRequests, fetchDashboard]);

  const filteredRequests = fundingRequests.filter((request) => {
    const matchesSearch =
      request.project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.founders?.some((f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesStatus =
      filterStatus === "all" ||
      request.status?.toLowerCase() === filterStatus.toLowerCase();

    const matchesStage =
      filterStage === "all" ||
      (request.project?.stage || request.funding_stage)?.toLowerCase() ===
        filterStage.toLowerCase();

    return matchesSearch && matchesStatus && matchesStage;
  });

  const getStatusBadgeStyles = (status) => {
    const statusLower = status?.toLowerCase() || "";
    const base =
      "inline-flex items-center gap-2 px-3 py-1 text-xs font-black border-2 border-black uppercase shadow-[2px_2px_0_0_black]";

    if (statusLower === "approved") return `${base} bg-green-400 text-black`;
    if (statusLower === "pending") return `${base} bg-yellow-400 text-black`;
    if (statusLower === "rejected") return `${base} bg-red-400 text-black`;
    return `${base} bg-gray-200 text-gray-600`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFFDF5] h-screen font-sans">
      {showDetails ? (
        <FundingDetails
          request={selectedRequest}
          onBack={() => {
            setShowDetails(false);
            setSelectedRequest(null);
            fetchFundingRequests(); 
          }}
        />
      ) : (
        <div className="p-6 lg:p-10 max-w-[1920px] mx-auto">
          {/* Header */}
          <div className="mb-12">
            <span className="bg-black text-white px-3 py-1 font-bold text-sm uppercase tracking-wider mb-2 inline-block transform -rotate-1">
              Financial Overview
            </span>
            <h1 className="text-5xl md:text-6xl font-black text-black mb-2 uppercase tracking-tighter">
              Funding{" "}
              <span className="bg-[#0d9488] text-white px-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] italic inline-block transform rotate-1">
                Requests
              </span>
            </h1>
            <p className="text-xl text-slate-600 font-medium border-l-4 border-[#0d9488] pl-4 italic mt-4">
              Review investments and manage capital allocation.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            <StatCard
              title="Total Requests"
              value={stats.total}
              icon={Layers}
              bgClass="bg-[#4f46e5]"
              textClass="text-white"
            />
            <StatCard
              title="Pending"
              value={stats.pending}
              icon={Clock}
              bgClass="bg-[#f59e0b]"
              textClass="text-black"
            />
            <StatCard
              title="Approved"
              value={stats.approved}
              icon={CheckCircle}
              bgClass="bg-[#0d9488]"
              textClass="text-white"
            />
            <StatCard
              title="Rejected"
              value={stats.rejected}
              icon={XCircle}
              bgClass="bg-[#ef4444]"
              textClass="text-white"
            />
            <StatCard
              title="Total Volume"
              value={`$${(stats.totalAmount || 0).toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}`}
              icon={DollarSign}
              bgClass="bg-[#0f172a]"
              textClass="text-white"
            />
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] mb-8 flex flex-col xl:flex-row gap-6 items-center justify-between">
            <div className="relative flex-1 w-full xl:w-auto">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                size={20}
                strokeWidth={2.5}
              />
              <input
                type="text"
                placeholder="SEARCH PROJECT OR FOUNDER..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-black bg-[#FFFDF5] focus:outline-none focus:ring-0 focus:bg-white font-bold text-black placeholder-gray-500 transition-all uppercase"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
              <div className="relative w-full sm:w-auto">
                <Filter
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  size={18}
                  strokeWidth={2.5}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full sm:w-48 pl-10 pr-8 py-3 border-2 border-black bg-white text-black font-bold uppercase outline-none focus:bg-blue-50 cursor-pointer shadow-[2px_2px_0_0_black]"
                >
                  <option value="all">ALL STATUS</option>
                  <option value="Pending">PENDING</option>
                  <option value="Approved">APPROVED</option>
                  <option value="Rejected">REJECTED</option>
                  <option value="Under Review">UNDER REVIEW</option>
                </select>
              </div>

              <div className="relative w-full sm:w-auto">
                <Briefcase
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  size={18}
                  strokeWidth={2.5}
                />
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="w-full sm:w-48 pl-10 pr-8 py-3 border-2 border-black bg-white text-black font-bold uppercase outline-none focus:bg-blue-50 cursor-pointer shadow-[2px_2px_0_0_black]"
                >
                  <option value="all">ALL STAGES</option>
                  <option value="Idea">IDEA</option>
                  <option value="MVP">MVP</option>
                  <option value="Growth">GROWTH</option>
                  <option value="Scale">SCALE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed">
              <Loader2
                className="text-black animate-spin mb-4"
                size={40}
                strokeWidth={2}
              />
              <p className="text-black font-black text-xl uppercase">
                Loading requests...
              </p>
            </div>
          ) : filteredRequests.length > 0 ? (
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-[#0f172a] border-b-4 border-black text-white">
                      <th className="px-6 py-5 font-black uppercase text-sm border-r-2 border-white/20">
                        Project
                      </th>
                      <th className="px-6 py-5 font-black uppercase text-sm border-r-2 border-white/20">
                        Founder
                      </th>
                      <th className="px-6 py-5 font-black uppercase text-sm border-r-2 border-white/20">
                        Amount
                      </th>
                      <th className="px-6 py-5 font-black uppercase text-sm border-r-2 border-white/20">
                        Stage
                      </th>
                      <th className="px-6 py-5 font-black uppercase text-sm border-r-2 border-white/20">
                        Status
                      </th>
                      <th className="px-6 py-5 font-black uppercase text-sm border-r-2 border-white/20">
                        Date
                      </th>
                      <th className="px-6 py-5 text-center font-black uppercase text-sm">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black">
                    {filteredRequests.map((request) => (
                      <tr
                        key={request.id}
                        className="hover:bg-blue-50 transition-colors group"
                      >
                        <td className="px-6 py-5 border-r-2 border-black">
                          <div>
                            <p className="font-black text-black text-lg uppercase">
                              {request.project?.name}
                            </p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                              {request.project?.domain}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5 border-r-2 border-black">
                          <div>
                            {request.founders && request.founders.length > 0 ? (
                              <>
                                <p className="font-bold text-black uppercase">
                                  {request.founders[0]?.name}
                                </p>
                                <p className="text-xs font-bold text-gray-500 lowercase">
                                  {request.founders[0]?.email}
                                </p>
                              </>
                            ) : (
                              <p className="text-gray-400 font-bold">-</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 border-r-2 border-black">
                          <p className="font-black text-black text-xl">
                            $
                            {parseFloat(request.amount || 0).toLocaleString(
                              "en-US",
                              { maximumFractionDigits: 2 },
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-5 border-r-2 border-black">
                          <span className="inline-block px-3 py-1 bg-gray-100 text-black text-xs font-black border-2 border-black uppercase shadow-[2px_2px_0_0_black]">
                            {request.project?.stage || request.funding_stage}
                          </span>
                        </td>
                        <td className="px-6 py-5 border-r-2 border-black">
                          <div className={getStatusBadgeStyles(request.status)}>
                            {request.status?.toLowerCase() === "approved" && (
                              <CheckCircle size={14} strokeWidth={3} />
                            )}
                            {request.status?.toLowerCase() === "pending" && (
                              <Clock size={14} strokeWidth={3} />
                            )}
                            {request.status?.toLowerCase() === "rejected" && (
                              <XCircle size={14} strokeWidth={3} />
                            )}
                            {request.status}
                          </div>
                        </td>
                        <td className="px-6 py-5 border-r-2 border-black text-black font-bold text-sm uppercase">
                          {new Date(request.requested_at).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "short", day: "numeric" },
                          )}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetails(true);
                            }}
                            className="inline-flex items-center justify-center w-10 h-10 bg-black text-white border-2 border-black hover:bg-white hover:text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0_0_black] transition-all"
                          >
                            <Eye size={20} strokeWidth={2.5} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed text-center">
              <div className="p-6 bg-gray-100 border-2 border-black rounded-full mb-6">
                <DollarSign
                  className="text-black"
                  size={48}
                  strokeWidth={1.5}
                />
              </div>
              <h2 className="text-2xl font-black text-black uppercase mb-2">
                No requests found
              </h2>
              <p className="text-gray-600 text-lg font-medium max-w-sm mb-8">
                There are no funding requests matching your criteria.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
