// ============================================================================
// MassEmail.jsx — Admin Mass Email module (UR-B4)
// ----------------------------------------------------------------------------
// Compose screen for bulk emails: pick a recipient source (accepted/declined
// applicants, subscribers, contacts — live counts from the UR-B10 inbox),
// load a reusable template, personalize with {{first_name}}/{{email}} and send.
// Includes email-template management (create/edit/delete) and a sent-campaign
// history table. Talks to /api/admin/emails/* (see routes/admin-api.js).
// ============================================================================
import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Loader2,
  Sparkles,
  Users,
  FileText,
  PlusCircle,
  Trash2,
  Save,
  Clock,
  CheckCircle2,
  XCircle,
  MailCheck,
  Copy,
  Eye,
} from "lucide-react";

const RECIPIENT_PLACEHOLDER_HINT =
  "Available placeholders: {{first_name}}, {{name}}, {{email}}";

const INVITATION_SUBJECT = "You're In! Welcome to DxValley \u{1F680}";
const INVITATION_BODY = "Congratulations!\n\nYour application to DxValley has been accepted.\n\nTo complete your registration and access the Founder Dashboard, please click the link below:\n\n{link}";

export default function MassEmail() {
  const [sources, setSources] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Compose form
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [batchId, setBatchId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Hand-picked recipients for inbox sources (subscribers / contacts)
  const [recipients, setRecipients] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  // Template form
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateSubmitting, setTemplateSubmitting] = useState(false);
  const [templateNotice, setTemplateNotice] = useState("");

  // Recipient counts depend on the selected batch (announcement) filter
  const fetchSources = async (batch) => {
    try {
      const query = batch ? `?announcementId=${encodeURIComponent(batch)}` : "";
      const res = await fetch(`/api/admin/emails/sources${query}`, {
        credentials: "include",
      });
      const data = await res.json();
      setSources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching email sources:", error);
    }
  };

  // Individual entries of the chosen source for hand-picking recipients.
  // For applicant sources, an optional batch narrows the list as well.
  const fetchRecipients = async (src, batch) => {
    if (!src) {
      setRecipients([]);
      return;
    }
    try {
      const params = new URLSearchParams({ source: src });
      if (
        (src === "accepted_applicants" || src === "declined_applicants") &&
        batch
      ) {
        params.set("announcementId", batch);
      }
      const res = await fetch(`/api/admin/emails/recipients?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      setRecipients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching recipients:", error);
      setRecipients([]);
    }
  };

  const fetchAll = async () => {
    try {
      const [sourcesRes, templatesRes, campaignsRes, announcementsRes] =
        await Promise.all([
          fetch("/api/admin/emails/sources", { credentials: "include" }),
          fetch("/api/admin/emails/templates", { credentials: "include" }),
          fetch("/api/admin/emails/campaigns", { credentials: "include" }),
          fetch("/api/admin/announcements", { credentials: "include" }),
        ]);
      const [sourcesData, templatesData, campaignsData, announcementsData] =
        await Promise.all([
          sourcesRes.json(),
          templatesRes.json(),
          campaignsRes.json(),
          announcementsRes.json(),
        ]);
      setSources(Array.isArray(sourcesData) ? sourcesData : []);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
      setAnnouncements(
        Array.isArray(announcementsData) ? announcementsData : [],
      );
      if (Array.isArray(sourcesData) && sourcesData.length > 0 && !source) {
        setSource(sourcesData[0].key);
      }
    } catch (error) {
      console.error("Error fetching email data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchAll, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload the hand-pick list whenever the source or target batch changes
  useEffect(() => {
    fetchRecipients(source, batchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, batchId]);

  const activeSource = sources.find((s) => s.key === source);
  const isAcceptedSource = source === "accepted_applicants";
  const isApplicantSource =
    source === "accepted_applicants" || source === "declined_applicants";
  const selectedCount = selectedIds.length;
  const effectiveCount =
    selectedCount > 0 ? selectedCount : activeSource?.count ?? 0;

  const toggleRecipient = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleAllRecipients = () =>
    setSelectedIds((prev) =>
      prev.length === recipients.length ? [] : recipients.map((r) => r.id),
    );

  const handleLoadTemplate = (tpl) => {
    setSubject(tpl.subject);
    let newBody = tpl.body;
    if (isAcceptedSource && !newBody.includes("{link}")) {
      newBody = newBody + "\n\n{link}";
    }
    setBody(newBody);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!source || !subject || !body) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          subject,
          body,
          source,
          announcementId: batchId || null,
          ...(selectedIds.length > 0 ? { recipientIds: selectedIds } : {}),
        }),
      });
      const data = await res.json();
      setSendResult(data);
      fetchAll();
    } catch (error) {
      console.error("Error sending campaign:", error);
      setSendResult({ error: error.message });
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    if (!templateName || !templateSubject || !templateBody) return;
    setTemplateSubmitting(true);
    setTemplateNotice("");
    try {
      const url = editingTemplateId
        ? `/api/admin/emails/templates/${editingTemplateId}`
        : "/api/admin/emails/templates";
      const res = await fetch(url, {
        method: editingTemplateId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: templateName,
          subject: templateSubject,
          body: templateBody,
        }),
      });
      await res.json();
      setTemplateName("");
      setTemplateSubject("");
      setTemplateBody("");
      setEditingTemplateId(null);
      setTemplateNotice("Template saved successfully.");
      fetchAll();
    } catch (error) {
      console.error("Error saving template:", error);
      setTemplateNotice("Failed to save template.");
    } finally {
      setTemplateSubmitting(false);
      setTimeout(() => setTemplateNotice(""), 3000);
    }
  };

  const handleEditTemplate = (tpl) => {
    setEditingTemplateId(tpl.id);
    setTemplateName(tpl.name);
    setTemplateSubject(tpl.subject);
    setTemplateBody(tpl.body);
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm("Delete this email template?")) return;
    try {
      await fetch(`/api/admin/emails/templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchAll();
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const handleResetTemplateForm = () => {
    setEditingTemplateId(null);
    setTemplateName("");
    setTemplateSubject("");
    setTemplateBody("");
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-[#D6E4EA] bg-[#F6FAFC] text-[#111827] font-medium focus:outline-none focus:ring-2 focus:ring-[#00ADEF] focus:border-[#00ADEF] transition-all placeholder:text-[#8AA0B4]";

  return (
    <div className="space-y-6">
      {/* Header Banner */}


      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-[#D6E4EA] rounded-2xl shadow-xs">
          <Loader2
            className="text-[#00ADEF] animate-spin mb-4"
            size={40}
            strokeWidth={2}
          />
          <p className="text-[#111827] font-bold text-lg font-['Space_Grotesk']">
            Loading email tools...
          </p>
        </div>
      ) : (
        <>
          {/* Recipient Source Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sources.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSource(s.key)}
                className={`text-left bg-white border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md ${
                  source === s.key
                    ? "border-[#00ADEF] ring-2 ring-[#00ADEF]/20"
                    : "border-[#D6E4EA]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                      source === s.key
                        ? "bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/20"
                        : "bg-[#F6FAFC] text-[#526274] border-[#D6E4EA]"
                    }`}
                  >
                    <Users size={20} />
                  </div>
                  <span className="text-2xl font-extrabold text-[#111827] font-['Space_Grotesk']">
                    {s.count}
                  </span>
                </div>
                <p className="font-bold text-sm text-[#111827] leading-snug">
                  {s.label}
                </p>
                <p className="text-[11px] text-[#526274] mt-1 leading-relaxed">
                  {s.description}
                </p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compose */}
            <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs h-fit">
              <div className="mb-5 pb-4 border-b border-[#D6E4EA]">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                  Compose
                </span>
                <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk'] flex items-center gap-2">
                  <Send size={20} className="text-[#E38524]" strokeWidth={2.5} />
                  New Campaign
                </h2>
              </div>

              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#526274] mb-2">
                    Campaign name (optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="e.g., Batch 04 Acceptance Notices"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#526274] mb-2">
                    Recipient source
                  </label>
                  <select
                    value={source}
                    onChange={(e) => {
                      const newSource = e.target.value;
                      setSource(newSource);
                      setSelectedIds([]);
                      if (newSource === "accepted_applicants") {
                        setSubject(INVITATION_SUBJECT);
                        setBody(INVITATION_BODY);
                      }
                    }}
                    className={inputClass}
                  >
                    {sources.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label} ({s.count})
                      </option>
                    ))}
                  </select>
                  {activeSource && (
                    <p className="text-[11px] text-[#006F9E] mt-1.5 font-semibold">
                      Sends to {effectiveCount} recipient
                      {effectiveCount === 1 ? "" : "s"}
                      {selectedCount > 0 ? " (hand-picked)" : ""}
                    </p>
                  )}
                </div>

                {(source === "accepted_applicants" ||
                  source === "declined_applicants") && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#526274] mb-2">
                      Target batch (optional)
                    </label>
                    <select
                      value={batchId}
                      onChange={(e) => {
                        const next = e.target.value;
                        setBatchId(next);
                        setSelectedIds([]);
                        fetchSources(next);
                      }}
                      className={inputClass}
                    >
                      <option value="">All batches</option>
                      {announcements.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-[#8AA0B4] mt-1.5">
                      {batchId
                        ? "Counts and sends are limited to applicants of this batch's open call."
                        : "Pick an announcement to email only that batch's applicants."}
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#526274]">
                      Pick recipients ({selectedIds.length} of{" "}
                      {recipients.length} selected)
                    </label>
                    {recipients.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleAllRecipients}
                        className="text-[11px] font-bold text-[#006F9E] hover:underline"
                      >
                        {selectedIds.length === recipients.length
                          ? "Clear all"
                          : "Select all"}
                      </button>
                    )}
                  </div>
                  <div className="max-h-52 overflow-y-auto border border-[#D6E4EA] rounded-xl divide-y divide-[#D6E4EA] bg-[#F6FAFC]">
                    {recipients.length === 0 ? (
                      <p className="p-4 text-xs text-[#8AA0B4]">
                        No entries in this source yet.
                      </p>
                    ) : (
                      recipients.map((r) => (
                        <label
                          key={r.id}
                          className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
                            selectedIds.includes(r.id)
                              ? "bg-[#EAF8FC]"
                              : "hover:bg-[#EAF8FC]/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(r.id)}
                            onChange={() => toggleRecipient(r.id)}
                            className="mt-0.5 w-4 h-4 accent-[#00ADEF]"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="block text-sm font-bold text-[#111827] truncate">
                                {r.name || r.email}
                              </span>
                              {isApplicantSource && r.status && (
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border shrink-0 ${
                                    r.status === "Accepted"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}
                                >
                                  {r.status}
                                </span>
                              )}
                            </span>
                            <span className="block text-xs text-[#526274] truncate">
                              {r.email} •{" "}
                              {new Date(r.created_at).toLocaleDateString()}
                            </span>
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-[11px] text-[#8AA0B4] mt-1.5">
                    Leave everyone unchecked to send to all{" "}
                    {activeSource?.count ?? 0}.{" "}
                    {isApplicantSource
                      ? "Tick specific applicants — e.g. late arrivals after your first acceptance wave — to email just them."
                      : "Check specific people to reply only to them."}
                  </p>
                </div>

                {templates.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#526274] mb-2">
                      Load from template
                    </label>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const tpl = templates.find(
                          (t) => t.id === Number(e.target.value),
                        );
                        if (tpl) handleLoadTemplate(tpl);
                      }}
                      className={inputClass}
                    >
                      <option value="">— Choose a template —</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#526274] mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className={inputClass}
                    placeholder="e.g., Congratulations {{first_name}}!"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#526274] mb-2">
                    Body
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    rows="8"
                    className={`${inputClass} resize-none`}
                    placeholder={`Dear {{first_name}},\n\nWelcome to the DxValley incubation program...`}
                  />
                  <p className="text-[11px] text-[#8AA0B4] mt-1.5">
                    {isAcceptedSource
                      ? "Type {link} where you want the signup button to appear. Also available: {{first_name}}, {{name}}, {{email}}"
                      : RECIPIENT_PLACEHOLDER_HINT}
                  </p>
                </div>

                {isAcceptedSource && body.includes("{link}") && (
                  <div className="bg-[#EAF8FC] border border-[#00ADEF]/20 rounded-xl p-4">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] mb-2">
                      Preview (Link Area)
                    </p>
                    <div className="text-sm text-[#111827]">
                      {body.split("\n").map((line, i) => (
                        <p key={i} className="mb-2">
                          {line.includes("{link}") ? (
                            <span className="inline-block bg-[#E38524] text-white px-4 py-2 rounded-lg font-bold text-xs cursor-pointer">
                              Complete Registration
                            </span>
                          ) : (
                            line
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00ADEF] to-[#0878B4] text-white font-bold uppercase tracking-wider hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending to {effectiveCount} recipient
                      {effectiveCount === 1 ? "" : "s"}...
                    </>
                  ) : (
                    <>
                      Send Campaign
                      <Send size={18} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </form>

              {sendResult && (
                <div
                  className={`mt-4 p-4 rounded-xl border text-sm font-semibold ${
                    sendResult.error
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                  }`}
                >
                  {sendResult.error ? (
                    <>
                      <XCircle size={16} className="inline mr-1.5" />
                      {sendResult.error}
                    </>
                  ) : (
                    <>
                      <MailCheck size={16} className="inline mr-1.5" />
                      {sendResult.sentCount} / {sendResult.totalRecipients} emails
                      delivered
                      {sendResult.simulated
                        ? " (simulated — no SMTP configured)"
                        : ""}
                      .
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Templates */}
            <div className="space-y-6">
              <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs">
                <div className="mb-5 pb-4 border-b border-[#D6E4EA] flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                      Reusable Messages
                    </span>
                    <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk'] flex items-center gap-2">
                      <FileText size={20} className="text-[#00ADEF]" strokeWidth={2.5} />
                      Email Templates
                    </h2>
                  </div>
                  {editingTemplateId && (
                    <button
                      onClick={handleResetTemplateForm}
                      className="text-[11px] font-bold text-[#006F9E] hover:underline"
                    >
                      + New template
                    </button>
                  )}
                </div>

                <form onSubmit={handleTemplateSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="Template name"
                    />
                    <input
                      type="text"
                      value={templateSubject}
                      onChange={(e) => setTemplateSubject(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="Subject"
                    />
                  </div>
                  <textarea
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                    required
                    rows="5"
                    className={`${inputClass} resize-none`}
                    placeholder={`Dear {{first_name}}, ...`}
                  />
                  {templateNotice && (
                    <p className="text-xs font-bold text-emerald-700">
                      {templateNotice}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={templateSubmitting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00ADEF] to-[#0878B4] text-white font-bold uppercase tracking-wider hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {templateSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} strokeWidth={2.5} />
                        {editingTemplateId ? "Update Template" : "Save Template"}
                      </>
                    )}
                  </button>
                </form>

                {templates.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {templates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="border border-[#D6E4EA] rounded-xl p-4 bg-[#F6FAFC] hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-[#111827] truncate">
                              {tpl.name}
                            </p>
                            <p className="text-xs text-[#526274] truncate mt-0.5">
                              {tpl.subject}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleLoadTemplate(tpl)}
                              title="Use in compose"
                              className="p-2 rounded-lg text-[#006F9E] hover:bg-[#EAF8FC] transition-all"
                            >
                              <Copy size={15} />
                            </button>
                            <button
                              onClick={() => handleEditTemplate(tpl)}
                              title="Edit template"
                              className="p-2 rounded-lg text-[#006F9E] hover:bg-[#EAF8FC] transition-all"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              title="Delete template"
                              className="p-2 rounded-lg text-[#526274] hover:bg-rose-50 hover:text-rose-600 transition-all"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Campaign History */}
          <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs">
            <div className="mb-5 pb-4 border-b border-[#D6E4EA]">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                History
              </span>
              <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk'] flex items-center gap-2">
                <Mail size={20} className="text-[#00ADEF]" strokeWidth={2.5} />
                Sent Campaigns
              </h2>
            </div>

            {campaigns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[860px]">
                  <thead>
                    <tr className="bg-[#F6FAFC] border-b border-[#D6E4EA] text-[#526274] text-xs font-bold uppercase tracking-wider">
                      <th className="p-4">Campaign</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Source</th>
                      <th className="p-4">Batch</th>
                      <th className="p-4">Sent</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6E4EA] text-sm">
                    {campaigns.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-[#F6FAFC] transition-colors"
                      >
                        <td className="p-4">
                          <p className="font-bold text-[#111827]">
                            {c.name || "(Untitled campaign)"}
                          </p>
                          <p className="text-[11px] text-[#526274]">
                            by {c.created_by_name || "Admin"}
                          </p>
                        </td>
                        <td className="p-4 text-xs text-[#526274] max-w-[220px] truncate">
                          {c.subject}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-[#EAF8FC] text-[#006F9E] text-xs font-bold border border-[#00ADEF]/20 capitalize">
                            {c.recipient_source.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-semibold text-[#526274] max-w-[180px] truncate">
                          {c.announcement_title || "All batches"}
                        </td>
                        <td className="p-4 text-xs font-semibold text-[#111827]">
                          {c.sent_count} / {c.recipient_count}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                              c.status === "sent"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : c.status === "sending"
                                  ? "bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/30"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {c.status === "sent" ? (
                              <CheckCircle2 size={12} />
                            ) : c.status === "sending" ? (
                              <Clock size={12} />
                            ) : (
                              <XCircle size={12} />
                            )}
                            {c.status}
                          </span>
                          {c.error && (
                            <p className="text-[10px] text-rose-600 mt-1 max-w-[180px] truncate">
                              {c.error}
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-xs text-[#526274]">
                          {new Date(c.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#EAF8FC] border border-[#00ADEF]/20 flex items-center justify-center mb-4">
                  <Mail className="text-[#00ADEF]" size={26} />
                </div>
                <p className="text-[#526274] font-bold">
                  No campaigns sent yet.
                </p>
                <p className="text-xs text-[#8AA0B4] mt-1">
                  Use the compose form above to send your first campaign.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
