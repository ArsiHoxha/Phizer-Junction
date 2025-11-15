# Understanding Your Dashboard - What The Numbers Mean

## What You're Seeing: "Random" Changing Numbers

When you open your app dashboard, you see health metrics like:
- **HRV** (Heart Rate Variability): 42, 58, 65 (keeps changing)
- **Heart Rate**: 68, 72, 75 bpm (keeps changing)
- **Stress**: 45%, 62%, 38% (keeps changing)
- **Migraine Risk**: 34%, 56%, 28% (keeps changing)

### Why This Is Happening

Your app is in **TEST MODE** using one of two data sources:

#### Option 1: Realistic Dataset (Currently Active)
- **What it is**: A pre-programmed set of 100 realistic health data entries
- **How it works**: Cycles through these 100 entries, one every 5 seconds
- **Why we made it**: To test the app with medical-ly accurate patterns
- **Result**: Numbers change every 5 seconds as it progresses through the dataset

#### Option 2: Random Simulator
- **What it is**: Generates random but realistic health numbers
- **How it works**: Creates new random values every 5 seconds
- **Why it exists**: For testing before connecting real devices
- **Result**: Completely random numbers every 5 seconds

## This Is NORMAL for Testing!

**You don't have broken data - this is intentional test data!**

The app was designed to work with:
1. **Real Apple Watch data** (when connected)
2. **Test dataset** (for development and demo)
3. **Random simulator** (for testing)

Since you haven't connected a real Apple Watch yet, the app is showing test data.

## How To Fix It: Use Real Data

### Step 1: Connect Apple Health
Go to **Settings** tab → **Health Data Sources** → **Connect Apple Health**

This will pull your REAL metrics from your Apple Watch or iPhone:
- Real heart rate
- Real HRV
- Real steps
- Real sleep data

### Step 2: Stop Using Dataset Mode
Go to **Settings** tab → **Data Source** section → Toggle OFF **"Use Realistic Dataset"**

This stops the cycling through test entries.

### Step 3: Understand What You'll See

Once connected to real data:
- Numbers will update **every 5 seconds** but won't jump wildly
- They'll reflect YOUR actual health metrics
- Changes will be gradual and natural (not random jumps)
- Still updates frequently to catch early migraine warnings

## What The Numbers Actually Mean

### HRV (Heart Rate Variability)
- **What**: Variation in time between heartbeats
- **Normal**: 50-100 (higher is better)
- **Low HRV**: Early warning sign of migraine (stressed nervous system)
- **Why it matters**: Drops 6-48 hours before migraine

### Heart Rate
- **What**: Beats per minute
- **Normal**: 60-100 at rest
- **Elevated**: Can indicate stress or aura phase
- **Why it matters**: Sudden spikes can predict migraine

### Stress Level
- **What**: Calculated from HRV + heart rate
- **Normal**: Below 40%
- **High**: Above 60%
- **Why it matters**: High stress is #1 migraine trigger

### Migraine Risk %
- **What**: AI prediction of migraine likelihood
- **Low**: 0-30% (green)
- **Moderate**: 30-60% (yellow/orange)
- **High**: 60-100% (red)
- **Why it matters**: Early warning system

## The App Is Working Correctly!

What you're experiencing is **exactly what should happen** in test mode:

✅ Numbers change frequently (every 5 seconds)
✅ They seem random (because you're using test data)
✅ Risk percentage fluctuates (simulating real health variations)
✅ Notifications trigger when risk is high

This is all designed to:
1. Test the app works before you have real data
2. Show you what the interface will look like
3. Demonstrate the early warning system
4. Let you explore features without Apple Watch

## Next Steps

### Option A: Connect Real Device (Recommended)
1. Open Settings tab
2. Tap "Connect Apple Health"
3. Grant permissions
4. Turn OFF "Use Realistic Dataset"
5. **Numbers will now be your real health data!**

### Option B: Keep Testing Mode
If you want to see how the app predicts migraines:
1. Keep dataset mode ON
2. Watch as it simulates a migraine pattern
3. You'll see risk % rise over time
4. You'll get notification warnings
5. You can tap "I Have a Migraine" to test logging

### Option C: Pause Updates (For Demos)
If you just want to show someone the app without changing numbers:
1. Close the app completely
2. Don't grant background permissions
3. Numbers will freeze at last value
4. Re-open to resume updates

## Summary

**Your app is NOT broken!** 

You're seeing test data cycle through because:
- No real Apple Watch connected yet
- App needs to show SOMETHING
- Test data has realistic migraine patterns
- This helps you understand the interface

**To see real data**: Connect Apple Health in Settings

**To understand patterns**: Watch how the test data shows risk increasing before a "migraine" event

**Questions to ask yourself**:
- Do I have an Apple Watch? → Connect it!
- Am I just testing? → This is perfect, keep exploring
- Do I want to demo the app? → This data shows how it works
- Am I confused by changes? → This document explains why

---

## Technical Details (If You're Curious)

### Update Frequency
- **Wearable data**: Every 5 seconds
- **Phone data**: Every 10 minutes
- **Weather data**: Every 30 minutes
- **Sleep data**: Once per day
- **Calendar**: Every 30 minutes

### Why So Frequent?
To catch **prodrome phase** (early warning signs 6-48 hours before migraine):
- HRV drops need to be caught quickly
- Stress spikes are time-sensitive
- Early detection = better prevention

### Data Flow
```
Test Dataset OR Apple Health
    ↓ (every 5 sec)
Data Collection Context
    ↓
AI Analysis
    ↓
Risk Calculation
    ↓
Dashboard Display (what you see)
    ↓
Notification Check
```

### What Gets Saved
- Latest metrics (AsyncStorage)
- Current risk level (AsyncStorage)
- Migraine logs (Backend database)
- Historical patterns (Backend)

So when you close and reopen the app, it remembers your last state!

---

**Bottom Line**: Connect Apple Health for real data, or enjoy exploring with test data. Either way, the app is working perfectly! 🎯
