# Real Data Integration Setup Guide

## Overview
This system fetches **REAL** data from:
- ✅ **Apple HealthKit** (HRV, heart rate, sleep, stress, steps)
- ✅ **OpenWeatherMap API** (real-time weather and barometric pressure)
- ✅ **iOS Location Services** (GPS coordinates for weather)

**No more simulated data!** All metrics are now pulled from actual device sensors and external APIs.

---

## 🏥 1. HealthKit Integration (iOS)

### Install Dependencies
```bash
cd client
npm install react-native-health
npx pod-install ios
```

### iOS Permissions
Add to `client/ios/YourApp/Info.plist`:
```xml
<key>NSHealthShareUsageDescription</key>
<string>We need access to your health data to track migraine triggers and predict episodes.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>We need to update your health data.</string>
```

### Enable HealthKit Capability
1. Open `client/ios/YourApp.xcworkspace` in Xcode
2. Select your project → Target → Signing & Capabilities
3. Click **+ Capability** → Search for **HealthKit**
4. Enable HealthKit

### HealthKit Metrics Available
- ✅ **HRV (Heart Rate Variability)** - Most critical for migraine prediction
- ✅ **Heart Rate** - Resting and active
- ✅ **Sleep Analysis** - Hours and quality percentage
- ✅ **Steps** - Daily activity level
- ✅ **Stress Level** - Calculated from HRV + heart rate

---

## 🌤️ 2. Weather API Setup

### Get OpenWeatherMap API Key
1. Go to https://openweathermap.org/api
2. Sign up for **free account** (1000 calls/day)
3. Get your API key

### Add to Backend .env
```bash
# backend/.env
OPENWEATHER_API_KEY=your_api_key_here
```

### Weather Data Provided
- ✅ **Barometric Pressure** (hPa) - Critical for migraines!
- ✅ **Temperature** (°C)
- ✅ **Humidity** (%)
- ✅ **UV Index**
- ✅ **Pressure Drop Warnings** - Predicts migraine triggers

---

## 📍 3. Location Services (iOS)

### Permissions Already Set
Location is handled by `expo-location` (already installed).

Permissions in `client/app.json`:
```json
{
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "We need your location to fetch local weather data for migraine prediction."
    }
  }
}
```

---

## 🚀 How to Use Real Metrics

### Backend Setup
```bash
cd backend
npm install
# Add OPENWEATHER_API_KEY to .env
npm start
```

### Client Usage

#### Option 1: Auto-Fetch in Background
```typescript
import { useRealMetrics } from '@/hooks/useRealMetrics';

function MyComponent() {
  const { fetchRealMetrics, loading } = useRealMetrics(true); // auto-submit

  useEffect(() => {
    // Fetch real metrics every 30 minutes
    const interval = setInterval(() => {
      fetchRealMetrics();
    }, 30 * 60 * 1000);

    // Initial fetch
    fetchRealMetrics();

    return () => clearInterval(interval);
  }, []);

  return <Text>{loading ? 'Syncing...' : 'Data synced ✓'}</Text>;
}
```

#### Option 2: Manual Fetch
```typescript
import { useRealMetrics } from '@/hooks/useRealMetrics';

function SyncButton() {
  const { fetchRealMetrics, loading, lastMetrics } = useRealMetrics(false);

  const handleSync = async () => {
    try {
      const metrics = await fetchRealMetrics();
      console.log('Got real metrics:', metrics);
      // Use metrics...
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    <Button onPress={handleSync} disabled={loading}>
      {loading ? 'Syncing...' : 'Sync Real Data'}
    </Button>
  );
}
```

#### Option 3: Direct API Call
```typescript
import { metricsAPI } from '@/services/api';
import { getAllHealthMetrics } from '@/services/healthKit';
import * as Location from 'expo-location';

async function submitRealMetrics() {
  // Get location
  const location = await Location.getCurrentPositionAsync();
  
  // Get HealthKit data
  const healthMetrics = await getAllHealthMetrics();
  
  // Submit to backend (backend fetches real weather)
  const response = await metricsAPI.submitRealMetrics({
    ...healthMetrics,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  });
  
  console.log('Response:', response.aiRiskAnalysis);
}
```

---

## 🎯 API Endpoint

### POST `/api/metrics/real`

**Request Body:**
```json
{
  "hrv": 55,              // From HealthKit (ms)
  "heartRate": 72,        // From HealthKit (bpm)
  "stress": 45,           // Calculated from HRV + HR (%)
  "sleepQuality": 78,     // From HealthKit Sleep Analysis (%)
  "sleepHours": 7.2,      // From HealthKit (hours)
  "steps": 8543,          // From HealthKit
  "latitude": 40.7128,    // From GPS
  "longitude": -74.0060   // From GPS
}
```

**Response:**
```json
{
  "success": true,
  "metric": { ... },
  "realWeather": {
    "temperature": 22,
    "pressure": 1013,
    "humidity": 65,
    "pressureWarnings": [
      {
        "timestamp": "2025-11-15T18:00:00Z",
        "pressureDrop": 8,
        "severity": "medium",
        "message": "Pressure dropping 8 hPa - migraine risk!"
      }
    ]
  },
  "aiRiskAnalysis": {
    "riskScore": 65,
    "riskLevel": "MEDIUM",
    "explanation": "Your HRV is 55 (Below average). Risk +10%...",
    "factors": [...]
  },
  "message": "✅ Real data saved from HealthKit + Weather API"
}
```

---

## 🧪 Testing

### 1. Test HealthKit Integration
```typescript
import { initHealthKit, getAllHealthMetrics } from '@/services/healthKit';

// Initialize
await initHealthKit();

// Fetch metrics
const metrics = await getAllHealthMetrics();
console.log('Real HealthKit data:', metrics);
```

### 2. Test Weather API
```bash
# In backend
curl "http://localhost:3000/api/metrics/real" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hrv": 55,
    "heartRate": 72,
    "stress": 45,
    "sleepQuality": 78,
    "sleepHours": 7.2,
    "steps": 8543,
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

### 3. Verify Real Data
- Check backend logs: "✅ Connected to MongoDB"
- Check response: `dataSource: 'real-integrated'`
- Check weather: `pressureWarnings` array present
- Check AI: Detailed explanation with actual values

---

## 🔄 Data Flow

```
iOS Device (HealthKit)
    ↓ (HRV, HR, Sleep, Steps)
React Native App
    ↓ (+ GPS Location)
POST /api/metrics/real
    ↓
Backend Node.js
    → Calls OpenWeatherMap API (Real Weather)
    → Saves to MongoDB with dataSource='real-integrated'
    → Runs AI Risk Analysis (real metrics)
    → Detects pressure drops (migraine triggers)
    ↓
Response with:
    - Saved metrics
    - Real weather data
    - AI risk analysis
    - Pressure drop warnings
```

---

## ⚠️ Important Notes

1. **HealthKit Permissions**: User must approve health data access
2. **Location Permission**: Required for weather data
3. **API Key**: OpenWeatherMap key must be in backend `.env`
4. **iOS Only**: HealthKit is iOS-only (Android needs Google Fit)
5. **Real Device**: HealthKit doesn't work in simulator (use real iPhone)

---

## 🎉 Benefits of Real Data

✅ **Accurate predictions** - AI learns from YOUR actual patterns
✅ **Real barometric pressure** - Catches pressure drops that trigger migraines
✅ **True HRV tracking** - Most reliable migraine predictor
✅ **Personalized insights** - Based on your real health metrics
✅ **Pressure warnings** - Alerts 3-24 hours before migraine
✅ **No more fake data** - Everything is from real sources

---

## 🚨 Troubleshooting

**HealthKit not working?**
- Make sure you're on a real iOS device (not simulator)
- Check HealthKit capability is enabled in Xcode
- Verify Info.plist has health permissions

**Weather API failing?**
- Check OPENWEATHER_API_KEY in backend .env
- Verify API key is active (check OpenWeatherMap dashboard)
- Check backend logs for errors

**Location permission denied?**
- Go to iPhone Settings → Privacy → Location Services
- Enable for your app

---

## 📱 Next Steps

1. Install HealthKit library
2. Add OpenWeatherMap API key
3. Test real data fetch
4. Enable background sync (every 30 minutes)
5. Watch AI learn from YOUR real patterns! 🧠
