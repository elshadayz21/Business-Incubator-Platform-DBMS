import React, { useState } from "react";
import { X, Check, Type, FileText, Image, Calendar } from "lucide-react";

const AddAnnouncementForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    cover_image: "",
    published_at: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.body.trim()) newErrors.body = "Body is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const labelClasses =
    "block text-xs font-black uppercase text-gray-700 mb-2 tracking-widest";
  const containerClasses = (hasError) =>
    `flex border-2 ${hasError ? "border-red-500 shadow-[4px_4px_0_0_#ef4444]" : "border-black shadow-[4px_4px_0_0_black]"} bg-white transition-all focus-within:translate-x-[2px] focus-within:translate-y-[2px] focus-within:shadow-[2px_2px_0_0_black]`;
  const iconBoxClasses =
    "w-12 bg-black flex items-center justify-center flex-shrink-0 text-white border-r-2 border-black";
  const inputClasses =
    "w-full px-4 py-3 bg-transparent font-bold text-black placeholder-gray-400 outline-none uppercase disabled:bg-gray-100";

  return (
    <div className="bg-[#FFFDF5] h-full flex flex-col font-sans">
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-[#4f46e5] text-white px-3 py-1 font-black text-sm uppercase border-2 border-black shadow-[2px_2px_0_0_black]">
              Step 01
            </span>
            <h3 className="text-2xl font-black text-black uppercase tracking-tight">
              Announcement Details
            </h3>
          </div>

          <div>
            <label className={labelClasses}>Title</label>
            <div className={containerClasses(errors.title)}>
              <div className={iconBoxClasses}><Type size={20} strokeWidth={2.5} /></div>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="E.G., NEW COHORT OPENING SOON"
                className={inputClasses}
              />
            </div>
            {errors.title && <p className="text-red-600 text-xs font-black mt-2 uppercase italic">{errors.title}</p>}
          </div>

          <div>
            <label className={labelClasses}>Body</label>
            <div className={containerClasses(errors.body)}>
              <div className={`${iconBoxClasses} h-auto items-start pt-4`}><FileText size={20} strokeWidth={2.5} /></div>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleChange}
                placeholder="WRITE THE ANNOUNCEMENT CONTENT..."
                rows="5"
                className={`${inputClasses} resize-none pt-3`}
              />
            </div>
            {errors.body && <p className="text-red-600 text-xs font-black mt-2 uppercase italic">{errors.body}</p>}
          </div>

          <div>
            <label className={labelClasses}>Cover Image URL</label>
            <div className={containerClasses(false)}>
              <div className={iconBoxClasses}><Image size={20} strokeWidth={2.5} /></div>
              <input
                name="cover_image"
                value={formData.cover_image}
                onChange={handleChange}
                placeholder="/uploads/announcements/cover.jpg"
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Publish Date</label>
            <div className={containerClasses(false)}>
              <div className={`${iconBoxClasses} bg-white text-black`}><Calendar size={20} strokeWidth={2.5} /></div>
              <input
                type="datetime-local"
                name="published_at"
                value={formData.published_at}
                onChange={handleChange}
                className={inputClasses}
              />
            </div>
          </div>
        </div>
      </form>

      <div className="p-8 border-t-4 border-black bg-white sticky bottom-0 flex gap-6">
        <button type="button" onClick={onCancel} className="flex-1 py-4 px-6 border-4 border-black text-black font-black uppercase text-lg hover:bg-gray-100 transition-all shadow-[4px_4px_0_0_black] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
          Cancel
        </button>
        <button type="submit" onClick={handleSubmit} className="flex-[2] py-4 px-6 bg-black text-white border-4 border-black font-black uppercase text-lg shadow-[4px_4px_0_0_#4f46e5] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center justify-center gap-3">
          <Check size={24} strokeWidth={4} /> Publish Announcement
        </button>
      </div>
    </div>
  );
};

export default AddAnnouncementForm;