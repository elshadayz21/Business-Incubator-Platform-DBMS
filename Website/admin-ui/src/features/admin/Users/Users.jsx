import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  ShieldCheck,
  UserCheck,
  Search,
  Loader2,
  Inbox,
  Pin,
  X,
  Filter,
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

  const handleDeactivate = async (id) => {
    await window.electron.invoke("users:update-status", id, "inactive");
    fetchUsers();
  };

  const filteredUsers = users.filter(
    (u) =>
      (filterRole === "all" ||
        (u.role && u.role.toLowerCase() === filterRole.toLowerCase())) &&
      u.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFFDF5] h-screen font-sans scrollbar-hide">
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="p-6 lg:p-10 max-w-[1920px] mx-auto">
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="bg-black text-white px-3 py-1 font-bold text-sm uppercase tracking-wider mb-2 inline-block transform -rotate-1">
              Access Control
            </span>
            <h1 className="text-5xl md:text-6xl font-black text-black mb-2 uppercase tracking-tighter">
              User{" "}
              <span className="bg-[#4f46e5] text-white px-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] italic inline-block transform rotate-1">
                Management
              </span>
            </h1>
            <p className="text-xl text-slate-600 font-medium border-l-4 border-[#4f46e5] pl-4 italic mt-4">
              Create and manage Admin and Superadmin accounts.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-black text-white px-8 py-4 font-bold uppercase border-4 border-black shadow-[4px_4px_0_0_#4f46e5] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-3 text-lg"
          >
            <Plus size={24} strokeWidth={3} />
            Add User
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <StatCard
            title="Total Users"
            value={users.length}
            icon={ShieldCheck}
            bgClass="bg-[#4f46e5]"
            textClass="text-white"
          />
          <StatCard
            title="Superadmins"
            value={users.filter((u) => u.role === "superadmin").length}
            icon={ShieldCheck}
            bgClass="bg-[#0f172a]"
            textClass="text-white"
          />
          <StatCard
            title="Active"
            value={users.filter((u) => u.status === "active").length}
            icon={UserCheck}
            bgClass="bg-[#0d9488]"
            textClass="text-white"
          />
        </div>

        {/* Filters & Actions Bar */}
        <div className="bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] mb-8 flex flex-col xl:flex-row gap-6 items-center justify-between">
          <div className="relative flex-1 w-full xl:w-auto">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={20}
              strokeWidth={2.5}
            />
            <input
              type="text"
              placeholder="SEARCH USERS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-black bg-[#FFFDF5] focus:outline-none focus:ring-0 focus:bg-white font-bold text-black placeholder-gray-500 transition-all uppercase"
            />
          </div>

          <div className="relative w-full xl:w-auto">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
              strokeWidth={2.5}
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full xl:w-64 pl-10 pr-8 py-3 border-2 border-black bg-white text-black font-bold uppercase outline-none focus:bg-blue-50 cursor-pointer shadow-[2px_2px_0_0_black]"
            >
              <option value="all">All Roles</option>
              <option value="superadmin">Superadmin</option>
              <option value="admin">Admin</option>
              <option value="mentor">Mentor</option>
              <option value="entrepreneur">Entrepreneur</option>
            </select>
          </div>
        </div>

        {/* Table Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed">
            <Loader2
              className="text-black animate-spin mb-4"
              size={40}
              strokeWidth={2}
            />
            <p className="text-black font-black text-xl uppercase">
              Loading users...
            </p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000]">
            <UserTable users={filteredUsers} onDeactivate={handleDeactivate} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed text-center">
            <div className="p-6 bg-gray-100 border-2 border-black rounded-full mb-6">
              <Inbox className="text-black" size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-black text-black uppercase mb-2">
              No users found
            </h3>
            <p className="text-gray-600 text-lg font-medium max-w-md mt-1 mb-8">
              Create your first Admin account to get started.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-black text-white px-8 py-3 font-bold uppercase border-2 border-black shadow-[4px_4px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2"
            >
              <Plus size={20} strokeWidth={3} />
              Add First User
            </button>
          </div>
        )}

        {/* Add User Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-blue-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] border-4 border-black shadow-[8px_8px_0_0_black] flex flex-col animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b-4 border-black flex items-center justify-between bg-blue-50">
                <h2 className="text-2xl font-black text-blue-950 uppercase flex items-center gap-3">
                  <div className="p-2 border-2 border-black bg-white">
                    <Pin size={20} strokeWidth={3} />
                  </div>
                  Add New User
                </h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-black hover:bg-red-100 border-2 border-transparent hover:border-black p-1 transition-all"
                >
                  <X size={28} strokeWidth={3} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 bg-white">
                <AddUserForm
                  onClose={() => setShowAddForm(false)}
                  onSuccess={handleAddUser}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
