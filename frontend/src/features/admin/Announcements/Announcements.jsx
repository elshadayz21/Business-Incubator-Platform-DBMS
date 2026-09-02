import React, { useState, useEffect } from "react";
import { Megaphone, Trash2, Loader2, Send, PlusCircle, FileUp, X, Pencil, Copy, Users, AlertTriangle, Check, Eye } from "lucide-react";

import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

// The actual input widgets a question can render as. Kept to the small,
// common set — "what this question means" (full name, email, ...) is a
// separate concern, handled by linking the question to a database field
// below, not by inventing a new "field type" per concept.
const FIELD_WIDGET_TYPES = [
    { value: "text", label: "Short Text" },
    { value: "textarea", label: "Long Text" },
    { value: "email", label: "Email" },
    { value: "tel", label: "Phone Number" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "select", label: "Dropdown" },
    { value: "radio", label: "Radio (Single Choice)" },
    { value: "checkbox", label: "Checkbox (Multiple)" },
];

// The normalized applications columns a question's answer can be linked to.
// Linking a question here is what actually connects the filled-in data to
// its respective column in the database, instead of it only sitting in the
// generic answers blob (or, worse, being guessed from the label text).
const MAPPABLE_DB_FIELDS = [
    { value: "", label: "Not linked (custom question)" },
    { value: "full_name", label: "Applicant Full Name" },
    { value: "email", label: "Applicant Email" },
    { value: "phone", label: "Applicant Phone" },
    { value: "startup_idea", label: "Startup Idea" },
    { value: "background", label: "Applicant Background" },
];

// How much of the row a question takes on the public apply form. 'auto'
// (default) lets the form pick a sensible width from the widget type
// (long text = full row, short inputs = half row, side-by-side). An admin
// can override this for a specific question — e.g. a dropdown with long
// option text that would look cramped at half-width.
const FIELD_WIDTHS = [
    { value: "auto", label: "Auto (based on question type)" },
    { value: "half", label: "Half row (side-by-side)" },
    { value: "full", label: "Full row" },
];

// Which step of the public apply form a question appears on. Questions
// sharing the same section (in the order they're added here) become one
// page of the multi-step apply form, with the section name shown as that
// step's label in the progress bar.
const emptyField = () => ({ label: "", field_type: "text", options: "", required: false, maps_to: "", width: "auto", section: "General Information" });

// Every open call needs a way to identify the applicant, so the builder
// starts pre-seeded with the standard questions (fully editable/removable —
// this is just a sensible starting point, not a hardcoded form). They're
// pre-split into a couple of sections so a fresh open call already shows
// applicants the paginated form, not one long page.
const DEFAULT_OPEN_CALL_FIELDS = () => ([
    { label: "Full Name", field_type: "text", options: "", required: true, maps_to: "full_name", width: "auto", section: "Personal Information" },
    { label: "Email Address", field_type: "email", options: "", required: true, maps_to: "email", width: "auto", section: "Personal Information" },
    { label: "Phone Number", field_type: "tel", options: "", required: false, maps_to: "phone", width: "auto", section: "Personal Information" },
    { label: "Startup Idea", field_type: "textarea", options: "", required: true, maps_to: "startup_idea", width: "auto", section: "Your Idea" },
    { label: "Background", field_type: "textarea", options: "", required: false, maps_to: "background", width: "auto", section: "Your Idea" },
]);

// Helper: Format content to professional HTML with proper spacing
const formatAnnouncementContent = (text) => {
    if (!text) return '';
    let plainText = text;
    if (/<[a-z][\s\S]*>/i.test(text)) {
        const temp = document.createElement('div');
        temp.innerHTML = text;
        plainText = temp.textContent || temp.innerText || '';
    }
    const sentences = plainText.split(/(?<=[.!?])\s+/).filter(s => s.trim());
    if (sentences.length > 1) {
        return sentences.map(s => `<p style="margin: 0 0 12px 0; line-height: 1.7; word-break: break-word; overflow-wrap: break-word;">${s.trim()}</p>`).join('');
    }
    return `<p style="margin: 0 0 12px 0; line-height: 1.7; word-break: break-word; overflow-wrap: break-word;">${plainText.trim()}</p>`;
};

export default function Announcements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [deadline, setDeadline] = useState("");
    const [document, setDocument] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [editingFormId, setEditingFormId] = useState(null);
    const [formFields, setFormFields] = useState([]);

    // Form state
    const [isOpenCall, setIsOpenCall] = useState(false);
    const [capacity, setCapacity] = useState("");

    // Application form fields, built inline while creating the announcement.
    // These are saved together with the announcement in a single submit, so
    // an open call is only ever published once its form already exists.
    const [createFormFields, setCreateFormFields] = useState([emptyField()]);

    // Edit Modal state
    const [editModal, setEditModal] = useState({ open: false, announcement: null });
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editDeadline, setEditDeadline] = useState("");
    const [editDocument, setEditDocument] = useState(null);
    const [editDocumentUrl, setEditDocumentUrl] = useState(null);
    const [editIsOpenCall, setEditIsOpenCall] = useState(false);
    const [editCapacity, setEditCapacity] = useState("");
    const [updating, setUpdating] = useState(false);

    // Delete Confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, title: "" });

    // Application Count state
    const [appCounts, setAppCounts] = useState({});
    const [showingAppsFor, setShowingAppsFor] = useState(null);

    const fetchAnnouncements = async () => {
        try {
            const response = await fetch('/api/admin/announcements', { credentials: 'include' });
            const data = await response.json();
            setAnnouncements(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching announcements:", error);
            setAnnouncements([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnnouncements(); }, []);

    const handleFileChange = (file, isEdit = false) => {
        if (!file) return;
        const allowedExtensions = ["pdf", "doc", "docx", "png", "jpg", "jpeg"];
        const extension = file.name.split(".").pop().toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            window.alert("Invalid file type. Only PDF, DOC, DOCX, PNG, JPG, and JPEG files are allowed.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            window.alert("File size exceeds the 5MB limit.");
            return;
        }
        if (isEdit) {
            setEditDocument(file);
        } else {
            setDocument(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !content) return;

        // Open calls must have their application form built BEFORE the
        // announcement is published — not published first and built after.
        const realFields = createFormFields.filter(f => f.label && f.label.trim());
        if (isOpenCall && realFields.length === 0) {
            alert("This is an open call — build the application form (add at least one question) before publishing.");
            return;
        }
        // The form has no more hardcoded name/email inputs to fall back on —
        // whatever the admin links here IS how applicants get identified.
        if (isOpenCall) {
            const mapped = new Set(realFields.map(f => f.maps_to).filter(Boolean));
            if (!mapped.has("full_name") || !mapped.has("email")) {
                alert("Link one question to \"Applicant Full Name\" and one to \"Applicant Email\" before publishing — otherwise there'll be no way to identify who applied.");
                return;
            }
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('is_open_call', isOpenCall);
            if (capacity) formData.append('capacity', capacity);
            if (deadline) formData.append('deadline', deadline);
            if (document) formData.append('document', document);
            if (isOpenCall) formData.append('fields', JSON.stringify(realFields));

            const response = await fetch('/api/admin/announcements', {
                method: 'POST', credentials: 'include', body: formData
            });
            if (!response.ok) {
                let message = "Failed to publish";
                try { const data = await response.json(); if (data && data.message) message = data.message; } catch (e) { }
                throw new Error(message);
            }
            setTitle(""); setContent(""); setDeadline(""); setDocument(null); setIsOpenCall(false); setCapacity("");
            setCreateFormFields([emptyField()]);
            fetchAnnouncements();
        } catch (error) {
            console.error("Error creating announcement:", error);
            alert(error.message || "Failed to publish announcement.");
        } finally {
            setSubmitting(false);
        }
    };

    const addCreateField = () => setCreateFormFields([...createFormFields, emptyField()]);
    const removeCreateField = (index) => { const updated = [...createFormFields]; updated.splice(index, 1); setCreateFormFields(updated); };
    const handleCreateFieldChange = (index, key, value) => { const updated = [...createFormFields]; updated[index][key] = value; setCreateFormFields(updated); };

    const handleDelete = async (id) => {
        try {
            await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE', credentials: 'include' });
            setDeleteConfirm({ open: false, id: null, title: "" });
            fetchAnnouncements();
        } catch (error) {
            console.error("Error deleting announcement:", error);
        }
    };

    const handleEdit = async (ann) => {
        setEditModal({ open: true, announcement: ann });
        setEditTitle(ann.title);
        setEditContent(ann.content);
        setEditDeadline(ann.deadline ? new Date(ann.deadline).toISOString().slice(0, 16) : "");
        setEditDocumentUrl(ann.document_url);
        setEditDocument(null);
        setEditIsOpenCall(ann.is_open_call);
        setEditCapacity(ann.capacity || "");
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editTitle || !editContent) return;
        setUpdating(true);
        try {
            const formData = new FormData();
            formData.append('title', editTitle);
            formData.append('content', editContent);
            formData.append('is_open_call', editIsOpenCall);
            if (editCapacity) formData.append('capacity', editCapacity);
            if (editDeadline) formData.append('deadline', editDeadline);
            if (editDocument) {
                formData.append('document', editDocument);
            } else if (editDocumentUrl) {
                formData.append('document_url', editDocumentUrl);
            } else {
                formData.append('document_url', '');
            }

            const response = await fetch(`/api/admin/announcements/${editModal.announcement.id}`, {
                method: 'PUT', credentials: 'include', body: formData
            });
            if (!response.ok) throw new Error("Failed to update");
            setEditModal({ open: false, announcement: null });
            fetchAnnouncements();
        } catch (error) {
            console.error("Error updating announcement:", error);
            alert("Failed to update announcement.");
        } finally {
            setUpdating(false);
        }
    };

    const handleDuplicate = async (id) => {
        try {
            const response = await fetch(`/api/admin/announcements/${id}/duplicate`, { method: 'POST', credentials: 'include' });
            if (response.ok) fetchAnnouncements();
        } catch (error) {
            console.error("Error duplicating announcement:", error);
        }
    };

    const fetchApplicationCount = async (annId) => {
        try {
            const response = await fetch(`/api/admin/announcements/${annId}/applications/count`, { credentials: 'include' });
            const data = await response.json();
            setAppCounts(prev => ({ ...prev, [annId]: data.count }));
            setShowingAppsFor(annId);
        } catch (error) {
            console.error("Error fetching application count:", error);
        }
    };

    const handleBuildForm = async (ann) => {
        if (editingFormId === ann.id) { setEditingFormId(null); return; }
        setEditingFormId(ann.id);
        try {
            const response = await fetch(`/api/admin/announcements/${ann.id}/form-fields`, { credentials: 'include' });
            const data = await response.json();
            const parsedFields = (Array.isArray(data) && data.length > 0 ? data : DEFAULT_OPEN_CALL_FIELDS()).map(f => {
                let opts = f.options || '';
                if (Array.isArray(opts)) { opts = opts.join(', '); }
                else if (typeof opts === 'string' && opts.startsWith('[')) {
                    try { opts = JSON.parse(opts).join(', '); } catch (e) { /* keep original */ }
                }
                return { ...f, options: opts, maps_to: f.maps_to || "", width: f.width || "auto", section: f.section || "General Information" };
            });
            setFormFields(parsedFields);
        } catch (error) {
            console.error("Error fetching form fields:", error);
            setFormFields([emptyField()]);
        }
    };

    const addField = () => setFormFields([...formFields, emptyField()]);
    const removeField = (index) => { const updated = [...formFields]; updated.splice(index, 1); setFormFields(updated); };
    const handleFieldChange = (index, key, value) => { const updated = [...formFields]; updated[index][key] = value; setFormFields(updated); };

    const handleSaveForm = async (annId) => {
        // With no hardcoded name/email inputs on the public form, a linked
        // question is the only way an applicant gets identified — require it.
        const realFields = formFields.filter(f => f.label && f.label.trim());
        const mapped = new Set(realFields.map(f => f.maps_to).filter(Boolean));
        if (realFields.length === 0 || !mapped.has("full_name") || !mapped.has("email")) {
            alert("Link one question to \"Applicant Full Name\" and one to \"Applicant Email\" before saving — otherwise there'll be no way to identify who applied.");
            return;
        }
        try {
            const response = await fetch(`/api/admin/announcements/${annId}/form-fields`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ fields: formFields })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to save form");
            alert("Form saved successfully!");
            setEditingFormId(null);
        } catch (error) {
            console.error("Error saving form:", error);
            alert("Failed to save form: " + error.message);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#F6FAFC] h-screen font-sans text-[#111827]">
            <div className="p-6 lg:p-10 max-w-[1920px] mx-auto">


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs">
                        <h2 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2"><PlusCircle size={20} className="text-[#00ADEF]" />New Announcement</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Title</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-4 py-3 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] focus:outline-none focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent font-medium text-[#111827]" placeholder="e.g., Batch 04 Applications Open!" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Application Deadline (Optional)</label>
                                <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-4 py-3 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] focus:outline-none focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent font-medium text-[#111827]" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Content (Rich Text)</label>
                                <div className="bg-white border border-[#D6E4EA] rounded-xl overflow-hidden">
                                    <ReactQuill theme="snow" value={content} onChange={setContent} className="h-48 mb-12" modules={{ toolbar: [['bold', 'italic', 'underline', 'strike', { 'color': [] }, { 'background': [] }], [{'list': 'ordered'}, {'list': 'bullet'}], ['link'], ['clean']] }} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Attach Document</label>
                                <div className="flex items-center gap-3">
                                    <label className="flex-1 cursor-pointer flex items-center gap-2 px-4 py-3 border border-dashed border-[#00ADEF] rounded-xl bg-[#EAF8FC] hover:bg-[#D6E4EA] transition">
                                        <FileUp size={18} className="text-[#00ADEF]" />
                                        <span className="text-sm font-bold text-[#006F9E]">{document ? document.name : "Choose a file..."}</span>
                                        <input type="file" className="hidden" onChange={(e) => handleFileChange(e.target.files[0], false)} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
                                    </label>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 py-2">
                                <input id="is_open_call" type="checkbox" checked={isOpenCall} onChange={(e) => {
                                    const checked = e.target.checked;
                                    setIsOpenCall(checked);
                                    // Seed the standard questions the first time this is turned on
                                    // in this session, so the applicant is always identifiable —
                                    // the admin can still edit or remove any of them.
                                    if (checked && createFormFields.every(f => !f.label.trim())) {
                                        setCreateFormFields(DEFAULT_OPEN_CALL_FIELDS());
                                    }
                                }} className="h-4 w-4 rounded border-gray-300 text-[#00ADEF] focus:ring-[#00ADEF]" />
                                <label htmlFor="is_open_call" className="text-sm font-bold text-[#526274]">Enable Application Form (Open Call)</label>
                            </div>
                            {isOpenCall && (
                                <div>
                                    <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Capacity (Optional)</label>
                                    <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full px-4 py-3 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] focus:outline-none focus:ring-2 focus:ring-[#00ADEF]" placeholder="e.g., 50" />
                                </div>
                            )}

                            {/* Application form is built here, BEFORE publishing — an open call
                                can't go live without its form already in place. */}
                            {isOpenCall && (
                                <div className="p-4 bg-[#F6FAFC] border border-[#00ADEF]/30 rounded-xl space-y-3">
                                    <h4 className="text-sm font-extrabold text-[#111827] uppercase tracking-wider">Application Form</h4>
                                    <p className="text-xs text-[#526274]">Add the questions applicants will answer. Link a question to a field below to have its answer stored on the applicant's record — otherwise it's saved as a custom answer.</p>
                                    {createFormFields.map((field, index) => (
                                        <div key={index} className="bg-white p-3 border border-[#D6E4EA] rounded-lg space-y-2">
                                            <div className="flex gap-2">
                                                <input type="text" placeholder="Question (e.g., What is your revenue?)" value={field.label} onChange={(e) => handleCreateFieldChange(index, 'label', e.target.value)} className="flex-1 px-3 py-2 border border-[#D6E4EA] rounded-md text-sm focus:ring-1 focus:ring-[#00ADEF]" />
                                                <button type="button" onClick={() => removeCreateField(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-md"><X size={16} /></button>
                                            </div>
                                            <div>
                                                <input type="text" list="create-sections-list" placeholder="Page / section (e.g., Personal Information)" value={field.section || ''} onChange={(e) => handleCreateFieldChange(index, 'section', e.target.value)} className="w-full px-3 py-2 border border-[#D6E4EA] rounded-md text-sm focus:ring-1 focus:ring-[#00ADEF]" title="Questions with the same page/section name appear together as one step of the apply form" />
                                            </div>
                                            <div className="flex gap-2">
                                                <select value={field.field_type} onChange={(e) => handleCreateFieldChange(index, 'field_type', e.target.value)} className="flex-1 px-3 py-2 border border-[#D6E4EA] rounded-md text-sm focus:ring-1 focus:ring-[#00ADEF]">
                                                    {FIELD_WIDGET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </select>
                                                <select value={field.maps_to} onChange={(e) => handleCreateFieldChange(index, 'maps_to', e.target.value)} className="flex-1 px-3 py-2 border border-[#D6E4EA] rounded-md text-sm focus:ring-1 focus:ring-[#00ADEF]" title="Link this question's answer to an applicant field">
                                                    {MAPPABLE_DB_FIELDS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                                </select>
                                            </div>
                                            {(field.field_type === 'select' || field.field_type === 'radio' || field.field_type === 'checkbox') && (
                                                <input type="text" placeholder="Options (comma-separated: Yes, No, Maybe)" value={field.options || ''} onChange={(e) => handleCreateFieldChange(index, 'options', e.target.value)} className="w-full px-3 py-2 border border-[#D6E4EA] rounded-md text-sm focus:ring-1 focus:ring-[#00ADEF]" />
                                            )}
                                            <div className="flex items-center justify-between gap-2">
                                                <label className="flex items-center gap-2 text-xs font-bold text-[#526274]">
                                                    <input type="checkbox" checked={field.required} onChange={(e) => handleCreateFieldChange(index, 'required', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#00ADEF] focus:ring-[#00ADEF]" />Required
                                                </label>
                                                <select value={field.width || 'auto'} onChange={(e) => handleCreateFieldChange(index, 'width', e.target.value)} className="px-2 py-1.5 border border-[#D6E4EA] rounded-md text-xs focus:ring-1 focus:ring-[#00ADEF]" title="How much of the row this question takes on the apply form">
                                                    {FIELD_WIDTHS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                    <datalist id="create-sections-list">
                                        {[...new Set(createFormFields.map(f => f.section).filter(Boolean))].map(s => <option key={s} value={s} />)}
                                    </datalist>
                                    <button type="button" onClick={addCreateField} className="w-full py-2 border border-dashed border-[#00ADEF] text-[#00ADEF] rounded-lg text-xs font-bold hover:bg-[#EAF8FC]">+ Add Field</button>
                                </div>
                            )}

                            <button type="submit" disabled={submitting} className="w-full py-3 bg-[#00ADEF] text-white rounded-xl font-bold transition hover:bg-[#006F9E] disabled:opacity-50 flex items-center justify-center gap-2 mt-4">
                                {submitting ? 'Publishing...' : 'Publish Announcement'}<Send size={16} />
                            </button>
                        </form>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2"><Megaphone size={20} className="text-[#E38524]" />Published</h2>
                        {loading ? (
                            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#00ADEF]" size={32} /></div>
                        ) : announcements.length > 0 ? (
                            announcements.map((ann) => (
                                <div key={ann.id} className="bg-white border border-[#D6E4EA] rounded-2xl p-5 shadow-xs flex flex-col transition hover:shadow-md break-words whitespace-normal overflow-hidden">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-base text-[#111827]">{ann.title}</h3>
                                        <div className="flex items-center gap-1">
                                            {ann.is_open_call && (
                                                <span className="text-[10px] font-bold text-[#006F9E] bg-[#EAF8FC] px-2 py-1 rounded-full border border-[#00ADEF]/20 mr-1">Open Call</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-[#526274] text-sm bg-[#F6FAFC] p-4 rounded-xl border border-[#D6E4EA] flex-grow" dangerouslySetInnerHTML={{ __html: formatAnnouncementContent(ann.content) }}></div>

                                    {ann.is_open_call && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <button onClick={() => fetchApplicationCount(ann.id)} className="flex items-center gap-1.5 text-xs font-bold text-[#006F9E] bg-[#EAF8FC] px-3 py-1.5 rounded-lg hover:bg-[#D6E4EA] transition border border-[#00ADEF]/20">
                                                <Users size={12} />
                                                {appCounts[ann.id] !== undefined ? <span>{appCounts[ann.id]} Applications</span> : <span>View Applications</span>}
                                            </button>
                                        </div>
                                    )}

                                    {ann.is_open_call && (
                                        <button onClick={() => handleBuildForm(ann)} className="mt-3 text-xs font-bold text-[#00ADEF] hover:underline self-start">
                                            {editingFormId === ann.id ? "Close Form Builder" : "Edit Application Form"}
                                        </button>
                                    )}

                                    {editingFormId === ann.id && (
                                        <div className="mt-4 p-4 bg-[#F6FAFC] border border-[#00ADEF]/30 rounded-xl space-y-3">
                                            <h4 className="text-sm font-extrabold text-[#111827] uppercase tracking-wider">Application Form</h4>
                                            {formFields.map((field, index) => (
                                                <div key={index} className="bg-white p-3 border border-[#D6E4EA] rounded-lg space-y-2">
                                                    <div className="flex gap-2">
                                                        <input type="text" placeholder="Question (e.g., What is your revenue?)" value={field.label} onChange={(e) => handleFieldChange(index, 'label', e.target.value)} className="flex-1 px-3 py-2 border border-[#D6E4EA] rounded-md text-sm focus:ring-1 focus:ring-[#00ADEF]" />
                                                        <button onClick={() => removeField(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-md"><X size={16} /></button>
                                                    </div>
                                                    <div>
                                                        <input type="text" list="edit-sections-list" placeholder="Page / section (e.g., Personal Information)" value={field.section || ''} onChange={(e) => handleFieldChange(index, 'section', e.target.value)} className="w-full px-3 py-2 border border-[#D6E4EA] rounded-md text-sm focus:ring-1 focus:ring-[#00ADEF]" title="Questions with the same page/section name appear together as one step of the apply form" />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <select value={field.field_type} onChange={(e) => handleFieldChange(index, 'field_type', e.target.value)} className="flex-1 px-3 py-2 border border-[#D6E4EA] rounded-md text-sm focus:ring-1 focus:ring-[#00ADEF]">
                                                            {FIELD_WIDGET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                        </select>
                                                        <select value={field.maps_to || ""} onChange={(e) => handleFieldChange(index, 'maps_to', e.target.value)} className="flex-1 px-3 py-2 border border-[#D6E4EA] rounded-md text-sm focus:ring-1 focus:ring-[#00ADEF]" title="Link this question's answer to an applicant field">
                                                            {MAPPABLE_DB_FIELDS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                                        </select>
                                                    </div>
                                                    {(field.field_type === 'select' || field.field_type === 'radio' || field.field_type === 'checkbox') && (
                                                        <input type="text" placeholder="Options (comma-separated: Yes, No, Maybe)" value={field.options || ''} onChange={(e) => handleFieldChange(index, 'options', e.target.value)} className="w-full px-3 py-2 border border-[#D6E4EA] rounded-md text-sm focus:ring-1 focus:ring-[#00ADEF]" />
                                                    )}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <label className="flex items-center gap-2 text-xs font-bold text-[#526274]">
                                                            <input type="checkbox" checked={field.required} onChange={(e) => handleFieldChange(index, 'required', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#00ADEF] focus:ring-[#00ADEF]" />Required
                                                        </label>
                                                        <select value={field.width || 'auto'} onChange={(e) => handleFieldChange(index, 'width', e.target.value)} className="px-2 py-1.5 border border-[#D6E4EA] rounded-md text-xs focus:ring-1 focus:ring-[#00ADEF]" title="How much of the row this question takes on the apply form">
                                                            {FIELD_WIDTHS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                            <datalist id="edit-sections-list">
                                                {[...new Set(formFields.map(f => f.section).filter(Boolean))].map(s => <option key={s} value={s} />)}
                                            </datalist>
                                            <div className="flex gap-2 pt-2">
                                                <button onClick={addField} className="flex-1 py-2 border border-dashed border-[#00ADEF] text-[#00ADEF] rounded-lg text-xs font-bold hover:bg-[#EAF8FC]">+ Add Field</button>
                                                <button onClick={() => handleSaveForm(ann.id)} className="flex-1 py-2 bg-[#E38524] text-white rounded-lg text-xs font-bold hover:bg-[#C97019]">Save Form</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-3 pt-3 border-t border-[#D6E4EA] flex items-center justify-between">
                                        <span className="text-xs text-[#526274] font-medium">{new Date(ann.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleEdit(ann)} className="p-1.5 rounded-lg text-[#526274] hover:bg-blue-50 hover:text-blue-600 transition" title="Edit"><Pencil size={14} /></button>
                                            <button onClick={() => handleDuplicate(ann.id)} className="p-1.5 rounded-lg text-[#526274] hover:bg-green-50 hover:text-green-600 transition" title="Duplicate"><Copy size={14} /></button>
                                            <button onClick={() => setDeleteConfirm({ open: true, id: ann.id, title: ann.title })} className="p-1.5 rounded-lg text-[#526274] hover:bg-red-50 hover:text-red-600 transition" title="Delete"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-white border border-dashed border-[#D6E4EA] rounded-2xl"><p className="text-[#526274] font-medium">No announcements yet.</p></div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editModal.open && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
                        <div className="sticky top-0 bg-white border-b border-[#D6E4EA] p-6 flex justify-between items-center z-10">
                            <h2 className="text-xl font-extrabold text-[#111827]">Edit Announcement</h2>
                            <button onClick={() => setEditModal({ open: false, announcement: null })} className="p-2 rounded-lg text-[#526274] hover:bg-gray-100 transition"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Title</label>
                                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required className="w-full px-4 py-3 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] focus:outline-none focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent font-medium text-[#111827]" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Application Deadline</label>
                                <input type="datetime-local" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} className="w-full px-4 py-3 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] focus:outline-none focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent font-medium text-[#111827]" />
                            </div>
                            <div className="flex items-center gap-3 py-2">
                                <input id="edit_is_open_call" type="checkbox" checked={editIsOpenCall} onChange={(e) => setEditIsOpenCall(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#00ADEF] focus:ring-[#00ADEF]" />
                                <label htmlFor="edit_is_open_call" className="text-sm font-bold text-[#526274]">Enable Application Form (Open Call)</label>
                            </div>
                            {editIsOpenCall && (
                                <div>
                                    <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Application Capacity</label>
                                    <input type="number" value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)} className="w-full px-4 py-3 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] focus:outline-none focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent font-medium text-[#111827]" placeholder="Leave blank for unlimited" />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Content (Rich Text)</label>
                                <div className="bg-white border border-[#D6E4EA] rounded-xl overflow-hidden">
                                    <ReactQuill theme="snow" value={editContent} onChange={setEditContent} className="h-48 mb-12" modules={{ toolbar: [['bold', 'italic', 'underline', 'strike', { 'color': [] }, { 'background': [] }], [{'list': 'ordered'}, {'list': 'bullet'}], ['link'], ['clean']] }} />
                                </div>
                            </div>
                            {editDocumentUrl && !editDocument && (
                                <div className="flex items-center gap-2 p-3 bg-[#EAF8FC] rounded-xl border border-[#00ADEF]/20">
                                    <FileUp size={16} className="text-[#00ADEF]" />
                                    <span className="text-sm font-medium text-[#006F9E]">Current: {editDocumentUrl.split('/').pop()}</span>
                                    <button type="button" onClick={() => setEditDocumentUrl(null)} className="ml-auto p-1 rounded text-red-500 hover:bg-red-50"><X size={14} /></button>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">{editDocumentUrl && !editDocument ? "Replace Document" : "Attach Document"}</label>
                                <div className="flex items-center gap-3">
                                    <label className="flex-1 cursor-pointer flex items-center gap-2 px-4 py-3 border border-dashed border-[#00ADEF] rounded-xl bg-[#EAF8FC] hover:bg-[#D6E4EA] transition">
                                        <FileUp size={18} className="text-[#00ADEF]" />
                                        <span className="text-sm font-bold text-[#006F9E]">{editDocument ? editDocument.name : "Choose a file..."}</span>
                                        <input type="file" className="hidden" onChange={(e) => handleFileChange(e.target.files[0], true)} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setEditModal({ open: false, announcement: null })} className="flex-1 py-3 border border-[#D6E4EA] text-[#526274] rounded-xl font-bold transition hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={updating} className="flex-1 py-3 bg-[#00ADEF] text-white rounded-xl font-bold transition hover:bg-[#006F9E] disabled:opacity-50 flex items-center justify-center gap-2">
                                    {updating ? (<><Loader2 size={16} className="animate-spin" />Updating...</>) : (<><Check size={16} />Update Announcement</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.open && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle size={24} className="text-red-600" /></div>
                            <div>
                                <h3 className="text-lg font-extrabold text-[#111827]">Delete Announcement</h3>
                                <p className="text-sm text-[#526274]">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-sm text-[#526274] mb-6">Are you sure you want to delete "<span className="font-bold text-[#111827]">{deleteConfirm.title}</span>"?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm({ open: false, id: null, title: "" })} className="flex-1 py-3 border border-[#D6E4EA] text-[#526274] rounded-xl font-bold transition hover:bg-gray-50">Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold transition hover:bg-red-700 flex items-center justify-center gap-2"><Trash2 size={16} />Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}