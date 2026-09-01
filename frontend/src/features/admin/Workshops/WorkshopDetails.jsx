import React from "react";
import {
  Calendar,
  Users,
  MapPin,
  User,
  BookOpen,
  Mail,
  CheckCircle2,
  Globe,
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

  // Normalize enrollments (admin API camelCase) into the shape this component uses
  const attendees = (Array.isArray(workshop.enrollments) ? workshop.enrollments : [])
      .map((e) => ({
        id: e.id,
        entrepreneur_id: e.entrepreneur_id ?? (e.entrepreneurId ?? null),
        name: e.entrepreneurName || e.name,
        email: e.entrepreneurEmail || e.email,
        attended: e.attended,
        enrollment_date: e.enrollmentDate || e.enrollment_date,
      }));

  const memberCount = attendees.filter((a) => a.entrepreneur_id).length;
  const publicCount = attendees.length - memberCount;
  const attendedCount = attendees.filter((a) => a.attended).length;

  return (
      <div className="space-y-6 font-sans">
        {/* Overview + Schedule Row */}
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

        {/* Analytics Row — capacity + attendance stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-white border border-[#D6E4EA] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 text-[#526274] text-xs font-bold mb-2">
              <Users size={16} className="text-[#00ADEF]" />
              <span>Capacity Utilization</span>
            </div>
            <p className="text-2xl font-extrabold text-[#111827] font-['Space_Grotesk']">
              {parseInt(workshop.enrolledCount || workshop.enrolled_count) || 0} /{" "}
              <span className="text-[#526274]">{parseInt(workshop.capacity) || 0}</span>
            </p>
            <div className="mt-3 h-2.5 rounded-full bg-[#F6FAFC] border border-[#D6E4EA] overflow-hidden">
              <div
                  className="h-full bg-gradient-to-r from-[#00ADEF] to-[#E38524] transition-all"
                  style={{
                    width: `${Math.min(100, Math.round(((parseInt(workshop.enrolledCount || workshop.enrolled_count) || 0) / (parseInt(workshop.capacity) || 1)) * 100))}%`,
                  }}
              />
            </div>
          </div>

          <div className="bg-white border border-[#D6E4EA] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 text-[#526274] text-xs font-bold mb-3">
              <CheckCircle2 size={16} className="text-[#E38524]" />
              <span>Reservation Breakdown</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl py-3">
                <p className="text-xl font-extrabold text-[#111827]">{attendees.length}</p>
                <p className="text-[10px] font-bold uppercase text-[#526274] mt-0.5">Total</p>
              </div>
              <div className="bg-[#EAF8FC] border border-[#00ADEF]/20 rounded-xl py-3">
                <p className="text-xl font-extrabold text-[#006F9E]">{memberCount}</p>
                <p className="text-[10px] font-bold uppercase text-[#526274] mt-0.5">Members</p>
              </div>
              <div className="bg-[#FFF1E3] border border-[#E38524]/20 rounded-xl py-3">
                <p className="text-xl font-extrabold text-[#E38524]">{publicCount}</p>
                <p className="text-[10px] font-bold uppercase text-[#526274] mt-0.5">Public</p>
              </div>
            </div>
            {attendedCount > 0 && (
                <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[#526274] text-center">
                  {attendedCount} marked as attended
                </p>
            )}
          </div>
        </div>

        {/* Attendees List — members AND public reservations */}
        <div className="bg-white border border-[#D6E4EA] rounded-2xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#D6E4EA] bg-[#F6FAFC]">
            <div className="flex items-center gap-2 text-[#006F9E] font-bold text-sm">
              <Users size={16} />
              <span>Reserved Seats ({attendees.length})</span>
            </div>
          </div>

          {attendees.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Users size={28} className="text-[#D6E4EA] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#526274]">No reservations yet</p>
                <p className="text-xs text-[#526274] mt-1">
                  Seats reserved via the public page or by members will appear here.
                </p>
              </div>
          ) : (
              <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#F6FAFC] z-10">
                  <tr className="text-[#526274] uppercase tracking-wider text-[10px] font-extrabold border-b border-[#D6E4EA]">
                    <th className="px-5 py-3">Attendee</th>
                    <th className="px-5 py-3 hidden md:table-cell">Email</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Reserved On</th>
                    <th className="px-5 py-3">Attendance</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6E4EA] text-sm">
                  {attendees.map((a) => (
                      <tr key={a.id} className="hover:bg-[#F6FAFC] transition">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#00ADEF] text-white text-xs font-bold">
                          {(a.name || "?").charAt(0).toUpperCase()}
                        </span>
                            <span className="font-bold text-[#111827]">{a.name || "Unnamed"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <a
                              href={`mailto:${a.email}`}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006F9E] hover:underline"
                          >
                            <Mail size={12} />
                            {a.email || "—"}
                          </a>
                        </td>
                        <td className="px-5 py-3">
                          {a.entrepreneur_id ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20 px-2.5 py-1 text-[10px] font-bold uppercase">
                          <User size={10} /> Member
                        </span>
                          ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1E3] text-[#E38524] border border-[#E38524]/20 px-2.5 py-1 text-[10px] font-bold uppercase">
                          <Globe size={10} /> Public
                        </span>
                          )}
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell text-xs text-[#526274] font-medium">
                          {a.enrollment_date
                              ? new Date(a.enrollment_date).toLocaleDateString("en-GB")
                              : "—"}
                        </td>
                        <td className="px-5 py-3">
                          {a.attended ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 text-[10px] font-bold uppercase">
                          <CheckCircle2 size={10} /> Attended
                        </span>
                          ) : (
                              <span className="text-[10px] font-bold text-[#526274] uppercase">Pending</span>
                          )}
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}
        </div>
      </div>
  );
};

export default WorkshopDetails;