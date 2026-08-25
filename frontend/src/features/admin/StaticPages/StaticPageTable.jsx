import React from "react";
import { Link2, Eye, Pencil, Trash2 } from "lucide-react";

const StaticPageTable = ({ pages, onEdit, onDelete }) => {
  const getPageUrl = (slug) => {
    if (slug === "about") return "/v1/about";
    if (slug === "terms") return "/v1/terms";
    return `/v1/pages/${slug}`;
  };

  return (
    <div className="overflow-x-auto font-sans">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-[#F6FAFC] border-b border-[#D6E4EA] text-[#526274] text-xs font-bold uppercase tracking-wider">
            <th className="p-4">Title</th>
            <th className="p-4">URL</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D6E4EA] text-sm">
          {pages.map((p) => {
            const pageUrl = getPageUrl(p.slug);
            return (
              <tr key={p.id} className="hover:bg-[#F6FAFC] transition-colors">
                <td className="p-4">
                  <div className="font-bold text-[#111827] text-sm">{p.title}</div>
                  <div className="text-xs text-[#526274] font-medium mt-0.5 truncate max-w-md">
                    {(p.body || "").slice(0, 90)}
                  </div>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF8FC] text-[#006F9E] text-xs font-bold border border-[#00ADEF]/20 font-mono">
                    <Link2 size={12} />
                    {pageUrl}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={pageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-[#526274] hover:text-[#006F9E] hover:bg-[#EAF8FC] rounded-xl border border-transparent hover:border-[#00ADEF]/20 transition-all"
                      title="View Live Page"
                    >
                      <Eye size={18} />
                    </a>
                    <button
                      onClick={() => onEdit(p)}
                      className="p-2 text-[#526274] hover:text-[#006F9E] hover:bg-[#EAF8FC] rounded-xl border border-transparent hover:border-[#00ADEF]/20 transition-all"
                      title="Edit Page"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-all"
                      title="Delete Page"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StaticPageTable;
