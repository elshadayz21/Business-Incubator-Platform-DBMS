import React, { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Search,
  FolderOpen,
  Loader2,
  PlayCircle,
  CheckCircle,
  Check,
  X,
  Layers,
  Lightbulb,
  Activity,
  Archive,
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
  }, [fetchProjects, fetchStats]);

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

  const handleToggleApproved = async (projectId) => {
    try {
      await invoke("projects:toggleApproved", projectId);
      await fetchProjects();
      await fetchStats();

      if (selectedProject && selectedProject.id === projectId) {
        const updatedProject = await invoke("projects:getById", projectId);
        setSelectedProject(updatedProject);
      }
    } catch (error) {
      console.error("Error toggling approved status:", error);
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
    <div className="flex-1 overflow-y-auto bg-[#FFFDF5] h-screen font-sans scrollbar-hide">
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="p-6 lg:p-10 max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-12">
          <span className="bg-black text-white px-3 py-1 font-bold text-sm uppercase tracking-wider mb-2 inline-block transform -rotate-1">
            Pipeline Overview
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-black mb-2 uppercase tracking-tighter">
            Projects{" "}
            <span className="bg-[#4f46e5] text-white px-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] italic inline-block transform rotate-1">
              Management
            </span>
          </h1>
          <p className="text-xl text-slate-600 font-medium border-l-4 border-[#4f46e5] pl-4 italic mt-4">
            Track progress, approve ideas, and manage deliverables.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <StatCard
            title="Total Projects"
            value={stats.total}
            icon={Layers}
            bgClass="bg-[#0f172a]"
            textClass="text-white"
          />
          <StatCard
            title="Idea Stage"
            value={stats.idea}
            icon={Lightbulb}
            bgClass="bg-[#f59e0b]"
            textClass="text-black"
          />
          <StatCard
            title="In Progress"
            value={stats.in_progress}
            icon={Activity}
            bgClass="bg-[#4f46e5]"
            textClass="text-white"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={Archive}
            bgClass="bg-[#0d9488]"
            textClass="text-white"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] mb-8 flex flex-col xl:flex-row gap-6 items-center justify-between">
          <div className="relative flex-1 w-full xl:w-auto">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={20}
              strokeWidth={2.5}
            />
            <input
              type="text"
              placeholder="SEARCH PROJECTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-black bg-[#FFFDF5] focus:outline-none focus:ring-0 focus:bg-white font-bold text-black placeholder-gray-500 transition-all uppercase"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            {["all", "idea", "in-progress", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-6 py-3 font-bold uppercase border-2 border-black transition-all shadow-[2px_2px_0_0_black] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_black] ${
                  filter === status
                    ? "bg-black text-white"
                    : "bg-white text-black"
                }`}
              >
                {status.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Table/Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed">
            <Loader2
              className="text-black animate-spin mb-4"
              size={40}
              strokeWidth={2}
            />
            <p className="text-black font-black text-xl uppercase">
              Loading projects...
            </p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-[#0f172a] border-b-4 border-black text-white">
                    <th className="p-5 font-black uppercase text-sm border-r-2 border-black">
                      Project
                    </th>
                    <th className="p-5 font-black uppercase text-sm border-r-2 border-black">
                      Domain
                    </th>
                    <th className="p-5 font-black uppercase text-sm border-r-2 border-black">
                      Stage
                    </th>
                    <th className="p-5 font-black uppercase text-sm border-r-2 border-black">
                      Team Type
                    </th>
                    <th className="p-5 font-black uppercase text-sm border-r-2 border-black">
                      Created
                    </th>
                    <th className="p-5 font-black uppercase text-sm border-r-2 border-black">
                      Status
                    </th>
                    <th className="p-5 font-black uppercase text-sm text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black">
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-blue-50 transition-colors group"
                    >
                      <td className="p-5 border-r-2 border-black">
                        <div className="font-black text-lg text-black uppercase">
                          {project.name}
                        </div>
                        <div className="text-sm text-gray-600 font-bold italic line-clamp-1">
                          {project.short_description}
                        </div>
                      </td>
                      <td className="p-5 border-r-2 border-black">
                        <span className="bg-black text-white px-3 py-1 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0_0_gray] whitespace-nowrap">
                          {project.domain}
                        </span>
                      </td>
                      <td className="p-5 border-r-2 border-black">
                        <span
                          className={`px-3 py-1 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0_0_black] whitespace-nowrap ${
                            project.stage === "completed"
                              ? "bg-[#0d9488] text-white"
                              : project.stage === "in-progress"
                                ? "bg-[#4f46e5] text-white"
                                : "bg-[#f59e0b] text-black"
                          }`}
                        >
                          {project.stage === "in-progress"
                            ? "In Progress"
                            : project.stage}
                        </span>
                      </td>
                      <td className="p-5 border-r-2 border-black font-bold text-gray-800 capitalize whitespace-nowrap">
                        {project.team_type?.replace("-", " ") || "N/A"}
                      </td>
                      <td className="p-5 border-r-2 border-black text-gray-700 font-bold text-sm">
                        {new Date(project.created_at).toLocaleDateString(
                          "en-GB",
                        )}
                      </td>
                      <td className="p-5 border-r-2 border-black">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`flex items-center gap-1 font-bold text-xs uppercase ${project.status === "completed" ? "text-green-600" : project.status === "in-progress" ? "text-purple-600" : "text-blue-600"}`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${project.status === "completed" ? "bg-green-600" : "animate-pulse " + (project.status === "in-progress" ? "bg-purple-600" : "bg-blue-600")}`}
                            ></div>
                            {project.status}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black uppercase border-2 w-fit ${project.approved ? "bg-green-100 text-green-800 border-green-800" : "bg-red-100 text-red-800 border-red-800"}`}
                          >
                            {project.approved ? "APPROVED" : "REJECTED"}
                          </span>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="flex gap-2 justify-center items-center">
                          <button
                            onClick={() => handleViewProject(project)}
                            className="p-2 bg-white text-black border-2 border-black shadow-[2px_2px_0_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_black] transition-all"
                          >
                            <Eye size={18} strokeWidth={2.5} />
                          </button>
                          {project.status === "idea" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(project.id, "in-progress")
                              }
                              className="p-2 bg-blue-600 text-white border-2 border-black shadow-[2px_2px_0_0_black] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                            >
                              <PlayCircle size={18} strokeWidth={2.5} />
                            </button>
                          )}
                          {project.status === "in-progress" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(project.id, "completed")
                              }
                              className="p-2 bg-[#0d9488] text-white border-2 border-black shadow-[2px_2px_0_0_black] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                            >
                              <CheckCircle size={18} strokeWidth={2.5} />
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleApproved(project.id)}
                            className={`p-2 text-white border-2 border-black shadow-[2px_2px_0_0_black] hover:translate-x-[1px] hover:translate-y-[1px] transition-all ${project.approved ? "bg-red-500" : "bg-green-500"}`}
                          >
                            {project.approved ? (
                              <X size={18} strokeWidth={2.5} />
                            ) : (
                              <Check size={18} strokeWidth={2.5} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed text-center">
            <div className="p-6 bg-gray-100 border-2 border-black rounded-full mb-6">
              <FolderOpen className="text-black" size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-black uppercase mb-2">
              No projects found
            </h2>
            <p className="text-gray-600 text-lg font-medium max-w-sm mb-8">
              Try adjusting your search or filters to see results.
            </p>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto border-4 border-black shadow-[8px_8px_0_0_black] animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b-4 border-black flex justify-end bg-[#FFFDF5]">
              <button
                onClick={handleCloseDetails}
                className="p-2 hover:bg-red-100 border-2 border-transparent hover:border-black transition-all"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>
            <ProjectDetails
              project={selectedProject}
              onClose={handleCloseDetails}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        </div>
      )}
    </div>
  );
}
