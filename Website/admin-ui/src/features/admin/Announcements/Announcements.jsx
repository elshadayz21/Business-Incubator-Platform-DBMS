import React, { useState, useEffect } from "react";
import {
  Plus, Search, Loader2, Inbox, X, ArrowRight, Megaphone, CheckCircle, Clock,
} from "lucide-react";
import AddAnnouncementForm from "./AddAnnouncementForm";
import AnnouncementTable from "./AnnouncementTable";
import AnnouncementDetails from "./AnnouncementDetails";

const Announcements = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await window.electron.invoke("announcements:get-all");
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleAddAnnouncement = async (formData) => {
    try {
      await window.electron.invoke("announcements:create", formData);
      setShowAddForm(false);
      fetchAnnouncements();
    } catch (error) {
      console.error("Error creating announcement:", error);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (window.confirm("ARE YOU SURE YOU WANT TO DELETE THIS ANNOUNCEMENT?")) {
      try {
        await window.electron.invoke("announcements:delete", id);
        fetchAnnouncements();
      } catch (error) {
        console.error("Error deleting announcement:", error);
      }
    }
  };

  const handleViewDetails = async (announcement) => {
    try {
      const full = await window.electron.invoke("announcements:get-by-id", announcement.id);
      setSelectedAnnouncement(full);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching announcement details:", error);
    }
  };

  const filteredAnnouncements = announcements.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.body || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const publishedCount = announcements.filter(
    (a) => a.published_at && new Date(a.published_at) <= new Date()
  ).length;
  const scheduledCount = announcements.length - publishedCount;

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFFDF5] h-screen font-sans scrollbar-hide">
      <div className="p-6 lg:p-10 max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="bg-black text-white px-3 py-1 font-bold text-sm uppercase tracking-wider mb-2 inline-block transform -rotate-1">
              Content HUB
            </span>
            <h1 className="text-5xl md:text-6xl font-black text-black mb-2 uppercase tracking-tighter">
              Announcements{" "}
              <span className="bg-[#4f46e5] text-white px-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] italic inline-block transform rotate-1">
                Control
              </span>
            </h1>
            <p className="text-xl text-slate-600 font-medium border-l-4 border-[#4f46e5] pl-4 italic mt-4">
              Publish news, updates, and open-call notices to the public site.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-black text-white px-8 py-4 font-bold uppercase border-4 border-black shadow-[4px_4px_0_0_#4f46e5] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-3 text-lg"
          >
            <Plus size={24} strokeWidth={3} />
            New Announcement
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <StatCard title="Total" value={announcements.length} icon={Megaphone} bgClass="bg-[#4f46e5]" textClass="text-white" />
          <StatCard title="Published" value={publishedCount} icon={CheckCircle} bgClass="bg-[#0d9488]" textClass="text-white" />
          <StatCard title="Scheduled" value={scheduledCount} icon={Clock} bgClass="bg-[#f59e0b]" textClass="text-black" />
        </div>

        {/* Search */}
        <div className="bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] mb-8 flex items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} strokeWidth={2.5} />
            <input
              type="text"
              placeholder="SEARCH ANNOUNCEMENTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-black bg-[#FFFDF5] focus:outline-none focus:bg-white font-bold text-black placeholder-gray-500 transition-all uppercase"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed">
            <Loader2 className="text-black animate-spin mb-4" size={40} strokeWidth={2} />
            <p className="text-black font-black text-xl uppercase">Loading announcements...</p>
          </div>
        ) : filteredAnnouncements.length > 0 ? (
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000]">
            <AnnouncementTable
              announcements={filteredAnnouncements}
              onView={handleViewDetails}
              onDelete={handleDeleteAnnouncement}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed text-center">
            <div className="p-6 bg-gray-100 border-2 border-black rounded-full mb-6">
              <Inbox className="text-black" size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-black text-black uppercase mb-2">No announcements found</h3>
            <p className="text-gray-600 text-lg font-medium max-w-md mt-1 mb-8">
              Publish your first update for visitors to see.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-black text-white px-8 py-3 font-bold uppercase border-2 border-black shadow-[4px_4px_0_0_black] transition-all flex items-center gap-2"
            >
              <Plus size={20} strokeWidth={3} /> Create Announcement
            </button>
          </div>
        )}

        {/* Modals */}
        {showAddForm && (
          <Modal title="Add New Announcement" onClose={() => setShowAddForm(false)}>
            <AddAnnouncementForm onSubmit={handleAddAnnouncement} onCancel={() => setShowAddForm(false)} />
          </Modal>
        )}

        {showDetailsModal && selectedAnnouncement && (
          <Modal title="Announcement Details" onClose={() => setShowDetailsModal(false)}>
            <AnnouncementDetails announcement={selectedAnnouncement} />
          </Modal>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: IconComponent, bgClass, textClass }) => (
  <div className={`relative border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all duration-200 group ${bgClass}`}>
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]">
        {IconComponent && <IconComponent className="text-black" size={24} strokeWidth={2.5} />}
      </div>
      <div className="bg-white border-2 border-black px-2 py-0.5 transform rotate-2">
        <ArrowRight size={16} className="text-black" />
      </div>
    </div>
    <h3 className={`text-3xl font-black mb-1 tracking-tight ${textClass}`}>{value}</h3>
    <p className={`text-sm font-bold uppercase tracking-wider ${textClass} opacity-90`}>{title}</p>
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-white w-full max-w-5xl max-h-[90vh] border-4 border-black shadow-[8px_8px_0_0_black] flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="p-6 border-b-4 border-black flex items-center justify-between bg-[#FFFDF5]">
        <h2 className="text-3xl font-black uppercase text-black">{title}</h2>
        <button onClick={onClose} className="text-black hover:bg-red-100 border-2 border-transparent hover:border-black p-2 transition-all font-black">
          <X size={28} strokeWidth={3} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 bg-white p-6">{children}</div>
    </div>
  </div>
);

export default Announcements;
