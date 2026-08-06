import React from "react";
import { Calendar, FileText, Image as ImageIcon } from "lucide-react";

const AnnouncementDetails = ({ announcement }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="p-2 space-y-8 bg-[#FFFDF5] font-sans">
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex items-center gap-3 mb-4 border-b-4 border-black pb-2 w-fit">
          <FileText size={24} strokeWidth={3} className="text-[#4f46e5]" />
          <h3 className="text-xl font-black uppercase tracking-tight">{announcement.title}</h3>
        </div>
        <p className="text-lg font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
          {announcement.body}
        </p>
      </div>

      {announcement.cover_image && (
        <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0_0_#000]">
          <div className="flex items-center gap-3 mb-2 opacity-60">
            <ImageIcon size={18} strokeWidth={3} />
            <span className="text-xs font-black uppercase tracking-widest">Cover Image</span>
          </div>
          <img src={announcement.cover_image} alt={announcement.title} className="w-full max-h-96 object-cover border-2 border-black" />
        </div>
      )}

      <div className="bg-[#eff6ff] border-4 border-black p-6 shadow-[4px_4px_0_0_#1e3a8a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar size={20} strokeWidth={3} className="text-[#1e3a8a]" />
          <span className="font-black text-xs uppercase text-gray-500">Publish Date</span>
        </div>
        <span className="font-bold text-black uppercase">{formatDate(announcement.published_at)}</span>
      </div>
    </div>
  );
};

export default AnnouncementDetails;