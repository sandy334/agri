
import React, { useState, useEffect } from 'react';
import { Farm, WeatherData, SoilData, PredictionResult, HistoricalData, User, IrrigationLog } from '../types';
import { fetchWeather, fetchSoilData, generateIrrigationPlan, getSoilTexture, fetchHistoricalWeather } from '../services';
import { Spinner } from './Shared';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area
} from "recharts";

export const FarmCard: React.FC<{ farm: Farm; onClick: () => void; onDelete: (id: string) => void }> = ({ farm, onClick, onDelete }) => {
  const soilTexture = farm.soilData 
    ? getSoilTexture(farm.soilData.sand, farm.soilData.clay, farm.soilData.silt) 
    : "Pending";

  return (
    <div 
      onClick={onClick}
      className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group relative"
    >
      <button 
          onClick={(e) => { e.stopPropagation(); onDelete(farm.id); }}
          className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors z-10 opacity-0 group-hover:opacity-100"
          title="Delete Farm"
      >
          <i className="fa-solid fa-trash"></i>
      </button>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <i className="fa-solid fa-seedling"></i>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{farm.name}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <i className="fa-solid fa-location-dot text-xs"></i>
              {farm.location.lat.toFixed(2)}, {farm.location.lon.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded font-medium border border-blue-100">
          {farm.crop}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm mt-4">
        <div className="bg-gray-50 p-2 rounded border border-gray-100">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Soil Type</p>
          <p className={`font-medium truncate ${farm.soilData ? 'text-gray-700' : 'text-orange-400'}`}>
            {soilTexture}
          </p>
        </div>
        <div className="bg-gray-50 p-2 rounded border border-gray-100">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Size</p>
          <p className="font-medium text-gray-700">{farm.size.toLocaleString()} sq ft</p>
        </div>
      </div>
    </div>
  );
};

export const AddFarmModal = ({ onClose, onAdd }: { onClose: () => void, onAdd: (f: Partial<Farm>) => void }) => {
  const [formData, setFormData] = useState({
    name: "",
    crop: "Wheat",
    lat: "",
    lon: "",
    size: ""
  });
  const [loadingGeo, setLoadingGeo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: formData.name,
      crop: formData.crop,
      location: { lat: parseFloat(formData.lat), lon: parseFloat(formData.lon) },
      size: parseFloat(formData.size),
      plantingDate: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  const handleGeo = () => {
    setLoadingGeo(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData(prev => ({ ...prev, lat: pos.coords.latitude.toFixed(4), lon: pos.coords.longitude.toFixed(4) }));
        setLoadingGeo(false);
      }, (err) => {
        alert("Could not get location.");
        setLoadingGeo(false);
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Add New Plot</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><i className="fa-solid fa-times text-xl"></i></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
            <input 
              required 
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. North Field Block A"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type</label>
              <select 
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                value={formData.crop}
                onChange={e => setFormData({...formData, crop: e.target.value})}
              >
                <option>Wheat</option>
                <option>Corn</option>
                <option>Rice</option>
                <option>Ragi</option>
                <option>Soybean</option>
                <option>Tomato</option>
                <option>Cotton</option>
                <option>Potato</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size (sq ft)</label>
              <input 
                type="number"
                required 
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.size}
                onChange={e => setFormData({...formData, size: e.target.value})}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Location (Lat/Lon)</label>
              <button type="button" onClick={handleGeo} className="text-xs text-green-600 hover:underline flex items-center gap-1">
                {loadingGeo ? <Spinner /> : <i className="fa-solid fa-location-crosshairs"></i>} Use Current
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                placeholder="Latitude"
                type="number"
                step="any"
                required
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.lat}
                onChange={e => setFormData({...formData, lat: e.target.value})}
              />
              <input 
                placeholder="Longitude"
                type="number"
                step="any"
                required
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.lon}
                onChange={e => setFormData({...formData, lon: e.target.value})}
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors mt-4 shadow-lg shadow-green-200">
            Create Farm
          </button>
        </form>
      </div>
    </div>
  );
};

const LogWaterModal = ({ onClose, onSave }: { onClose: () => void, onSave: (amount: number, date: string, source: string) => void }) => {
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [source, setSource] = useState("Manual Check");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !date) return;
        onSave(parseFloat(amount), date, source);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                 <h2 className="text-lg font-bold mb-4 text-gray-800">Log Irrigation Event</h2>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input 
                            type="date" 
                            required 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Applied (mm)</label>
                        <input 
                            type="number" 
                            required 
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="e.g. 15" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Schedule / Source</label>
                        <select 
                             value={source} 
                             onChange={e => setSource(e.target.value)} 
                             className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="Manual Check">Manual Check</option>
                            <option value="AI Recommendation">AI Recommendation</option>
                            <option value="Scheduled Routine">Scheduled Routine</option>
                            <option value="Emergency Watering">Emergency Watering</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">Cancel</button>
                        <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-lg shadow-blue-200">Save Log</button>
                    </div>
                 </form>
            </div>
        </div>
    )
}

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-100 text-sm z-50">
        <p className="font-bold text-gray-800 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></div>
            <span className="text-gray-500 text-xs">{entry.name}:</span>
            <span className="font-bold text-gray-700">
              {entry.value} {entry.unit}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const FarmDetail = ({ farm, user, onBack, onUpdate }: { farm: Farm; user: User; onBack: () => void; onUpdate: (f: Farm) => void }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [history, setHistory] = useState<HistoricalData | null>(null);
  const [soil, setSoil] = useState<SoilData | null>(farm.soilData || null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Initializing...");
  const [showLogModal, setShowLogModal] = useState(false);

  // Alerts State
  const [alerts, setAlerts] = useState<{type: string, msg: string}[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const [w, h] = await Promise.all([
            fetchWeather(farm.location.lat, farm.location.lon),
            fetchHistoricalWeather(farm.location.lat, farm.location.lon)
        ]);
        setWeather(w);
        setHistory(h);
        
        if (!soil) {
          const s = await fetchSoilData(farm.location.lat, farm.location.lon);
          setSoil(s);
          onUpdate({ ...farm, soilData: s });
        }

        // Check Thresholds
        const newAlerts = [];
        const thresholds = user.thresholds || { tempMax: 35, humidityMin: 30, moistureMin: 20, rainMax: 20 };

        if (w.current.temperature > thresholds.tempMax) {
            newAlerts.push({ type: 'danger', msg: `Temperature (${w.current.temperature}°C) exceeds threshold of ${thresholds.tempMax}°C` });
        }
        if (w.current.humidity < thresholds.humidityMin) {
            newAlerts.push({ type: 'warning', msg: `Humidity (${w.current.humidity}%) is below minimum ${thresholds.humidityMin}%` });
        }
        if (w.current.soilMoisture < thresholds.moistureMin) {
            newAlerts.push({ type: 'warning', msg: `Soil Moisture (${w.current.soilMoisture.toFixed(1)}%) is below minimum ${thresholds.moistureMin}%` });
        }
        // Check daily rainfall (today is index 0)
        if (w.daily.precipitationSum[0] > (thresholds.rainMax ?? 20)) {
            newAlerts.push({ type: 'danger', msg: `Heavy Rainfall Alert: Today's rain (${w.daily.precipitationSum[0]}mm) exceeds limit (${thresholds.rainMax ?? 20}mm)` });
        }

        setAlerts(newAlerts);

      } catch (e) {
        console.error("Init error", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handlePredict = async () => {
    if (!weather || !soil) return;
    setAnalyzing(true);
    
    const messages = ["Parsing Soil Data...", "Calculating ET0...", "Evaluating Rainfall...", "Generating Schedule..."];
    let msgIdx = 0;
    setLoadingMsg(messages[0]);
    
    const interval = setInterval(() => {
        msgIdx = (msgIdx + 1) % messages.length;
        setLoadingMsg(messages[msgIdx]);
    }, 800);

    try {
      const result = await generateIrrigationPlan(farm, weather, soil);
      setPrediction(result);
    } catch (e) {
      alert("Prediction failed. Please try again.");
    } finally {
      clearInterval(interval);
      setAnalyzing(false);
    }
  };

  const handleSaveLog = (amount: number, date: string, source: string) => {
      const newLog: IrrigationLog = {
          id: Date.now().toString(),
          date,
          amount,
          source
      };
      
      const updatedLogs = [...(farm.irrigationLogs || []), newLog];
      // Sort logs by date descending
      updatedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      onUpdate({ ...farm, irrigationLogs: updatedLogs });
  };

  const toggleIrrigation = () => {
    const isActive = farm.irrigationStatus?.isActive ?? false;
    const newStatus = !isActive 
        ? { isActive: true, source: 'Manual Override', startTime: new Date().toISOString(), durationMinutes: 60 }
        : { isActive: false };
    
    onUpdate({ ...farm, irrigationStatus: newStatus });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center flex-col gap-4">
        <Spinner />
        <p className="text-gray-500 animate-pulse">Syncing with satellites & sensors...</p>
      </div>
    );
  }

  if (!weather || !soil || !history) return <div>Error loading farm data.</div>;

  const soilChartData = [
    { subject: 'Sand', A: soil.sand, fullMark: 100 },
    { subject: 'Silt', A: soil.silt, fullMark: 100 },
    { subject: 'Clay', A: soil.clay, fullMark: 100 },
    { subject: 'Organic', A: soil.organicMatter * 5, fullMark: 100 }, 
    { subject: 'pH', A: (soil.ph / 14) * 100, fullMark: 100 },
  ];

  const dailyChartData = weather.daily.time.map((t, i) => ({
    name: new Date(t).toLocaleDateString('en-US', {weekday: 'short'}),
    temp: weather.daily.temperatureMax[i],
    rain: weather.daily.precipitationSum[i],
    et0: weather.daily.et0[i]
  }));

  const historyChartData = history.daily.time.map((t, i) => ({
    date: new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    tempMax: history.daily.temperatureMax[i],
    tempMin: history.daily.temperatureMin[i],
    rain: history.daily.precipitationSum[i]
  }));

  const soilHistoryData = history.daily.time.map((t, i) => ({
    date: new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    moisture: (history.daily.soilMoisture?.[i] || 0) * 100
  }));

  const texture = getSoilTexture(soil.sand, soil.clay, soil.silt);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{farm.name}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 text-xs">{farm.crop}</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 text-xs">{farm.size} sq ft</span>
              <span>Planted: {farm.plantingDate}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePredict}
            disabled={analyzing}
            className={`px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center gap-2 transition-all ${
              analyzing 
                ? "bg-green-50 text-green-600 border border-green-200 cursor-wait animate-pulse" 
                : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-green-200 hover:scale-105"
            }`}
          >
            {analyzing ? (
              <>
                <Spinner />
                <span className="w-32 text-left">{loadingMsg}</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <span>Generate Smart Schedule</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
            {alerts.map((alert, i) => (
                <div key={i} className={`p-4 rounded-lg border flex items-center gap-3 ${
                    alert.type === 'danger' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-yellow-50 border-yellow-100 text-yellow-700'
                }`}>
                    <i className={`fa-solid ${alert.type === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-exclamation'}`}></i>
                    <span className="font-medium">{alert.msg}</span>
                </div>
            ))}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Real-time Environment */}
        <div className="space-y-6">
          
          {/* Irrigation Status Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
               {farm.irrigationStatus?.isActive && (
                   <div className="absolute inset-0 bg-blue-50 opacity-50 animate-pulse pointer-events-none"></div>
               )}
               
               <div className="relative z-10">
                   <div className="flex justify-between items-start mb-4">
                       <h3 className="text-lg font-bold text-gray-800">System Status</h3>
                       <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${
                           farm.irrigationStatus?.isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                       }`}>
                           <div className={`w-2 h-2 rounded-full ${farm.irrigationStatus?.isActive ? 'bg-blue-600 animate-ping' : 'bg-gray-400'}`}></div>
                           {farm.irrigationStatus?.isActive ? 'IRRIGATING' : 'IDLE'}
                       </div>
                   </div>

                   {farm.irrigationStatus?.isActive ? (
                       <div className="space-y-4">
                           <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                   <i className="fa-solid fa-faucet-drip text-xl animate-bounce"></i>
                               </div>
                               <div>
                                   <p className="text-xs text-gray-500 uppercase font-bold">Source</p>
                                   <p className="text-gray-900 font-medium">{farm.irrigationStatus.source}</p>
                               </div>
                           </div>
                            <div className="flex justify-between items-center text-sm border-t border-blue-100 pt-3">
                               <div>
                                   <p className="text-xs text-gray-500">Started</p>
                                   <p className="font-mono">{farm.irrigationStatus.startTime ? new Date(farm.irrigationStatus.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</p>
                               </div>
                               <div className="text-right">
                                   <p className="text-xs text-gray-500">Est. Duration</p>
                                   <p className="font-mono">{farm.irrigationStatus.durationMinutes} min</p>
                               </div>
                           </div>
                           <button 
                               onClick={toggleIrrigation}
                               className="w-full py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium text-sm border border-red-100"
                           >
                               Stop Irrigation
                           </button>
                       </div>
                   ) : (
                       <div>
                           <p className="text-sm text-gray-500 mb-4">System is ready. No automated schedules active.</p>
                           <button 
                               onClick={toggleIrrigation}
                               className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm shadow-lg shadow-blue-200"
                           >
                               Start Manual Irrigation
                           </button>
                       </div>
                   )}
               </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Live Weather</h3>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full animate-pulse">● Live</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center hover:bg-blue-100 transition">
                <i className="fa-solid fa-temperature-three-quarters text-blue-500 mb-2 text-xl"></i>
                <p className="text-2xl font-bold text-gray-800">{weather.current.temperature}°C</p>
                <p className="text-xs text-gray-500">Temperature</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg text-center hover:bg-indigo-100 transition">
                <i className="fa-solid fa-droplet text-indigo-500 mb-2 text-xl"></i>
                <p className="text-2xl font-bold text-gray-800">{weather.current.humidity}%</p>
                <p className="text-xs text-gray-500">Humidity</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center hover:bg-gray-100 transition">
                <i className="fa-solid fa-wind text-gray-500 mb-2 text-xl"></i>
                <p className="text-2xl font-bold text-gray-800">{weather.current.windSpeed}</p>
                <p className="text-xs text-gray-500">Wind (km/h)</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg text-center hover:bg-emerald-100 transition">
                <i className="fa-solid fa-water text-emerald-500 mb-2 text-xl"></i>
                <p className="text-2xl font-bold text-gray-800">{weather.current.soilMoisture.toFixed(0)}%</p>
                <p className="text-xs text-gray-500">Soil Moisture</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex justify-between items-center">
              <span>Soil: {texture}</span>
              {soil.isSimulated && <span className="text-xs font-normal text-amber-500 bg-amber-50 px-2 py-1 rounded">Simulated Data</span>}
            </h3>
            <div className="h-64 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={soilChartData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                  <Radar name="Soil" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
               <div className="flex justify-between border-b border-gray-100 py-2"><span>pH Level</span> <span className="font-mono font-bold text-gray-700">{soil.ph.toFixed(1)}</span></div>
               <div className="flex justify-between border-b border-gray-100 py-2"><span>Organic Matter</span> <span className="font-mono font-bold text-gray-700">{soil.organicMatter.toFixed(1)}%</span></div>
               <div className="flex justify-between border-b border-gray-100 py-2"><span>Bulk Density</span> <span className="font-mono font-bold text-gray-700">{soil.bdod.toFixed(2)}</span></div>
               <div className="flex justify-between border-b border-gray-100 py-2"><span>Nitrogen</span> <span className="font-mono font-bold text-gray-700">{soil.nitrogen.toFixed(2)} g/kg</span></div>
            </div>
          </div>
        </div>

        {/* Middle Col: Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prediction Banner */}
          {prediction && (
            <div className="bg-gradient-to-br from-gray-900 to-slate-800 text-white p-6 rounded-xl shadow-xl animate-slide-up">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <h2 className="text-xl font-bold flex items-center gap-2">
                    <i className="fa-solid fa-robot text-green-400"></i> AI Irrigation Plan
                   </h2>
                   <p className="text-gray-400 text-sm mt-1 max-w-lg">{prediction.summary}</p>
                </div>
                <span className={`px-4 py-2 rounded-lg text-sm font-bold border flex items-center gap-2 ${
                  prediction.alertLevel === 'High' ? 'bg-red-500/20 border-red-500 text-red-400' : 
                  prediction.alertLevel === 'Medium' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' :
                  'bg-green-500/20 border-green-500 text-green-400'
                }`}>
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {prediction.alertLevel} Priority
                </span>
              </div>

              <div className="bg-white/5 rounded-lg p-1">
                <div className="grid gap-1">
                  {prediction.schedule.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-white/5 rounded transition duration-200">
                      <div className="flex items-center gap-4">
                         <div className="w-14 text-center bg-white/10 rounded p-1">
                           <div className="text-xs text-gray-400 uppercase">{new Date(item.date).toLocaleDateString('en-US', {weekday: 'short'})}</div>
                           <div className="font-bold text-lg">{new Date(item.date).getDate()}</div>
                         </div>
                         <div>
                           <div className={`font-semibold flex items-center gap-2 ${
                             item.action === 'Irrigate' ? 'text-blue-400' : 
                             item.action === 'Monitor' ? 'text-yellow-400' : 'text-gray-400'
                           }`}>
                              {item.action} 
                              {item.amountMM && <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded text-blue-300">{item.amountMM}mm</span>}
                           </div>
                           <div className="text-xs text-gray-400">{item.reasoning}</div>
                         </div>
                      </div>
                      {item.action === 'Irrigate' && (
                        <button 
                            onClick={() => { setShowLogModal(true); /* Optional: Could prepopulate modal state */ }}
                            className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
                            title="Log this irrigation"
                        >
                          <i className="fa-solid fa-faucet-drip"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Weather Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-gray-800">7-Day Environmental Forecast</h3>
               <div className="flex gap-3 text-xs">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Temp</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Rain</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> ET0</div>
               </div>
             </div>
             <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                    <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} label={{ value: 'mm', angle: 90, position: 'insideRight', fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar yAxisId="right" dataKey="rain" name="Rainfall" unit="mm" fill="url(#colorRain)" radius={[4, 4, 0, 0]} barSize={20} />
                    <Line yAxisId="left" type="monotone" dataKey="temp" name="Temperature" unit="°C" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1', strokeWidth: 0}} activeDot={{r: 6}} />
                    <Line yAxisId="right" type="monotone" dataKey="et0" name="Evapotranspiration" unit="mm" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b', strokeWidth: 0}} strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Historical Data Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-gray-800">Historical Weather (30d)</h3>
               </div>
               <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={historyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} minTickGap={30} />
                      <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar yAxisId="left" dataKey="rain" name="Rainfall" unit="mm" fill="#93c5fd" barSize={6} />
                      <Line yAxisId="left" type="monotone" dataKey="tempMax" name="Max Temp" unit="°C" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
               </div>
             </div>

             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-gray-800">Soil Moisture Trends</h3>
               </div>
               <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={soilHistoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                       <defs>
                        <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} minTickGap={30} />
                      <YAxis orientation="left" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} domain={[0, 50]} label={{ value: '%', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="moisture" name="Volumetric Moisture" unit="%" stroke="#10b981" strokeWidth={2} fill="url(#colorMoisture)" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
             </div>
          </div>

          {/* Irrigation Log Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <i className="fa-solid fa-clipboard-list"></i>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Irrigation History</h3>
                </div>
                <button 
                    onClick={() => setShowLogModal(true)}
                    className="text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition flex items-center gap-2"
                >
                    <i className="fa-solid fa-plus"></i> Log Watering
                </button>
             </div>
             
             <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold text-xs">
                         <tr>
                             <th className="p-3 rounded-tl-lg">Date</th>
                             <th className="p-3">Amount (mm)</th>
                             <th className="p-3 rounded-tr-lg">Source / Schedule</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {(!farm.irrigationLogs || farm.irrigationLogs.length === 0) ? (
                             <tr>
                                 <td colSpan={3} className="p-6 text-center text-gray-400 italic">
                                     No manual irrigation events recorded yet.
                                 </td>
                             </tr>
                         ) : (
                             farm.irrigationLogs.map(log => (
                                 <tr key={log.id} className="hover:bg-gray-50 transition">
                                     <td className="p-3 font-medium text-gray-800">
                                         {new Date(log.date).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'})}
                                     </td>
                                     <td className="p-3">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">
                                            {log.amount} mm
                                        </span>
                                     </td>
                                     <td className="p-3 text-gray-500">
                                        {log.source}
                                     </td>
                                 </tr>
                             ))
                         )}
                     </tbody>
                 </table>
             </div>
          </div>

        </div>

      </div>
      
      {showLogModal && <LogWaterModal onClose={() => setShowLogModal(false)} onSave={handleSaveLog} />}
    </div>
  );
};
