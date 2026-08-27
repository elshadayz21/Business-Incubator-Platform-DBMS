import React, { useState } from "react";
import {
  Calendar,
  User,
  Users,
  ChevronDown,
  ChevronUp,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { workshopService } from "../../../services/workshopService";

const WorkshopTable = ({ workshops, onView, onDelete }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [workshopDetails, setWorkshopDetails] = useState({});

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: {
        bg: "bg-[#FFF1E3]",
        text: "text-[#E38524]",
        border: "border-[#E38524]/20",
        icon: Clock,
      },
      ongoing: {
        bg: "bg-[#EAF8FC]",
        text: "text-[#006F9E]",
        border: "border-[#00ADEF]/20",
        icon: AlertCircle,
      },
      completed: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        icon: CheckCircle,
      },
    };

    const config = styles[status] || styles.scheduled;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${config.bg} ${config.text} ${config.border}`}
      >
        <Icon size={12} />
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateRange = (startStr, endStr) => {
    if (!startStr) return "-";

    const startDate = new Date(startStr);
    const endDate = endStr ? new Date(endStr) : null;

    const formatOpts = { month: "short", day: "numeric", year: "numeric" };

    // If there is no end date, OR the start and end are the exact same day
    if (!endDate || startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString("en-GB", formatOpts);
    }

    // If it's a multi-day workshop, show the range
    return `${startDate.toLocaleDateString("en-GB", formatOpts)} - ${endDate.toLocaleDateString("en-GB", formatOpts)}`;
  };

  return (
    <div className="w-full font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="bg-[#F6FAFC] border-b border-[#D6E4EA] text-[#526274] text-xs font-bold uppercase tracking-wider">
              <th className="p-4 w-10"></th>
              <th className="p-4">Workshop Title</th>
              <th className="p-4">Mentor Instructor</th>
              <th className="p-4">Date Range</th>
              <th className="p-4">Capacity</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D6E4EA] text-sm">
            {workshops.map((workshop) => (
              <React.Fragment key={workshop.id}>
                <tr className="hover:bg-[#F6FAFC] transition-colors">
                  <td className="p-4 pr-0">
                    <button
                      onClick={async () => {
                        if (expandedId === workshop.id) {
                          setExpandedId(null);
                        } else {
                          try {
                            const fullWorkshop =
                              await workshopService.getWorkshop(workshop.id);
                            setWorkshopDetails({
                              ...workshopDetails,
                              [workshop.id]: fullWorkshop,
                            });
                            setExpandedId(workshop.id);
                          } catch (error) {
                            console.error("Error fetching details:", error);
                            setExpandedId(workshop.id);
                          }
                        }
                      }}
                      className="p-1 rounded-lg text-[#526274] hover:bg-[#EAF8FC] hover:text-[#00ADEF]"
                    >
                      {expandedId === workshop.id ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </td>

                  <td className="p-4">
                    <div>
                      <p className="font-bold text-[#111827] text-sm">
                        {workshop.title || "Untitled"}
                      </p>
                      <p className="text-xs text-[#526274] truncate max-w-xs mt-0.5">
                        {workshop.description || "No description provided"}
                      </p>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#111827]">
                      <div className="w-7 h-7 rounded-full bg-[#EAF8FC] text-[#006F9E] flex items-center justify-center shrink-0">
                        <User size={14} />
                      </div>
                      {workshop.mentor || workshop.mentor_name || "Unassigned"}
                    </div>
                  </td>

                  <td className="p-4 text-xs font-medium text-[#526274]">
                    <div className="flex items-center gap-1.5 text-[#111827] font-bold">
                      <Calendar size={13} className="text-[#00ADEF]" />
                      {formatDateRange(workshop.startDate || workshop.start_date, workshop.endDate || workshop.end_date)}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-[#D6E4EA] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00ADEF] rounded-full"
                          style={{
                            width: `${Math.min(
                              ((workshop.enrolledCount || 0) / (workshop.capacity || 1)) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#111827]">
                        {workshop.enrolledCount || 0}/{workshop.capacity || 0}
                      </span>
                    </div>
                  </td>

                  <td className="p-4">{getStatusBadge(workshop.status)}</td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(workshop)}
                        className="p-2 text-[#006F9E] hover:bg-[#EAF8FC] rounded-xl border border-[#D6E4EA] transition"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(workshop.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition"
                        title="Delete Workshop"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>

                {expandedId === workshop.id && (
                  <tr className="bg-[#F6FAFC]">
                    <td colSpan="7" className="p-4">
                      <div className="bg-white border border-[#D6E4EA] rounded-xl p-4 shadow-2xs">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#D6E4EA]">
                          <Users size={16} className="text-[#00ADEF]" />
                          <h4 className="font-bold text-xs text-[#111827] uppercase tracking-wider">
                            Enrolled Entrepreneurs
                          </h4>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-[#F6FAFC] text-[#526274] font-bold text-left">
                                <th className="p-2.5">Entrepreneur Name</th>
                                <th className="p-2.5">Email</th>
                                <th className="p-2.5">Joined Date</th>
                                <th className="p-2.5">Attendance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D6E4EA]">
                              {(workshopDetails[workshop.id]?.enrollments ||
                                workshop.enrollments || []).length > 0 ? (
                                (workshopDetails[workshop.id]?.enrollments || workshop.enrollments).map((enrollment, idx) => (
                                  <tr key={idx} className="hover:bg-[#F6FAFC]">
                                    <td className="p-2.5 font-bold text-[#111827]">
                                      {enrollment.entrepreneurName || enrollment.name || "Entrepreneur"}
                                    </td>
                                    <td className="p-2.5 text-[#526274]">
                                      {enrollment.entrepreneurEmail || enrollment.email || "-"}
                                    </td>
                                    <td className="p-2.5 text-[#526274]">
                                      {formatDate(enrollment.enrollmentDate || enrollment.enrollment_date)}
                                    </td>
                                    <td className="p-2.5">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          enrollment.attended
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-rose-100 text-rose-800"
                                        }`}
                                      >
                                        {enrollment.attended ? "Present" : "Absent"}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="4" className="p-4 text-center text-[#526274] italic">
                                    No incubatee enrollments found for this workshop session.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkshopTable;
