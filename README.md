# 🧠 Migraine Guardian - AI-Powered Migraine Prediction & Prevention

> **Junction 2024 Hackathon Project**  
> Predict migraines before they happen with AI-powered passive health monitoring.

[![React Native](https://img.shields.io/badge/React%20Native-0.74-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-51-black.svg)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/)

---

## 📱 What is Migraine Guardian?

**Migraine Guardian** is a completely passive, AI-powered mobile app that predicts migraine risks **before they happen**. Unlike traditional migraine trackers that require constant manual input, our app silently monitors your health metrics and uses Google Gemini AI to identify patterns and warn you when a migraine is likely.

### 🎯 Key Features

- **🤖 AI-Powered Predictions** - Real-time migraine risk score (0-100%) powered by Google Gemini 2.5 Flash
- **📊 Passive Monitoring** - Zero manual input required - works automatically in the background
- **🎯 Trigger Discovery** - Identifies YOUR unique migraine triggers through pattern recognition
- **🔔 Smart Alerts** - Push notifications when risk is elevated
- **📈 Historical Insights** - Track patterns over time with beautiful visualizations
- **🌤️ Weather Integration** - Monitors barometric pressure changes (major migraine trigger)
- **📅 Calendar Analysis** - Detects stress from busy schedules
- **❤️ Health Tracking** - HRV, sleep quality, stress levels, screen time
- **🍎 Apple Health Integration** - Connects with HealthKit (Beta)

---

## 🚀 Quick Start - Try It Now!

### Prerequisites

Before you begin, make sure you have:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)
- **Expo Go** app on your phone:
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Installation Steps

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ArsiHoxha/Phizer-Junction.git
cd Phizer-Junction
```

#### 2️⃣ Install Backend Dependencies

```bash
cd backend
npm install
```

#### 3️⃣ Start the Backend Server (Optional)

**Note:** The app is already connected to our hosted backend at `https://phizer-junction.onrender.com`, so you can skip this step and go directly to step 4.

If you want to run your own backend:

```bash
# Create .env file in backend folder
touch .env

# Add your API keys (see backend/.env.example for template)
# Then start the server:
node server.js
```

The server will start on `http://localhost:3000`

#### 4️⃣ Install Mobile App Dependencies

```bash
cd ../client
npm install
```

#### 5️⃣ Start the Expo Development Server

```bash
npx expo start
```

You'll see a QR code in your terminal that looks like this:

```
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

┌─────────────────────────────────────────┐
│                                         │
│   ████ ▄▄▄▄▄ █▀█ █▄█▀▀▀▄█ ▄▄▄▄▄ ████   │
│   ████ █   █ █▀▀█ ▀ █▀▀▄█ █   █ ████   │
│   ████ █▄▄▄█ █ ▀▄█▄▀▄ ▀▀█ █▄▄▄█ ████   │
│   ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀   │
│                                         │
└─────────────────────────────────────────┘
```

#### 6️⃣ Open on Your Phone

**iOS (iPhone/iPad):**
1. Open the **Camera** app
2. Point it at the QR code
3. Tap the notification that appears
4. App will open in Expo Go

**Android:**
1. Open the **Expo Go** app
2. Tap **"Scan QR Code"**
3. Scan the QR code from your terminal
4. App will load automatically

---

## ⚠️ Important Testing Limitations

### 🔴 Features NOT Available in Expo Go

Due to Expo Go's limitations, the following features **will not work** until you build a development build or production app:

- ❌ **Apple Health Integration** - Requires native HealthKit capabilities
- ❌ **Background Data Collection** - Limited background task support in Expo Go
- ❌ **Calendar Access** - Native calendar permissions not fully supported
- ❌ **Advanced Notifications** - Some notification features may be limited
- ❌ **Widget Support** - Home screen widgets require native build

### ✅ Features Available in Expo Go

You **CAN** test these features:

- ✅ **Dashboard & UI** - Full interface and navigation
- ✅ **Authentication** - Sign up and login with Clerk
- ✅ **Simulated Data** - App uses realistic dataset for demo
- ✅ **AI Risk Predictions** - Google Gemini AI analysis works
- ✅ **Onboarding Flow** - Complete intro screens
- ✅ **Settings & Preferences** - All settings UI
- ✅ **Charts & Visualizations** - View trends and insights
- ✅ **Theme Support** - Dark/light mode switching

### 🏗️ To Test Full Functionality

For **complete feature testing**, you need to create a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS (requires Apple Developer account)
eas build --profile development --platform ios

# Build for Android
eas build --profile development --platform android
```

Or build locally:

```bash
npx expo run:ios     # Requires Xcode (macOS only)
npx expo run:android # Requires Android Studio
```

---

## 📖 User Guide

### First Time Setup

1. **Launch the App** - Open in Expo Go or development build
2. **Tap "Get Started"** - On the welcome screen
3. **Sign Up** - Create account with email or Google
4. **Complete Onboarding** - Learn about the app's features (3 slides)
5. **Grant Permissions** - Allow location, notifications (calendar optional)
6. **View Dashboard** - See your migraine risk score instantly!

### Understanding Your Dashboard

**Risk Score (Center):**
- 🟢 **0-33% - Low Risk** - You're in the clear!
- 🟡 **34-66% - Medium Risk** - Be cautious, monitor triggers
- 🔴 **67-100% - High Risk** - Take preventive action now

**Today's Metrics:**
- **❤️ HRV** - Heart Rate Variability (stress indicator)
- **😴 Sleep Quality** - Duration and quality score
- **😰 Stress Level** - Current stress percentage
- **📱 Screen Time** - Hours on your phone today

**Top Triggers:**
- See which factors are contributing most to your current risk
- Each trigger shows impact percentage
- Tap for detailed explanation and prevention tips

### Navigation

- **🏠 Dashboard** - Main screen with risk score and metrics
- **📊 Analysis** - Detailed trends and historical data
- **⚙️ Settings** - Configure app, manage data, account settings

---

## 🛠️ Technology Stack

### Frontend (Mobile App)
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tools
- **TypeScript** - Type-safe JavaScript
- **NativeWind** - Tailwind CSS for React Native
- **React Native Reanimated** - Smooth animations
- **Clerk** - User authentication
- **Expo Router** - File-based navigation

### Backend (API Server)
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB object modeling
- **Clerk Express** - Backend authentication

### AI & Services
- **Google Gemini 2.5 Flash** - AI-powered health analysis
- **OpenWeatherMap API** - Weather and barometric pressure data
- **ElevenLabs** - Voice transcription (in development)
- **Expo Calendar** - Calendar event integration
- **Apple HealthKit** - iOS health data (Beta)

### Deployment
- **Render** - Backend hosting
- **MongoDB Atlas** - Database hosting
- **Expo EAS** - App builds and updates

---

## 📂 Project Structure

```
Phizer-Junction/
├── client/                    # React Native mobile app
│   ├── app/                   # Main application screens
│   │   ├── (tabs)/           # Tab navigation screens
│   │   │   ├── index.tsx     # Dashboard (main screen)
│   │   │   ├── analysis.tsx  # Analysis & trends
│   │   │   └── settings.tsx  # Settings screen
│   │   ├── auth/             # Authentication screens
│   │   │   ├── sign-in.tsx   # Login screen
│   │   │   └── sign-up.tsx   # Registration screen
│   │   ├── onboarding/       # Onboarding flow
│   │   │   ├── intro.tsx     # Intro slides
│   │   │   └── permissions.tsx
│   │   └── _layout.tsx       # Root layout
│   ├── components/           # Reusable UI components
│   ├── services/             # API & data services
│   │   ├── collectors/       # Data collection modules
│   │   ├── api.ts           # Backend API client
│   │   ├── geminiRiskService.ts
│   │   └── appleHealthService.ts
│   ├── contexts/            # React contexts
│   │   ├── DataCollectionContext.tsx
│   │   └── ThemeContext.tsx
│   ├── config/              # Configuration
│   │   └── config.ts        # API keys and URLs
│   └── package.json
│
├── backend/                  # Node.js API server
│   ├── server.js            # Main Express server
│   ├── models/              # MongoDB models
│   │   ├── User.js
│   │   ├── Metric.js
│   │   ├── RiskHistory.js
│   │   └── MigraineLog.js
│   ├── services/            # Business logic
│   │   ├── geminiService.js      # AI analysis
│   │   ├── weatherService.js     # Weather API
│   │   ├── elevenLabsService.js  # Voice features
│   │   └── patternMonitoring.js  # Pattern detection
│   └── package.json
│
├── WIDGET_CODE/             # iOS Widget (Swift)
│   └── MigraineWidget.swift
│
└── README.md               # This file
```

---

## 🔑 API Keys & Configuration

The app comes pre-configured with test API keys, so it works out of the box! However, if you want to use your own keys:

### Required API Keys

1. **Clerk** (Authentication) - [Get it here](https://dashboard.clerk.com)
2. **Google Gemini** (AI) - [Get it here](https://aistudio.google.com/app/apikey)
3. **MongoDB** (Database) - [Get it here](https://cloud.mongodb.com)
4. **OpenWeatherMap** (Weather) - [Get it here](https://openweathermap.org/api)

### Configuration Files

**Client (`client/config/config.ts`):**
```typescript
export const CLERK_PUBLISHABLE_KEY = 'your_clerk_key_here';
export const EXPO_PUBLIC_GEMINI_API_KEY = 'your_gemini_key_here';
export const BACKEND_URL = 'https://phizer-junction.onrender.com';
```

**Backend (`backend/.env`):**
```bash
CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_key
ELEVENLABS_API_KEY=your_elevenlabs_key
OPENWEATHER_API_KEY=your_openweather_key
```

See `backend/.env.example` and `RENDER_ENV_SETUP.md` for detailed setup instructions.

---

## 🧪 Testing with Realistic Data

The app includes a curated dataset of realistic health metrics for demo purposes:

**Enable Dataset Mode:**
1. Open the app
2. Go to **Settings** → **Data Collection**
3. Toggle **"Use Realistic Dataset"**
4. Return to Dashboard

This simulates 30 days of health data with realistic patterns, perfect for:
- Testing AI predictions
- Viewing historical trends
- Demonstrating trigger analysis
- Showcasing the UI without waiting for real data collection

---

## 🐛 Troubleshooting

### App Won't Load in Expo Go

**Problem:** QR code scanned but app crashes or won't load

**Solutions:**
- ✅ Make sure Expo Go app is up to date
- ✅ Check that your phone and computer are on the same WiFi
- ✅ Try running `npx expo start --clear` to clear cache
- ✅ Restart the Expo server with `Ctrl+C` then `npx expo start`

### "Network request failed" Error

**Problem:** App can't connect to backend

**Solutions:**
- ✅ Check internet connection
- ✅ Backend server is already hosted (no local server needed)
- ✅ If using local backend, update `BACKEND_URL` in `client/config/config.ts`

### Authentication Not Working

**Problem:** Can't sign up or log in

**Solutions:**
- ✅ Pre-configured Clerk keys should work out of the box
- ✅ Try signing up with a different email
- ✅ Check internet connection
- ✅ Clear app data and try again

### No Data Showing on Dashboard

**Problem:** Dashboard shows 0% risk or "Loading..."

**Solutions:**
- ✅ **Enable Dataset Mode** in Settings → Data Collection
- ✅ Wait 30 seconds for initial data load
- ✅ Pull down to refresh the dashboard
- ✅ Remember: Real data collection doesn't work in Expo Go

### "Expo Go Not Supported" Messages

**Problem:** Features showing "Not supported in Expo Go"

**Solutions:**
- ✅ This is expected! See "Testing Limitations" section above
- ✅ Use dataset mode to test with simulated data
- ✅ Build a development build for full features

---

## 📊 Demo Account

Want to see the app with pre-populated data? Use dataset mode:

1. Sign up with any email
2. Complete onboarding
3. Go to Settings → Data Collection
4. Enable "Use Realistic Dataset"
5. Return to Dashboard - you'll see 30 days of health history!

---

## 🤝 Contributing

This was a hackathon project built in 48 hours! While we're not actively seeking contributions at this time, feel free to:

- 🐛 Report bugs in the Issues section
- 💡 Suggest features or improvements
- ⭐ Star the repo if you found it interesting!
- 🔗 Share with others who suffer from migraines

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Team

Built with ❤️ during Junction 2024 Hackathon by the Phizer Junction team.

---

## 🙏 Acknowledgments

- **Google Gemini** - For providing the AI capabilities
- **Clerk** - For seamless authentication
- **Expo** - For making React Native development accessible
- **Junction Hackathon** - For the opportunity to build this solution
- **MongoDB** - For reliable cloud database hosting
- **OpenWeatherMap** - For weather data API

---

## 📞 Support & Contact

- **GitHub Issues:** [Report a bug](https://github.com/ArsiHoxha/Phizer-Junction/issues)
- **GitHub Repo:** [Phizer-Junction](https://github.com/ArsiHoxha/Phizer-Junction)

---

## 🎯 Future Roadmap

- [ ] Complete Apple Watch integration
- [ ] Clinical validation studies
- [ ] Healthcare provider dashboard
- [ ] Medication tracking
- [ ] Photo-based migraine diary
- [ ] Multi-language support
- [ ] Advanced analytics & ML improvements
- [ ] Integration with pharmacies
- [ ] Community features

---

## ⚡ Quick Commands Reference

```bash
# Clone and setup
git clone https://github.com/ArsiHoxha/Phizer-Junction.git
cd Phizer-Junction/client
npm install

# Start development server
npx expo start

# Clear cache and restart
npx expo start --clear

# Run on specific platform
npx expo start --ios      # Open iOS simulator
npx expo start --android  # Open Android emulator

# Backend (optional)
cd ../backend
npm install
node server.js
```

---

**Made with 🧠 for 1 billion migraine sufferers worldwide.**

*Predict. Prevent. Live better.* ✨
