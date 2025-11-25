
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { StorageService, DBService } from '../services';

interface SettingsProps {
  user: User;
  onUpdateUser: (u: User) => void;
}

export const SettingsView = ({ user, onUpdateUser }: SettingsProps) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    
    // Thresholds state
    const [tempMax, setTempMax] = useState(user.thresholds?.tempMax ?? 35);
    const [humidityMin, setHumidityMin] = useState(user.thresholds?.humidityMin ?? 30);
    const [moistureMin, setMoistureMin] = useState(user.thresholds?.moistureMin ?? 20);
    const [rainMax, setRainMax] = useState(user.thresholds?.rainMax ?? 20);

    const [saved, setSaved] = useState(false);
    
    // Admin Viewer State
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allFarms, setAllFarms] = useState<any[]>([]);

    useEffect(() => {
        if (user.role === 'Admin') {
            setAllUsers(DBService.getAllUsers());
            setAllFarms(DBService.getAllFarms());
        }
    }, [user.role]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const updated: User = { 
            ...user, 
            name, 
            email,
            thresholds: {
                tempMax,
                humidityMin,
                moistureMin,
                rainMax
            }
        };
        StorageService.saveUser(updated);
        onUpdateUser(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleResetDB = () => {
        if (window.confirm("DANGER: This will wipe the entire database (all users and farms). Are you sure?")) {
            DBService.resetDatabase();
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            
            {/* Profile Settings */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h2>
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-triangle-exclamation text-yellow-500"></i> Alert Thresholds
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">Set custom trigger points for farm health alerts.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Temp (°C)</label>
                                <input 
                                    type="number" 
                                    value={tempMax}
                                    onChange={(e) => setTempMax(Number(e.target.value))}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Min Humidity (%)</label>
                                <input 
                                    type="number" 
                                    value={humidityMin}
                                    onChange={(e) => setHumidityMin(Number(e.target.value))}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Min Soil Moisture (%)</label>
                                <input 
                                    type="number" 
                                    value={moistureMin}
                                    onChange={(e) => setMoistureMin(Number(e.target.value))}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Rainfall (mm)</label>
                                <input 
                                    type="number" 
                                    value={rainMax}
                                    onChange={(e) => setRainMax(Number(e.target.value))}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 flex justify-between items-center">
                            <span>{user.role}</span>
                            {user.role === 'Admin' && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Super User</span>}
                        </div>
                    </div>
                    
                    <button type="submit" className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition w-full flex justify-center items-center gap-2">
                        {saved ? <><i className="fa-solid fa-check"></i> Saved</> : "Save Changes"}
                    </button>
                </form>
            </div>

            {/* Admin Database View */}
            {user.role === 'Admin' && (
                <div className="bg-slate-800 p-8 rounded-xl shadow-lg text-white border border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <i className="fa-solid fa-database text-blue-400"></i> System Database
                            </h2>
                            <p className="text-slate-400 text-sm">Raw access to LocalStorage collections</p>
                        </div>
                        <button 
                            onClick={handleResetDB}
                            className="text-red-400 text-sm hover:text-red-300 hover:underline"
                        >
                            <i className="fa-solid fa-bomb"></i> WIPE DB
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Registered Users ({allUsers.length})</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-700 text-slate-300">
                                        <tr>
                                            <th className="p-3 rounded-tl-lg">ID</th>
                                            <th className="p-3">Name</th>
                                            <th className="p-3">Email</th>
                                            <th className="p-3">Password</th>
                                            <th className="p-3 rounded-tr-lg">Farms</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {allUsers.map((u: any) => (
                                            <tr key={u.id} className="hover:bg-slate-700/50 transition">
                                                <td className="p-3 font-mono text-xs text-slate-500">{u.id.substr(0,8)}...</td>
                                                <td className="p-3">{u.name}</td>
                                                <td className="p-3 text-blue-300">{u.email}</td>
                                                <td className="p-3 font-mono text-slate-400">{u.password}</td>
                                                <td className="p-3 text-center">
                                                    {allFarms.filter(f => f.userId === u.id).length}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Total Plots ({allFarms.length})</h3>
                            <div className="bg-slate-900/50 p-4 rounded-lg font-mono text-xs text-green-400 overflow-hidden">
                                {JSON.stringify(allFarms.map(f => ({id: f.id, name: f.name, crop: f.crop})), null, 2)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
