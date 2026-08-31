import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Plus,
  Building,
  Laptop,
  Layers,
  Search,
  Filter,
  X,
  Loader2,
  Inbox,
} from "lucide-react";
import ResourceTable from "./ResourceTable";
import AddResourceForm from "./AddResourceForm";
import StatCard from "../../../components/StatCard";

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [resourcesPage, setResourcesPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [totals, setTotals] = useState({
    total: 0,
    workspaces: 0,
    meeting_rooms: 0,
    equipment: 0,
  });

  const fetchTotals = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/resources/totals", {
        credentials: "include",
      });
      const data = await response.json();
      if (data) {
        setTotals({
          total: parseInt(data.total) || 0,
          workspaces: parseInt(data.workspaces) || 0,
          meeting_rooms: parseInt(data.meeting_rooms) || 0,
          equipment: parseInt(data.equipment) || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch resource totals:", error);
    }
  }, []);

  const fetchResources = useCallback(async (page = 1) => {
    if (page === 1) { setLoading(true); } else { setLoadMoreLoading(true); }
    try {
      const response = await fetch(`/api/admin/resources?page=${page}`, { credentials: 'include' });
      const data = await response.json();
      const newResources = Array.isArray(data) ? data : [];

      if (page === 1) {
        setResources(newResources);
      } else {
        setResources((prev) => [...prev, ...newResources]);
      }

      setHasMore(newResources.length >= 10);
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      if (page === 1) setResources([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadMoreLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources(1);
    fetchTotals();
  }, [fetchResources, fetchTotals]);

  const handleLoadMore = () => {
    const nextPage = resourcesPage + 1;
    setResourcesPage(nextPage);
    fetchResources(nextPage);
  };

  const handleAddResource = async () => {
    setShowAddForm(false);
    setEditingResource(null);
    setResourcesPage(1);
    fetchResources(1);
    fetchTotals();
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resource? This cannot be undone.")) return;
    try {
      await fetch(`/api/admin/resources/${id}`, { method: 'DELETE', credentials: 'include' });
      setResourcesPage(1);
      fetchResources(1);
      fetchTotals();
    } catch (err) {
      console.error("Failed to delete resource:", err);
      window.alert("Failed to delete resource. Please try again.");
    }
  };

  const filteredResources = resources.filter(
      (r) =>
          (filterType === "all" || r.type === filterType) &&
          (r.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
      <div className="space-y-6 font-sans">
        <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all shrink-0"
        >
          <Plus size={18} />
          <span>Add Resource</span>
        </button>

        {/* Stats Cards — real totals from server, independent of pagination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
              title="Total Assets"
              value={totals.total}
              icon={Layers}
              badgeText="Facility total"
              accentColor="cyan"
          />
          <StatCard
              title="Workspaces"
              value={totals.workspaces}
              icon={Building}
              badgeText="Desks & Pods"
              accentColor="orange"
          />
          <StatCard
              title="Meeting Rooms"
              value={totals.meeting_rooms}
              icon={Box}
              badgeText="Boardrooms"
              accentColor="cyan"
          />
          <StatCard
              title="Equipment"
              value={totals.equipment}
              icon={Laptop}
              badgeText="Laptops & Audio"
              accentColor="orange"
          />
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-5 rounded-2xl border border-[#D6E4EA] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]"
                size={18}
            />
            <input
                type="text"
                placeholder="Search resources by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium text-[#111827] outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={16} className="text-[#526274]" />
            <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full md:w-52 px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="workspace">Workspaces</option>
              <option value="meeting_room">Meeting Rooms</option>
              <option value="equipment">Equipment</option>
            </select>
          </div>
        </div>

        {/* Resource Table */}
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#D6E4EA]">
              <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={32} />
              <p className="text-[#526274] font-bold text-sm">Loading resources...</p>
            </div>
        ) : filteredResources.length > 0 ? (
            <>
              <div className="bg-white rounded-2xl border border-[#D6E4EA] shadow-xs overflow-hidden">
                <ResourceTable
                    resources={filteredResources}
                    loading={false}
                    onAddClick={() => setShowAddForm(true)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
              </div>

              {/* Pagination: Load More */}
              <div className="flex flex-col items-center gap-2">
                {hasMore ? (
                    <button
                        onClick={handleLoadMore}
                        disabled={loadMoreLoading}
                        className="px-6 py-2 bg-[#00ADEF] text-white rounded-xl text-sm font-bold hover:bg-[#006F9E] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadMoreLoading && <Loader2 size={16} className="animate-spin" />}
                      Load More
                    </button>
                ) : (
                    <p className="text-xs text-[#526274] font-medium">No more resources to load</p>
                )}
              </div>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#D6E4EA] text-center p-6">
              <div className="p-4 bg-[#EAF8FC] rounded-full text-[#00ADEF] mb-3">
                <Inbox size={36} />
              </div>
              <h3 className="text-lg font-bold text-[#111827]">No resources found</h3>
              <p className="text-xs text-[#526274] mt-1 max-w-sm mb-6">
                Start by adding rooms, desks, or technical gear to your inventory.
              </p>
              <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E38524] text-white text-xs font-bold uppercase"
              >
                <Plus size={16} /> Add First Resource
              </button>
            </div>
        )}

        {/* Add/Edit Resource Modal */}
        {showAddForm && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[#D6E4EA] shadow-xl flex flex-col overflow-hidden font-sans">
                <div className="p-5 border-b border-[#D6E4EA] flex items-center justify-between bg-white">
                  <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] block">
                  Inventory Management
                </span>
                    <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk']">
                      {editingResource ? "Edit Resource Asset" : "Add New Resource Asset"}
                    </h2>
                  </div>
                  <button
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingResource(null);
                      }}
                      className="p-2 rounded-xl text-[#526274] hover:bg-[#F6FAFC] hover:text-[#111827] transition"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 p-6 bg-[#F6FAFC]">
                  <AddResourceForm
                      initialData={editingResource}
                      onClose={() => {
                        setShowAddForm(false);
                        setEditingResource(null);
                      }}
                      onSuccess={handleAddResource}
                  />
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default Resources;