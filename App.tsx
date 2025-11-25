
import React, { useState, useEffect } from "react";
import { User, Farm } from "./types";
import { StorageService, fetchSoilData } from "./services";
import { Login } from "./components/Auth";
import { Sidebar } from "./components/Layout";
import { Spinner, MetricCard } from "./components/Shared";
import { FarmCard, AddFarmModal, FarmDetail } from "./components/Farm";
import { ChatAssistant } from "./components/Chat";
import { SettingsView } from "./components/Settings";

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Initial Load: Check for Session
  useEffect(() => {
    const sessionUser = StorageService.getUser();
    if (sessionUser) {
      handleLoginSuccess(sessionUser);
    } else {
      setLoading(false);
    }
  }, []);

  // Helper to load data for a specific user
  const handleLoginSuccess = async (u: User) => {
    setUser(u);
    try {
      const userFarms = await StorageService.getFarmsForUser(u.id);
      setFarms(userFarms);
    } catch (err) {
      console.error('Failed to load farms:', err);
      setFarms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    StorageService.logout();
    setUser(null);
    setFarms([]);
  };

  const handleAddFarm = async (farmData: Partial<Farm>) => {
    if (!user) return;

    const newFarm: Farm = {
      id: Date.now().toString(),
      userId: user.id, // IMPORTANT: Link to current user
      name: farmData.name || "New Farm",
      crop: farmData.crop || "Unknown",
      location: farmData.location || { lat: 0, lon: 0 },
      size: farmData.size || 0,
      plantingDate: farmData.plantingDate || new Date().toISOString()
    };

    try {
      // 1. Save basic farm via API
      const createdFarm = await StorageService.addFarm(newFarm);
      const updatedFarms = await StorageService.getFarmsForUser(user.id);
      setFarms(updatedFarms);

      // 2. Background Soil Analysis
      fetchSoilData(newFarm.location.lat, newFarm.location.lon)
        .then(async (soil) => {
          const updatedFarm = { ...createdFarm, soilData: soil };
          await StorageService.updateFarm(updatedFarm);
          // Update state to reflect new soil data
          const refreshedFarms = await StorageService.getFarmsForUser(user.id);
          setFarms(refreshedFarms);
        })
        .catch(err => console.warn("Background soil fetch failed", err));
    } catch (err) {
      console.error('Failed to create farm:', err);
      alert('Failed to create farm. Please try again.');
    }
  };

  const handleUpdateFarm = async (updatedFarm: Farm) => {
    if (!user) return;
    
    try {
      await StorageService.updateFarm(updatedFarm);
      
      // Refresh farm list from API
      const refreshedFarms = await StorageService.getFarmsForUser(user.id);
      setFarms(refreshedFarms);
      
      // If currently viewing this farm, update the selection state
      if (selectedFarm?.id === updatedFarm.id) {
          setSelectedFarm(updatedFarm);
      }
    } catch (err) {
      console.error('Failed to update farm:', err);
      alert('Failed to update farm. Please try again.');
    }
  };

  const handleDeleteFarm = async (id: string) => {
    if (!user) return;
    
    if (window.confirm("Are you sure you want to delete this farm?")) {
        try {
          await StorageService.deleteFarm(id);
          // Refresh list from API
          const refreshedFarms = await StorageService.getFarmsForUser(user.id);
          setFarms(refreshedFarms);
          
          if (selectedFarm?.id === id) {
              setSelectedFarm(null);
          }
        } catch (err) {
          console.error('Failed to delete farm:', err);
          alert('Failed to delete farm. Please try again.');
        }
    }
  };

  const handleUpdateUser = (u: User) => {
      setUser(u);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;

  if (!user) return <Login onLogin={handleLoginSuccess} />;

  const renderContent = () => {
    if (selectedFarm) {
      return <FarmDetail farm={selectedFarm} user={user} onBack={() => setSelectedFarm(null)} onUpdate={handleUpdateFarm} />;
    }

    switch (activeTab) {
      case "Dashboard":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Active Plots" value={farms.length} unit="plots" icon="fa-tractor" color="bg-green-100 text-green-600" />
              <MetricCard title="Total Area" value={farms.reduce((acc, f) => acc + f.size, 0).toLocaleString()} unit="sq ft" icon="fa-map" color="bg-blue-100 text-blue-600" />
              <MetricCard title="System Status" value="Online" unit="99.9%" icon="fa-server" color="bg-indigo-100 text-indigo-600" />
              <MetricCard title="Alerts" value="0" unit="active" icon="fa-bell" color="bg-yellow-100 text-yellow-600" subtext="All Clear" />
            </div>
            
            <div className="flex justify-between items-center mt-8">
              <h2 className="text-xl font-bold text-gray-800">Your Farms</h2>
              <button onClick={() => setShowAddModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-lg shadow-green-200">
                <i className="fa-solid fa-plus"></i> Add Plot
              </button>
            </div>

            {farms.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="text-gray-300 text-5xl mb-4"><i className="fa-solid fa-seedling"></i></div>
                    <h3 className="text-gray-500 text-lg">No farms yet. Add your first plot to get started!</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {farms.map(farm => (
                    <FarmCard key={farm.id} farm={farm} onClick={() => setSelectedFarm(farm)} onDelete={handleDeleteFarm} />
                  ))}
                </div>
            )}
          </div>
        );
      case "Farms":
        return (
          <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Farm Management</h2>
              <button onClick={() => setShowAddModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                 Add New
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {farms.map(farm => (
                <FarmCard key={farm.id} farm={farm} onClick={() => setSelectedFarm(farm)} onDelete={handleDeleteFarm} />
              ))}
            </div>
          </div>
        );
      case "Assistant":
        return <ChatAssistant farms={farms} />;
      case "Settings":
        return <SettingsView user={user} onUpdateUser={handleUpdateUser} />;
      default:
        return <div></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={(t: string) => { setActiveTab(t); setSelectedFarm(null); }} user={user} onLogout={handleLogout} />
      
      <main className="flex-1 ml-64 p-8 h-screen overflow-y-auto">
        {renderContent()}
      </main>

      {showAddModal && <AddFarmModal onClose={() => setShowAddModal(false)} onAdd={handleAddFarm} />}
    </div>
  );
};

export default App;
