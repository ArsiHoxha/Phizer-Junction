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
  
  // Personal Information
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
  },
  dateOfBirth: Date,
  age: Number,
  
  // Menstrual Tracking (for female users)
  menstrualTracking: {
    enabled: { type: Boolean, default: false },
    cycleLength: { type: Number, default: 28 }, // Average cycle length in days
    lastPeriodDate: Date,
    trackingStartDate: Date,
  },
  
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
    enum: [
      'stress',
      'screen_time',
      'poor_sleep',
      'loud_noise',
      'weather',
      'hormones',
      'caffeine',
      'alcohol',
      'dehydration',
      'bright_light',
      'strong_smells',
      'physical_activity',
      'skipped_meals',
      'neck_tension'
    ],
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
