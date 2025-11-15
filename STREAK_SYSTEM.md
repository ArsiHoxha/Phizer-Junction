# 🔥 Daily Streak System - User Retention Feature

## Overview
A gamification system that encourages daily app usage by tracking consecutive days and rewarding users with visual feedback and milestone achievements.

---

## 🎯 Features

### 1. **Automatic Daily Tracking**
- Records each day the app is opened
- Stores data in AsyncStorage (local, persistent)
- Updates streak counter automatically
- No user action required - completely passive

### 2. **Visual Streak Counter (Top Right)**
```
┌─────────┐
│   🔥    │  Fire emoji
│   7     │  Current streak days
└─────────┘
Tappable circle with glow effect
```

### 3. **7-Day Activity Timeline**
```
M  T  W  T  F  S  S
✓  ✓  ✓  ⭕ ✓  ○  ○

✓ = Opened (green)
⭕ = Today (orange with border)
○ = Not opened (gray)
```

### 4. **Streak Modal (Detailed Stats)**
When user taps the fire emoji, shows:
- Large fire icon with current streak
- 3 stat cards: Current, Longest, Total days
- Full 7-day calendar view
- Milestones with unlock status
- Benefits explanation
- Motivational messages

---

## 📊 Data Structure

```typescript
interface StreakData {
  currentStreak: number;      // Current consecutive days
  longestStreak: number;      // Best streak ever achieved
  lastOpenDate: string;       // ISO date of last open (YYYY-MM-DD)
  openDates: string[];        // Last 30 days of opens
  totalDays: number;          // Total days app has been opened
}
```

### Example Data
```json
{
  "currentStreak": 7,
  "longestStreak": 14,
  "lastOpenDate": "2025-11-14",
  "openDates": [
    "2025-11-08",
    "2025-11-09",
    "2025-11-10",
    "2025-11-11",
    "2025-11-12",
    "2025-11-13",
    "2025-11-14"
  ],
  "totalDays": 45
}
```

---

## 🎮 Streak Logic

### How Streaks Work

**1. First Open**
```javascript
currentStreak = 1
longestStreak = 1
lastOpenDate = today
```

**2. Next Day Open**
```javascript
if (lastOpenDate === yesterday) {
  currentStreak += 1  // Continue streak
} else if (lastOpenDate === today) {
  // Already recorded today, no change
} else {
  currentStreak = 1  // Streak broken, start over
}
```

**3. Longest Streak Update**
```javascript
if (currentStreak > longestStreak) {
  longestStreak = currentStreak
}
```

### Streak Breaks
- Missing **1 day** = Streak resets to 1
- Longest streak is **never lost** (permanent achievement)
- Total days counter **always increases**

---

## 🏆 Milestones

| Days | Emoji | Title | Description |
|------|-------|-------|-------------|
| **3** | 🌟 | Getting Started | First 3-day streak |
| **7** | ⭐ | One Week Strong | Full week of tracking |
| **14** | 💫 | Two Weeks Champion | Consistent for 2 weeks |
| **30** | 🏆 | Monthly Master | One month of daily use |

**Visual States:**
- **Locked**: Gray, faded (opacity 0.5)
- **Unlocked**: Full color with checkmark ✓

---

## 💬 Motivational Messages

Based on current streak:

| Streak | Message |
|--------|---------|
| 0 | "Open daily to build streak!" |
| 1 | "Day 1! Start your streak!" |
| 2 | "Day 2! Keep going!" |
| 3-6 | "Nice! 3 days in a row!" |
| 7-13 | "Keep it up! 1 week!" |
| 14-29 | "Great! 2 weeks strong!" |
| 30+ | "Amazing! 30+ days!" |

---

## 🎨 UI Components

### 1. Header Streak Counter
**Location:** Top right of dashboard, next to "Migraine Guardian" title

**Design:**
- 64x64 circle
- Orange/amber gradient background (#FFF7ED)
- 2px orange border (#F59E0B)
- Fire emoji (🔥) centered, size 32
- Streak number below, bold, size 12
- Glow effect (shadow)

**Behavior:**
- Only shows if streak > 0
- Tappable - opens detailed modal
- Pulses slightly on first day

### 2. Activity Timeline
**Location:** Below date, above "Daily Activity" card

**Design:**
- Horizontal row of 7 circles
- Each circle: 36x36
- Colors:
  - Opened: Green (#10B981) with checkmark
  - Today: Orange (#F59E0B) with border
  - Not opened: Gray (#E5E7EB)
- Day labels below (M, T, W, etc.)

**Behavior:**
- Updates automatically each day
- Shows last 7 days (rolling)
- Today is always on the right

### 3. Streak Modal
**Location:** Slides up from bottom (75% screen height)

**Sections:**
1. **Header**: Large fire icon + current streak
2. **Stats**: 3 cards (Current, Longest, Total)
3. **Calendar**: 7-day detailed view with dates
4. **Benefits**: Info card explaining why daily tracking helps
5. **Milestones**: List of achievements with unlock status
6. **CTA Button**: "Keep Going! 🔥" (orange)

---

## 🔧 Technical Implementation

### Service: `streakService.ts`

**Key Functions:**

```typescript
// Record app open (call on dashboard mount)
recordAppOpen(): Promise<StreakData>

// Load current data
loadStreakData(): Promise<StreakData>

// Get last 7 days with status
getLast7Days(streakData): Array<DayInfo>

// Get motivational message
getStreakMessage(streak: number): string

// Get fire emoji (can customize per streak length)
getStreakEmoji(streak: number): string
```

### Dashboard Integration

```typescript
// 1. State
const [streakData, setStreakData] = useState<StreakData | null>(null);
const [showStreakModal, setShowStreakModal] = useState(false);

// 2. Load on mount
useEffect(() => {
  loadAndRecordStreak();
}, []);

// 3. Function
const loadAndRecordStreak = async () => {
  const data = await StreakService.recordAppOpen();
  setStreakData(data);
};
```

---

## 📱 User Flow

```
1. User opens app
   ↓
2. Dashboard loads
   ↓
3. recordAppOpen() called automatically
   ↓
4. Check if today already recorded
   ↓
5a. NEW DAY:
   - Add to openDates
   - Update streak (continue or reset)
   - Save to AsyncStorage
   - Update UI

5b. SAME DAY:
   - No changes needed
   - Load existing data
   - Update UI
   ↓
6. Show streak counter (top right)
   ↓
7. Show 7-day timeline
   ↓
8. User can tap fire emoji for details
```

---

## 🎯 Benefits

### For Users
✅ **Motivation**: Visual progress encourages daily usage  
✅ **Gamification**: Unlocking milestones feels rewarding  
✅ **Habit Building**: Daily check-ins improve health tracking  
✅ **Data Quality**: More data = better AI predictions  

### For App
🎯 **Retention**: Users come back daily to maintain streak  
🎯 **Engagement**: Higher daily active users (DAU)  
🎯 **Data Collection**: More frequent health data updates  
🎯 **Viral Potential**: Users share milestone achievements  

---

## 📈 Analytics & Metrics

### Track These KPIs:
- **DAU** (Daily Active Users)
- **Average Streak Length**
- **Streak Break Rate**
- **Milestone Completion Rate**
- **Modal Open Rate** (fire emoji taps)

### Success Metrics:
- 📊 **30% of users** reach 7-day streak
- 📊 **15% of users** reach 14-day streak
- 📊 **5% of users** reach 30-day streak
- 📊 **20% increase** in DAU after feature launch

---

## 🚀 Future Enhancements

### Phase 2 Ideas:
- [ ] **Push notifications**: "Don't break your 7-day streak!"
- [ ] **Social sharing**: Share milestones to social media
- [ ] **Leaderboards**: Compare with friends
- [ ] **Custom rewards**: Unlock app themes/features
- [ ] **Streak recovery**: One "freeze" per month
- [ ] **Weekly challenges**: Special goals for bonus points
- [ ] **Streak insights**: Show correlation with migraine reduction

### Advanced Features:
- [ ] **Multi-streak tracking**: Separate streaks for logging migraines, water intake, etc.
- [ ] **Streak animations**: Confetti on milestones
- [ ] **Streak reminders**: Smart notifications at user's typical open time
- [ ] **Streak insurance**: Watch ad to save broken streak

---

## 🎨 Design Tokens

### Colors
```scss
// Primary Streak Color
$streak-primary: #F59E0B (Amber 500)
$streak-light: #FFF7ED (Amber 50)
$streak-dark: #78350F (Amber 900)

// Status Colors
$opened: #10B981 (Emerald 500)
$not-opened: #E5E7EB (Gray 200)
$today: #F59E0B (Amber 500)

// Milestone Colors
$milestone-1: #FBBF24 (Amber 400) 🌟
$milestone-2: #FCD34D (Amber 300) ⭐
$milestone-3: #A78BFA (Purple 400) 💫
$milestone-4: #F59E0B (Amber 500) 🏆
```

### Spacing
```scss
$circle-size: 36px (timeline)
$counter-size: 64px (header)
$modal-icon: 128px (large fire)
```

---

## 🐛 Edge Cases Handled

1. **Clock changes** (daylight saving): Uses date-only comparison
2. **Timezone travel**: Local date used (not UTC)
3. **Multiple opens same day**: Only counts once
4. **App reinstall**: Streak resets (stored locally)
5. **Streak = 0**: Counter hidden on first install
6. **Date rollover**: Properly handles midnight transitions

---

## 🔍 Testing Checklist

### Manual Tests:
- [ ] Open app, verify streak = 1
- [ ] Close and reopen same day, streak unchanged
- [ ] Change device date to next day, streak = 2
- [ ] Skip a day, streak resets to 1
- [ ] Tap fire emoji, modal opens
- [ ] Check all 4 milestones unlock correctly
- [ ] Verify 7-day timeline shows correct days
- [ ] Test in dark mode and light mode

### Automated Tests:
```typescript
// Unit tests for streakService
test('First open creates streak of 1')
test('Consecutive days increment streak')
test('Skipped day resets streak to 1')
test('Longest streak never decreases')
test('Same day open does not increment')
test('Last 7 days returns correct format')
```

---

## 📝 Storage

**AsyncStorage Key:** `@migraine_guardian_streak`

**Data Size:** ~500 bytes (30 dates + metadata)

**Persistence:** Local only (not synced to cloud)

**Backup:** Could be added to user profile in future

---

## 🎬 Demo Script

**For Hackathon Judges:**

1. "Notice the fire emoji in the top right - that's our daily streak tracker"
2. "I've opened the app for 7 days in a row, see the number?"
3. "Below, you can see my activity for the last week - green checks for days I opened"
4. "Let me tap the fire..." [opens modal]
5. "Here's my current streak, longest ever, and total days using the app"
6. "We have milestones - I've unlocked the 7-day achievement!"
7. "This encourages daily health monitoring, which means better AI predictions"
8. "The more data we collect, the more accurate our migraine prevention becomes"

**Key Talking Points:**
- ✨ Gamification increases user retention
- ✨ Daily engagement = better health data
- ✨ Better data = smarter AI predictions
- ✨ Users feel motivated and rewarded

---

*Built with 🔥 to keep users coming back daily!*
