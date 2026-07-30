import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  TrendingUp,
  Loader2,
  DollarSign,
  Target,
} from "lucide-react";
import StatCard from "../../../components/StatCard";

const electron = window.electron || {};
const invoke =
  electron.invoke ||
  (async () => {
    console.error("Electron IPC not available");
    return [];
  });

export default function FundingDashboard() {
  const [dashboardData, setDashboardData] = useState([]);
  const [fundingByStage, setFundingByStage] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalProjects: 0,
    totalRequested: 0,
    totalApproved: 0,
    totalPending: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashData, stageData] = await Promise.all([
        invoke("funding:getDashboard"),
        invoke("funding:getByStage"),
      ]);

      const projects = dashData?.data || [];

      if (projects.length > 0) {
        const calculatedSummary = projects.reduce(
          (acc, p) => {
            acc.totalRequested += parseFloat(p.total_amount) || 0;
            acc.totalApproved += parseFloat(p.approved_amount) || 0;
            acc.totalPending += parseFloat(p.pending_amount) || 0;
            return acc;
          },
          {
            totalProjects: projects.length,
            totalRequested: 0,
            totalApproved: 0,
            totalPending: 0,
          },
        );

        setSummary(calculatedSummary);
      }

      setDashboardData(projects);
      setFundingByStage(stageData?.data || []);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusColor = (status) => {
    const s = status.toLowerCase();
    if (s === "approved") return "bg-green-500";
    if (s === "pending") return "bg-yellow-500";
    if (s === "rejected") return "bg-red-500";
    return "bg-gray-500";
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFFDF5] h-screen font-sans">
      <div className="p-6 lg:p-10 max-w-[1920px] mx-auto">
        <div className="mb-12">
          <span className="bg-black text-white px-3 py-1 font-bold text-sm uppercase tracking-wider mb-2 inline-block transform -rotate-1">
            Financial Overview
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-black mb-2 uppercase tracking-tighter">
            Funding{" "}
            <span className="bg-[#f59e0b] text-black px-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] italic inline-block transform rotate-1">
              Dashboard
            </span>
          </h1>
          <p className="text-xl text-slate-600 font-medium border-l-4 border-[#f59e0b] pl-4 italic mt-4">
            Overview of funding requests and approvals by project and stage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Total Projects"
            value={summary.totalProjects}
            icon={Target}
            bgClass="bg-[#a855f7]"
            textClass="text-white"
          />
          <StatCard
            title="Total Requested"
            value={`$${(summary.totalRequested || 0).toLocaleString("en-US", {
              maximumFractionDigits: 0,
            })}`}
            icon={DollarSign}
            bgClass="bg-[#3b82f6]"
            textClass="text-white"
          />
          <StatCard
            title="Total Approved"
            value={`$${(summary.totalApproved || 0).toLocaleString("en-US", {
              maximumFractionDigits: 0,
            })}`}
            icon={TrendingUp}
            bgClass="bg-[#22c55e]"
            textClass="text-white"
          />
          <StatCard
            title="Total Pending"
            value={`$${(summary.totalPending || 0).toLocaleString("en-US", {
              maximumFractionDigits: 0,
            })}`}
            icon={BarChart}
            bgClass="bg-[#eab308]"
            textClass="text-black"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed">
            <Loader2
              className="text-black animate-spin mb-4"
              size={40}
              strokeWidth={2}
            />
            <p className="text-black font-black text-xl uppercase">
              Loading dashboard data...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000]">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-black text-white px-4 py-2 font-bold text-xl uppercase tracking-widest border-2 border-transparent">
                  01
                </div>
                <h2 className="text-2xl font-black uppercase text-black tracking-tight">
                  Projects by Funding Status
                </h2>
              </div>

              {dashboardData.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-black scrollbar-track-gray-100">
                  {dashboardData.slice(0, 10).map((project, index) => (
                    <div
                      key={project.id}
                      className={`border-2 border-black p-4 transition-colors hover:bg-gray-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-[#FFFDF5]"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-black text-black text-lg uppercase">
                            {project.name}
                          </p>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            {project.domain}
                          </p>
                        </div>
                        <span className="inline-block px-3 py-1 bg-black text-white text-xs font-black border-2 border-black uppercase">
                          {project.stage}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 border-t-2 border-gray-200 pt-4">
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Requests
                          </p>
                          <p className="text-xl font-black text-black">
                            {project.total_requests || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">
                            Approved
                          </p>
                          <p className="text-lg font-black text-green-600">
                            $
                            {(
                              parseFloat(project.approved_amount) || 0
                            ).toLocaleString("en-US", {
                              maximumFractionDigits: 0,
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">
                            Pending
                          </p>
                          <p className="text-lg font-black text-yellow-600">
                            $
                            {(
                              parseFloat(project.pending_amount) || 0
                            ).toLocaleString("en-US", {
                              maximumFractionDigits: 0,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-300">
                  <p className="text-gray-500 font-bold uppercase">
                    No project data available
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000]">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-black text-white px-4 py-2 font-bold text-xl uppercase tracking-widest border-2 border-transparent">
                  02
                </div>
                <h2 className="text-2xl font-black uppercase text-black tracking-tight">
                  Funding Status by Stage
                </h2>
              </div>

              {fundingByStage.length > 0 ? (
                <div className="space-y-6">
                  {fundingByStage.map((stage) => (
                    <div
                      key={stage.stage}
                      className="border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all"
                    >
                      <div className="mb-4 pb-2 border-b-2 border-black">
                        <p className="font-black text-xl text-black uppercase tracking-tight">
                          {stage.stage}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {stage.statuses &&
                          Object.entries(stage.statuses).map(
                            ([statusKey, statusData]) => (
                              <div
                                key={statusKey}
                                className="flex items-center justify-between text-sm group"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-3 h-3 border-2 border-black ${getStatusColor(
                                      statusKey,
                                    )}`}
                                  ></div>
                                  <span className="font-bold text-gray-700 uppercase text-xs tracking-wide">
                                    {statusKey}
                                  </span>
                                  <span className="bg-gray-100 px-2 py-0.5 text-xs font-bold border border-gray-300 rounded-sm">
                                    {statusData.count}
                                  </span>
                                </div>
                                <span className="font-black text-black text-base group-hover:text-blue-600 transition-colors">
                                  $
                                  {(
                                    parseFloat(statusData.amount) || 0
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}
                                </span>
                              </div>
                            ),
                          )}
                        <div className="border-t-2 border-black pt-3 mt-3 flex items-center justify-between bg-gray-50 -mx-5 -mb-5 px-5 py-3">
                          <span className="font-black text-sm uppercase">
                            Total Volume
                          </span>
                          <span className="font-black text-xl text-black">
                            $
                            {(stage.total_amount || 0).toLocaleString("en-US", {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-300">
                  <p className="text-gray-500 font-bold uppercase">
                    No stage data available
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
