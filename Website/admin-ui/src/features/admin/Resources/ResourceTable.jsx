import React from "react";
import {
  MapPin,
  Users,
  LayoutGrid,
  Armchair,
  Monitor,
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
    switch (type) {
      case "meeting_room":
        return {
          icon: Armchair,
          label: "Meeting Room",
          style: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "equipment":
        return {
          icon: Monitor,
          label: "Equipment",
          style: "bg-[#FFF1E3] text-[#E38524] border-[#E38524]/20",
        };
      case "workspace":
      default:
        return {
          icon: LayoutGrid,
          label: "Workspace",
          style: "bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/20",
        };
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#D6E4EA]">
        <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={32} />
        <p className="text-[#526274] font-bold text-sm">Loading resources...</p>
      </div>
    );

  if (!resources || resources.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#D6E4EA] text-center p-6">
        <div className="p-4 bg-[#EAF8FC] rounded-full text-[#00ADEF] mb-3">
          <Inbox size={36} />
        </div>
        <h3 className="text-lg font-bold text-[#111827]">No resources found</h3>
        <p className="text-xs text-[#526274] mt-1 max-w-sm mb-6">
          Try adjusting your search criteria or add a new resource.
        </p>
        <button
          onClick={onAddClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E38524] text-white text-xs font-bold uppercase"
        >
          <Plus size={16} /> Add First Resource
        </button>
      </div>
    );

  return (
    <div className="overflow-x-auto font-sans">
      <table className="w-full text-left border-collapse min-w-[850px]">
        <thead>
          <tr className="bg-[#F6FAFC] border-b border-[#D6E4EA] text-[#526274] text-xs font-bold uppercase tracking-wider">
            <th className="p-4">Resource Name</th>
            <th className="p-4">Category</th>
            <th className="p-4">Location</th>
            <th className="p-4">Capacity</th>
            <th className="p-4 text-center">Status</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D6E4EA] text-sm">
          {resources.map((res) => {
            const badge = getTypeBadge(res.type);
            const BadgeIcon = badge.icon;
            return (
              <tr key={res.id} className="hover:bg-[#F6FAFC] transition-colors">
                <td className="p-4">
                  <div className="font-bold text-[#111827] text-sm">
                    {res.name}
                  </div>
                </td>

                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badge.style}`}
                  >
                    <BadgeIcon size={12} />
                    {badge.label}
                  </span>
                </td>

                <td className="p-4 text-xs font-medium text-[#526274]">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#00ADEF]" />
                    {res.location || "Main Center"}
                  </div>
                </td>

                <td className="p-4 text-xs font-bold text-[#111827]">
                  <div className="flex items-center gap-1.5">
                    <Users size={13} className="text-[#E38524]" />
                    {res.capacity} Seats
                  </div>
                </td>

                <td className="p-4 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      res.status === "available"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                        : "bg-slate-100 text-slate-600 border border-slate-300"
                    }`}
                  >
                    {res.status === "available" ? "Available" : "Maintenance"}
                  </span>
                </td>

                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit && onEdit(res)}
                      className="p-2 text-[#006F9E] hover:bg-[#EAF8FC] rounded-xl border border-[#D6E4EA] transition"
                      title="Edit Resource"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(res.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition"
                      title="Delete Resource"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ResourceTable;
