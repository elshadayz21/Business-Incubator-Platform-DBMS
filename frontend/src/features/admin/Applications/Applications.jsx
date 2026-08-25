import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader2, Inbox, Users, User, HelpCircle } from "lucide-react";

export default function Applications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);

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
            if (selectedApp && selectedApp.id === id) {
                setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null);
            }
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
                    <h1 className="text-3xl font-extrabold tracking-[-.04em] text-cyan-dark">Applications ({applications.length})</h1>
                    <p className="mt-1 text-sm text-[#526274]">Review applicant startup ideas, team profiles, and responses to custom form questions.</p>
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
                                <th className="p-4">Applicant / Team</th>
                                <th className="p-4 hidden lg:table-cell">Startup Idea / Pitch</th>
                                <th className="p-4 hidden md:table-cell">Announcement Call</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D6E4EA]">
                            {applications.map((app) => (
                                <tr key={app.id} className="hover:bg-[#F6FAFC] transition align-top">

                                    <td className="p-4 max-w-[220px]">
                                        <div className="font-bold text-sm text-[#111827]">{app.full_name}</div>
                                        <a href={`mailto:${app.email}`} className="text-xs text-[#006F9E] hover:underline block mt-0.5">{app.email}</a>
                                        {app.phone && <div className="text-xs text-[#526274] mt-0.5">{app.phone}</div>}

                                        {/* Applicant Type Badge */}
                                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                            {app.applicant_type === 'team' || app.team_name ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                                    <Users size={11} />
                                                    Team: {app.team_name || 'Group'} ({app.team_size || 1} members)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                    <User size={11} />
                                                    Individual Founder
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-4 hidden lg:table-cell max-w-[380px]">
                                        <div className="text-xs font-bold text-[#526274] uppercase mb-1">Startup Idea</div>
                                        <p className="text-sm text-[#111827] line-clamp-3 italic">"{app.startup_idea}"</p>
                                        {app.background && (
                                            <div className="text-xs text-[#526274] mt-2">Background: {app.background}</div>
                                        )}

                                        {/* Custom Answers Trigger */}
                                        {app.answers && Object.keys(typeof app.answers === 'string' ? JSON.parse(app.answers || '{}') : app.answers || {}).length > 0 && (
                                            <button
                                                onClick={() => setSelectedApp(app)}
                                                className="mt-2 text-xs font-bold text-[#00ADEF] hover:underline inline-flex items-center gap-1"
                                            >
                                                <HelpCircle size={12} />
                                                View Custom Answers
                                            </button>
                                        )}
                                    </td>

                                    <td className="p-4 hidden md:table-cell text-sm text-[#526274] font-medium">
                                        <span className="font-bold text-[#111827]">{app.announcement_title || 'General Call'}</span>
                                        <div className="text-xs text-[#526274] mt-1">
                                            {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                                            app.status === 'Accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                                                app.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>
                                            {app.status || 'Pending'}
                                        </span>
                                    </td>

                                    <td className="p-4 text-right whitespace-nowrap">
                                        <div className="flex gap-2 justify-end items-center">
                                            <button
                                                onClick={() => setSelectedApp(app)}
                                                className="px-2.5 py-1.5 bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20 rounded-lg text-xs font-bold hover:bg-[#D6E4EA] transition"
                                            >
                                                Details
                                            </button>

                                            {app.status !== 'Accepted' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(app.id, 'Accepted')}
                                                    className="p-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition"
                                                    title="Accept Application"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            {app.status !== 'Rejected' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(app.id, 'Rejected')}
                                                    className="p-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition"
                                                    title="Reject Application"
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
                        <h2 className="text-xl font-extrabold text-[#111827] mb-2">No applications submitted yet</h2>
                        <p className="text-sm text-[#526274]">Applications submitted by founders and teams to open call announcements will appear here.</p>
                    </div>
                )}
            </div>

            {/* Application Detail Modal */}
            {selectedApp && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl p-6 space-y-6">
                        <div className="flex justify-between items-start border-b border-[#D6E4EA] pb-4">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] bg-[#EAF8FC] px-2.5 py-1 rounded-full border border-[#00ADEF]/30">
                                    Application Details
                                </span>
                                <h2 className="text-2xl font-extrabold text-[#111827] mt-2">{selectedApp.full_name}</h2>
                                <p className="text-sm text-[#526274]">{selectedApp.email} • {selectedApp.phone || 'No phone'}</p>
                            </div>
                            <button
                                onClick={() => setSelectedApp(null)}
                                className="p-2 rounded-lg text-[#526274] hover:bg-gray-100 transition"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Team Details */}
                        {selectedApp.applicant_type === 'team' || selectedApp.team_name ? (
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-800">Team / Group Profile</h4>
                                <p className="text-sm font-bold text-purple-900">Team Name: {selectedApp.team_name || 'N/A'}</p>
                                <p className="text-xs text-purple-700">Team Size: {selectedApp.team_size || 1} Member(s)</p>
                            </div>
                        ) : null}

                        {/* Call Title */}
                        <div className="p-3 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-semibold text-[#526274]">
                            Call: <span className="font-bold text-[#111827]">{selectedApp.announcement_title || 'General Open Call'}</span>
                        </div>

                        {/* Startup Idea & Background */}
                        <div className="space-y-3">
                            <div>
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#526274]">Startup / Project Idea</h4>
                                <p className="text-sm text-[#111827] bg-[#F6FAFC] p-3 rounded-xl border border-[#D6E4EA] mt-1 leading-relaxed">
                                    {selectedApp.startup_idea}
                                </p>
                            </div>
                            {selectedApp.background && (
                                <div>
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#526274]">Applicant Background</h4>
                                    <p className="text-sm text-[#111827] bg-[#F6FAFC] p-3 rounded-xl border border-[#D6E4EA] mt-1">
                                        {selectedApp.background}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Custom Answers */}
                        {selectedApp.answers && Object.keys(typeof selectedApp.answers === 'string' ? JSON.parse(selectedApp.answers || '{}') : selectedApp.answers || {}).length > 0 && (
                            <div className="space-y-3 border-t border-[#D6E4EA] pt-4">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#006F9E]">Custom Form Responses</h4>
                                <div className="space-y-2">
                                    {Object.entries(typeof selectedApp.answers === 'string' ? JSON.parse(selectedApp.answers || '{}') : selectedApp.answers || {}).map(([key, val]) => (
                                        <div key={key} className="p-3 bg-[#EAF8FC] border border-[#00ADEF]/20 rounded-xl text-xs">
                                            <span className="font-bold text-[#006F9E] block uppercase tracking-wider mb-0.5">{key.replace('custom_', 'Question ')}</span>
                                            <span className="text-[#111827] font-medium text-sm">{String(val)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions in Modal */}
                        <div className="flex gap-3 pt-4 border-t border-[#D6E4EA]">
                            <button
                                onClick={() => handleUpdateStatus(selectedApp.id, 'Accepted')}
                                className="flex-1 py-3 bg-green-600 text-white font-bold text-sm rounded-xl hover:bg-green-700 transition"
                            >
                                Accept Application
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(selectedApp.id, 'Rejected')}
                                className="flex-1 py-3 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition"
                            >
                                Reject Application
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
