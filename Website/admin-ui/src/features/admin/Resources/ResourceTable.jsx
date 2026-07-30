import React from "react";
import {
  MapPin,
  Users,
  LayoutGrid,
  Armchair,
  Monitor,
  MoreHorizontal,
  Loader2,
  Inbox,
  Plus,
  Trash2,
  Edit2,
} from "lucide-react";

const ResourceTable = ({
  resources,
  loading,
  onAddClick,
  onEdit,
  onDelete,
}) => {
  const getTypeBadge = (type) => {
    const baseStyle =
      "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black border-2 border-black uppercase tracking-wide shadow-[2px_2px_0_0_black]";
    switch (type) {
      case "meeting_room":
        return {
          icon: Armchair,
          label: "Meeting Room",
          style: `${baseStyle} bg-purple-400 text-black`,
        };
      case "equipment":
        return {
          icon: Monitor,
          label: "Equipment",
          style: `${baseStyle} bg-orange-400 text-black`,
        };
      case "workspace":
      default:
        return {
          icon: LayoutGrid,
          label: "Workspace",
          style: `${baseStyle} bg-blue-400 text-black`,
        };
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border-4 border-black border-dashed">
        <Loader2
          className="text-black animate-spin mb-4"
          size={40}
          strokeWidth={3}
        />
        <p className="text-black font-black text-xl uppercase tracking-tighter">
          Loading resources...
        </p>
      </div>
    );

  if (!resources || resources.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed text-center shadow-[8px_8px_0_0_#000]">
        <div className="p-6 bg-gray-100 border-2 border-black rounded-full mb-6">
          <Inbox className="text-black" size={48} strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-black text-black uppercase mb-2 tracking-tight">
          No resources found
        </h2>
        <p className="text-gray-600 text-lg font-medium max-w-sm mb-8">
          Try adjusting your search or add a new resource to your inventory.
        </p>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 bg-[#4f46e5] text-white px-8 py-3 font-black uppercase border-2 border-black shadow-[4px_4px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          <Plus size={20} strokeWidth={3} /> Add First Resource
        </button>
      </div>
    );

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-[#0f172a] text-white border-b-4 border-black">
              <th className="p-5 font-black uppercase text-sm border-r-2 border-white/20">
                Resource Name
              </th>
              <th className="p-5 font-black uppercase text-sm border-r-2 border-white/20">
                Type
              </th>
              <th className="p-5 font-black uppercase text-sm border-r-2 border-white/20">
                Location
              </th>
              <th className="p-5 font-black uppercase text-sm border-r-2 border-white/20">
                Capacity
              </th>
              <th className="p-5 font-black uppercase text-sm border-r-2 border-white/20 text-center">
                Status
              </th>
              <th className="p-5 font-black uppercase text-sm text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black">
            {resources.map((res) => {
              const badge = getTypeBadge(res.type);
              const BadgeIcon = badge.icon;
              return (
                <tr
                  key={res.id}
                  className="hover:bg-blue-50 transition-colors group"
                >
                  <td className="p-5 border-r-2 border-black">
                    <div className="font-black text-black text-lg uppercase tracking-tight">
                      {res.name}
                    </div>
                  </td>
                  <td className="p-5 border-r-2 border-black">
                    <span className={badge.style}>
                      <BadgeIcon size={14} strokeWidth={2.5} />
                      {badge.label}
                    </span>
                  </td>
                  <td className="p-5 border-r-2 border-black">
                    <div className="flex items-center gap-2 text-black font-bold text-sm uppercase">
                      <MapPin
                        size={16}
                        className="text-[#4f46e5]"
                        strokeWidth={2.5}
                      />
                      {res.location}
                    </div>
                  </td>
                  <td className="p-5 border-r-2 border-black text-black font-black text-lg uppercase">
                    <div className="flex items-center gap-2">
                      <Users
                        size={18}
                        className="text-[#0d9488]"
                        strokeWidth={2.5}
                      />
                      {res.capacity}{" "}
                      <span className="text-xs text-gray-500 font-bold">
                        Seats
                      </span>
                    </div>
                  </td>
                  <td className="p-5 text-center border-r-2 border-black">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black border-2 border-black uppercase shadow-[2px_2px_0_0_black] ${
                        res.status === "available"
                          ? "bg-[#22c55e] text-black"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 border border-black rounded-full ${
                          res.status === "available"
                            ? "bg-white"
                            : "bg-gray-400"
                        }`}
                      ></span>
                      {res.status === "available" ? "Available" : "Maintenance"}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => onEdit && onEdit(res)}
                        className="p-2 bg-white text-black border-2 border-black shadow-[2px_2px_0_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_black] transition-all"
                        title="Edit Resource"
                      >
                        <Edit2 size={18} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => onDelete && onDelete(res.id)}
                        className="p-2 bg-red-500 text-white border-2 border-black shadow-[2px_2px_0_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_black] transition-all"
                        title="Delete Resource"
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResourceTable;
