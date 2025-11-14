const mongoose = require('mongoose');

const riskHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  clerkId: {
    type: String,
    required: true,
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  
  // Risk Calculation
  riskIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
  },
  
  // Contributing Factors
  contributingFactors: [{
    name: String,
    impact: Number,  // 0-100 percentage
    icon: String,
  }],
  
  // AI Insights
  aiTip: String,
  aiInsight: String,
  
  // Metrics snapshot at time of calculation
  metricsSnapshot: {
    hrv: Number,
    sleepHours: Number,
    stressLevel: String,
    screenTime: Number,
    calendarLoad: Number,
    weather: {
      temperature: Number,
      pressure: Number,
    },
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient time-based queries
riskHistorySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('RiskHistory', riskHistorySchema);
