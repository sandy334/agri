
import { GoogleGenAI, Type } from "@google/genai";
import { Farm, User, WeatherData, SoilData, PredictionResult, HistoricalData } from "./types";

// --- Configuration ---
const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
const SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query";
const FARMS_STORAGE_KEY = "agricloud_farms_db";
const USERS_STORAGE_KEY = "agricloud_users_db";
const SESSION_STORAGE_KEY = "agricloud_user_session";

// Initialize Gemini
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper: Determine Soil Texture from Composition ---
export const getSoilTexture = (sand: number, clay: number, silt: number): string => {
  // USDA Soil Taxonomy Approximation
  if (clay >= 40) return "Clay";
  if (sand >= 50 && clay >= 35) return "Sandy Clay";
  if (sand >= 50) return "Sandy Loam";
  if (silt >= 50 && clay >= 27) return "Silty Clay Loam";
  if (silt >= 50) return "Silt Loam";
  if (clay >= 27 && sand < 20) return "Silty Clay Loam";
  if (clay >= 27) return "Clay Loam";
  return "Loam";
};

// --- Simulated Database Service (MongoDB replacement) ---

// Helper to simulate database delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const StorageService = {
  // --- User Methods ---
  saveUser: (user: User) => localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user)),
  
  getUser: (): User | null => {
    const data = localStorage.getItem(SESSION_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },
  
  logout: () => localStorage.removeItem(SESSION_STORAGE_KEY),

  // --- Farm Methods (Scoped by User) ---
  getFarmsForUser: (userId: string): Farm[] => {
    const allFarms: Farm[] = JSON.parse(localStorage.getItem(FARMS_STORAGE_KEY) || "[]");
    return allFarms.filter(f => f.userId === userId);
  },

  addFarm: (farm: Farm) => {
    const allFarms: Farm[] = JSON.parse(localStorage.getItem(FARMS_STORAGE_KEY) || "[]");
    allFarms.push(farm);
    localStorage.setItem(FARMS_STORAGE_KEY, JSON.stringify(allFarms));
  },

  updateFarm: (updatedFarm: Farm) => {
    let allFarms: Farm[] = JSON.parse(localStorage.getItem(FARMS_STORAGE_KEY) || "[]");
    const index = allFarms.findIndex(f => f.id === updatedFarm.id);
    if (index !== -1) {
      allFarms[index] = updatedFarm;
      localStorage.setItem(FARMS_STORAGE_KEY, JSON.stringify(allFarms));
    }
  },

  deleteFarm: (farmId: string) => {
    let allFarms: Farm[] = JSON.parse(localStorage.getItem(FARMS_STORAGE_KEY) || "[]");
    allFarms = allFarms.filter(f => f.id !== farmId);
    localStorage.setItem(FARMS_STORAGE_KEY, JSON.stringify(allFarms));
  }
};

export const AuthService = {
  register: (email: string, password: string): User => {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    
    if (users.find((u: any) => u.email === email)) {
      throw new Error("User already exists with this email.");
    }

    // Auto-assign Admin role if email starts with 'admin'
    const role = email.toLowerCase().startsWith("admin") ? "Admin" : "Farmer";

    const newUser = {
      id: "user_" + Date.now() + Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0],
      email: email,
      password: password, // Stored for demo purposes (simulating DB)
      role: role as "Admin" | "Farmer",
      thresholds: {
        tempMax: 35,
        humidityMin: 30,
        moistureMin: 20,
        rainMax: 20
      }
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Return sanitized user object
    const { password: _, ...safeUser } = newUser;
    return safeUser as User;
  },

  login: (email: string, password: string): User => {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const { password: _, ...safeUser } = user;
    return safeUser as User;
  }
};

// --- DB Admin Service (For viewing stored data) ---
export const DBService = {
  getAllUsers: () => {
    return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
  },
  getAllFarms: () => {
    return JSON.parse(localStorage.getItem(FARMS_STORAGE_KEY) || "[]");
  },
  resetDatabase: () => {
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(FARMS_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.location.reload();
  }
};

// --- External API Services ---

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: "temperature_2m,relative_humidity_2m,rain,wind_speed_10m,cloud_cover,surface_pressure,et0_fao_evapotranspiration,soil_moisture_0_to_1cm",
      hourly: "soil_moisture_0_to_1cm",
      daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration",
      timezone: "auto",
    });

    const response = await fetch(`${OPEN_METEO_URL}?${params}`);
    const data = await response.json();

    return {
      current: {
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        rain: data.current.rain,
        surfacePressure: data.current.surface_pressure,
        cloudCover: data.current.cloud_cover,
        et0: data.current.et0_fao_evapotranspiration || 0,
        soilMoisture: (data.current.soil_moisture_0_to_1cm || 0) * 100, // Convert m3/m3 to %
      },
      daily: {
        time: data.daily.time,
        temperatureMax: data.daily.temperature_2m_max,
        temperatureMin: data.daily.temperature_2m_min,
        precipitationSum: data.daily.precipitation_sum,
        et0: data.daily.et0_fao_evapotranspiration,
      },
      hourly: {
        time: data.hourly.time,
        soilMoisture: data.hourly.soil_moisture_0_to_1cm,
      },
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    throw new Error("Failed to fetch weather data.");
  }
};

export const fetchHistoricalWeather = async (lat: number, lon: number): Promise<HistoricalData> => {
    try {
        const end = new Date();
        end.setDate(end.getDate() - 1); // Yesterday
        const start = new Date();
        start.setDate(start.getDate() - 30); // 30 days ago

        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        const params = new URLSearchParams({
            latitude: lat.toString(),
            longitude: lon.toString(),
            start_date: formatDate(start),
            end_date: formatDate(end),
            daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,soil_moisture_0_to_7cm_mean",
            timezone: "auto"
        });

        const response = await fetch(`${OPEN_METEO_ARCHIVE_URL}?${params}`);
        const data = await response.json();

        return {
            daily: {
                time: data.daily.time,
                temperatureMax: data.daily.temperature_2m_max,
                temperatureMin: data.daily.temperature_2m_min,
                precipitationSum: data.daily.precipitation_sum,
                soilMoisture: data.daily.soil_moisture_0_to_7cm_mean || []
            }
        };
    } catch (error) {
        console.error("Error fetching history:", error);
        throw new Error("Failed to fetch historical data");
    }
};

export const fetchSoilData = async (lat: number, lon: number): Promise<SoilData> => {
  try {
    const response = await fetch(`${SOILGRIDS_URL}?lat=${lat}&lon=${lon}&property=phh2o&property=soc&property=sand&property=silt&property=clay&property=nitrogen&property=bdod&depth=0-5cm&value=mean`);
    
    if (!response.ok) throw new Error("SoilGrids API unavailable");
    
    const data = await response.json();
    const layers = data.properties?.layers;

    if (!layers || layers.length === 0) {
        throw new Error("No soil data found for location (possibly ocean/water body)");
    }

    const getValue = (name: string) => {
      const layer = layers.find((l: any) => l.name === name);
      return layer ? layer.depths[0].values.mean : 0;
    };

    return {
      ph: getValue("phh2o") / 10,
      organicMatter: getValue("soc") / 10,
      sand: getValue("sand") / 10,
      silt: getValue("silt") / 10,
      clay: getValue("clay") / 10,
      nitrogen: getValue("nitrogen") / 100,
      bdod: getValue("bdod") / 100,
      isSimulated: false
    };

  } catch (error) {
    console.warn("Soil API failed/CORS, falling back to simulation", error);
    // Fallback Mock based on location hash to be deterministic
    const hash = Math.abs(Math.sin(lat * lon));
    return {
      ph: 6.0 + (hash * 2),
      organicMatter: 1.5 + (hash * 3),
      sand: 30 + (hash * 40),
      silt: 20 + (hash * 30),
      clay: 15 + (hash * 25),
      nitrogen: 1.0 + (hash * 3),
      bdod: 1.1 + (hash * 0.3),
      isSimulated: true
    };
  }
};

export const generateIrrigationPlan = async (farm: Farm, weather: WeatherData, soil: SoilData): Promise<PredictionResult> => {
  // Optimization: Reduced prompt complexity and requested concise answers to speed up generation
  const prompt = `
    Agronomist Task: Create 7-day irrigation plan.
    
    Farm: ${farm.name} (${farm.crop})
    Soil: Sand ${soil.sand}%, Clay ${soil.clay}%, pH ${soil.ph}
    
    Forecast (Next 7 Days):
    - MaxTemp: ${JSON.stringify(weather.daily.temperatureMax.slice(0, 7))}
    - Rain: ${JSON.stringify(weather.daily.precipitationSum.slice(0, 7))}
    - ET0: ${JSON.stringify(weather.daily.et0.slice(0, 7))}
    
    Goal: Balance Soil Moisture vs Rain/ET0.

    Return strict JSON:
    {
      "schedule": [
        { "date": "YYYY-MM-DD", "action": "Irrigate" | "Monitor" | "Hold", "amountMM": 0, "reasoning": "Max 5 words" }
      ],
      "summary": "Max 15 words summary.",
      "alertLevel": "Low" | "Medium" | "High"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  action: { type: Type.STRING, enum: ["Irrigate", "Monitor", "Hold"] },
                  amountMM: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING },
                }
              }
            },
            summary: { type: Type.STRING },
            alertLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as PredictionResult;
  } catch (e) {
    console.error(e);
    throw new Error("AI Prediction failed");
  }
};
