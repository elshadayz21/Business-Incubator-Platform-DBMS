import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BarChart3,
  FolderKanban,
  GraduationCap,
  Boxes,
  Coins,
  Users,
  ChevronRight,
  ShieldCheck,
  Building2,
  Inbox as InboxIcon,
  Megaphone,
  Mail,
  Images,
  FileText,
  Layers,
  PieChart,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  MessageCircle,
} from "lucide-react";

const Sidebar = ({
  activeTab = "Dashboard",
  setActiveTab = () => {},
  userRole = "admin",
}) => {
  const isSuperadmin = userRole?.toLowerCase() === "superadmin";

  const [collapsed, setCollapsed] = useState(() => {
    return sessionStorage.getItem("sidebar_collapsed") === "true";
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      sessionStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  // --- NEW: Dynamic Badge Logic ---
  const [hasNewFunding, setHasNewFunding] = useState(false);

  useEffect(() => {
    const checkFundingStatus = async () => {
      try {
        const res = await fetch('/api/admin/funding?query=', { credentials: 'include' });
        const data = await res.json();

        // Check if any funding request was just Approved or Rejected by a founder
        // (This means it needs Admin attention)
        const needsAttention = Array.isArray(data) && data.some(f => f.status === 'Approved' || f.status === 'Rejected');
        setHasNewFunding(needsAttention);
      } catch (e) {
        console.error("Error checking funding status for badge:", e);
      }
    };
    checkFundingStatus();
  }, []);
  // --------------------------------

  // Operational modules (Admin only)
  const adminNavItems = [
    { id: 1, icon: LayoutDashboard, label: "Dashboard", badge: null },
    { id: 2, icon: FolderKanban, label: "Projects", badge: null },
    { id: 3, icon: BarChart3, label: "Mentors", badge: null },
    { id: 4, icon: GraduationCap, label: "Workshops", badge: null },
    { id: 5, icon: Boxes, label: "Resources", badge: null },
    { id: 6, icon: Coins, label: "Funding", badge: null },
    { id: 7, icon: InboxIcon, label: "Inbox", badge: null },
    { id: 8, icon: Megaphone, label: "Announcements", badge: null },
    { id: 10, icon: Mail, label: "Mass Email", badge: null },
    { id: 12, icon: Layers, label: "Cohorts", badge: null },
    { id: 14, icon: ClipboardList, label: "Applications", badge: null },
    { id: 17, icon: MessageCircle, label: "Chat", badge: null },
  ];

  // System/CMS modules (Superadmin only)
  const superadminNavItems = [
    { id: 1, icon: LayoutDashboard, label: "Dashboard", badge: null },
    { id: 13, icon: PieChart, label: "Reports", badge: null },
    { id: 15, icon: Users, label: "Users", badge: null },
    { id: 9, icon: Images, label: "Gallery", badge: null },
    { id: 11, icon: FileText, label: "Static Pages", badge: null },
    { id: 16, icon: ShieldCheck, label: "System Settings", badge: null },
    { id: 17, icon: MessageCircle, label: "Chat", badge: null },
  ];

  const navItems = isSuperadmin ? superadminNavItems : adminNavItems;

  return (
    <aside
      className={`h-screen bg-white border-r border-[#D6E4EA] flex flex-col shrink-0 font-sans shadow-sm z-30 select-none transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#D6E4EA] bg-[#F6FAFC] flex items-center justify-between">
        {!collapsed ? (
          <>
            <div className="min-w-0 flex-1">
              <a href="/" className="block">
                <img
                  src="/brand/dxvalley-wordmark.jpeg"
                  alt="DxValley"
                  className="h-9 w-auto object-contain object-left mix-blend-multiply mb-1"
                />
              </a>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#526274] leading-tight truncate">
                <Building2 size={12} className="text-[#00ADEF] shrink-0" />
                <span className="truncate">Cooperative Bank of Oromia</span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg border border-[#D6E4EA] bg-white text-[#526274] hover:bg-[#EAF8FC] hover:text-[#006F9E] transition shrink-0 ml-2"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          </>
        ) : (
          <div className="w-full flex flex-col items-center justify-center gap-1.5 py-1">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 rounded-xl border border-[#D6E4EA] bg-white text-[#006F9E] hover:bg-[#EAF8FC] transition shadow-xs"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>
            <span className="text-[10px] font-extrabold text-[#00ADEF] tracking-tight uppercase">
              Dx
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-1">
        <div
          className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#526274] ${
            collapsed ? "text-center text-[9px]" : ""
          }`}
        >
          {collapsed ? "MENU" : "Main Menu"}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.label;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.label)}
              title={item.label}
              className={`w-full flex items-center rounded-xl transition-all text-xs font-bold ${
                collapsed ? "justify-center p-3" : "justify-between px-3.5 py-3"
              } ${
                isActive
                  ? "bg-[#EAF8FC] text-[#006F9E] border-l-4 border-[#00ADEF] shadow-xs"
                  : "text-[#526274] hover:bg-[#F6FAFC] hover:text-[#111827]"
              }`}
            >
              <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                <Icon
                  size={20}
                  className={isActive ? "text-[#00ADEF]" : "text-[#526274]"}
                />
                {!collapsed && <span>{item.label}</span>}
              </div>

              {!collapsed && (
                <div className="flex items-center gap-1.5">
                  {item.badge === "New" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF1E3] text-[#E38524] font-bold border border-[#E38524]/20">
                      NEW
                    </span>
                  )}
                  {item.badge === "Admin" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAF8FC] text-[#006F9E] font-bold border border-[#00ADEF]/20">
                      SUPER
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight size={14} className="text-[#00ADEF]" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;