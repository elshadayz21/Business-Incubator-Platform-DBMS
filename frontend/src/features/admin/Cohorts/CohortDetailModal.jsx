import React, { useState, useEffect, useCallback } from "react";
import { X, Users, UserPlus, Trash2, Loader2, Plus } from "lucide-react";

const CohortDetailModal = ({ cohort, onClose }) => {
  const [activeTab, setActiveTab] = useState("members");
  const [members, setMembers] = useState([]);
  const [mentorAssignments, setMentorAssignments] = useState([]);
  const [allEntrepreneurs, setAllEntrepreneurs] = useState([]);
  const [allMentors, setAllMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState("");
  const [selectedMentor, setSelectedMentor] = useState("");
  const [selectedAssignEntrepreneur, setSelectedAssignEntrepreneur] =
    useState("");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [membersData, assignmentsData, entrepreneursData, mentorsData] =
        await Promise.all([
          window.electron.invoke("cohort-members:get-all", cohort.id),
          window.electron.invoke("mentor-assignments:get-all", cohort.id),
          window.electron.invoke("users:get-by-role", "entrepreneur"),
          window.electron.invoke("users:get-by-role", "mentor"),
        ]);
      setMembers(Array.isArray(membersData) ? membersData : []);
      setMentorAssignments(
        Array.isArray(assignmentsData) ? assignmentsData : [],
      );
      setAllEntrepreneurs(
        Array.isArray(entrepreneursData) ? entrepreneursData : [],
      );
      setAllMentors(Array.isArray(mentorsData) ? mentorsData : []);
    } catch (error) {
      console.error("Error loading cohort details:", error);
    } finally {
      setLoading(false);
    }
  }, [cohort.id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const availableEntrepreneurs = allEntrepreneurs.filter(
    (u) => !members.some((m) => m.user_id === u.id),
  );

  const handleAddMember = async () => {
    if (!selectedEntrepreneur) return;
    try {
      await window.electron.invoke("cohort-members:add", {
        cohort_id: cohort.id,
        user_id: Number(selectedEntrepreneur),
      });
      setSelectedEntrepreneur("");
      fetchAll();
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  const handleRemoveMember = async (id) => {
    if (!window.confirm("Remove this member from the cohort?")) return;
    try {
      await window.electron.invoke("cohort-members:remove", id);
      fetchAll();
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const handleAddAssignment = async () => {
    if (!selectedMentor || !selectedAssignEntrepreneur) return;
    try {
      await window.electron.invoke("mentor-assignments:create", {
        mentor_id: Number(selectedMentor),
        entrepreneur_id: Number(selectedAssignEntrepreneur),
        cohort_id: cohort.id,
      });
      setSelectedMentor("");
      setSelectedAssignEntrepreneur("");
      fetchAll();
    } catch (error) {
      console.error("Error creating mentor assignment:", error);
    }
  };

  const handleRemoveAssignment = async (id) => {
    if (!window.confirm("Remove this mentor assignment?")) return;
    try {
      await window.electron.invoke("mentor-assignments:remove", id);
      fetchAll();
    } catch (error) {
      console.error("Error removing mentor assignment:", error);
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const labelClasses =
    "text-[11px] font-extrabold uppercase tracking-wider text-[#526274] block mb-2";
  const selectClasses =
    "w-full px-3.5 py-2.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-sm font-medium text-[#111827] outline-none focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20 transition-all";

  return (
    <div
      className="fixed inset-0 bg-[#111827]/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl border border-[#D6E4EA] shadow-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#D6E4EA] flex items-center justify-between bg-[#F6FAFC]">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006F9E] block mb-1">
              Program Management
            </span>
            <h2 className="text-xl font-bold text-[#111827] font-['Space_Grotesk']">
              {cohort.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#526274] hover:bg-white hover:text-[#111827] rounded-xl border border-transparent hover:border-[#D6E4EA] transition-all"
          >
            <X size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#D6E4EA] px-6 bg-white">
          <button
            onClick={() => setActiveTab("members")}
            className={`px-4 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "members"
                ? "border-[#00ADEF] text-[#006F9E]"
                : "border-transparent text-[#526274] hover:text-[#111827]"
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-4 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "assignments"
                ? "border-[#00ADEF] text-[#006F9E]"
                : "border-transparent text-[#526274] hover:text-[#111827]"
            }`}
          >
            Mentor Assignments
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="text-[#00ADEF] animate-spin mb-3" size={28} />
              <p className="text-[#526274] font-bold text-sm">Loading...</p>
            </div>
          ) : activeTab === "members" ? (
            <div className="space-y-5">
              {/* Add member */}
              <div className="flex items-end gap-3 bg-[#F6FAFC] p-4 rounded-xl border border-[#D6E4EA]">
                <div className="flex-1">
                  <label className={labelClasses}>Add Entrepreneur</label>
                  <select
                    value={selectedEntrepreneur}
                    onChange={(e) => setSelectedEntrepreneur(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="">Select entrepreneur...</option>
                    {availableEntrepreneurs.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedEntrepreneur}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UserPlus size={16} /> Add
                </button>
              </div>

              {/* Members table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F6FAFC] border-b border-[#D6E4EA] text-[#526274] text-xs font-bold uppercase tracking-wider">
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Current Stage</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6E4EA] text-sm">
                    {members.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-6 text-center text-[#526274] text-sm"
                        >
                          No members yet.
                        </td>
                      </tr>
                    ) : (
                      members.map((m) => (
                        <tr
                          key={m.id}
                          className="hover:bg-[#F6FAFC] transition-colors"
                        >
                          <td className="p-3 font-bold text-[#111827]">
                            {m.name}
                          </td>
                          <td className="p-3 text-[#526274]">{m.email}</td>
                          <td className="p-3">
                            <span className="inline-flex px-2.5 py-1 rounded-full bg-[#EAF8FC] text-[#006F9E] text-xs font-bold border border-[#00ADEF]/20 capitalize">
                              {m.current_stage || "idea"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleRemoveMember(m.id)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-all"
                              title="Remove Member"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Add assignment */}
              <div className="flex items-end gap-3 bg-[#F6FAFC] p-4 rounded-xl border border-[#D6E4EA] flex-wrap">
                <div className="flex-1 min-w-[180px]">
                  <label className={labelClasses}>Mentor</label>
                  <select
                    value={selectedMentor}
                    onChange={(e) => setSelectedMentor(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="">Select mentor...</option>
                    {allMentors.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className={labelClasses}>Entrepreneur</label>
                  <select
                    value={selectedAssignEntrepreneur}
                    onChange={(e) =>
                      setSelectedAssignEntrepreneur(e.target.value)
                    }
                    className={selectClasses}
                  >
                    <option value="">Select entrepreneur...</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddAssignment}
                  disabled={!selectedMentor || !selectedAssignEntrepreneur}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E38524] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs hover:bg-[#C97019] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={16} /> Assign
                </button>
              </div>

              {/* Assignments table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F6FAFC] border-b border-[#D6E4EA] text-[#526274] text-xs font-bold uppercase tracking-wider">
                      <th className="p-3">Mentor</th>
                      <th className="p-3">Entrepreneur</th>
                      <th className="p-3">Assigned Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6E4EA] text-sm">
                    {mentorAssignments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-6 text-center text-[#526274] text-sm"
                        >
                          No mentor assignments yet.
                        </td>
                      </tr>
                    ) : (
                      mentorAssignments.map((a) => (
                        <tr
                          key={a.id}
                          className="hover:bg-[#F6FAFC] transition-colors"
                        >
                          <td className="p-3 font-bold text-[#111827]">
                            {a.mentor_name}
                          </td>
                          <td className="p-3 text-[#111827]">
                            {a.entrepreneur_name}
                          </td>
                          <td className="p-3 text-[#526274]">
                            {formatDate(a.assigned_at)}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleRemoveAssignment(a.id)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-all"
                              title="Remove Assignment"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CohortDetailModal;
