import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Briefcase,
  UserCheck,
  Search,
  Loader2,
  Inbox,
  X,
  Filter,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import MentorTable from "./MentorTable";
import AddMentorForm from "./AddMentorForm";
import StatCard from "../../../components/StatCard";

const Mentors = () => {
  const [mentors, setMentors] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMentor, setEditingMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterExpertise, setFilterExpertise] = useState("all");

  const fetchMentors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.electron.invoke("mentors:get-all");
      setMentors(data || []);
    } catch (error) {
      console.error("Error fetching mentors:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const handleAddMentor = () => {
    setShowAddForm(false);
    setEditingMentor(null);
    fetchMentors();
  };

  const handleEdit = (mentor) => {
    setEditingMentor(mentor);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this mentor? This cannot be undone.")) return;
    try {
      await window.electron.invoke("mentors:delete", id);
      fetchMentors();
    } catch (err) {
      console.error("Failed to delete mentor:", err);
      window.alert("Failed to delete mentor. Please try again.");
    }
  };

  const filteredMentors = mentors.filter((m) => {
    const matchesSearch = (m.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterExpertise === "all") return true;
    if (!m.expertise) return filterExpertise === "others";
    const exp = m.expertise.toLowerCase();
    if (filterExpertise === "others") {
      return (
        exp.includes("other") ||
        !["technology", "tech", "software", "business", "finance", "marketing", "growth", "design", "product"].some(
          (s) => exp.includes(s)
        )
      );
    }
    return exp.includes(filterExpertise.toLowerCase());
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#D6E4EA] shadow-xs">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
            Expert Advisory
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] font-['Space_Grotesk']">
            Mentors &amp; Consultants Directory
          </h1>
          <p className="text-xs text-[#526274] mt-1">
            Manage industry experts, track startup advisory assignments, and host domain workshops.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all shrink-0"
        >
          <Plus size={18} />
          <span>Add New Mentor</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Mentors"
          value={mentors.length}
          icon={Briefcase}
          badgeText="Verified network"
          accentColor="cyan"
        />
        <StatCard
          title="Active Status"
          value={mentors.filter((m) => m.status === "active").length}
          icon={UserCheck}
          badgeText="Available"
          accentColor="orange"
        />
        <StatCard
          title="Assigned Projects"
          value={mentors.reduce(
            (acc, m) => acc + parseInt(m.projects_count || 0),
            0
          )}
          icon={Briefcase}
          badgeText="Ongoing guidance"
          accentColor="cyan"
        />
        <StatCard
          title="Workshops Led"
          value={mentors.reduce(
            (acc, m) => acc + parseInt(m.workshops_count || 0),
            0
          )}
          icon={GraduationCap}
          badgeText="Capacity sessions"
          accentColor="orange"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6E4EA] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526274]"
            size={18}
          />
          <input
            type="text"
            placeholder="Search mentors by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium text-[#111827] outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={16} className="text-[#526274]" />
          <select
            value={filterExpertise}
            onChange={(e) => setFilterExpertise(e.target.value)}
            className="w-full md:w-56 px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-xs font-bold text-[#111827] outline-none focus:border-[#00ADEF] cursor-pointer"
          >
            <option value="all">All Expertise Sectors</option>
            <option value="technology">Technology &amp; Software</option>
            <option value="business">Business &amp; Finance</option>
            <option value="marketing">Marketing &amp; Growth</option>
            <option value="design">Design &amp; Product</option>
            <option value="others">Others</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#D6E4EA]">
          <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={32} />
          <p className="text-[#526274] font-bold text-sm">Loading mentor profiles...</p>
        </div>
      ) : filteredMentors.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#D6E4EA] shadow-xs overflow-hidden">
          <MentorTable
            mentors={filteredMentors}
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
          <h3 className="text-lg font-bold text-[#111827]">No mentors found</h3>
          <p className="text-xs text-[#526274] mt-1 max-w-sm mb-6">
            Start by registering expert advisors to guide DxValley incubated startups.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E38524] text-white text-xs font-bold uppercase"
          >
            <Plus size={16} />
            Add First Mentor
          </button>
        </div>
      )}

      {/* Add/Edit Mentor Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[#D6E4EA] shadow-xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#D6E4EA] flex items-center justify-between bg-white">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006F9E] block">
                  Expert Network
                </span>
                <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk']">
                  {editingMentor ? "Edit Mentor Profile" : "Add New Mentor Profile"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingMentor(null);
                }}
                className="p-2 rounded-xl text-[#526274] hover:bg-[#F6FAFC] hover:text-[#111827] transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 bg-[#F6FAFC]">
              <AddMentorForm
                initialData={editingMentor}
                onClose={() => {
                  setShowAddForm(false);
                  setEditingMentor(null);
                }}
                onSuccess={handleAddMentor}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mentors;
