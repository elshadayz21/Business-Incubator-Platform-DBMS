import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Eye, X, Loader2, Inbox, CheckCircle2, Paperclip } from "lucide-react";

// Maps a form field to the normalized column it fills. Used to pull an
// applicant's real name/email/phone/idea straight from their submitted
// `answers` even when the form wasn't configured with a maps_to link.
const FIELD_TO_COLUMN = {
    full_name: "full_name",
    email: "email",
    phone: "phone",
    startup_idea: "startup_idea",
    background: "background",
};

// Guess which normalized column a field represents from its label, so forms
// that were never mapped (like Batch 08's "FN" / "LN") still display right.
// First/last name parts both feed the "full name" column so split fields join.
const guessColumnFromLabel = (label = "") => {
    const l = label.toLowerCase();
    if (/(first\s*name|f\.?\s*n|given\s*name|last\s*name|sur(name|4)|l\.?\s*n|full\s*name|^name$|name\b|surname)/.test(l)) return "full_name";
    if (/(startup\s*idea|business\s*idea|idea)/.test(l)) return "startup_idea";
    return null;
};

export default function Applications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadMoreLoading, setLoadMoreLoading] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);
    const [newStatus, setNewStatus] = useState("");
    const [fieldLabels, setFieldLabels] = useState({}); // { [`custom_${fieldId}`]: "Question label" }
    const [mappedAnswerKeys, setMappedAnswerKeys] = useState(new Set()); // keys already shown via full_name/email/phone/background/startup_idea
    const [appPage, setAppPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [announcements, setAnnouncements] = useState([]);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState("");

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const response = await fetch("/api/admin/announcements", { credentials: "include" });
                const data = await response.json();
                setAnnouncements(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching announcements:", error);
            }
        };
        fetchAnnouncements();
    }, []);

    const fetchApplications = useCallback(async (page = 1, announcementId = selectedAnnouncement) => {
        try {
            if (page === 1) { setLoading(true); } else { setLoadMoreLoading(true); }
            const query = new URLSearchParams({ page: String(page) });
            if (announcementId) query.set("announcementId", announcementId);
            const response = await fetch(`/api/admin/applications?${query}`, { credentials: 'include' });
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
    }, [selectedAnnouncement]);

    useEffect(() => { fetchApplications(1); }, [fetchApplications]);

    const handleFilterChange = (announcementId) => {
        setSelectedAnnouncement(announcementId);
        setAppPage(1);
        setApplications([]);
        fetchApplications(1, announcementId);
    };

    // Resolve the actual applicant name / idea / email / phone from the
    // submitted answers when the normalized columns are empty.
    const resolveApplicant = useMemo(() => (app) => {
        let answersObj = app.answers;
        if (typeof answersObj === "string") {
            try { answersObj = JSON.parse(answersObj); } catch (e) { answersObj = null; }
        }
        answersObj = answersObj && typeof answersObj === "object" ? answersObj : {};

        const fields = Array.isArray(app.form_fields) ? app.form_fields : [];
        const resolved = {
            full_name: app.full_name,
            email: app.email,
            phone: app.phone,
            startup_idea: app.startup_idea,
            background: app.background,
        };

        // Determine which custom_<id> answer feeds each normalized column.
        const columnToKey = {};
        for (const field of fields) {
            const key = `custom_${field.id}`;
            const column = FIELD_TO_COLUMN[field.maps_to] || guessColumnFromLabel(field.label);
            if (column && !columnToKey[column]) columnToKey[column] = key;
        }
        // Multi-part names: "FN" and "LN" both resolve to full_name -> join them.
        const nameKeys = fields.filter((f) => (FIELD_TO_COLUMN[f.maps_to] || guessColumnFromLabel(f.label)) === "full_name")
            .map((f) => `custom_${f.id}`);

        const pickString = (keys) => {
            const parts = [];
            for (const k of keys) {
                const v = answersObj[k];
                if (v !== undefined && v !== null && String(v).trim() !== "") parts.push(String(v).trim());
            }
            return parts.length ? parts.join(" ") : null;
        };
        const emailKey = Object.entries(columnToKey).find(([, k]) => k.includes("email"))?.[1];
        const phoneKey = Object.entries(columnToKey).find(([, k]) => k.includes("phone"))?.[1];
        const ideaKey = columnToKey.startup_idea;

        resolved.full_name = app.full_name || pickString(nameKeys) || pickString(Object.values(columnToKey).filter((k) => k.includes("name"))) || null;
        resolved.email = app.email || (emailKey ? pickString([emailKey]) : null);
        resolved.phone = app.phone || (phoneKey ? pickString([phoneKey]) : null);
        resolved.startup_idea = app.startup_idea || (ideaKey ? pickString([ideaKey]) : null);
        return resolved;
    }, []);

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

    const openModal = async (app) => {
        setSelectedApp(app);
        setNewStatus(app.status || 'Pending');
        setFieldLabels({});
        setMappedAnswerKeys(new Set());
        // Answers are keyed by `custom_<field id>` — look up each question's
        // actual label so we can show it instead of a bare id, and skip any
        // question already linked to a normalized column (it's shown in its
        // own dedicated field above, so listing it again here would be a
        // duplicate).
        if (app.announcement_id) {
            try {
                const response = await fetch(`/api/admin/announcements/${app.announcement_id}/form-fields`, { credentials: 'include' });
                const fields = await response.json();
                if (Array.isArray(fields)) {
                    const labelMap = {};
                    const mapped = new Set();
                    fields.forEach(f => {
                        labelMap[`custom_${f.id}`] = f.label;
                        if (f.maps_to) mapped.add(`custom_${f.id}`);
                    });
                    setFieldLabels(labelMap);
                    setMappedAnswerKeys(mapped);
                }
            } catch (error) {
                console.error("Error fetching form field labels:", error);
            }
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#F6FAFC] h-screen font-sans text-[#111827]">
            <div className="p-6 lg:p-10 max-w-[1920px] mx-auto">
                <div className="mb-8">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-2">Open Call Submissions</span>
                    <h1 className="text-3xl font-extrabold tracking-[-.04em] text-cyan-dark">Applications</h1>
                </div>

                <div className="mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-[#526274] shrink-0">Filter by Batch / Form:</label>
                        <select
                            value={selectedAnnouncement}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="px-3.5 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
                        >
                            <option value="">All Batches</option>
                            {announcements.map((ann) => (
                                <option key={ann.id} value={ann.id}>{ann.title || `Batch / Form #${ann.id}`}</option>
                            ))}
                        </select>
                    </div>
                    {announcements.length > 0 && selectedAnnouncement && (
                        <span className="text-xs text-[#526274] font-semibold">
                            Showing applications for the selected batch/form
                        </span>
                    )}
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
                            {applications.map((app) => {
                                const applicant = resolveApplicant(app);
                                return (
                                <tr key={app.id} className="hover:bg-[#F6FAFC] transition align-top">
                                    <td className="p-4 align-top">
                                        <div className="font-bold text-sm text-[#111827]">{applicant.full_name || 'Unknown'}</div>
                                        <a href={`mailto:${applicant.email}`} className="text-xs text-[#006F9E] hover:underline block mt-1">{applicant.email || 'No Email'}</a>
                                    </td>
                                    <td className="p-4 hidden lg:table-cell align-top">
                                        <p className="text-sm text-[#111827] italic">"{applicant.startup_idea || 'Not provided'}"</p>
                                    </td>
                                    <td className="p-4 hidden md:table-cell text-sm text-[#526274] font-medium align-top">
                                        {app.announcement_title || 'N/A'}
                                    </td>
                                    <td className="p-4 hidden md:table-cell text-sm text-[#526274] align-top">
                                        {applicant.phone || '—'}
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
                                );
                            })}
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

            {selectedApp && (() => {
                const detail = resolveApplicant(selectedApp);
                return (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
                        <div className="sticky top-0 bg-white border-b border-[#D6E4EA] p-6 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-xl font-extrabold text-[#111827]">{detail.full_name || 'Unknown Applicant'}</h2>
                                <a href={`mailto:${detail.email}`} className="text-xs text-[#006F9E] hover:underline">{detail.email}</a>
                            </div>
                            <button onClick={() => setSelectedApp(null)} className="p-2 rounded-lg text-[#526274] hover:bg-gray-100 transition"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {detail.phone && (
                                    <div className="bg-[#F6FAFC] p-3 rounded-lg border border-[#D6E4EA]">
                                        <p className="text-[10px] font-bold uppercase text-[#526274] mb-1">Phone</p>
                                        <p className="text-sm font-medium text-[#111827]">{detail.phone}</p>
                                    </div>
                                )}
                                {detail.background && (
                                    <div className="bg-[#F6FAFC] p-3 rounded-lg border border-[#D6E4EA]">
                                        <p className="text-[10px] font-bold uppercase text-[#526274] mb-1">Background</p>
                                        <p className="text-sm font-medium text-[#111827]">{detail.background}</p>
                                    </div>
                                )}
                                <div className="bg-[#F6FAFC] p-3 rounded-lg border border-[#D6E4EA]">
                                    <p className="text-[10px] font-bold uppercase text-[#526274] mb-1">Applied For</p>
                                    <p className="text-sm font-medium text-[#111827]">{selectedApp.announcement_title || 'N/A'}</p>
                                </div>
                            </div>

                            {detail.startup_idea && (
                                <div>
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#006F9E] mb-2">Startup Idea</h3>
                                    <div className="p-4 bg-[#F6FAFC] rounded-xl border border-[#D6E4EA] text-sm text-[#111827] italic">"{detail.startup_idea}"</div>
                                </div>
                            )}

                            {Array.isArray(selectedApp.documents) && selectedApp.documents.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#006F9E] mb-2">
                                        Attached Document{selectedApp.documents.length > 1 ? 's' : ''}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedApp.documents.map((doc, i) => (
                                            <a
                                                key={doc.id ?? i}
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-[#EAF8FC] text-[#006F9E] rounded-lg text-xs font-bold border border-[#00ADEF]/20 hover:bg-[#D6E4EA] transition"
                                            >
                                                <Paperclip size={14} /> {doc.filename || `Document ${i + 1}`}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(() => {
                                let answersObj = selectedApp.answers;
                                if (typeof answersObj === 'string') {
                                    try { answersObj = JSON.parse(answersObj); } catch (e) { answersObj = null; }
                                }
                                if (answersObj) {
                                    // Don't repeat questions already shown above via their
                                    // dedicated field (full name, email, phone, ...).
                                    answersObj = Object.fromEntries(
                                        Object.entries(answersObj).filter(([key]) => !mappedAnswerKeys.has(key))
                                    );
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
                                                            <p className="font-bold text-[#526274]">{fieldLabels[key] || key.replace('custom_', 'Question ').replace(/_/g, ' ')}</p>
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
                );
            })()}
        </div>
    );
}