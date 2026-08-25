import React, { useState, useEffect, useRef } from "react";
import { UploadCloud, Loader2, Save, ImageOff, AlertCircle } from "lucide-react";

const MAX_TITLE_LENGTH = 200;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];

const DEFAULT_CATEGORIES = [
  "Events",
  "Workshops",
  "Training",
  "Mentorship",
  "Demo Day",
  "Community",
  "Other",
];

const AddGalleryForm = ({ initialData = null, onClose, onSuccess, categories: propCategories }) => {
  const isEditing = Boolean(initialData);
  // If parent passed a categories list that only contains 'All' or is empty, fall back to DEFAULT_CATEGORIES
  const providedCategories = Array.isArray(propCategories) ? propCategories.filter((c) => c && String(c).toLowerCase() !== 'all') : [];
  const categories = providedCategories.length > 0 ? providedCategories : DEFAULT_CATEGORIES;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [category, setCategory] = useState(categories[0] || "Other");
  const [isPublished, setIsPublished] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setVideoUrl(initialData.video_url || initialData.videoUrl || "");
      setCategory(initialData.category || categories[0] || "Other");
      setIsPublished(!!initialData.is_published);
      setDisplayOrder(initialData.display_order || 0);
      setImagePreview(initialData.image_url || "");
      setImageFile(null);
      setErrors({});
    }
  }, [initialData]);

  useEffect(() => {
    return () => {
      // cleanup preview object urls
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const validate = () => {
    const e = {};
    if (!title || title.trim().length === 0) e.title = "Title is required.";
    else if (title.length > MAX_TITLE_LENGTH) e.title = `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`;

    if (!isEditing && !imageFile) {
      e.image = "Image is required when creating a gallery item.";
    }

    if (imageFile) {
      if (!ALLOWED_MIMES.includes(imageFile.type)) e.image = "Unsupported image format.";
      if (imageFile.size > MAX_FILE_SIZE) e.image = "Image exceeds maximum size of 5MB.";
    }

    if (!category) e.category = "Category is required.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFile = (file) => {
    if (!file) return;
    // validate quickly client-side
    if (!ALLOWED_MIMES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: "Unsupported image format." }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, image: "Image exceeds maximum size of 5MB." }));
      return;
    }
    setErrors((prev) => ({ ...prev, image: undefined }));
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };
  const onDragOver = (e) => e.preventDefault();

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    try {
      let payload;
      let headers = {};
      if (imageFile) {
        payload = new FormData();
        payload.append("image", imageFile);
        payload.append("title", title);
        payload.append("description", description);
        payload.append("videoUrl", videoUrl);
        payload.append("category", category);
        payload.append("displayOrder", displayOrder);
        payload.append("isPublished", isPublished ? "true" : "false");
      } else {
        payload = JSON.stringify({
          title,
          description,
          videoUrl,
          category,
          imageUrl: imagePreview || "",
          displayOrder,
          isPublished,
        });
        headers["Content-Type"] = "application/json";
      }

      const url = isEditing ? `/api/admin/gallery/${initialData.id}` : "/api/admin/gallery";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        credentials: "include",
        body: payload,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save gallery item");
      }

      // success
      window.alert(isEditing ? "Gallery item updated successfully." : "Gallery item added successfully.");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Failed to save gallery item:", err);
      window.alert("Failed to save gallery item: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setErrors((prev) => ({ ...prev, image: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-sans w-full max-w-2xl p-4">
      {/* Error slot */}
      {errors.form && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 flex items-center gap-3 text-rose-800 text-xs font-bold">
          <AlertCircle size={18} className="text-rose-600" />
          <span>{errors.form}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-[#526274] mb-2">Image</label>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          className={`w-full rounded-xl border-2 border-dashed p-4 bg-[#F6FAFC] cursor-pointer ${errors.image ? "border-rose-300" : "border-[#D6E4EA]"}`}
          onClick={handlePickFile}
        >
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="preview" className="w-full h-56 object-cover rounded-lg" />
              <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-white rounded-full p-1 border">
                Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-center py-10">
              <UploadCloud size={28} className="text-[#006F9E]" />
              <div className="text-xs font-bold text-[#526274]">Drag & drop an image or click to select</div>
              <div className="text-[10px] text-[#8AA0B4]">JPG, PNG or WebP • max 5MB</div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
        {errors.image && <p className="text-rose-600 text-xs font-bold mt-2">{errors.image}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-[#526274] mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
          maxLength={MAX_TITLE_LENGTH}
          required
          className={`w-full px-4 py-2.5 rounded-xl border ${errors.title ? "border-rose-300" : "border-[#D6E4EA]"} bg-white text-sm`}
          placeholder="Short caption for the image"
        />
        {errors.title && <p className="text-rose-600 text-xs font-bold mt-2">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-[#526274] mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-[#D6E4EA] bg-white text-sm"
          placeholder="Optional description or caption"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-[#526274] mb-2">Video Link (Optional)</label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-[#D6E4EA] bg-white text-sm"
          placeholder="https://www.youtube.com/watch?v=... (Optional video link)"
        />
        <p className="text-[11px] text-[#8AA0B4] mt-1">If provided, clicking this photo on the public website will open the video link.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#526274] mb-2">Category</label>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setErrors((p) => ({ ...p, category: undefined })); }}
          required
          className={`w-full px-4 py-2.5 rounded-xl border ${errors.category ? "border-rose-300" : "border-[#D6E4EA]"} bg-white text-sm`}
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.category && <p className="text-rose-600 text-xs font-bold mt-2">{errors.category}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#526274] mb-2">Published</label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsPublished(true)} className={`px-4 py-2 rounded-xl ${isPublished ? "bg-[#EAF8FC] border border-[#00ADEF]" : "bg-white border border-[#D6E4EA]"}`}>Published</button>
            <button type="button" onClick={() => setIsPublished(false)} className={`px-4 py-2 rounded-xl ${!isPublished ? "bg-[#EAF8FC] border border-[#00ADEF]" : "bg-white border border-[#D6E4EA]"}`}>Draft</button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#526274] mb-2">Display Order</label>
          <input
            type="number"
            min={0}
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl border border-[#D6E4EA] bg-white text-sm"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-[#D6E4EA] flex items-center justify-end gap-3">
        <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2.5 rounded-xl border border-[#D6E4EA] text-xs font-bold text-[#526274] hover:bg-[#F6FAFC]">Cancel</button>
        <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-[#E38524] text-white text-xs font-extrabold uppercase shadow-xs hover:bg-[#C97019] disabled:opacity-50 transition flex items-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{isEditing ? "Save Changes" : "Add Image"}</span>
        </button>
      </div>
    </form>
  );
};

export default AddGalleryForm;
