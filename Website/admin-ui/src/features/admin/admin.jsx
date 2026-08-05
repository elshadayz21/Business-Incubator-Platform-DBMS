import { useState } from "react";
import Dashboard from "./Dashboard/Dashboard";
import Sidebar from "./Sidebar";
import Workshops from "./Workshops/Workshops";
import Resources from "./Resources/Resources";
import Mentors from "./Mentors/Mentors.JSX";
import Projects from "./projects/projects";
import Funding from "./Funding/Funding";
import Users from "./Users/Users";
import Announcements from "./Announcements/Announcements";

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
      case "Users":
        return <Users />;
      case "Announcements":
        return <Announcements />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={userRole}
        />
        <div className="flex-1 overflow-y-auto pb-16">{renderContent()}</div>
      </div>
    </>
  );
};

export default Admin;
