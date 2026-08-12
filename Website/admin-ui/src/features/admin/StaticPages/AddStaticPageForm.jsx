import React, { useState } from "react";
import { Type, Link2, FileText, Check } from "lucide-react";

const AddStaticPageForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    slug: initialData?.slug || "",
    title: initialData?.title || "",
    body: initialData?.body || "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "slug" ? value.toLowerCase().replace(/[^a-z0-9-]/g, "-") : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.body.trim()) newErrors.body = "Body is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) onSubmit(formData);
  };

  const labelClasses = "text-[11px] font-extrabold uppercase tracking-wider text-[#526274] block mb-2";
  const inputWrapClasses =
    "flex items-center gap-3 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl px-4 py-2.5 focus-within:border-[#00ADEF] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00ADEF]/20 transition-all";
  const inputClasses = "w-full bg-transparent text-sm font-medium text-[#111827] outline-none placeholder:text-slate-400 disabled:opacity-60";

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div>
        <label className={labelClasses}>Title</label>
        <div className={inputWrapClasses}>
          <Type size={16} className="text-[#00ADEF] shrink-0" />
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Frequently Asked Questions"
            className={inputClasses}
            disabled={!!initialData}
          />
        </div>
        {errors.title && <p className="text-rose-600 text-xs font-bold mt-1.5">{errors.title}</p>}
      </div>

      <div>
        <label className={labelClasses}>Slug (URL path)</label>
        <div className={inputWrapClasses}>
          <Link2 size={16} className="text-[#00ADEF] shrink-0" />
          <input
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            placeholder="faq"
            className={inputClasses}
            disabled={!!initialData}
          />
        </div>
        {formData.slug && (
          <p className="text-xs text-[#526274] mt-1.5 font-mono">/v1/pages/{formData.slug}</p>
        )}
        {errors.slug && <p className="text-rose-600 text-xs font-bold mt-1.5">{errors.slug}</p>}
      </div>

      <div>
        <label className={labelClasses}>Body</label>
        <div className="flex items-start gap-3 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl px-4 py-3 focus-within:border-[#00ADEF] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00ADEF]/20 transition-all">
          <FileText size={16} className="text-[#00ADEF] shrink-0 mt-1" />
          <textarea
            name="body"
            value={formData.body}
            onChange={handleChange}
            placeholder={`Optional intro text here.\n\n## Section One\nContent for this section...\n\n## Section Two\nMore content here...`}
            rows="14"
            className={`${inputClasses} resize-none font-mono text-xs leading-relaxed`}
          />
        </div>
        <p className="text-xs text-[#526274] mt-1.5">
          Start a new section with <code className="bg-[#EAF8FC] text-[#006F9E] px-1.5 py-0.5 rounded font-mono">## Heading</code> on its own line — each becomes a linked section with a sidebar automatically.
        </p>
        {errors.body && <p className="text-rose-600 text-xs font-bold mt-1.5">{errors.body}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-5 rounded-xl border border-[#D6E4EA] text-[#111827] font-bold text-sm hover:bg-[#F6FAFC] transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-[2] py-3 px-5 rounded-xl bg-[#E38524] text-white font-extrabold text-sm uppercase tracking-wide shadow-xs hover:bg-[#C97019] transition-all flex items-center justify-center gap-2"
        >
          <Check size={18} strokeWidth={3} /> {initialData ? "Save Changes" : "Create Page"}
        </button>
      </div>
    </form>
  );
};

export default AddStaticPageForm;