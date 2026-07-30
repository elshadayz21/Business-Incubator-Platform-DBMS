import React from 'react';
import { ArrowRight } from 'lucide-react';

const StatCard = ({ title, value, icon: IconComponent, bgClass, textClass }) => {
  return (
    <div
      className={`relative border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all duration-200 group ${bgClass}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]">
          {/* Check if icon exists to prevent crashes */}
          {IconComponent && (
            <IconComponent 
              className="text-black" 
              size={24} 
              strokeWidth={2.5} 
            />
          )}
        </div>
        {/* Decorative Arrow */}
        <div className="bg-white border-2 border-black px-2 py-0.5 transform rotate-2">
          <ArrowRight size={16} className="text-black" />
        </div>
      </div>
      
      <h3 className={`text-3xl font-black mb-1 tracking-tight ${textClass}`}>
        {value}
      </h3>
      
      <p className={`text-sm font-bold uppercase tracking-wider ${textClass} opacity-90`}>
        {title}
      </p>
    </div>
  );
};

export default StatCard;