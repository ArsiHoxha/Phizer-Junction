/**
 * Pattern Recognition & Monitoring Service
 * Continuously monitors real-time metrics against learned migraine patterns
 * Sends predictive notifications when conditions match past migraine triggers
 */

const MigraineLog = require('../models/MigraineLog');
const User = require('../models/User');
const Metric = require('../models/Metric');

/**
 * Check if current metrics match past migraine patterns
 * Returns similarity score and warning level
 */
async function checkPatternMatch(clerkId, currentMetrics) {
  try {
    // Get all past migraines for this user
    const historicalMigraines = await MigraineLog.find({ clerkId })
      .sort({ timestamp: -1 })
      .limit(50);

    if (historicalMigraines.length < 3) {
      // Need at least 3 migraines to establish patterns
      return {
        matchFound: false,
        reason: 'Insufficient migraine history for pattern detection',
        migraineCount: historicalMigraines.length,
      };
    }

    // Calculate learned thresholds from past migraines
    const patterns = calculateLearnedThresholds(historicalMigraines);
    
    // Compare current metrics with learned patterns
    const similarity = calculateSimilarityScore(currentMetrics, patterns);
    
    console.log(`🔍 Pattern Check for ${clerkId}:`, {
      similarity: similarity.totalScore,
      matchingFactors: similarity.matchingFactors,
      threshold: 75, // Alert if similarity > 75%
    });

    if (similarity.totalScore >= 75) {
      // HIGH MATCH - Send warning notification
      return {
        matchFound: true,
        similarity: similarity.totalScore,
        matchingFactors: similarity.matchingFactors,
        warningLevel: similarity.totalScore >= 90 ? 'critical' : 'high',
        recommendation: generateWarningRecommendation(similarity.matchingFactors),
        patterns: patterns,
      };
    } else if (similarity.totalScore >= 60) {
      // MODERATE MATCH - Monitor closely
      return {
        matchFound: true,
        similarity: similarity.totalScore,
        matchingFactors: similarity.matchingFactors,
        warningLevel: 'moderate',
        recommendation: 'Monitor your symptoms. Consider preventive measures.',
        patterns: patterns,
      };
    }

    return {
      matchFound: false,
      similarity: similarity.totalScore,
      reason: 'Current metrics do not match migraine patterns',
    };
  } catch (error) {
    console.error('Error checking pattern match:', error);
    return { matchFound: false, error: error.message };
  }
}

/**
 * Calculate learned thresholds from historical migraines
 */
function calculateLearnedThresholds(historicalMigraines) {
  const patterns = {
    hrv: { sum: 0, count: 0, avg: 0, min: 999, max: 0 },
    stress: { sum: 0, count: 0, avg: 0, min: 999, max: 0 },
    sleepQuality: { sum: 0, count: 0, avg: 0, min: 999, max: 0 },
    screenTime: { sum: 0, count: 0, avg: 0, min: 999, max: 0 },
    pressure: { sum: 0, count: 0, avg: 0, min: 999, max: 0 },
    temperature: { sum: 0, count: 0, avg: 0, min: 999, max: 0 },
  };

  historicalMigraines.forEach(migraine => {
    const m = migraine.metricsSnapshot;
    if (!m) return;

    if (m.hrv) {
      patterns.hrv.sum += m.hrv;
      patterns.hrv.count++;
      patterns.hrv.min = Math.min(patterns.hrv.min, m.hrv);
      patterns.hrv.max = Math.max(patterns.hrv.max, m.hrv);
    }
    if (m.stress) {
      patterns.stress.sum += m.stress;
      patterns.stress.count++;
      patterns.stress.min = Math.min(patterns.stress.min, m.stress);
      patterns.stress.max = Math.max(patterns.stress.max, m.stress);
    }
    if (m.sleepQuality) {
      patterns.sleepQuality.sum += m.sleepQuality;
      patterns.sleepQuality.count++;
      patterns.sleepQuality.min = Math.min(patterns.sleepQuality.min, m.sleepQuality);
      patterns.sleepQuality.max = Math.max(patterns.sleepQuality.max, m.sleepQuality);
    }
    if (m.screenTime) {
      patterns.screenTime.sum += m.screenTime;
      patterns.screenTime.count++;
      patterns.screenTime.min = Math.min(patterns.screenTime.min, m.screenTime);
      patterns.screenTime.max = Math.max(patterns.screenTime.max, m.screenTime);
    }
    if (m.weather?.pressure) {
      patterns.pressure.sum += m.weather.pressure;
      patterns.pressure.count++;
      patterns.pressure.min = Math.min(patterns.pressure.min, m.weather.pressure);
      patterns.pressure.max = Math.max(patterns.pressure.max, m.weather.pressure);
    }
    if (m.weather?.temperature) {
      patterns.temperature.sum += m.weather.temperature;
      patterns.temperature.count++;
      patterns.temperature.min = Math.min(patterns.temperature.min, m.weather.temperature);
      patterns.temperature.max = Math.max(patterns.temperature.max, m.weather.temperature);
    }
  });

  // Calculate averages
  Object.keys(patterns).forEach(key => {
    if (patterns[key].count > 0) {
      patterns[key].avg = patterns[key].sum / patterns[key].count;
    }
  });

  return patterns;
}

/**
 * Calculate similarity score between current metrics and learned patterns
 */
function calculateSimilarityScore(currentMetrics, patterns) {
  let totalScore = 0;
  let factorCount = 0;
  const matchingFactors = [];

  // HRV comparison (inverted - lower is worse)
  if (currentMetrics.hrv && patterns.hrv.count > 0) {
    const diff = Math.abs(currentMetrics.hrv - patterns.hrv.avg);
    const score = Math.max(0, 100 - (diff / patterns.hrv.avg) * 100);
    
    if (score >= 70) {
      totalScore += score;
      factorCount++;
      matchingFactors.push({
        factor: 'HRV',
        current: Math.round(currentMetrics.hrv),
        pattern: Math.round(patterns.hrv.avg),
        score: Math.round(score),
        warning: currentMetrics.hrv <= patterns.hrv.avg + 5 ? 'HRV approaching migraine levels' : null,
      });
    }
  }

  // Stress comparison (higher is worse)
  if (currentMetrics.stress && patterns.stress.count > 0) {
    const diff = Math.abs(currentMetrics.stress - patterns.stress.avg);
    const score = Math.max(0, 100 - (diff / patterns.stress.avg) * 100);
    
    if (score >= 70) {
      totalScore += score;
      factorCount++;
      matchingFactors.push({
        factor: 'Stress',
        current: Math.round(currentMetrics.stress),
        pattern: Math.round(patterns.stress.avg),
        score: Math.round(score),
        warning: currentMetrics.stress >= patterns.stress.avg - 10 ? 'Stress matching migraine pattern' : null,
      });
    }
  }

  // Sleep Quality comparison (lower is worse)
  if (currentMetrics.sleepQuality && patterns.sleepQuality.count > 0) {
    const diff = Math.abs(currentMetrics.sleepQuality - patterns.sleepQuality.avg);
    const score = Math.max(0, 100 - (diff / patterns.sleepQuality.avg) * 100);
    
    if (score >= 70) {
      totalScore += score;
      factorCount++;
      matchingFactors.push({
        factor: 'Sleep Quality',
        current: Math.round(currentMetrics.sleepQuality),
        pattern: Math.round(patterns.sleepQuality.avg),
        score: Math.round(score),
        warning: currentMetrics.sleepQuality <= patterns.sleepQuality.avg + 10 ? 'Poor sleep like before migraines' : null,
      });
    }
  }

  // Barometric Pressure comparison
  if (currentMetrics.pressure && patterns.pressure.count > 0) {
    const diff = Math.abs(currentMetrics.pressure - patterns.pressure.avg);
    const score = Math.max(0, 100 - (diff / 10)); // Pressure within 10 hPa
    
    if (score >= 70) {
      totalScore += score;
      factorCount++;
      matchingFactors.push({
        factor: 'Barometric Pressure',
        current: Math.round(currentMetrics.pressure),
        pattern: Math.round(patterns.pressure.avg),
        score: Math.round(score),
        warning: Math.abs(currentMetrics.pressure - patterns.pressure.avg) < 5 ? 'Pressure matches migraine conditions' : null,
      });
    }
  }

  // Screen Time comparison
  if (currentMetrics.screenTime && patterns.screenTime.count > 0) {
    const diff = Math.abs(currentMetrics.screenTime - patterns.screenTime.avg);
    const score = Math.max(0, 100 - (diff / patterns.screenTime.avg) * 100);
    
    if (score >= 70) {
      totalScore += score;
      factorCount++;
      matchingFactors.push({
        factor: 'Screen Time',
        current: Math.round(currentMetrics.screenTime / 60) + 'h',
        pattern: Math.round(patterns.screenTime.avg / 60) + 'h',
        score: Math.round(score),
        warning: currentMetrics.screenTime >= patterns.screenTime.avg - 30 ? 'Screen time at migraine-triggering levels' : null,
      });
    }
  }

  // Temperature comparison
  if (currentMetrics.temperature && patterns.temperature.count > 0) {
    const diff = Math.abs(currentMetrics.temperature - patterns.temperature.avg);
    const score = Math.max(0, 100 - diff * 5); // Temp within 5°C
    
    if (score >= 70) {
      totalScore += score;
      factorCount++;
      matchingFactors.push({
        factor: 'Temperature',
        current: Math.round(currentMetrics.temperature) + '°C',
        pattern: Math.round(patterns.temperature.avg) + '°C',
        score: Math.round(score),
        warning: Math.abs(currentMetrics.temperature - patterns.temperature.avg) < 3 ? 'Temperature similar to past migraines' : null,
      });
    }
  }

  return {
    totalScore: factorCount > 0 ? Math.round(totalScore / factorCount) : 0,
    matchingFactors: matchingFactors,
    factorCount: factorCount,
  };
}

/**
 * Generate personalized warning recommendation
 */
function generateWarningRecommendation(matchingFactors) {
  const warnings = matchingFactors
    .filter(f => f.warning)
    .map(f => f.warning);

  if (warnings.length === 0) {
    return 'Your current conditions match past migraine patterns. Take preventive action.';
  }

  return `⚠️ MIGRAINE RISK DETECTED:\n\n${warnings.join('\n\n')}\n\n🎯 Recommended Actions:\n• Take preventive medication if prescribed\n• Reduce screen time and stress\n• Stay hydrated\n• Rest in a dark, quiet room if possible`;
}

/**
 * Monitor user metrics continuously and send alerts
 * This should be called periodically (e.g., every time new metrics arrive)
 */
async function monitorUserForPatterns(clerkId, latestMetrics) {
  try {
    const result = await checkPatternMatch(clerkId, latestMetrics);

    if (result.matchFound && result.warningLevel !== 'moderate') {
      // Send notification to user
      console.log(`🚨 PATTERN MATCH ALERT for ${clerkId}:`, {
        similarity: result.similarity,
        level: result.warningLevel,
        factors: result.matchingFactors.length,
      });

      // TODO: Send push notification via NotificationService
      // This would trigger the notification shown to user
      return {
        shouldAlert: true,
        alertData: {
          title: result.warningLevel === 'critical' 
            ? '🚨 HIGH MIGRAINE RISK' 
            : '⚠️ Migraine Warning',
          body: result.recommendation,
          data: {
            type: 'pattern_match',
            similarity: result.similarity,
            matchingFactors: result.matchingFactors,
          },
        },
      };
    }

    return { shouldAlert: false };
  } catch (error) {
    console.error('Error monitoring patterns:', error);
    return { shouldAlert: false, error: error.message };
  }
}

module.exports = {
  checkPatternMatch,
  monitorUserForPatterns,
  calculateLearnedThresholds,
  calculateSimilarityScore,
};
