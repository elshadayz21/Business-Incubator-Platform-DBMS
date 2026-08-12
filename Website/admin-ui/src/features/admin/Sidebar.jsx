import React from "react";
import {
  LayoutDashboard,
  BarChart3,
  FolderKanban,
  GraduationCap,
  Boxes,
  Coins,
  Users,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Building2,
  Inbox as InboxIcon,
  Megaphone,
  Mail,
  CircleUserRound,
} from "lucide-react";

const Sidebar = ({
  activeTab = "Dashboard",
  setActiveTab = () => {},
  userRole = "admin",
}) => {
  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");

  const profileImage = currentUser.profile_image || null;

  const navItems = [
    { id: 1, icon: LayoutDashboard, label: "Dashboard", badge: null },
    { id: 2, icon: FolderKanban, label: "Projects", badge: null },
    { id: 3, icon: BarChart3, label: "Mentors", badge: null },
    { id: 4, icon: GraduationCap, label: "Workshops", badge: null },
    { id: 5, icon: Boxes, label: "Resources", badge: null },
    { id: 6, icon: Coins, label: "Funding", badge: "New" },
    { id: 7, icon: InboxIcon, label: "Inbox", badge: null },
    { id: 8, icon: Megaphone, label: "Announcements", badge: "New" },
    { id: 9, icon: Mail, label: "Mass Email", badge: null },
    ...(userRole?.toLowerCase() === "superadmin"
      ? [{ id: 10, icon: Users, label: "Users", badge: "Admin" }]
      : []),
  ];

  const handleLogout = async () => {
    try {
      await fetch("/v1/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "/v1/auth/login";
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-[#D6E4EA] flex flex-col shrink-0 font-sans shadow-sm z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#D6E4EA] bg-[#F6FAFC]">
        <a href="/" className="block">
          <img
            src="/brand/dxvalley-wordmark.jpeg"
            alt="DxValley"
            className="h-10 w-auto object-contain object-left mix-blend-multiply mb-2"
          />
        </a>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#526274] leading-tight">
          <Building2 size={12} className="text-[#00ADEF] shrink-0" />
          <span>Cooperative Bank of Oromia</span>
        </div>
      </div>

      {/* User Info Badge - routes to profile page */}
      <a
        href="/v1/auth/profile"
        title="View Profile"
        className="px-4 py-3 bg-[#EAF8FC] border-b border-[#D6E4EA] flex items-center justify-between group hover:bg-white transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#00ADEF] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs overflow-hidden group-hover:ring-2 group-hover:ring-[#E38524]/40 transition">
            {profileImage ? (
              <img
                src={profileImage}
                alt={currentUser.name || "Profile"}
                className="w-full h-full object-cover"
              />
            ) : (
              (currentUser.name
                ? currentUser.name.charAt(0).toUpperCase()
                : "A")
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#111827] truncate">
              {currentUser.name || "DxValley Admin"}
            </p>
            <p className="text-[10px] font-semibold text-[#006F9E] flex items-center gap-1">
              <ShieldCheck size={10} className="text-[#00ADEF]" />
              <span className="capitalize">{userRole || "Admin"}</span>
            </p>
          </div>
        </div>
        <CircleUserRound
          size={16}
          className="text-[#006F9E] group-hover:text-[#00ADEF] transition shrink-0"
        />
      </a>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#526274]">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.label;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all text-xs font-bold ${
                isActive
                  ? "bg-[#EAF8FC] text-[#006F9E] border-l-4 border-[#00ADEF] shadow-xs"
                  : "text-[#526274] hover:bg-[#F6FAFC] hover:text-[#111827]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={18}
                  className={isActive ? "text-[#00ADEF]" : "text-[#526274]"}
                />
                <span>{item.label}</span>
              </div>

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
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions Footer */}
      <div className="p-3 border-t border-[#D6E4EA] bg-[#F6FAFC] space-y-2">
        <a
          href="/"
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#D6E4EA] bg-white text-xs font-bold text-[#006F9E] hover:bg-[#EAF8FC] hover:border-[#00ADEF] transition-all shadow-2xs"
        >
          <span>View Public Site</span>
        </a>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-all"
        >
          <LogOut size={16} />
          <span>Exit / Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
