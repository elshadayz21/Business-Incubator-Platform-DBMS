import React, { useState, useEffect } from "react";
import {
  Images,
  Trash2,
  Loader2,
  PlusCircle,
  Sparkles,
  CalendarDays,
  Pencil,
  Eye,
  EyeOff,
  GripVertical,
  Link2,
  UploadCloud,
  ImageOff,
  Search,
} from "lucide-react";
import AddGalleryForm from "./AddGalleryForm";

const EMPTY_FORM = {
  id: null,
  title: "",
  description: "",
  category: "General",
  imageUrl: "",
  isPublished: false,
  displayOrder: 0,
};

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("display_order");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [categories, setCategories] = useState(["All"]);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('pageSize', String(pageSize));
      if (searchTerm) params.append('q', searchTerm);
      if (filterCategory && filterCategory !== 'all') params.append('category', filterCategory);
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortDir) params.append('sortDir', sortDir);

      const response = await fetch(`/api/admin/gallery?${params.toString()}`, {
        credentials: "include",
      });
      const data = await response.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(typeof data.total === 'number' ? data.total : 0);
    } catch (error) {
      console.error("Error fetching gallery items:", error);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch categories for filter dropdown
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/admin/gallery/categories', { credentials: 'include' });
        const data = await res.json();
        if (data && Array.isArray(data.categories)) {
          setCategories(['All', ...data.categories]);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    // refetch when any filter/search/pagination changes
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, searchTerm, filterCategory, filterStatus, sortBy, sortDir]);

  const resetForm = () => {
    setError("");
  };

  const startEdit = (item) => {
    // Open modal with initial data
    setEditingItem(item);
    setShowFormModal(true);
  };

  const openAddForm = () => {
    setEditingItem(null);
    setShowFormModal(true);
  };

  const closeForm = () => {
    setEditingItem(null);
    setShowFormModal(false);
  };

  // View modal state & handlers
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const openView = (item) => {
    setViewItem(item);
    setShowViewModal(true);
  };
  const closeView = () => {
    setViewItem(null);
    setShowViewModal(false);
  };


  const handleTogglePublish = async (item) => {
    try {
      const res = await fetch(`/api/admin/gallery/${item.id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isPublished: !item.is_published }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to toggle publish status");
      }
      await fetchItems();
      window.alert(item.is_published ? "Gallery item unpublished." : "Gallery item published.");
      // If viewing the same item, refresh view data
      if (viewItem && viewItem.id === item.id) {
        try {
          const resp = await fetch(`/api/admin/gallery/${item.id}`, { credentials: 'include' });
          if (resp.ok) {
            const refreshed = await resp.json().catch(() => null);
            if (refreshed) setViewItem(refreshed);
          }
        } catch (e) {
          // ignore refresh errors
          console.error('Error refreshing view item:', e);
        }
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
      window.alert("Failed to change publish status: " + (error.message || "Unknown"));
    }
  };

  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const promptDelete = (item) => {
    // open confirmation modal with the selected item
    setDeleteCandidate(item);
  };

  const cancelDelete = () => {
    setDeleteCandidate(null);
    setDeleting(false);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    if (deleting) return; // prevent duplicate
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/gallery/${deleteCandidate.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 403) {
        window.alert('You are not authorized to delete this item.');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete item');
      }
      await fetchItems();
      window.alert('Gallery item deleted. It will be removed from the public site.');
      // close view modal if open for this item
      if (viewItem && viewItem.id === deleteCandidate.id) closeView();
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      window.alert('Failed to delete gallery item: ' + (error.message || 'Unknown'));
    } finally {
      setDeleting(false);
      setDeleteCandidate(null);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-[#D6E4EA] bg-[#F6FAFC] text-[#111827] font-medium focus:outline-none focus:ring-2 focus:ring-[#00ADEF] focus:border-[#00ADEF] transition-all placeholder:text-[#8AA0B4]";
  const labelClass =
    "block text-xs font-bold uppercase tracking-wider text-[#526274] mb-2";

  // Pagination calculations (server-driven)
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));
  const effectivePage = Math.min(page, totalPages);
  const paginatedItems = items; // items already correspond to current page

  return (
    <div className="space-y-6">
      {/* Header Banner */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Image CTA (opens modal) */}
        <div className="bg-white border border-[#D6E4EA] rounded-2xl p-6 shadow-xs h-fit flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">Content Management</span>
            <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk'] flex items-center gap-2">
              <PlusCircle size={20} className="text-[#E38524]" strokeWidth={2.5} />
              Add / Edit Gallery
            </h2>
            <p className="text-sm text-[#526274] mt-2">Create new gallery images or edit existing ones. Uploaded images are served from the public uploads folder.</p>
          </div>

          <div className="mt-4">
            <button onClick={openAddForm} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all">
              <PlusCircle size={16} /> Add Image
            </button>
          </div>
        </div>

        {/* Modal for Add/Edit (rendered when showFormModal true) */}
        {showFormModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl border border-[#D6E4EA] shadow-xl flex flex-col overflow-auto font-sans">
              <div className="p-5 border-b border-[#D6E4EA] flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-lg font-bold">{editingItem ? "Edit Gallery Item" : "Add Gallery Image"}</h3>
                  <p className="text-xs text-[#526274]">{editingItem ? "Replace the image or update metadata." : "Upload an image to show on the public gallery."}</p>
                </div>
                <button onClick={() => { setShowFormModal(false); setEditingItem(null); }} className="px-3 py-2 text-xs font-bold text-[#526274]">Close</button>
              </div>
              <div className="p-4">
                <AddGalleryForm initialData={editingItem} onClose={() => { setShowFormModal(false); setEditingItem(null); }} onSuccess={() => fetchItems()} categories={categories} />
              </div>
            </div>
          </div>
        )}
        {/* View Modal */}
        {showViewModal && viewItem && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl border border-[#D6E4EA] shadow-xl flex flex-col overflow-auto font-sans">
              <div className="p-5 border-b border-[#D6E4EA] flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-lg font-bold">Gallery Item Details</h3>
                  <p className="text-xs text-[#526274]">Preview and metadata for the selected gallery image.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // open edit modal for this item
                      startEdit(viewItem);
                      closeView();
                    }}
                    className="px-3 py-2 rounded-xl bg-[#E38524] text-white text-xs font-bold shadow-xs hover:bg-[#C97019] transition"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleTogglePublish(viewItem)}
                    className="px-3 py-2 rounded-xl bg-[#F6FAFC] text-xs font-bold border border-[#D6E4EA] hover:bg-[#EAF8FC] transition"
                  >
                    {viewItem.is_published ? 'Unpublish' : 'Publish'}
                  </button>

                  <button
                    onClick={() => promptDelete(viewItem)}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                  >
                    Delete
                  </button>

                  <button onClick={closeView} className="px-3 py-2 text-xs font-bold text-[#526274]">Close</button>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-center bg-[#F6FAFC] rounded-xl p-4">
                  {viewItem.image_url ? (
                    <img src={viewItem.image_url} alt={viewItem.title} className="w-full max-h-[60vh] object-contain rounded-lg" />
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center bg-white border border-dashed border-[#D6E4EA] rounded-lg">
                      <ImageOff size={36} className="text-[#8AA0B4]" />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-2xl font-extrabold text-[#111827]">{viewItem.title || 'Untitled'}</h4>
                    <p className="text-sm text-[#526274] mt-1">{viewItem.description || 'No description provided.'}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="inline-flex px-3 py-1 rounded-full bg-[#EAF8FC] text-[#006F9E] text-xs font-bold border border-[#00ADEF]/20">{viewItem.category || 'General'}</span>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${viewItem.is_published ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#FFF1E3] text-[#E38524] border-[#E38524]/20'}`}>{viewItem.is_published ? 'Published' : 'Draft'}</span>
                    <span className="text-xs text-[#526274] px-2">Display order: <span className="font-bold text-[#111827]">{viewItem.display_order || 0}</span></span>
                  </div>

                  {viewItem.video_url && (
                    <div className="bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl p-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#526274]">Video Link</div>
                      <a href={viewItem.video_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#00ADEF] hover:underline break-all block mt-1">
                        {viewItem.video_url}
                      </a>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs text-[#526274]">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#526274]">Created</div>
                      <div className="font-medium text-sm text-[#111827]">{viewItem.created_at ? new Date(viewItem.created_at).toLocaleString() : '-'}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#526274]">Last updated</div>
                      <div className="font-medium text-sm text-[#111827]">{viewItem.updated_at ? new Date(viewItem.updated_at).toLocaleString() : '-'}</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteCandidate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-60 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl border border-[#D6E4EA] shadow-xl p-6">
              <h3 className="text-lg font-bold text-[#111827]">Delete Gallery Image?</h3>
              <p className="mt-2 text-sm text-[#526274]">This will permanently remove the gallery item from the public website. The image file associated with this item will also be removed if it exists and belongs exclusively to this record.</p>

              <div className="mt-4 flex items-center gap-3">
                <button onClick={confirmDelete} disabled={deleting} className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-50">{deleting ? 'Deleting...' : 'Delete'}</button>
                <button onClick={cancelDelete} disabled={deleting} className="px-4 py-2 rounded-xl border border-[#D6E4EA] text-sm font-bold">Cancel</button>
              </div>

              <div className="mt-4 text-xs text-[#8AA0B4]">
                <strong>Note:</strong> If the image file cannot be found on disk it will be ignored; the gallery record will still be removed from the database.
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="mb-5 pb-4 border-b border-[#D6E4EA]">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
              Gallery
            </span>
            <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk'] flex items-center gap-2">
              <Images size={20} className="text-[#00ADEF]" strokeWidth={2.5} />
              Items ({items.length})
            </h2>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-5 rounded-2xl border border-[#D6E4EA] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]" size={18} />
              <input
                type="text"
                placeholder="Search images by title or description..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium text-[#111827] outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                className="px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat === 'All' ? 'all' : cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
              >
                <option value="display_order">Sort: Display Order</option>
                <option value="created_at">Sort: Created Date</option>
                <option value="title">Sort: Title</option>
              </select>

              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value)}
                className="px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16 bg-white border border-[#D6E4EA] rounded-2xl shadow-xs">
              <Loader2 className="text-[#00ADEF] animate-spin" size={32} />
            </div>
          ) : items.length > 0 ? (
            <div className="overflow-x-auto bg-white border border-[#D6E4EA] rounded-2xl p-0 shadow-xs">
              <table className="w-full text-left border-collapse min-w-[800px]">                <thead>
                  <tr className="bg-[#F6FAFC] border-b border-[#D6E4EA] text-[#526274] text-xs font-bold uppercase tracking-wider">
                    <th className="p-3 w-24">Thumbnail</th>
                    <th className="p-3">Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Display Order</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6E4EA] text-sm">
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F6FAFC] transition-colors">
                      <td className="p-3 align-middle">
                        <div className="w-20 h-14 rounded-xl overflow-hidden bg-[#F6FAFC] border border-[#D6E4EA] flex items-center justify-center">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageOff size={20} className="text-[#8AA0B4]" />
                          )}
                        </div>
                      </td>
                      <td className="p-3 align-middle">
                        <div className="font-bold text-sm text-[#111827] truncate max-w-xs">{item.title}</div>
                        <div className="text-[12px] text-[#526274] truncate max-w-xs">{item.description || ""}</div>
                      </td>
                      <td className="p-3 align-middle">
                        <span className="text-[12px] px-2 py-1 rounded-full bg-[#EAF8FC] text-[#006F9E] font-bold border border-[#00ADEF]/20">{item.category || "General"}</span>
                      </td>
                      <td className="p-3 align-middle">
                        <span className={`text-[12px] px-2 py-1 rounded-full font-bold border ${item.is_published ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-[#FFF1E3] text-[#E38524] border-[#E38524]/20"}`}>{item.is_published ? "Published" : "Draft"}</span>
                      </td>
                      <td className="p-3 align-middle">{item.display_order || 0}</td>
                      <td className="p-3 align-middle">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="p-3 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openView(item)} title="View item" className="p-2 rounded-lg text-[#006F9E] hover:bg-[#EAF8FC] hover:text-[#00ADEF] transition-all border border-[#D6E4EA]">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => handleTogglePublish(item)} title={item.is_published ? "Unpublish" : "Publish"} className="p-2 rounded-lg text-[#526274] hover:bg-[#EAF8FC] hover:text-[#00ADEF] transition-all">{item.is_published ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                          <button onClick={() => startEdit(item)} title="Edit item" className="p-2 rounded-lg text-[#526274] hover:bg-[#EAF8FC] hover:text-[#00ADEF] transition-all"><Pencil size={16} /></button>
                          <button onClick={() => promptDelete(item)} title="Delete item" className="p-2 rounded-lg text-[#526274] hover:bg-rose-50 hover:text-rose-600 transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="p-4 flex items-center justify-between">
                <div className="text-sm text-[#526274]">Showing {(effectivePage-1)*pageSize + 1} - {Math.min(effectivePage*pageSize, total)} of {total}</div>
                <div className="flex items-center gap-2">
                  <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="px-3 py-2 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold">
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={effectivePage<=1} className="px-3 py-2 rounded-xl border border-[#D6E4EA] bg-white text-xs">Prev</button>
                    <span className="px-2 text-sm">{effectivePage} / {totalPages}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={effectivePage>=totalPages} className="px-3 py-2 rounded-xl border border-[#D6E4EA] bg-white text-xs">Next</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-[#D6E4EA] rounded-2xl shadow-xs text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF1E3] border border-[#E38524]/20 flex items-center justify-center mb-4">
                <Images className="text-[#E38524]" size={26} />
              </div>
              <p className="text-[#526274] font-bold">No gallery items yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
