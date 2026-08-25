import React from "react";
import { Calendar, Pencil, Trash2, Users } from "lucide-react";

const statusStyles = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-300",
  upcoming: "bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/30",
  completed: "bg-slate-100 text-slate-600 border-slate-300",
};

const CohortTable = ({ cohorts, onEdit, onDelete, onManage }) => {
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <div className="overflow-x-auto font-sans">
      <table className="w-full text-left border-collapse min-w-[850px]">
        <thead>
          <tr className="bg-[#F6FAFC] border-b border-[#D6E4EA] text-[#526274] text-xs font-bold uppercase tracking-wider">
            <th className="p-4">Name</th>
            <th className="p-4">Type</th>
            <th className="p-4">Timeline</th>
            <th className="p-4">Application Deadline</th>
            <th className="p-4 text-center">Status</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D6E4EA] text-sm">
          {cohorts.map((c) => (
            <tr key={c.id} className="hover:bg-[#F6FAFC] transition-colors">
              <td className="p-4">
                <div className="font-bold text-[#111827] text-sm">{c.name}</div>
              </td>
              <td className="p-4">
                <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FFF1E3] text-[#E38524] text-xs font-bold border border-[#E38524]/20 capitalize">
                  {c.type}
                </span>
              </td>
              <td className="p-4">
                <span className="font-medium text-[#111827] text-xs flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#526274]" />
                  {formatDate(c.start_date)} — {formatDate(c.end_date)}
                </span>
              </td>
              <td className="p-4">
                <span className="font-medium text-[#111827] text-xs">
                  {formatDate(c.application_deadline)}
                </span>
              </td>
              <td className="p-4 text-center">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize ${
                    statusStyles[c.status] || statusStyles.upcoming
                  }`}
                >
                  {c.status}
                </span>
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onManage(c)}
                    className="p-2 text-[#526274] hover:text-[#00ADEF] hover:bg-[#EAF8FC] rounded-xl border border-transparent hover:border-[#00ADEF]/20 transition-all"
                    title="Manage Members & Mentors"
                  >
                    <Users size={18} />
                  </button>
                  <button
                    onClick={() => onEdit(c)}
                    className="p-2 text-[#526274] hover:text-[#006F9E] hover:bg-[#EAF8FC] rounded-xl border border-transparent hover:border-[#00ADEF]/20 transition-all"
                    title="Edit Cohort"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-all"
                    title="Delete Cohort"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CohortTable;
