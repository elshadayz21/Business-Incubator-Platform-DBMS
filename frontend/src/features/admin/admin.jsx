import { useState, useEffect } from "react";
import Dashboard from "./Dashboard/Dashboard";
import Sidebar from "./Sidebar";
import Workshops from "./Workshops/Workshops";
import Resources from "./Resources/Resources";
import Mentors from "./Mentors/Mentors";
import Projects from "./projects/projects";
import Funding from "./Funding/Funding";
import Users from "./Users/Users";
import Inbox from "./inbox/inbox";
import Announcements from "./Announcements/Announcements";
import Gallery from "./Gallery/Gallery";
import MassEmail from "./MassEmail/MassEmail";
import StaticPages from "./StaticPages/StaticPages";
import Cohorts from "./Cohorts/Cohorts";
import Progress from "./Progress/Progress";
import Reports from "./Reports/Reports";
import Applications from "./Applications/Applications";
import SystemSettings from "./SystemSettings/SystemSettings";
import AuditLog from "./AuditLog/AuditLog";
import UserMenu from "../../components/UserMenu";
import ChatPanel from "../../components/ChatPanel";

const Admin = () => {
  const [activeTab, setActiveTabState] = useState(() => {
    return sessionStorage.getItem("admin_active_tab") || "Dashboard";
  });

  const setActiveTab = (tab) => {
    sessionStorage.setItem("admin_active_tab", tab);
    setActiveTabState(tab);
  };

  // Deep-link support: an email "new message" notification links back with
  // ?openChat=<userId>. App.jsx stashes that id in sessionStorage (it
  // survives the login redirect for signed-out visitors); once this portal
  // mounts we consume it once, jump to the Chat tab, and hand the id to
  // ChatPanel so it can open that conversation.
  const [openChatId, setOpenChatId] = useState(null);
  useEffect(() => {
    const pending = sessionStorage.getItem("pending_open_chat");
    if (pending) {
      sessionStorage.removeItem("pending_open_chat");
      setOpenChatId(pending);
      setActiveTab("Chat");
    }
  }, []);

  // Same idea for other notification emails (project/funding/mentor
  // updates), which deep-link to a specific tab rather than a chat contact.
  useEffect(() => {
    const pendingTab = sessionStorage.getItem("pending_open_tab");
    if (pendingTab) {
      sessionStorage.removeItem("pending_open_tab");
      setActiveTab(pendingTab);
    }
  }, []);


  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
  const userRole = currentUser.role;
  const isSuperadmin = userRole?.toLowerCase() === "superadmin";

  // Operational modules are Admin-only; system/CMS modules are Superadmin-only.
  const adminOnlyTabs = [
    "Projects",
    "Mentors",
    "Workshops",
    "Resources",
    "Funding",
    "Inbox",
    "Announcements",
    "Mass Email",
    "Cohorts",
    "Progress",
    "Applications",
  ];
  const superadminOnlyTabs = [
    "Reports",
    "Users",
    "Gallery",
    "Static Pages",
    "System Settings",
    "Audit Trail",
  ];

  const canAccess = (tab) => {
    if (isSuperadmin) return !adminOnlyTabs.includes(tab);
    return !superadminOnlyTabs.includes(tab);
  };

  useEffect(() => {
    if (!canAccess(activeTab)) {
      setActiveTab("Dashboard");
    }
  }, [activeTab, isSuperadmin]);

  const renderContent = () => {
    if (!canAccess(activeTab)) return <Dashboard />;
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
      case "Inbox": //  for inbox
        return <Inbox />; // for inbox
      case "Announcements": // for announcements
        return <Announcements />;
      case "Gallery":            // for photo gallery CMS
        return <Gallery />;
      case "Mass Email":         // for mass email (UR-B4)
        return <MassEmail />;
      case "Static Pages":
        return <StaticPages />;
      case "Users":
        return <Users />;
      case "Cohorts":
        return <Cohorts />;
      case "Progress":
        return <Progress />;
      case "Reports":
        return <Reports />;
      default:
        return <Dashboard />;
      case "Applications":
        return <Applications />;
      case "System Settings":
        return <SystemSettings />;
      case "Audit Trail":
        return <AuditLog />;
      case "Chat":
        return <ChatPanel currentUser={currentUser} openContactId={openChatId} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F6FAFC] font-sans text-[#111827] overflow-hidden selection:bg-[#E38524] selection:text-white">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex items-center justify-end border-b border-[#D6E4EA] bg-white/95 px-6 py-3 backdrop-blur">
          <UserMenu
            user={currentUser}
            roleLabel={isSuperadmin ? "Super Admin" : "Admin"}
            onNotifications={() => setActiveTab(isSuperadmin ? "Dashboard" : "Inbox")}
          />
        </header>
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Admin;
