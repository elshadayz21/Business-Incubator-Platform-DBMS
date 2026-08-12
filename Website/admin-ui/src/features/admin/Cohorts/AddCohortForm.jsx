import React, { useState } from "react";
import { Type, Layers, Calendar, Clock, Check } from "lucide-react";

const AddCohortForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    type: initialData?.type || "startup",
    start_date: initialData?.start_date
      ? initialData.start_date.slice(0, 10)
      : "",
    end_date: initialData?.end_date ? initialData.end_date.slice(0, 10) : "",
    application_deadline: initialData?.application_deadline
      ? initialData.application_deadline.slice(0, 10)
      : "",
    status: initialData?.status || "upcoming",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) onSubmit(formData);
  };

  const labelClasses =
    "text-[11px] font-extrabold uppercase tracking-wider text-[#526274] block mb-2";
  const inputWrapClasses =
    "flex items-center gap-3 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl px-4 py-2.5 focus-within:border-[#00ADEF] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00ADEF]/20 transition-all";
  const inputClasses =
    "w-full bg-transparent text-sm font-medium text-[#111827] outline-none placeholder:text-slate-400";
  const selectClasses =
    "w-full bg-transparent text-sm font-medium text-[#111827] outline-none cursor-pointer";

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div>
        <label className={labelClasses}>Cohort Name</label>
        <div className={inputWrapClasses}>
          <Type size={16} className="text-[#00ADEF] shrink-0" />
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Batch 04"
            className={inputClasses}
          />
        </div>
        {errors.name && (
          <p className="text-rose-600 text-xs font-bold mt-1.5">
            {errors.name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Type</label>
          <div className={inputWrapClasses}>
            <Layers size={16} className="text-[#00ADEF] shrink-0" />
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={selectClasses}
            >
              <option value="startup">Startup</option>
              <option value="msme">MSME</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClasses}>Status</label>
          <div className={inputWrapClasses}>
            <Clock size={16} className="text-[#00ADEF] shrink-0" />
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={selectClasses}
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Start Date</label>
          <div className={inputWrapClasses}>
            <Calendar size={16} className="text-[#00ADEF] shrink-0" />
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
        </div>
        <div>
          <label className={labelClasses}>End Date</label>
          <div className={inputWrapClasses}>
            <Calendar size={16} className="text-[#00ADEF] shrink-0" />
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClasses}>Application Deadline</label>
        <div className={inputWrapClasses}>
          <Calendar size={16} className="text-[#00ADEF] shrink-0" />
          <input
            type="date"
            name="application_deadline"
            value={formData.application_deadline}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>
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
          <Check size={18} strokeWidth={3} />{" "}
          {initialData ? "Save Changes" : "Create Cohort"}
        </button>
      </div>
    </form>
  );
};

export default AddCohortForm;
