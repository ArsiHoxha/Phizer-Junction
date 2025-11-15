# Passive Migraine Phase Detection System

## Overview
The app now implements **medically accurate 4-phase migraine tracking** while remaining **100% passive**. Users don't manually log phases - the AI detects everything automatically.

## Medical Accuracy (Based on Pfizer PDF)

### 4 Migraine Phases

1. **Prodrome (Early Warning Phase)**
   - **Timing**: 6-48 hours before headache
   - **Detection Method**: HRV drops >15%, stress increases >20%, poor sleep
   - **Symptoms AI Detects**:
     - Fatigue (from low activity levels, HRV)
     - Mood changes (from phone usage patterns)
     - Concentration difficulty (from screen time, app switching)
     - Neck stiffness (from low movement data)

2. **Aura Phase (Pre-Headache)**
   - **Timing**: 20-60 minutes before headache
   - **Detection Method**: Sudden dramatic metric changes
   - **Symptoms AI Detects**:
     - Sensory changes (from sudden HR spikes)
     - Visual disturbances (hard to detect passively, may require user mention)

3. **Headache Phase (Main Attack)**
   - **Timing**: 4-72 hours typically
   - **Detection Method**: User confirms "I have a migraine"
   - **Symptoms AI Infers**:
     - Throbbing pain (user confirmed)
     - Light sensitivity (from screen brightness patterns)
     - Sound sensitivity (from volume changes)
     - Worse with activity (from stillness in movement data)
     - Nausea (from HR elevation + stillness)

4. **Postdrome Phase (Recovery)**
   - **Timing**: Hours to days after headache
   - **Detection Method**: Continued low HRV, elevated stress after resolution
   - **Symptoms AI Detects**:
     - Exhaustion (low activity, low HRV)
     - Weakness (low activity levels)
     - Confusion (elevated stress)
     - Difficulty concentrating (phone usage patterns)
     - Mood changes (screen time patterns)

## User Experience - Completely Passive

### How It Works

1. **Continuous Background Monitoring**
   - App collects passive data every 5 seconds:
     - HRV from wearable
     - Heart rate from wearable
     - Stress levels calculated from HRV
     - Sleep quality from phone/wearable
     - Screen time from phone usage
     - Activity level from movement data
     - Weather conditions

2. **Automatic Phase Detection**
   - AI continuously runs phase detection algorithm
   - Compares current metrics to user's baseline
   - Identifies deviations indicating each phase
   - Builds confidence scores (0-100%)

3. **Proactive Alerts**
   - **Prodrome Detected** (6-48h before): "Migraine warning - Early signs detected. Consider preventive measures."
   - **Aura Detected** (20-60min before): "Migraine imminent - Take medication now if prescribed."
   - **Headache Confirmed**: User taps "I have a migraine" button
   - **Postdrome Monitored**: "Recovery phase - Rest recommended. Monitoring your recovery."

4. **One-Tap Logging**
   - User feels migraine coming or has migraine
   - Taps big red button: "I Have a Migraine"
   - AI automatically:
     - Captures current metrics snapshot
     - Detects current phase (headache, but checks for prodrome/aura in history)
     - Identifies symptoms from passive data
     - Logs all active triggers
     - Scans last 48 hours for prodrome signs
     - Scans last 60 minutes for aura signs
     - Provides phase-specific recommendations
   - User gets instant confirmation - done!

## Technical Implementation

### Database Schema (MigraineLog.js)
```javascript
{
  phase: 'prodrome' | 'aura' | 'headache' | 'postdrome',
  phaseTimestamps: {
    prodromeStart: Date,    // When AI detected early warnings
    auraStart: Date,        // When AI detected aura (20-60min before)
    headacheStart: Date,    // When user confirmed
    postdromeStart: Date,   // When headache ended
    resolved: Date          // When fully recovered
  },
  detectedSymptoms: {
    prodrome: ['fatigue', 'mood_changes', 'concentration_difficulty', ...],
    aura: ['sensory_changes', ...],
    headache: ['throbbing_pain', 'nausea', 'light_sensitivity', ...],
    postdrome: ['exhaustion', 'confusion', 'weakness', ...]
  },
  aiAnalysis: {
    detectedPhase: 'headache',
    phaseConfidence: 90,
    earlyWarningSignals: [
      { metric: 'hrv', value: 42, deviation: -18, timestamp: '...' },
      { metric: 'stress', value: 68, deviation: +25, timestamp: '...' }
    ],
    recommendations: [
      { phase: 'prodrome', action: 'Take preventive medication', timing: 'preventive' },
      { phase: 'headache', action: 'Rest in dark quiet room', timing: 'immediate' },
      { phase: 'postdrome', action: 'Gentle activity, hydration', timing: 'recovery' }
    ]
  }
}
```

### Client-Side Types (migraine.ts)
- Complete TypeScript interfaces for all phases
- Symptom enums for each phase
- AI analysis structures
- Early warning signal types

### Passive Detection Service (passiveMigraineDetection.ts)
- `detectPhase()`: Main detection logic
- `detectProdrome()`: Identifies early warning signs
- `detectAura()`: Catches sudden pre-headache changes
- `detectHeadacheOrLater()`: Confirms headache phase
- `detectPostdrome()`: Monitors recovery
- `calculateBaseline()`: Establishes user's normal metrics

### API Service (api.ts)
- `quickLogMigraine()`: One-tap logging, AI does everything
- `logMigraine()`: Optional detailed log (still mostly passive)
- `getMigraineLogs()`: Fetch history with phase info
- `getAIAnalysis()`: Get detailed analysis for specific migraine
- `updateOutcome()`: Mark migraine resolved (triggers postdrome tracking)

## Key Differences from Before

### ❌ OLD (Medically Inaccurate)
- Simple severity number (1-10)
- Basic symptom list (just checkboxes)
- No phase awareness
- Treated migraine as "bad headache"
- No early warning system
- No recovery tracking

### ✅ NEW (Medically Accurate & Passive)
- 4-phase tracking matching medical literature
- AI detects symptoms from passive data
- Comprehensive phase-specific symptom tracking
- Treats migraine as neurological condition with distinct phases
- Proactive early warnings (6-48 hours advance notice)
- Complete lifecycle tracking (prodrome → resolution)
- Phase-specific recommendations
- User only confirms with one tap

## Benefits

### For Users
- **Truly passive** - no complex forms or manual tracking
- **Early warnings** - up to 48 hours advance notice
- **Actionable** - phase-specific recommendations
- **Educational** - learn your personal prodrome patterns
- **Preventive** - catch migraines before they start

### Medical Accuracy
- Matches pharmaceutical industry documentation (Pfizer)
- Recognizes migraine as multi-phase neurological condition
- Tracks clinically relevant symptoms
- Enables better treatment timing (preventive meds during prodrome)

### AI Capabilities
- Pattern recognition across full migraine lifecycle
- Personalized baselines for each user
- Confidence scoring for detections
- Historical pattern matching
- Trigger identification across all phases

## Next Steps

1. **Update Health Dataset** - Add phase information to 100-entry dataset
2. **Phase-Specific Notifications** - Implement alerts for prodrome/aura detection
3. **Backend Integration** - Update server endpoints to handle new schema
4. **UI Enhancements** - Show phase timeline visualization in history
5. **Testing** - Validate detection accuracy with real user data

## Implementation Status

✅ Backend schema updated with phases and symptoms
✅ TypeScript types created for all phases
✅ API service updated with passive-first approach
✅ Phase detection service created with AI logic
⏳ Dataset update pending
⏳ Notification updates pending
⏳ Backend endpoint updates pending

---

**Key Principle**: User passivity is maintained while achieving medical accuracy. The AI does all the heavy lifting - users just tap one button when they feel a migraine.
