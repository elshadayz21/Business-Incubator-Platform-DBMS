import React from "react";
import {
  Users,
  FolderKanban,
  UserCheck,
  Calendar,
  ArrowRight,
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
  black: "#000000",
  white: "#FFFDF5",
  indigo: "#4f46e5",
  slate: "#0f172a",
  amber: "#f59e0b",
  teal: "#0d9488",
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_#000]">
          <p className="font-bold font-sans uppercase mb-1 border-b-2 border-black pb-1">
            {label}
          </p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className="font-bold text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value}
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
      title: "Total Users",
      value: "12,428",
      icon: Users,
      bgClass: "bg-[#4f46e5]",
      textClass: "text-white",
    },
    {
      id: 2,
      title: "Projects",
      value: "54,320",
      icon: FolderKanban,
      bgClass: "bg-[#0f172a]",
      textClass: "text-white",
    },
    {
      id: 3,
      title: "Mentors",
      value: "1,852",
      icon: UserCheck,
      bgClass: "bg-[#f59e0b]",
      textClass: "text-black",
    },
    {
      id: 4,
      title: "Workshops",
      value: "509",
      icon: Calendar,
      bgClass: "bg-white",
      textClass: "text-black",
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
    { day: "Day 1", users: 145 },
    { day: "Day 2", users: 178 },
    { day: "Day 3", users: 132 },
    { day: "Day 4", users: 98 },
    { day: "Day 5", users: 156 },
    { day: "Day 6", users: 165 },
    { day: "Day 7", users: 189 },
  ];

  const mentorsData = [
    { name: "Technology", value: 650 },
    { name: "Business", value: 480 },
    { name: "Design", value: 390 },
    { name: "Marketing", value: 332 },
  ];

  const workshopsData = [
    { status: "Completed", count: 285 },
    { status: "Ongoing", count: 142 },
    { status: "Scheduled", count: 82 },
  ];

  const PIE_COLORS = [THEME.indigo, THEME.slate, THEME.amber, THEME.teal];
  const WORKSHOP_COLORS = [THEME.slate, THEME.indigo, "#94a3b8"];

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFFDF5] h-screen text-black font-sans scrollbar-hide">
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
        <div className="mb-12">
          <span className="bg-black text-white px-3 py-1 font-bold text-sm uppercase tracking-wider mb-2 inline-block transform -rotate-1">
            System Overview
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-black mb-2 uppercase tracking-tighter">
            DASHBOARD{" "}
            <span className="bg-[#4f46e5] text-white px-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] italic inline-block transform rotate-1 text-4xl md:text-5xl">
              STATS
            </span>
          </h1>
          <p className="text-xl text-slate-600 font-medium border-l-4 border-[#4f46e5] pl-4 italic mt-4">
            Real-time metrics. Don't guess, measure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {stats.map((stat) => (
            <StatCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              bgClass={stat.bgClass}
              textClass={stat.textClass}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          <div className="lg:col-span-2 bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000]">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-black text-white px-4 py-2 font-bold text-xl uppercase tracking-widest border-2 border-transparent">
                01
              </div>
              <h2 className="text-3xl font-black uppercase text-black tracking-tight">
                Growth Trajectory
              </h2>
            </div>

            <div className="h-[350px] w-full border-2 border-black bg-[#FFFDF5] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis
                    dataKey="month"
                    stroke="#000"
                    tick={{ fill: "#000", fontWeight: "bold" }}
                    tickLine={{ stroke: "#000", strokeWidth: 2 }}
                    axisLine={{ stroke: "#000", strokeWidth: 3 }}
                  />
                  <YAxis
                    stroke="#000"
                    tick={{ fill: "#000", fontWeight: "bold" }}
                    tickLine={{ stroke: "#000", strokeWidth: 2 }}
                    axisLine={{ stroke: "#000", strokeWidth: 3 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{
                      paddingTop: "20px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke={THEME.indigo}
                    strokeWidth={4}
                    dot={{
                      fill: THEME.white,
                      stroke: "#000",
                      strokeWidth: 3,
                      r: 6,
                    }}
                    activeDot={{
                      r: 8,
                      stroke: "#000",
                      strokeWidth: 3,
                      fill: THEME.indigo,
                    }}
                    name="TOTAL USERS"
                  />
                  <Line
                    type="monotone"
                    dataKey="projects"
                    stroke={THEME.amber}
                    strokeWidth={4}
                    dot={{
                      fill: THEME.white,
                      stroke: "#000",
                      strokeWidth: 3,
                      r: 6,
                    }}
                    activeDot={{
                      r: 8,
                      stroke: "#000",
                      strokeWidth: 3,
                      fill: THEME.amber,
                    }}
                    name="PROJECTS"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000]">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-black text-white px-3 py-1 font-bold text-lg uppercase">
                02
              </div>
              <h2 className="text-2xl font-black uppercase text-black">
                Daily Influx
              </h2>
            </div>
            <div className="h-[300px] w-full border-2 border-black bg-[#FFFDF5] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userGrowthData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e5e5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    stroke="#000"
                    tick={{ fill: "#000", fontWeight: "bold", fontSize: 12 }}
                    axisLine={{ stroke: "#000", strokeWidth: 3 }}
                  />
                  <YAxis
                    stroke="#000"
                    tick={{ fill: "#000", fontWeight: "bold" }}
                    axisLine={{ stroke: "#000", strokeWidth: 3 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="users"
                    fill={THEME.slate}
                    radius={[0, 0, 0, 0]}
                    stroke="#000"
                    strokeWidth={2}
                    name="NEW USERS"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000]">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-black text-white px-3 py-1 font-bold text-lg uppercase">
                03
              </div>
              <h2 className="text-2xl font-black uppercase text-black">
                Expertise Distribution
              </h2>
            </div>
            <div className="h-[300px] w-full border-2 border-black bg-[#FFFDF5] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mentorsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="#000"
                    strokeWidth={2}
                  >
                    {mentorsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#0f172a] border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] text-white">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white text-black border-2 border-black px-3 py-1 font-bold text-lg uppercase">
                04
              </div>
              <h2 className="text-2xl font-black uppercase text-white">
                Workshop Status
              </h2>
            </div>
            <div className="h-[250px] w-full border-2 border-white bg-black/20 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={workshopsData}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="#fff"
                    tick={{ fill: "#fff", fontWeight: "bold" }}
                    axisLine={{ stroke: "#fff", strokeWidth: 2 }}
                  />
                  <YAxis
                    dataKey="status"
                    type="category"
                    stroke="#fff"
                    width={100}
                    tick={{ fill: "#fff", fontWeight: "bold" }}
                    axisLine={{ stroke: "#fff", strokeWidth: 2 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "2px solid #fff",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                    cursor={{ fill: "rgba(255,255,255,0.1)" }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 0, 0, 0]}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {workshopsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={WORKSHOP_COLORS[index]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
