import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Layers,
  CalendarClock,
  CheckCircle2,
  Search,
  Loader2,
  Inbox,
  X,
  Filter,
} from "lucide-react";
import CohortTable from "./CohortTable";
import AddCohortForm from "./AddCohortForm";
import CohortDetailModal from "./CohortDetailModal";
import StatCard from "../../../components/StatCard";

const Cohorts = () => {
  const [cohorts, setCohorts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCohort, setEditingCohort] = useState(null);
  const [managingCohort, setManagingCohort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchCohorts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.electron.invoke("cohorts:get-all");
      setCohorts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching cohorts:", error);
      setCohorts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCohorts();
  }, [fetchCohorts]);

  const handleCreate = async (formData) => {
    try {
      await window.electron.invoke("cohorts:create", formData);
      setShowForm(false);
      fetchCohorts();
    } catch (error) {
      console.error("Error creating cohort:", error);
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await window.electron.invoke(
        "cohorts:update",
        editingCohort.id,
        formData,
      );
      setEditingCohort(null);
      setShowForm(false);
      fetchCohorts();
    } catch (error) {
      console.error("Error updating cohort:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this cohort? This cannot be undone.")) {
      try {
        await window.electron.invoke("cohorts:delete", id);
        fetchCohorts();
      } catch (error) {
        console.error("Error deleting cohort:", error);
      }
    }
  };

  const openEdit = (cohort) => {
    setEditingCohort(cohort);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCohort(null);
  };

  const filteredCohorts = cohorts.filter(
    (c) =>
      (filterStatus === "all" || c.status === filterStatus) &&
      c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const activeCount = cohorts.filter((c) => c.status === "active").length;
  const upcomingCount = cohorts.filter((c) => c.status === "upcoming").length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#00ADEF] via-[#078CC8] to-[#0878B4] rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full border-30 border-white/10" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider text-white">
              <Layers size={12} className="text-[#E38524]" />
              Program Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk']">
              Cohorts
            </h1>
            <p className="text-sm text-white/85 max-w-2xl leading-relaxed">
              Manage incubation batches — startup and MSME tracks, timelines,
              and application windows.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all shrink-0"
          >
            <Plus size={18} />
            <span>New Cohort</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Cohorts"
          value={cohorts.length}
          icon={Layers}
          badgeText="All time"
          accentColor="cyan"
        />
        <StatCard
          title="Active"
          value={activeCount}
          icon={CheckCircle2}
          badgeText="Running now"
          accentColor="orange"
        />
        <StatCard
          title="Upcoming"
          value={upcomingCount}
          icon={CalendarClock}
          badgeText="Not started"
          accentColor="cyan"
        />
      </div>

      {/* Search + Filter */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6E4EA] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]"
            size={18}
          />
          <input
            type="text"
            placeholder="Search cohorts by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium text-[#111827] outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20 transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={16} className="text-[#526274]" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-52 px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#D6E4EA]">
          <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={32} />
          <p className="text-[#526274] font-bold text-sm">Loading cohorts...</p>
        </div>
      ) : filteredCohorts.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#D6E4EA] shadow-xs overflow-hidden">
          <CohortTable
            cohorts={filteredCohorts}
            onEdit={openEdit}
            onDelete={handleDelete}
            onManage={setManagingCohort}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#D6E4EA] text-center p-6">
          <div className="p-4 bg-[#EAF8FC] rounded-full text-[#00ADEF] mb-3">
            <Inbox size={36} />
          </div>
          <h3 className="text-lg font-bold text-[#111827]">No cohorts found</h3>
          <p className="text-xs text-[#526274] mt-1 max-w-sm">
            Create your first cohort to start organizing applications and
            entrepreneurs.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all"
          >
            <Plus size={16} /> Create Cohort
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
            className="bg-white w-full max-w-xl max-h-[90vh] rounded-2xl border border-[#D6E4EA] shadow-lg flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#D6E4EA] flex items-center justify-between bg-[#F6FAFC]">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
                  Program Management
                </span>
                <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk']">
                  {editingCohort ? "Edit Cohort" : "New Cohort"}
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
              <AddCohortForm
                onSubmit={editingCohort ? handleUpdate : handleCreate}
                onCancel={closeForm}
                initialData={editingCohort}
              />
            </div>
          </div>
        </div>
      )}

      {/* Manage Members / Mentor Assignments Modal */}
      {managingCohort && (
        <CohortDetailModal
          cohort={managingCohort}
          onClose={() => setManagingCohort(null)}
        />
      )}
    </div>
  );
};

export default Cohorts;
