import React from "react";
import { Mail, Loader2, Inbox, ShieldOff } from "lucide-react";

const UserTable = ({ users, loading, onDeactivate }) => {
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#D6E4EA]">
        <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={32} />
        <p className="text-[#526274] font-bold text-sm">Loading users...</p>
      </div>
    );

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#D6E4EA] text-center p-6">
        <div className="p-4 bg-[#EAF8FC] rounded-full text-[#00ADEF] mb-3">
          <Inbox size={36} />
        </div>
        <h3 className="text-lg font-bold text-[#111827]">No users found</h3>
        <p className="text-xs text-[#526274] mt-1 max-w-sm">
          Try adjusting your search criteria or role filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto font-sans">
      <table className="w-full text-left border-collapse min-w-[850px]">
        <thead>
          <tr className="bg-[#F6FAFC] border-b border-[#D6E4EA] text-[#526274] text-xs font-bold uppercase tracking-wider">
            <th className="p-4">Name &amp; Email</th>
            <th className="p-4">Role</th>
            <th className="p-4 text-center">Status</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D6E4EA] text-sm">
          {users.map((u, index) => (
            <tr key={u.id || index} className="hover:bg-[#F6FAFC] transition-colors">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00ADEF] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {(u.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-[#111827] text-sm">
                      {u.name || "Unknown User"}
                    </div>
                    <div className="text-xs text-[#526274] font-medium flex items-center gap-1.5 mt-0.5">
                      <Mail size={12} className="text-[#00ADEF]" /> {u.email || "No Email"}
                    </div>
                  </div>
                </div>
              </td>

              <td className="p-4">
                <span className="inline-flex px-2.5 py-1 rounded-full bg-[#EAF8FC] text-[#006F9E] text-xs font-bold border border-[#00ADEF]/20 capitalize">
                  {u.role}
                </span>
              </td>

              <td className="p-4 text-center">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    u.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                      : "bg-slate-100 text-slate-600 border border-slate-300"
                  }`}
                >
                  {u.status === "active" ? "Active" : "Inactive"}
                </span>
              </td>

              <td className="p-4 text-right">
                {u.status !== "inactive" && (
                  <button
                    onClick={() => onDeactivate && onDeactivate(u.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition"
                    title="Deactivate Account"
                  >
                    <ShieldOff size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
