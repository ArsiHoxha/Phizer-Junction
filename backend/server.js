const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { clerkMiddleware, requireAuth } = require('@clerk/express');
const { analyzeHealthData, getTriggerInsights } = require('./services/geminiService');
const { textToSpeech } = require('./services/elevenLabsService');
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

// Wearable/Simulated data (HRV, heart rate, stress, steps)
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
    
    // Calculate and update risk score based on wearable data
    const riskScore = calculateRiskFromMetrics({
      hrv,
      heartRate,
      stress,
      sleepQuality,
    });
    
    // Determine risk level based on score
    let riskLevel = 'low';
    if (riskScore >= 70) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';
    
    // Save risk history
    const riskHistory = new RiskHistory({
      userId,
      clerkId: userId,
      riskIndex: riskScore,
      riskLevel: riskLevel,
      timestamp: new Date(),
      contributingFactors: [
        {
          name: 'HRV',
          impact: hrv < 40 ? 90 : hrv < 55 ? 60 : 30,
          icon: '❤️'
        },
        {
          name: 'Stress',
          impact: stress > 70 ? 90 : stress > 40 ? 60 : 30,
          icon: '😰'
        },
        {
          name: 'Sleep Quality',
          impact: sleepQuality < 50 ? 90 : sleepQuality < 70 ? 60 : 30,
          icon: '😴'
        },
      ],
      metricsSnapshot: {
        hrv,
        stressLevel: stress > 70 ? 'High' : stress > 40 ? 'Medium' : 'Low',
      },
    });
    
    await riskHistory.save();

    res.status(201).json({ success: true, metric, riskScore });
  } catch (error) {
    console.error('Error saving wearable data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to calculate risk from metrics
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

    // Get user's baseline and triggers
    const user = await User.findOne({ clerkId });

    // Simple risk calculation formula
    let riskScore = 0;
    const factors = [];

    // HRV factor (0-30 points)
    if (latestMetric.hrv && user.baselineMetrics?.avgHRV) {
      const hrvDrop = ((user.baselineMetrics.avgHRV - latestMetric.hrv) / user.baselineMetrics.avgHRV) * 100;
      if (hrvDrop > 10) {
        const hrvImpact = Math.min(hrvDrop * 2, 30);
        riskScore += hrvImpact;
        factors.push({ name: 'HRV Drop', impact: Math.round(hrvDrop), icon: '💓' });
      }
    }

    // Screen time factor (0-20 points)
    if (latestMetric.screenTime && user.baselineMetrics?.avgScreenTime) {
      const screenIncrease = ((latestMetric.screenTime - user.baselineMetrics.avgScreenTime) / user.baselineMetrics.avgScreenTime) * 100;
      if (screenIncrease > 20) {
        const screenImpact = Math.min(screenIncrease, 20);
        riskScore += screenImpact;
        factors.push({ name: 'Screen Time', impact: Math.round(screenIncrease), icon: '📱' });
      }
    }

    // Sleep factor (0-20 points)
    if (latestMetric.sleepHours && user.baselineMetrics?.avgSleep) {
      const sleepDebt = user.baselineMetrics.avgSleep - latestMetric.sleepHours;
      if (sleepDebt > 0.5) {
        const sleepImpact = Math.min(sleepDebt * 10, 20);
        riskScore += sleepImpact;
        factors.push({ name: 'Sleep Debt', impact: Math.round(sleepDebt * 100 / user.baselineMetrics.avgSleep), icon: '😴' });
      }
    }

    // Stress factor (0-20 points)
    if (latestMetric.stressLevel === 'high') {
      riskScore += 20;
      factors.push({ name: 'Stress Level', impact: 68, icon: '😰' });
    } else if (latestMetric.stressLevel === 'medium') {
      riskScore += 10;
      factors.push({ name: 'Stress Level', impact: 40, icon: '😰' });
    }

    // Weather factor (0-10 points)
    if (latestMetric.weather?.pressure && latestMetric.weather.pressure < 1010) {
      riskScore += 10;
      factors.push({ name: 'Barometric Pressure', impact: 45, icon: '🌦️' });
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
        sleepHours: latestMetric.sleepHours,
        stressLevel: latestMetric.stressLevel,
        screenTime: latestMetric.screenTime,
        calendarLoad: latestMetric.calendarLoad,
        weather: latestMetric.weather,
      },
    });

    await riskHistory.save();

    res.status(200).json({
      success: true,
      riskIndex: riskScore,
      riskLevel,
      factors: factors.slice(0, 4), // Top 4 factors
      timestamp: new Date(),
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

    // Generate audio from the analysis text
    let audioBase64 = null;
    try {
      const audioBuffer = await textToSpeech(analysis.analysis);
      audioBase64 = audioBuffer.toString('base64');
    } catch (audioError) {
      console.error('Audio generation error:', audioError);
      // Continue without audio if ElevenLabs fails
    }

    res.status(200).json({
      ...analysis,
      audio: audioBase64 // Base64 encoded audio
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

// AI Analysis Function with Machine Learning (learns patterns and predicts)
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

    // Analyze metrics snapshot
    const analysis = {
      confidence: 0,
      primaryCauses: [],
      recommendations: [],
      similarPatterns: [],
      analysisTimestamp: new Date(),
      predictiveThresholds: {}, // NEW: Learn thresholds for predictions
    };

    const metrics = migraineLog.metricsSnapshot;
    let totalWeight = 0;

    // LEARNING ALGORITHM: Calculate average metrics across all past migraines
    const learnedPatterns = {
      avgHRVAtMigraine: 0,
      avgStressAtMigraine: 0,
      avgSleepQualityAtMigraine: 0,
      avgScreenTimeAtMigraine: 0,
      avgPressureAtMigraine: 0,
      count: historicalMigraines.length,
    };

    if (historicalMigraines.length > 0) {
      historicalMigraines.forEach(past => {
        if (past.metricsSnapshot?.hrv) learnedPatterns.avgHRVAtMigraine += past.metricsSnapshot.hrv;
        if (past.metricsSnapshot?.stress) learnedPatterns.avgStressAtMigraine += past.metricsSnapshot.stress;
        if (past.metricsSnapshot?.sleepQuality) learnedPatterns.avgSleepQualityAtMigraine += past.metricsSnapshot.sleepQuality;
        if (past.metricsSnapshot?.screenTime) learnedPatterns.avgScreenTimeAtMigraine += past.metricsSnapshot.screenTime;
        if (past.metricsSnapshot?.weather?.pressure) learnedPatterns.avgPressureAtMigraine += past.metricsSnapshot.weather.pressure;
      });

      learnedPatterns.avgHRVAtMigraine /= historicalMigraines.length;
      learnedPatterns.avgStressAtMigraine /= historicalMigraines.length;
      learnedPatterns.avgSleepQualityAtMigraine /= historicalMigraines.length;
      learnedPatterns.avgScreenTimeAtMigraine /= historicalMigraines.length;
      learnedPatterns.avgPressureAtMigraine /= historicalMigraines.length;

      // Set prediction thresholds based on learned patterns
      analysis.predictiveThresholds = {
        hrvWarning: learnedPatterns.avgHRVAtMigraine + 5, // Warn when HRV gets within 5 of migraine avg
        stressWarning: learnedPatterns.avgStressAtMigraine - 10, // Warn when stress gets within 10 of migraine avg
        sleepQualityWarning: learnedPatterns.avgSleepQualityAtMigraine + 10,
        screenTimeWarning: learnedPatterns.avgScreenTimeAtMigraine - 30,
        pressureWarning: learnedPatterns.avgPressureAtMigraine + 5,
      };

      console.log(`🧠 Learned patterns from ${historicalMigraines.length} past migraines:`, learnedPatterns);
    }

    // Analyze HRV (Heart Rate Variability)
    if (metrics.hrv) {
      if (metrics.hrv < 40) {
        analysis.primaryCauses.push({
          factor: 'Very Low HRV',
          contribution: 25,
          explanation: `Your HRV was ${Math.round(metrics.hrv)}, critically low indicating high stress.`
        });
        totalWeight += 25;
      } else if (metrics.hrv < 55) {
        analysis.primaryCauses.push({
          factor: 'Low HRV',
          contribution: 15,
          explanation: `Your HRV was ${Math.round(metrics.hrv)}, below optimal range.`
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
          explanation: `Stress level was ${Math.round(metrics.stress)}%, significantly elevated.`
        });
        totalWeight += 30;
      } else if (metrics.stress > 50) {
        analysis.primaryCauses.push({
          factor: 'Moderate Stress',
          contribution: 15,
          explanation: `Stress level was ${Math.round(metrics.stress)}%, moderately high.`
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
          explanation: `Sleep quality was only ${Math.round(metrics.sleepQuality)}%, significantly impacting health.`
        });
        totalWeight += 25;
      } else if (metrics.sleepQuality < 70) {
        analysis.primaryCauses.push({
          factor: 'Below Average Sleep',
          contribution: 12,
          explanation: `Sleep quality was ${Math.round(metrics.sleepQuality)}%, below optimal.`
        });
        totalWeight += 12;
      }
    }

    // Analyze Screen Time
    if (metrics.screenTime && metrics.screenTime > 240) { // 4+ hours
      const hours = Math.round(metrics.screenTime / 60);
      analysis.primaryCauses.push({
        factor: 'Excessive Screen Time',
        contribution: 15,
        explanation: `You had ${hours} hours of screen time, causing eye strain and blue light exposure.`
      });
      totalWeight += 15;
    }

    // Analyze Weather (Barometric Pressure)
    if (metrics.weather?.pressure && metrics.weather.pressure < 1010) {
      analysis.primaryCauses.push({
        factor: 'Low Barometric Pressure',
        contribution: 20,
        explanation: `Pressure was ${Math.round(metrics.weather.pressure)} hPa, a common environmental trigger.`
      });
      totalWeight += 20;
    }

    // Sort by contribution
    analysis.primaryCauses.sort((a, b) => b.contribution - a.contribution);

    // Calculate confidence based on data availability
    analysis.confidence = Math.min(95, totalWeight + 20);

    // Generate recommendations
    if (analysis.primaryCauses.some(c => c.factor.includes('Stress'))) {
      analysis.recommendations.push('🧘 Practice stress-reduction: deep breathing, meditation, or gentle yoga');
    }
    if (analysis.primaryCauses.some(c => c.factor.includes('Sleep'))) {
      analysis.recommendations.push('😴 Prioritize 7-9 hours of quality sleep with consistent bedtime routine');
    }
    if (analysis.primaryCauses.some(c => c.factor.includes('Screen'))) {
      analysis.recommendations.push('📱 Use 20-20-20 rule for screens. Enable blue light filters');
    }
    if (analysis.primaryCauses.some(c => c.factor.includes('HRV'))) {
      analysis.recommendations.push('❤️ Improve HRV through exercise, hydration, and stress management');
    }
    if (analysis.primaryCauses.some(c => c.factor.includes('Pressure'))) {
      analysis.recommendations.push('🌤️ Monitor weather forecasts and take preventive measures during low-pressure');
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
