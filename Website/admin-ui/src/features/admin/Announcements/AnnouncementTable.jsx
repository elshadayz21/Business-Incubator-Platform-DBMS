import React from "react";
import { Calendar, Eye, Trash2, CheckCircle, Clock } from "lucide-react";

const AnnouncementTable = ({ announcements, onView, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const getStatusBadge = (published_at) => {
    const isPublished = published_at && new Date(published_at) <= new Date();
    return isPublished ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize bg-green-50 text-green-700 border-green-100">
        <CheckCircle size={12} /> Published
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize bg-orange-50 text-orange-700 border-orange-100">
        <Clock size={12} /> Scheduled
      </span>
    );
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              <th className="p-5 font-semibold text-gray-500 text-sm uppercase tracking-wider">Title</th>
              <th className="p-5 font-semibold text-gray-500 text-sm uppercase tracking-wider">Publish Date</th>
              <th className="p-5 font-semibold text-gray-500 text-sm uppercase tracking-wider">Status</th>
              <th className="p-5 font-semibold text-gray-500 text-sm uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {announcements.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="p-5">
                  <p className="font-bold text-gray-900 text-base">{a.title || "Untitled"}</p>
                  <p className="text-sm text-gray-500 mt-0.5 truncate max-w-md">
                    {(a.body || "No content").slice(0, 100)}
                  </p>
                </td>
                <td className="p-5">
                  <span className="font-medium text-gray-900 flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    {formatDate(a.published_at)}
                  </span>
                </td>
                <td className="p-5">{getStatusBadge(a.published_at)}</td>
                <td className="p-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onView(a)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View Details">
                      <Eye size={18} />
                    </button>
                    <button onClick={() => onDelete(a.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete Announcement">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnnouncementTable;