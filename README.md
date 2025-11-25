# 🌱 AgriCloud - Smart Irrigation & Farm Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

A comprehensive **AI-powered agricultural management platform** that combines real-time weather monitoring, soil analysis, and intelligent irrigation scheduling to optimize crop yield and water usage.

![AgriCloud Dashboard](https://via.placeholder.com/800x400/059669/ffffff?text=AgriCloud+Dashboard)

## ✨ Key Features

### 🤖 **AI-Powered Irrigation Planning**
- **Google Gemini AI** generates smart 7-day irrigation schedules
- Considers weather forecasts, soil conditions, and crop requirements
- Provides reasoning for each irrigation decision
- Automatic fallback to intelligent mock recommendations

### 🌦️ **Real-Time Environmental Monitoring**
- Live weather data from **Open-Meteo API**
- Temperature, humidity, wind speed, and precipitation tracking
- Soil moisture monitoring with historical trends
- ET0 evapotranspiration calculations

### 🗺️ **Advanced Soil Analysis**
- Global soil composition data from **SoilGrids API**
- pH, organic matter, sand/silt/clay percentages
- Bulk density and nitrogen content analysis
- Interactive radar charts for soil visualization

### 📊 **Comprehensive Analytics**
- 7-day weather forecasts with interactive charts
- 30-day historical weather and soil moisture trends
- Irrigation logs and system status tracking
- Custom threshold alerts for critical conditions

### 👥 **Multi-User Management**
- Role-based access control (Admin/Farmer)
- Secure user authentication and session management
- Personalized farm portfolios per user
- Custom alert thresholds per user

### 💧 **Irrigation System Integration**
- Manual irrigation control with status tracking
- Irrigation event logging with timestamps
- Multiple water source tracking
- Real-time system status monitoring

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **MongoDB Atlas account** (optional) - [Sign up here](https://www.mongodb.com/atlas)
- **Google AI Studio API Key** - [Get API key](https://makersuite.google.com/app/apikey)

### 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sandy334/agri.git
   cd agri
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   # Google AI API Key (Required)
   VITE_API_KEY=your_google_ai_api_key_here
   GEMINI_API_KEY=your_google_ai_api_key_here
   
   # MongoDB Atlas (Optional - uses local file DB if not provided)
   MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/?appName=Cluster0
   MONGODB_DB=agri
   
   # Force local database (set to true to skip MongoDB)
   USE_LOCAL_DB=false
   
   # API Configuration
   VITE_API_BASE=http://localhost:4000
   ```

4. **Start the application**
   
   **Terminal 1 - Backend Server:**
   ```bash
   npm run server
   ```
   
   **Terminal 2 - Frontend Development Server:**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## 🏗️ Architecture

### **Frontend Stack**
- **React 19** with TypeScript for type safety
- **Vite 6** for fast development and building
- **Tailwind CSS** (CDN) for responsive styling
- **Recharts** for interactive data visualizations
- **FontAwesome** for professional icons

### **Backend Stack**
- **Express.js** REST API server
- **MongoDB Atlas** with local file DB fallback
- **CORS** enabled for cross-origin requests
- Automatic data migration between storage types

### **External Integrations**
- **Open-Meteo API** - Weather data and forecasts
- **SoilGrids API** - Global soil composition data
- **Google Gemini AI** - Intelligent irrigation planning

### **Database Design**

```typescript
// Users Collection
{
  id: string,
  name: string,
  email: string,
  role: "Admin" | "Farmer",
  thresholds: {
    tempMax: number,
    humidityMin: number,
    moistureMin: number,
    rainMax: number
  }
}

// Farms Collection
{
  id: string,
  userId: string,
  name: string,
  crop: string,
  location: { lat: number, lon: number },
  size: number,
  plantingDate: string,
  soilData: SoilData,
  weatherData: WeatherData,
  irrigationLogs: IrrigationLog[],
  irrigationStatus: IrrigationStatus
}
```

## 📖 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Register new user |
| POST | `/api/login` | User authentication |

### Farm Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/farms` | Get all farms |
| POST | `/api/farms` | Create new farm |
| PUT | `/api/farms/:id` | Update farm |
| DELETE | `/api/farms/:id` | Delete farm |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Database connection status |

## 🎯 Usage Examples

### 1. **Register & Login**
```typescript
// Register new farmer
const user = await AuthService.register("farmer@example.com", "password123");

// Login existing user
const user = await AuthService.login("farmer@example.com", "password123");
```

### 2. **Add a Farm**
```typescript
const newFarm = {
  name: "North Field",
  crop: "Wheat",
  location: { lat: 40.7128, lon: -74.0060 },
  size: 5000,
  plantingDate: "2024-03-15"
};

StorageService.addFarm(newFarm);
```

### 3. **Generate AI Irrigation Plan**
```typescript
const weather = await fetchWeather(farm.location.lat, farm.location.lon);
const soil = await fetchSoilData(farm.location.lat, farm.location.lon);
const plan = await generateIrrigationPlan(farm, weather, soil);
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_KEY` | Google AI API key | Required |
| `MONGODB_URI` | MongoDB connection string | Optional |
| `USE_LOCAL_DB` | Force local file database | `false` |
| `PORT` | Backend server port | `4000` |

### User Threshold Settings

Configure custom alert thresholds in user profile:

```typescript
{
  tempMax: 35,        // Maximum temperature (°C)
  humidityMin: 30,    // Minimum humidity (%)
  moistureMin: 20,    // Minimum soil moisture (%)
  rainMax: 20         // Maximum daily rainfall (mm)
}
```

## 🛠️ Development

### **Project Structure**
```
agri/
├── src/                    # Frontend React components
│   ├── components/         # Reusable UI components
│   ├── types.ts           # TypeScript interfaces
│   └── services.ts        # API integrations
├── server/                # Backend Express server
│   ├── index.js          # Main server file
│   └── data/             # Local database storage
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
└── .env                  # Environment variables
```

### **Available Scripts**

```bash
npm run dev     # Start frontend development server
npm run server  # Start backend API server
npm run build   # Build production frontend
npm run preview # Preview production build
```

### **Adding New Features**

1. **Frontend Components**: Add to `src/components/`
2. **API Routes**: Extend `server/index.js`
3. **Types**: Update `src/types.ts`
4. **Services**: Extend `src/services.ts`

## 🔒 Security Features

- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ Environment variable configuration
- ✅ Error handling and logging
- ✅ Session management
- ✅ Role-based access control

## 🌍 Database Options

### **MongoDB Atlas (Recommended)**
- Cloud-hosted MongoDB
- Automatic scaling and backups
- Real-time data synchronization

### **Local File Database (Fallback)**
- JSON file storage in `server/data/db.json`
- Perfect for development and testing
- Automatic fallback if MongoDB unavailable

## 📱 Mobile Responsive

AgriCloud is fully responsive and works seamlessly on:
- 📱 **Mobile devices** (iOS/Android)
- 💻 **Tablets** (iPad/Android tablets)
- 🖥️ **Desktop** (Windows/Mac/Linux)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Open-Meteo** for comprehensive weather APIs
- **SoilGrids** for global soil data
- **Google AI** for intelligent irrigation recommendations
- **MongoDB Atlas** for reliable cloud database hosting

## 📞 Support

For support, email support@agricloud.com or join our [Discord community](https://discord.gg/agricloud).

---

<div align="center">

**Built with ❤️ for sustainable agriculture**

[Website](https://agricloud.com) • [Documentation](https://docs.agricloud.com) • [Discord](https://discord.gg/agricloud)

</div>
