
import React from 'react';

export const Spinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
);

export const MetricCard = ({ title, value, unit, icon, color, subtext }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-${color.replace('bg-', '').replace('text-', '')}-600`}>
        <i className={`fa-solid ${icon} text-xl ${color.replace('bg-', 'text-')}`}></i>
      </div>
      {subtext && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">{subtext}</span>}
    </div>
    <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold text-gray-800">{value}</span>
      <span className="text-gray-400 text-sm font-medium">{unit}</span>
    </div>
  </div>
);
