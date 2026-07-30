import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Briefcase,
  UserCheck,
  Search,
  Loader2,
  Inbox,
  Pin,
  X,
  Filter,
  GraduationCap,
} from "lucide-react";
import MentorTable from "./MentorTable";
import AddMentorForm from "./AddMentorForm";
import StatCard from "../../../components/StatCard";

const Mentors = () => {
  const [mentors, setMentors] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
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
    fetchMentors();
  };

  const filteredMentors = mentors.filter(
    (m) =>
      (filterExpertise === "all" ||
        (m.expertise &&
          m.expertise.toLowerCase() === filterExpertise.toLowerCase())) &&
      m.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
              Expert Guidance
            </span>
            <h1 className="text-5xl md:text-6xl font-black text-black mb-2 uppercase tracking-tighter">
              Mentors{" "}
              <span className="bg-[#4f46e5] text-white px-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] italic inline-block transform rotate-1">
                Directory
              </span>
            </h1>
            <p className="text-xl text-slate-600 font-medium border-l-4 border-[#4f46e5] pl-4 italic mt-4">
              Manage experts, assign projects & track activity.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-black text-white px-8 py-4 font-bold uppercase border-4 border-black shadow-[4px_4px_0_0_#4f46e5] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-3 text-lg"
          >
            <Plus size={24} strokeWidth={3} />
            Add Mentor
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <StatCard
            title="Total Mentors"
            value={mentors.length}
            icon={Briefcase}
            bgClass="bg-[#4f46e5]"
            textClass="text-white"
          />
          <StatCard
            title="Active"
            value={mentors.filter((m) => m.status === "active").length}
            icon={UserCheck}
            bgClass="bg-[#0d9488]"
            textClass="text-white"
          />
          <StatCard
            title="Assigned Projects"
            value={mentors.reduce(
              (acc, m) => acc + parseInt(m.projects_count || 0),
              0,
            )}
            icon={Briefcase}
            bgClass="bg-[#0f172a]"
            textClass="text-white"
          />
          <StatCard
            title="Workshops Led"
            value={mentors.reduce(
              (acc, m) => acc + parseInt(m.workshops_count || 0),
              0,
            )}
            icon={GraduationCap}
            bgClass="bg-white"
            textClass="text-black"
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
              placeholder="SEARCH MENTORS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-black bg-[#FFFDF5] focus:outline-none focus:ring-0 focus:bg-white font-bold text-black placeholder-gray-500 transition-all uppercase"
            />
          </div>

          <div className="relative w-full xl:w-auto">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
              strokeWidth={2.5}
            />
            <select
              value={filterExpertise}
              onChange={(e) => setFilterExpertise(e.target.value)}
              className="w-full xl:w-64 pl-10 pr-8 py-3 border-2 border-black bg-white text-black font-bold uppercase outline-none focus:bg-blue-50 cursor-pointer shadow-[2px_2px_0_0_black]"
            >
              <option value="all">All Expertise</option>
              <option value="technology">Technology</option>
              <option value="business">Business</option>
              <option value="marketing">Marketing</option>
              <option value="design">Design</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
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
              Loading mentors...
            </p>
          </div>
        ) : filteredMentors.length > 0 ? (
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000]">
            <MentorTable
              mentors={filteredMentors}
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
              No mentors found
            </h3>
            <p className="text-gray-600 text-lg font-medium max-w-md mt-1 mb-8">
              Start by adding expert profiles to help guide your startups.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-black text-white px-8 py-3 font-bold uppercase border-2 border-black shadow-[4px_4px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2"
            >
              <Plus size={20} strokeWidth={3} />
              Add First Mentor
            </button>
          </div>
        )}

        {/* Add Mentor Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-blue-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] border-4 border-black shadow-[8px_8px_0_0_black] flex flex-col animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b-4 border-black flex items-center justify-between bg-blue-50">
                <h2 className="text-2xl font-black text-blue-950 uppercase flex items-center gap-3">
                  <div className="p-2 border-2 border-black bg-white">
                    <Pin size={20} strokeWidth={3} />
                  </div>
                  Add New Mentor
                </h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-black hover:bg-red-100 border-2 border-transparent hover:border-black p-1 transition-all"
                >
                  <X size={28} strokeWidth={3} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 bg-white">
                <AddMentorForm
                  onClose={() => setShowAddForm(false)}
                  onSuccess={handleAddMentor}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Mentors;
