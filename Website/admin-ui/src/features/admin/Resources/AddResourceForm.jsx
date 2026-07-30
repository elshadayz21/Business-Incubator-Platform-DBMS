import React, { useState } from "react";
import {
  X,
  Save,
  Box,
  MapPin,
  Users,
  LayoutGrid,
  Monitor,
  Armchair,
  AlertCircle,
  Loader2,
} from "lucide-react";

const AddResourceForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "workspace",
    capacity: 1,
    location: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      capacity: Number(formData.capacity),
    };

    try {
      await window.electron.invoke("resources:add", payload);
      onSuccess();
    } catch (err) {
      console.error("Failed to add resource", err);
      setError("Failed to add resource. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const labelClasses =
    "block text-xs font-black uppercase text-gray-700 mb-2 tracking-widest";
  const iconBoxClasses =
    "w-12 bg-black flex items-center justify-center flex-shrink-0 text-white";
  const containerClasses =
    "flex border-2 border-black shadow-[4px_4px_0_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_0_black] focus-within:translate-x-[2px] focus-within:translate-y-[2px] focus-within:shadow-[2px_2px_0_0_black] transition-all bg-white";
  const inputClasses =
    "w-full px-4 py-3 bg-transparent font-bold text-black placeholder-gray-400 outline-none uppercase transition-all disabled:text-gray-400";

  return (
    <div className="bg-[#FFFDF5] w-full h-full flex flex-col font-sans">
      <form
        onSubmit={handleSubmit}
        className="flex-1 p-8 space-y-10 overflow-y-auto"
      >
        {error && (
          <div className="bg-red-50 border-4 border-red-500 p-4 flex items-center gap-4 shadow-[4px_4px_0_0_#ef4444]">
            <AlertCircle className="text-red-600" size={32} strokeWidth={2.5} />
            <span className="font-black text-red-700 uppercase">{error}</span>
          </div>
        )}

        {/* Section 01: Basics */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-[#4f46e5] text-white px-3 py-1 font-black text-sm uppercase border-2 border-black shadow-[2px_2px_0_0_black]">
              Step 01
            </span>
            <h3 className="text-2xl font-black text-black uppercase tracking-tight">
              Resource Details
            </h3>
          </div>

          <div>
            <label className={labelClasses}>Resource Name</label>
            <div className={containerClasses}>
              <div className={iconBoxClasses}>
                <Box size={20} strokeWidth={2.5} />
              </div>
              <input
                required
                disabled={loading}
                className={inputClasses}
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="E.G. CONFERENCE ROOM A"
              />
            </div>
          </div>
        </div>

        {/* Section 02: Type selection */}
        <div className="space-y-6">
          <label className={labelClasses}>Select Category</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { id: "workspace", icon: LayoutGrid, label: "Workspace" },
              { id: "meeting_room", icon: Armchair, label: "Room" },
              { id: "equipment", icon: Monitor, label: "Equipment" },
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                disabled={loading}
                onClick={() => handleChange("type", type.id)}
                className={`flex flex-col items-center justify-center p-6 border-4 border-black transition-all group ${
                  formData.type === type.id
                    ? "bg-[#f59e0b] text-black shadow-[6px_6px_0_0_black] translate-x-[-2px] translate-y-[-2px]"
                    : "bg-white text-gray-400 hover:text-black hover:bg-gray-50 shadow-[4px_4px_0_0_black] hover:shadow-[5px_5px_0_0_black]"
                }`}
              >
                <type.icon
                  size={32}
                  strokeWidth={2.5}
                  className={`mb-3 transition-transform group-hover:scale-110 ${
                    formData.type === type.id ? "text-black" : "text-gray-300"
                  }`}
                />
                <span className="text-xs font-black uppercase tracking-widest">
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 03: Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div>
            <label className={labelClasses}>Capacity (Persons)</label>
            <div className={containerClasses}>
              <div className={iconBoxClasses}>
                <Users size={20} strokeWidth={2.5} />
              </div>
              <input
                type="number"
                min="1"
                disabled={loading}
                className={inputClasses}
                value={formData.capacity}
                onChange={(e) => handleChange("capacity", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Location / Floor</label>
            <div className={containerClasses}>
              <div className={iconBoxClasses}>
                <MapPin size={20} strokeWidth={2.5} />
              </div>
              <input
                required
                disabled={loading}
                className={inputClasses}
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="E.G. FLOOR 2, ZONE B"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Footer Actions */}
      <div className="p-8 border-t-4 border-black bg-white sticky bottom-0 z-10 flex gap-6">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-4 px-6 font-black uppercase text-xl border-4 border-black bg-white text-black shadow-[4px_4px_0_0_black] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          className={`flex-[2] py-4 px-6 font-black uppercase text-xl border-4 border-black flex items-center justify-center gap-3 transition-all
            ${
              loading
                ? "bg-gray-200 text-gray-500 cursor-not-allowed translate-x-[2px] translate-y-[2px] shadow-none"
                : "bg-black text-white shadow-[6px_6px_0_0_#4f46e5] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px]"
            }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={28} />
              SAVING...
            </>
          ) : (
            <>
              <Save size={28} strokeWidth={3} />
              SAVE RESOURCE
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AddResourceForm;
