import React, { useState, useEffect, useCallback } from "react";
import { Eye, X, Loader2, Inbox, CheckCircle2 } from "lucide-react";

export default function Applications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadMoreLoading, setLoadMoreLoading] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);
    const [newStatus, setNewStatus] = useState("");
    const [appPage, setAppPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchApplications = useCallback(async (page = 1) => {
        try {
            if (page === 1) { setLoading(true); } else { setLoadMoreLoading(true); }
            const response = await fetch(`/api/admin/applications?page=${page}`, { credentials: 'include' });
            const data = await response.json();
            const newApps = Array.isArray(data) ? data : [];

            if (page === 1) {
                setApplications(newApps);
            } else {
                setApplications((prev) => [...prev, ...newApps]);
            }

            setHasMore(newApps.length >= 10);
        } catch (error) {
            console.error("Error fetching applications:", error);
            if (page === 1) { setApplications([]); }
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadMoreLoading(false);
        }
    }, []);

    useEffect(() => { fetchApplications(1); }, [fetchApplications]);

    const handleLoadMore = () => {
        const nextPage = appPage + 1;
        setAppPage(nextPage);
        fetchApplications(nextPage);
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await fetch(`/api/admin/applications/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status })
            });
            setApplications(prev => prev.map(app => app.id === id ? { ...app, status: status } : app));
            setSelectedApp(null);
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const openModal = (app) => {
        setSelectedApp(app);
        setNewStatus(app.status || 'Pending');
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#F6FAFC] h-screen font-sans text-[#111827]">
            <div className="p-6 lg:p-10 max-w-[1920px] mx-auto">
                <div className="mb-8">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-2">Open Call Submissions</span>
                    <h1 className="text-3xl font-extrabold tracking-[-.04em] text-cyan-dark">Applications</h1>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white border border-[#D6E4EA] rounded-2xl">
                        <Loader2 className="animate-spin text-[#00ADEF]" size={32} />
                    </div>
                ) : applications.length > 0 ? (
                    <div className="bg-white border border-[#D6E4EA] rounded-2xl shadow-xs overflow-hidden">
                        <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
                            <thead>
                            <tr className="bg-[#F6FAFC] text-[#526274] uppercase tracking-wider text-xs font-extrabold border-b border-[#D6E4EA]">
                                <th className="p-4 w-[20%]">Applicant</th>
                                <th className="p-4 w-[20%] hidden lg:table-cell">Startup Idea</th>
                                <th className="p-4 w-[18%] hidden md:table-cell">Applied For</th>
                                <th className="p-4 w-[15%] hidden md:table-cell">Phone</th>
                                <th className="p-4 w-[12%]">Status</th>
                                <th className="p-4 w-[15%] text-right">View Detail</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D6E4EA]">
                            {applications.map((app) => (
                                <tr key={app.id} className="hover:bg-[#F6FAFC] transition align-top">
                                    <td className="p-4 align-top">
                                        <div className="font-bold text-sm text-[#111827]">{app.full_name || 'Unknown'}</div>
                                        <a href={`mailto:${app.email}`} className="text-xs text-[#006F9E] hover:underline block mt-1">{app.email || 'No Email'}</a>
                                    </td>
                                    <td className="p-4 hidden lg:table-cell align-top">
                                        <p className="text-sm text-[#111827] italic">"{app.startup_idea || 'Not provided'}"</p>
                                    </td>
                                    <td className="p-4 hidden md:table-cell text-sm text-[#526274] font-medium align-top">
                                        {app.announcement_title || 'N/A'}
                                    </td>
                                    <td className="p-4 hidden md:table-cell text-sm text-[#526274] align-top">
                                        {app.phone || '—'}
                                    </td>
                                    <td className="p-4 align-top">
                                        <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold border ${
                                            app.status === 'Accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                                                app.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>
                                            {app.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right align-top">
                                        <button
                                            onClick={() => openModal(app)}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20 rounded-lg text-xs font-bold hover:bg-[#D6E4EA] transition"
                                        >
                                            <Eye size={14} /> View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-white border border-[#D6E4EA] rounded-2xl text-center">
                        <div className="p-4 rounded-2xl bg-[#EAF8FC] mb-6">
                            <Inbox className="text-[#00ADEF]" size={32} />
                        </div>
                        <h2 className="text-xl font-extrabold text-[#111827] mb-2">No applications yet</h2>
                    </div>
                )}

                {applications.length > 0 && (
                    <div className="mt-6 flex flex-col items-center gap-2">
                        {hasMore ? (
                            <button
                                onClick={handleLoadMore}
                                disabled={loadMoreLoading}
                                className="px-6 py-2 bg-[#00ADEF] text-white rounded-lg text-sm font-bold hover:bg-[#006F9E] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loadMoreLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                Load More
                            </button>
                        ) : (
                            <p className="text-xs text-[#526274] font-medium">No more applications to load</p>
                        )}
                    </div>
                )}
            </div>

            {selectedApp && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
                        <div className="sticky top-0 bg-white border-b border-[#D6E4EA] p-6 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-xl font-extrabold text-[#111827]">{selectedApp.full_name || 'Unknown Applicant'}</h2>
                                <a href={`mailto:${selectedApp.email}`} className="text-xs text-[#006F9E] hover:underline">{selectedApp.email}</a>
                            </div>
                            <button onClick={() => setSelectedApp(null)} className="p-2 rounded-lg text-[#526274] hover:bg-gray-100 transition"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {selectedApp.phone && (
                                    <div className="bg-[#F6FAFC] p-3 rounded-lg border border-[#D6E4EA]">
                                        <p className="text-[10px] font-bold uppercase text-[#526274] mb-1">Phone</p>
                                        <p className="text-sm font-medium text-[#111827]">{selectedApp.phone}</p>
                                    </div>
                                )}
                                {selectedApp.background && (
                                    <div className="bg-[#F6FAFC] p-3 rounded-lg border border-[#D6E4EA]">
                                        <p className="text-[10px] font-bold uppercase text-[#526274] mb-1">Background</p>
                                        <p className="text-sm font-medium text-[#111827]">{selectedApp.background}</p>
                                    </div>
                                )}
                                <div className="bg-[#F6FAFC] p-3 rounded-lg border border-[#D6E4EA]">
                                    <p className="text-[10px] font-bold uppercase text-[#526274] mb-1">Applied For</p>
                                    <p className="text-sm font-medium text-[#111827]">{selectedApp.announcement_title || 'N/A'}</p>
                                </div>
                            </div>

                            {selectedApp.startup_idea && (
                                <div>
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#006F9E] mb-2">Startup Idea</h3>
                                    <div className="p-4 bg-[#F6FAFC] rounded-xl border border-[#D6E4EA] text-sm text-[#111827] italic">"{selectedApp.startup_idea}"</div>
                                </div>
                            )}

                            {(() => {
                                let answersObj = selectedApp.answers;
                                if (typeof answersObj === 'string') {
                                    try { answersObj = JSON.parse(answersObj); } catch (e) { answersObj = null; }
                                }
                                if (answersObj && Object.keys(answersObj).length > 0) {
                                    return (
                                        <div>
                                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#006F9E] mb-2">Custom Questions & Answers</h3>
                                            <div className="space-y-3">
                                                {Object.entries(answersObj).map(([key, value]) => {
                                                    let displayValue = value;
                                                    if (Array.isArray(displayValue)) {
                                                        displayValue = displayValue.join(', ');
                                                    } else if (typeof displayValue === 'boolean') {
                                                        displayValue = displayValue ? 'Yes' : 'No';
                                                    }
                                                    return (
                                                        <div key={key} className="text-sm border-b border-[#D6E4EA] pb-2">
                                                            <p className="font-bold text-[#526274] capitalize">{key.replace('custom_', '').replace(/_/g, ' ')}</p>
                                                            <p className="text-[#111827] mt-1">{String(displayValue)}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        <div className="sticky bottom-0 bg-white border-t border-[#D6E4EA] p-6 flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold uppercase text-[#526274] mb-1">Update Status</label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-[#D6E4EA] rounded-lg text-sm font-bold text-[#111827] focus:ring-1 focus:ring-[#00ADEF]"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Accepted">Accepted</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                            <button
                                onClick={() => handleUpdateStatus(selectedApp.id, newStatus)}
                                className="mt-5 px-6 py-2 bg-[#00ADEF] text-white rounded-lg text-sm font-bold hover:bg-[#006F9E] transition flex items-center gap-2"
                            >
                                <CheckCircle2 size={16} /> Save Status
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}