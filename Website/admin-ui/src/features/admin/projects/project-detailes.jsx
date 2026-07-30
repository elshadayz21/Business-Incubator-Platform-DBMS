import {
  Check,
  X,
  XCircle,
  Calendar,
  Users,
  Target,
  FileText,
  Code,
  Globe,
  Github,
  DollarSign,
  MapPin,
  Lightbulb,
  Wrench,
} from "lucide-react";

const ProjectDetails = ({ project, onClose }) => {
  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#FFFDF5] w-full max-w-6xl max-h-[90vh] border-4 border-black shadow-[8px_8px_0_0_#000] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b-4 border-black flex items-center justify-between bg-black text-white">
          <h2 className="text-2xl font-black uppercase tracking-tight">
            Project Details
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-all hover:rotate-90 duration-300"
          >
            <XCircle size={32} strokeWidth={2.5} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-8 scrollbar-thin scrollbar-thumb-black scrollbar-track-transparent">
          <div className="bg-white border-4 border-black p-8 mb-8 shadow-[6px_6px_0_0_#000]">
            <h3 className="text-4xl font-black uppercase text-black mb-4 tracking-tighter leading-tight">
              {project.title || project.name}
            </h3>
            <p className="text-xl text-gray-600 font-bold border-l-4 border-[#4f46e5] pl-4 italic">
              "{project.short_description}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-black text-white p-2">
                  <Users size={20} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-black uppercase text-gray-500 tracking-wider">
                  Founder
                </span>
              </div>
              <p className="text-2xl font-black text-black uppercase tracking-tight">
                {project.founder}
              </p>
            </div>

            <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#4f46e5] text-white p-2 border-2 border-black">
                  <Target size={20} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-black uppercase text-gray-500 tracking-wider">
                  Domain
                </span>
              </div>
              <p className="text-2xl font-black text-black uppercase tracking-tight">
                {project.domain}
              </p>
            </div>

            <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#f59e0b] text-black p-2 border-2 border-black">
                  <FileText size={20} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-black uppercase text-gray-500 tracking-wider">
                  Stage
                </span>
              </div>
              <span className="inline-block px-4 py-1 text-sm font-black uppercase border-2 border-black bg-black text-white shadow-[2px_2px_0_0_gray]">
                {project.stage === "in-progress"
                  ? "In Progress"
                  : project.stage}
              </span>
            </div>

            <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#0f172a] text-white p-2 border-2 border-black">
                  <Users size={20} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-black uppercase text-gray-500 tracking-wider">
                  Team Type
                </span>
              </div>
              <p className="text-2xl font-black text-black uppercase tracking-tight">
                {project.team_type?.replace("-", " ") || "Individual"}
              </p>
            </div>

            <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#0d9488] text-white p-2 border-2 border-black">
                  <Users size={20} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-black uppercase text-gray-500 tracking-wider">
                  Team Size
                </span>
              </div>
              <p className="text-2xl font-black text-black uppercase tracking-tight">
                {project.team_count}{" "}
                {project.team_count === 1 ? "Member" : "Members"}
              </p>
            </div>

            <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white text-black p-2 border-2 border-black">
                  <Calendar size={20} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-black uppercase text-gray-500 tracking-wider">
                  Submitted
                </span>
              </div>
              <p className="text-2xl font-black text-black uppercase tracking-tight">
                {project.submitted_at}
              </p>
            </div>

            {project.funding_stage && (
              <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-[#22c55e] text-white p-2 border-2 border-black">
                    <DollarSign size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-black uppercase text-gray-500 tracking-wider">
                    Funding Stage
                  </span>
                </div>
                <p className="text-2xl font-black text-black uppercase tracking-tight">
                  {project.funding_stage}
                </p>
              </div>
            )}

            {project.target_market && (
              <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-[#ef4444] text-white p-2 border-2 border-black">
                    <MapPin size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-black uppercase text-gray-500 tracking-wider">
                    Target Market
                  </span>
                </div>
                <p className="text-2xl font-black text-black uppercase tracking-tight">
                  {project.target_market}
                </p>
              </div>
            )}

            <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-black text-white p-2 border-2 border-black">
                  <Check size={20} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-black uppercase text-gray-500 tracking-wider">
                  Approval Status
                </span>
              </div>
              {project.approval_status === "pending" && (
                <span className="inline-block bg-[#f59e0b] text-black px-4 py-2 text-sm font-black uppercase border-2 border-black shadow-[2px_2px_0_0_black]">
                  ⏳ Pending
                </span>
              )}
              {project.approval_status === "approved" && (
                <span className="inline-block bg-[#22c55e] text-white px-4 py-2 text-sm font-black uppercase border-2 border-black shadow-[2px_2px_0_0_black]">
                  ✓ Approved
                </span>
              )}
              {project.approval_status === "rejected" && (
                <span className="inline-block bg-[#ef4444] text-white px-4 py-2 text-sm font-black uppercase border-2 border-black shadow-[2px_2px_0_0_black]">
                  ✗ Rejected
                </span>
              )}
            </div>

            {project.looking_for_cofounders && (
              <div className="bg-[#eff6ff] border-4 border-[#1e3a8a] p-6 shadow-[4px_4px_0_0_#1e3a8a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1e3a8a] transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-[#1e3a8a] text-white p-2 border-2 border-black">
                    <Users size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-black uppercase text-[#1e3a8a] tracking-wider">
                    Co-founders
                  </span>
                </div>
                <p className="text-2xl font-black text-[#1e3a8a] uppercase tracking-tight">
                  Actively Looking
                </p>
              </div>
            )}
          </div>

          {project.problem && (
            <div className="bg-white border-4 border-black p-8 mb-8 shadow-[6px_6px_0_0_#000]">
              <div className="flex items-center gap-4 mb-4 border-b-4 border-black pb-4">
                <div className="bg-[#f59e0b] text-black p-2 border-2 border-black shadow-[2px_2px_0_0_black]">
                  <Lightbulb size={24} strokeWidth={2.5} />
                </div>
                <h4 className="text-2xl font-black uppercase text-black tracking-tight">
                  Problem Statement
                </h4>
              </div>
              <p className="text-lg text-gray-800 font-medium leading-relaxed">
                {project.problem}
              </p>
            </div>
          )}

          {project.solution && (
            <div className="bg-white border-4 border-black p-8 mb-8 shadow-[6px_6px_0_0_#000]">
              <div className="flex items-center gap-4 mb-4 border-b-4 border-black pb-4">
                <div className="bg-[#4f46e5] text-white p-2 border-2 border-black shadow-[2px_2px_0_0_black]">
                  <Wrench size={24} strokeWidth={2.5} />
                </div>
                <h4 className="text-2xl font-black uppercase text-black tracking-tight">
                  Solution
                </h4>
              </div>
              <p className="text-lg text-gray-800 font-medium leading-relaxed">
                {project.solution}
              </p>
            </div>
          )}

          {project.tech_stack && (
            <div className="bg-white border-4 border-black p-8 mb-8 shadow-[6px_6px_0_0_#000]">
              <div className="flex items-center gap-4 mb-6 border-b-4 border-black pb-4">
                <div className="bg-black text-white p-2 border-2 border-black shadow-[2px_2px_0_0_gray]">
                  <Code size={24} strokeWidth={2.5} />
                </div>
                <h4 className="text-2xl font-black uppercase text-black tracking-tight">
                  Tech Stack
                </h4>
              </div>
              <div className="flex flex-wrap gap-3">
                {project.tech_stack.split(",").map((tech, index) => (
                  <span
                    key={index}
                    className="bg-[#e0e7ff] text-[#3730a3] px-4 py-2 text-sm font-black uppercase border-2 border-[#3730a3] shadow-[2px_2px_0_0_#3730a3]"
                  >
                    {tech.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(project.github_url || project.demo_url) && (
            <div className="bg-white border-4 border-black p-8 mb-8 shadow-[6px_6px_0_0_#000]">
              <div className="flex items-center gap-4 mb-6 border-b-4 border-black pb-4">
                <div className="bg-[#0d9488] text-white p-2 border-2 border-black shadow-[2px_2px_0_0_black]">
                  <Globe size={24} strokeWidth={2.5} />
                </div>
                <h4 className="text-2xl font-black uppercase text-black tracking-tight">
                  Project Links
                </h4>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-3 bg-black text-white px-6 py-4 font-black uppercase border-4 border-black hover:bg-white hover:text-black transition-all shadow-[4px_4px_0_0_gray] hover:shadow-[2px_2px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <Github size={20} strokeWidth={2.5} />
                    View on GitHub
                  </a>
                )}
                {project.demo_url && (
                  <a
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-3 bg-[#4f46e5] text-white px-6 py-4 font-black uppercase border-4 border-black hover:bg-white hover:text-[#4f46e5] transition-all shadow-[4px_4px_0_0_black] hover:shadow-[2px_2px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <Globe size={20} strokeWidth={2.5} />
                    View Live Demo
                  </a>
                )}
              </div>
            </div>
          )}

          {project.approval_status === "pending" && (
            <div className="bg-white border-4 border-black p-8 shadow-[6px_6px_0_0_#000]">
              <h4 className="text-2xl font-black uppercase text-black mb-6 border-b-4 border-black pb-4 tracking-tight">
                Review Actions
              </h4>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex-1 bg-[#22c55e] text-white px-6 py-4 font-black text-lg uppercase border-4 border-black hover:bg-white hover:text-[#16a34a] transition-all flex items-center justify-center gap-3 shadow-[4px_4px_0_0_black] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
                  <Check size={24} strokeWidth={3} />
                  Approve Project
                </button>
                <button className="flex-1 bg-[#ef4444] text-white px-6 py-4 font-black text-lg uppercase border-4 border-black hover:bg-white hover:text-[#dc2626] transition-all flex items-center justify-center gap-3 shadow-[4px_4px_0_0_black] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
                  <X size={24} strokeWidth={3} />
                  Reject Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
