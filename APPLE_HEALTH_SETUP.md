# Apple Health & Apple Watch Integration Setup

This guide walks you through connecting your app to Apple Health and Apple Watch data.

## Prerequisites

- **iOS device** (iPhone) - HealthKit is only available on iOS
- **Apple Watch** (optional but recommended) - Apple Watch syncs health data to the Health app
- **Xcode** and a Mac for building iOS apps
- React Native app using Expo (you'll need to prebuild/eject)

## Installation Steps

### 1. Install Native Dependency

```bash
cd client
npm install react-native-health
```

### 2. Prebuild the Expo App (Required for Native Modules)

Since `react-native-health` is a native module, you must use Expo's prebuild or switch to a bare workflow:

```bash
npx expo prebuild
```

This generates the `ios/` and `android/` folders with native code.

### 3. Install iOS Pods

```bash
cd ios
pod install
cd ..
```

### 4. Add HealthKit Capability in Xcode

1. Open `ios/YourApp.xcworkspace` in Xcode
2. Select your app target
3. Go to **Signing & Capabilities**
4. Click **+ Capability**
5. Add **HealthKit**
6. Check "Background Delivery" if you want real-time updates

### 5. Update Info.plist

Add the required privacy description to `ios/YourApp/Info.plist`:

```xml
<key>NSHealthShareUsageDescription</key>
<string>This app needs access to your health data to track migraine triggers and provide personalized insights.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>This app wants to save health data to track your migraine patterns.</string>
```

### 6. Build and Run on Device

HealthKit only works on **real iOS devices**, not simulators.

```bash
npx expo run:ios --device
```

Or build in Xcode and deploy to your device.

## Usage

### In the App

1. Open the app and navigate to **Settings**
2. Look for the **"Apple Health & Watch"** section
3. Tap **"Connect Apple Health"**
4. Grant permissions when prompted (Heart Rate, HRV, Steps, Sleep, Workouts)
5. Tap **"Sync Now"** to fetch latest data

### Data Automatically Synced

Once connected, the app automatically fetches:

- ❤️ **Heart Rate** - Real-time HR from Apple Watch
- 📊 **HRV (Heart Rate Variability)** - Key stress indicator
- 🚶 **Steps** - Daily step count
- 😴 **Sleep Analysis** - Sleep quality and duration
- 🏃 **Workouts** - Recent exercise sessions
- 🔥 **Active Energy** - Calories burned

### How It Works

- The `DataCollectionContext` checks every 5 seconds if Apple Health is connected
- If connected, it fetches real HealthKit data and merges it with simulated data
- Real data always overrides simulated data
- The app uses this data for:
  - Risk calculations
  - AI analysis
  - Dashboard metrics
  - Trigger detection
  - Notifications

## Troubleshooting

### "Apple Health is only available on iOS devices"

- You're running on Android or simulator - use a real iPhone

### "Failed to connect to Apple Health"

- Check HealthKit capability is enabled in Xcode
- Verify Info.plist has privacy descriptions
- Make sure you're on a real device, not simulator

### No data showing after connecting

- Check Health app permissions: Settings → Privacy → Health → YourApp
- Tap "Sync Now" in Settings to manually fetch data
- Check console logs for any errors

### Data is still simulated

- Ensure Apple Watch is paired and syncing to Health app
- Check that Health app has recent data (open Health app to verify)
- Grant all permissions when prompted

## Code Structure

```
client/
├── services/
│   └── appleHealthService.ts          # HealthKit integration
├── contexts/
│   └── DataCollectionContext.tsx      # Auto-merges Apple Health data
└── app/(tabs)/
    └── settings.tsx                   # Connection UI
```

## Testing

1. Connect Apple Health in Settings
2. Check dashboard - HR, HRV, Steps should show real values
3. Open AI Insights - analysis should use real data
4. Check notifications - risk alerts based on real metrics

## Notes

- Apple Watch data syncs to iPhone's Health app automatically when devices are near each other
- Background sync requires "Background Delivery" capability
- Some metrics require specific Apple Watch models (e.g., HRV needs Series 4+)
- Data freshness depends on last sync from Apple Watch to iPhone

## Support

If you encounter issues, check:
1. Xcode build logs
2. Metro bundler console
3. App console logs (look for "Apple Health" messages)
