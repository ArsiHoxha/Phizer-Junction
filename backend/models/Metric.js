const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  clerkId: {
    type: String,
    required: true,
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  
  // Health Metrics
  hrv: Number,              // Heart Rate Variability (ms)
  heartRate: Number,        // Beats per minute
  sleepHours: Number,       // Hours of sleep
  sleepQuality: Number,     // 0-100 score
  stressLevel: String,      // 'low', 'medium', 'high'
  stressScore: Number,      // 0-100
  
  // Activity Metrics
  screenTime: Number,       // Minutes
  notificationsCount: Number,
  activityLevel: String,    // 'sedentary', 'light', 'moderate', 'active'
  steps: Number,
  
  // Calendar & Work
  calendarLoad: Number,     // Number of events
  workHours: Number,
  
  // Environmental
  location: {
    latitude: Number,
    longitude: Number,
  },
  weather: {
    temperature: Number,
    humidity: Number,
    pressure: Number,
    uvIndex: Number,
  },
  
  // Calculated
  migraineRisk: Number,     // 0-100 percentage
  riskLevel: String,        // 'low', 'medium', 'high'
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient querying
metricSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Metric', metricSchema);
