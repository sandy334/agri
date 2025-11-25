# 🔵 Azure Deployment Guide - AgriCloud

## 🎯 Complete Step-by-Step Azure Hosting Guide

This guide will help you deploy your AgriCloud application to Microsoft Azure using Static Web Apps, which provides the best MongoDB Atlas connectivity and performance.

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Azure account (free tier available at [azure.microsoft.com](https://azure.microsoft.com))
- ✅ GitHub account with your AgriCloud repository
- ✅ MongoDB Atlas cluster (already configured)
- ✅ Google AI API key (already have: AIzaSyC4TZyEbMvfiUfl0JzCPMoFGp5Cmb1RTzg)

---

## 🚀 Method 1: Azure Portal (Recommended for Beginners)

### **Step 1: Access Azure Portal**

1. Go to **[portal.azure.com](https://portal.azure.com)**
2. Sign in with your Microsoft account
3. Click **"Create a resource"** (+ icon in top left)

### **Step 2: Create Static Web App**

1. **Search for "Static Web Apps"**
   - Type "Static Web Apps" in the search box
   - Click on "Static Web Apps" from the results
   - Click **"Create"**

2. **Basic Configuration**
   ```
   Subscription: [Your Azure Subscription]
   Resource Group: Create new → "agricloud-rg"
   Name: agricloud-app
   Plan type: Free (for development)
   Region: East US 2 (or closest to you)
   ```

3. **GitHub Integration**
   ```
   Source: GitHub
   GitHub account: [Your GitHub username]
   Organization: sandy334
   Repository: agri
   Branch: main
   ```

4. **Build Configuration**
   ```
   Build Presets: Custom
   App location: /
   Api location: api
   Output location: dist
   ```

5. Click **"Review + Create"** → **"Create"**

### **Step 3: Wait for Deployment**

- Azure will create the resources (2-3 minutes)
- GitHub Actions workflow will be automatically created
- First build will start automatically

### **Step 4: Configure Environment Variables**

1. **Navigate to your Static Web App**
   - Go to your resource group "agricloud-rg"
   - Click on your Static Web App "agricloud-app"

2. **Add Environment Variables**
   - Click **"Configuration"** in the left menu
   - Click **"+ Add"** for each variable:

   ```
   MONGODB_URI = mongodb+srv://admin:sandesh334@cluster0.egholmu.mongodb.net/?appName=Cluster0
   MONGODB_DB = agri
   VITE_API_KEY = AIzaSyC4TZyEbMvfiUfl0JzCPMoFGp5Cmb1RTzg
   GEMINI_API_KEY = AIzaSyC4TZyEbMvfiUfl0JzCPMoFGp5Cmb1RTzg
   USE_LOCAL_DB = false
   ```

3. Click **"Save"** after adding all variables

### **Step 5: Verify Deployment**

1. **Get your URL**
   - In your Static Web App overview, find the **"URL"**
   - It will look like: `https://agricloud-app.azurestaticapps.net`

2. **Test your application**
   - Visit your URL
   - Try registering a new user
   - Create a farm and test features

---

## ⚡ Method 2: Azure CLI (Advanced Users)

### **Step 1: Install Azure CLI**

```bash
# Windows (PowerShell)
Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\AzureCLI.msi
Start-Process msiexec.exe -Wait -ArgumentList '/I AzureCLI.msi /quiet'

# Or using Chocolatey
choco install azure-cli
```

### **Step 2: Login and Deploy**

```bash
# Login to Azure
az login

# Create resource group
az group create --name agricloud-rg --location eastus2

# Create Static Web App
az staticwebapp create \
  --name agricloud-app \
  --resource-group agricloud-rg \
  --source https://github.com/sandy334/agri \
  --location eastus2 \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --output-location "dist" \
  --login-with-github
```

### **Step 3: Set Environment Variables via CLI**

```bash
# Set environment variables
az staticwebapp appsettings set \
  --name agricloud-app \
  --setting-names \
    MONGODB_URI="mongodb+srv://admin:sandesh334@cluster0.egholmu.mongodb.net/?appName=Cluster0" \
    MONGODB_DB="agri" \
    VITE_API_KEY="AIzaSyC4TZyEbMvfiUfl0JzCPMoFGp5Cmb1RTzg" \
    GEMINI_API_KEY="AIzaSyC4TZyEbMvfiUfl0JzCPMoFGp5Cmb1RTzg" \
    USE_LOCAL_DB="false"
```

---

## 🔧 Method 3: One-Click Deploy Button

### **Add Deploy Button to README**

Add this to your GitHub repository README.md:

```markdown
[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.StaticApp/src/StaticApp/repositoryUrl/https%3A%2F%2Fgithub.com%2Fsandy334%2Fagri)
```

---

## 🛠️ Troubleshooting Common Issues

### **Issue 1: Build Fails**

**Solution:**
1. Check GitHub Actions tab in your repository
2. Look for error messages in the build log
3. Ensure all dependencies are in `package.json`

**Fix commands:**
```bash
# Ensure all dependencies are installed
npm install --save-dev @types/node
npm install --save @azure/functions
```

### **Issue 2: API Functions Not Working**

**Solution:**
1. Verify `api/` folder structure:
   ```
   api/
   ├── host.json
   ├── package.json
   └── src/
       └── functions/
           └── api.js
   ```

2. Check function app logs in Azure Portal

### **Issue 3: MongoDB Connection Issues**

**Solution:**
1. Verify MongoDB Atlas network access allows Azure IPs
2. Check connection string format
3. Test connection string locally first

### **Issue 4: Environment Variables Not Loading**

**Solution:**
1. Restart the Static Web App
2. Check variable names match exactly
3. Verify no trailing spaces in values

---

## 📊 Post-Deployment Checklist

### **✅ Verification Steps**

1. **Frontend Loading**
   - [ ] Visit main URL
   - [ ] UI loads correctly
   - [ ] No console errors

2. **API Health Check**
   - [ ] Visit `/api/health` endpoint
   - [ ] Returns MongoDB connection status

3. **Core Features**
   - [ ] User registration works
   - [ ] User login works
   - [ ] Farm creation works
   - [ ] Weather data loads
   - [ ] AI irrigation schedules generate

4. **Database Integration**
   - [ ] MongoDB Atlas connection successful
   - [ ] Data persists between sessions
   - [ ] No fallback to local storage

### **🔍 Testing Commands**

```bash
# Test API health
curl https://your-app.azurestaticapps.net/api/health

# Test user creation
curl -X POST https://your-app.azurestaticapps.net/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 🎯 Performance Optimization

### **Enable Caching**

Add to your `staticwebapp.config.json`:

```json
{
  "globalHeaders": {
    "Cache-Control": "max-age=31536000"
  },
  "mimeTypes": {
    ".js": "application/javascript",
    ".css": "text/css"
  }
}
```

### **CDN Configuration**

Azure Static Web Apps includes:
- ✅ Global CDN automatically
- ✅ Automatic HTTPS
- ✅ Custom domains support

---

## 💰 Cost Management

### **Free Tier Limits**
- 100 GB bandwidth/month
- 0.5 GB storage
- Custom domains: 2
- API calls: 1 million/month

### **Scaling Options**
- **Free**: Perfect for development/demo
- **Standard**: $9/month for production features

---

## 🔒 Security Best Practices

### **Environment Variables**
- ✅ Never commit `.env` files to Git
- ✅ Use Azure Key Vault for production secrets
- ✅ Rotate API keys regularly

### **MongoDB Security**
- ✅ Use strong passwords
- ✅ Enable network access restrictions
- ✅ Monitor connection logs

---

## 🌐 Custom Domain (Optional)

### **Add Custom Domain**

1. **Buy domain** (e.g., `agricloud.com`)
2. **In Azure Portal:**
   - Go to your Static Web App
   - Click "Custom domains"
   - Click "Add"
   - Enter your domain
   - Follow DNS configuration steps

### **SSL Certificate**
- Azure provides free SSL certificates automatically
- No additional configuration needed

---

## 📞 Support & Monitoring

### **Azure Monitoring**

1. **Application Insights**
   - Automatically enabled
   - Monitor performance and errors
   - View user analytics

2. **Log Streaming**
   - Real-time logs in Azure Portal
   - Debug API function issues

### **GitHub Integration**

- **Auto-deploy**: Every push to main branch
- **PR previews**: Automatic staging environments
- **Status checks**: Build status in GitHub

---

## 🎉 Success! Your AgriCloud is Live

After completing these steps:

1. **Your app URL**: `https://agricloud-app.azurestaticapps.net`
2. **MongoDB Atlas**: Fully connected and working
3. **Global CDN**: Fast loading worldwide
4. **Auto-deploy**: Updates on every Git push
5. **Monitoring**: Built-in performance tracking

**Congratulations! Your AgriCloud application is now professionally hosted on Microsoft Azure!** 🌱☁️

---

## 📚 Additional Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [MongoDB Atlas Azure Integration](https://docs.atlas.mongodb.com/azure/)
- [GitHub Actions for Azure](https://docs.github.com/en/actions/deployment/deploying-to-your-cloud-provider/deploying-to-azure)

**Need help?** Open an issue in your GitHub repository or contact Azure support.