import React, { useState, useEffect } from "react";
import { Megaphone, Trash2, Loader2, Send, PlusCircle, FileUp, X } from "lucide-react";



import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export default function Announcements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [deadline, setDeadline] = useState("");
    const [document, setDocument] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [editingFormId, setEditingFormId] = useState(null); // Tracks which announcement's form we are editing
    const [formFields, setFormFields] = useState([]); // Stores the custom fields

    // ADD THESE NEW ONES RIGHT HERE:
    const [isOpenCall, setIsOpenCall] = useState(false);
    const [capacity, setCapacity] = useState("");


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
            // 1. Create the FormData object first!
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);

            // 2. ADD THE NEW LINES HERE!
            formData.append('is_open_call', isOpenCall);
            if (capacity) formData.append('capacity', capacity);

            if (deadline) formData.append('deadline', deadline);
            if (document) formData.append('document', document);

            // 3. Send the request
            const response = await fetch('/api/admin/announcements', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (!response.ok) throw new Error("Failed to publish");

            // 4. Reset form
            setTitle("");
            setContent("");
            setDeadline("");
            setDocument(null);
            setIsOpenCall(false); // Reset checkbox
            setCapacity("");     // Reset capacity
            fetchAnnouncements();
        } catch (error) {
            console.error("Error creating announcement:", error);
            alert("Failed to publish announcement.");
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


    const handleBuildForm = async (ann) => {
        if (editingFormId === ann.id) {
            setEditingFormId(null); // Close if already open
            return;
        }
        setEditingFormId(ann.id);
        try {
            const response = await fetch(`/api/admin/announcements/${ann.id}/form-fields`, { credentials: 'include' });
            const data = await response.json();
            setFormFields(Array.isArray(data) && data.length > 0 ? data : [{ label: '', field_type: 'text', options: '', required: false }]);
        } catch (error) {
            console.error("Error fetching form fields:", error);
            setFormFields([{ label: '', field_type: 'text', options: '', required: false }]);
        }
    };

    const addField = () => {
        setFormFields([...formFields, { label: '', field_type: 'text', options: '', required: false }]);
    };

    const removeField = (index) => {
        const updated = [...formFields];
        updated.splice(index, 1);
        setFormFields(updated);
    };

    const handleFieldChange = (index, key, value) => {
        const updated = [...formFields];
        updated[index][key] = value;
        setFormFields(updated);
    };

    const handleSaveForm = async (annId) => {
        try {
            const response = await fetch(`/api/admin/announcements/${annId}/form-fields`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ fields: formFields })
            });
            if (!response.ok) throw new Error("Failed to save form");
            alert("Form saved successfully!");
            setEditingFormId(null);
        } catch (error) {
            console.error("Error saving form:", error);
            alert("Failed to save form.");
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
                        Publish news, set deadlines for open calls, and attach documents.
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

                            {/* Title Input */}
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

                            {/* Deadline Input */}
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Application Deadline (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full px-4 py-3 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] focus:outline-none focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent font-medium text-[#111827]"
                                />
                            </div>



                            {/* Open Call Checkbox */}
                            <div className="flex items-center gap-3 py-2">
                                <input
                                    id="is_open_call"
                                    type="checkbox"
                                    checked={isOpenCall}
                                    onChange={(e) => setIsOpenCall(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-[#00ADEF] focus:ring-[#00ADEF]"
                                />
                                <label htmlFor="is_open_call" className="text-sm font-bold text-[#526274]">
                                    Enable Application Form (Open Call)
                                </label>
                            </div>

                            {/* Capacity Input (Only shows if Open Call is checked) */}
                            {isOpenCall && (
                                <div>
                                    <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Application Capacity (Optional)</label>
                                    <input
                                        type="number"
                                        value={capacity}
                                        onChange={(e) => setCapacity(e.target.value)}
                                        className="w-full px-4 py-3 border border-[#D6E4EA] rounded-xl bg-[#F6FAFC] focus:outline-none focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent font-medium text-[#111827]"
                                        placeholder="e.g., 50 (Leave blank for unlimited)"
                                    />
                                </div>
                            )}

                            {/* Rich Text Editor */}
                            <div>
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Content (Rich Text)</label>
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
                                <label className="block text-xs font-bold text-[#526274] mb-2 uppercase tracking-wider">Attach Document (PDF, DOC, IMG)</label>
                                <div className="flex items-center gap-3">
                                    <label className="flex-1 cursor-pointer flex items-center gap-2 px-4 py-3 border border-dashed border-[#00ADEF] rounded-xl bg-[#EAF8FC] hover:bg-[#D6E4EA] transition">
                                        <FileUp size={18} className="text-[#00ADEF]" />
                                        <span className="text-sm font-bold text-[#006F9E]">
                      {document ? document.name : "Choose a file..."}
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

                                    <div
                                        className="text-[#526274] text-sm bg-[#F6FAFC] p-4 rounded-xl border border-[#D6E4EA] flex-grow italic"
                                        dangerouslySetInnerHTML={{ __html: ann.content }}
                                    ></div>

                                    {/* Open Call Form Builder Button */}
                                    {ann.is_open_call && (
                                        <button
                                            onClick={() => handleBuildForm(ann)}
                                            className="mt-3 text-xs font-bold text-[#00ADEF] hover:underline self-start"
                                        >
                                            {editingFormId === ann.id ? "Close Form Builder" : "Build Application Form"}
                                        </button>
                                    )}

                                    {/* Dynamic Form Builder UI */}
                                    {editingFormId === ann.id && (
                                        <div className="mt-4 p-4 bg-[#F6FAFC] border border-[#00ADEF]/30 rounded-xl space-y-3">
                                            <h4 className="text-sm font-extrabold text-[#111827] uppercase tracking-wider">Custom Application Form</h4>

                                            {formFields.map((field, index) => (
                                                <div key={index} className="bg-white p-3 border border-[#D6E4EA] rounded-lg space-y-2">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Question (e.g., What is your revenue?)"
                                                            value={field.label}
                                                            onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                                                            className="flex-1 px-3 py-2 border border-[#D6E4EA] rounded-md text-sm focus:ring-1 focus:ring-[#00ADEF]"
                                                        />
                                                        <select
                                                            value={field.field_type}
                                                            onChange={(e) => handleFieldChange(index, 'field_type', e.target.value)}
                                                            className="px-3 py-2 border border-[#D6E4EA] rounded-md text-sm focus:ring-1 focus:ring-[#00ADEF]"
                                                        >
                                                            <option value="text">Short Text</option>
                                                            <option value="textarea">Long Text</option>
                                                            <option value="select">Dropdown</option>
                                                            <option value="checkbox">Checkbox</option>
                                                        </select>
                                                        <button onClick={() => removeField(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-md">
                                                            <X size={16} />
                                                        </button>
                                                    </div>

                                                    {field.field_type === 'select' && (
                                                        <input
                                                            type="text"
                                                            placeholder="Options (comma-separated: Yes, No, Maybe)"
                                                            value={field.options}
                                                            onChange={(e) => handleFieldChange(index, 'options', e.target.value)}
                                                            className="w-full px-3 py-2 border border-[#D6E4EA] rounded-md text-sm focus:ring-1 focus:ring-[#00ADEF]"
                                                        />
                                                    )}

                                                    <label className="flex items-center gap-2 text-xs font-bold text-[#526274]">
                                                        <input
                                                            type="checkbox"
                                                            checked={field.required}
                                                            onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                                                            className="h-4 w-4 rounded border-gray-300 text-[#00ADEF] focus:ring-[#00ADEF]"
                                                        />
                                                        Required
                                                    </label>
                                                </div>
                                            ))}

                                            <div className="flex gap-2 pt-2">
                                                <button onClick={addField} className="flex-1 py-2 border border-dashed border-[#00ADEF] text-[#00ADEF] rounded-lg text-xs font-bold hover:bg-[#EAF8FC]">
                                                    + Add Field
                                                </button>
                                                <button onClick={() => handleSaveForm(ann.id)} className="flex-1 py-2 bg-[#E38524] text-white rounded-lg text-xs font-bold hover:bg-[#C97019]">
                                                    Save Form
                                                </button>
                                            </div>
                                        </div>
                                    )}

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