import React from "react";
import {
  Calendar,
  Users,
  MapPin,
  User,
  Clock,
  BookOpen,
  Star,
  CheckCircle,
  XCircle,
  BarChart3,
  ClipboardList,
} from "lucide-react";

const WorkshopDetails = ({ workshop }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const enrollments = workshop?.enrollments || [];

  const attendanceCount = enrollments.filter((e) => e.attended).length;
  const attendanceRate =
    enrollments.length > 0
      ? ((attendanceCount / enrollments.length) * 100).toFixed(1)
      : 0;

  const feedbackResponses = enrollments.filter(
    (e) => e.feedbackRating || e.feedback_rating,
  );
  const averageFeedback =
    feedbackResponses.length > 0
      ? (
          feedbackResponses.reduce(
            (sum, e) => sum + (e.feedbackRating || e.feedback_rating || 0),
            0,
          ) / feedbackResponses.length
        ).toFixed(1)
      : 0;

  return (
    <div className="p-2 space-y-8 bg-[#FFFDF5] font-sans">
      {/* Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Description & Mentor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
            <div className="flex items-center gap-3 mb-4 border-b-4 border-black pb-2 w-fit">
              <BookOpen size={24} strokeWidth={3} className="text-[#4f46e5]" />
              <h3 className="text-xl font-black uppercase tracking-tight">
                Workshop Description
              </h3>
            </div>
            <p className="text-lg font-bold text-gray-800 leading-relaxed italic">
              "
              {workshop.description ||
                "No description provided for this session."}
              "
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0_0_#000]">
              <div className="flex items-center gap-3 mb-2 opacity-60">
                <User size={18} strokeWidth={3} />
                <span className="text-xs font-black uppercase tracking-widest">
                  Assigned Mentor
                </span>
              </div>
              <p className="text-2xl font-black uppercase text-black">
                {workshop.mentor || workshop.mentor_name || "UNASSIGNED"}
              </p>
            </div>

            <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0_0_#000]">
              <div className="flex items-center gap-3 mb-2 opacity-60">
                <MapPin size={18} strokeWidth={3} />
                <span className="text-xs font-black uppercase tracking-widest">
                  Location
                </span>
              </div>
              <p className="text-2xl font-black uppercase text-black">
                {workshop.location || "REMOTE / TBD"}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Schedule Card */}
        <div className="bg-[#eff6ff] border-4 border-black p-6 shadow-[6px_6px_0_0_#1e3a8a] flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <Calendar size={24} strokeWidth={3} className="text-[#1e3a8a]" />
            <h3 className="text-xl font-black uppercase text-[#1e3a8a]">
              Timing
            </h3>
          </div>

          <div className="space-y-4 flex-grow">
            <div className="flex justify-between items-center border-b-2 border-black/10 pb-2">
              <span className="font-black text-xs uppercase text-gray-500">
                Starts
              </span>
              <span className="font-bold text-black uppercase">
                {formatDate(workshop.startDate || workshop.start_date)}
              </span>
            </div>
            <div className="flex justify-between items-center border-b-2 border-black/10 pb-2">
              <span className="font-black text-xs uppercase text-gray-500">
                Ends
              </span>
              <span className="font-bold text-black uppercase">
                {formatDate(workshop.endDate || workshop.end_date)}
              </span>
            </div>
            <div className="flex justify-between items-center border-b-2 border-black/10 pb-2">
              <span className="font-black text-xs uppercase text-gray-500">
                Time Window
              </span>
              <span className="font-black text-black">
                {workshop.startTime || workshop.start_time || "-"} ➔{" "}
                {workshop.endTime || workshop.end_time || "-"}
              </span>
            </div>
          </div>

          <div className="mt-6 bg-black text-white p-3 text-center font-black uppercase text-sm shadow-[3px_3px_0_0_#4f46e5]">
            Timezone: Cairo (GMT+2)
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Capacity */}
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} strokeWidth={3} className="text-[#4f46e5]" />
            <h4 className="font-black uppercase text-sm tracking-widest">
              Enrollment Status
            </h4>
          </div>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-5xl font-black text-black">
              {parseInt(workshop.enrolledCount || workshop.enrolled_count) || 0}
            </span>
            <span className="text-xl font-bold text-gray-400 mb-1">
              / {parseInt(workshop.capacity) || 0}
            </span>
          </div>
          <div className="w-full bg-gray-200 h-6 border-2 border-black mb-2 overflow-hidden">
            <div
              className="bg-[#4f46e5] h-full border-r-2 border-black transition-all"
              style={{
                width: `${Math.min(((parseInt(workshop.enrolledCount || workshop.enrolled_count) || 0) / (parseInt(workshop.capacity) || 1)) * 100, 100)}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-[#f0fdf4] border-4 border-black p-6 shadow-[6px_6px_0_0_#16a34a]">
          <div className="flex items-center gap-2 mb-4 text-[#16a34a]">
            <CheckCircle size={20} strokeWidth={3} />
            <h4 className="font-black uppercase text-sm tracking-widest">
              Attendance Rate
            </h4>
          </div>
          <p className="text-5xl font-black text-black mb-2">
            {attendanceRate}%
          </p>
          <p className="font-bold text-sm text-[#16a34a] uppercase">
            {attendanceCount} Students Present
          </p>
        </div>

        {/* Feedback */}
        <div className="bg-[#fffbeb] border-4 border-black p-6 shadow-[6px_6px_0_0_#f59e0b]">
          <div className="flex items-center gap-2 mb-4 text-[#f59e0b]">
            <Star size={20} strokeWidth={3} />
            <h4 className="font-black uppercase text-sm tracking-widest">
              Avg Feedback
            </h4>
          </div>
          <p className="text-5xl font-black text-black mb-2">
            {averageFeedback === 0 ? "N/A" : `${averageFeedback}`}
          </p>
          <p className="font-bold text-sm text-[#d97706] uppercase">
            From {feedbackResponses.length} Responses
          </p>
        </div>
      </div>

      {/* Attendees Table Section */}
      <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] overflow-hidden">
        <div className="bg-[#0f172a] p-4 border-b-4 border-black flex items-center gap-3">
          <ClipboardList className="text-white" size={24} />
          <h3 className="text-white font-black uppercase tracking-tight">
            Enrolled Entrepreneurs
          </h3>
        </div>

        {enrollments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-black">
                  <th className="px-6 py-4 font-black uppercase text-xs border-r-2 border-black/10">
                    Full Name
                  </th>
                  <th className="px-6 py-4 font-black uppercase text-xs border-r-2 border-black/10">
                    Email Address
                  </th>
                  <th className="px-6 py-4 font-black uppercase text-xs border-r-2 border-black/10 text-center">
                    Attendance
                  </th>
                  <th className="px-6 py-4 font-black uppercase text-xs border-r-2 border-black/10 text-center">
                    Rating
                  </th>
                  <th className="px-6 py-4 font-black uppercase text-xs">
                    Comment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/5">
                {enrollments.map((attendee) => (
                  <tr
                    key={attendee.id}
                    className="hover:bg-[#FFFDF5] transition-colors"
                  >
                    <td className="px-6 py-4 font-black text-black uppercase border-r-2 border-black/5">
                      {attendee.entrepreneurName ||
                        attendee.entrepreneur_name ||
                        attendee.name ||
                        "-"}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-500 lowercase border-r-2 border-black/5">
                      {attendee.entrepreneurEmail ||
                        attendee.entrepreneur_email ||
                        attendee.email ||
                        "-"}
                    </td>
                    <td className="px-6 py-4 text-center border-r-2 border-black/5">
                      {attendee.attended ? (
                        <span className="bg-[#dcfce7] text-[#166534] border-2 border-[#166534] px-3 py-1 font-black text-[10px] uppercase shadow-[2px_2px_0_0_#166534]">
                          Present
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-400 border-2 border-gray-400 px-3 py-1 font-black text-[10px] uppercase shadow-[2px_2px_0_0_gray]">
                          Absent
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center border-r-2 border-black/5">
                      <div className="flex justify-center items-center gap-1 font-black text-black">
                        {attendee.feedbackRating || attendee.feedback_rating ? (
                          <>
                            {" "}
                            <Star
                              size={14}
                              fill="currentColor"
                              className="text-[#f59e0b]"
                            />{" "}
                            {attendee.feedbackRating ||
                              attendee.feedback_rating}{" "}
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-600 italic line-clamp-1 max-w-xs">
                        {attendee.feedbackComment || attendee.feedback_comment
                          ? `"${attendee.feedbackComment || attendee.feedback_comment}"`
                          : "No comment"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center bg-white border-dashed border-4 border-gray-200 m-4">
            <p className="font-black text-gray-400 uppercase tracking-widest">
              No active enrollments found
            </p>
          </div>
        )}
      </div>

      {/* Current Status Footer */}
      <div className="flex justify-center pt-4">
        <div
          className={`px-12 py-5 border-4 border-black font-black text-3xl uppercase tracking-tighter shadow-[8px_8px_0_0_#000] transform -rotate-1 ${
            workshop.status === "ongoing"
              ? "bg-[#f59e0b] text-black"
              : workshop.status === "completed"
                ? "bg-[#0d9488] text-white"
                : "bg-[#4f46e5] text-white"
          }`}
        >
          {workshop.status || "scheduled"}
        </div>
      </div>
    </div>
  );
};

export default WorkshopDetails;
