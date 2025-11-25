# 🔵 Azure Deployment Guide for AgriCloud

## 🚀 Quick Azure Deployment Options

### **Option 1: Azure Static Web Apps + Functions (Recommended)**

**Benefits**: Serverless, auto-scaling, global CDN, MongoDB Atlas support

#### **Step 1: Deploy via Azure Portal**

1. **Go to Azure Portal**: [portal.azure.com](https://portal.azure.com)
2. **Create Resource** → Search "Static Web Apps"
3. **Fill in details**:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new "agricloud-rg"
   - **Name**: "agricloud-app"
   - **Region**: East US 2
   - **Source**: GitHub
   - **Organization**: sandy334
   - **Repository**: agri
   - **Branch**: main
   - **Build Details**:
     - **App location**: `/`
     - **Api location**: `api`
     - **Output location**: `dist`

4. **Click Review + Create**

#### **Step 2: Set Environment Variables**

After deployment, go to your Static Web App → Configuration:

```
MONGODB_URI = mongodb+srv://admin:sandesh334@cluster0.egholmu.mongodb.net/?appName=Cluster0
MONGODB_DB = agri
VITE_API_KEY = AIzaSyC4TZyEbMvfiUfl0JzCPMoFGp5Cmb1RTzg
GEMINI_API_KEY = AIzaSyC4TZyEbMvfiUfl0JzCPMoFGp5Cmb1RTzg
```

### **Option 2: Azure CLI Deployment**

```bash
# 1. Login to Azure
az login

# 2. Create resource group
az group create --name agricloud-rg --location eastus2

# 3. Deploy using ARM template
az deployment group create \
  --resource-group agricloud-rg \
  --template-file azure-deploy.json \
  --parameters appName=agricloud \
  --parameters mongodbUri="mongodb+srv://admin:sandesh334@cluster0.egholmu.mongodb.net/?appName=Cluster0" \
  --parameters googleApiKey="AIzaSyC4TZyEbMvfiUfl0JzCPMoFGp5Cmb1RTzg"
```

### **Option 3: GitHub Actions Auto-Deploy**

When you create the Static Web App, Azure automatically creates a GitHub Actions workflow in `.github/workflows/`. It will:

1. **Build** your React frontend
2. **Deploy** to Azure Static Web Apps
3. **Deploy** API functions
4. **Set** environment variables

## 🔧 Azure Container Instances (Alternative)

If you prefer containerization:

```bash
# 1. Build and push Docker image
docker build -t agricloud .
docker tag agricloud youracr.azurecr.io/agricloud:latest
docker push youracr.azurecr.io/agricloud:latest

# 2. Deploy to Container Instances
az container create \
  --resource-group agricloud-rg \
  --name agricloud-container \
  --image youracr.azurecr.io/agricloud:latest \
  --ports 4000 \
  --environment-variables \
    MONGODB_URI="mongodb+srv://admin:sandesh334@cluster0.egholmu.mongodb.net/?appName=Cluster0" \
    VITE_API_KEY="AIzaSyC4TZyEbMvfiUfl0JzCPMoFGp5Cmb1RTzg"
```

## 🌐 Azure App Service

For traditional web app hosting:

```bash
# 1. Create App Service plan
az appservice plan create \
  --name agricloud-plan \
  --resource-group agricloud-rg \
  --sku B1 \
  --is-linux

# 2. Create web app
az webapp create \
  --resource-group agricloud-rg \
  --plan agricloud-plan \
  --name agricloud-webapp \
  --runtime "NODE|18-lts"

# 3. Configure app settings
az webapp config appsettings set \
  --resource-group agricloud-rg \
  --name agricloud-webapp \
  --settings \
    MONGODB_URI="mongodb+srv://admin:sandesh334@cluster0.egholmu.mongodb.net/?appName=Cluster0" \
    VITE_API_KEY="AIzaSyC4TZyEbMvfiUfl0JzCPMoFGp5Cmb1RTzg"

# 4. Deploy code
az webapp deployment source config \
  --name agricloud-webapp \
  --resource-group agricloud-rg \
  --repo-url https://github.com/sandy334/agri \
  --branch main \
  --manual-integration
```

## 📊 Cost Comparison

| Service | Monthly Cost (Est.) | Best For |
|---------|-------------------|----------|
| Static Web Apps | $0-10 | Production (Recommended) |
| Container Instances | $15-30 | Simple containerization |
| App Service B1 | $13 | Traditional hosting |
| Function Apps | Pay-per-use | API-only deployment |

## 🔍 Post-Deployment Testing

1. **Frontend URL**: `https://your-app.azurestaticapps.net`
2. **API Health**: `https://your-app.azurestaticapps.net/api/health`
3. **Test Features**:
   - User registration/login
   - Create farms
   - AI irrigation schedules
   - Weather data loading

## ⚡ Why Azure is Perfect for AgriCloud

- ✅ **Linux-based**: MongoDB Atlas works perfectly
- ✅ **Auto-scaling**: Handles traffic spikes
- ✅ **Global CDN**: Fast worldwide access
- ✅ **MongoDB Integration**: Excellent database support
- ✅ **Cost-effective**: Pay only for usage
- ✅ **GitHub Integration**: Auto-deploy on push

## 🎯 Quick Start Command

```bash
# Deploy everything in one command
az staticwebapp create \
  --name agricloud \
  --resource-group agricloud-rg \
  --source https://github.com/sandy334/agri \
  --location eastus2 \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --output-location "dist"
```

**Your AgriCloud will be live on Azure with full MongoDB Atlas integration!** 🌱☁️