import React, { useState } from "react";
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Save,
} from "lucide-react";

const AddUserForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      setError("Name, Email, and Password are required.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await window.electron.invoke("users:create", formData);
      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Failed to create user. Please try again.");
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
        className="flex-1 p-8 space-y-8 overflow-y-auto"
      >
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-100 border-2 border-red-600 text-red-700 font-bold">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div>
          <label className={labelClasses}>Full Name</label>
          <div className={containerClasses}>
            <div className={iconBoxClasses}>
              <User size={20} />
            </div>
            <input
              type="text"
              className={inputClasses}
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Full Name"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className={labelClasses}>Email</label>
          <div className={containerClasses}>
            <div className={iconBoxClasses}>
              <Mail size={20} />
            </div>
            <input
              type="email"
              className={inputClasses}
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Email Address"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className={labelClasses}>Password</label>
          <div className={containerClasses}>
            <div className={iconBoxClasses}>
              <Lock size={20} />
            </div>
            <input
              type="password"
              className={inputClasses}
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Min 8 characters"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className={labelClasses}>Role</label>
          <div className={containerClasses}>
            <div className={iconBoxClasses}>
              <ShieldCheck size={20} />
            </div>
            <select
              className={inputClasses}
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value)}
              disabled={loading}
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white px-8 py-4 font-bold uppercase border-4 border-black shadow-[4px_4px_0_0_#4f46e5] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={22} />
          ) : (
            <Save size={22} />
          )}
          {loading ? "Saving..." : "Create User"}
        </button>
      </form>
    </div>
  );
};

export default AddUserForm;
