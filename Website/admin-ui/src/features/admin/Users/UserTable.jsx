import React from "react";
import { Mail, Loader2, Inbox, ShieldOff } from "lucide-react";

const UserTable = ({ users, loading, onDeactivate }) => {
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border-4 border-black border-dashed">
        <Loader2 className="text-black animate-spin mb-4" size={32} />
        <p className="text-black font-black text-lg uppercase">
          Loading users...
        </p>
      </div>
    );

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed text-center">
        <div className="p-5 bg-gray-100 border-2 border-black rounded-full mb-5">
          <Inbox className="text-black" size={48} strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-black text-black uppercase mb-2">
          No users found
        </h2>
        <p className="text-gray-600 text-lg font-medium max-w-sm mb-8">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#0f172a] border-b-4 border-black text-white">
              <th className="p-5 font-black text-white text-sm uppercase tracking-wider border-r-2 border-black">
                Name
              </th>
              <th className="p-5 font-black text-white text-sm uppercase tracking-wider border-r-2 border-black">
                Role
              </th>
              <th className="p-5 font-black text-white text-sm uppercase tracking-wider text-center border-r-2 border-black">
                Status
              </th>
              <th className="p-5 font-black text-white text-sm uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black">
            {users.map((u, index) => (
              <tr
                key={u.id || index}
                className="hover:bg-blue-50 transition-colors group"
              >
                <td className="p-5 border-r-2 border-black">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border-2 border-black bg-white flex items-center justify-center text-black font-black text-xl shadow-[2px_2px_0_0_black]">
                      {(u.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-black text-black text-base uppercase">
                        {u.name || "Unknown User"}
                      </div>
                      <div className="text-gray-500 text-sm font-bold flex items-center gap-1.5 mt-0.5 lowercase">
                        <Mail size={14} strokeWidth={2.5} />{" "}
                        {u.email || "No Email"}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="p-5 border-r-2 border-black">
                  <span className="inline-flex items-center px-3 py-1 text-xs font-black bg-[#4f46e5] text-white border-2 border-black uppercase tracking-wide shadow-[2px_2px_0_0_black]">
                    {u.role}
                  </span>
                </td>

                <td className="p-5 text-center border-r-2 border-black">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black border-2 border-black uppercase shadow-[2px_2px_0_0_black] ${
                      u.status === "active"
                        ? "bg-[#0d9488] text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {u.status === "active" ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="p-5 text-right">
                  {u.status !== "inactive" && (
                    <button
                      onClick={() => onDeactivate && onDeactivate(u.id)}
                      className="p-2 text-red-600 hover:bg-red-600 hover:text-white border-2 border-transparent hover:border-black transition-all"
                      title="Deactivate User"
                    >
                      <ShieldOff size={20} strokeWidth={2.5} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
