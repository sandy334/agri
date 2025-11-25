# 🚀 AgriCloud Deployment Guide

## 📋 Deployment Options

### 🟢 **Option 1: Vercel (Recommended)**

**Benefits**: Automatic MongoDB Atlas connection, fast CDN, zero config

1. **Prepare for deployment**:
   ```bash
   npm run build
   ```

2. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Set environment variables in Vercel dashboard**:
   - `MONGODB_URI`: `mongodb+srv://admin:sandesh334@cluster0.egholmu.mongodb.net/?appName=Cluster0`
   - `VITE_API_KEY`: Your Google AI API key
   - `GEMINI_API_KEY`: Your Google AI API key

### 🟡 **Option 2: Heroku**

1. **Create Heroku app**:
   ```bash
   heroku create your-agricloud-app
   ```

2. **Set environment variables**:
   ```bash
   heroku config:set MONGODB_URI="mongodb+srv://admin:sandesh334@cluster0.egholmu.mongodb.net/?appName=Cluster0"
   heroku config:set VITE_API_KEY="your_api_key"
   heroku config:set GEMINI_API_KEY="your_api_key"
   ```

3. **Deploy**:
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### 🔵 **Option 3: Digital Ocean/AWS**

1. **Build Docker image**:
   ```bash
   docker build -t agricloud .
   ```

2. **Run with Docker Compose**:
   ```bash
   # Create .env file with your variables
   docker-compose up -d
   ```

### 🟠 **Option 4: Railway**

1. **Connect GitHub repo** at railway.app
2. **Set environment variables**:
   - `MONGODB_URI`
   - `VITE_API_KEY` 
   - `GEMINI_API_KEY`
3. **Deploy automatically** on push

## 🔧 Pre-Deployment Checklist

### ✅ **Required Environment Variables**
- [ ] `MONGODB_URI` - Your MongoDB Atlas connection string
- [ ] `VITE_API_KEY` - Google AI API key
- [ ] `GEMINI_API_KEY` - Google AI API key

### ✅ **MongoDB Atlas Setup**
- [ ] Cluster created and running
- [ ] Database user created with read/write permissions
- [ ] Network access configured (0.0.0.0/0 for production)
- [ ] Connection string copied

### ✅ **Google AI API**
- [ ] API key generated from Google AI Studio
- [ ] API key tested and working

## 🌐 **Quick Deploy Commands**

### **Vercel (Fastest)**
```bash
# One-time setup
npm install -g vercel
vercel login

# Deploy
npm run build
vercel --prod
```

### **Heroku**
```bash
# One-time setup
heroku create agricloud-app
heroku config:set MONGODB_URI="your_mongodb_uri"
heroku config:set VITE_API_KEY="your_api_key"

# Deploy
git push heroku main
```

### **Docker**
```bash
# Build and run
docker build -t agricloud .
docker run -p 4000:4000 -e MONGODB_URI="your_uri" agricloud
```

## 🔍 **Post-Deployment Testing**

1. **Health Check**: Visit `https://your-app.vercel.app/api/health`
2. **Frontend**: Visit `https://your-app.vercel.app`
3. **Test Features**:
   - User registration/login
   - Create farm
   - Generate AI irrigation schedule
   - Weather data loading

## 🐛 **Common Issues & Solutions**

### **MongoDB Connection Issues**
- ✅ **Solution**: Linux servers (Vercel, Heroku) don't have Windows SSL issues
- ✅ **Verify**: Network access allows your deployment IP

### **API Key Issues**
- ✅ **Check**: Environment variables are set correctly
- ✅ **Test**: API key works in Google AI Studio

### **Build Errors**
- ✅ **Fix**: Run `npm run build` locally first
- ✅ **Check**: Node.js version >= 18

## 📞 **Need Help?**

If you encounter issues:
1. Check deployment logs
2. Verify environment variables
3. Test MongoDB connection string locally
4. Ensure API keys are valid

**Your AgriCloud app will work perfectly on any Linux-based cloud platform!** 🌱