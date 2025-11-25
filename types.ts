
export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Farmer";
  thresholds?: {
    tempMax: number;
    humidityMin: number;
    moistureMin: number;
    rainMax?: number;
  };
}

export interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    rain: number;
    surfacePressure: number;
    cloudCover: number;
    et0: number;
    soilMoisture: number; // Volumetric %
  };
  daily: {
    time: string[];
    temperatureMax: number[];
    temperatureMin: number[];
    precipitationSum: number[];
    et0: number[];
  };
  hourly: {
    time: string[];
    soilMoisture: number[];
  };
}

export interface HistoricalData {
  daily: {
    time: string[];
    temperatureMax: number[];
    temperatureMin: number[];
    precipitationSum: number[];
    soilMoisture: number[];
  }
}

export interface SoilData {
  ph: number;
  organicMatter: number;
  sand: number;
  silt: number;
  clay: number;
  nitrogen: number;
  bdod: number;
  isSimulated?: boolean;
}

export interface IrrigationLog {
  id: string;
  date: string;
  amount: number; // in mm
  source: string; // e.g. "Manual", "AI Schedule"
}

export interface IrrigationStatus {
  isActive: boolean;
  source?: string; // e.g. "AI Schedule", "Manual"
  startTime?: string; // ISO string
  durationMinutes?: number;
}

export interface Farm {
  id: string;
  userId: string; // Link farm to specific user
  name: string;
  crop: string;
  location: {
    lat: number;
    lon: number;
  };
  size: number;
  plantingDate: string;
  soilData?: SoilData;
  weatherData?: WeatherData;
  lastUpdated?: string;
  irrigationLogs?: IrrigationLog[];
  irrigationStatus?: IrrigationStatus;
}

export interface PredictionResult {
  schedule: {
    date: string;
    action: "Irrigate" | "Monitor" | "Hold";
    amountMM?: number;
    reasoning: string;
  }[];
  summary: string;
  alertLevel: "Low" | "Medium" | "High";
}
