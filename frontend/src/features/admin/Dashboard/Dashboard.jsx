import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  FolderKanban,
  UserCheck,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatCard from "../../../components/StatCard";

const THEME = {
  cyan: "#00ADEF",
  cyanDark: "#006F9E",
  orange: "#E38524",
  ink: "#111827",
  muted: "#526274",
  line: "#D6E4EA",
};

const PIE_COLORS = [THEME.cyan, THEME.orange, THEME.cyanDark, THEME.muted];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#D6E4EA] p-3 rounded-xl shadow-md text-xs">
        <p className="font-bold text-[#111827] mb-1.5 border-b border-[#D6E4EA] pb-1">
          {label}
        </p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="font-bold py-0.5 flex items-center justify-between gap-4"
            style={{ color: entry.color }}
          >
            <span>{entry.name}:</span>
            <span>{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await window.electron.invoke("dashboard:get-overview");
      setOverview(data);
    } catch (err) {
      console.error("Error fetching dashboard overview:", err);
      setError("Couldn't load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#D6E4EA]">
        <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={32} />
        <p className="text-[#526274] font-bold text-sm">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#D6E4EA]">
        <p className="text-[#526274] font-bold text-sm mb-3">
          {error || "No dashboard data available."}
        </p>
        <button
          onClick={fetchOverview}
          className="px-4 py-2 rounded-xl bg-[#00ADEF] text-white font-extrabold text-xs uppercase tracking-wider"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, growthData, userGrowthData, mentorsData, workshopsData } = overview;

  const pctBadge = (pct, suffix) =>
    pct === null || pct === undefined ? suffix : `${pct >= 0 ? "+" : ""}${pct}% ${suffix}`;

  const statCards = [
    {
      id: 1,
      title: "Total Entrepreneurs",
      value: stats.totalEntrepreneurs.toLocaleString(),
      icon: Users,
      badgeText: pctBadge(stats.entrepreneurGrowthPct, "this month"),
      accentColor: "cyan",
    },
    {
      id: 2,
      title: "Incubated Startups",
      value: stats.totalStartups.toLocaleString(),
      icon: FolderKanban,
      badgeText: `${stats.approvedStartupsPct}% completed`,
      accentColor: "orange",
    },
    {
      id: 3,
      title: "Expert Mentors",
      value: stats.totalMentors.toLocaleString(),
      icon: UserCheck,
      badgeText: `${stats.activeMentorsPct}% active`,
      accentColor: "cyan",
    },
    {
      id: 4,
      title: "Workshops Hosted",
      value: stats.totalWorkshops.toLocaleString(),
      icon: Calendar,
      badgeText: `${stats.workshopsCompleted} completed`,
      accentColor: "orange",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            badgeText={stat.badgeText}
            accentColor={stat.accentColor}
          />
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Growth Trajectory Chart */}
        <div className="lg:col-span-8 bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#D6E4EA]">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                Ecosystem Performance
              </span>
              <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk']">
                Startup &amp; User Growth Trajectory
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#526274]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#00ADEF]" /> Total Entrepreneurs
              </span>
              <span className="flex items-center gap-1.5 ml-3">
                <span className="w-3 h-3 rounded-full bg-[#E38524]" /> Startups
              </span>
            </div>
          </div>

          <div className="h-[320px] w-full">
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" stroke="#526274" fontSize={12} tickLine={false} />
                  <YAxis stroke="#526274" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke={THEME.cyan}
                    strokeWidth={3}
                    dot={{ fill: THEME.cyan, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Total Entrepreneurs"
                  />
                  <Line
                    type="monotone"
                    dataKey="projects"
                    stroke={THEME.orange}
                    strokeWidth={3}
                    dot={{ fill: THEME.orange, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Startups"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#526274] text-center py-24">No growth data yet.</p>
            )}
          </div>
        </div>

        {/* Expertise Distribution Pie */}
        <div className="lg:col-span-4 bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
              Mentorship Focus
            </span>
            <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk'] mb-4">
              Sector Expertise
            </h2>
          </div>

          {mentorsData.length > 0 ? (
            <>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mentorsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {mentorsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#D6E4EA]">
                {mentorsData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-[#526274]">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      {item.name}
                    </span>
                    <span className="font-bold text-[#111827]">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-[#526274] text-center py-16">No mentors yet.</p>
          )}
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Registrations */}
        <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs">
          <div className="mb-6 pb-4 border-b border-[#D6E4EA]">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
              Weekly Activity
            </span>
            <h2 className="text-lg font-bold text-[#111827] font-['Space_Grotesk']">
              Daily Entrepreneur Registrations
            </h2>
          </div>

          <div className="h-[240px] w-full">
            {userGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="day" stroke="#526274" fontSize={12} tickLine={false} />
                  <YAxis stroke="#526274" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="users" fill={THEME.cyan} radius={[6, 6, 0, 0]} name="New Registrations" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#526274] text-center py-16">No registrations this week.</p>
            )}
          </div>
        </div>

        {/* Workshop Engagement */}
        <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs">
          <div className="mb-6 pb-4 border-b border-[#D6E4EA]">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
              Program Operations
            </span>
            <h2 className="text-lg font-bold text-[#111827] font-['Space_Grotesk']">
              Workshop Status Summary
            </h2>
          </div>

          <div className="h-[240px] w-full">
            {stats.totalWorkshops > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workshopsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" stroke="#526274" fontSize={12} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="status" type="category" stroke="#526274" fontSize={12} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Workshops">
                    <Cell fill={THEME.cyan} />
                    <Cell fill={THEME.orange} />
                    <Cell fill={THEME.cyanDark} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#526274] text-center py-16">No workshops yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
