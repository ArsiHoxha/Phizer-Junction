# 🎨 Migraine Guardian - Design Screens Summary

## ✅ Completed Screens

All screens feature a **minimalist black & white design** with smooth animations and transitions.

---

## 📱 Screen Breakdown

### 1️⃣ **Welcome Screen** (`screens/onboarding/WelcomeScreen.tsx`)
**Purpose**: First impression and app introduction

**Design Elements**:
- Minimalist concentric circle logo (black & white)
- Large bold app name "Migraine Guardian"
- Tagline: "Your passive AI companion for migraine prediction and prevention"
- Subtitle emphasizing "Completely passive • No manual tracking"
- Large black "Get Started" button
- Privacy note at bottom
- Fade-in animations (FadeInUp, FadeInDown)

**User Flow**: Entry point → Click "Get Started" → Go to Permissions

---

### 2️⃣ **Permissions Screen** (`screens/onboarding/PermissionsScreen.tsx`)
**Purpose**: Request necessary app permissions

**Design Elements**:
- 4 interactive permission cards with emojis:
  - 🔔 Notifications
  - 📊 Passive Data Collection
  - 📅 Calendar Access
  - 🌦️ Location & Weather
- Each card shows title, description, and toggle state
- Selected cards turn black with white text
- Privacy-first information box at bottom
- Continue button (enabled only when all permissions granted)
- Back button
- Staggered FadeInRight animations

**User Flow**: Select all 4 permissions → Click "Continue" → Go to Data Sources

---

### 3️⃣ **Data Sources Screen** (`screens/onboarding/DataSourcesScreen.tsx`)
**Purpose**: Choose data monitoring method

**Design Elements**:
- Two main mode cards:
  - 📱 Phone Only
  - ⌚ Connect Wearable
- If wearable selected, show device options:
  - Apple Watch
  - Fitbit
  - Garmin
  - Samsung Galaxy
  - Simulate Data (for demo/testing)
- Contextual information box based on selection
- Continue button (enabled when mode selected)
- FadeInUp and FadeInDown animations

**User Flow**: Select mode (and optionally wearable) → Click "Continue" → Go to Trigger Personalization

---

### 4️⃣ **Trigger Personalization Screen** (`screens/onboarding/TriggerPersonalizationScreen.tsx`)
**Purpose**: Learn user's migraine patterns

**Design Elements**:
- **Frequency Section**: 4 radio-style options
  - Rarely (< 1/month)
  - Occasionally (1-4/month)
  - Frequently (5-15/month)
  - Chronic (15+/month)
- **Triggers Section**: 8 selectable trigger cards in 2-column grid
  - 😰 Stress
  - 📱 Screen Time
  - 😴 Poor Sleep
  - 🔊 Loud Noise
  - 🌦️ Weather Changes
  - 🧬 Hormonal
  - 🍷 Food & Drink
  - 💡 Bright Light
- AI learning information box
- Continue button (enabled when frequency + at least 1 trigger selected)
- FadeInRight and FadeInDown animations

**User Flow**: Select frequency + triggers → Click "Continue" → Go to Dashboard Intro

---

### 5️⃣ **Dashboard Intro Screen** (`screens/onboarding/DashboardIntroScreen.tsx`)
**Purpose**: Introduce dashboard features before first use

**Design Elements**:
- **Preview Card**: Black card showing mock risk index (34%)
  - Large percentage display
  - Risk status indicator (Low Risk with green dot)
  - Mini 7-day bar chart
- **Features List**: 5 features with icons and descriptions
  - 🎯 Migraine Risk Index
  - 📊 Trend Analytics
  - ⚡ Trigger Insights
  - 💡 Personalized Tips
  - 🔔 Voice Alerts
- **How It Works**: 3-step process explanation
- **Remember Box**: Black card with motivational message
- "Go to Dashboard" button (green/prominent)
- Multiple staggered animations

**User Flow**: Review features → Click "Go to Dashboard" → Enter main app

---

### 6️⃣ **Dashboard Screen** (`screens/DashboardScreen.tsx`)
**Purpose**: Main app interface showing all health metrics and predictions

**Design Elements**:

#### Header
- App name "Migraine Guardian"
- Current date

#### Risk Index Card (Black)
- "MIGRAINE RISK INDEX" label
- Large percentage (e.g., 34%)
- Risk status badge (Low/Medium/High) with color dot
- 7-day mini trend chart (bar graph)

#### Quick Metrics (4 cards in 2x2 grid)
- HRV: 65 ms (↓ -12%)
- Sleep: 6.5 hrs (↓ -1.5h)
- Stress: Medium (↑ +15%)
- Screen: 4.2 hrs (↑ +40%)
- Gray background, black text
- Trend indicators (up/down arrows)

#### Top Contributing Triggers
- 4 triggers with horizontal progress bars:
  - 📱 Screen Time (85%)
  - 😴 Sleep Debt (72%)
  - 😰 Stress Level (68%)
  - 💓 HRV Drop (45%)
- Black progress bars on gray background

#### AI Insight Card (Black gradient)
- 💡 Icon in white circle
- "AI Insight" heading
- Personalized tip text (white/gray)
- "🔊 Play Voice Alert" button (white)

#### Detailed Trends Section
- Period selector: Today / Week / Month (pill-style toggle)
- 3 chart placeholder cards:
  - Heart Rate Variability (HRV)
  - Sleep Quality
  - Stress Levels
- Each shows "📊 Chart will render here"

**User Flow**: View all metrics → Review AI tips → Explore trends → Take preventive action

---

## 🎨 Design System

### Colors
```
Primary: #000000 (Black)
Secondary: #FFFFFF (White)
Gray 50-900: Custom grayscale palette
Accent: Green (low), Yellow (medium), Red (high)
```

### Typography
```
Headings: 2xl-5xl, bold
Body: base-lg, regular
Captions: sm-xs, gray
```

### Spacing
```
Cards: p-6 to p-8
Margins: mx-6, my-6
Gaps: gap-2 to gap-4
```

### Border Radius
```
Buttons: rounded-full
Cards: rounded-2xl to rounded-3xl
Badges: rounded-full
Progress bars: rounded-full
```

### Animations
- FadeInUp
- FadeInDown
- FadeInRight
- FadeIn
- Duration: 400-1000ms
- Staggered delays: 50-400ms

---

## 📊 Component Library

Created reusable components in `components/ui/UIComponents.tsx`:

1. **Button**
   - Variants: primary, secondary, outline
   - Sizes: small, medium, large
   - States: loading, disabled
   - Icon support

2. **Card**
   - Variants: default, elevated, outlined

3. **Badge**
   - Variants: success, warning, danger, neutral
   - Sizes: small, medium

4. **ProgressBar**
   - Customizable progress (0-100%)
   - Custom colors
   - Custom height

5. **Divider**
   - Horizontal line separator

---

## 🚀 Navigation Structure

```
App
└── NavigationContainer
    └── Stack Navigator
        ├── Welcome (initial)
        ├── Permissions
        ├── DataSources
        ├── TriggerPersonalization
        ├── DashboardIntro
        └── Dashboard (no back gesture)
```

**Transitions**: Horizontal slide with iOS-style animations

---

## 📁 File Structure

```
client/
├── app/
│   └── _layout.tsx (Root navigation)
├── screens/
│   ├── onboarding/
│   │   ├── WelcomeScreen.tsx
│   │   ├── PermissionsScreen.tsx
│   │   ├── DataSourcesScreen.tsx
│   │   ├── TriggerPersonalizationScreen.tsx
│   │   └── DashboardIntroScreen.tsx
│   ├── DashboardScreen.tsx
│   └── UIShowcaseScreen.tsx (demo)
├── components/
│   └── ui/
│       └── UIComponents.tsx
├── tailwind.config.js
├── metro.config.js
├── babel.config.js
├── global.css
└── nativewind-env.d.ts
```

---

## ✨ Key Features Implemented

✅ Minimalist black & white design  
✅ 5 onboarding screens with smooth flow  
✅ Complete dashboard with all sections  
✅ Reusable component library  
✅ NativeWind (Tailwind CSS) integration  
✅ React Native Reanimated animations  
✅ Stack navigation with gestures  
✅ TypeScript type safety  
✅ Responsive layouts  
✅ Interactive UI elements  
✅ Mock data for demonstration  

---

## 🎯 Ready for Integration

The design is **100% complete** and ready for:
- Backend API integration
- Real data from sensors/wearables
- Chart library (Victory Native) integration
- Clerk authentication
- Gemini AI API
- Eleven Labs voice synthesis
- Push notifications
- Background data collection

All placeholder sections (like charts) have clear integration points for the next development phase.

---

## 💻 How to Test

```bash
cd client
npm install
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- Scan QR code for physical device

Navigate through all 6 screens to see the complete flow!

---

Built with ❤️ using React Native, Expo, and NativeWind
