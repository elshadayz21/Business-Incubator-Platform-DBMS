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

const AddUserForm = ({ onClose, onSuccess }) => {
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
    const isPasswordStrong = (pw) => {
      if (!pw || pw.length < 8) return false;
      const hasUpper = /[A-Z]/.test(pw);
      const hasLower = /[a-z]/.test(pw);
      const hasDigit = /[0-9]/.test(pw);
      const hasSpecial = /[^A-Za-z0-9]/.test(pw);
      return hasUpper && hasLower && hasDigit && hasSpecial;
    };
    if (!isPasswordStrong(formData.password)) {
      setError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await window.electron.invoke("users:create", formData);
      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Failed to create user. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans">
      {error && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 flex items-center gap-3 text-rose-800 text-xs font-bold">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-[#526274] mb-1">Full Name</label>
        <div className="relative">
          <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]" />
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value.replace(/[<>;]/g, ""))}
            placeholder="Full Name"
            disabled={loading}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#526274] mb-1">Email Address</label>
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value.replace(/[<>;]/g, ""))}
            placeholder="user@dxvalley.com"
            disabled={loading}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#526274] mb-1">Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]" />
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder="Min 8 characters"
            disabled={loading}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#526274] mb-1">Role Assignment</label>
        <div className="relative">
          <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]" />
          <select
            value={formData.role}
            onChange={(e) => handleChange("role", e.target.value)}
            disabled={loading}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
          >
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
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
          <span>Create Account</span>
        </button>
      </div>
    </form>
  );
};

export default AddUserForm;
