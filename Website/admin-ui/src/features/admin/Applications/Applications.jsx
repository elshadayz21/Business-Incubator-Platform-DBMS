import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader2, Inbox } from "lucide-react";

export default function Applications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchApplications = async () => {
        try {
            const response = await fetch('/api/admin/applications', { credentials: 'include' });
            const data = await response.json();
            setApplications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching applications:", error);
            setApplications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await fetch(`/api/admin/applications/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });
            fetchApplications();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#F6FAFC] h-screen font-sans text-[#111827]">
            <div className="p-6 lg:p-10 max-w-[1920px] mx-auto">

                {/* Header Section */}
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
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-[#F6FAFC] text-[#526274] uppercase tracking-wider text-xs font-extrabold border-b border-[#D6E4EA]">
                                <th className="p-4">Applicant</th>
                                <th className="p-4 hidden lg:table-cell">Startup Idea</th>
                                <th className="p-4 hidden md:table-cell">Applied For</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D6E4EA]">
                            {applications.map((app) => (
                                <tr key={app.id} className="hover:bg-[#F6FAFC] transition align-top">

                                    <td className="p-4 max-w-[200px]">
                                        <div className="font-bold text-sm text-[#111827]">{app.full_name}</div>
                                        <a href={`mailto:${app.email}`} className="text-xs text-[#006F9E] hover:underline block mt-1">{app.email}</a>
                                        {app.phone && <div className="text-xs text-[#526274] mt-1">{app.phone}</div>}
                                    </td>

                                    <td className="p-4 hidden lg:table-cell max-w-[350px]">
                                        <div className="text-xs font-bold text-[#526274] uppercase mb-1">Idea</div>
                                        <p className="text-sm text-[#111827] line-clamp-2 italic">"{app.startup_idea}"</p>
                                        {app.background && (
                                            <div className="text-xs text-[#526274] mt-2">Background: {app.background}</div>
                                        )}
                                    </td>

                                    <td className="p-4 hidden md:table-cell text-sm text-[#526274] font-medium">
                                        {app.announcement_title || 'N/A'}
                                    </td>

                                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                          app.status === 'Accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                              app.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {app.status || 'Pending'}
                      </span>
                                    </td>

                                    <td className="p-4 text-right whitespace-nowrap">
                                        <div className="flex gap-2 justify-end">
                                            {app.status !== 'Accepted' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(app.id, 'Accepted')}
                                                    className="p-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition"
                                                    title="Accept"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            {app.status !== 'Rejected' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(app.id, 'Rejected')}
                                                    className="p-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition"
                                                    title="Reject"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            )}
                                        </div>
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
</div>
</div>
);
}