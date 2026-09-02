import React, { useState, useEffect, useCallback } from "react";
import { Trash2, Loader2, Inbox as InboxIcon, Mail, User } from "lucide-react";

export default function Inbox() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadMoreLoading, setLoadMoreLoading] = useState(false);
    const [inboxPage, setInboxPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchMessages = useCallback(async (page = 1) => {
        if (page === 1) { setLoading(true); } else { setLoadMoreLoading(true); }
        try {
            const response = await fetch(`/api/admin/inbox?page=${page}`, { credentials: 'include' });
            const data = await response.json();
            const newMessages = Array.isArray(data) ? data : [];

            if (page === 1) {
                setMessages(newMessages);
            } else {
                setMessages((prev) => [...prev, ...newMessages]);
            }

            setHasMore(newMessages.length >= 10);
        } catch (error) {
            console.error("Error fetching inbox messages:", error);
            if (page === 1) setMessages([]);
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadMoreLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMessages(1);
    }, [fetchMessages]);

    const handleLoadMore = () => {
        const nextPage = inboxPage + 1;
        setInboxPage(nextPage);
        fetchMessages(nextPage);
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`/api/admin/inbox/${id}`, { method: 'DELETE', credentials: 'include' });
            setInboxPage(1);
            fetchMessages(1);
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#F6FAFC] h-screen font-sans text-[#111827]">
            <div className="p-6 lg:p-10 max-w-[1920px] mx-auto">


                <div className="mb-8">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-2">Communications</span>
                    <h1 className="text-3xl font-extrabold tracking-[-.04em] text-cyan-dark">Admin Inbox</h1>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white border border-[#D6E4EA] rounded-2xl">
                        <Loader2 className="animate-spin text-[#00ADEF]" size={32} />
                    </div>
                ) : messages.length > 0 ? (


                    <>
                        <div className="bg-white border border-[#D6E4EA] rounded-2xl shadow-xs overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                <tr className="bg-[#F6FAFC] text-[#526274] uppercase tracking-wider text-xs font-extrabold border-b border-[#D6E4EA]">
                                    <th className="p-4 hidden md:table-cell">Type</th>
                                    <th className="p-4">Sender</th>
                                    <th className="p-4 hidden lg:table-cell">Message</th>
                                    <th className="p-4 hidden md:table-cell">Date</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-[#D6E4EA]">
                                {messages.map((msg) => (
                                    <tr key={msg.id} className="hover:bg-[#F6FAFC] transition align-top">

                                        <td className="p-4 hidden md:table-cell">
                                            {msg.type === 'contact' ? (
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="px-2 py-1 rounded-full text-[10px] font-bold border bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/20">
                                                        Contact
                                                    </span>
                                                    {msg.sender_role === 'mentor' ? (
                                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold border bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/20">
                                                            Mentor
                                                        </span>
                                                    ) : msg.sender_role === 'investor' ? (
                                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold border bg-[#FFF1E3] text-[#E38524] border-[#E38524]/20">
                                                            Investor
                                                        </span>
                                                    ) : msg.sender_role === 'partner' ? (
                                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold border bg-purple-50 text-purple-700 border-purple-200">
                                                            Partner
                                                        </span>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold border bg-[#FFF1E3] text-[#E38524] border-[#E38524]/20">
                                                    Newsletter
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-4 max-w-[200px]">
                                            <div className="font-bold text-sm text-[#111827] flex items-center gap-2">
                                                {msg.type === 'contact' ? <User size={14} className="text-[#00ADEF]" /> : <Mail size={14} className="text-[#E38524]" />}
                                                {msg.name || 'Newsletter Sub'}
                                            </div>
                                            <a href={`mailto:${msg.email}`} className="text-xs text-[#526274] hover:text-[#00ADEF] underline break-all block mt-1">
                                                {msg.email}
                                            </a>
                                        </td>

                                        <td className="p-4 hidden lg:table-cell max-w-[400px]">
                                            <p className="text-sm text-[#526274] line-clamp-2 italic">"{msg.message || 'Wants to subscribe to updates'}"</p>
                                        </td>

                                        <td className="p-4 hidden md:table-cell text-xs text-[#526274] font-medium whitespace-nowrap">
                                            {new Date(msg.created_at).toLocaleDateString()}
                                        </td>

                                        <td className="p-4 text-right">
                                            <button onClick={() => handleDelete(msg.id)} className="p-2 rounded-lg text-[#526274] hover:bg-red-50 hover:text-red-600 transition inline-flex">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination: Load More */}
                        <div className="mt-6 flex flex-col items-center gap-2">
                            {hasMore ? (
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadMoreLoading}
                                    className="px-6 py-2 bg-[#00ADEF] text-white rounded-xl text-sm font-bold hover:bg-[#006F9E] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loadMoreLoading && <Loader2 size={16} className="animate-spin" />}
                                    Load More
                                </button>
                            ) : (
                                <p className="text-xs text-[#526274] font-medium">No more messages to load</p>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-white border border-[#D6E4EA] rounded-2xl text-center">
                        <div className="p-4 rounded-2xl bg-[#EAF8FC] mb-6">
                            <InboxIcon className="text-[#00ADEF]" size={32} />
                        </div>
                        <h2 className="text-xl font-extrabold text-[#111827] mb-2">Inbox is empty</h2>
                    </div>
                )}
            </div>
        </div>
    );
}