import React, { useState, useEffect } from "react";
import { Megaphone, Trash2, Loader2, Send, PlusCircle, FileUp, X, Pencil, Copy, Users, Check, Calendar, Tag, UserCheck } from "lucide-react";

import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

// Helper: Format content to professional HTML with proper spacing
const formatAnnouncementContent = (text) => {
    if (!text) return '';
    
    let plainText = text;
    if (/<[a-z][\s\S]*>/i.test(text)) {
        const temp = document.createElement('div');
        temp.innerHTML = text;
        plainText = temp.textContent || temp.innerText || '';
    }
    
    const sentences = plainText
        .split(/(?<=[.!?])\s+/)
        .filter(s => s.trim());
    
    if (sentences.length > 1) {
        return sentences
            .map(s => `<p style="margin: 0 0 12px 0; line-height: 1.7;">${s.trim()}</p>`)
            .join('');
    }
    
    return `<p style="margin: 0 0 12px 0; line-height: 1.7;">${plainText.trim()}</p>`;
};

// Reusable Form Fields Builder Component
const FormFieldsBuilderUI = ({ fields, onAddField, onRemoveField, onFieldChange, title = "Custom Form Questions Builder" }) => (
    <div className="p-4 bg-[#EAF8FC] border border-[#00ADEF]/30 rounded-xl space-y-3">
        <h4 className="text-xs font-extrabold text-[#006F9E] uppercase tracking-wider flex items-center justify-between">
            <span>{title}</span>
            <span className="text-[10px] text-[#526274] normal-case font-normal">Add custom questions for applicants</span>
        </h4>

        {fields.map((field, index) => (
            <div key={index} className="bg-white p-3 border border-[#D6E4EA] rounded-lg space-y-2">
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <input
                        type="text"
                        placeholder="Question Label (e.g., Founder Age, Startup Pitch, Revenue Model)"
                        value={field.label}
                        onChange={(e) => onFieldChange(index, 'label', e.target.value)}
                        className="flex-1 w-full px-3 py-2 border border-[#D6E4EA] rounded-md text-sm focus:ring-1 focus:ring-[#00ADEF]"
                    />
                    <div className="flex gap-2 w-full sm:w-auto items-center">
                        <select
                            value={field.field_type}
                            onChange={(e) => onFieldChange(index, 'field_type', e.target.value)}
                            className="flex-1 sm:flex-initial px-3 py-2 border border-[#D6E4EA] rounded-md text-sm focus:ring-1 focus:ring-[#00ADEF]"
                        >
                            <option value="text">Short Text (e.g. Name, Lname)</option>
                            <option value="textarea">Long Text / Paragraph</option>
                            <option value="number">Number / Age</option>
                            <option value="date">Date Picker</option>
                            <option value="select">Dropdown Menu</option>
                            <option value="radio">Radio Buttons (Single Choice)</option>
                            <option value="checkbox">Checkbox (Toggle or Multi-Choice)</option>
                            <option value="file">File Upload Attachment</option>
                        </select>
                        <button type="button" onClick={() => onRemoveField(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-md transition" title="Remove question">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {['select', 'radio', 'checkbox'].includes(field.field_type) && (
                    <input
                        type="text"
                        placeholder="Options (comma-separated: Option 1, Option 2, Option 3)"
                        value={field.options || ''}
                        onChange={(e) => onFieldChange(index, 'options', e.target.value)}
                        className="w-full px-3 py-2 border border-[#D6E4EA] rounded-md text-sm focus:ring-1 focus:ring-[#00ADEF]"
                    />
                )}

                <label className="flex items-center gap-2 text-xs font-bold text-[#526274] cursor-pointer">
                    <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => onFieldChange(index, 'required', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-[#00ADEF] focus:ring-[#00ADEF]"
                    />
                    Required question
                </label>
            </div>
        ))}

        <button type="button" onClick={onAddField} className="w-full py-2 border border-dashed border-[#00ADEF] text-[#00ADEF] bg-white rounded-lg text-xs font-bold hover:bg-[#D6E4EA]/40 transition flex items-center justify-center gap-1">
            + Add Custom Question Field
        </button>
    </div>
);

export default function Announcements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [deadline, setDeadline] = useState("");
    const [category, setCategory] = useState("Call for Applications");
    const [applicantType, setApplicantType] = useState("both");
    const [document, setDocument] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form builder state for NEW announcement
    const [newFormFields, setNewFormFields] = useState([
        { label: '', field_type: 'text', options: '', required: false }
    ]);

    // Form builder state for published announcements list
    const [editingFormId, setEditingFormId] = useState(null);
    const [formFields, setFormFields] = useState([]);

    // Form state
    const [isOpenCall, setIsOpenCall] = useState(true);
    const [capacity, setCapacity] = useState("");

    // Edit Modal state
    const [editModal, setEditModal] = useState({ open: false, announcement: null });
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editDeadline, setEditDeadline] = useState("");
    const [editCategory, setEditCategory] = useState("Call for Applications");
    const [editApplicantType, setEditApplicantType] = useState("both");
    const [editDocument, setEditDocument] = useState(null);
    const [editDocumentUrl, setEditDocumentUrl] = useState(null);
    const [editIsOpenCall, setEditIsOpenCall] = useState(false);
    const [editCapacity, setEditCapacity] = useState("");
    const [editFormFields, setEditFormFields] = useState([]);
    const [updating, setUpdating] = useState(false);

    // Delete Confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, title: "" });

    // Application Count state
    const [appCounts, setAppCounts] = useState({});

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
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('category', category);
            formData.append('applicant_type', applicantType);
            formData.append('is_open_call', isOpenCall);

            if (capacity) formData.append('capacity', capacity);
            if (deadline) formData.append('deadline', deadline);
            if (document) formData.append('document', document);

            const response = await fetch('/api/admin/announcements', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (!response.ok) {
                let message = "Failed to publish";
                try {
                    const data = await response.json();
                    if (data && data.message) message = data.message;
                } catch (e) { /* keep default message */ }
                throw new Error(message);
            }

            const newAnn = await response.json();

            // Save Form Fields if Open Call
            if (isOpenCall && newAnn && newAnn.id && newFormFields && newFormFields.length > 0) {
                const validFields = newFormFields.filter(f => f.label && f.label.trim());
                if (validFields.length > 0) {
                    await fetch(`/api/admin/announcements/${newAnn.id}/form-fields`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ fields: validFields })
                    });
                }
            }

            // Reset form
            setTitle("");
            setContent("");
            setDeadline("");
            setCategory("Call for Applications");
            setApplicantType("both");
            setDocument(null);
            setIsOpenCall(true);
            setCapacity("");
            setNewFormFields([{ label: '', field_type: 'text', options: '', required: false }]);
            fetchAnnouncements();
        } catch (error) {
            console.error("Error creating announcement:", error);
            alert("Failed to publish announcement: " + error.message);
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
            setDeleteConfirm({ open: false, id: null, title: "" });
            fetchAnnouncements();
        } catch (error) {
            console.error("Error deleting announcement:", error);
        }
    };

    // Open Edit Modal
    const handleEdit = async (ann) => {
        setEditModal({ open: true, announcement: ann });
        setEditTitle(ann.title);
        setEditContent(ann.content);
        setEditDeadline(ann.deadline ? new Date(ann.deadline).toISOString().slice(0, 16) : "");
        setEditCategory(ann.category || "Call for Applications");
        setEditApplicantType(ann.applicant_type || "both");
        setEditDocumentUrl(ann.document_url);
        setEditDocument(null);
        setEditIsOpenCall(ann.is_open_call);
        setEditCapacity(ann.capacity || "");

        if (ann.is_open_call) {
            try {
                const response = await fetch(`/api/admin/announcements/${ann.id}/form-fields`, { credentials: 'include' });
                const data = await response.json();
                const formatted = Array.isArray(data) && data.length > 0 ? data.map(f => ({
                    ...f,
                    options: Array.isArray(f.options) ? f.options.join(', ') : (f.options || '')
                })) : [{ label: '', field_type: 'text', options: '', required: false }];
                setEditFormFields(formatted);
            } catch (e) {
                setEditFormFields([{ label: '', field_type: 'text', options: '', required: false }]);
            }
        } else {
            setEditFormFields([{ label: '', field_type: 'text', options: '', required: false }]);
        }
    };

    // Update Announcement
    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editTitle || !editContent) return;

        setUpdating(true);
        try {
            const formData = new FormData();
            formData.append('title', editTitle);
            formData.append('content', editContent);
            formData.append('category', editCategory);
            formData.append('applicant_type', editApplicantType);
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
                method: 'PUT',
                credentials: 'include',
                body: formData
            });

            if (!response.ok) throw new Error("Failed to update");

            // Save form fields if Open Call
            if (editIsOpenCall && editFormFields && editFormFields.length > 0) {
                const validFields = editFormFields.filter(f => f.label && f.label.trim());
                await fetch(`/api/admin/announcements/${editModal.announcement.id}/form-fields`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ fields: validFields })
                });
            }

            setEditModal({ open: false, announcement: null });
            fetchAnnouncements();
        } catch (error) {
            console.error("Error updating announcement:", error);
            alert("Failed to update announcement.");
        } finally {
            setUpdating(false);
        }
    };

    // Duplicate Announcement
    const handleDuplicate = async (id) => {
        try {
            const response = await fetch(`/api/admin/announcements/${id}/duplicate`, {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                fetchAnnouncements();
            }
        } catch (error) {
            console.error("Error duplicating announcement:", error);
        }
    };

    // Get Application Count
    const fetchApplicationCount = async (annId) => {
        try {
            const response = await fetch(`/api/admin/announcements/${annId}/applications/count`, {
                credentials: 'include'
            });
            const data = await response.json();
            setAppCounts(prev => ({ ...prev, [annId]: data.count }));
        } catch (error) {
            console.error("Error fetching application count:", error);
        }
    };

    const handleBuildForm = async (ann) => {
        if (editingFormId === ann.id) {
            setEditingFormId(null);
            return;
        }
        setEditingFormId(ann.id);
        try {
            const response = await fetch(`/api/admin/announcements/${ann.id}/form-fields`, { credentials: 'include' });
            const data = await response.json();
            const formatted = Array.isArray(data) && data.length > 0 ? data.map(f => ({
                ...f,
                options: Array.isArray(f.options) ? f.options.join(', ') : (f.options || '')
            })) : [{ label: '', field_type: 'text', options: '', required: false }];
            setFormFields(formatted);
        } catch (error) {
            console.error("Error fetching form fields:", error);
            setFormFields([{ label: '', field_type: 'text', options: '', required: false }]);
        }
    };

    const handleSaveForm = async (annId) => {
        try {
            const response = await fetch(`/api/admin/announcements/${annId}/form-fields`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ fields: formFields })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to save form");
            alert("Custom application form saved successfully!");
            setEditingFormId(null);
        } catch (error) {
            console.error("Error saving form:", error);
            alert("Failed to save form: " + error.message);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#F6FAFC] h-screen font-sans text-[#111827]">
            <div className="p-6 lg:p-10 max-w-[1920px] mx-auto">

                {/* Header Section */}
                <div className="mb-10">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-2">
                        DxValley Incubation Hub
                    </span>
                    <h1 className="text-4xl font-extrabold tracking-[-.04em] text-cyan-dark sm:text-5xl">
                        Announcements & Calls CMS
                    </h1>
                    <p className="mt-3 text-base text-[#526274] font-medium">
                        Publish calls for applications (projects/ideas/events/trainings), configure custom application forms, set deadlines, and manage applicant requirements.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Create Form */}
                    <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs">
                        <h2 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
                            <PlusCircle size={20} className="text-[#00ADEF]" />
                            New Announcement / Call
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Title Input */}
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Announcement / Call Title *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] focus:outline-none focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent font-medium text-[#111827]"
                                    placeholder="e.g., Call for Innovation Ideas - Batch 04 Cohort"
                                />
                            </div>

                            {/* Category Selector */}
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Category / Type</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-3 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] focus:outline-none focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent font-medium text-[#111827]"
                                >
                                    <option value="Call for Applications">Call for Applications</option>
                                    <option value="Call for Projects / Ideas">Call for Projects / Ideas</option>
                                    <option value="Event / Hackathon">Event / Hackathon</option>
                                    <option value="Training / Bootcamp">Training / Bootcamp</option>
                                    <option value="General News">General News & Updates</option>
                                </select>
                            </div>

                            {/* Open Call Checkbox */}
                            <div className="flex items-center gap-3 p-3 bg-[#EAF8FC] border border-[#00ADEF]/20 rounded-xl">
                                <input
                                    id="is_open_call"
                                    type="checkbox"
                                    checked={isOpenCall}
                                    onChange={(e) => setIsOpenCall(e.target.checked)}
                                    className="h-5 w-5 rounded border-gray-300 text-[#00ADEF] focus:ring-[#00ADEF]"
                                />
                                <label htmlFor="is_open_call" className="text-sm font-bold text-[#006F9E] cursor-pointer">
                                    Enable Application Form (Open Call)
                                </label>
                            </div>

                            {/* Open Call Configuration Options */}
                            {isOpenCall && (
                                <div className="p-4 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] space-y-4">
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#526274]">Application Settings</h3>

                                    {/* Applicant Mode */}
                                    <div>
                                        <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Accepted Applicant Types</label>
                                        <select
                                            value={applicantType}
                                            onChange={(e) => setApplicantType(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-[#D6E4EA] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00ADEF] font-medium text-[#111827] text-sm"
                                        >
                                            <option value="both">Both Individuals & Teams</option>
                                            <option value="individual">Individuals Only</option>
                                            <option value="team">Teams / Startup Groups Only</option>
                                        </select>
                                    </div>

                                    {/* Deadline Input */}
                                    <div>
                                        <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Application Deadline</label>
                                        <input
                                            type="datetime-local"
                                            value={deadline}
                                            onChange={(e) => setDeadline(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-[#D6E4EA] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00ADEF] font-medium text-[#111827] text-sm"
                                        />
                                    </div>

                                    {/* Capacity Input */}
                                    <div>
                                        <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Maximum Capacity (Optional limit)</label>
                                        <input
                                            type="number"
                                            value={capacity}
                                            onChange={(e) => setCapacity(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-[#D6E4EA] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00ADEF] font-medium text-[#111827] text-sm"
                                            placeholder="e.g. 50 (Leave blank for unlimited)"
                                        />
                                    </div>

                                    {/* Custom Application Form Questions Builder right inside creation form! */}
                                    <FormFieldsBuilderUI
                                        fields={newFormFields}
                                        onAddField={() => setNewFormFields([...newFormFields, { label: '', field_type: 'text', options: '', required: false }])}
                                        onRemoveField={(idx) => {
                                            const updated = [...newFormFields];
                                            updated.splice(idx, 1);
                                            setNewFormFields(updated);
                                        }}
                                        onFieldChange={(idx, key, val) => {
                                            const updated = [...newFormFields];
                                            updated[idx][key] = val;
                                            setNewFormFields(updated);
                                        }}
                                        title="Configure Application Questions"
                                    />
                                </div>
                            )}

                            {/* Rich Text Editor */}
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Announcement Description & Details *</label>
                                <div className="bg-white border border-[#D6E4EA] rounded-xl overflow-hidden">
                                    <ReactQuill
                                        theme="snow"
                                        value={content}
                                        onChange={setContent}
                                        className="h-48 mb-12"
                                        modules={{
                                            toolbar: [
                                                [{ 'header': [1, 2, 3, false] }],
                                                ['bold', 'italic', 'underline', 'strike', { 'color': [] }, { 'background': [] }],
                                                [{'list': 'ordered'}, {'list': 'bullet'}],
                                                ['link'],
                                                ['clean']
                                            ]
                                        }}
                                    />
                                </div>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Attach Document / Flyer (PDF, DOC, Images)</label>
                                <div className="flex items-center gap-3">
                                    <label className="flex-1 cursor-pointer flex items-center gap-2 px-4 py-3 border border-dashed border-[#00ADEF] rounded-xl bg-[#EAF8FC] hover:bg-[#D6E4EA] transition">
                                        <FileUp size={18} className="text-[#00ADEF]" />
                                        <span className="text-sm font-bold text-[#006F9E]">
                                            {document ? document.name : "Choose file..."}
                                        </span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => setDocument(e.target.files[0])}
                                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                        />
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-[#00ADEF] text-white rounded-xl font-bold transition hover:bg-[#006F9E] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                            >
                                {submitting ? 'Publishing Announcement...' : 'Publish Announcement'}
                                <Send size={16} />
                            </button>
                        </form>
                    </div>

                    {/* List of Announcements */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
                            <Megaphone size={20} className="text-[#E38524]" />
                            Published Announcements ({announcements.length})
                        </h2>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-[#00ADEF]" size={32} />
                            </div>
                        ) : announcements.length > 0 ? (
                            announcements.map((ann) => (
                                <div key={ann.id} className="bg-white border border-[#D6E4EA] rounded-2xl p-5 shadow-xs flex flex-col transition hover:shadow-md">
                                    
                                    {/* Top Header & Badges */}
                                    <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                                        <h3 className="font-bold text-base text-[#111827] flex-1">{ann.title}</h3>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] bg-[#EAF8FC] px-2.5 py-1 rounded-full border border-[#00ADEF]/30 flex items-center gap-1">
                                                <Tag size={10} />
                                                {ann.category || 'Announcement'}
                                            </span>

                                            {ann.is_open_call && (
                                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                                                    Open Call
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Meta Tags (Applicant Type & Deadline) */}
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#526274] font-medium mb-3">
                                        {ann.is_open_call && (
                                            <span className="flex items-center gap-1 text-[#006F9E]">
                                                <UserCheck size={13} />
                                                {ann.applicant_type === 'team' ? 'Teams Only' : ann.applicant_type === 'individual' ? 'Individuals Only' : 'Individuals & Teams'}
                                            </span>
                                        )}
                                        {ann.deadline && (
                                            <span className="flex items-center gap-1 text-orange-600 font-bold">
                                                <Calendar size={13} />
                                                Deadline: {new Date(ann.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>

                                    {/* Announcement Body Content */}
                                    <div
                                        className="text-[#526274] text-sm bg-[#F6FAFC] p-4 rounded-xl border border-[#D6E4EA] flex-grow"
                                        dangerouslySetInnerHTML={{ __html: formatAnnouncementContent(ann.content) }}
                                    ></div>

                                    {/* Application Count & Form Builder Controls */}
                                    {ann.is_open_call && (
                                        <div className="mt-4 pt-3 border-t border-[#D6E4EA]/60 flex flex-wrap items-center justify-between gap-2">
                                            <button
                                                onClick={() => fetchApplicationCount(ann.id)}
                                                className="flex items-center gap-1.5 text-xs font-bold text-[#006F9E] bg-[#EAF8FC] px-3 py-1.5 rounded-lg hover:bg-[#D6E4EA] transition border border-[#00ADEF]/20"
                                            >
                                                <Users size={14} />
                                                {appCounts[ann.id] !== undefined ? (
                                                    <span>{appCounts[ann.id]} Applications Submitted</span>
                                                ) : (
                                                    <span>Check Applications</span>
                                                )}
                                            </button>

                                            <button
                                                onClick={() => handleBuildForm(ann)}
                                                className="text-xs font-extrabold text-white bg-[#00ADEF] hover:bg-[#006F9E] px-3 py-1.5 rounded-lg transition shadow-xs"
                                            >
                                                {editingFormId === ann.id ? "Close Form Builder" : "Customize Form Fields"}
                                            </button>
                                        </div>
                                    )}

                                    {/* Dynamic Form Builder UI */}
                                    {editingFormId === ann.id && (
                                        <div className="mt-4 space-y-3">
                                            <FormFieldsBuilderUI
                                                fields={formFields}
                                                onAddField={() => setFormFields([...formFields, { label: '', field_type: 'text', options: '', required: false }])}
                                                onRemoveField={(idx) => {
                                                    const updated = [...formFields];
                                                    updated.splice(idx, 1);
                                                    setFormFields(updated);
                                                }}
                                                onFieldChange={(idx, key, val) => {
                                                    const updated = [...formFields];
                                                    updated[idx][key] = val;
                                                    setFormFields(updated);
                                                }}
                                                title="Custom Form Questions Builder"
                                            />
                                            <button onClick={() => handleSaveForm(ann.id)} className="w-full py-2.5 bg-[#E38524] text-white rounded-xl text-xs font-bold hover:bg-[#C97019] transition">
                                                Save Custom Form Questions
                                            </button>
                                        </div>
                                    )}

                                    {/* Action Buttons Footer */}
                                    <div className="mt-4 pt-3 border-t border-[#D6E4EA] flex items-center justify-between">
                                        <span className="text-xs text-[#526274] font-medium">
                                            Published: {new Date(ann.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleEdit(ann)}
                                                className="p-1.5 rounded-lg text-[#526274] hover:bg-blue-50 hover:text-blue-600 transition"
                                                title="Edit Announcement"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDuplicate(ann.id)}
                                                className="p-1.5 rounded-lg text-[#526274] hover:bg-green-50 hover:text-green-600 transition"
                                                title="Duplicate"
                                            >
                                                <Copy size={15} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm({ open: true, id: ann.id, title: ann.title })}
                                                className="p-1.5 rounded-lg text-[#526274] hover:bg-red-50 hover:text-red-600 transition"
                                                title="Delete"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-white border border-dashed border-[#D6E4EA] rounded-2xl">
                                <p className="text-[#526274] font-medium">No announcements published yet.</p>
                            </div>
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
                            <button
                                onClick={() => setEditModal({ open: false, announcement: null })}
                                className="p-2 rounded-lg text-[#526274] hover:bg-gray-100 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-6 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Title *</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] focus:outline-none focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent font-medium text-[#111827]"
                                />
                            </div>

                            {/* Category Selector */}
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Category</label>
                                <select
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                    className="w-full px-4 py-3 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] focus:outline-none focus:ring-2 focus:ring-[#00ADEF] font-medium text-[#111827]"
                                >
                                    <option value="Call for Applications">Call for Applications</option>
                                    <option value="Call for Projects / Ideas">Call for Projects / Ideas</option>
                                    <option value="Event / Hackathon">Event / Hackathon</option>
                                    <option value="Training / Bootcamp">Training / Bootcamp</option>
                                    <option value="General News">General News & Updates</option>
                                </select>
                            </div>

                            {/* Open Call Checkbox */}
                            <div className="flex items-center gap-3 p-3 bg-[#EAF8FC] border border-[#00ADEF]/20 rounded-xl">
                                <input
                                    id="edit_is_open_call"
                                    type="checkbox"
                                    checked={editIsOpenCall}
                                    onChange={(e) => setEditIsOpenCall(e.target.checked)}
                                    className="h-5 w-5 rounded border-gray-300 text-[#00ADEF] focus:ring-[#00ADEF]"
                                />
                                <label htmlFor="edit_is_open_call" className="text-sm font-bold text-[#006F9E] cursor-pointer">
                                    Enable Application Form (Open Call)
                                </label>
                            </div>

                            {/* Open Call Config */}
                            {editIsOpenCall && (
                                <div className="p-4 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] space-y-4">
                                    {/* Applicant Mode */}
                                    <div>
                                        <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Accepted Applicant Types</label>
                                        <select
                                            value={editApplicantType}
                                            onChange={(e) => setEditApplicantType(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-[#D6E4EA] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00ADEF] font-medium text-[#111827] text-sm"
                                        >
                                            <option value="both">Both Individuals & Teams</option>
                                            <option value="individual">Individuals Only</option>
                                            <option value="team">Teams / Startup Groups Only</option>
                                        </select>
                                    </div>

                                    {/* Deadline */}
                                    <div>
                                        <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Application Deadline</label>
                                        <input
                                            type="datetime-local"
                                            value={editDeadline}
                                            onChange={(e) => setEditDeadline(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-[#D6E4EA] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00ADEF] font-medium text-[#111827] text-sm"
                                        />
                                    </div>

                                    {/* Capacity */}
                                    <div>
                                        <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Application Capacity Limit</label>
                                        <input
                                            type="number"
                                            value={editCapacity}
                                            onChange={(e) => setEditCapacity(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-[#D6E4EA] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00ADEF] font-medium text-[#111827] text-sm"
                                            placeholder="Leave blank for unlimited"
                                        />
                                    </div>

                                    {/* Form Builder in Edit Modal */}
                                    <FormFieldsBuilderUI
                                        fields={editFormFields}
                                        onAddField={() => setEditFormFields([...editFormFields, { label: '', field_type: 'text', options: '', required: false }])}
                                        onRemoveField={(idx) => {
                                            const updated = [...editFormFields];
                                            updated.splice(idx, 1);
                                            setEditFormFields(updated);
                                        }}
                                        onFieldChange={(idx, key, val) => {
                                            const updated = [...editFormFields];
                                            updated[idx][key] = val;
                                            setEditFormFields(updated);
                                        }}
                                        title="Configure Custom Form Questions"
                                    />
                                </div>
                            )}

                            {/* Content */}
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Content *</label>
                                <div className="bg-white border border-[#D6E4EA] rounded-xl overflow-hidden">
                                    <ReactQuill
                                        theme="snow"
                                        value={editContent}
                                        onChange={setEditContent}
                                        className="h-48 mb-12"
                                        modules={{
                                            toolbar: [
                                                [{ 'header': [1, 2, 3, false] }],
                                                ['bold', 'italic', 'underline', 'strike', { 'color': [] }, { 'background': [] }],
                                                [{'list': 'ordered'}, {'list': 'bullet'}],
                                                ['link'],
                                                ['clean']
                                            ]
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Current Document */}
                            {editDocumentUrl && !editDocument && (
                                <div className="flex items-center justify-between p-3 bg-[#EAF8FC] rounded-xl border border-[#00ADEF]/20">
                                    <div className="flex items-center gap-2">
                                        <FileUp size={16} className="text-[#00ADEF]" />
                                        <span className="text-sm font-medium text-[#006F9E]">Current Attachment: {editDocumentUrl.split('/').pop()}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditDocumentUrl(null)}
                                        className="text-xs font-bold text-red-600 hover:underline"
                                    >
                                        Remove Attachment
                                    </button>
                                </div>
                            )}

                            {/* New Document Upload */}
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Replace Attachment (Optional)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setEditDocument(e.target.files[0])}
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                    className="w-full text-sm text-[#526274] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#EAF8FC] file:text-[#006F9E] file:font-bold hover:file:bg-[#D6E4EA]"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-[#D6E4EA]">
                                <button
                                    type="button"
                                    onClick={() => setEditModal({ open: false, announcement: null })}
                                    className="flex-1 py-3 border border-[#D6E4EA] text-[#526274] rounded-xl font-bold hover:bg-[#F6FAFC]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="flex-1 py-3 bg-[#00ADEF] text-white rounded-xl font-bold hover:bg-[#006F9E] transition disabled:opacity-50"
                                >
                                    {updating ? "Saving Changes..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.open && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="p-3 bg-red-50 rounded-xl">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-lg font-extrabold text-[#111827]">Delete Announcement</h3>
                        </div>
                        <p className="text-sm text-[#526274]">
                            Are you sure you want to delete <strong className="text-[#111827]">"{deleteConfirm.title}"</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setDeleteConfirm({ open: false, id: null, title: "" })}
                                className="flex-1 py-2.5 border border-[#D6E4EA] text-[#526274] rounded-xl font-bold hover:bg-[#F6FAFC]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm.id)}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
