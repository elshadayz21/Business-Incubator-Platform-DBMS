import React, { useState } from "react";
import {
  Calendar,
  User,
  Users,
  MoreHorizontal,
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
        bg: "bg-orange-50",
        text: "text-orange-700",
        border: "border-orange-100",
        icon: Clock,
      },
      ongoing: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-100",
        icon: AlertCircle,
      },
      completed: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-100",
        icon: CheckCircle,
      },
    };

    const config = styles[status] || styles.scheduled;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${config.bg} ${config.text} ${config.border}`}
      >
        <Icon size={12} />
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              <th className="p-5 font-semibold text-gray-500 text-sm uppercase tracking-wider w-12"></th>
              <th className="p-5 font-semibold text-gray-500 text-sm uppercase tracking-wider">
                Workshop Title
              </th>
              <th className="p-5 font-semibold text-gray-500 text-sm uppercase tracking-wider">
                Mentor
              </th>
              <th className="p-5 font-semibold text-gray-500 text-sm uppercase tracking-wider">
                Date Range
              </th>
              <th className="p-5 font-semibold text-gray-500 text-sm uppercase tracking-wider">
                Capacity
              </th>
              <th className="p-5 font-semibold text-gray-500 text-sm uppercase tracking-wider">
                Status
              </th>
              <th className="p-5 font-semibold text-gray-500 text-sm uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {workshops.map((workshop) => (
              <React.Fragment key={workshop.id}>
                <tr
                  className={`transition-colors group ${expandedId === workshop.id ? "bg-indigo-50/30" : "hover:bg-gray-50/80"}`}
                >
                  {/* Expand Button */}
                  <td className="p-5 pr-0">
                    <button
                      onClick={async () => {
                        if (expandedId === workshop.id) {
                          setExpandedId(null);
                        } else {
                          // Fetch full workshop details with enrollments
                          try {
                            const fullWorkshop =
                              await workshopService.getWorkshop(workshop.id);
                            setWorkshopDetails({
                              ...workshopDetails,
                              [workshop.id]: fullWorkshop,
                            });
                            setExpandedId(workshop.id);
                          } catch (error) {
                            console.error(
                              "Error fetching workshop details:",
                              error,
                            );
                            setExpandedId(workshop.id);
                          }
                        }
                      }}
                      className={`p-1 rounded-md transition-all ${expandedId === workshop.id ? "bg-indigo-100 text-indigo-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                    >
                      {expandedId === workshop.id ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                  </td>

                  {/* Title & Description */}
                  <td className="p-5">
                    <div>
                      <p className="font-bold text-gray-900 text-base">
                        {workshop.title || "Untitled"}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">
                        {workshop.description || "No description provided"}
                      </p>
                    </div>
                  </td>

                  {/* Mentor */}
                  <td className="p-5">
                    <div className="flex items-center gap-2 text-gray-700 font-medium">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs">
                        <User size={14} />
                      </div>
                      {workshop.mentor || workshop.mentor_name || "-"}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="p-5">
                    <div className="flex flex-col text-sm">
                      <span className="font-medium text-gray-900 flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(workshop.startDate || workshop.start_date)}
                      </span>
                      <span className="text-gray-500 pl-5 text-xs">
                        to {formatDate(workshop.endDate || workshop.end_date)}
                      </span>
                    </div>
                  </td>

                  {/* Capacity Progress */}
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(((workshop.enrolledCount || 0) / (workshop.capacity || 1)) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-gray-600">
                        {workshop.enrolledCount || 0}/{workshop.capacity || 0}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-5">{getStatusBadge(workshop.status)}</td>

                  {/* Actions */}
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(workshop)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(workshop.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Workshop"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded Enrollments Section */}
                {expandedId === workshop.id && (
                  <tr className="bg-gray-50/50">
                    <td
                      colSpan="7"
                      className="p-4 md:p-6 border-b border-gray-100"
                    >
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center gap-2">
                          <Users size={16} className="text-indigo-600" />
                          <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                            Enrolled Entrepreneurs
                          </h4>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                              <tr>
                                <th className="px-5 py-3 text-left font-medium">
                                  Name
                                </th>
                                <th className="px-5 py-3 text-left font-medium">
                                  Email
                                </th>
                                <th className="px-5 py-3 text-left font-medium">
                                  Joined
                                </th>
                                <th className="px-5 py-3 text-left font-medium">
                                  Attendance
                                </th>
                                <th className="px-5 py-3 text-left font-medium">
                                  Feedback
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {(workshopDetails[workshop.id]?.enrollments ||
                                workshop.enrollments) &&
                              (
                                workshopDetails[workshop.id]?.enrollments ||
                                workshop.enrollments
                              ).length > 0 ? (
                                (
                                  workshopDetails[workshop.id]?.enrollments ||
                                  workshop.enrollments
                                ).map((enrollment, idx) => {
                                  const name =
                                    enrollment.entrepreneurName ||
                                    enrollment.entrepreneur_name ||
                                    enrollment.name ||
                                    "-";
                                  const email =
                                    enrollment.entrepreneurEmail ||
                                    enrollment.entrepreneur_email ||
                                    enrollment.email ||
                                    "-";
                                  const enrollmentDate =
                                    enrollment.enrollmentDate ||
                                    enrollment.enrollment_date;
                                  const attended = enrollment.attended;
                                  const feedbackRating =
                                    enrollment.feedbackRating ||
                                    enrollment.feedback_rating;

                                  return (
                                    <tr
                                      key={idx}
                                      className="hover:bg-gray-50 transition-colors"
                                    >
                                      <td className="px-5 py-3 font-medium text-gray-900">
                                        {name}
                                      </td>
                                      <td className="px-5 py-3 text-gray-600">
                                        {email}
                                      </td>
                                      <td className="px-5 py-3 text-gray-500">
                                        {enrollmentDate
                                          ? new Date(
                                              enrollmentDate,
                                            ).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                            })
                                          : "-"}
                                      </td>
                                      <td className="px-5 py-3">
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${attended ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                                        >
                                          {attended ? (
                                            <CheckCircle size={10} />
                                          ) : (
                                            <AlertCircle size={10} />
                                          )}
                                          {attended ? "Present" : "Absent"}
                                        </span>
                                      </td>
                                      <td className="px-5 py-3">
                                        {feedbackRating ? (
                                          <span className="flex items-center gap-1 text-orange-500 font-bold">
                                            ★ {feedbackRating}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400 italic text-xs">
                                            Pending
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td
                                    colSpan="5"
                                    className="px-5 py-8 text-center text-gray-400 italic"
                                  >
                                    No enrollments found for this workshop.
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
