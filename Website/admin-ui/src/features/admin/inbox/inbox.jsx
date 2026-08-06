import React, { useState, useEffect } from "react";
import { Mail, Trash2, Inbox as InboxIcon, Loader2, User, Tag } from "lucide-react";

export default function Inbox() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMessages = async () => {
        try {
            const response = await fetch('/api/admin/inbox', {
                credentials: 'include'
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
            fetchMessages();
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#F6FAFC] h-screen font-sans text-[#111827]">
            <div className="p-6 lg:p-10 max-w-[1920px] mx-auto">

                {/* Header Section */}
                <div className="mb-10">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-2">
            Communications
          </span>
                    <h1 className="text-4xl font-extrabold tracking-[-.04em] text-cyan-dark sm:text-5xl">
                        Admin Inbox
                    </h1>
                    <p className="mt-3 text-base text-[#526274] font-medium">
                        View messages and newsletter sign-ups from the public site.
                    </p>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white border border-[#D6E4EA] rounded-2xl">
                        <Loader2 className="animate-spin text-[#00ADEF]" size={32} />
                        <p className="text-[#526274] font-bold text-sm mt-4">Loading messages...</p>
                    </div>
                ) : messages.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {messages.map((msg) => (
                            <div key={msg.id} className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs flex flex-col hover:shadow-md transition">

                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-4 pb-4 border-b border-[#D6E4EA]">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                      msg.type === 'contact'
                          ? 'bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/20'
                          : 'bg-[#FFF1E3] text-[#E38524] border-[#E38524]/20'
                  }`}>
                    {msg.type === 'contact' ? 'Contact Form' : 'Newsletter'}
                  </span>
                                    <button
                                        onClick={() => handleDelete(msg.id)}
                                        className="p-1.5 rounded-lg text-[#526274] hover:bg-red-50 hover:text-red-600 transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Card Body */}
                                {msg.type === 'contact' ? (
                                    <div className="flex-grow flex flex-col gap-3">
                                        <div className="flex items-center gap-2 font-bold text-base text-[#111827]">
                                            <User size={16} className="text-[#00ADEF]" />
                                            {msg.name || 'Unknown'}
                                        </div>
                                        <a href={`mailto:${msg.email}`} className="text-sm text-[#526274] underline break-all hover:text-[#00ADEF]">
                                            {msg.email}
                                        </a>
                                        <p className="mt-2 text-[#526274] bg-[#F6FAFC] p-4 rounded-xl border border-[#D6E4EA] text-sm flex-grow italic">
                                            "{msg.message}"
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex-grow flex flex-col justify-center items-center text-center gap-2 py-4">
                                        <Mail size={28} className="text-[#E38524]" />
                                        <p className="font-bold text-base text-[#111827] break-all">{msg.email}</p>
                                        <p className="text-xs text-[#526274]">Wants to subscribe to updates</p>
                                    </div>
                                )}

                                {/* Card Footer */}
                                <div className="mt-4 pt-3 border-t border-[#D6E4EA] text-xs text-[#526274] font-medium">
                                    Received: {new Date(msg.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-white border border-[#D6E4EA] rounded-2xl text-center">
                        <div className="p-4 rounded-2xl bg-[#EAF8FC] mb-6">
                            <InboxIcon className="text-[#00ADEF]" size={32} />
                        </div>
                        <h2 className="text-xl font-extrabold text-[#111827] mb-2">Inbox is empty</h2>
                        <p className="text-[#526274] text-sm font-medium max-w-sm">
                            When visitors submit the contact or newsletter forms, they will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}