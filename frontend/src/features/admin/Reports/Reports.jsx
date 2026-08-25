import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Download,
  Loader2,
  Users2,
  GraduationCap,
  Layers,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import StatCard from "../../../components/StatCard";

const PIE_COLORS = ["#00ADEF", "#E38524", "#0d9488", "#526274"];

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/reports/summary", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Error fetching report summary:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/admin/reports/export", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dxvalley-cohort-report.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Failed to export report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#D6E4EA]">
          <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={32} />
          <p className="text-[#526274] font-bold text-sm">
            Loading report data...
          </p>
        </div>
    );
  }

  const totalApplicants = (summary?.applicantsByCohort || []).reduce(
      (sum, r) => sum + Number(r.count),
      0
  );
  const activeMentors = (summary?.mentorLoad || []).length;
  const totalCohorts = (summary?.cohorts || []).length;

  const cohortNameById = Object.fromEntries(
      (summary?.cohorts || []).map((c) => [c.id, c.name])
  );
  const applicantsChartData = (summary?.applicantsByCohort || []).map((r) => ({
    name: cohortNameById[r.cohort_id] || `Cohort #${r.cohort_id}`,
    applicants: Number(r.count),
  }));

  const statusChartData = (summary?.statusBreakdown || []).map((r) => ({
    name: r.name,
    value: Number(r.value),
  }));

  return (
      <div className="space-y-6 font-sans">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#00ADEF] via-[#078CC8] to-[#0878B4] rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full border-30 border-white/10" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider text-white">
                <BarChart3 size={12} className="text-[#E38524]" />
                Analytics
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk']">
                Reports
              </h1>
              <p className="text-sm text-white/85 max-w-2xl leading-relaxed">
                Cohort performance, applicant distribution, and mentor load at a
                glance.
              </p>
            </div>
            <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all shrink-0 disabled:opacity-60"
            >
              {exporting ? (
                  <Loader2 size={18} className="animate-spin" />
              ) : (
                  <Download size={18} />
              )}
              <span>{exporting ? "Exporting..." : "Download Report"}</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
              title="Total Cohorts"
              value={totalCohorts}
              icon={Layers}
              badgeText="All time"
              accentColor="cyan"
          />
          <StatCard
              title="Total Applicants"
              value={totalApplicants}
              icon={Users2}
              badgeText="Across all cohorts"
              accentColor="orange"
          />
          <StatCard
              title="Active Mentors"
              value={activeMentors}
              icon={GraduationCap}
              badgeText="With assignments"
              accentColor="cyan"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-[#D6E4EA] shadow-xs p-6">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#006F9E] mb-1">
              Ecosystem Performance
            </p>
            <h3 className="text-lg font-bold text-[#111827] font-['Space_Grotesk'] mb-4">
              Applicants by Cohort
            </h3>
            {applicantsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={applicantsChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D6E4EA" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#526274" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#526274" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #D6E4EA" }} />
                    <Bar dataKey="applicants" fill="#00ADEF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-sm text-[#526274] py-16 text-center">
                  No applicant data yet.
                </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#D6E4EA] shadow-xs p-6">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#006F9E] mb-1">
              Program Status
            </p>
            <h3 className="text-lg font-bold text-[#111827] font-['Space_Grotesk'] mb-4">
              Cohorts by Status
            </h3>
            {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                      {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #D6E4EA" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-sm text-[#526274] py-16 text-center">
                  No cohort data yet.
                </p>
            )}
          </div>
        </div>
      </div>
  );
};

export default Reports;