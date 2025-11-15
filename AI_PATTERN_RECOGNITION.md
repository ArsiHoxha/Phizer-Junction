# 🤖 AI-Powered Migraine Pattern Recognition System

## Overview
When a user logs a migraine, the system now:
1. **Captures everything** - All current health metrics snapshot
2. **Uses Gemini AI** - Analyzes triggers with Google's AI
3. **Pattern recognition** - Learns and predicts similar conditions
4. **Preventive notifications** - Warns BEFORE migraines happen

---

## 🎯 How It Works

### 1. Migraine Logging Flow

**User Action:** Taps "I Have a Migraine" button

**What Happens:**
```
Step 1: CAPTURE PHASE (1.5s)
├─ HRV & Heart Rate
├─ Stress Levels  
├─ Sleep Quality
├─ Screen Time
├─ Weather & Barometric Pressure
├─ Calendar Load
└─ Timestamp

Step 2: AI ANALYSIS PHASE (2-3s)
├─ Send data to Gemini AI
├─ AI identifies trigger patterns
├─ Extract primary causes
├─ Generate recommendations
└─ Calculate learned thresholds

Step 3: PATTERN LEARNING
├─ Store in migraine database
├─ Update user's pattern profile
├─ Set prediction thresholds
└─ Enable future monitoring
```

---

## 🧠 Gemini AI Analysis

### Data Sent to Gemini
```javascript
{
  wearable: { hrv, heartRate, stress },
  sleep: { sleepQuality, sleepHours },
  phone: { screenTime },
  location: { temperature, humidity, pressure, weather },
  calendar: { upcomingEvents },
  historicalMigraines: [past 50 migraines with metrics]
}
```

### AI Insights Extracted
- **Primary Triggers**: What caused this migraine (with % contribution)
- **Explanations**: Why each factor matters
- **Recommendations**: Personalized prevention steps
- **Pattern Thresholds**: Values to watch for future warnings

### Example AI Response
```
"Your HRV of 38ms indicates high stress. Combined with 
barometric pressure of 1005 hPa and only 5.2h sleep, 
these conditions closely match your past migraines. 
Stress and low HRV were present in 85% of your logged episodes."
```

---

## 📊 Pattern Recognition Algorithm

### Learning Process

**After Each Migraine:**
```javascript
// Calculate averages from past migraines
avgHRVAtMigraine = 42ms
avgStressAtMigraine = 78%
avgSleepQualityAtMigraine = 48%
avgPressureAtMigraine = 1006 hPa
avgScreenTimeAtMigraine = 6.5h
avgTemperatureAtMigraine = 28°C

// Set smart thresholds for warnings
thresholds = {
  hrvWarning: 47ms (avg + 5ms buffer),
  stressWarning: 68% (avg - 10% buffer),
  sleepQualityWarning: 58% (avg + 10% buffer),
  pressureWarning: 1011 hPa (avg + 5 hPa buffer),
  ...
}
```

### Real-Time Monitoring

**Every time new metrics arrive:**
```javascript
// Compare current vs learned patterns
currentMetrics = { hrv: 44, stress: 72, pressure: 1008 }
patterns = { hrv: 42, stress: 78, pressure: 1006 }

// Calculate similarity for each factor
hrvMatch = 95% (44 vs 42 - very close!)
stressMatch = 92% (72 vs 78 - very close!)
pressureMatch = 88% (1008 vs 1006 - close!)

// Overall similarity
totalSimilarity = 92% 🚨 ALERT!
```

### Notification Triggers

| Similarity | Warning Level | Action |
|------------|---------------|--------|
| **90-100%** | 🚨 **CRITICAL** | "HIGH MIGRAINE RISK - Take action now!" |
| **75-89%** | ⚠️ **HIGH** | "Warning: Conditions match past migraines" |
| **60-74%** | 🟡 **MODERATE** | "Monitor symptoms closely" |
| **< 60%** | ✅ **LOW** | No alert |

---

## 🔔 Predictive Notifications

### When Patterns Match

**Alert Message:**
```
🚨 HIGH MIGRAINE RISK

⚠️ PATTERN MATCH DETECTED:

• HRV approaching migraine levels (44ms)
• Stress matching migraine pattern (72%)
• Pressure matches migraine conditions (1008 hPa)

Similarity: 92% with past migraines

🎯 Recommended Actions:
• Take preventive medication if prescribed
• Reduce screen time and stress
• Stay hydrated (drink 3 glasses of water)
• Rest in a dark, quiet room if possible
```

---

## 💾 Database Storage

### MigraineLog Collection
```javascript
{
  _id: ObjectId,
  clerkId: "user_123",
  timestamp: Date,
  severity: 7,
  metricsSnapshot: {
    hrv: 38,
    stress: 82,
    sleepQuality: 45,
    screenTime: 380,
    weather: {
      pressure: 1005,
      temperature: 29,
      humidity: 78
    },
    calendarLoad: 8
  },
  aiAnalysis: {
    confidence: 92,
    geminiInsights: "Full AI response text...",
    primaryCauses: [
      { factor: "High Stress", contribution: 30, explanation: "..." },
      { factor: "Low HRV", contribution: 25, explanation: "..." },
      { factor: "Low Pressure", contribution: 20, explanation: "..." }
    ],
    recommendations: [
      "🧘 Stress Management: Practice deep breathing...",
      "❤️ HRV Boost: Stay hydrated, do light exercise..."
    ],
    predictiveThresholds: {
      hrvWarning: 47,
      stressWarning: 68,
      pressureWarning: 1011
    }
  }
}
```

---

## 🔧 Technical Implementation

### Backend Services

**1. Pattern Monitoring Service**
- `patternMonitoring.js`
- Compares real-time metrics with learned patterns
- Calculates similarity scores
- Generates warnings

**2. Gemini AI Integration**
- `geminiService.js`
- Analyzes migraine triggers
- Provides natural language insights
- Identifies correlations

**3. Automatic Monitoring**
- Runs on every `/api/metrics` submission
- Background pattern checking
- No user action required

### Client Features

**Enhanced Log Screen**
- Visual progress indicators
- Phase-based loading (Capture → Analyze → Complete)
- Success confirmation with checklist
- Clear explanations of what's happening

---

## 📈 Benefits

### For Users
✅ **Zero Effort**: One tap logs everything  
✅ **AI Insights**: Understand what triggers migraines  
✅ **Predictions**: Get warned BEFORE migraines happen  
✅ **Learning**: System gets smarter with each log  
✅ **Prevention**: Actionable recommendations  

### For Demo
🎯 **Impressive**: Gemini AI integration  
🎯 **Visual**: Great loading animations  
🎯 **Smart**: Pattern recognition shown in action  
🎯 **Practical**: Real preventive value  

---

## 🚀 Usage

### User Flow
```
1. User feels migraine coming
2. Opens app → Taps "Log Migraine" tab
3. Taps big red button
4. Sees capture progress (HRV, stress, weather, etc.)
5. Sees AI analysis progress (Gemini working)
6. Gets success confirmation
7. [Later] Receives notification when similar conditions detected
```

### Notification Flow
```
1. App continuously monitors metrics (every 5 seconds in demo)
2. Backend checks pattern similarity
3. If similarity > 75%:
   → Log warning in console
   → [Future] Send push notification
   → User can take preventive action
4. Migraine prevented! 🎉
```

---

## 🔮 Future Enhancements

- [ ] Push notifications integration
- [ ] Pattern visualization graphs
- [ ] Multi-factor trigger combinations
- [ ] Medication effectiveness tracking
- [ ] Weather forecast integration
- [ ] Phase detection (prodrome/aura/headache/postdrome)
- [ ] Social triggers (events, travel, etc.)

---

## 📝 Example Scenarios

### Scenario 1: First Migraine
```
User logs first migraine
→ System captures metrics
→ No patterns yet (need 3+ migraines)
→ Gemini provides general analysis
→ Stores baseline data
```

### Scenario 2: Third Migraine
```
User logs third migraine
→ System has enough data for patterns
→ Identifies: Low pressure + high stress = common pattern
→ Sets thresholds: Warn when pressure < 1011 AND stress > 68
→ Pattern recognition activated ✓
```

### Scenario 3: Prevention Success
```
[Next Day]
Weather: Pressure dropping to 1008
User: Stress rising to 72% due to work
System: 🚨 92% similarity to past migraines!
User: Takes preventive medication
Result: Migraine avoided! 🎉
```

---

## 🎓 Technical Details

### API Endpoints

**POST** `/api/migraine/quick-log`  
Logs migraine with current metrics snapshot

**POST** `/api/migraine/check-patterns`  
Check if current metrics match patterns (for notifications)

**POST** `/api/metrics`  
Submit metrics (automatically checks patterns)

### Pattern Matching Algorithm
```javascript
function calculateSimilarity(current, pattern) {
  // For each metric
  for (metric in current) {
    diff = abs(current[metric] - pattern[metric])
    score = 100 - (diff / pattern[metric]) * 100
    
    if (score >= 70) {
      // This metric matches!
      similarityScores.push(score)
    }
  }
  
  // Average similarity
  totalSimilarity = average(similarityScores)
  
  if (totalSimilarity >= 75) {
    return { shouldAlert: true, similarity: totalSimilarity }
  }
}
```

---

## 🏆 Demo Highlights

**Show judges:**
1. Log a migraine (impressive loading animation)
2. Backend console shows Gemini AI analysis
3. Pattern thresholds learned
4. [Later] Metrics approach those thresholds
5. Pattern match detected (92% similarity!)
6. Console shows alert would be sent
7. User could have prevented migraine!

**Key talking points:**
- "AI learns YOUR unique triggers"
- "Predicts migraines before they happen"
- "Gets smarter with each log"
- "Zero user effort - completely passive"

---

*Built with ❤️ for Phizer Junction hackathon*
