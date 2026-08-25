import React, { useState } from "react";
import {
  Type,
  FileText,
  User,
  MapPin,
  Calendar,
  Clock,
  Users,
  Activity,
  Save,
} from "lucide-react";

const AddWorkshopForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mentor: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    capacity: "",
    location: "",
    status: "scheduled",
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
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.mentor.trim()) newErrors.mentor = "Mentor is required";
    if (!formData.startDate) newErrors.startDate = "Required";
    if (!formData.endDate) newErrors.endDate = "Required";
    if (!formData.startTime) newErrors.startTime = "Required";
    if (!formData.endTime) newErrors.endTime = "Required";
    if (!formData.capacity || formData.capacity <= 0) newErrors.capacity = "Invalid capacity";
    if (!formData.location.trim()) newErrors.location = "Location is required";

    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.startDate) > new Date(formData.endDate)
    ) {
      newErrors.endDate = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-sans">
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#006F9E] border-b border-[#D6E4EA] pb-2">
          General Information
        </h3>

        <div>
          <label className="block text-xs font-bold text-[#526274] mb-1">Workshop Title</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Advanced FinTech Product Development"
            className="w-full px-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
          />
          {errors.title && <p className="text-rose-600 text-[11px] font-bold mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-[#526274] mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Key topics, curriculum objectives, and prerequisites..."
            rows="3"
            className="w-full px-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
          />
          {errors.description && <p className="text-rose-600 text-[11px] font-bold mt-1">{errors.description}</p>}
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#006F9E] border-b border-[#D6E4EA] pb-2">
          Logistics &amp; Instructor
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#526274] mb-1">Assigned Mentor</label>
            <input
              name="mentor"
              value={formData.mentor}
              onChange={handleChange}
              placeholder="e.g. Dr. Abebe Bikila"
              className="w-full px-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
            />
            {errors.mentor && <p className="text-rose-600 text-[11px] font-bold mt-1">{errors.mentor}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#526274] mb-1">Location / Platform</label>
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. DxValley Lab Hall A / Microsoft Teams"
              className="w-full px-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
            />
            {errors.location && <p className="text-rose-600 text-[11px] font-bold mt-1">{errors.location}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#526274] mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#526274] mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#526274] mb-1">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#526274] mb-1">End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#526274] mb-1">Capacity (Max Startups)</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              placeholder="30"
              min="1"
              className="w-full px-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
            />
            {errors.capacity && <p className="text-rose-600 text-[11px] font-bold mt-1">{errors.capacity}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#526274] mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
            >
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[#D6E4EA] flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-[#D6E4EA] text-xs font-bold text-[#526274] hover:bg-[#F6FAFC]"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-[#E38524] text-white text-xs font-extrabold uppercase shadow-xs hover:bg-[#C97019] transition flex items-center gap-2"
        >
          <Save size={16} />
          <span>Save Workshop</span>
        </button>
      </div>
    </form>
  );
};

export default AddWorkshopForm;
