import React, { useState, useEffect, useCallback } from "react";
import { Plus, FileText, Link2, Search, Loader2, Inbox, X, CheckCircle2, AlertCircle } from "lucide-react";
import StaticPageTable from "./StaticPageTable";
import AddStaticPageForm from "./AddStaticPageForm";
import StatCard from "../../../components/StatCard";

const StaticPages = () => {
  const [pages, setPages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState(null);

  const flashNotice = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.electron.invoke("static-pages:get-all");
      setPages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching static pages:", error);
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleCreate = async (formData) => {
    try {
      await window.electron.invoke("static-pages:create", formData);
      setShowForm(false);
      flashNotice("success", `Page "${formData.title}" created successfully.`);
      fetchPages();
    } catch (error) {
      console.error("Error creating static page:", error);
      flashNotice("error", error.message || "Failed to create static page.");
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await window.electron.invoke("static-pages:update", editingPage.id, formData);
      setEditingPage(null);
      setShowForm(false);
      flashNotice("success", `Page "${formData.title}" updated successfully.`);
      fetchPages();
    } catch (error) {
      console.error("Error updating static page:", error);
      flashNotice("error", error.message || "Failed to update static page.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this page? This cannot be undone.")) {
      try {
        await window.electron.invoke("static-pages:delete", id);
        flashNotice("success", "Page deleted successfully.");
        fetchPages();
      } catch (error) {
        console.error("Error deleting static page:", error);
        flashNotice("error", error.message || "Failed to delete static page.");
      }
    }
  };

  const openEdit = (page) => {
    setEditingPage(page);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPage(null);
  };

  const filteredPages = pages.filter(
    (p) =>
      (p.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.slug || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all shrink-0"
      >
        <Plus size={18} />
        <span>New Page</span>
      </button>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-sm font-bold ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={18} className="shrink-0" />
          ) : (
            <AlertCircle size={18} className="shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <StatCard
          title="Total Pages"
          value={pages.length}
          icon={FileText}
          badgeText="Live on site"
          accentColor="cyan"
        />
        <StatCard
          title="Public URLs"
          value={pages.length}
          icon={Link2}
          badgeText="No login required"
          accentColor="orange"
        />
      </div>

      {/* Search */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6E4EA] shadow-xs flex items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]" size={18} />
          <input
            type="text"
            placeholder="Search pages by title or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium text-[#111827] outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#D6E4EA]">
          <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={32} />
          <p className="text-[#526274] font-bold text-sm">Loading pages...</p>
        </div>
      ) : filteredPages.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#D6E4EA] shadow-xs overflow-hidden">
          <StaticPageTable pages={filteredPages} onEdit={openEdit} onDelete={handleDelete} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#D6E4EA] text-center p-6">
          <div className="p-4 bg-[#EAF8FC] rounded-full text-[#00ADEF] mb-3">
            <Inbox size={36} />
          </div>
          <h3 className="text-lg font-bold text-[#111827]">No static pages found</h3>
          <p className="text-xs text-[#526274] mt-1 max-w-sm">
            Create your first public page or adjust your search term.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all"
          >
            <Plus size={16} /> Create Page
          </button>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-[#111827]/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={closeForm}
        >
          <div
            className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[#D6E4EA] shadow-lg flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#D6E4EA] flex items-center justify-between bg-[#F6FAFC]">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                  Content Hub
                </span>
                <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk']">
                  {editingPage ? "Edit Page" : "New Static Page"}
                </h2>
              </div>
              <button
                onClick={closeForm}
                className="p-2 text-[#526274] hover:bg-white hover:text-[#111827] rounded-xl border border-transparent hover:border-[#D6E4EA] transition-all"
              >
                <X size={22} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <AddStaticPageForm
                onSubmit={editingPage ? handleUpdate : handleCreate}
                onCancel={closeForm}
                initialData={editingPage}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaticPages;
