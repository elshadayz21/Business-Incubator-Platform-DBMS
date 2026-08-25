import React, { useState, useEffect, useCallback } from "react";
import {
  Server,
  Database,
  ShieldCheck,
  Users,
  FolderKanban,
  Layers,
  FileText,
  HandCoins,
  UserCheck,
  ClipboardList,
  Loader2,
} from "lucide-react";

const ROLE_COLORS = {
  superadmin: "bg-rose-50 text-rose-700 border-rose-200",
  admin: "bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/20",
  entrepreneur: "bg-[#FFF1E3] text-[#E38524] border-[#E38524]/20",
  mentor: "bg-green-50 text-green-700 border-green-200",
};

const SystemSettings = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.electron.invoke("system:get-overview");
      setOverview(data);
    } catch (err) {
      console.error("Error fetching system overview:", err);
      setError("Could not load system overview. Superadmin access required.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#00ADEF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#006F9E]">
            Loading system overview...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center">
        <p className="text-sm font-bold text-rose-700">{error}</p>
      </div>
    );
  }

  const totals = overview?.totals || {};
  const usersByRole = overview?.usersByRole || [];

  const totalModules = [
    { label: "Users", value: totals.users, icon: Users },
    { label: "Projects", value: totals.projects, icon: FolderKanban },
    { label: "Cohorts", value: totals.cohorts, icon: Layers },
    { label: "Applications", value: totals.applications, icon: ClipboardList },
    { label: "Funding Requests", value: totals.funding_requests, icon: HandCoins },
    { label: "Mentor Assignments", value: totals.mentor_assignments, icon: UserCheck },
    { label: "Mentor Sessions", value: totals.mentor_sessions, icon: FileText },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#D6E4EA] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
              System Administration
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] font-['Space_Grotesk']">
              System Settings &amp; Overview
            </h1>
            <p className="text-xs text-[#526274] mt-1">
              Superadmin-only view of platform configuration, database health,
              and module statistics.
            </p>
          </div>
        </div>
      </div>

      {/* Server + Database */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20">
              <Server size={20} />
            </div>
            <h3 className="font-bold text-[#111827]">Server</h3>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 bg-[#F6FAFC] rounded-xl px-4 py-3">
              <dt className="text-[#526274] font-semibold">Platform</dt>
              <dd className="font-bold text-[#111827]">
                {overview?.server?.name}
              </dd>
            </div>
            <div className="flex justify-between gap-4 bg-[#F6FAFC] rounded-xl px-4 py-3">
              <dt className="text-[#526274] font-semibold">Environment</dt>
              <dd className="font-bold text-[#111827] capitalize">
                {overview?.server?.environment}
              </dd>
            </div>
            <div className="flex justify-between gap-4 bg-[#F6FAFC] rounded-xl px-4 py-3">
              <dt className="text-[#526274] font-semibold">Server Time</dt>
              <dd className="font-bold text-[#111827]">
                {overview?.server?.time
                  ? new Date(overview.server.time).toLocaleString()
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-50 text-green-700 border border-green-200">
              <Database size={20} />
            </div>
            <h3 className="font-bold text-[#111827]">Database</h3>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 bg-[#F6FAFC] rounded-xl px-4 py-3">
              <dt className="text-[#526274] font-semibold">Connection</dt>
              <dd className="font-bold text-green-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Connected
              </dd>
            </div>
            <div className="flex justify-between gap-4 bg-[#F6FAFC] rounded-xl px-4 py-3">
              <dt className="text-[#526274] font-semibold">Database</dt>
              <dd className="font-bold text-[#111827]">
                {overview?.database?.name}
              </dd>
            </div>
            <div className="flex justify-between gap-4 bg-[#F6FAFC] rounded-xl px-4 py-3">
              <dt className="text-[#526274] font-semibold">Version</dt>
              <dd className="font-bold text-[#111827]">
                {overview?.database?.version}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Users by role */}
      <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
        <h3 className="font-bold text-[#111827] mb-4">Accounts by Role</h3>
        {usersByRole.length === 0 ? (
          <p className="text-sm text-[#526274] font-semibold">
            No user accounts found.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {usersByRole.map((r) => {
              const color = ROLE_COLORS[r.role] || ROLE_COLORS.admin;
              return (
                <div
                  key={r.role}
                  className="bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-2xl font-extrabold text-[#111827]">
                      {r.count}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#526274] capitalize">
                      {r.role}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${color}`}
                  >
                    {r.role}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Module totals */}
      <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
        <h3 className="font-bold text-[#111827] mb-4">Module Statistics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {totalModules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20 shrink-0">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-[#111827]">
                    {m.value ?? 0}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#526274]">
                    {m.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!overview && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="text-[#00ADEF] animate-spin" />
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
