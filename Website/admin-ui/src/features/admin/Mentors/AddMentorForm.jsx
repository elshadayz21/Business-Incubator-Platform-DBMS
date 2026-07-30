import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Activity,
  Layers,
  GraduationCap,
  Loader2,
  AlertCircle,
  Save,
} from "lucide-react";

const AddMentorForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
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
    const fetchData = async () => {
      try {
        setProjects([
          { id: 1, title: "Pharmacy App" },
          { id: 2, title: "E-Commerce" },
        ]);
        setWorkshops([
          { id: 1, title: "React Basics" },
          { id: 2, title: "Agile Scrum" },
        ]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

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
      await window.electron.invoke("mentors:add", formData);
      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Failed to add mentor. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    "w-full px-4 py-3 bg-white font-bold text-black placeholder-gray-500 outline-none uppercase transition-all disabled:bg-gray-100 disabled:text-gray-400";
  const labelClasses =
    "block text-xs font-black uppercase text-gray-700 mb-2 tracking-widest";
  const iconBoxClasses =
    "w-12 bg-black flex items-center justify-center flex-shrink-0 text-white";
  const containerClasses =
    "flex border-2 border-black shadow-[4px_4px_0_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_0_black] focus-within:translate-x-[2px] focus-within:translate-y-[2px] focus-within:shadow-[2px_2px_0_0_black] transition-all";

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

        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-[#4f46e5] text-white px-3 py-1 font-black text-sm uppercase border-2 border-black shadow-[2px_2px_0_0_black]">
              Step 01
            </span>
            <h3 className="text-2xl font-black text-black uppercase tracking-tight">
              Personal Information
            </h3>
          </div>

          <div>
            <label className={labelClasses}>Full Name</label>
            <div className={containerClasses}>
              <div className={iconBoxClasses}>
                <User size={20} strokeWidth={2.5} />
              </div>
              <input
                required
                className={inputClasses}
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="DR. AHMED ALI"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>Email Address</label>
              <div className={containerClasses}>
                <div className={iconBoxClasses}>
                  <Mail size={20} strokeWidth={2.5} />
                </div>
                <input
                  required
                  type="email"
                  className={inputClasses}
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="EXAMPLE@EMAIL.COM"
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Phone Number</label>
              <div className={containerClasses}>
                <div className={iconBoxClasses}>
                  <Phone size={20} strokeWidth={2.5} />
                </div>
                <input
                  className={inputClasses}
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+20 1XXXXXXXXX"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full h-1 bg-black opacity-10 border-t-2 border-black border-dashed"></div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-[#0f172a] text-white px-3 py-1 font-black text-sm uppercase border-2 border-black shadow-[2px_2px_0_0_black]">
              Step 02
            </span>
            <h3 className="text-2xl font-black text-black uppercase tracking-tight">
              Professional Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>Expertise Area</label>
              <div className={containerClasses}>
                <div className={iconBoxClasses}>
                  <Briefcase size={20} strokeWidth={2.5} />
                </div>
                <select
                  className={`${inputClasses} appearance-none cursor-pointer`}
                  value={formData.expertise}
                  onChange={(e) => handleChange("expertise", e.target.value)}
                  disabled={loading}
                >
                  <option value="">SELECT FIELD...</option>
                  <option value="Technology">TECHNOLOGY</option>
                  <option value="Business">BUSINESS</option>
                  <option value="Marketing">MARKETING</option>
                  <option value="Design">DESIGN</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClasses}>Account Status</label>
              <div className={containerClasses}>
                <div className={iconBoxClasses}>
                  <Activity size={20} strokeWidth={2.5} />
                </div>
                <select
                  className={`${inputClasses} appearance-none cursor-pointer`}
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  disabled={loading}
                >
                  <option value="active">ACTIVE</option>
                  <option value="inactive">INACTIVE</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full h-1 bg-black opacity-10 border-t-2 border-black border-dashed"></div>

        <div className="bg-[#f5f5f5] p-6 border-4 border-black shadow-[6px_6px_0_0_black]">
          <div className="flex items-center gap-3 mb-6">
            <Layers className="text-black" size={24} strokeWidth={2.5} />
            <h3 className="text-xl font-black text-black uppercase">
              Quick Assignment
              <span className="ml-2 text-sm font-bold bg-black text-white px-2 py-0.5">
                OPTIONAL
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>Assign Project</label>
              <div className={`${containerClasses} bg-white`}>
                <div className="w-12 bg-white border-r-2 border-black flex items-center justify-center flex-shrink-0 text-black">
                  <Briefcase size={20} strokeWidth={2.5} />
                </div>
                <select
                  className={`${inputClasses} bg-white`}
                  value={formData.assignedProject}
                  onChange={(e) =>
                    handleChange("assignedProject", e.target.value)
                  }
                  disabled={loading}
                >
                  <option value="">SELECT PROJECT...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClasses}>Assign Workshop</label>
              <div className={`${containerClasses} bg-white`}>
                <div className="w-12 bg-white border-r-2 border-black flex items-center justify-center flex-shrink-0 text-black">
                  <GraduationCap size={20} strokeWidth={2.5} />
                </div>
                <select
                  className={`${inputClasses} bg-white`}
                  value={formData.assignedWorkshop}
                  onChange={(e) =>
                    handleChange("assignedWorkshop", e.target.value)
                  }
                  disabled={loading}
                >
                  <option value="">SELECT WORKSHOP...</option>
                  {workshops.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.title.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="p-8 border-t-4 border-black bg-white sticky bottom-0 z-10">
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-4 px-6 font-black uppercase text-xl border-4 border-black flex items-center justify-center gap-3 transition-all
            ${
              loading
                ? "bg-gray-200 text-gray-500 cursor-not-allowed translate-x-[2px] translate-y-[2px] shadow-none"
                : "bg-black text-white shadow-[6px_6px_0_0_#4f46e5] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px]"
            }`}
        >
          {loading ? (
            <>
              <Loader2 size={28} className="animate-spin" />
              PROCESSING...
            </>
          ) : (
            <>
              <Save size={28} strokeWidth={3} />
              CREATE MENTOR PROFILE
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AddMentorForm;
