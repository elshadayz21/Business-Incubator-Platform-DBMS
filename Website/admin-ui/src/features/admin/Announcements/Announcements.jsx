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
            // Removed setLoading(true) from here to fix ESLint warning!
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
        <div className="flex-1 overflow-y-auto bg-[#FFFDF5] h-screen font-sans scrollbar-hide text-black">
            <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

            <div className="p-6 lg:p-10 max-w-[1920px] mx-auto">

                {/* Header Section */}
                <div className="mb-12">
          <span className="bg-[#00ADEF] text-white px-3 py-1 font-bold text-sm uppercase tracking-wider mb-2 inline-block transform -rotate-1 border-2 border-black">
            Content Management
          </span>
                    <h1 className="text-5xl md:text-6xl font-black text-black mb-2 uppercase tracking-tighter">
                        Announcements{" "}
                        <span className="bg-[#E38524] text-black px-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] italic inline-block transform rotate-1">
              CMS
            </span>
                    </h1>
                    <p className="text-xl text-slate-600 font-medium border-l-4 border-[#00ADEF] pl-4 italic mt-4">
                        Publish news and updates to the public Entrepreneur homepage.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Create Form */}
                    <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] p-6">
                        <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-2">
                            <PlusCircle size={24} className="text-[#E38524]" strokeWidth={2.5} />
                            New Announcement
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-2">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border-2 border-black bg-[#FFFDF5] focus:outline-none focus:ring-4 focus:ring-[#00ADEF] font-medium"
                                    placeholder="e.g., Batch 04 Applications Open!"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Content</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                    rows="5"
                                    className="w-full px-4 py-3 border-2 border-black bg-[#FFFDF5] focus:outline-none focus:ring-4 focus:ring-[#00ADEF] font-medium"
                                    placeholder="Write your announcement here..."
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-[#E38524] text-black border-2 border-black font-bold uppercase shadow-[3px_3px_0_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? 'Publishing...' : 'Publish Announcement'}
                                <Send size={18} strokeWidth={2.5} />
                            </button>
                        </form>
                    </div>

                    {/* List of Announcements */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-2">
                            <Megaphone size={24} className="text-[#00ADEF]" strokeWidth={2.5} />
                            Published
                        </h2>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="text-[#00ADEF] animate-spin" size={32} />
                            </div>
                        ) :
                             announcements.length > 0 ? (
                            announcements.map((ann) => (
                            <div key={ann.id} className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] p-5 flex flex-col">
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-4 pb-4 border-b-2 border-black">
                            <h3 className="font-black text-lg uppercase tracking-tight">{ann.title}</h3>
                            <button onClick={() => handleDelete(ann.id)} className="p-2 hover:bg-red-100 border-2 border-transparent hover:border-black transition-all">
                                <Trash2 size={18} className="text-red-600" strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Card Body */}
                        <p className="text-slate-800 text-sm flex-grow bg-[#FFFDF5] p-4 border border-slate-200 italic">
                            "{ann.content}"
                        </p>

                        {/* Card Footer */}
                        <div className="mt-4 pt-2 border-t border-slate-100 text-xs text-slate-500 font-bold uppercase tracking-wide flex items-center gap-2">
                            <span className="bg-[#00ADEF] text-white px-2 py-0.5 border border-black">Published</span>
                            {new Date(ann.created_at).toLocaleDateString()}
                        </div>
                    </div>
                    ))
                    )

                            : (
                            <div className="text-center py-12 border-4 border-dashed border-black bg-white">
                                <p className="text-slate-600 font-bold">No announcements yet.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}