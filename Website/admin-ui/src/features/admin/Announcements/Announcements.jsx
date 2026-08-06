import React, { useState, useEffect } from "react";
import { Megaphone, Trash2, Loader2, Send, PlusCircle } from "lucide-react";

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
        <div className="flex-1 overflow-y-auto bg-[#F6FAFC] h-screen font-sans text-[#111827]">
            <div className="p-6 lg:p-10 max-w-[1920px] mx-auto">

                {/* Header Section */}
                <div className="mb-10">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-2">
            Content Management
          </span>
                    <h1 className="text-4xl font-extrabold tracking-[-.04em] text-cyan-dark sm:text-5xl">
                        Announcements CMS
                    </h1>
                    <p className="mt-3 text-base text-[#526274] font-medium">
                        Publish news and updates to the public Entrepreneur homepage.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Create Form */}
                    <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs">
                        <h2 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
                            <PlusCircle size={20} className="text-[#00ADEF]" />
                            New Announcement
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] focus:outline-none focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent font-medium text-[#111827]"
                                    placeholder="e.g., Batch 04 Applications Open!"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Content</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                    rows="5"
                                    className="w-full px-4 py-3 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] focus:outline-none focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent font-medium text-[#111827]"
                                    placeholder="Write your announcement here..."
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-[#00ADEF] text-white rounded-xl font-bold transition hover:bg-[#006F9E] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? 'Publishing...' : 'Publish Announcement'}
                                <Send size={16} />
                            </button>
                        </form>
                    </div>

                    {/* List of Announcements */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
                            <Megaphone size={20} className="text-[#E38524]" />
                            Published
                        </h2>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-[#00ADEF]" size={32} />
                            </div>
                        ) : announcements.length > 0 ? (
                            announcements.map((ann) => (
                                <div key={ann.id} className="bg-white border border-[#D6E4EA] rounded-2xl p-5 shadow-xs flex flex-col transition hover:shadow-md">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-base text-[#111827]">{ann.title}</h3>
                                        <button onClick={() => handleDelete(ann.id)} className="p-1.5 rounded-lg text-[#526274] hover:bg-red-50 hover:text-red-600 transition">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <p className="text-[#526274] text-sm bg-[#F6FAFC] p-4 rounded-xl border border-[#D6E4EA] italic flex-grow">
                                        {ann.content}
                                    </p>
                                    <div className="mt-3 pt-3 border-t border-[#D6E4EA] text-xs text-[#526274] font-medium">
                                        {new Date(ann.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-white border border-dashed border-[#D6E4EA] rounded-2xl">
                                <p className="text-[#526274] font-medium">No announcements yet.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}