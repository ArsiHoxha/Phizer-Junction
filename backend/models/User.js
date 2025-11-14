const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  firstName: String,
  lastName: String,
  
  // Onboarding Data
  onboardingCompleted: {
    type: Boolean,
    default: false,
  },
  
  // Permissions
  permissions: {
    notifications: { type: Boolean, default: false },
    passiveData: { type: Boolean, default: false },
    calendar: { type: Boolean, default: false },
    location: { type: Boolean, default: false },
  },
  
  // Data Sources
  dataSource: {
    mode: { type: String, enum: ['phone', 'wearable'], default: 'phone' },
    wearableType: { type: String, enum: ['apple', 'fitbit', 'garmin', 'samsung', 'none'] },
  },
  
  // Trigger Personalization
  migraineFrequency: {
    type: String,
    enum: ['rare', 'occasional', 'frequent', 'chronic'],
  },
  triggers: [{
    type: String,
    enum: ['stress', 'screen', 'sleep', 'noise', 'weather', 'hormones', 'food', 'light'],
  }],
  
  // Baseline Metrics (for comparison)
  baselineMetrics: {
    avgHRV: Number,
    avgSleep: Number,
    avgScreenTime: Number,
    avgStressLevel: String,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
