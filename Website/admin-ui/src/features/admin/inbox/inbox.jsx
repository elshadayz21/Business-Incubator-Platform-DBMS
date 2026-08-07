import React, { useState, useEffect } from "react";
import {
  Mail,
  Trash2,
  Inbox as InboxIcon,
  Loader2,
  User,
  Sparkles,
  Megaphone,
  Users,
} from "lucide-react";

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

    const contactCount = messages.filter((m) => m.type === 'contact').length;
    const newsletterCount = messages.filter((m) => m.type !== 'contact').length;

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#00ADEF] via-[#078CC8] to-[#0878B4] rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
                <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full border-30 border-white/10" />
                <div className="relative z-10 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider text-white">
                        <Sparkles size={12} className="text-[#E38524]" />
                        DxValley Incubation Center • Communications
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk']">
                        Admin Inbox
                    </h1>
                    <p className="text-sm text-white/85 max-w-2xl leading-relaxed">
                        View messages and newsletter sign-ups submitted through the public site.
                    </p>
                </div>
            </div>

            {/* Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
                <div className="bg-white border border-[#D6E4EA] rounded-2xl p-4 flex items-center gap-4 shadow-xs">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20">
                        <Mail size={20} />
                    </div>
                    <div>
                        <p className="text-2xl font-extrabold text-[#111827] font-['Space_Grotesk']">
                            {contactCount}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#526274]">
                            Contact Messages
                        </p>
                    </div>
                </div>
                <div className="bg-white border border-[#D6E4EA] rounded-2xl p-4 flex items-center gap-4 shadow-xs">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#FFF1E3] text-[#E38524] border border-[#E38524]/20">
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-2xl font-extrabold text-[#111827] font-['Space_Grotesk']">
                            {newsletterCount}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#526274]">
                            Newsletter Sign-ups
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white border border-[#D6E4EA] rounded-2xl shadow-xs">
                    <Loader2 className="text-[#00ADEF] animate-spin mb-4" size={40} strokeWidth={2} />
                    <p className="text-[#111827] font-bold text-lg font-['Space_Grotesk']">Loading messages...</p>
                </div>
            ) : messages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {messages.map((msg) => (
                        <div key={msg.id} className="bg-white border border-[#D6E4EA] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col">

                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-4 pb-3 border-b border-[#D6E4EA]">
                                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                    msg.type === 'contact'
                                        ? 'bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20'
                                        : 'bg-[#FFF1E3] text-[#E38524] border border-[#E38524]/20'
                                }`}>
                                    {msg.type === 'contact' ? (
                                        <><Mail size={12} /> Contact Form</>
                                    ) : (
                                        <><Megaphone size={12} /> Newsletter</>
                                    )}
                                </span>
                                <button
                                    onClick={() => handleDelete(msg.id)}
                                    title="Delete message"
                                    className="p-2 rounded-lg text-[#526274] hover:bg-rose-50 hover:text-rose-600 transition-all"
                                >
                                    <Trash2 size={18} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Card Body */}
                            {msg.type === 'contact' ? (
                                <div className="flex-grow flex flex-col gap-3">
                                    <div className="flex items-center gap-2 font-bold text-lg text-[#111827]">
                                        <div className="w-8 h-8 rounded-full bg-[#EAF8FC] text-[#006F9E] flex items-center justify-center shrink-0">
                                            <User size={16} strokeWidth={2.5} />
                                        </div>
                                        {msg.name || 'Unknown'}
                                    </div>
                                    <a href={`mailto:${msg.email}`} className="text-sm text-[#006F9E] hover:underline break-all">
                                        {msg.email}
                                    </a>
                                    <p className="mt-2 text-sm text-[#526274] bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl p-4 flex-grow leading-relaxed">
                                        "{msg.message}"
                                    </p>
                                </div>
                            ) : (
                                <div className="flex-grow flex flex-col justify-center items-center text-center gap-2 py-4">
                                    <div className="w-14 h-14 rounded-2xl bg-[#FFF1E3] text-[#E38524] flex items-center justify-center mb-1">
                                        <Mail size={26} strokeWidth={2.5} />
                                    </div>
                                    <p className="font-bold text-lg text-[#111827] break-all">{msg.email}</p>
                                    <p className="text-xs text-[#526274]">Wants to subscribe to updates</p>
                                </div>
                            )}

                            {/* Card Footer */}
                            <div className="mt-4 pt-3 border-t border-[#D6E4EA] text-[11px] text-[#526274] font-bold uppercase tracking-wide">
                                Received: {new Date(msg.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-white border border-[#D6E4EA] rounded-2xl shadow-xs text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#EAF8FC] border border-[#00ADEF]/20 flex items-center justify-center mb-5">
                        <InboxIcon className="text-[#00ADEF]" size={32} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-2xl font-bold text-[#111827] font-['Space_Grotesk'] mb-2">Inbox is empty</h2>
                    <p className="text-[#526274] font-medium max-w-sm">
                        When visitors submit the contact or newsletter forms, they will appear here.
                    </p>
                </div>
            )}
        </div>
    );
}
