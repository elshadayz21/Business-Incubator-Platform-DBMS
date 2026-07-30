import React, { useState, useEffect } from "react";
import {
  Box,
  Plus,
  Building,
  Laptop,
  Layers,
  Search,
  Filter,
  Pin,
  X,
  ArrowRight,
  Loader2,
  Inbox,
} from "lucide-react";
import ResourceTable from "./ResourceTable";
import AddResourceForm from "./AddResourceForm";

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
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
    fetchResources();
  };

  const filteredResources = resources.filter(
    (r) =>
      (filterType === "all" || r.type === filterType) &&
      r.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFFDF5] h-screen font-sans scrollbar-hide text-black">
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
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="bg-black text-white px-3 py-1 font-bold text-sm uppercase tracking-wider mb-2 inline-block transform -rotate-1">
              Infrastructure
            </span>
            <h1 className="text-5xl md:text-6xl font-black text-black mb-2 uppercase tracking-tighter">
              Resources{" "}
              <span className="bg-[#4f46e5] text-white px-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] italic inline-block transform rotate-1">
                Inventory
              </span>
            </h1>
            <p className="text-xl text-slate-600 font-medium border-l-4 border-[#4f46e5] pl-4 italic mt-4">
               Manage office spaces, meeting rooms & equipment.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-black text-white px-8 py-4 font-bold uppercase border-4 border-black shadow-[4px_4px_0_0_#4f46e5] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-3 text-lg"
          >
            <Plus size={24} strokeWidth={3} />
            Add Resource
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <StatCard
            title="Total Resources"
            value={resources.length}
            icon={Layers}
            bgClass="bg-[#4f46e5]"
            textClass="text-white"
          />
          <StatCard
            title="Workspaces"
            value={resources.filter((r) => r.type === "workspace").length}
            icon={Building}
            bgClass="bg-[#0f172a]"
            textClass="text-white"
          />
          <StatCard
            title="Meeting Rooms"
            value={resources.filter((r) => r.type === "meeting_room").length}
            icon={Box}
            bgClass="bg-[#f59e0b]"
            textClass="text-black"
          />
          <StatCard
            title="Equipment"
            value={resources.filter((r) => r.type === "equipment").length}
            icon={Laptop}
            bgClass="bg-white"
            textClass="text-black"
          />
        </div>

        {/* Search & Filter UI */}
        <div className="bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] mb-8 flex flex-col xl:flex-row gap-6 items-center justify-between">
          <div className="relative flex-1 w-full xl:w-auto">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={20}
              strokeWidth={2.5}
            />
            <input
              type="text"
              placeholder="SEARCH RESOURCES..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-black bg-[#FFFDF5] focus:outline-none focus:ring-0 focus:bg-white font-bold text-black placeholder-gray-500 transition-all uppercase"
            />
          </div>

          <div className="relative w-full xl:w-64">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
              strokeWidth={2.5}
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border-2 border-black bg-white text-black font-bold uppercase outline-none focus:bg-blue-50 cursor-pointer shadow-[2px_2px_0_0_black]"
            >
              <option value="all">ALL TYPES</option>
              <option value="workspace">WORKSPACES</option>
              <option value="meeting_room">MEETING ROOMS</option>
              <option value="equipment">EQUIPMENT</option>
            </select>
          </div>
        </div>

        {/* Table Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed">
            <Loader2
              className="text-black animate-spin mb-4"
              size={40}
              strokeWidth={2}
            />
            <p className="text-black font-black text-xl uppercase">
              Loading resources...
            </p>
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000]">
            <ResourceTable
              resources={filteredResources}
              loading={false}
              onAddClick={() => setShowAddForm(true)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed text-center">
            <div className="p-6 bg-gray-100 border-2 border-black rounded-full mb-6">
              <Inbox className="text-black" size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-black text-black uppercase mb-2">
              No resources found
            </h3>
            <p className="text-gray-600 text-lg font-medium max-w-md mt-1 mb-8">
              Start by adding rooms, desks, or equipment to manage your
              facility.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-black text-white px-8 py-3 font-bold uppercase border-2 border-black shadow-[4px_4px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2"
            >
              <Plus size={20} strokeWidth={3} /> Add First Resource
            </button>
          </div>
        )}

        {/* Add Resource Modal */}
        {showAddForm && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={() => setShowAddForm(false)}
          >
            <div
              className="bg-white w-full max-w-2xl max-h-[90vh] border-4 border-black shadow-[8px_8px_0_0_black] flex flex-col animate-in fade-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b-4 border-black flex items-center justify-between bg-[#FFFDF5]">
                <h2 className="text-2xl font-black text-black uppercase flex items-center gap-3">
                  <div className="p-2 border-2 border-black bg-white">
                    <Pin size={20} strokeWidth={3} />
                  </div>
                  Add New Resource
                </h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-black hover:bg-red-100 border-2 border-transparent hover:border-black p-1 transition-all"
                >
                  <X size={28} strokeWidth={3} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 bg-white">
                <AddResourceForm
                  onClose={() => setShowAddForm(false)}
                  onSuccess={handleAddResource}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: IconComponent, bgClass, textClass }) => {
  return (
    <div
      className={`relative border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all duration-200 group ${bgClass}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]">
          {IconComponent && (
            <IconComponent 
              className="text-black" 
              size={24} 
              strokeWidth={2.5} 
            />
          )}
        </div>
        <div className="bg-white border-2 border-black px-2 py-0.5 transform rotate-2">
          <ArrowRight size={16} className="text-black" />
        </div>
      </div>
      
      <h3 className={`text-3xl font-black mb-1 tracking-tight ${textClass}`}>
        {value}
      </h3>
      
      <p className={`text-sm font-bold uppercase tracking-wider ${textClass} opacity-90`}>
        {title}
      </p>
    </div>
  );
};

export default Resources;
