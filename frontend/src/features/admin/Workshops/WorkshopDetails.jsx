import React from "react";
import {
  Calendar,
  Users,
  MapPin,
  User,
  BookOpen,
} from "lucide-react";

const WorkshopDetails = ({ workshop }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#006F9E] font-bold text-xs border-b border-[#D6E4EA] pb-3">
            <BookOpen size={16} />
            <span>Curriculum Overview</span>
          </div>
          <p className="text-sm text-[#111827] leading-relaxed italic">
            "{workshop.description || "No description provided for this session."}"
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl p-3.5">
              <span className="text-[11px] font-bold text-[#526274] block mb-1">
                Instructor
              </span>
              <p className="font-extrabold text-sm text-[#111827] flex items-center gap-1.5">
                <User size={14} className="text-[#00ADEF]" />
                {workshop.mentor || workshop.mentor_name || "Unassigned"}
              </p>
            </div>

            <div className="bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl p-3.5">
              <span className="text-[11px] font-bold text-[#526274] block mb-1">
                Location
              </span>
              <p className="font-extrabold text-sm text-[#111827] flex items-center gap-1.5">
                <MapPin size={14} className="text-[#E38524]" />
                {workshop.location || "Remote / TBD"}
              </p>
            </div>
          </div>
        </div>

        {/* Schedule Card */}
        <div className="bg-[#EAF8FC] border border-[#00ADEF]/20 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-[#006F9E] font-bold text-sm border-b border-[#00ADEF]/20 pb-3 mb-4">
              <Calendar size={18} />
              <span>Timing & Schedule</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#526274] font-medium">Starts</span>
                <span className="font-bold text-[#111827]">
                  {formatDate(workshop.startDate || workshop.start_date)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#526274] font-medium">Ends</span>
                <span className="font-bold text-[#111827]">
                  {formatDate(workshop.endDate || workshop.end_date)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#00ADEF]/15">
                <span className="text-[#526274] font-medium">Time Window</span>
                <span className="font-bold text-[#006F9E]">
                  {workshop.startTime || workshop.start_time || "-"} ➔{" "}
                  {workshop.endTime || workshop.end_time || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white/80 rounded-xl p-2.5 text-center text-xs font-bold text-[#006F9E] border border-[#00ADEF]/20">
            Status: <span className="uppercase text-[#E38524] ml-1">{workshop.status || "scheduled"}</span>
          </div>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 gap-5">
        <div className="bg-white border border-[#D6E4EA] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-[#526274] text-xs font-bold mb-2">
            <Users size={16} className="text-[#00ADEF]" />
            <span>Capacity Utilization</span>
          </div>
          <p className="text-2xl font-extrabold text-[#111827] font-['Space_Grotesk']">
            {parseInt(workshop.enrolledCount || workshop.enrolled_count) || 0} /{" "}
            <span className="text-[#526274]">{parseInt(workshop.capacity) || 0}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkshopDetails;
