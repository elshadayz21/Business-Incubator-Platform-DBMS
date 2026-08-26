import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  ShieldCheck,
  UserCheck,
  Search,
  Loader2,
  Inbox,
  X,
  Filter,
  AlertCircle,
  CheckCircle2,
  Save,
  KeyRound,
} from "lucide-react";
import UserTable from "./UserTable";
import AddUserForm from "./AddUserForm";
import StatCard from "../../../components/StatCard";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [notice, setNotice] = useState(null);
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [passwordModalValue, setPasswordModalValue] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");

  const flashNotice = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.electron.invoke("users:get-all");
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = () => {
    setShowAddForm(false);
    fetchUsers();
  };

  const handleToggleStatus = async (u) => {
    const newStatus = u.status === "active" ? "inactive" : "active";
    try {
      await window.electron.invoke("users:update-status", u.id, newStatus);
      flashNotice(
        "success",
        `${u.name} has been ${newStatus === "active" ? "activated" : "deactivated"}.`,
      );
    } catch (error) {
      flashNotice("error", error.message || "Failed to update account status.");
    }
    fetchUsers();
  };

  const openPasswordModal = (u) => {
    setPasswordModalUser(u);
    setPasswordModalValue("");
    setModalError(null);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (passwordModalValue.length < 8) {
      setModalError("Password must be at least 8 characters.");
      return;
    }
    setModalLoading(true);
    setModalError(null);
    try {
      await window.electron.invoke("users:reset-password", passwordModalUser.id, passwordModalValue);
      flashNotice("success", `Password reset for ${passwordModalUser.name}.`);
      setPasswordModalUser(null);
    } catch (error) {
      setModalError(error.message || "Failed to reset password.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.name}" (${u.email})? This cannot be undone.`)) return;
    try {
      await window.electron.invoke("users:delete", u.id);
      flashNotice("success", `User "${u.name}" has been deleted.`);
    } catch (error) {
      flashNotice("error", error.message || "Failed to delete user.");
    }
    fetchUsers();
  };

  const filteredUsers = users.filter(
    (u) =>
      (filterRole === "all" ||
        (u.role && u.role.toLowerCase() === filterRole.toLowerCase())) &&
      (u.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all shrink-0"
      >
        <Plus size={18} />
        <span>Add New User</span>
      </button>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-sm font-bold ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={18} className="shrink-0" />
          ) : (
            <AlertCircle size={18} className="shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total User Accounts"
          value={users.length}
          icon={ShieldCheck}
          badgeText="All roles"
          accentColor="cyan"
        />
        <StatCard
          title="Superadmin Accounts"
          value={users.filter((u) => u.role === "superadmin").length}
          icon={ShieldCheck}
          badgeText="Full control"
          accentColor="orange"
        />
        <StatCard
          title="Active Status"
          value={users.filter((u) => u.status === "active").length}
          icon={UserCheck}
          badgeText="Enabled logins"
          accentColor="cyan"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6E4EA] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]"
            size={18}
          />
          <input
            type="text"
            placeholder="Search users by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium text-[#111827] outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={16} className="text-[#526274]" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full md:w-52 px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="superadmin">Superadmin</option>
            <option value="admin">Admin</option>
            <option value="mentor">Mentor</option>
            <option value="entrepreneur">Entrepreneur</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#D6E4EA]">
          <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={32} />
          <p className="text-[#526274] font-bold text-sm">Loading users list...</p>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#D6E4EA] shadow-xs overflow-hidden">
          <UserTable
            users={filteredUsers}
            currentUserId={currentUser.id}
            onToggleStatus={handleToggleStatus}
            onResetPassword={openPasswordModal}
            onDelete={handleDelete}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#D6E4EA] text-center p-6">
          <div className="p-4 bg-[#EAF8FC] rounded-full text-[#00ADEF] mb-3">
            <Inbox size={36} />
          </div>
          <h3 className="text-lg font-bold text-[#111827]">No user accounts found</h3>
          <p className="text-xs text-[#526274] mt-1 max-w-sm mb-6">
            Create user credentials to grant administrative workspace access.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E38524] text-white text-xs font-bold uppercase"
          >
            <Plus size={16} /> Add First User
          </button>
        </div>
      )}

      {/* Add User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[#D6E4EA] shadow-xl flex flex-col overflow-hidden font-sans">
            <div className="p-5 border-b border-[#D6E4EA] flex items-center justify-between bg-white">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] block">
                  Security &amp; Roles
                </span>
                <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk']">
                  Add New System Account
                </h2>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 rounded-xl text-[#526274] hover:bg-[#F6FAFC] hover:text-[#111827] transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 bg-[#F6FAFC]">
              <AddUserForm
                onClose={() => setShowAddForm(false)}
                onSuccess={handleAddUser}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#D6E4EA] shadow-xl overflow-hidden font-sans">
            <div className="p-5 border-b border-[#D6E4EA] flex items-center justify-between bg-white">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] block">
                  Account Security
                </span>
                <h2 className="text-lg font-bold text-[#111827] font-['Space_Grotesk'] flex items-center gap-2">
                  <KeyRound size={18} className="text-[#E38524]" /> Reset Password
                </h2>
              </div>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="p-2 rounded-xl text-[#526274] hover:bg-[#F6FAFC] hover:text-[#111827] transition"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-[#526274]">
                Set a new password for{" "}
                <span className="font-bold text-[#111827]">{passwordModalUser.name}</span>{" "}
                ({passwordModalUser.email}). The user must use this password on next login.
              </p>
              {modalError && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 flex items-center gap-2 text-rose-800 text-xs font-bold">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-[#526274] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordModalValue}
                  onChange={(e) => setPasswordModalValue(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-2.5 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF]"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#D6E4EA] text-xs font-bold text-[#526274] hover:bg-[#F6FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#E38524] text-white text-xs font-extrabold uppercase shadow-xs hover:bg-[#C97019] disabled:opacity-50 transition flex items-center gap-2"
                >
                  {modalLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
