import React, { useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  FileText,
  ChevronDown,
  LogOut,
  ArrowRight,
} from "lucide-react";

const Sidebar = ({ activeTab = "Dashboard", setActiveTab = () => {} }) => {
  const [isElementsOpen, setIsElementsOpen] = useState(false);

  const navItems = [
    { id: 1, icon: LayoutDashboard, label: "Dashboard", badge: null },
    { id: 2, icon: BarChart3, label: "Mentors", badge: null },
    { id: 3, icon: Users, label: "Projects", badge: null },
    { id: 4, icon: Package, label: "Workshops", badge: null },
    { id: 5, icon: ShoppingCart, label: "Resources", badge: null },
    { id: 6, icon: FileText, label: "Funding", badge: "New" },
  ];

  const handleItemClick = (label) => {
    setActiveTab(label);
    if (label === "Elements") {
      setIsElementsOpen(!isElementsOpen);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.dispatchEvent(new Event("auth-change"));
  };

  return (
    <div className="w-64 h-screen bg-[#FFFDF5] border-r-4 border-black flex flex-col shrink-0 font-sans overflow-hidden">
      {/* Logo Section */}
      <div className="p-6 border-b-4 border-black bg-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-black border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_#4f46e5]">
            <span className="text-white font-black text-2xl tracking-tighter">
              B
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl uppercase leading-none tracking-tighter text-black">
              Incubator
            </span>
            <span className="text-[10px] font-black uppercase text-[#4f46e5] tracking-widest mt-1">
              Admin Suite
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto scrollbar-hide space-y-3">

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.label;

          return (
            <div key={item.id}>
              <button
                onClick={() => handleItemClick(item.label)}
                className={`w-full flex items-center justify-between px-4 py-4 transition-all border-4 font-black uppercase text-xs tracking-widest ${
                  isActive
                    ? "bg-[#4f46e5] text-white border-black shadow-[4px_4px_0_0_#000] translate-x-[-2px] translate-y-[-2px]"
                    : "bg-white text-black border-black hover:bg-[#FFFDF5] hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} strokeWidth={3} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge === "New" && (
                    <span
                      className={`text-[10px] px-2 py-0.5 border-2 border-black font-black ${isActive ? "bg-white text-black" : "bg-[#f59e0b] text-black"}`}
                    >
                      NEW
                    </span>
                  )}
                  {isActive && (
                    <ArrowRight
                      size={14}
                      strokeWidth={4}
                      className="animate-pulse"
                    />
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t-4 border-black bg-white">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-[#ef4444] text-white border-4 border-black font-black uppercase text-xs tracking-widest transition-all shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
        >
          <LogOut size={18} strokeWidth={3} />
          <span>Exit System</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
