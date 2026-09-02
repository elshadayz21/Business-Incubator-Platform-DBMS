import { useEffect, useRef, useState, useCallback } from "react";
import { Search, Send, ArrowLeft, MessageCircle } from "lucide-react";

const ROLE_LABELS = {
  admin: "Admin",
  superadmin: "Super Admin",
  entrepreneur: "Entrepreneur",
  mentor: "Mentor",
};

const initials = (name = "") => name.trim().charAt(0).toUpperCase() || "?";

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const ChatPanel = ({ currentUser, initialContact }) => {
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = useRef(null);
  const selectedIdRef = useRef(null);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/chat/contacts", { credentials: "include" });
      const data = await res.json();
      const list = Array.isArray(data.contacts) ? data.contacts : [];

      // Preserve initialContact in state if it's not present in API results yet
      setContacts((prev) => {
        if (initialContact && !list.some((c) => c.id === initialContact.id)) {
          return [initialContact, ...list];
        }
        return list;
      });
    } catch (e) {
      console.error("Error loading chat contacts:", e);
    } finally {
      setLoadingContacts(false);
    }
  }, [initialContact]);

  const fetchMessages = useCallback(async (contactId, { silent } = {}) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/portal/chat/messages/${contactId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load conversation");
      const data = await res.json();
      if (selectedIdRef.current === contactId) {
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch (e) {
      console.error("Error loading conversation:", e);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    const interval = setInterval(fetchContacts, 8000);
    return () => clearInterval(interval);
  }, [fetchContacts]);

  // Synchronize initialContact into active conversation state
  useEffect(() => {
    if (initialContact) {
      const formatted = {
        id: initialContact.id || initialContact.mentor_id,
        name: initialContact.name || initialContact.mentor_name,
        email: initialContact.email || initialContact.mentor_email,
        role: initialContact.role || "mentor",
        profile_image: initialContact.profile_image || null,
      };

      setContacts((prev) => {
        const exists = prev.some((c) => c.id === formatted.id);
        return exists ? prev : [formatted, ...prev];
      });

      setSelected(formatted);
    }
  }, [initialContact]);

  useEffect(() => {
    selectedIdRef.current = selected?.id ?? null;
    if (!selected) return;
    fetchMessages(selected.id);
    const interval = setInterval(() => fetchMessages(selected.id, { silent: true }), 3000);
    return () => clearInterval(interval);
  }, [selected, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !selected || sending) return;

    setSending(true);
    setDraft("");
    try {
      const res = await fetch("/api/portal/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ receiverId: selected.id, content }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        fetchContacts();
      } else {
        window.alert(data.error || "Failed to send message.");
        setDraft(content);
      }
    } catch (err) {
      console.error("Send message error:", err);
      window.alert("An error occurred while sending your message.");
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  const openContact = (contact) => {
    setSelected(contact);
    setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, unread_count: 0 } : c)),
    );
  };

  const filteredContacts = contacts.filter((c) =>
      (c.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
      <div className="bg-white rounded-2xl border border-[#D6E4EA] shadow-xs overflow-hidden h-[calc(100vh-220px)] min-h-[520px] flex">
        {/* Contact / thread list */}
        <div
            className={`w-full sm:w-80 shrink-0 border-r border-[#D6E4EA] flex-col ${
                selected ? "hidden sm:flex" : "flex"
            }`}
        >
          <div className="p-4 border-b border-[#D6E4EA]">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-2">
            Messages
          </span>
            <div className="relative">
              <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#526274]"
              />
              <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full pl-9 pr-3 py-2 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-semibold outline-none focus:border-[#00ADEF] focus:ring-2 focus:ring-[#00ADEF]/20 transition"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingContacts ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-4 border-[#00ADEF] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredContacts.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageCircle className="mx-auto text-[#D6E4EA] mb-2" size={32} />
                  <p className="text-xs font-semibold text-[#526274]">
                    No contacts to message yet.
                  </p>
                </div>
            ) : (
                filteredContacts.map((c) => {
                  const isActive = selected?.id === c.id;
                  const isMine = c.last_message_sender_id === currentUser?.id;
                  return (
                      <button
                          key={c.id}
                          onClick={() => openContact(c)}
                          className={`w-full flex items-center gap-3 px-4 py-3 border-b border-[#F0F4F7] text-left transition ${
                              isActive ? "bg-[#EAF8FC]" : "hover:bg-[#F6FAFC]"
                          }`}
                      >
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-full bg-[#00ADEF] text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                            {c.profile_image ? (
                                <img
                                    src={c.profile_image}
                                    alt={c.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                initials(c.name)
                            )}
                          </div>
                          {c.unread_count > 0 && (
                              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E38524] text-white text-[10px] font-extrabold flex items-center justify-center">
                        {c.unread_count > 9 ? "9+" : c.unread_count}
                      </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-sm text-[#111827] truncate">
                              {c.name}
                            </p>
                            {c.last_message_at && (
                                <span className="text-[10px] text-[#526274] font-semibold shrink-0">
                          {formatTime(c.last_message_at)}
                        </span>
                            )}
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#00ADEF] mb-0.5">
                            {ROLE_LABELS[c.role] || c.role}
                          </p>
                          <p
                              className={`text-xs truncate ${
                                  c.unread_count > 0
                                      ? "font-bold text-[#111827]"
                                      : "font-semibold text-[#526274]"
                              }`}
                          >
                            {c.last_message
                                ? `${isMine ? "You: " : ""}${c.last_message}`
                                : "No messages yet"}
                          </p>
                        </div>
                      </button>
                  );
                })
            )}
          </div>
        </div>

        {/* Thread */}
        <div className={`flex-1 min-w-0 flex-col ${selected ? "flex" : "hidden sm:flex"}`}>
          {!selected ? (
              <div className="flex-1 flex items-center justify-center flex-col text-center p-6">
                <MessageCircle className="text-[#D6E4EA] mb-3" size={44} />
                <p className="text-sm font-bold text-[#526274]">
                  Select a conversation to start chatting.
                </p>
              </div>
          ) : (
              <>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[#D6E4EA] bg-white">
                  <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="sm:hidden text-[#526274]"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-[#00ADEF] text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                    {selected.profile_image ? (
                        <img
                            src={selected.profile_image}
                            alt={selected.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        initials(selected.name)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[#111827] truncate">
                      {selected.name}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#00ADEF]">
                      {ROLE_LABELS[selected.role] || selected.role}
                    </p>
                  </div>
                </div>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F6FAFC]"
                >
                  {loadingMessages ? (
                      <div className="flex items-center justify-center py-16">
                        <div className="w-6 h-6 border-4 border-[#00ADEF] border-t-transparent rounded-full animate-spin" />
                      </div>
                  ) : messages.length === 0 ? (
                      <p className="text-center text-xs font-semibold text-[#526274] py-10">
                        No messages yet. Say hello!
                      </p>
                  ) : (
                      messages.map((m) => {
                        const mine = m.sender_id === currentUser?.id;
                        return (
                            <div
                                key={m.id}
                                className={`flex ${mine ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${
                                      mine
                                          ? "bg-[#00ADEF] text-white rounded-br-sm"
                                          : "bg-white text-[#111827] border border-[#D6E4EA] rounded-bl-sm"
                                  }`}
                              >
                                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                                <p
                                    className={`mt-1 text-[10px] font-bold ${
                                        mine ? "text-white/70" : "text-[#526274]"
                                    }`}
                                >
                                  {formatTime(m.created_at)}
                                </p>
                              </div>
                            </div>
                        );
                      })
                  )}
                </div>

                <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2 p-3 border-t border-[#D6E4EA] bg-white"
                >
                  <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium outline-none focus:border-[#00ADEF] focus:ring-2 focus:ring-[#00ADEF]/20 transition"
                  />
                  <button
                      type="submit"
                      disabled={!draft.trim() || sending}
                      className="p-2.5 rounded-xl bg-[#00ADEF] text-white hover:bg-[#006F9E] disabled:opacity-40 transition shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </>
          )}
        </div>
      </div>
  );
};

export default ChatPanel;