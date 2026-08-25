import React, { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Search,
  FolderOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  Layers,
  Lightbulb,
  Activity,
  Archive,
  Filter,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import ProjectDetails from "./project-detailes";
import StatCard from "../../../components/StatCard";

const electron = window.electron || {};
const invoke =
  electron.invoke ||
  (async () => {
    console.error("Electron IPC not available");
    return [];
  });

export default function Projects() {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    idea: 0,
    in_progress: 0,
    completed: 0,
  });

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [decisionModal, setDecisionModal] = useState(null);
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [notice, setNotice] = useState(null);

  const flashNotice = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".decision-dropdown-container")) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke("projects:getAll");
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await invoke("projects:getStats");
      setStats({
        total: parseInt(data?.total) || 0,
        idea: parseInt(data?.idea) || 0,
        in_progress: parseInt(data?.in_progress) || 0,
        completed: parseInt(data?.completed) || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateStatus = async (projectId, newStatus) => {
    try {
      await invoke("projects:updateStatus", {
        id: projectId,
        status: newStatus,
      });
      await fetchProjects();
      await fetchStats();

      if (selectedProject && selectedProject.id === projectId) {
        const updatedProject = await invoke("projects:getById", projectId);
        setSelectedProject(updatedProject);
      }
    } catch (error) {
      console.error("Error updating project status:", error);
    }
  };

  const openDecisionModal = (project, isApproval) => {
    const projectName = project.name || project.title || "Project";
    const defaultMsg = isApproval
      ? `🎉 Congratulations! Your project "${projectName}" has been approved for the DxValley Incubation Platform. Welcome to the cohort!`
      : `Thank you for your submission. Unfortunately, project "${projectName}" was not approved at this time. Reason: Incomplete requirements or domain mismatch.`;

    setDecisionModal({
      project,
      isApproval,
      message: defaultMsg,
    });
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!decisionModal || !decisionModal.project) return;

    setSubmittingDecision(true);
    try {
      await invoke("projects:updateApproval", {
        id: decisionModal.project.id,
        approved: decisionModal.isApproval,
        message: decisionModal.message,
      });

      flashNotice(
        "success",
        `Project "${decisionModal.project.name || decisionModal.project.title}" ${
          decisionModal.isApproval ? "APPROVED" : "REJECTED"
        }. Notification sent to entrepreneur.`
      );

      setDecisionModal(null);
      await fetchProjects();
      await fetchStats();

      if (selectedProject && selectedProject.id === decisionModal.project.id) {
        const updated = await invoke("projects:getById", decisionModal.project.id);
        setSelectedProject(updated);
      }
    } catch (error) {
      console.error("Error submitting decision:", error);
      flashNotice("error", error.message || "Failed to update project status.");
    } finally {
      setSubmittingDecision(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesFilter = filter === "all" || project.stage === filter;
    const matchesSearch =
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.domain?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleViewProject = async (project) => {
    try {
      const fullProject = await invoke("projects:getById", project.id);
      setSelectedProject(fullProject);
      setShowDetails(true);
    } catch (error) {
      console.error("Error fetching project details:", error);
    }
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedProject(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#D6E4EA] shadow-xs">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
            Incubation Pipeline
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] font-['Space_Grotesk']">
            Startup &amp; Project Management
          </h1>
          <p className="text-xs text-[#526274] mt-1">
            Track startup stages (Idea → MVP → Scale-up), review applications, approve/reject pending submissions, and send founder feedback.
          </p>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-sm font-bold ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle size={18} className="shrink-0 text-rose-600" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Projects"
          value={stats.total}
          icon={Layers}
          badgeText="All submissions"
          accentColor="cyan"
        />
        <StatCard
          title="Idea Stage"
          value={stats.idea}
          icon={Lightbulb}
          badgeText="Pending evaluation"
          accentColor="orange"
        />
        <StatCard
          title="In Progress (MVP)"
          value={stats.in_progress}
          icon={Activity}
          badgeText="Active building"
          accentColor="cyan"
        />
        <StatCard
          title="Scale-Up / Ready"
          value={stats.completed}
          icon={Archive}
          badgeText="Investment ready"
          accentColor="orange"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6E4EA] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by project name or domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium text-[#111827] outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-[#526274] flex items-center gap-1 mr-1">
            <Filter size={14} /> Stage:
          </span>
          {["all", "idea", "in-progress", "completed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all capitalize ${
                filter === status
                  ? "bg-[#00ADEF] text-white shadow-xs"
                  : "bg-[#F6FAFC] text-[#526274] border border-[#D6E4EA] hover:bg-[#EAF8FC] hover:text-[#006F9E]"
              }`}
            >
              {status === "all" ? "All Stages" : status.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#D6E4EA]">
          <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={32} />
          <p className="text-[#526274] font-bold text-sm">Loading projects database...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#D6E4EA] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#F6FAFC] border-b border-[#D6E4EA] text-[#526274] text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Startup Project</th>
                  <th className="p-4">Domain</th>
                  <th className="p-4">Stage</th>
                  <th className="p-4">Team</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6E4EA] text-sm">
                {filteredProjects.map((project) => {
                  const isApproved = project.approved === true || String(project.status).toLowerCase() === "approved";
                  const isRejected = String(project.status).toLowerCase() === "rejected";
                  const isPending = !isApproved && !isRejected;

                  return (
                    <tr key={project.id} className="hover:bg-[#F6FAFC] transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-[#111827] text-base">
                          {project.name}
                        </div>
                        <div className="text-xs text-[#526274] line-clamp-1 mt-0.5">
                          {project.short_description || "No description provided"}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full bg-[#EAF8FC] text-[#006F9E] text-xs font-bold border border-[#00ADEF]/20">
                          {project.domain || "General"}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                            project.stage === "completed"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                              : project.stage === "in-progress"
                              ? "bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/30"
                              : "bg-[#FFF1E3] text-[#E38524] border border-[#E38524]/30"
                          }`}
                        >
                          {project.stage === "in-progress" ? "MVP / Building" : project.stage}
                        </span>
                      </td>

                      <td className="p-4 text-xs font-semibold text-[#526274] capitalize">
                        {project.team_type?.replace("-", " ") || "Solo Founder"}
                      </td>

                      <td className="p-4 text-xs font-medium text-[#526274]">
                        {new Date(project.created_at).toLocaleDateString("en-GB")}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                              isApproved
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : isRejected
                                ? "bg-rose-100 text-rose-800 border border-rose-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                            }`}
                          >
                            {isApproved ? "APPROVED" : isRejected ? "REJECTED" : "PENDING"}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex gap-2 justify-center items-center">
                          <button
                            onClick={() => handleViewProject(project)}
                            title="View Details"
                            className="p-2 bg-[#F6FAFC] text-[#006F9E] border border-[#D6E4EA] rounded-xl hover:bg-[#EAF8FC] hover:border-[#00ADEF] transition-all cursor-pointer"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Decision Action: Only allowed once for Pending projects */}
                          {isPending ? (
                            <div className="relative inline-block text-left decision-dropdown-container">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenDropdownId(
                                    openDropdownId === project.id ? null : project.id
                                  )
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D6E4EA] bg-white text-xs font-bold text-[#111827] hover:bg-[#F6FAFC] hover:border-[#00ADEF] transition-all shadow-2xs cursor-pointer"
                              >
                                <span>Decision</span>
                                <ChevronDown
                                  size={14}
                                  className={`text-[#526274] transition-transform ${
                                    openDropdownId === project.id ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              {openDropdownId === project.id && (
                                <div className="absolute right-0 mt-1 w-44 rounded-xl border border-[#D6E4EA] bg-white shadow-xl z-50 py-1 font-sans text-xs">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdownId(null);
                                      openDecisionModal(project, true);
                                    }}
                                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left font-bold text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                                  >
                                    <CheckCircle2 size={16} />
                                    Approve Project
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdownId(null);
                                      openDecisionModal(project, false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left font-bold text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                                  >
                                    <XCircle size={16} />
                                    Reject Project
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : isApproved ? (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold cursor-not-allowed opacity-90"
                              title="Decision is finalized and cannot be modified"
                            >
                              <CheckCircle2 size={14} /> Approved
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold cursor-not-allowed opacity-90"
                              title="Decision is finalized and cannot be modified"
                            >
                              <XCircle size={14} /> Rejected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#D6E4EA] text-center p-6">
          <div className="p-4 bg-[#EAF8FC] rounded-full text-[#00ADEF] mb-3">
            <FolderOpen size={36} />
          </div>
          <h3 className="text-lg font-bold text-[#111827]">No projects match your query</h3>
          <p className="text-xs text-[#526274] mt-1 max-w-sm">
            Try adjusting your search criteria or resetting the stage filters above.
          </p>
        </div>
      )}

      {/* Decision Modal (Approve or Reject with custom message) */}
      {decisionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-[#D6E4EA] shadow-xl overflow-hidden font-sans">
            <div className="p-5 border-b border-[#D6E4EA] flex items-center justify-between bg-white">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] block">
                  Project Evaluation
                </span>
                <h2 className="text-lg font-bold text-[#111827] font-['Space_Grotesk'] flex items-center gap-2">
                  {decisionModal.isApproval ? (
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  ) : (
                    <XCircle size={20} className="text-rose-600" />
                  )}
                  {decisionModal.isApproval ? "Approve Project" : "Reject Project"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDecisionModal(null)}
                className="p-2 rounded-xl text-[#526274] hover:bg-[#F6FAFC] hover:text-[#111827] transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitDecision} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#526274] mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={
                    decisionModal.project.name || decisionModal.project.title || ""
                  }
                  readOnly
                  className="w-full px-4 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#526274] mb-1">
                  {decisionModal.isApproval
                    ? "Congratulatory Message for Founder"
                    : "Reason for Rejection"}
                </label>
                <textarea
                  rows="5"
                  required
                  value={decisionModal.message}
                  onChange={(e) =>
                    setDecisionModal((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  placeholder={
                    decisionModal.isApproval
                      ? "Write a congratulatory message..."
                      : "Explain why this project was rejected..."
                  }
                  className="w-full px-4 py-3 bg-white border border-[#D6E4EA] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#00ADEF] focus:ring-2 focus:ring-[#00ADEF]/20 resize-none leading-relaxed"
                />
                <p className="text-[11px] text-[#526274] mt-1.5">
                  This message will be sent as a notification directly to the entrepreneur(s) owner of this project.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D6E4EA]">
                <button
                  type="button"
                  onClick={() => setDecisionModal(null)}
                  disabled={submittingDecision}
                  className="px-4 py-2.5 rounded-xl border border-[#D6E4EA] text-xs font-bold text-[#526274] hover:bg-[#F6FAFC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision}
                  className={`px-6 py-2.5 rounded-xl text-white text-xs font-extrabold uppercase shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer ${
                    decisionModal.isApproval
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {submittingDecision ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : decisionModal.isApproval ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <XCircle size={16} />
                  )}
                  {decisionModal.isApproval
                    ? "Approve & Send Congratulation"
                    : "Reject & Send Reason"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl border border-[#D6E4EA] shadow-xl overflow-y-auto flex flex-col">
            <ProjectDetails
              project={selectedProject}
              onClose={handleCloseDetails}
              onUpdateStatus={handleUpdateStatus}
              onOpenDecisionModal={openDecisionModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}
