import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Download,
  Calendar,
  Users,
  FileText,
  Zap,
  CheckCircle,
  Loader2,
  Inbox,
  Pin,
  X,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import AddWorkshopForm from "./AddWorkshopForm";
import WorkshopTable from "./WorkshopTable";
import WorkshopDetails from "./WorkshopDetails";

const Workshops = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchWorkshops = async () => {
    setLoading(true);
    try {
      console.log("📡 Fetching workshops...");
      const data = await window.electron.invoke("workshops:get-all");
      console.log("📦 Received data:", data);
      console.log("📦 Data type:", typeof data);
      console.log("📦 Data is array:", Array.isArray(data));
      console.log("📦 Data length:", Array.isArray(data) ? data.length : 0);

      if (!Array.isArray(data)) {
        console.warn("⚠️ Data is not an array, converting...");
      }

      setWorkshops(Array.isArray(data) ? data : data || []);
      console.log("✅ Workshops set successfully");
    } catch (error) {
      console.error("❌ Error fetching workshops:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      setWorkshops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const handleAddWorkshop = async (formData) => {
    try {
      await window.electron.invoke("workshops:create", formData);
      setShowAddForm(false);
      fetchWorkshops();
    } catch (error) {
      console.error("Error creating workshop:", error);
    }
  };

  const handleDeleteWorkshop = async (id) => {
    if (window.confirm("ARE YOU SURE YOU WANT TO DELETE THIS WORKSHOP?")) {
      try {
        await window.electron.invoke("workshops:delete", id);
        fetchWorkshops();
      } catch (error) {
        console.error("Error deleting workshop:", error);
      }
    }
  };

  const handleViewDetails = async (workshop) => {
    try {
      const fullWorkshop = await window.electron.invoke(
        "workshops:get-by-id",
        workshop.id,
      );
      setSelectedWorkshop(fullWorkshop);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching workshop details:", error);
    }
  };

  const handleExportReport = async (type) => {
    try {
      let filePath;
      if (type === "attendance") {
        filePath = await window.electron.invoke("reports:export-attendance");
      } else {
        filePath = await window.electron.invoke("reports:export-feedback");
      }
      alert("✅ REPORT EXPORTED TO: " + filePath);
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  const filteredWorkshops = workshops.filter((workshop) => {
    const matchesSearch =
      workshop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workshop.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || workshop.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFFDF5] h-screen font-sans scrollbar-hide">
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
              Education HUB
            </span>
            <h1 className="text-5xl md:text-6xl font-black text-black mb-2 uppercase tracking-tighter">
              Workshops{" "}
              <span className="bg-[#4f46e5] text-white px-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] italic inline-block transform rotate-1">
                Control
              </span>
            </h1>
            <p className="text-xl text-slate-600 font-medium border-l-4 border-[#4f46e5] pl-4 italic mt-4">
              Manage and track your educational sessions and student progress.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-black text-white px-8 py-4 font-bold uppercase border-4 border-black shadow-[4px_4px_0_0_#4f46e5] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-3 text-lg"
          >
            <Plus size={24} strokeWidth={3} />
            New Workshop
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <StatCard
            title="Total"
            value={workshops.length}
            icon={GraduationCap}
            bgClass="bg-[#4f46e5]"
            textClass="text-white"
          />
          <StatCard
            title="Ongoing"
            value={workshops.filter((w) => w.status === "ongoing").length}
            icon={Zap}
            bgClass="bg-[#f59e0b]"
            textClass="text-black"
          />
          <StatCard
            title="Students"
            value={workshops.reduce(
              (acc, w) => acc + (w.enrolledCount || 0),
              0,
            )}
            icon={Users}
            bgClass="bg-[#0d9488]"
            textClass="text-white"
          />
          <StatCard
            title="Completed"
            value={workshops.filter((w) => w.status === "completed").length}
            icon={CheckCircle}
            bgClass="bg-[#0f172a]"
            textClass="text-white"
          />
        </div>

        {/* Filters & Actions Bar */}
        <div className="bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] mb-8 flex flex-col xl:flex-row gap-6 items-center justify-between">
          <div className="relative flex-1 w-full xl:w-auto">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={20}
              strokeWidth={2.5}
            />
            <input
              type="text"
              placeholder="SEARCH WORKSHOPS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-black bg-[#FFFDF5] focus:outline-none focus:ring-0 focus:bg-white font-bold text-black placeholder-gray-500 transition-all uppercase"
            />
          </div>

          <div className="flex flex-wrap gap-4 w-full xl:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-6 py-3 border-2 border-black bg-white text-black font-black uppercase text-sm cursor-pointer shadow-[3px_3px_0_0_black] outline-none"
            >
              <option value="all">ALL STATUS</option>
              <option value="scheduled">SCHEDULED</option>
              <option value="ongoing">ONGOING</option>
              <option value="completed">COMPLETED</option>
            </select>

            <button
              onClick={() => handleExportReport("attendance")}
              className="px-6 py-3 bg-white text-black border-2 border-black font-black uppercase text-sm hover:bg-gray-100 transition-all shadow-[3px_3px_0_0_black] flex items-center gap-2"
            >
              <Download size={18} strokeWidth={3} /> Attendance
            </button>

            <button
              onClick={() => handleExportReport("feedback")}
              className="px-6 py-3 bg-white text-black border-2 border-black font-black uppercase text-sm hover:bg-gray-100 transition-all shadow-[3px_3px_0_0_black] flex items-center gap-2"
            >
              <Download size={18} strokeWidth={3} /> Feedback
            </button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed">
            <Loader2
              className="text-black animate-spin mb-4"
              size={40}
              strokeWidth={2}
            />
            <p className="text-black font-black text-xl uppercase">
              Loading workshops...
            </p>
          </div>
        ) : filteredWorkshops.length > 0 ? (
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000]">
            <WorkshopTable
              workshops={filteredWorkshops}
              onView={handleViewDetails}
              onDelete={handleDeleteWorkshop}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed text-center">
            <div className="p-6 bg-gray-100 border-2 border-black rounded-full mb-6">
              <Inbox className="text-black" size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-black text-black uppercase mb-2">
              No workshops found
            </h3>
            <p className="text-gray-600 text-lg font-medium max-w-md mt-1 mb-8">
              Start by creating a new educational session for your community.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-black text-white px-8 py-3 font-bold uppercase border-2 border-black shadow-[4px_4px_0_0_black] transition-all flex items-center gap-2"
            >
              <Plus size={20} strokeWidth={3} /> Create Workshop
            </button>
          </div>
        )}

        {/* Modals */}
        {showAddForm && (
          <Modal title="Add New Workshop" onClose={() => setShowAddForm(false)}>
            <AddWorkshopForm
              onSubmit={handleAddWorkshop}
              onCancel={() => setShowAddForm(false)}
            />
          </Modal>
        )}

        {showDetailsModal && selectedWorkshop && (
          <Modal
            title="Workshop Details"
            onClose={() => setShowDetailsModal(false)}
          >
            <WorkshopDetails workshop={selectedWorkshop} />
          </Modal>
        )}
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon: IconComponent,
  bgClass,
  textClass,
}) => {
  return (
    <div
      className={`relative border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all duration-200 group ${bgClass}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]">
          {IconComponent && (
            <IconComponent className="text-black" size={24} strokeWidth={2.5} />
          )}
        </div>
        <div className="bg-white border-2 border-black px-2 py-0.5 transform rotate-2">
          <ArrowRight size={16} className="text-black" />
        </div>
      </div>

      <h3 className={`text-3xl font-black mb-1 tracking-tight ${textClass}`}>
        {value}
      </h3>

      <p
        className={`text-sm font-bold uppercase tracking-wider ${textClass} opacity-90`}
      >
        {title}
      </p>
    </div>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="bg-white w-full max-w-5xl max-h-[90vh] border-4 border-black shadow-[8px_8px_0_0_black] flex flex-col animate-in fade-in zoom-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6 border-b-4 border-black flex items-center justify-between bg-[#FFFDF5]">
        <h2 className="text-3xl font-black uppercase text-black">{title}</h2>
        <button
          onClick={onClose}
          className="text-black hover:bg-red-100 border-2 border-transparent hover:border-black p-2 transition-all font-black"
        >
          <X size={28} strokeWidth={3} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 bg-white p-6">{children}</div>
    </div>
  </div>
);

export default Workshops;
