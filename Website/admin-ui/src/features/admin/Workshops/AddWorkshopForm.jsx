import React, { useState } from "react";
import {
  X,
  Check,
  Type,
  FileText,
  User,
  MapPin,
  Calendar,
  Clock,
  Users,
  Activity,
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
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.mentor.trim()) newErrors.mentor = "Mentor is required";
    if (!formData.startDate) newErrors.startDate = "Required";
    if (!formData.endDate) newErrors.endDate = "Required";
    if (!formData.startTime) newErrors.startTime = "Required";
    if (!formData.endTime) newErrors.endTime = "Required";
    if (!formData.capacity || formData.capacity <= 0)
      newErrors.capacity = "Invalid capacity";
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
      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-8 space-y-10"
      >
        {/* Section 01: Basics */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-[#4f46e5] text-white px-3 py-1 font-black text-sm uppercase border-2 border-black shadow-[2px_2px_0_0_black]">
              Step 01
            </span>
            <h3 className="text-2xl font-black text-black uppercase tracking-tight">
              General Information
            </h3>
          </div>

          <div>
            <label className={labelClasses}>Workshop Title</label>
            <div className={containerClasses(errors.title)}>
              <div className={iconBoxClasses}>
                <Type size={20} strokeWidth={2.5} />
              </div>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="E.G., ADVANCED REACT PATTERNS"
                className={inputClasses}
              />
            </div>
            {errors.title && (
              <p className="text-red-600 text-xs font-black mt-2 uppercase italic">
                 {errors.title}
              </p>
            )}
          </div>

          <div>
            <label className={labelClasses}>Description</label>
            <div className={containerClasses(errors.description)}>
              <div className={`${iconBoxClasses} h-auto items-start pt-4`}>
                <FileText size={20} strokeWidth={2.5} />
              </div>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="DESCRIBE THE WORKSHOP CONTENT..."
                rows="3"
                className={`${inputClasses} resize-none pt-3`}
              />
            </div>
            {errors.description && (
              <p className="text-red-600 text-xs font-black mt-2 uppercase italic">
                 {errors.description}
              </p>
            )}
          </div>
        </div>

        <div className="w-full h-1 bg-black opacity-10 border-t-2 border-black border-dashed"></div>

        {/* Section 02: Logistics */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-[#0f172a] text-white px-3 py-1 font-black text-sm uppercase border-2 border-black shadow-[2px_2px_0_0_black]">
              Step 02
            </span>
            <h3 className="text-2xl font-black text-black uppercase tracking-tight">
              Logistics & Location
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className={labelClasses}>Assigned Mentor</label>
              <div className={containerClasses(errors.mentor)}>
                <div className={iconBoxClasses}>
                  <User size={20} strokeWidth={2.5} />
                </div>
                <input
                  name="mentor"
                  value={formData.mentor}
                  onChange={handleChange}
                  placeholder="E.G., JOHN DOE"
                  className={inputClasses}
                />
              </div>
              {errors.mentor && (
                <p className="text-red-600 text-xs font-black mt-2 uppercase italic">
                   {errors.mentor}
                </p>
              )}
            </div>

            <div>
              <label className={labelClasses}>Location</label>
              <div className={containerClasses(errors.location)}>
                <div className={iconBoxClasses}>
                  <MapPin size={20} strokeWidth={2.5} />
                </div>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="E.G., HALL A / ZOOM"
                  className={inputClasses}
                />
              </div>
              {errors.location && (
                <p className="text-red-600 text-xs font-black mt-2 uppercase italic">
                   {errors.location}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 03: Schedule Box */}
        <div className="bg-[#eff6ff] p-6 border-4 border-black shadow-[6px_6px_0_0_black]">
          <div className="flex items-center gap-3 mb-8">
            <Calendar className="text-black" size={24} strokeWidth={3} />
            <h3 className="text-xl font-black text-black uppercase">
              Schedule Configuration
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <label className={labelClasses}>Start Date</label>
              <div className={containerClasses(errors.startDate)}>
                <div className={`${iconBoxClasses} bg-white text-black`}>
                  <Calendar size={20} strokeWidth={2.5} />
                </div>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
            </div>
            <div>
              <label className={labelClasses}>End Date</label>
              <div className={containerClasses(errors.endDate)}>
                <div className={`${iconBoxClasses} bg-white text-black`}>
                  <Calendar size={20} strokeWidth={2.5} />
                </div>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
              {errors.endDate && (
                <p className="text-red-600 text-xs font-black mt-2 uppercase italic">
                 {errors.endDate}
                </p>
              )}
            </div>
            <div>
              <label className={labelClasses}>Start Time</label>
              <div className={containerClasses(errors.startTime)}>
                <div className={`${iconBoxClasses} bg-white text-black`}>
                  <Clock size={20} strokeWidth={2.5} />
                </div>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
            </div>
            <div>
              <label className={labelClasses}>End Time</label>
              <div className={containerClasses(errors.endTime)}>
                <div className={`${iconBoxClasses} bg-white text-black`}>
                  <Clock size={20} strokeWidth={2.5} />
                </div>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 04: Final Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div>
            <label className={labelClasses}>Capacity (Students)</label>
            <div className={containerClasses(errors.capacity)}>
              <div className={iconBoxClasses}>
                <Users size={20} strokeWidth={2.5} />
              </div>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="50"
                min="1"
                className={inputClasses}
              />
            </div>
            {errors.capacity && (
              <p className="text-red-600 text-xs font-black mt-2 uppercase italic">
                {errors.capacity}
              </p>
            )}
          </div>

          <div>
            <label className={labelClasses}>Initial Status</label>
            <div className={containerClasses(false)}>
              <div className={iconBoxClasses}>
                <Activity size={20} strokeWidth={2.5} />
              </div>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`${inputClasses} cursor-pointer`}
              >
                <option value="scheduled">SCHEDULED</option>
                <option value="ongoing">ONGOING</option>
                <option value="completed">COMPLETED</option>
              </select>
            </div>
          </div>
        </div>
      </form>

      {/* Footer Actions */}
      <div className="p-8 border-t-4 border-black bg-white sticky bottom-0 flex gap-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-4 px-6 border-4 border-black text-black font-black uppercase text-lg hover:bg-gray-100 transition-all shadow-[4px_4px_0_0_black] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          className="flex-[2] py-4 px-6 bg-black text-white border-4 border-black font-black uppercase text-lg shadow-[4px_4px_0_0_#4f46e5] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center justify-center gap-3"
        >
          <Check size={24} strokeWidth={4} /> Create Workshop
        </button>
      </div>
    </div>
  );
};

export default AddWorkshopForm;
