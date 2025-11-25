# AgriCloud - Full-Stack Agricultural Management System

A modern full-stack web application for agricultural management built with React frontend and Node.js/Express backend.

## 🏗️ Project Structure

```
root/
├── client/           # React + Vite frontend
│   ├── src/         # React components and source code
│   ├── components/  # Reusable React components
│   ├── App.tsx      # Main React application
│   ├── index.html   # HTML template
│   ├── package.json # Frontend dependencies
│   └── vite.config.ts # Vite build configuration
├── server/          # Node.js + Express backend
│   ├── index.js     # Main server file
│   └── data/        # Local JSON database (fallback)
├── dist/            # Built frontend (generated)
├── package.json     # Root scripts and backend dependencies
└── README.md        # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- MongoDB Atlas account (or use local file DB fallback)

### Installation & Development

```bash
# Install backend dependencies
npm install

# Install frontend dependencies and build
npm run build

# Start the full-stack application
npm start

# For development (backend only)
npm run dev
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build frontend for production |
| `npm start` | Start production server (serves API + built frontend) |
| `npm run dev` | Start development server (backend only) |
| `npm run deploy:azure` | Build and prepare for Azure deployment |

## 🌐 Application URLs

- **Production**: `http://localhost:4000` (full-stack)
- **API Health Check**: `http://localhost:4000/api/health`
- **Frontend Development**: `cd client && npm run dev` → `http://localhost:3000`

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0
MONGODB_DB=agri
VITE_API_KEY=your-google-ai-api-key
GEMINI_API_KEY=your-google-ai-api-key
USE_LOCAL_DB=false
PORT=4000
```

## 🔧 Technology Stack

### Frontend (`client/`)
- **React 19** - Modern React with latest features
- **Vite 6** - Fast build tool and dev server
- **TypeScript** - Type-safe development
- **Recharts** - Data visualization
- **Tailwind CSS** - Utility-first styling

### Backend (`server/`)
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Atlas cloud hosting
- **Google AI (Gemini)** - AI-powered features
- **CORS** - Cross-origin resource sharing

## 🎯 Features

- 👤 **User Authentication** - Registration and login
- 🏡 **Farm Management** - Create and manage multiple farms
- 🤖 **AI Irrigation Scheduling** - Smart watering recommendations
- 🌤️ **Weather Integration** - Real-time weather data
- 📊 **Analytics Dashboard** - Farm performance metrics
- 📱 **Responsive Design** - Mobile and desktop friendly

## 🚀 Deployment

### Azure App Service

This project is optimized for Azure App Service deployment:

1. **Build Command**: `npm run build`
2. **Start Command**: `npm start`
3. **Node Version**: 18.x
4. **Environment Variables**: Set in Azure App Service Configuration

### Environment Configuration

Set these variables in Azure App Service → Configuration → Application Settings:

```
MONGODB_URI = mongodb+srv://admin:password@cluster.mongodb.net/?appName=Cluster0
MONGODB_DB = agri
VITE_API_KEY = your-google-ai-api-key  
GEMINI_API_KEY = your-google-ai-api-key
USE_LOCAL_DB = false
PORT = 80
```

## 🛠️ Development Workflow

### Frontend Development
```bash
cd client
npm run dev    # Start Vite dev server on :3000
```

### Backend Development
```bash
npm run dev    # Start Express server on :4000
```

### Production Build
```bash
npm run build  # Builds client → ../dist/
npm start      # Serves built frontend + API
```

## 📁 File Structure Details

### `/client` - Frontend
- **React SPA** built with Vite
- **TypeScript** for type safety
- **Components** in `src/components/`
- **Services** in `services.ts`
- **Build Output** → `../dist/`

### `/server` - Backend  
- **Express.js** REST API
- **MongoDB** integration with Atlas
- **Static file serving** from `../dist/`
- **SPA fallback routing** for React Router

### `/dist` - Production Build
- **Generated folder** containing built frontend
- **Served statically** by Express server
- **Includes** optimized JS, CSS, and assets

## 🔍 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Database connection status |
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create new user |
| POST | `/api/login` | User authentication |
| GET | `/api/farms` | List farms |
| POST | `/api/farms` | Create new farm |
| PUT | `/api/farms/:id` | Update farm |
| DELETE | `/api/farms/:id` | Delete farm |

## 🐛 Troubleshooting

### Build Issues
- Ensure Node.js 18+ is installed
- Run `npm install` in both root and `client/`
- Check for TypeScript errors in `client/`

### Database Connection
- Verify MongoDB URI in `.env`
- Check network access in MongoDB Atlas
- Fallback to local JSON DB if MongoDB fails

### Deployment Issues
- Ensure environment variables are set
- Verify build output in `dist/` folder
- Check Azure App Service logs

## 📝 License

Private project - All rights reserved

## 👥 Contributors

- **Developer**: Agricultural Technology Team
- **Version**: 1.0.0
- **Last Updated**: November 2025
