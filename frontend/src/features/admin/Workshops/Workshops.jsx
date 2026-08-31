import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Calendar,
  Users,
  Zap,
  CheckCircle,
  Loader2,
  Inbox,
  X,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import AddWorkshopForm from "./AddWorkshopForm";
import WorkshopTable from "./WorkshopTable";
import WorkshopDetails from "./WorkshopDetails";
import StatCard from "../../../components/StatCard";

const Workshops = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [workshopsPage, setWorkshopsPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [totals, setTotals] = useState({
    total: 0,
    ongoing: 0,
    completed: 0,
    enrolled: 0,
  });

  const fetchTotals = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/workshops/totals", {
        credentials: "include",
      });
      const data = await response.json();
      if (data) {
        setTotals({
          total: parseInt(data.total) || 0,
          ongoing: parseInt(data.ongoing) || 0,
          completed: parseInt(data.completed) || 0,
          enrolled: parseInt(data.enrolled) || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch workshop totals:", error);
    }
  }, []);

  const fetchWorkshops = useCallback(async (page = 1) => {
    if (page === 1) { setLoading(true); } else { setLoadMoreLoading(true); }
    try {
      const response = await fetch(`/api/admin/workshops?page=${page}`, { credentials: 'include' });
      const data = await response.json();
      const newWorkshops = Array.isArray(data) ? data : [];

      if (page === 1) {
        setWorkshops(newWorkshops);
      } else {
        setWorkshops((prev) => [...prev, ...newWorkshops]);
      }

      setHasMore(newWorkshops.length >= 10);
    } catch (error) {
      console.error("Error fetching workshops:", error);
      if (page === 1) setWorkshops([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadMoreLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkshops(1);
    fetchTotals();
  }, [fetchWorkshops, fetchTotals]);

  const handleLoadMore = () => {
    const nextPage = workshopsPage + 1;
    setWorkshopsPage(nextPage);
    fetchWorkshops(nextPage);
  };

  const handleAddWorkshop = async (formData) => {
    try {
      await fetch("/api/admin/workshops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      setShowAddForm(false);
      setWorkshopsPage(1);
      fetchWorkshops(1);
      fetchTotals();
    } catch (error) {
      console.error("Error creating workshop:", error);
    }
  };

  const handleDeleteWorkshop = async (id) => {
    if (window.confirm("Are you sure you want to delete this workshop?")) {
      try {
        await fetch(`/api/admin/workshops/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        setWorkshopsPage(1);
        fetchWorkshops(1);
        fetchTotals();
      } catch (error) {
        console.error("Error deleting workshop:", error);
        alert(error.message || "Failed to delete workshop.");
      }
    }
  };

  const handleViewDetails = async (workshop) => {
    try {
      const response = await fetch(`/api/admin/workshops/${workshop.id}`, {
        credentials: "include",
      });
      const fullWorkshop = await response.json();
      setSelectedWorkshop(fullWorkshop);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching workshop details:", error);
    }
  };

  const filteredWorkshops = workshops.filter((workshop) => {
    const matchesSearch =
        (workshop.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (workshop.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
        filterStatus === "all" || workshop.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
      <div className="space-y-6 font-sans">
        {/* Header Section */}


        <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all shrink-0"
        >
          <Plus size={18} />
          <span>New Workshop</span>
        </button>


        {/* Stats Cards — real totals from server, independent of pagination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
              title="Total Sessions"
              value={totals.total}
              icon={GraduationCap}
              badgeText="All programs"
              accentColor="cyan"
          />
          <StatCard
              title="Ongoing Sessions"
              value={totals.ongoing}
              icon={Zap}
              badgeText="In progress"
              accentColor="orange"
          />
          <StatCard
              title="Enrolled Startups"
              value={totals.enrolled}
              icon={Users}
              badgeText="Capacity used"
              accentColor="cyan"
          />
          <StatCard
              title="Completed"
              value={totals.completed}
              icon={CheckCircle}
              badgeText="Certificates issued"
              accentColor="orange"
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-5 rounded-2xl border border-[#D6E4EA] shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]"
                size={18}
            />
            <input
                type="text"
                placeholder="Search workshops by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium text-[#111827] outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Workshop Table */}
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#D6E4EA]">
              <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={32} />
              <p className="text-[#526274] font-bold text-sm">Loading workshop catalog...</p>
            </div>
        ) : filteredWorkshops.length > 0 ? (
            <>
              <div className="bg-white rounded-2xl border border-[#D6E4EA] shadow-xs overflow-hidden">
                <WorkshopTable
                    workshops={filteredWorkshops}
                    onView={handleViewDetails}
                    onDelete={handleDeleteWorkshop}
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
                    <p className="text-xs text-[#526274] font-medium">No more workshops to load</p>
                )}
              </div>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#D6E4EA] text-center p-6">
              <div className="p-4 bg-[#EAF8FC] rounded-full text-[#00ADEF] mb-3">
                <Inbox size={36} />
              </div>
              <h3 className="text-lg font-bold text-[#111827]">No workshops found</h3>
              <p className="text-xs text-[#526274] mt-1 max-w-sm mb-6">
                Start by adding training workshops for your incubatee cohorts.
              </p>
              <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E38524] text-white text-xs font-bold uppercase"
              >
                <Plus size={16} /> Create Workshop
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
  );
};

const Modal = ({ title, onClose, children }) => (
    <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
      <div
          className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl border border-[#D6E4EA] shadow-xl flex flex-col overflow-hidden font-sans"
          onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-[#D6E4EA] flex items-center justify-between bg-white">
          <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] block">
            Workshop Management
          </span>
            <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk']">
              {title}
            </h2>
          </div>
          <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#526274] hover:bg-[#F6FAFC] hover:text-[#111827] transition"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 bg-[#F6FAFC]">{children}</div>
      </div>
    </div>
);

export default Workshops;