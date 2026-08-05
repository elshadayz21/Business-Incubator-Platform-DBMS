import React, { useState, useEffect } from "react";
import { Mail, Trash2, Inbox as InboxIcon, Loader2, User, Tag } from "lucide-react";

export default function Inbox() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/inbox', {
                credentials: 'include' // Needed to pass the admin login cookie!
            });
            const data = await response.json();
            setMessages(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching inbox messages:", error);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleDelete = async (id) => {
        try {
            await fetch(`/api/admin/inbox/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            fetchMessages(); // Refresh the list after deleting
        } catch (error) {
            console.error("Error deleting message:", error);
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
            Communications
          </span>
                    <h1 className="text-5xl md:text-6xl font-black text-black mb-2 uppercase tracking-tighter">
                        Admin{" "}
                        <span className="bg-[#E38524] text-black px-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] italic inline-block transform rotate-1">
              Inbox
            </span>
                    </h1>
                    <p className="text-xl text-slate-600 font-medium border-l-4 border-[#00ADEF] pl-4 italic mt-4">
                        View messages and newsletter sign-ups from the public site.
                    </p>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed">
                        <Loader2 className="text-[#00ADEF] animate-spin mb-4" size={40} strokeWidth={2} />
                        <p className="text-black font-black text-xl uppercase">Loading messages...</p>
                    </div>
                ) : messages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {messages.map((msg) => (
                            <div key={msg.id} className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] p-6 flex flex-col">

                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-4 pb-4 border-b-2 border-black">
                                    <div className={`px-3 py-1 text-xs font-black uppercase border-2 border-black ${msg.type === 'contact' ? 'bg-[#00ADEF] text-white' : 'bg-[#E38524] text-black'}`}>
                                        {msg.type === 'contact' ? 'Contact Form' : 'Newsletter'}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(msg.id)}
                                        className="p-2 hover:bg-red-100 border-2 border-transparent hover:border-black transition-all"
                                    >
                                        <Trash2 size={18} className="text-red-600" strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Card Body */}
                                {msg.type === 'contact' ? (
                                    <div className="flex-grow flex flex-col gap-3">
                                        <div className="flex items-center gap-2 font-bold text-lg">
                                            <User size={18} className="text-[#00ADEF]" strokeWidth={2.5} />
                                            {msg.name || 'Unknown'}
                                        </div>
                                        <a href={`mailto:${msg.email}`} className="text-sm text-slate-600 underline break-all">
                                            {msg.email}
                                        </a>
                                        <p className="mt-2 text-slate-800 bg-[#FFFDF5] p-4 border border-slate-200 text-sm flex-grow">
                                            "{msg.message}"
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex-grow flex flex-col justify-center items-center text-center gap-2">
                                        <Mail size={32} className="text-[#E38524]" strokeWidth={2.5} />
                                        <p className="font-bold text-lg break-all">{msg.email}</p>
                                        <p className="text-xs text-slate-500">Wants to subscribe to updates</p>
                                    </div>
                                )}

                                {/* Card Footer */}
                                <div className="mt-4 pt-2 border-t border-slate-100 text-xs text-slate-500 font-bold uppercase tracking-wide">
                                    Received: {new Date(msg.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed text-center">
                        <div className="p-6 bg-gray-100 border-2 border-black rounded-full mb-6">
                            <InboxIcon className="text-black" size={48} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl font-black text-black uppercase mb-2">Inbox is empty</h2>
                        <p className="text-gray-600 text-lg font-medium max-w-sm">
                            When visitors submit the contact or newsletter forms, they will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}