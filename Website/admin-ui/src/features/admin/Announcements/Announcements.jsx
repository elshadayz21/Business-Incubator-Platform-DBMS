import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Trash2,
  Loader2,
  Send,
  PlusCircle,
  Sparkles,
  CalendarDays,
} from "lucide-react";

export default function Announcements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchAnnouncements = async () => {
        try {
            const response = await fetch('/api/admin/announcements', {
                credentials: 'include'
            });
            const data = await response.json();
            setAnnouncements(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching announcements:", error);
            setAnnouncements([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !content) return;

        setSubmitting(true);
        try {
            await fetch('/api/admin/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title, content })
            });
            setTitle("");
            setContent("");
            fetchAnnouncements(); // Refresh the list
        } catch (error) {
            console.error("Error creating announcement:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`/api/admin/announcements/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            fetchAnnouncements();
        } catch (error) {
            console.error("Error deleting announcement:", error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#00ADEF] via-[#078CC8] to-[#0878B4] rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
                <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full border-30 border-white/10" />
                <div className="relative z-10 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider text-white">
                        <Sparkles size={12} className="text-[#E38524]" />
                        DxValley Incubation Center • Content Management
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk']">
                        Announcements
                    </h1>
                    <p className="text-sm text-white/85 max-w-2xl leading-relaxed">
                        Publish news and updates to the public Entrepreneur homepage.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Create Form */}
                <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs h-fit">
                    <div className="mb-5 pb-4 border-b border-[#D6E4EA]">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                            Create
                        </span>
                        <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk'] flex items-center gap-2">
                            <PlusCircle size={20} className="text-[#E38524]" strokeWidth={2.5} />
                            New Announcement
                        </h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#526274] mb-2">
                                Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-[#D6E4EA] bg-[#F6FAFC] text-[#111827] font-medium focus:outline-none focus:ring-2 focus:ring-[#00ADEF] focus:border-[#00ADEF] transition-all placeholder:text-[#8AA0B4]"
                                placeholder="e.g., Batch 04 Applications Open!"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#526274] mb-2">
                                Content
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                                rows="6"
                                className="w-full px-4 py-3 rounded-xl border border-[#D6E4EA] bg-[#F6FAFC] text-[#111827] font-medium focus:outline-none focus:ring-2 focus:ring-[#00ADEF] focus:border-[#00ADEF] transition-all placeholder:text-[#8AA0B4] resize-none"
                                placeholder="Write your announcement here..."
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00ADEF] to-[#0878B4] text-white font-bold uppercase tracking-wider hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    Publish Announcement
                                    <Send size={18} strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* List of Announcements */}
                <div className="space-y-4">
                    <div className="mb-5 pb-4 border-b border-[#D6E4EA]">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                            Published
                        </span>
                        <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk'] flex items-center gap-2">
                            <Megaphone size={20} className="text-[#00ADEF]" strokeWidth={2.5} />
                            Announcement List
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16 bg-white border border-[#D6E4EA] rounded-2xl shadow-xs">
                            <Loader2 className="text-[#00ADEF] animate-spin" size={32} />
                        </div>
                    ) : announcements.length > 0 ? (
                        announcements.map((ann) => (
                            <div key={ann.id} className="bg-white border border-[#D6E4EA] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-2 gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <Megaphone size={18} />
                                        </div>
                                        <h3 className="font-bold text-lg text-[#111827] leading-snug">{ann.title}</h3>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(ann.id)}
                                        title="Delete announcement"
                                        className="p-2 rounded-lg text-[#526274] hover:bg-rose-50 hover:text-rose-600 transition-all shrink-0"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <p className="text-sm text-[#526274] pl-14 leading-relaxed">{ann.content}</p>
                                <p className="inline-flex items-center gap-1.5 text-[11px] text-[#006F9E] mt-3 font-bold uppercase tracking-wide bg-[#EAF8FC] rounded-full px-2.5 py-1">
                                    <CalendarDays size={12} />
                                    {new Date(ann.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 bg-white border border-[#D6E4EA] rounded-2xl shadow-xs text-center">
                            <div className="w-14 h-14 rounded-2xl bg-[#FFF1E3] border border-[#E38524]/20 flex items-center justify-center mb-4">
                                <Megaphone className="text-[#E38524]" size={26} />
                            </div>
                            <p className="text-[#526274] font-bold">No announcements yet.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
