import React, { useState, useEffect } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await window.electron.invoke("resources:get-all");
      setResources(data || []);
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleAddResource = async () => {
    setShowAddForm(false);
    setEditingResource(null);
    fetchResources();
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resource? This cannot be undone.")) return;
    try {
      await window.electron.invoke("resources:delete", id);
      fetchResources();
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
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#D6E4EA] shadow-xs">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
            Facility Infrastructure
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] font-['Space_Grotesk']">
            Resource Inventory &amp; Booking
          </h1>
          <p className="text-xs text-[#526274] mt-1">
            Manage incubatee co-working spaces, meeting rooms, and digital equipment hardware.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all shrink-0"
        >
          <Plus size={18} />
          <span>Add Resource</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Assets"
          value={resources.length}
          icon={Layers}
          badgeText="Facility total"
          accentColor="cyan"
        />
        <StatCard
          title="Workspaces"
          value={resources.filter((r) => r.type === "workspace").length}
          icon={Building}
          badgeText="Desks & Pods"
          accentColor="orange"
        />
        <StatCard
          title="Meeting Rooms"
          value={resources.filter((r) => r.type === "meeting_room").length}
          icon={Box}
          badgeText="Boardrooms"
          accentColor="cyan"
        />
        <StatCard
          title="Equipment"
          value={resources.filter((r) => r.type === "equipment").length}
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
        <div className="bg-white rounded-2xl border border-[#D6E4EA] shadow-xs overflow-hidden">
          <ResourceTable
            resources={filteredResources}
            loading={false}
            onAddClick={() => setShowAddForm(true)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
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
