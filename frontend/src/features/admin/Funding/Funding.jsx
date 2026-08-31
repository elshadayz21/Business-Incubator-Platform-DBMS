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
    Layers,
} from "lucide-react";
import FundingDetails from "./FundingDetails";
import StatCard from "../../../components/StatCard";

export default function Funding() {
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterStage, setFilterStage] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [fundingRequests, setFundingRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadMoreLoading, setLoadMoreLoading] = useState(false);
    const [fundingPage, setFundingPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totals, setTotals] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        total_amount: 0,
    });

    const fetchTotals = useCallback(async () => {
        try {
            const response = await fetch("/api/admin/funding/totals", {
                credentials: "include",
            });
            const data = await response.json();
            if (data) {
                setTotals({
                    total: parseInt(data.total) || 0,
                    pending: parseInt(data.pending) || 0,
                    approved: parseInt(data.approved) || 0,
                    rejected: parseInt(data.rejected) || 0,
                    total_amount: parseFloat(data.total_amount) || 0,
                });
            }
        } catch (error) {
            console.error("Failed to fetch funding totals:", error);
        }
    }, []);

    const fetchFundingRequests = useCallback(async (page = 1) => {
        if (page === 1) { setLoading(true); } else { setLoadMoreLoading(true); }
        try {
            const queryParams = [`page=${page}`];
            if (filterStatus !== "all") queryParams.push(`status=${encodeURIComponent(filterStatus)}`);
            if (filterStage !== "all") queryParams.push(`funding_stage=${encodeURIComponent(filterStage)}`);

            const query = "?" + queryParams.join("&");

            const response = await fetch(`/api/admin/funding${query}`, {
                credentials: 'include'
            });
            const data = await response.json();
            const requests = Array.isArray(data) ? data : (data?.data || []);

            if (page === 1) {
                setFundingRequests(requests);
            } else {
                setFundingRequests((prev) => [...prev, ...requests]);
            }

            setHasMore(requests.length >= 10);
        } catch (error) {
            console.error("Error fetching funding:", error);
            if (page === 1) setFundingRequests([]);
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadMoreLoading(false);
        }
    }, [filterStatus, filterStage]);

    // Refetch (page 1) whenever filters change
    useEffect(() => {
        setFundingPage(1);
        fetchFundingRequests(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchFundingRequests]);

    // Fetch totals once on mount
    useEffect(() => {
        fetchTotals();
    }, [fetchTotals]);

    const handleLoadMore = () => {
        const nextPage = fundingPage + 1;
        setFundingPage(nextPage);
        fetchFundingRequests(nextPage);
    };

    const filteredRequests = fundingRequests.filter((request) => {
        const matchesSearch =
            request.project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.founders?.some((f) =>
                f.name.toLowerCase().includes(searchTerm.toLowerCase())
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

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase() || "";
        const base = "inline-flex px-2.5 py-1 rounded-full text-xs font-bold border";

        if (statusLower === "approved") return `${base} bg-emerald-50 text-emerald-800 border-emerald-300`;
        if (statusLower === "offer under review") return `${base} bg-blue-50 text-blue-800 border-blue-300`;
        if (statusLower === "pending") return `${base} bg-[#FFF1E3] text-[#E38524] border-[#E38524]/20`;
        if (statusLower === "rejected") return `${base} bg-rose-50 text-rose-800 border-rose-300`;
        return `${base} bg-slate-100 text-slate-700 border-slate-300`;
    };

    return (
        <div className="space-y-6 font-sans">
            {showDetails ? (
                <FundingDetails
                    request={selectedRequest}
                    onBack={() => {
                        setShowDetails(false);
                        setSelectedRequest(null);
                        setFundingPage(1);
                        fetchFundingRequests(1);
                        fetchTotals();
                    }}
                />
            ) : (
                <>


                    {/* Stats Grid — real totals from server, independent of pagination */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                        <StatCard title="Total Requests" value={totals.total} icon={Layers} badgeText="Submissions" accentColor="cyan" />
                        <StatCard title="Pending Review" value={totals.pending} icon={Clock} badgeText="Awaiting decision" accentColor="orange" />
                        <StatCard title="Approved" value={totals.approved} icon={CheckCircle} badgeText="Capital disbursed" accentColor="cyan" />
                        <StatCard title="Rejected" value={totals.rejected} icon={XCircle} badgeText="Unsuccessful" accentColor="orange" />
                        <StatCard
                            title="Requested Volume"
                            value={`$${(totals.total_amount || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
                            icon={DollarSign}
                            badgeText="Total capital"
                            accentColor="cyan"
                        />
                    </div>

                    {/* Filters & Search Bar */}
                    <div className="bg-white p-5 rounded-2xl border border-[#D6E4EA] shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]" size={18} />
                            <input
                                type="text"
                                placeholder="Search by startup project or founder name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium text-[#111827] outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-[#526274]" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Offer Under Review">Offer Under Review</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>

                            <select
                                value={filterStage}
                                onChange={(e) => setFilterStage(e.target.value)}
                                className="px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
                            >
                                <option value="all">All Program Stages</option>
                                <option value="Idea">Idea</option>
                                <option value="MVP">MVP</option>
                                <option value="Growth">Growth</option>
                                <option value="Scale">Scale</option>
                            </select>
                        </div>
                    </div>

                    {/* Funding Table */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#D6E4EA]">
                            <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={32} />
                            <p className="text-[#526274] font-bold text-sm">Loading funding requests...</p>
                        </div>
                    ) : filteredRequests.length > 0 ? (
                        <>
                            <div className="bg-white rounded-2xl border border-[#D6E4EA] shadow-xs overflow-hidden">
                                <div className="overflow-x-auto font-sans">
                                    <table className="w-full text-left border-collapse min-w-[900px]">
                                        <thead>
                                        <tr className="bg-[#F6FAFC] border-b border-[#D6E4EA] text-[#526274] text-xs font-bold uppercase tracking-wider">
                                            <th className="p-4">Startup Project</th>
                                            <th className="p-4">Lead Founder</th>
                                            <th className="p-4">Amount Requested</th>
                                            <th className="p-4">Stage</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Requested Date</th>
                                            <th className="p-4 text-center">Action</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#D6E4EA] text-sm">
                                        {filteredRequests.map((request) => (
                                            <tr key={request.id} className="hover:bg-[#F6FAFC] transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-[#111827] text-sm">
                                                        {request.project?.name || "Unnamed Project"}
                                                    </div>
                                                    <div className="text-xs text-[#526274]">
                                                        {request.project?.domain || "General"}
                                                    </div>
                                                </td>

                                                <td className="p-4 text-xs font-medium text-[#111827]">
                                                    {request.founders && request.founders.length > 0 ? (
                                                        <div>
                                                            <p className="font-bold">{request.founders[0]?.name}</p>
                                                            <p className="text-[11px] text-[#526274]">{request.founders[0]?.email}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[#526274]">-</span>
                                                    )}
                                                </td>

                                                {/* SMART AMOUNT COLUMN */}
                                                <td className="p-4">
                                                    {request.approved_amount ? (
                                                        <div>
                                                            <p className="font-black text-green-600 text-base">
                                                                ${parseFloat(request.approved_amount).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                                                            </p>
                                                            <p className="text-xs text-gray-400 line-through">
                                                                ${parseFloat(request.amount || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="font-black text-black text-base">
                                                            ${parseFloat(request.amount || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="p-4">
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-[#EAF8FC] text-[#006F9E] text-xs font-bold border border-[#00ADEF]/20">
                            {request.project?.stage || request.funding_stage || "Idea"}
                          </span>
                                                </td>

                                                <td className="p-4">
                                <span className={getStatusBadge(request.status)}>
                                  {request.status}
                                </span>
                                                </td>

                                                <td className="p-4 text-xs text-[#526274] font-medium">
                                                    {new Date(request.requested_at || request.created_at).toLocaleDateString("en-GB")}
                                                </td>

                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setShowDetails(true);
                                                        }}
                                                        className="p-2 text-[#006F9E] bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl hover:bg-[#EAF8FC] hover:border-[#00ADEF] transition"
                                                        title="Review Request"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pagination: Load More */}
                            <div className="flex flex-col items-center gap-2">
                                {hasMore ? (
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loadMoreLoading}
                                        className="px-6 py-2 bg-[#00ADEF] text-white rounded-xl text-sm font-bold hover:bg-[#006F9E] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {loadMoreLoading && <Loader2 size={16} className="animate-spin" />}
                                        Load More
                                    </button>
                                ) : (
                                    <p className="text-xs text-[#526274] font-medium">No more requests to load</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#D6E4EA] text-center p-6">
                            <div className="p-4 bg-[#EAF8FC] rounded-full text-[#00ADEF] mb-3">
                                <DollarSign size={36} />
                            </div>
                            <h3 className="text-lg font-bold text-[#111827]">No requests found</h3>
                            <p className="text-xs text-[#526274] mt-1 max-w-sm">
                                No funding applications match the active filters.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}