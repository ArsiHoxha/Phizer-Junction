# 🔐 Render Environment Variables Setup Guide

This guide explains how to configure all required environment variables for deploying the Migraine Guardian backend on Render.

---

## 📋 Required Environment Variables

| Variable Name | Description | Where to Get It | Required |
|--------------|-------------|-----------------|----------|
| `CLERK_PUBLISHABLE_KEY` | Clerk public key for authentication | [Clerk Dashboard](https://dashboard.clerk.com) → Your App → API Keys | ✅ Yes |
| `CLERK_SECRET_KEY` | Clerk secret key for server-side auth | [Clerk Dashboard](https://dashboard.clerk.com) → Your App → API Keys | ✅ Yes |
| `MONGODB_URI` | MongoDB connection string | [MongoDB Atlas](https://cloud.mongodb.com) → Cluster → Connect | ✅ Yes |
| `GEMINI_API_KEY` | Google Gemini AI API key | [Google AI Studio](https://aistudio.google.com/app/apikey) | ✅ Yes |
| `ELEVENLABS_API_KEY` | ElevenLabs voice transcription key | [ElevenLabs](https://elevenlabs.io) → Profile → API Keys | ✅ Yes |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API for weather data | [OpenWeatherMap](https://openweathermap.org/api) → Sign up → API Keys | ✅ Yes |
| `PORT` | Server port (auto-set by Render) | Auto-configured by Render | ⚠️ Optional |
| `NODE_ENV` | Environment mode | Set to `production` | ⚠️ Optional |

---

## 🚀 Step-by-Step Render Setup

### 1. Sign Up for API Services

**OpenWeatherMap (Weather Data):**
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Click "Sign Up" and create a free account
3. Navigate to **API Keys** section
4. Copy your API key (free tier: 1,000 calls/day)
5. **Note:** It may take 10-15 minutes for the API key to activate

**Google Gemini (AI Analysis):**
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIzaSy...`)

**ElevenLabs (Voice Features):**
1. Go to [ElevenLabs](https://elevenlabs.io)
2. Sign up for a free account
3. Navigate to Profile → API Keys
4. Generate and copy your API key (starts with `sk_...`)

**MongoDB Atlas (Database):**
1. Visit [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster (M0 tier)
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password

**Clerk (Authentication):**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your app (or create one)
3. Navigate to **API Keys**
4. Copy both Publishable Key and Secret Key

### 2. Deploy to Render

1. **Create New Web Service:**
   - Log in to [Render](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build Settings:**
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node

3. **Add Environment Variables:**
   - Scroll to "Environment Variables" section
   - Click "Add Environment Variable" for each variable below:

```
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/migraine-guardian?retryWrites=true&w=majority
GEMINI_API_KEY=AIzaSy_YOUR_KEY_HERE
ELEVENLABS_API_KEY=sk_YOUR_KEY_HERE
OPENWEATHER_API_KEY=YOUR_OPENWEATHER_KEY_HERE
NODE_ENV=production
```

4. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically deploy your backend
   - Wait for deployment to complete (~5 minutes)

5. **Get Your Backend URL:**
   - Copy the URL (e.g., `https://your-app-name.onrender.com`)
   - Update this in your React Native client config

---

## 🔒 Security Best Practices

### ⚠️ NEVER commit these values to Git:
- All API keys and secrets should be in `.env` files
- Add `.env` to your `.gitignore`
- Use `.env.example` as a template (without real values)

### ✅ DO:
- Rotate keys regularly
- Use different keys for development and production
- Monitor API usage in respective dashboards
- Enable IP restrictions where possible
- Use Render's secret environment variables (not visible in logs)

### ❌ DON'T:
- Share API keys publicly
- Commit keys to GitHub
- Use production keys in development
- Hardcode keys in your source code

---

## 🧪 Testing Your Setup

### Test Backend Locally:

1. **Create `.env` file in backend folder:**
```bash
cd backend
touch .env
```

2. **Copy variables from Render and paste into `.env`**

3. **Test the server:**
```bash
npm install
node server.js
```

4. **Verify endpoints:**
```bash
# Test health check
curl http://localhost:3000/health

# Test weather endpoint (requires location)
curl "http://localhost:3000/api/weather?lat=40.7128&lon=-74.0060"
```

### Test on Render:

1. **Check deployment logs:**
   - Go to Render dashboard
   - Click on your service
   - View "Logs" tab
   - Look for: `Server is running on port 3000`

2. **Test API endpoints:**
```bash
# Health check
curl https://your-app-name.onrender.com/health

# Weather API (New York coordinates)
curl "https://your-app-name.onrender.com/api/weather?lat=40.7128&lon=-74.0060"
```

---

## 🐛 Troubleshooting

### Weather API Returns 401 Error:
- **Cause:** Invalid or inactive OpenWeatherMap API key
- **Solution:** 
  1. Wait 10-15 minutes after creating the key (activation time)
  2. Verify the key in [OpenWeatherMap Dashboard](https://home.openweathermap.org/api_keys)
  3. Check if you've exceeded the free tier limit (1,000 calls/day)
  4. Regenerate the API key if needed

### Server Won't Start:
- **Check Render logs** for error messages
- **Verify all environment variables** are set correctly
- **Check MongoDB connection** - ensure IP whitelist includes `0.0.0.0/0`

### Gemini API Quota Exceeded:
- **Free tier limit:** 60 requests per minute
- **Solution:** Wait or upgrade to paid tier
- **Alternative:** Implement rate limiting in your code

### Calendar Integration Not Working:
- **Client-side:** Calendar permissions use Expo's built-in Calendar API
- **No backend setup required** - calendar data is collected on the device
- **Permissions:** App will request calendar access on first use
- **Fallback:** App uses simulated calendar data if permission is denied

### Weather Data Not Updating:
- **Check coordinates:** Ensure valid lat/lon values
- **API limits:** Free tier has 1,000 calls/day limit
- **Cache:** Consider caching weather data for 10-15 minutes
- **Network:** Verify backend can reach OpenWeatherMap API

---

## 📊 API Usage Limits

| Service | Free Tier Limit | Cost if Exceeded |
|---------|----------------|------------------|
| **OpenWeatherMap** | 1,000 calls/day | $0.0012 per call |
| **Gemini AI** | 60 requests/min | Pay-as-you-go |
| **ElevenLabs** | 10,000 characters/month | $5/month for 30K |
| **MongoDB Atlas** | 512 MB storage | $9/month for 2GB |
| **Clerk** | 10,000 MAU | $25/month after |
| **Render** | 750 hours/month | Free for one service |

---

## 🔄 Updating Environment Variables

### On Render:
1. Go to your service dashboard
2. Click "Environment" tab
3. Edit or add variables
4. Click "Save Changes"
5. Render will automatically redeploy

### Locally:
1. Edit your `.env` file
2. Restart your Node.js server
3. Changes take effect immediately

---

## 📞 API Service Links

- **OpenWeatherMap Dashboard:** https://home.openweathermap.org
- **Google AI Studio:** https://aistudio.google.com
- **ElevenLabs Profile:** https://elevenlabs.io/app/profile
- **MongoDB Atlas:** https://cloud.mongodb.com
- **Clerk Dashboard:** https://dashboard.clerk.com
- **Render Dashboard:** https://dashboard.render.com

---

## ✅ Quick Copy-Paste Template

```bash
# Backend Environment Variables for Render

CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
CLERK_SECRET_KEY=sk_test_YOUR_KEY
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true&w=majority
GEMINI_API_KEY=AIzaSy_YOUR_KEY
ELEVENLABS_API_KEY=sk_YOUR_KEY
OPENWEATHER_API_KEY=YOUR_KEY
NODE_ENV=production
```

Replace `YOUR_KEY` with actual values from respective dashboards.

---

## 🎯 Next Steps

1. ✅ Set up all API accounts
2. ✅ Add environment variables to Render
3. ✅ Deploy backend
4. ✅ Test all endpoints
5. ✅ Update React Native client with backend URL
6. ✅ Test weather data collection
7. ✅ Test calendar integration
8. ✅ Monitor API usage in dashboards

---

## 📝 Notes

- **Calendar API:** No API key needed - uses Expo Calendar (device-level permissions)
- **Weather Updates:** Fetched every 5-10 minutes based on user location
- **AI Predictions:** Calculated in real-time when dashboard loads
- **Cost:** All services have generous free tiers for development/testing

Good luck with your deployment! 🚀
