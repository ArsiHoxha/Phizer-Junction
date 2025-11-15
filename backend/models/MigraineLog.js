const mongoose = require('mongoose');

const migraineLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  clerkId: {
    type: String,
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  severity: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  // Migraine Phase (AI-detected based on passive metrics and timeline)
  phase: {
    type: String,
    enum: ['prodrome', 'aura', 'headache', 'postdrome'],
    default: 'headache', // Default to headache phase when user logs
  },
  // Phase timestamps (AI fills these in based on passive data analysis)
  phaseTimestamps: {
    prodromeStart: Date,    // When AI detected early warning signs (HRV drop, stress rise)
    auraStart: Date,        // When AI detected aura symptoms (20-60 min before)
    headacheStart: Date,    // When user confirmed migraine
    postdromeStart: Date,   // When headache ends, fatigue begins
    resolved: Date,         // When all symptoms clear
  },
  // AI-detected symptoms per phase (passive inference)
  detectedSymptoms: {
    prodrome: [{
      type: String,
      enum: [
        'mood_changes',       // Detected from phone usage patterns
        'neck_stiffness',     // Could be inferred from posture data
        'food_cravings',      // Calendar/activity patterns
        'increased_urination',
        'yawning',
        'concentration_difficulty', // Screen time, app switching patterns
        'fatigue',           // Activity levels, HRV
      ],
    }],
    aura: [{
      type: String,
      enum: [
        'visual_disturbances', // Hard to detect passively, but user might mention
        'sensory_changes',
        'speech_difficulty',
        'motor_weakness',
      ],
    }],
    headache: [{
      type: String,
      enum: [
        'throbbing_pain',
        'nausea',
        'light_sensitivity',   // Could detect from screen brightness drops
        'sound_sensitivity',   // Volume changes, quiet environment seeking
        'worse_with_activity', // Movement data shows user is still
        'dizziness',
        'one_sided_pain',
      ],
    }],
    postdrome: [{
      type: String,
      enum: [
        'exhaustion',
        'confusion',
        'mood_changes',
        'dizziness',
        'weakness',
        'difficulty_concentrating',
      ],
    }],
  },
  notes: {
    type: String,
    default: '',
  },
  // Snapshot of metrics at time of migraine
  metricsSnapshot: {
    hrv: Number,
    heartRate: Number,
    stress: Number,
    sleepQuality: Number,
    sleepHours: Number,
    screenTime: Number,
    weather: {
      temperature: Number,
      humidity: Number,
      pressure: Number,
      condition: String,
    },
    calendarLoad: Number,
  },
  // Active triggers at time of migraine
  activeTriggers: [String],
  // AI Analysis Results (now phase-aware)
  aiAnalysis: {
    confidence: Number, // 0-100
    detectedPhase: String, // Which phase AI thinks user is in
    phaseConfidence: Number, // Confidence in phase detection
    primaryCauses: [{
      factor: String,
      contribution: Number, // percentage
      explanation: String,
    }],
    recommendations: [{
      phase: String, // Which phase this recommendation applies to
      action: String,
      timing: String, // 'immediate', 'preventive', 'recovery'
    }],
    similarPatterns: [{
      date: Date,
      similarity: Number, // 0-100
      phase: String, // What phase the similar pattern was in
    }],
    // Passive detection indicators
    earlyWarningSignals: [{
      metric: String,    // 'hrv', 'stress', 'sleep', etc.
      value: Number,
      deviation: Number, // How much it deviated from baseline
      timestamp: Date,
    }],
    analysisTimestamp: Date,
  },
  // Outcome tracking
  duration: Number, // minutes
  medicationTaken: String,
  resolved: {
    type: Boolean,
    default: false,
  },
  resolvedAt: Date,
});

// Index for efficient queries
migraineLogSchema.index({ clerkId: 1, timestamp: -1 });
migraineLogSchema.index({ userId: 1, timestamp: -1 });

const MigraineLog = mongoose.model('MigraineLog', migraineLogSchema);

module.exports = MigraineLog;
