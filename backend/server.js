const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { clerkMiddleware, requireAuth } = require('@clerk/express');

const app = express();
const PORT = process.env.PORT || 3000;

// Clerk Keys
const CLERK_PUBLISHABLE_KEY = 'pk_test_bGVhZGluZy1veXN0ZXItMTguY2xlcmsuYWNjb3VudHMuZGV2JA';
const CLERK_SECRET_KEY = 'sk_test_IBuDewVmhzJ8xwET2CUgyoiIEenNcM0kBs13zmM2BD';

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

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
