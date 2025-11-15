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
  symptoms: [{
    type: String,
    enum: [
      'throbbing_pain',
      'nausea',
      'light_sensitivity',
      'sound_sensitivity',
      'aura',
      'dizziness',
      'fatigue',
      'confusion',
    ],
  }],
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
  // AI Analysis Results
  aiAnalysis: {
    confidence: Number, // 0-100
    primaryCauses: [{
      factor: String,
      contribution: Number, // percentage
      explanation: String,
    }],
    recommendations: [String],
    similarPatterns: [{
      date: Date,
      similarity: Number, // 0-100
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
