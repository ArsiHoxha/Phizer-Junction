# iOS Widget Setup Guide
## Migraine Risk Index Home Screen Widget

This guide will walk you through adding a home screen widget to display the migraine risk index.

---

## 📱 Widget Features

### Three Widget Sizes Available:

1. **Small Widget (2x2)**
   - Circular risk percentage display
   - Color-coded by risk level
   - Last update timestamp

2. **Medium Widget (4x2)**
   - Risk percentage + level
   - Top 3 active triggers
   - Key health metrics (HR, HRV)
   - Last update time

3. **Large Widget (4x4)**
   - Full risk display with large circle
   - Complete trigger list
   - All health metrics (HR, HRV, Sleep, Stress)
   - Detailed information

### Color Coding:
- 🟢 **Green** (0-29%): Low Risk
- 🟡 **Yellow** (30-49%): Moderate Risk  
- 🟠 **Orange** (50-69%): High Risk
- 🔴 **Red** (70-100%): Very High Risk

---

## ⚙️ Prerequisites

Before starting, ensure you have:

- ✅ Xcode 15+ installed
- ✅ iOS 16+ target device/simulator
- ✅ Valid Apple Developer account
- ✅ React Native app already prebuilt (`npx expo prebuild`)

---

## 🚀 Step-by-Step Setup

### Step 1: Prebuild Your Expo App

```bash
cd /Users/a1111/Documents/GitHub/Phizer-Junction/client
npx expo prebuild
```

This generates the native `ios/` folder needed for widget development.

### Step 2: Open Project in Xcode

```bash
cd ios
open *.xcworkspace
```

⚠️ **Important**: Open the `.xcworkspace` file, NOT the `.xcodeproj` file!

### Step 3: Create Widget Extension

1. In Xcode, go to: **File** → **New** → **Target**
2. Search for "Widget Extension"
3. Click **Widget Extension** and press **Next**
4. Configure the widget:
   - **Product Name**: `MigraineWidget`
   - **Team**: Select your Apple Developer team
   - **Include Configuration Intent**: ❌ Unchecked (for now)
5. Click **Finish**
6. When prompted "Activate scheme?", click **Activate**

### Step 4: Add the Widget Code

1. In the Project Navigator, find the `MigraineWidget` folder
2. Delete the default `MigraineWidget.swift` file
3. Right-click `MigraineWidget` folder → **Add Files to "MigraineWidget"**
4. Select the `MigraineWidget.swift` file from `WIDGET_CODE/MigraineWidget.swift`
5. Make sure **"Copy items if needed"** is checked

### Step 5: Configure App Groups (for data sharing)

#### For the Main App:
1. Select your main app target (e.g., "client")
2. Go to **Signing & Capabilities** tab
3. Click **+ Capability** button
4. Search and add **App Groups**
5. Click **+** under App Groups
6. Enter: `group.com.phizerjunction.migraine`
7. Enable the checkbox next to it

#### For the Widget:
1. Select **MigraineWidget** target
2. Repeat steps 2-7 above
3. Use the **same** App Group ID: `group.com.phizerjunction.migraine`

⚠️ **Critical**: Both targets MUST use the exact same App Group ID!

### Step 6: Update Widget Service

1. Open `client/services/widgetDataService.ts`
2. Verify the `APP_GROUP_ID` matches what you created:

```typescript
const APP_GROUP_ID = 'group.com.phizerjunction.migraine';
```

### Step 7: Update Info.plist (Optional but Recommended)

1. Select **MigraineWidget** target
2. Go to **Info** tab
3. Add these entries if needed:
   - `NSHealthShareUsageDescription`: "Widget displays health metrics"
   - `NSHealthUpdateUsageDescription`: "Widget updates with health data"

### Step 8: Build and Run

1. Select **MigraineWidget** scheme from the scheme selector (top left)
2. Choose your device or simulator
3. Click **Run** (▶️ button)
4. The widget will appear in the widget gallery

### Step 9: Add Widget to Home Screen

1. Long-press on the home screen
2. Tap the **+** button (top left)
3. Search for "Migraine Risk"
4. Select your preferred size (Small/Medium/Large)
5. Tap **Add Widget**
6. Position the widget and tap **Done**

---

## 🔧 Troubleshooting

### Widget Not Appearing
- Make sure you activated the widget extension when prompted
- Check that both app and widget have the same App Group enabled
- Clean build: **Product** → **Clean Build Folder** (Cmd + Shift + K)
- Rebuild both targets

### No Data Showing
- Run the main app first to populate widget data
- Check AsyncStorage has the `widget_migraine_data` key
- Verify App Group ID matches in both widget code and service
- Check Xcode console for errors

### Widget Not Updating
- Widgets update every 15 minutes automatically
- Force update: Remove and re-add the widget
- Check that `WidgetDataService.updateWidgetData()` is being called
- Verify shared group preferences are accessible

### Build Errors
**Error: "No such module 'WidgetKit'"**
- Solution: Set deployment target to iOS 14.0+ in both app and widget

**Error: "App Groups capability missing"**
- Solution: Follow Step 5 again, ensure both targets have App Groups enabled

**Error: "Could not read values for shared group"**
- Solution: Check App Group ID spelling is identical in widget code and service

### Data Not Syncing
1. Add debug logging to `widgetDataService.ts`:
```typescript
console.log('Updating widget with data:', widgetData);
```

2. Check widget's `loadWidgetData()` function:
```swift
print("Loading widget data from: \(appGroupID)")
if let data = userDefaults?.data(forKey: "widget_migraine_data") {
    print("Data found: \(data)")
} else {
    print("No data found")
}
```

---

## 📊 How Data Flow Works

```
┌─────────────────────┐
│   Main React App    │
│  (index.tsx)        │
└──────────┬──────────┘
           │
           │ useEffect updates widget
           │ when currentRisk changes
           ▼
┌─────────────────────┐
│WidgetDataService    │
│  (TypeScript)       │
└──────────┬──────────┘
           │
           │ Formats data
           │ Saves to AsyncStorage
           │ Saves to Shared Group
           ▼
┌─────────────────────┐
│  App Groups         │
│  (Shared Storage)   │
└──────────┬──────────┘
           │
           │ Widget reads every 15min
           ▼
┌─────────────────────┐
│  iOS Widget         │
│  (Swift/SwiftUI)    │
└─────────────────────┘
```

---

## 🎨 Customization

### Change Widget Colors
Edit `MigraineWidget.swift`:

```swift
// Line ~175 - Update risk colors
private func getRiskColor(percentage: Int) -> Color {
    if percentage < 30 { return Color.green }      // Low
    if percentage < 50 { return Color.yellow }     // Moderate
    if percentage < 70 { return Color.orange }     // High
    return Color.red                                // Very High
}
```

### Change Update Frequency
Edit `MigraineWidget.swift`:

```swift
// Line ~45 - Change refresh interval
let nextUpdate = Calendar.current.date(
    byAdding: .minute, 
    value: 15,  // ← Change this number (minimum: 15 minutes)
    to: currentDate
)!
```

### Add More Metrics
1. Update `WidgetData` interface in `widgetDataService.ts`
2. Update `MigraineWidgetData` struct in Swift
3. Update `formatForWidget()` to include new data
4. Add UI elements to widget views in Swift

---

## 🧪 Testing Checklist

- [ ] Widget appears in widget gallery
- [ ] Small widget displays risk percentage
- [ ] Medium widget shows triggers and metrics
- [ ] Large widget shows full details
- [ ] Colors change based on risk level (green → red)
- [ ] "X min ago" updates correctly
- [ ] Widget refreshes when app updates risk
- [ ] Widget works after app is closed
- [ ] Widget survives device restart
- [ ] Multiple widget sizes can coexist

---

## 📝 Maintenance Notes

### After App Updates
- Widgets automatically update when app is opened
- Force refresh: Remove and re-add widget
- Clear cache: Long-press widget → Remove Widget → Re-add

### Debugging Widget
1. Attach debugger: **Debug** → **Attach to Process** → Select widget
2. View logs: Open Console.app → Filter by "MigraineWidget"
3. Check shared data:
```bash
xcrun simctl get_app_container booted com.phizerjunction.migraine data
# Navigate to /Library/Preferences/ and check .plist files
```

---

## 🚨 Common Issues & Solutions

### Issue: Widget shows "Unknown" time
**Cause**: Date format mismatch  
**Solution**: Ensure `lastUpdate` uses ISO8601 format in TypeScript

### Issue: Widget shows placeholder data only
**Cause**: App hasn't written data yet  
**Solution**: Open main app, wait for risk calculation, then check widget

### Issue: Widget freezes or doesn't update
**Cause**: Timeline policy issue  
**Solution**: Change timeline policy from `.atEnd` to `.after(nextUpdate)`

### Issue: Different data in app vs widget
**Cause**: App Group ID mismatch  
**Solution**: Triple-check spelling in both Swift and TypeScript files

---

## 📦 Files Modified/Created

### New Files:
- `client/services/widgetDataService.ts` - Data sharing service
- `WIDGET_CODE/MigraineWidget.swift` - Widget UI code
- `WIDGET_SETUP.md` - This setup guide

### Modified Files:
- `client/app/(tabs)/index.tsx` - Added widget data updates
- `client/package.json` - Added `react-native-shared-group-preferences`

---

## 🎯 Next Steps

After basic setup, consider adding:

1. **Interactive Widgets** (iOS 17+)
   - Tap to open app directly to risk details
   - Quick actions from widget

2. **Lock Screen Widgets** (iOS 16+)
   - Circular or rectangular lock screen widget
   - Always-visible risk indicator

3. **Live Activities** (iOS 16.1+)
   - Real-time risk updates on Dynamic Island
   - Persistent notification with current risk

4. **Widget Configuration**
   - Let users choose which metrics to display
   - Custom color themes
   - Trigger filter preferences

---

## 💡 Tips & Best Practices

✅ **DO:**
- Update widget data whenever risk changes significantly
- Use clear, large fonts for at-a-glance readability
- Color-code risk levels consistently
- Keep update frequency reasonable (every 15min)
- Test on both light and dark mode

❌ **DON'T:**
- Update too frequently (battery drain)
- Store sensitive health data in widgets
- Make widgets clickable without proper deep linking
- Forget to handle missing/stale data gracefully

---

## 📚 Additional Resources

- [Apple WidgetKit Documentation](https://developer.apple.com/documentation/widgetkit)
- [Widget Design Guidelines](https://developer.apple.com/design/human-interface-guidelines/widgets)
- [App Groups Setup](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_security_application-groups)
- [SwiftUI Tutorial](https://developer.apple.com/tutorials/swiftui)

---

## 🆘 Need Help?

If you encounter issues not covered here:

1. Check Xcode console for error messages
2. Verify all setup steps were completed
3. Try clean build and rebuild
4. Check that app is running and collecting data
5. Remove and re-add widget to home screen

**Widget Status Check:**
```bash
# Open main app
# Navigate to Settings
# Check "Last widget update" timestamp
# Should be within last 15 minutes
```

---

**Created**: November 2025  
**Version**: 1.0  
**Compatibility**: iOS 16.0+, Xcode 15+

Happy widget building! 🎉
