import React from "react";
import {
  Users,
  FolderKanban,
  UserCheck,
  Calendar,
  TrendingUp,
  Sparkles,
  Building2,
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
  Legend,
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
  const stats = [
    {
      id: 1,
      title: "Total Entrepreneurs",
      value: "12,428",
      icon: Users,
      badgeText: "+18% this cohort",
      accentColor: "cyan",
    },
    {
      id: 2,
      title: "Incubated Startups",
      value: "54,320",
      icon: FolderKanban,
      badgeText: "+24% active",
      accentColor: "orange",
    },
    {
      id: 3,
      title: "Expert Mentors",
      value: "1,852",
      icon: UserCheck,
      badgeText: "85% assigned",
      accentColor: "cyan",
    },
    {
      id: 4,
      title: "Workshops Hosted",
      value: "509",
      icon: Calendar,
      badgeText: "+12 completed",
      accentColor: "orange",
    },
  ];

  const growthData = [
    { month: "Jan", users: 8000, projects: 30000 },
    { month: "Feb", users: 8500, projects: 35000 },
    { month: "Mar", users: 9200, projects: 38000 },
    { month: "Apr", users: 9800, projects: 42000 },
    { month: "May", users: 10500, projects: 45000 },
    { month: "Jun", users: 11200, projects: 48000 },
    { month: "Jul", users: 11800, projects: 50000 },
    { month: "Aug", users: 12428, projects: 54320 },
  ];

  const userGrowthData = [
    { day: "Mon", users: 145 },
    { day: "Tue", users: 178 },
    { day: "Wed", users: 132 },
    { day: "Thu", users: 198 },
    { day: "Fri", users: 156 },
    { day: "Sat", users: 165 },
    { day: "Sun", users: 189 },
  ];

  const mentorsData = [
    { name: "FinTech & Banking", value: 650 },
    { name: "AgriTech", value: 480 },
    { name: "MSME & Retail", value: 390 },
    { name: "Tech & Software", value: 332 },
  ];

  const workshopsData = [
    { status: "Completed", count: 285 },
    { status: "Ongoing", count: 142 },
    { status: "Scheduled", count: 82 },
  ];

  const PIE_COLORS = [THEME.cyan, THEME.orange, THEME.cyanDark, THEME.muted];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#00ADEF] via-[#078CC8] to-[#0878B4] rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full border-30 border-white/10" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider text-white">
            <Sparkles size={12} className="text-[#E38524]" />
            DxValley Incubation Center • Analytics Overview
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk']">
            Dashboard Overview
          </h1>
          <p className="text-sm text-white/85 max-w-2xl leading-relaxed">
            Real-time tracking of cohort progress, mentorship assignments, workshop engagements, and startup milestones under Cooperative Bank of Oromia.
          </p>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
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
      <button
          onClick={() => window.location.href = '/api/admin/reports/export/dashboard'}
          className="px-4 py-2 rounded-xl bg-[#E38524] text-white text-xs font-bold shadow-xs hover:bg-[#C97019] transition flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export to Excel
      </button>

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
                <span className="w-3 h-3 rounded-full bg-[#00ADEF]" /> Total Users
              </span>
              <span className="flex items-center gap-1.5 ml-3">
                <span className="w-3 h-3 rounded-full bg-[#E38524]" /> Startups
              </span>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#526274" fontSize={12} tickLine={false} />
                <YAxis stroke="#526274" fontSize={12} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke={THEME.cyan}
                  strokeWidth={3}
                  dot={{ fill: THEME.cyan, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Total Users"
                />
                <Line
                  type="monotone"
                  dataKey="projects"
                  stroke={THEME.orange}
                  strokeWidth={3}
                  dot={{ fill: THEME.orange, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Incubated Startups"
                />
              </LineChart>
            </ResponsiveContainer>
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
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" stroke="#526274" fontSize={12} tickLine={false} />
                <YAxis stroke="#526274" fontSize={12} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="users"
                  fill={THEME.cyan}
                  radius={[6, 6, 0, 0]}
                  name="New Registrations"
                />
              </BarChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workshopsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" stroke="#526274" fontSize={12} tickLine={false} />
                <YAxis dataKey="status" type="category" stroke="#526274" fontSize={12} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Workshops">
                  <Cell fill={THEME.cyan} />
                  <Cell fill={THEME.orange} />
                  <Cell fill={THEME.cyanDark} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
