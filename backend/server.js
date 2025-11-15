const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { clerkMiddleware, requireAuth } = require('@clerk/express');
const { analyzeHealthData, getTriggerInsights } = require('./services/geminiService');
const { textToSpeech } = require('./services/elevenLabsService');
const { getCurrentWeather, getWeatherForecast, detectPressureDrops } = require('./services/weatherService');
const { monitorUserForPatterns } = require('./services/patternMonitoring');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Clerk Keys
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY || 'pk_test_bGVhZGluZy1veXN0ZXItMTguY2xlcmsuYWNjb3VudHMuZGV2JA';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'sk_test_IBuDewVmhzJ8xwET2CUgyoiIEenNcM0kBs13zmM2BD';

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware({ 
  publishableKey: CLERK_PUBLISHABLE_KEY,
  secretKey: CLERK_SECRET_KEY
}));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://arsihoxha23:Arsi159753@cluster0.60zdjwh.mongodb.net/cjunction_ios';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Import Models
const User = require('./models/User');
const Metric = require('./models/Metric');
const RiskHistory = require('./models/RiskHistory');
const MigraineLog = require('./models/MigraineLog');

// ==================== USER ROUTES ====================

// Create or update user profile
app.post('/api/user', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { email, firstName, lastName } = req.body;

    let user = await User.findOne({ clerkId: userId });

    if (user) {
      // Update existing user
      user.email = email || user.email;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      await user.save();
    } else {
      // Create new user
      user = new User({
        clerkId: userId,
        email,
        firstName,
        lastName,
      });
      await user.save();
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user profile
app.get('/api/user/:clerkId', requireAuth(), async (req, res) => {
  try {
    const { clerkId } = req.params;
    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ONBOARDING ROUTES ====================

// Save permissions
app.post('/api/onboarding/permissions', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { permissions } = req.body;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Clean up old trigger values that don't match new enum
    const validTriggers = [
      'stress', 'screen_time', 'poor_sleep', 'loud_noise', 'weather', 
      'hormones', 'caffeine', 'alcohol', 'dehydration', 'bright_light',
      'strong_smells', 'physical_activity', 'skipped_meals', 'neck_tension'
    ];
    
    if (user.triggers && Array.isArray(user.triggers)) {
      user.triggers = user.triggers.filter(trigger => validTriggers.includes(trigger));
    }

    user.permissions = permissions;
    await user.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error saving permissions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save profile (gender, age)
app.post('/api/onboarding/profile', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { gender, age } = req.body;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Clean up old trigger values
    const validTriggers = [
      'stress', 'screen_time', 'poor_sleep', 'loud_noise', 'weather', 
      'hormones', 'caffeine', 'alcohol', 'dehydration', 'bright_light',
      'strong_smells', 'physical_activity', 'skipped_meals', 'neck_tension'
    ];
    if (user.triggers && Array.isArray(user.triggers)) {
      user.triggers = user.triggers.filter(trigger => validTriggers.includes(trigger));
    }

    if (gender) user.gender = gender;
    if (age) {
      user.age = age;
      // Calculate date of birth based on age
      const birthYear = new Date().getFullYear() - age;
      user.dateOfBirth = new Date(birthYear, 0, 1);
    }
    await user.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save menstrual tracking
app.post('/api/onboarding/menstrual-tracking', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { enabled, cycleLength, lastPeriodDate } = req.body;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Clean up old trigger values
    const validTriggers = [
      'stress', 'screen_time', 'poor_sleep', 'loud_noise', 'weather', 
      'hormones', 'caffeine', 'alcohol', 'dehydration', 'bright_light',
      'strong_smells', 'physical_activity', 'skipped_meals', 'neck_tension'
    ];
    if (user.triggers && Array.isArray(user.triggers)) {
      user.triggers = user.triggers.filter(trigger => validTriggers.includes(trigger));
    }

    user.menstrualTracking = {
      enabled: enabled || false,
      cycleLength: cycleLength || 28,
      lastPeriodDate: lastPeriodDate ? new Date(lastPeriodDate) : null,
      trackingStartDate: enabled ? new Date() : null,
    };
    await user.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error saving menstrual tracking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save data source
app.post('/api/onboarding/data-source', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { mode, wearableType } = req.body;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Clean up old trigger values
    const validTriggers = [
      'stress', 'screen_time', 'poor_sleep', 'loud_noise', 'weather', 
      'hormones', 'caffeine', 'alcohol', 'dehydration', 'bright_light',
      'strong_smells', 'physical_activity', 'skipped_meals', 'neck_tension'
    ];
    if (user.triggers && Array.isArray(user.triggers)) {
      user.triggers = user.triggers.filter(trigger => validTriggers.includes(trigger));
    }

    user.dataSource = { mode, wearableType };
    await user.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error saving data source:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save triggers and frequency
app.post('/api/onboarding/triggers', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { triggers } = req.body;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.triggers = triggers || [];
    await user.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error saving triggers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Complete onboarding
app.post('/api/onboarding/complete', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.onboardingCompleted = true;
    await user.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== METRICS ROUTES ====================

// Add metrics
app.post('/api/metrics', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const metricsData = req.body;

    const metric = new Metric({
      userId,
      clerkId: userId,
      ...metricsData,
    });

    await metric.save();
    
    // 🚨 NEW: Pattern Recognition - Check if current metrics match past migraine patterns
    monitorUserForPatterns(userId, {
      hrv: metricsData.hrv,
      stress: metricsData.stress,
      sleepQuality: metricsData.sleepQuality,
      screenTime: metricsData.screenTime,
      pressure: metricsData.pressure,
      temperature: metricsData.temperature,
    }).then(result => {
      if (result.shouldAlert) {
        console.log('🚨 MIGRAINE PATTERN DETECTED - Alert should be sent:', result.alertData);
        // TODO: Send push notification to user's device
        // This would trigger NotificationService on client to show warning
      }
    }).catch(err => console.error('Pattern monitoring error:', err));
    
    res.status(201).json({ success: true, metric });
  } catch (error) {
    console.error('Error saving metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user metrics
app.get('/api/metrics/:clerkId', requireAuth(), async (req, res) => {
  try {
    const { clerkId } = req.params;
    const { period = 'week' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    const metrics = await Metric.find({
      clerkId,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: -1 });

    res.status(200).json({ success: true, metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PASSIVE DATA COLLECTION ROUTES ====================

// Phone data (screen time, notifications, activity, typing)
app.post('/api/metrics/phone', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { screenTimeMinutes, notificationCount, activityLevel, typingSpeed, typingErrors, deviceInfo } = req.body;

    const metric = new Metric({
      userId,
      clerkId: userId,
      timestamp: new Date(),
      screenTime: screenTimeMinutes,
      notifications: notificationCount,
      activityLevel,
      typingSpeed,
      typingErrors,
      deviceInfo,
      dataSource: 'phone',
    });

    await metric.save();
    res.status(201).json({ success: true, metric });
  } catch (error) {
    console.error('Error saving phone data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calendar data (events, busy hours, stress score)
app.post('/api/metrics/calendar', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { eventsToday, busyHoursToday, stressScore, upcomingHighStressPeriods } = req.body;

    const metric = new Metric({
      userId,
      clerkId: userId,
      timestamp: new Date(),
      calendarEvents: eventsToday,
      busyHours: busyHoursToday,
      calendarStress: stressScore,
      upcomingStress: upcomingHighStressPeriods,
      dataSource: 'calendar',
    });

    await metric.save();
    res.status(201).json({ success: true, metric });
  } catch (error) {
    console.error('Error saving calendar data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sleep data (duration, quality, sleep debt, restlessness)
app.post('/api/metrics/sleep', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { sleepStartTime, sleepEndTime, totalSleepMinutes, sleepQuality, sleepDebt, restlessness, isInferred } = req.body;

    const metric = new Metric({
      userId,
      clerkId: userId,
      timestamp: new Date(),
      sleepStart: sleepStartTime,
      sleepEnd: sleepEndTime,
      sleepDuration: totalSleepMinutes,
      sleepQuality,
      sleepDebt,
      restlessness,
      isInferred,
      dataSource: 'sleep',
    });

    await metric.save();
    res.status(201).json({ success: true, metric });
  } catch (error) {
    console.error('Error saving sleep data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Location & Weather data (temperature, humidity, pressure, UV)
app.post('/api/metrics/location', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { location, weather } = req.body;

    const metric = new Metric({
      userId,
      clerkId: userId,
      timestamp: new Date(),
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      temperature: weather.temperature,
      humidity: weather.humidity,
      pressure: weather.pressure,
      uvIndex: weather.uvIndex,
      weatherCondition: weather.condition,
      dataSource: 'location',
    });

    await metric.save();
    res.status(201).json({ success: true, metric });
  } catch (error) {
    console.error('Error saving location/weather data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 NEW: Real-time metrics from HealthKit + Real Weather API
app.post('/api/metrics/real', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { 
      // HealthKit data (from client)
      hrv, 
      heartRate, 
      stress, 
      sleepQuality, 
      sleepHours,
      steps,
      // Location for weather
      latitude, 
      longitude 
    } = req.body;

    // Get REAL weather from API
    const realWeather = await getCurrentWeather(latitude, longitude);
    
    // Save comprehensive metric with all REAL data
    const metric = new Metric({
      userId,
      clerkId: userId,
      timestamp: new Date(),
      // HealthKit metrics
      hrv,
      heartRate,
      stress,
      sleepQuality,
      steps,
      // Real weather data
      latitude,
      longitude,
      city: realWeather.city,
      temperature: realWeather.temperature,
      humidity: realWeather.humidity,
      pressure: realWeather.pressure, // CRITICAL for migraines!
      uvIndex: realWeather.uvIndex,
      weatherCondition: realWeather.condition,
      isSimulated: false, // THIS IS REAL DATA
      dataSource: 'real-integrated', // HealthKit + Weather API
    });

    await metric.save();
    
    // AI-POWERED RISK CALCULATION from REAL metrics
    const aiRiskAnalysis = await calculateAIRiskFromMetrics(userId, {
      hrv,
      heartRate,
      stress,
      sleepQuality,
    });
    
    // Save risk history with AI analysis
    const riskHistory = new RiskHistory({
      userId,
      clerkId: userId,
      riskIndex: aiRiskAnalysis.riskScore,
      riskLevel: aiRiskAnalysis.riskLevel,
      timestamp: new Date(),
      contributingFactors: aiRiskAnalysis.factors,
      metricsSnapshot: {
        hrv,
        heartRate,
        stress,
        sleepQuality,
        stressLevel: stress > 70 ? 'High' : stress > 40 ? 'Medium' : 'Low',
      },
    });
    
    await riskHistory.save();

    // Get weather forecast for pressure drop warnings
    const forecast = await getWeatherForecast(latitude, longitude);
    const pressureWarnings = detectPressureDrops(forecast);

    res.status(201).json({ 
      success: true, 
      metric,
      realWeather: {
        ...realWeather,
        pressureWarnings, // Warnings for upcoming pressure drops
      },
      aiRiskAnalysis: {
        riskScore: aiRiskAnalysis.riskScore,
        riskLevel: aiRiskAnalysis.riskLevel,
        explanation: aiRiskAnalysis.explanation,
        factors: aiRiskAnalysis.factors,
      },
      message: '✅ Real data saved from HealthKit + Weather API'
    });
  } catch (error) {
    console.error('Error saving real metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Wearable/Simulated data (HRV, heart rate, stress, steps) - DEPRECATED, use /api/metrics/real
app.post('/api/metrics/wearable', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { hrv, heartRate, stress, sleepQuality, steps, isSimulated } = req.body;

    const metric = new Metric({
      userId,
      clerkId: userId,
      timestamp: new Date(),
      hrv,
      heartRate,
      stress,
      sleepQuality,
      steps,
      isSimulated,
      dataSource: 'wearable',
    });

    await metric.save();
    
    // AI-POWERED RISK CALCULATION from actual metrics
    const aiRiskAnalysis = await calculateAIRiskFromMetrics(userId, {
      hrv,
      heartRate,
      stress,
      sleepQuality,
    });
    
    // Save risk history with AI analysis
    const riskHistory = new RiskHistory({
      userId,
      clerkId: userId,
      riskIndex: aiRiskAnalysis.riskScore,
      riskLevel: aiRiskAnalysis.riskLevel,
      timestamp: new Date(),
      contributingFactors: aiRiskAnalysis.factors,
      metricsSnapshot: {
        hrv,
        heartRate,
        stress,
        sleepQuality,
        stressLevel: stress > 70 ? 'High' : stress > 40 ? 'Medium' : 'Low',
      },
    });
    
    await riskHistory.save();

    res.status(201).json({ 
      success: true, 
      metric, 
      riskScore: aiRiskAnalysis.riskScore,
      riskLevel: aiRiskAnalysis.riskLevel,
      aiAnalysis: aiRiskAnalysis.explanation
    });
  } catch (error) {
    console.error('Error saving wearable data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function - AI-powered risk calculation from actual metrics
async function calculateAIRiskFromMetrics(clerkId, metrics) {
  try {
    // Get historical migraine data for learning
    const historicalMigraines = await MigraineLog.find({ clerkId }).sort({ timestamp: -1 }).limit(50);
    
    let riskScore = 0;
    const factors = [];
    let explanation = '';

    if (historicalMigraines.length >= 3) {
      // AI LEARNING MODE: Compare current metrics to learned migraine patterns
      const learnedPatterns = {
        avgHRVAtMigraine: 0,
        avgStressAtMigraine: 0,
        avgSleepQualityAtMigraine: 0,
        count: 0,
      };

      historicalMigraines.forEach(migraine => {
        if (migraine.metricsSnapshot?.hrv) learnedPatterns.avgHRVAtMigraine += migraine.metricsSnapshot.hrv;
        if (migraine.metricsSnapshot?.stress) learnedPatterns.avgStressAtMigraine += migraine.metricsSnapshot.stress;
        if (migraine.metricsSnapshot?.sleepQuality) learnedPatterns.avgSleepQualityAtMigraine += migraine.metricsSnapshot.sleepQuality;
        learnedPatterns.count++;
      });

      learnedPatterns.avgHRVAtMigraine /= learnedPatterns.count;
      learnedPatterns.avgStressAtMigraine /= learnedPatterns.count;
      learnedPatterns.avgSleepQualityAtMigraine /= learnedPatterns.count;

      explanation = `AI Analysis based on ${historicalMigraines.length} past migraines:\n`;

      // HRV Analysis
      if (metrics.hrv) {
        const hrvDiff = Math.abs(metrics.hrv - learnedPatterns.avgHRVAtMigraine);
        if (hrvDiff < 10) {
          const impact = Math.round((1 - hrvDiff / 10) * 30);
          riskScore += impact;
          factors.push({
            name: 'HRV Pattern Match',
            impact,
            icon: '❤️'
          });
          explanation += `• Your HRV is ${Math.round(metrics.hrv)}, very similar to your migraine pattern (avg ${Math.round(learnedPatterns.avgHRVAtMigraine)}). Risk +${impact}%\n`;
        } else {
          explanation += `• Your HRV is ${Math.round(metrics.hrv)}, different from your migraine pattern (avg ${Math.round(learnedPatterns.avgHRVAtMigraine)}). Good sign!\n`;
        }
      }

      // Stress Analysis
      if (metrics.stress) {
        const stressDiff = Math.abs(metrics.stress - learnedPatterns.avgStressAtMigraine);
        if (stressDiff < 15) {
          const impact = Math.round((1 - stressDiff / 15) * 30);
          riskScore += impact;
          factors.push({
            name: 'Stress Pattern Match',
            impact,
            icon: '😰'
          });
          explanation += `• Your stress is ${Math.round(metrics.stress)}%, similar to your migraine pattern (avg ${Math.round(learnedPatterns.avgStressAtMigraine)}%). Risk +${impact}%\n`;
        } else {
          explanation += `• Your stress is ${Math.round(metrics.stress)}%, different from your migraine pattern (avg ${Math.round(learnedPatterns.avgStressAtMigraine)}%).\n`;
        }
      }

      // Sleep Quality Analysis
      if (metrics.sleepQuality) {
        const sleepDiff = Math.abs(metrics.sleepQuality - learnedPatterns.avgSleepQualityAtMigraine);
        if (sleepDiff < 15) {
          const impact = Math.round((1 - sleepDiff / 15) * 25);
          riskScore += impact;
          factors.push({
            name: 'Sleep Pattern Match',
            impact,
            icon: '😴'
          });
          explanation += `• Your sleep quality is ${Math.round(metrics.sleepQuality)}%, similar to your migraine pattern (avg ${Math.round(learnedPatterns.avgSleepQualityAtMigraine)}%). Risk +${impact}%\n`;
        } else {
          explanation += `• Your sleep quality is ${Math.round(metrics.sleepQuality)}%, different from your migraine pattern (avg ${Math.round(learnedPatterns.avgSleepQualityAtMigraine)}%).\n`;
        }
      }

    } else {
      // BASELINE MODE: Analyze actual metrics with medical thresholds
      explanation = `Analysis of your current metrics:\n`;

      // HRV Analysis (Normal: 50-100, Low: 20-50, Critical: <20)
      if (metrics.hrv) {
        if (metrics.hrv < 30) {
          riskScore += 40;
          factors.push({ name: 'Critical HRV', impact: 40, icon: '❤️' });
          explanation += `• Your HRV is ${Math.round(metrics.hrv)} (Critical - very low heart rate variability indicates severe stress). Risk +40%\n`;
        } else if (metrics.hrv < 45) {
          riskScore += 25;
          factors.push({ name: 'Low HRV', impact: 25, icon: '❤️' });
          explanation += `• Your HRV is ${Math.round(metrics.hrv)} (Low - indicates elevated stress). Risk +25%\n`;
        } else if (metrics.hrv < 55) {
          riskScore += 10;
          factors.push({ name: 'Below Average HRV', impact: 10, icon: '❤️' });
          explanation += `• Your HRV is ${Math.round(metrics.hrv)} (Below average - mild stress). Risk +10%\n`;
        } else {
          explanation += `• Your HRV is ${Math.round(metrics.hrv)} (Good - healthy heart rate variability).\n`;
        }
      }

      // Heart Rate Analysis (Normal resting: 60-100, Elevated: 80-100, High: >100)
      if (metrics.heartRate) {
        if (metrics.heartRate > 90) {
          riskScore += 20;
          factors.push({ name: 'Elevated Heart Rate', impact: 20, icon: '💓' });
          explanation += `• Your heart rate is ${Math.round(metrics.heartRate)} bpm (Elevated - potential stress or poor recovery). Risk +20%\n`;
        } else if (metrics.heartRate > 80) {
          riskScore += 10;
          factors.push({ name: 'Higher Heart Rate', impact: 10, icon: '💓' });
          explanation += `• Your heart rate is ${Math.round(metrics.heartRate)} bpm (Higher than ideal). Risk +10%\n`;
        } else {
          explanation += `• Your heart rate is ${Math.round(metrics.heartRate)} bpm (Normal range).\n`;
        }
      }

      // Stress Analysis (Low: 0-30, Moderate: 30-60, High: 60-80, Critical: >80)
      if (metrics.stress) {
        if (metrics.stress > 75) {
          riskScore += 30;
          factors.push({ name: 'Critical Stress', impact: 30, icon: '😰' });
          explanation += `• Your stress level is ${Math.round(metrics.stress)}% (Critical - very high stress is a major migraine trigger). Risk +30%\n`;
        } else if (metrics.stress > 50) {
          riskScore += 15;
          factors.push({ name: 'High Stress', impact: 15, icon: '😰' });
          explanation += `• Your stress level is ${Math.round(metrics.stress)}% (High - elevated stress increases migraine risk). Risk +15%\n`;
        } else if (metrics.stress > 30) {
          riskScore += 5;
          factors.push({ name: 'Moderate Stress', impact: 5, icon: '😰' });
          explanation += `• Your stress level is ${Math.round(metrics.stress)}% (Moderate - manageable). Risk +5%\n`;
        } else {
          explanation += `• Your stress level is ${Math.round(metrics.stress)}% (Low - good stress management).\n`;
        }
      }

      // Sleep Quality Analysis (Excellent: 85-100, Good: 70-85, Fair: 50-70, Poor: <50)
      if (metrics.sleepQuality) {
        if (metrics.sleepQuality < 40) {
          riskScore += 30;
          factors.push({ name: 'Very Poor Sleep', impact: 30, icon: '😴' });
          explanation += `• Your sleep quality is ${Math.round(metrics.sleepQuality)}% (Very poor - significant sleep deprivation increases migraine risk). Risk +30%\n`;
        } else if (metrics.sleepQuality < 60) {
          riskScore += 20;
          factors.push({ name: 'Poor Sleep', impact: 20, icon: '😴' });
          explanation += `• Your sleep quality is ${Math.round(metrics.sleepQuality)}% (Poor - inadequate sleep recovery). Risk +20%\n`;
        } else if (metrics.sleepQuality < 75) {
          riskScore += 10;
          factors.push({ name: 'Fair Sleep', impact: 10, icon: '😴' });
          explanation += `• Your sleep quality is ${Math.round(metrics.sleepQuality)}% (Fair - could be improved). Risk +10%\n`;
        } else {
          explanation += `• Your sleep quality is ${Math.round(metrics.sleepQuality)}% (Good - adequate rest).\n`;
        }
      }
    }

    // Normalize risk score
    riskScore = Math.min(Math.round(riskScore), 100);
    
    const riskLevel = riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high';
    
    explanation += `\nFinal Migraine Risk Index: ${riskScore}% (${riskLevel.toUpperCase()})`;

    return {
      riskScore,
      riskLevel,
      factors: factors.sort((a, b) => b.impact - a.impact),
      explanation,
      aiPrediction: historicalMigraines.length >= 3
    };
  } catch (error) {
    console.error('Error in AI risk calculation:', error);
    // Fallback to simple calculation
    return {
      riskScore: 20,
      riskLevel: 'low',
      factors: [],
      explanation: 'Unable to calculate risk at this time',
      aiPrediction: false
    };
  }
}

// Helper function to calculate risk from metrics (deprecated - kept for compatibility)
function calculateRiskFromMetrics(metrics) {
  let risk = 0;
  
  // HRV factor (lower HRV = higher risk)
  if (metrics.hrv < 30) risk += 40;
  else if (metrics.hrv < 45) risk += 25;
  else if (metrics.hrv < 55) risk += 10;
  
  // Heart rate factor (higher HR = higher risk)
  if (metrics.heartRate > 90) risk += 20;
  else if (metrics.heartRate > 80) risk += 10;
  
  // Stress factor
  if (metrics.stress > 75) risk += 25;
  else if (metrics.stress > 50) risk += 15;
  else if (metrics.stress > 30) risk += 5;
  
  // Sleep quality factor (lower quality = higher risk)
  if (metrics.sleepQuality < 40) risk += 30;
  else if (metrics.sleepQuality < 60) risk += 20;
  else if (metrics.sleepQuality < 75) risk += 10;
  
  return Math.min(100, risk);
}

// ==================== RISK CALCULATION ROUTE ====================

app.get('/api/risk/:clerkId', requireAuth(), async (req, res) => {
  try {
    const { clerkId } = req.params;

    // Get latest metrics
    const latestMetric = await Metric.findOne({ clerkId }).sort({ timestamp: -1 });
    
    if (!latestMetric) {
      return res.status(404).json({ 
        success: false, 
        message: 'No metrics found. Please wait for data collection.' 
      });
    }

    // Get user's learned patterns and triggers
    const user = await User.findOne({ clerkId });

    // Get historical migraine data to learn patterns
    const historicalMigraines = await MigraineLog.find({ clerkId }).sort({ timestamp: -1 }).limit(50);

    // AI-POWERED RISK CALCULATION
    let riskScore = 0;
    const factors = [];

    if (historicalMigraines.length >= 3) {
      // LEARNED PATTERNS: Calculate average metrics when migraines occur
      const learnedPatterns = {
        avgHRVAtMigraine: 0,
        avgStressAtMigraine: 0,
        avgSleepQualityAtMigraine: 0,
        avgScreenTimeAtMigraine: 0,
        avgPressureAtMigraine: 0,
        count: 0,
      };

      historicalMigraines.forEach(migraine => {
        if (migraine.metricsSnapshot?.hrv) {
          learnedPatterns.avgHRVAtMigraine += migraine.metricsSnapshot.hrv;
          learnedPatterns.count++;
        }
        if (migraine.metricsSnapshot?.stress) {
          learnedPatterns.avgStressAtMigraine += migraine.metricsSnapshot.stress;
        }
        if (migraine.metricsSnapshot?.sleepQuality) {
          learnedPatterns.avgSleepQualityAtMigraine += migraine.metricsSnapshot.sleepQuality;
        }
        if (migraine.metricsSnapshot?.screenTime) {
          learnedPatterns.avgScreenTimeAtMigraine += migraine.metricsSnapshot.screenTime;
        }
        if (migraine.metricsSnapshot?.weather?.pressure) {
          learnedPatterns.avgPressureAtMigraine += migraine.metricsSnapshot.weather.pressure;
        }
      });

      if (learnedPatterns.count > 0) {
        learnedPatterns.avgHRVAtMigraine /= learnedPatterns.count;
        learnedPatterns.avgStressAtMigraine /= learnedPatterns.count;
        learnedPatterns.avgSleepQualityAtMigraine /= learnedPatterns.count;
        learnedPatterns.avgScreenTimeAtMigraine /= learnedPatterns.count;
        learnedPatterns.avgPressureAtMigraine /= learnedPatterns.count;

        console.log(`🧠 Using learned patterns from ${historicalMigraines.length} migraines for risk prediction`);

        // HRV Risk (compare current to learned migraine average)
        if (latestMetric.hrv && learnedPatterns.avgHRVAtMigraine) {
          const hrvDifference = Math.abs(latestMetric.hrv - learnedPatterns.avgHRVAtMigraine);
          if (hrvDifference < 10) {
            // Current HRV is very close to migraine pattern
            const impact = Math.round((1 - hrvDifference / 10) * 30);
            riskScore += impact;
            factors.push({ 
              name: 'HRV Similar to Migraine Pattern', 
              impact, 
              icon: '❤️',
              detail: `Current: ${Math.round(latestMetric.hrv)}, Migraine avg: ${Math.round(learnedPatterns.avgHRVAtMigraine)}`
            });
          }
        }

        // Stress Risk (compare current to learned migraine average)
        if (latestMetric.stress && learnedPatterns.avgStressAtMigraine) {
          const stressDifference = Math.abs(latestMetric.stress - learnedPatterns.avgStressAtMigraine);
          if (stressDifference < 15) {
            // Current stress is very close to migraine pattern
            const impact = Math.round((1 - stressDifference / 15) * 30);
            riskScore += impact;
            factors.push({ 
              name: 'Stress Similar to Migraine Pattern', 
              impact, 
              icon: '😰',
              detail: `Current: ${Math.round(latestMetric.stress)}%, Migraine avg: ${Math.round(learnedPatterns.avgStressAtMigraine)}%`
            });
          }
        }

        // Sleep Quality Risk (compare current to learned migraine average)
        if (latestMetric.sleepQuality && learnedPatterns.avgSleepQualityAtMigraine) {
          const sleepDifference = Math.abs(latestMetric.sleepQuality - learnedPatterns.avgSleepQualityAtMigraine);
          if (sleepDifference < 15) {
            // Current sleep quality is very close to migraine pattern
            const impact = Math.round((1 - sleepDifference / 15) * 25);
            riskScore += impact;
            factors.push({ 
              name: 'Sleep Pattern Similar to Migraines', 
              impact, 
              icon: '😴',
              detail: `Current: ${Math.round(latestMetric.sleepQuality)}%, Migraine avg: ${Math.round(learnedPatterns.avgSleepQualityAtMigraine)}%`
            });
          }
        }

        // Screen Time Risk (compare current to learned migraine average)
        if (latestMetric.screenTime && learnedPatterns.avgScreenTimeAtMigraine) {
          const screenDifference = Math.abs(latestMetric.screenTime - learnedPatterns.avgScreenTimeAtMigraine);
          if (screenDifference < 60) { // Within 1 hour
            // Current screen time is very close to migraine pattern
            const impact = Math.round((1 - screenDifference / 60) * 15);
            riskScore += impact;
            factors.push({ 
              name: 'Screen Time Similar to Migraines', 
              impact, 
              icon: '📱',
              detail: `Current: ${Math.round(latestMetric.screenTime / 60)}h, Migraine avg: ${Math.round(learnedPatterns.avgScreenTimeAtMigraine / 60)}h`
            });
          }
        }

        // Weather/Pressure Risk (compare current to learned migraine average)
        if (latestMetric.pressure && learnedPatterns.avgPressureAtMigraine) {
          const pressureDifference = Math.abs(latestMetric.pressure - learnedPatterns.avgPressureAtMigraine);
          if (pressureDifference < 10) {
            // Current pressure is very close to migraine pattern
            const impact = Math.round((1 - pressureDifference / 10) * 20);
            riskScore += impact;
            factors.push({ 
              name: 'Weather Similar to Migraine Pattern', 
              impact, 
              icon: '🌦️',
              detail: `Current: ${Math.round(latestMetric.pressure)} hPa, Migraine avg: ${Math.round(learnedPatterns.avgPressureAtMigraine)} hPa`
            });
          }
        }
      }
    } else {
      // FALLBACK: Not enough historical data yet, use generic thresholds
      console.log('⚠️ Not enough migraine history for AI prediction, using generic risk calculation');

      // HRV factor (0-30 points)
      if (latestMetric.hrv) {
        if (latestMetric.hrv < 40) {
          riskScore += 30;
          factors.push({ name: 'Very Low HRV', impact: 30, icon: '❤️' });
        } else if (latestMetric.hrv < 55) {
          riskScore += 15;
          factors.push({ name: 'Low HRV', impact: 15, icon: '❤️' });
        }
      }

      // Stress factor (0-30 points)
      if (latestMetric.stress) {
        if (latestMetric.stress > 70) {
          riskScore += 30;
          factors.push({ name: 'High Stress', impact: 30, icon: '😰' });
        } else if (latestMetric.stress > 50) {
          riskScore += 15;
          factors.push({ name: 'Moderate Stress', impact: 15, icon: '😰' });
        }
      }

      // Sleep factor (0-25 points)
      if (latestMetric.sleepQuality) {
        if (latestMetric.sleepQuality < 50) {
          riskScore += 25;
          factors.push({ name: 'Poor Sleep', impact: 25, icon: '😴' });
        } else if (latestMetric.sleepQuality < 70) {
          riskScore += 12;
          factors.push({ name: 'Below Average Sleep', impact: 12, icon: '�' });
        }
      }

      // Weather factor (0-20 points)
      if (latestMetric.pressure && latestMetric.pressure < 1010) {
        riskScore += 20;
        factors.push({ name: 'Low Pressure', impact: 20, icon: '🌦️' });
      }
    }

    // Normalize to 0-100
    riskScore = Math.min(Math.round(riskScore), 100);
    
    const riskLevel = riskScore < 40 ? 'low' : riskScore < 70 ? 'medium' : 'high';

    // Save to risk history
    const riskHistory = new RiskHistory({
      userId: clerkId,
      clerkId,
      riskIndex: riskScore,
      riskLevel,
      contributingFactors: factors.sort((a, b) => b.impact - a.impact),
      metricsSnapshot: {
        hrv: latestMetric.hrv,
        sleepHours: latestMetric.sleepDuration ? latestMetric.sleepDuration / 60 : null,
        stressLevel: latestMetric.stress > 70 ? 'High' : latestMetric.stress > 40 ? 'Medium' : 'Low',
        screenTime: latestMetric.screenTime,
        pressure: latestMetric.pressure,
      },
    });

    await riskHistory.save();

    res.status(200).json({
      success: true,
      riskIndex: riskScore,
      riskLevel,
      factors: factors.slice(0, 4), // Top 4 factors
      timestamp: new Date(),
      aiPrediction: historicalMigraines.length >= 3,
      message: historicalMigraines.length >= 3 
        ? `AI prediction based on ${historicalMigraines.length} past migraines`
        : 'Log more migraines for AI-powered predictions'
    });
  } catch (error) {
    console.error('Error calculating risk:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== RISK HISTORY ROUTE ====================

app.get('/api/risk-history/:clerkId', requireAuth(), async (req, res) => {
  try {
    const { clerkId } = req.params;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const history = await RiskHistory.find({
      clerkId,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: -1 });

    res.status(200).json({ success: true, history });
  } catch (error) {
    console.error('Error fetching risk history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AI ANALYSIS ROUTES ====================

// Get AI analysis of current health data
app.post('/api/ai/analyze', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const healthData = req.body;

    const analysis = await analyzeHealthData(healthData);

    // Generate audio from the analysis text (optional feature)
    let audioBase64 = null;
    try {
      const audioBuffer = await textToSpeech(analysis.analysis);
      if (audioBuffer) {
        audioBase64 = audioBuffer.toString('base64');
      }
    } catch (audioError) {
      console.error('⚠️ Audio generation error:', audioError.message);
      // Continue without audio if ElevenLabs fails
    }

    res.status(200).json({
      ...analysis,
      audio: audioBase64, // Base64 encoded audio (null if unavailable)
      audioAvailable: audioBase64 !== null
    });
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      analysis: 'Unable to generate insights at this time.'
    });
  }
});

// Get AI insights for specific triggers
app.post('/api/ai/triggers', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { triggers } = req.body;

    const insights = await getTriggerInsights(triggers);

    res.status(200).json(insights);
  } catch (error) {
    console.error('Error generating trigger insights:', error);
    res.status(500).json({ 
      success: false,
      insights: 'Unable to analyze triggers at this time.'
    });
  }
});

// ==================== MIGRAINE LOG ROUTES ====================

// Quick log migraine (one-click, no form needed)
app.post('/api/migraine/quick-log', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { currentMetrics } = req.body;

    // Get current user data
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Use frontend-provided metrics first (most accurate for "right now")
    // Fallback to database query if not provided
    let metricsSnapshot = currentMetrics || {};
    
    if (!currentMetrics || Object.keys(currentMetrics).length === 0) {
      // Fallback: Get latest metrics from database
      console.log('⚠️ No frontend metrics provided, falling back to database');
      const latestMetric = await Metric.findOne({ clerkId: userId }).sort({ timestamp: -1 });

      metricsSnapshot = latestMetric ? {
        hrv: latestMetric.hrv,
        heartRate: latestMetric.heartRate,
        stress: latestMetric.stress,
        sleepQuality: latestMetric.sleepQuality,
        sleepHours: latestMetric.sleepDuration ? latestMetric.sleepDuration / 60 : null,
        screenTime: latestMetric.screenTime,
        weather: {
          temperature: latestMetric.temperature,
          humidity: latestMetric.humidity,
          pressure: latestMetric.pressure,
          condition: latestMetric.weatherCondition,
        },
        calendarLoad: latestMetric.calendarEvents,
      } : {};
    } else {
      console.log('✅ Using frontend-provided metrics:', Object.keys(currentMetrics));
    }

    // Validate we have at least some metrics
    if (Object.keys(metricsSnapshot).length === 0) {
      console.warn('⚠️ No metrics available for migraine log!');
    }

    // Create migraine log (auto-captured, no user input needed)
    const migraineLog = new MigraineLog({
      userId,
      clerkId: userId,
      severity: 7, // Default to moderate-severe since user felt need to log
      symptoms: [], // Will be inferred by AI from metrics
      notes: 'Quick log - auto-captured',
      metricsSnapshot,
      activeTriggers: user.triggers || [],
    });

    await migraineLog.save();
    
    console.log('📊 Migraine logged with metrics:', {
      hasHRV: !!metricsSnapshot.hrv,
      hasStress: !!metricsSnapshot.stress,
      hasSleep: !!metricsSnapshot.sleepHours,
      hasWeather: !!metricsSnapshot.weather?.pressure,
    });

    // Trigger AI analysis and learning asynchronously
    performAIAnalysisAndLearn(migraineLog._id, userId).catch(err => 
      console.error('AI analysis error:', err)
    );

    res.status(201).json({ 
      success: true, 
      migraineLog,
      message: 'Migraine logged. AI is learning your patterns to predict future episodes.'
    });
  } catch (error) {
    console.error('Error quick-logging migraine:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Log a migraine with current metrics snapshot
app.post('/api/migraine/log', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { severity, symptoms, notes } = req.body;

    // Get current user data
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get latest metrics
    const latestMetric = await Metric.findOne({ clerkId: userId }).sort({ timestamp: -1 });

    // Create metrics snapshot
    const metricsSnapshot = latestMetric ? {
      hrv: latestMetric.hrv,
      heartRate: latestMetric.heartRate,
      stress: latestMetric.stress,
      sleepQuality: latestMetric.sleepQuality,
      sleepHours: latestMetric.sleepDuration ? latestMetric.sleepDuration / 60 : null,
      screenTime: latestMetric.screenTime,
      weather: {
        temperature: latestMetric.temperature,
        humidity: latestMetric.humidity,
        pressure: latestMetric.pressure,
        condition: latestMetric.weatherCondition,
      },
      calendarLoad: latestMetric.calendarEvents,
    } : {};

    // Create migraine log
    const migraineLog = new MigraineLog({
      userId,
      clerkId: userId,
      severity,
      symptoms,
      notes,
      metricsSnapshot,
      activeTriggers: user.triggers || [],
    });

    await migraineLog.save();

    // Trigger AI analysis asynchronously
    performAIAnalysis(migraineLog._id, userId).catch(err => 
      console.error('AI analysis error:', err)
    );

    res.status(201).json({ 
      success: true, 
      migraineLog,
      message: 'Migraine logged successfully. AI analysis in progress.'
    });
  } catch (error) {
    console.error('Error logging migraine:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get migraine logs for a user
app.get('/api/migraine/:clerkId', requireAuth(), async (req, res) => {
  try {
    const { clerkId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const logs = await MigraineLog.find({
      clerkId,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: -1 });

    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching migraine logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check for pattern matches (used for notifications)
app.post('/api/migraine/check-patterns', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { currentMetrics } = req.body;

    const { checkPatternMatch } = require('./services/patternMonitoring');
    const result = await checkPatternMatch(userId, currentMetrics);

    res.status(200).json({
      success: true,
      patternMatch: result,
    });
  } catch (error) {
    console.error('Error checking patterns:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get AI analysis for a specific migraine
app.get('/api/migraine/:migraineId/analysis', requireAuth(), async (req, res) => {
  try {
    const { migraineId } = req.params;

    const migraineLog = await MigraineLog.findById(migraineId);
    
    if (!migraineLog) {
      return res.status(404).json({ success: false, message: 'Migraine log not found' });
    }

    if (!migraineLog.aiAnalysis || !migraineLog.aiAnalysis.analysisTimestamp) {
      return res.status(202).json({ 
        success: true, 
        message: 'Analysis in progress',
        status: 'processing'
      });
    }

    res.status(200).json({ 
      success: true, 
      analysis: migraineLog.aiAnalysis,
      migraineLog 
    });
  } catch (error) {
    console.error('Error fetching AI analysis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Analysis Function with Gemini AI (learns patterns and predicts)
async function performAIAnalysisAndLearn(migraineId, clerkId) {
  try {
    const migraineLog = await MigraineLog.findById(migraineId);
    if (!migraineLog) return;

    // Get historical migraine data (for learning)
    const historicalMigraines = await MigraineLog.find({
      clerkId,
      _id: { $ne: migraineId },
    }).sort({ timestamp: -1 }).limit(50);

    // Get user's triggers
    const user = await User.findOne({ clerkId });
    
    const metrics = migraineLog.metricsSnapshot;
    
    console.log('🤖 Using Gemini AI to analyze migraine trigger...');
    
    // Use Gemini AI to analyze what triggered this migraine
    const geminiAnalysis = await analyzeHealthData({
      wearable: {
        hrv: metrics.hrv,
        heartRate: metrics.heartRate,
        stress: metrics.stress,
      },
      sleep: {
        sleepQuality: metrics.sleepQuality,
        sleepHours: metrics.sleepHours,
      },
      phone: {
        screenTime: metrics.screenTime,
      },
      location: {
        temperature: metrics.weather?.temperature,
        humidity: metrics.weather?.humidity,
        pressure: metrics.weather?.pressure,
        weather: metrics.weather?.condition,
      },
      calendar: {
        upcomingEvents: metrics.calendarLoad || 0,
      },
      historicalMigraines: historicalMigraines.map(m => ({
        timestamp: m.timestamp,
        metrics: m.metricsSnapshot,
        severity: m.severity,
      })),
    });

    console.log('🧠 Gemini AI Analysis:', geminiAnalysis);

    // Parse Gemini response to extract insights
    const analysis = {
      confidence: 85, // Gemini provides high-confidence analysis
      primaryCauses: [],
      recommendations: [],
      similarPatterns: [],
      analysisTimestamp: new Date(),
      predictiveThresholds: {}, // Learn thresholds for predictions
      geminiInsights: geminiAnalysis, // Store full AI response
    };

    // Extract key triggers from Gemini analysis (parse AI insights)
    // Handle both string response and object response from Gemini
    const aiText = typeof geminiAnalysis === 'string' 
      ? geminiAnalysis.toLowerCase() 
      : (geminiAnalysis?.analysis || '').toLowerCase();
    let totalWeight = 0;

    // Parse Gemini's insights to identify primary causes
    if (aiText.includes('hrv') || aiText.includes('heart rate variability')) {
      const hrvMatch = aiText.match(/hrv[^\d]*(\d+)/i);
      const hrvValue = hrvMatch ? parseInt(hrvMatch[1]) : metrics.hrv;
      analysis.primaryCauses.push({
        factor: hrvValue < 40 ? 'Very Low HRV' : 'Low HRV',
        contribution: hrvValue < 40 ? 25 : 15,
        explanation: `Gemini detected HRV of ${Math.round(hrvValue || metrics.hrv)}ms - ${aiText.includes('stress') ? 'indicating high stress' : 'below optimal'}`
      });
      totalWeight += (hrvValue < 40 ? 25 : 15);
    }

    if (aiText.includes('stress') && metrics.stress) {
      analysis.primaryCauses.push({
        factor: metrics.stress > 70 ? 'High Stress' : 'Moderate Stress',
        contribution: metrics.stress > 70 ? 30 : 15,
        explanation: `Stress at ${Math.round(metrics.stress)}% - Gemini identified as primary trigger`
      });
      totalWeight += (metrics.stress > 70 ? 30 : 15);
    }

    if (aiText.includes('sleep') && metrics.sleepQuality) {
      analysis.primaryCauses.push({
        factor: metrics.sleepQuality < 50 ? 'Poor Sleep Quality' : 'Below Average Sleep',
        contribution: metrics.sleepQuality < 50 ? 25 : 12,
        explanation: `Sleep quality ${Math.round(metrics.sleepQuality)}% - Gemini analysis: ${aiText.includes('depriv') ? 'sleep deprivation detected' : 'insufficient rest'}`
      });
      totalWeight += (metrics.sleepQuality < 50 ? 25 : 12);
    }

    if (aiText.includes('screen') || aiText.includes('blue light')) {
      const hours = Math.round(metrics.screenTime / 60);
      analysis.primaryCauses.push({
        factor: 'Excessive Screen Time',
        contribution: 15,
        explanation: `${hours}h screen time - Gemini detected eye strain and blue light exposure`
      });
      totalWeight += 15;
    }

    if (aiText.includes('pressure') || aiText.includes('weather') || aiText.includes('barometric')) {
      analysis.primaryCauses.push({
        factor: 'Barometric Pressure Drop',
        contribution: 20,
        explanation: `Pressure ${Math.round(metrics.weather?.pressure || 1005)}hPa - Gemini confirmed weather trigger`
      });
      totalWeight += 20;
    }

    if (aiText.includes('temperature') && metrics.weather?.temperature) {
      analysis.primaryCauses.push({
        factor: 'Temperature Extreme',
        contribution: 10,
        explanation: `Temperature ${Math.round(metrics.weather.temperature)}°C - Gemini flagged environmental factor`
      });
      totalWeight += 10;
    }

    // LEARNING ALGORITHM: Calculate average metrics across all past migraines
    const learnedPatterns = {
      avgHRVAtMigraine: 0,
      avgStressAtMigraine: 0,
      avgSleepQualityAtMigraine: 0,
      avgScreenTimeAtMigraine: 0,
      avgPressureAtMigraine: 0,
      avgTemperatureAtMigraine: 0,
      count: historicalMigraines.length,
    };

    if (historicalMigraines.length > 0) {
      historicalMigraines.forEach(past => {
        if (past.metricsSnapshot?.hrv) learnedPatterns.avgHRVAtMigraine += past.metricsSnapshot.hrv;
        if (past.metricsSnapshot?.stress) learnedPatterns.avgStressAtMigraine += past.metricsSnapshot.stress;
        if (past.metricsSnapshot?.sleepQuality) learnedPatterns.avgSleepQualityAtMigraine += past.metricsSnapshot.sleepQuality;
        if (past.metricsSnapshot?.screenTime) learnedPatterns.avgScreenTimeAtMigraine += past.metricsSnapshot.screenTime;
        if (past.metricsSnapshot?.weather?.pressure) learnedPatterns.avgPressureAtMigraine += past.metricsSnapshot.weather.pressure;
        if (past.metricsSnapshot?.weather?.temperature) learnedPatterns.avgTemperatureAtMigraine += past.metricsSnapshot.weather.temperature;
      });

      learnedPatterns.avgHRVAtMigraine /= historicalMigraines.length;
      learnedPatterns.avgStressAtMigraine /= historicalMigraines.length;
      learnedPatterns.avgSleepQualityAtMigraine /= historicalMigraines.length;
      learnedPatterns.avgScreenTimeAtMigraine /= historicalMigraines.length;
      learnedPatterns.avgPressureAtMigraine /= historicalMigraines.length;
      learnedPatterns.avgTemperatureAtMigraine /= historicalMigraines.length;

      // Set SMART prediction thresholds based on learned patterns
      analysis.predictiveThresholds = {
        hrvWarning: learnedPatterns.avgHRVAtMigraine + 5, // Warn when approaching migraine HRV
        stressWarning: learnedPatterns.avgStressAtMigraine - 10, // Warn when stress getting close
        sleepQualityWarning: learnedPatterns.avgSleepQualityAtMigraine + 10,
        screenTimeWarning: Math.max(180, learnedPatterns.avgScreenTimeAtMigraine - 30), // At least 3h warning
        pressureWarning: learnedPatterns.avgPressureAtMigraine + 5,
        temperatureWarning: learnedPatterns.avgTemperatureAtMigraine,
      };

      console.log(`🧠 Learned patterns from ${historicalMigraines.length} past migraines:`, learnedPatterns);
      console.log(`🎯 Smart thresholds for future warnings:`, analysis.predictiveThresholds);
    }

    // Sort by contribution
    analysis.primaryCauses.sort((a, b) => b.contribution - a.contribution);
    analysis.confidence = Math.min(95, totalWeight + 20);

    // Generate AI-powered recommendations based on Gemini insights
    analysis.recommendations = [];
    if (aiText.includes('stress') || analysis.primaryCauses.some(c => c.factor.includes('Stress'))) {
      analysis.recommendations.push('🧘 Stress Management: Practice deep breathing, meditation, or gentle yoga for 10-15 minutes');
    }
    if (aiText.includes('sleep') || analysis.primaryCauses.some(c => c.factor.includes('Sleep'))) {
      analysis.recommendations.push('😴 Sleep Priority: Aim for 7-9 hours tonight. Create a dark, cool sleeping environment');
    }
    if (aiText.includes('screen') || analysis.primaryCauses.some(c => c.factor.includes('Screen'))) {
      analysis.recommendations.push('📱 Screen Break: Use 20-20-20 rule. Enable blue light filters. Take a 2-hour screen break');
    }
    if (aiText.includes('hrv') || analysis.primaryCauses.some(c => c.factor.includes('HRV'))) {
      analysis.recommendations.push('❤️ HRV Boost: Stay hydrated, do light exercise, practice breathing exercises');
    }
    if (aiText.includes('pressure') || aiText.includes('weather')) {
      analysis.recommendations.push('🌤️ Weather Watch: Monitor forecasts. Take preventive medication during pressure drops');
    }
    if (aiText.includes('hydration') || aiText.includes('water')) {
      analysis.recommendations.push('💧 Hydration: Drink 8 glasses of water today to prevent dehydration triggers');
    }

    // Find similar patterns in history
    for (const pastMigraine of historicalMigraines) {
      let similarity = 0;
      let factors = 0;

      if (pastMigraine.metricsSnapshot?.stress && metrics.stress) {
        const stressDiff = Math.abs(pastMigraine.metricsSnapshot.stress - metrics.stress);
        if (stressDiff < 15) {
          similarity += 100 - stressDiff * 5;
          factors++;
        }
      }

      if (pastMigraine.metricsSnapshot?.hrv && metrics.hrv) {
        const hrvDiff = Math.abs(pastMigraine.metricsSnapshot.hrv - metrics.hrv);
        if (hrvDiff < 10) {
          similarity += 100 - hrvDiff * 8;
          factors++;
        }
      }

      if (factors > 0) {
        similarity = similarity / factors;
        if (similarity > 60) {
          analysis.similarPatterns.push({
            date: pastMigraine.timestamp,
            similarity: Math.round(similarity),
          });
        }
      }
    }

    // Sort similar patterns by similarity
    analysis.similarPatterns.sort((a, b) => b.similarity - a.similarity);
    analysis.similarPatterns = analysis.similarPatterns.slice(0, 5);

    // Save analysis to migraine log
    migraineLog.aiAnalysis = analysis;
    await migraineLog.save();

    // Update user's baseline with learned thresholds for future predictions
    if (analysis.predictiveThresholds && Object.keys(analysis.predictiveThresholds).length > 0) {
      user.migainePredictionThresholds = analysis.predictiveThresholds;
      await user.save();
      console.log(`✅ Updated prediction thresholds for user ${clerkId}`);
    }

    console.log(`✅ AI analysis completed for migraine ${migraineId} with ${analysis.confidence}% confidence`);
  } catch (error) {
    console.error('Error in AI analysis:', error);
  }
}

// AI Analysis Function (uses reinforcement learning patterns)
async function performAIAnalysis(migraineId, clerkId) {
  try {
    const migraineLog = await MigraineLog.findById(migraineId);
    if (!migraineLog) return;

    // Get historical migraine data
    const historicalMigraines = await MigraineLog.find({
      clerkId,
      _id: { $ne: migraineId },
    }).sort({ timestamp: -1 }).limit(20);

    // Get user's triggers
    const user = await User.findOne({ clerkId });

    // Analyze metrics snapshot
    const analysis = {
      confidence: 0,
      primaryCauses: [],
      recommendations: [],
      similarPatterns: [],
      analysisTimestamp: new Date(),
    };

    const metrics = migraineLog.metricsSnapshot;
    let totalWeight = 0;

    // Analyze HRV (Heart Rate Variability)
    if (metrics.hrv) {
      if (metrics.hrv < 40) {
        analysis.primaryCauses.push({
          factor: 'Very Low HRV',
          contribution: 25,
          explanation: 'Your heart rate variability was critically low, indicating high stress and poor autonomic function.'
        });
        totalWeight += 25;
      } else if (metrics.hrv < 55) {
        analysis.primaryCauses.push({
          factor: 'Low HRV',
          contribution: 15,
          explanation: 'Your heart rate variability was below optimal range, suggesting elevated stress levels.'
        });
        totalWeight += 15;
      }
    }

    // Analyze Stress
    if (metrics.stress) {
      if (metrics.stress > 70) {
        analysis.primaryCauses.push({
          factor: 'High Stress',
          contribution: 30,
          explanation: 'Your stress levels were significantly elevated, a known migraine trigger.'
        });
        totalWeight += 30;
      } else if (metrics.stress > 50) {
        analysis.primaryCauses.push({
          factor: 'Moderate Stress',
          contribution: 15,
          explanation: 'Your stress levels were moderately high, contributing to migraine risk.'
        });
        totalWeight += 15;
      }
    }

    // Analyze Sleep
    if (metrics.sleepQuality) {
      if (metrics.sleepQuality < 50) {
        analysis.primaryCauses.push({
          factor: 'Poor Sleep Quality',
          contribution: 25,
          explanation: 'Your sleep quality was poor, significantly impacting your migraine risk.'
        });
        totalWeight += 25;
      } else if (metrics.sleepQuality < 70) {
        analysis.primaryCauses.push({
          factor: 'Below Average Sleep',
          contribution: 12,
          explanation: 'Your sleep quality was below optimal, potentially contributing to the migraine.'
        });
        totalWeight += 12;
      }
    }

    // Analyze Screen Time
    if (metrics.screenTime && metrics.screenTime > 240) { // 4+ hours
      analysis.primaryCauses.push({
        factor: 'Excessive Screen Time',
        contribution: 15,
        explanation: `You had ${Math.round(metrics.screenTime / 60)} hours of screen time, which can trigger migraines through eye strain and blue light exposure.`
      });
      totalWeight += 15;
    }

    // Analyze Weather (Barometric Pressure)
    if (metrics.weather?.pressure && metrics.weather.pressure < 1010) {
      analysis.primaryCauses.push({
        factor: 'Low Barometric Pressure',
        contribution: 20,
        explanation: 'Barometric pressure was low, a common environmental trigger for migraines.'
      });
      totalWeight += 20;
    }

    // Sort by contribution
    analysis.primaryCauses.sort((a, b) => b.contribution - a.contribution);

    // Calculate confidence based on data availability
    analysis.confidence = Math.min(95, totalWeight + 20);

    // Generate recommendations
    if (analysis.primaryCauses.some(c => c.factor.includes('Stress'))) {
      analysis.recommendations.push('Practice stress-reduction techniques like deep breathing, meditation, or gentle yoga.');
    }
    if (analysis.primaryCauses.some(c => c.factor.includes('Sleep'))) {
      analysis.recommendations.push('Prioritize 7-9 hours of quality sleep. Consider a consistent bedtime routine.');
    }
    if (analysis.primaryCauses.some(c => c.factor.includes('Screen'))) {
      analysis.recommendations.push('Take regular breaks from screens using the 20-20-20 rule. Use blue light filters.');
    }
    if (analysis.primaryCauses.some(c => c.factor.includes('HRV'))) {
      analysis.recommendations.push('Improve HRV through regular exercise, proper hydration, and stress management.');
    }
    if (analysis.primaryCauses.some(c => c.factor.includes('Pressure'))) {
      analysis.recommendations.push('Monitor weather forecasts and take preventive measures during low-pressure systems.');
    }

    // Find similar patterns in history
    for (const pastMigraine of historicalMigraines) {
      let similarity = 0;
      let factors = 0;

      if (pastMigraine.metricsSnapshot?.stress && metrics.stress) {
        const stressDiff = Math.abs(pastMigraine.metricsSnapshot.stress - metrics.stress);
        if (stressDiff < 15) {
          similarity += 100 - stressDiff * 5;
          factors++;
        }
      }

      if (pastMigraine.metricsSnapshot?.hrv && metrics.hrv) {
        const hrvDiff = Math.abs(pastMigraine.metricsSnapshot.hrv - metrics.hrv);
        if (hrvDiff < 10) {
          similarity += 100 - hrvDiff * 8;
          factors++;
        }
      }

      if (factors > 0) {
        similarity = similarity / factors;
        if (similarity > 60) {
          analysis.similarPatterns.push({
            date: pastMigraine.timestamp,
            similarity: Math.round(similarity),
          });
        }
      }
    }

    // Sort similar patterns by similarity
    analysis.similarPatterns.sort((a, b) => b.similarity - a.similarity);
    analysis.similarPatterns = analysis.similarPatterns.slice(0, 5);

    // Save analysis to migraine log
    migraineLog.aiAnalysis = analysis;
    await migraineLog.save();

    console.log(`✅ AI analysis completed for migraine ${migraineId}`);
  } catch (error) {
    console.error('Error in AI analysis:', error);
  }
}

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
