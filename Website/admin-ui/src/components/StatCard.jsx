import React from "react";
import { TrendingUp, ArrowUpRight } from "lucide-react";

const StatCard = ({ title, value, icon: IconComponent, badgeText = "+12% this month", accentColor = "cyan" }) => {
  const isOrange = accentColor === "orange";
  
  return (
    <div className="bg-white rounded-2xl border border-[#D6E4EA] p-5 shadow-xs hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
          isOrange ? "bg-[#FFF1E3] text-[#E38524] border border-[#E38524]/20" : "bg-[#EAF8FC] text-[#006F9E] border border-[#00ADEF]/20"
        }`}>
          {IconComponent && <IconComponent size={22} />}
        </div>

        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
          isOrange ? "bg-[#FFF1E3] text-[#E38524]" : "bg-[#EAF8FC] text-[#006F9E]"
        }`}>
          <TrendingUp size={12} />
          {badgeText}
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="text-3xl font-extrabold text-[#111827] font-['Space_Grotesk'] tracking-tight">
          {value}
        </h3>
        <p className="text-xs font-bold uppercase tracking-wider text-[#526274]">
          {title}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
