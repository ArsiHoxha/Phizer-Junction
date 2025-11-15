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

    user.permissions = permissions;
    await user.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error saving permissions:', error);
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
    const { frequency, triggers } = req.body;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.migraineFrequency = frequency;
    user.triggers = triggers;
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

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
