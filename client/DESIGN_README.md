# 🧠 Migraine Guardian App - Design Screens

A **fully passive migraine prediction and prevention app** built with React Native, Expo, and NativeWind (Tailwind CSS). This project features a minimalist black & white design focused on user experience.

## ✨ Completed Features (Design Phase)

### 🎨 **Onboarding Screens (5 screens)**
1. **Welcome Screen** - App introduction with minimalist logo and tagline
2. **Permissions Screen** - Interactive permission cards for notifications, data collection, calendar, and location
3. **Data Sources Screen** - Choose between phone-only mode or wearable connection (with simulated data option)
4. **Trigger Personalization** - Select migraine frequency and known triggers
5. **Dashboard Intro** - Feature overview with preview and "How It Works" section

### 📊 **Dashboard Screen**
- **Migraine Risk Index** - Large prominent display (0-100%) with risk status
- **Mini Trend Chart** - 7-day risk history visualization
- **Quick Metrics Cards** - HRV, Sleep, Stress, Screen Time with trend indicators
- **Top Triggers** - Visual progress bars showing contributing factors
- **AI Insight Card** - Personalized tips with voice alert button
- **Detailed Trends** - Period selector (today/week/month) with chart placeholders
- **Smooth animations** - FadeIn, FadeInUp, FadeInDown transitions

### 🎯 **Design System**
- **Minimalist black & white theme**
- **NativeWind (Tailwind CSS)** for styling
- **React Native Reanimated** for smooth transitions
- **Custom gray scale palette** (50-900)
- **Rounded corners and shadows** for depth
- **Interactive touch feedback**

## 🚀 How to Run

### Prerequisites
- Node.js 18+ (project uses v18.20.8)
- Expo CLI
- iOS Simulator / Android Emulator / Expo Go app on physical device

### Installation

```bash
cd client
npm install
```

### Start the Development Server

```bash
npm start
```

This will start the Expo development server. You can then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan the QR code with Expo Go app on your phone

### Run on Specific Platform

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 📁 Project Structure

```
client/
├── app/
│   └── _layout.tsx              # Root navigation setup
├── screens/
│   ├── onboarding/
│   │   ├── WelcomeScreen.tsx
│   │   ├── PermissionsScreen.tsx
│   │   ├── DataSourcesScreen.tsx
│   │   ├── TriggerPersonalizationScreen.tsx
│   │   └── DashboardIntroScreen.tsx
│   └── DashboardScreen.tsx
├── tailwind.config.js           # Tailwind configuration
├── metro.config.js              # Metro bundler with NativeWind
├── babel.config.js              # Babel with NativeWind preset
├── global.css                   # Tailwind directives
└── package.json
```

## 🎨 Design Highlights

### Color Scheme
- **Primary**: Black (#000000)
- **Secondary**: White (#FFFFFF)
- **Gray Scale**: Custom 50-900 palette
- **Accent Colors**: Green (low risk), Yellow (medium risk), Red (high risk)

### Typography
- **Headings**: Bold, 2xl-4xl sizes
- **Body**: Regular, base-lg sizes
- **Captions**: Small, gray-500/600

### Components
- **Cards**: Rounded-3xl with borders
- **Buttons**: Rounded-full with smooth transitions
- **Charts**: Placeholder containers ready for Victory Native integration
- **Icons**: Emoji-based for universal compatibility

## 🔄 Navigation Flow

```
Welcome → Permissions → Data Sources → Trigger Personalization → Dashboard Intro → Dashboard
```

Each screen has:
- Back button (except Welcome)
- Continue button (enabled when requirements met)
- Smooth horizontal slide transitions
- Gesture support for swipe navigation

## 📱 Screen Features

### Welcome Screen
- Animated logo with concentric circles
- App name and tagline
- Privacy note at bottom
- Fade-in animations

### Permissions Screen
- 4 interactive permission cards
- Toggle selection with visual feedback
- Privacy-first information box
- Continue button enabled when all permissions granted

### Data Sources Screen
- Two main modes: Phone-only or Wearable
- Wearable device selection (Apple Watch, Fitbit, Garmin, Samsung, Simulate)
- Contextual information based on selection

### Trigger Personalization Screen
- Frequency selector (4 options)
- 8 trigger cards in grid layout
- Multi-select capability
- AI learning information box

### Dashboard Intro Screen
- Preview card with mock risk index
- 5 feature highlights with icons
- "How It Works" 3-step guide
- "Remember" motivational box

### Dashboard Screen
- Large risk index card with 7-day mini chart
- 4 quick metric cards in grid
- Top 4 triggers with progress bars
- AI insight card with voice alert button
- Period selector for detailed trends
- 3 chart placeholder sections

## 🛠️ Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **NativeWind** - Tailwind CSS for React Native
- **React Navigation** - Stack navigation
- **React Native Reanimated** - Animations
- **Expo Linear Gradient** - Gradient backgrounds
- **TypeScript** - Type safety

## 🎯 Next Steps (Backend & Features)

The design phase is complete. Next implementations:
1. **Backend API** - Express + MongoDB for user data and metrics
2. **Passive Data Collection** - Screen time, notifications, activity, sleep
3. **Simulated Wearable Engine** - Mock HRV, heart rate, stress data
4. **AI Risk Calculation** - Formula-based migraine prediction
5. **Gemini AI Integration** - Personalized tips generation
6. **Eleven Labs** - Voice alert synthesis
7. **Real Charts** - Victory Native chart implementation
8. **Clerk Auth** - User authentication
9. **Background Tasks** - Data collection services
10. **Push Notifications** - Risk alerts

## 📝 Notes

- All screens are fully designed and navigable
- Animations and transitions are implemented
- Chart areas have placeholders ready for data integration
- Design is optimized for both iOS and Android
- Code is well-structured and commented
- TypeScript interfaces defined for data structures

## 🎨 Design Principles

1. **Minimalism** - Clean, uncluttered interface
2. **Clarity** - Information hierarchy is clear
3. **Accessibility** - High contrast, readable fonts
4. **Feedback** - Visual responses to user interactions
5. **Consistency** - Uniform styling across screens
6. **Motion** - Smooth, purposeful animations

---

Built with ❤️ for the Migraine Guardian Hackathon
