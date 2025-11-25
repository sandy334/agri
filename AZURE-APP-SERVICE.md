# Azure App Service Deployment

This project is configured for Azure App Service deployment as a full-stack Node.js application.

## Architecture

- **Backend**: Express.js server in `server/` directory
- **Frontend**: React + Vite application built to `dist/` directory
- **Database**: MongoDB Atlas
- **Static Files**: Served by Express from `dist/`

## Local Development

```bash
# Install dependencies
npm install

# Run frontend in development mode
npm run dev

# Run backend server
npm run dev:server

# Build frontend for production
npm run build

# Start production server (serves built frontend + API)
npm start
```

## Production Deployment

The application is configured to:
1. Build the React frontend to `dist/` directory
2. Serve static files from Express server
3. Handle SPA routing with fallback to `index.html`
4. Provide API endpoints at `/api/*`

## Environment Variables

Set these in Azure App Service:

```
MONGODB_URI=mongodb+srv://admin:sandesh334@cluster0.egholmu.mongodb.net/?appName=Cluster0
MONGODB_DB=agri
VITE_API_KEY=AIzaSyC4TZyEbMvfiUfl0JzCPMoFGp5Cmb1RTzg
GEMINI_API_KEY=AIzaSyC4TZyEbMvfiUfl0JzCPMoFGp5Cmb1RTzg
USE_LOCAL_DB=false
PORT=80
```

## Azure App Service Configuration

- **Runtime**: Node.js 18+
- **Start Command**: `npm start`
- **Build Command**: `npm run build` (if using deployment slots)
- **Entry Point**: `server/index.js`