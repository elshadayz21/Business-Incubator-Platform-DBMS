import React, { useState } from "react";
import {
  Box,
  MapPin,
  Users,
  LayoutGrid,
  Monitor,
  Armchair,
  AlertCircle,
  Loader2,
  Save,
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
      setError("Failed to add resource. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-sans">
      {error && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 flex items-center gap-3 text-rose-800 text-xs font-bold">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-[#526274] mb-1">Resource Name</label>
        <div className="relative">
          <Box size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]" />
          <input
            required
            disabled={loading}
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g. Conference Room B / High-Spec Workstation"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#526274] mb-2">Resource Category</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "workspace", icon: LayoutGrid, label: "Workspace" },
            { id: "meeting_room", icon: Armchair, label: "Meeting Room" },
            { id: "equipment", icon: Monitor, label: "Equipment" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={loading}
              onClick={() => handleChange("type", item.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                formData.type === item.id
                  ? "bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF] shadow-xs"
                  : "bg-white text-[#526274] border-[#D6E4EA] hover:bg-[#F6FAFC]"
              }`}
            >
              <item.icon size={20} className="mb-1" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#526274] mb-1">Capacity (Seats/Units)</label>
          <div className="relative">
            <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]" />
            <input
              type="number"
              min="1"
              disabled={loading}
              value={formData.capacity}
              onChange={(e) => handleChange("capacity", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#526274] mb-1">Location / Floor</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]" />
            <input
              required
              disabled={loading}
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="e.g. Floor 2, Tech Lab A"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[#D6E4EA] flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl border border-[#D6E4EA] text-xs font-bold text-[#526274] hover:bg-[#F6FAFC]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-[#E38524] text-white text-xs font-extrabold uppercase shadow-xs hover:bg-[#C97019] disabled:opacity-50 transition flex items-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>Save Asset</span>
        </button>
      </div>
    </form>
  );
};

export default AddResourceForm;
