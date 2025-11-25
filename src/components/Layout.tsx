
import React from 'react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
}

export const Sidebar = ({ activeTab, setActiveTab, user, onLogout }: SidebarProps) => (
  <div className="w-64 bg-white h-screen shadow-lg fixed left-0 top-0 flex flex-col z-10">
    <div className="p-6 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="bg-green-600 text-white p-2 rounded-lg shadow-lg shadow-green-200">
          <i className="fa-solid fa-cloud-showers-water text-xl"></i>
        </div>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">AgriCloud</h1>
      </div>
    </div>
    <nav className="flex-1 p-4 space-y-2">
      {[
        { id: "Dashboard", icon: "fa-chart-line" },
        { id: "Farms", icon: "fa-wheat-awn" },
        { id: "Assistant", icon: "fa-comments" },
        { id: "Settings", icon: "fa-gear" }
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
            activeTab === item.id
              ? "bg-green-50 text-green-700 font-medium shadow-sm"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          }`}
        >
          <i className={`fa-solid ${item.icon} w-6 text-center`}></i>
          {item.id}
        </button>
      ))}
    </nav>
    <div className="p-4 border-t border-gray-100">
      <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
        <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <p className="font-medium truncate text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-400">{user.role}</p>
        </div>
      </div>
      <button 
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 py-2 rounded-lg text-sm transition"
      >
        <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
      </button>
    </div>
  </div>
);
