import React, { useCallback, useEffect, useState } from "react";
import { History, Loader2, Search, ShieldAlert } from "lucide-react";

const ROLE_BADGE = {
  superadmin: "bg-rose-50 text-rose-700 border-rose-200",
  admin: "bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/20",
  entrepreneur: "bg-[#FFF1E3] text-[#E38524] border-[#E38524]/20",
  mentor: "bg-green-50 text-green-700 border-green-200",
};

const METHOD_BADGE = {
  POST: "bg-green-50 text-green-700 border-green-200",
  PUT: "bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/20",
  PATCH: "bg-[#EAF8FC] text-[#006F9E] border-[#00ADEF]/20",
  DELETE: "bg-rose-50 text-rose-700 border-rose-200",
};

// Strips the shared "/api/admin" prefix so the path column reads as the
// module + action ("/projects/12/status") rather than repeating it every row.
const shortenPath = (path = "") => path.replace(/^\/api\/admin/, "") || "/";

const formatSummary = (summary) => {
  if (!summary) return null;
  try {
    const parsed = JSON.parse(summary);
    const entries = Object.entries(parsed);
    if (entries.length === 0) return null;
    return entries
      .slice(0, 4)
      .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`)
      .join(" · ");
  } catch {
    return summary;
  }
};

const PAGE_SIZE = 25;

const AuditLog = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [role, setRole] = useState("");
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchEntries = useCallback(async (targetPage, targetRole, targetQuery) => {
    try {
      setLoading(true);
      setError("");
      const data = await window.electron.invoke("audit-log:get", {
        page: targetPage,
        limit: PAGE_SIZE,
        role: targetRole || undefined,
        q: targetQuery || undefined,
      });
      setEntries(Array.isArray(data?.data) ? data.data : []);
      setTotal(data?.total || 0);
    } catch (err) {
      console.error("Error fetching audit log:", err);
      setError("Could not load the audit trail. Superadmin access required.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries(page, role, query);
  }, [page, role, query, fetchEntries]);

  // Debounce the free-text search so we're not firing a request per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      setQuery(searchInput.trim());
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-2xl border border-[#D6E4EA] p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 text-rose-700 border border-rose-200">
            <History size={20} />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-0.5">
              System Administration
            </span>
            <h1 className="text-xl font-bold text-[#111827]">Audit Trail</h1>
          </div>
        </div>
        <p className="text-xs text-[#526274] mt-2">
          Every state-changing action taken through the admin panel — who did it, what endpoint they hit, and
          whether it succeeded. Read-only requests (viewing lists, dashboards, reports) aren't logged here.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#D6E4EA] p-5 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#526274]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by actor name, method, or path..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-semibold outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20 transition"
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value);
          }}
          className="px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
        >
          <option value="">All Roles</option>
          <option value="superadmin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="mentor">Mentor</option>
          <option value="entrepreneur">Entrepreneur</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-[#D6E4EA] shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={32} />
            <p className="text-[#526274] font-bold text-sm">Loading audit trail...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center p-6">
            <ShieldAlert className="text-rose-600 mb-3" size={32} />
            <p className="text-sm font-bold text-rose-700">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center p-6">
            <History className="text-[#D6E4EA] mb-3" size={32} />
            <h3 className="text-lg font-bold text-[#111827]">No matching audit entries</h3>
            <p className="text-xs text-[#526274] mt-1 max-w-sm">
              Actions taken through the admin panel will show up here as they happen.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#F6FAFC] border-b border-[#D6E4EA] text-[#526274] text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Time</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Details</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6E4EA] text-sm">
                {entries.map((entry) => {
                  const roleCls = ROLE_BADGE[entry.actor_role] || "bg-slate-100 text-slate-600 border-slate-200";
                  const methodCls = METHOD_BADGE[entry.method] || "bg-slate-100 text-slate-600 border-slate-200";
                  const ok = entry.status_code && entry.status_code < 400;
                  const detail = formatSummary(entry.summary);
                  return (
                    <tr key={entry.id} className="hover:bg-[#F6FAFC] transition-colors align-top">
                      <td className="p-4 whitespace-nowrap text-xs font-semibold text-[#526274]">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-sm text-[#111827]">{entry.actor_name || "Unknown"}</p>
                        {entry.actor_role && (
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${roleCls}`}
                          >
                            {entry.actor_role}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${methodCls}`}>
                            {entry.method}
                          </span>
                          <span className="text-xs font-semibold text-[#111827] break-all">
                            {shortenPath(entry.path)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-[#526274] max-w-[320px]">
                        {detail || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            ok ? "bg-green-50 text-green-700 border-green-200" : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {entry.status_code || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[#526274]">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-[#D6E4EA] bg-white text-[#526274] hover:bg-[#F6FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-[#111827] px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-[#D6E4EA] bg-white text-[#526274] hover:bg-[#F6FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
