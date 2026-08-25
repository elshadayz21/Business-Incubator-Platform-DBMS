import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Key,
  Briefcase,
  Activity,
  Loader2,
  AlertCircle,
  Save,
} from "lucide-react";

const AddMentorForm = ({ onSuccess, onClose, initialData }) => {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    expertise: "",
    phone: "",
    status: "active",
    assignedProject: "",
    assignedWorkshop: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [projects, setProjects] = useState([]);
  const [workshops, setWorkshops] = useState([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        expertise: initialData.expertise || "",
        phone: initialData.phone || "",
        status: initialData.status || "active",
        assignedProject: "",
        assignedWorkshop: "",
      });
      return;
    }

    const fetchData = async () => {
      try {
        setProjects([
          { id: 1, title: "FinTech Mobile App" },
          { id: 2, title: "AgriTech Supply" },
        ]);
        setWorkshops([
          { id: 1, title: "Startup MVP Basics" },
          { id: 2, title: "Agile Financial Planning" },
        ]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      setError("Name and Email are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        await window.electron.invoke("mentors:update", {
          id: initialData.id,
          data: formData,
        });
      } else {
        await window.electron.invoke("mentors:add", formData);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      setError(
        isEditing ? "Failed to update mentor. Please try again." : "Failed to add mentor. Please try again.",
      );
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

      {/* Step 1: Personal Info */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#006F9E] border-b border-[#D6E4EA] pb-2">
          Personal Information
        </h3>

        <div>
          <label className="block text-xs font-bold text-[#526274] mb-1">Full Name</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]" />
            <input
              required
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Dr. Ahmed Ali"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#526274] mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]" />
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="mentor@incubator.et"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#526274] mb-1">
              Login Password <span className="text-slate-400 font-normal">{isEditing ? "(Leave blank to keep unchanged)" : "(Default: Mentor123!)"}</span>
            </label>
            <div className="relative">
              <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder={isEditing ? "••••••••" : "Mentor123!"}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#526274] mb-1">Phone Number</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]" />
            <input
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+251 911 000 000"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Professional Details */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#006F9E] border-b border-[#D6E4EA] pb-2">
          Professional Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#526274] mb-1">Expertise Sector</label>
            <div className="relative">
              <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]" />
              <select
                value={formData.expertise}
                onChange={(e) => handleChange("expertise", e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
              >
                <option value="">Select Field...</option>
                <option value="Technology">Technology &amp; Software</option>
                <option value="Business">Business &amp; Finance</option>
                <option value="Marketing">Marketing &amp; Growth</option>
                <option value="Design">Design &amp; Product</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#526274] mb-1">Status</label>
            <div className="relative">
              <Activity size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]" />
              <select
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons Footer */}
      <div className="pt-4 border-t border-[#D6E4EA] flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
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
          <span>{isEditing ? "Update Mentor" : "Create Mentor"}</span>
        </button>
      </div>
    </form>
  );
};

export default AddMentorForm;
