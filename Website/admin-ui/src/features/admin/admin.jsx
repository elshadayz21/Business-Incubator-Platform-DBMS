import { useState } from "react";
import Dashboard from "./Dashboard/Dashboard";
import Sidebar from "./Sidebar";
import Workshops from "./Workshops/Workshops";
import Resources from "./Resources/Resources";
import Mentors from "./Mentors/Mentors";
import Projects from "./projects/projects";
import Funding from "./Funding/Funding";
import Users from "./Users/Users";
import Inbox from "./Inbox/Inbox";
import Announcements from "./Announcements/Announcements";
import Gallery from "./Gallery/Gallery";
import MassEmail from "./MassEmail/MassEmail";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const userRole = JSON.parse(sessionStorage.getItem("user") || "{}").role;

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return <Dashboard />;
      case "Workshops":
        return <Workshops />;
      case "Resources":
        return <Resources />;
      case "Mentors":
        return <Mentors />;
      case "Projects":
        return <Projects />;
      case "Funding":
        return <Funding />;
      case "Inbox":               //  for inbox
        return <Inbox />;         // for inbox
      case "Announcements":      // for announcements
        return <Announcements />;
      case "Gallery":            // for photo gallery CMS
        return <Gallery />;
      case "Mass Email":         // for mass email (UR-B4)
        return <MassEmail />;
      case "Users":
        return <Users />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F6FAFC] font-sans text-[#111827] overflow-hidden selection:bg-[#E38524] selection:text-white">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
      />
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default Admin;
