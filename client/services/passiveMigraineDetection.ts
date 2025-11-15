/**
 * Passive Migraine Phase Detection Service
 * 
 * Analyzes passive health data to detect which migraine phase user is in
 * WITHOUT requiring manual input - fully automated AI detection
 * 
 * Based on medical literature:
 * - Prodrome: 6-48 hours before headache (HRV drops, stress rises)
 * - Aura: 20-60 minutes before headache (sudden changes)
 * - Headache: User confirms (main attack phase)
 * - Postdrome: After headache resolves (fatigue, recovery)
 */

import type { 
  MigrainePhase, 
  ProdromeSymptom, 
  AuraSymptom, 
  HeadacheSymptom,
  PostdromeSymptom,
  DetectedSymptoms,
  EarlyWarningSignal 
} from '../types/migraine';

interface HealthMetrics {
  hrv: number;
  heartRate: number;
  stress: number;
  sleepQuality: number;
  sleepHours: number;
  screenTime: number;
  activityLevel: number;
}

interface UserBaseline {
  avgHrv: number;
  avgHeartRate: number;
  avgStress: number;
  avgSleep: number;
}

interface PhaseDetectionResult {
  phase: MigrainePhase;
  confidence: number;  // 0-100
  detectedSymptoms: DetectedSymptoms;
  earlyWarningSignals: EarlyWarningSignal[];
  explanation: string;
}

export class PassiveMigraineDetection {
  
  /**
   * Main detection function - analyzes metrics to determine phase
   * Called continuously in background or when user logs migraine
   */
  static detectPhase(
    currentMetrics: HealthMetrics,
    baseline: UserBaseline,
    historicalMetrics: HealthMetrics[], // Last 48 hours of data
    userConfirmedMigraine: boolean = false
  ): PhaseDetectionResult {
    
    // If user just confirmed migraine, we're at least in headache phase
    if (userConfirmedMigraine) {
      return this.detectHeadacheOrLater(currentMetrics, baseline, historicalMetrics);
    }
    
    // Check for prodrome symptoms (early warning)
    const prodromeResult = this.detectProdrome(currentMetrics, baseline, historicalMetrics);
    if (prodromeResult.confidence > 60) {
      return prodromeResult;
    }
    
    // Check for aura phase (imminent migraine)
    const auraResult = this.detectAura(currentMetrics, baseline, historicalMetrics);
    if (auraResult.confidence > 50) {
      return auraResult;
    }
    
    // Default: no active phase detected
    return {
      phase: 'headache',
      confidence: 0,
      detectedSymptoms: { prodrome: [], aura: [], headache: [], postdrome: [] },
      earlyWarningSignals: [],
      explanation: 'No active migraine phase detected',
    };
  }
  
  /**
   * Detect Prodrome Phase (6-48 hours before migraine)
   * Signs: HRV drops, stress increases, sleep disturbances, mood changes
   */
  private static detectProdrome(
    current: HealthMetrics,
    baseline: UserBaseline,
    historical: HealthMetrics[]
  ): PhaseDetectionResult {
    const warnings: EarlyWarningSignal[] = [];
    const symptoms: ProdromeSymptom[] = [];
    let confidence = 0;
    
    // HRV drop (most reliable prodrome indicator)
    const hrvDrop = ((baseline.avgHrv - current.hrv) / baseline.avgHrv) * 100;
    if (hrvDrop > 15) {
      confidence += 30;
      warnings.push({
        metric: 'hrv',
        value: current.hrv,
        deviation: hrvDrop,
        timestamp: new Date(),
      });
      symptoms.push('fatigue');
    }
    
    // Stress increase
    const stressIncrease = ((current.stress - baseline.avgStress) / baseline.avgStress) * 100;
    if (stressIncrease > 20) {
      confidence += 25;
      warnings.push({
        metric: 'stress',
        value: current.stress,
        deviation: stressIncrease,
        timestamp: new Date(),
      });
      symptoms.push('mood_changes');
    }
    
    // Poor sleep quality
    const sleepDrop = ((baseline.avgSleep - current.sleepQuality) / baseline.avgSleep) * 100;
    if (sleepDrop > 25 || current.sleepHours < 5) {
      confidence += 20;
      warnings.push({
        metric: 'sleep',
        value: current.sleepQuality,
        deviation: sleepDrop,
        timestamp: new Date(),
      });
      symptoms.push('fatigue');
    }
    
    // Increased screen time (could indicate concentration difficulty or mood changes)
    if (current.screenTime > baseline.avgStress * 1.5) {
      confidence += 10;
      symptoms.push('concentration_difficulty');
    }
    
    // Low activity level
    if (current.activityLevel < 0.5) {
      confidence += 15;
      symptoms.push('fatigue');
      symptoms.push('neck_stiffness'); // Inferred from low movement
    }
    
    return {
      phase: 'prodrome',
      confidence,
      detectedSymptoms: {
        prodrome: [...new Set(symptoms)], // Remove duplicates
        aura: [],
        headache: [],
        postdrome: [],
      },
      earlyWarningSignals: warnings,
      explanation: `Prodrome phase detected with ${confidence}% confidence. Early warning signs: ${warnings.map(w => w.metric).join(', ')}`,
    };
  }
  
  /**
   * Detect Aura Phase (20-60 minutes before headache)
   * Signs: Sudden dramatic changes in metrics
   */
  private static detectAura(
    current: HealthMetrics,
    baseline: UserBaseline,
    historical: HealthMetrics[]
  ): PhaseDetectionResult {
    const warnings: EarlyWarningSignal[] = [];
    const symptoms: AuraSymptom[] = [];
    let confidence = 0;
    
    // Look for sudden changes in last 20-60 minutes
    const recentMetrics = historical.slice(-3); // Last 3 data points (assuming 20-min intervals)
    
    if (recentMetrics.length >= 2) {
      const prevMetrics = recentMetrics[recentMetrics.length - 2];
      
      // Sudden HRV drop
      const suddenHrvDrop = ((prevMetrics.hrv - current.hrv) / prevMetrics.hrv) * 100;
      if (suddenHrvDrop > 20) {
        confidence += 35;
        warnings.push({
          metric: 'hrv',
          value: current.hrv,
          deviation: suddenHrvDrop,
          timestamp: new Date(),
        });
      }
      
      // Sudden heart rate spike
      const hrSpike = ((current.heartRate - prevMetrics.heartRate) / prevMetrics.heartRate) * 100;
      if (hrSpike > 15) {
        confidence += 30;
        warnings.push({
          metric: 'heart_rate',
          value: current.heartRate,
          deviation: hrSpike,
          timestamp: new Date(),
        });
        symptoms.push('sensory_changes');
      }
      
      // Sudden stress spike
      const stressSpike = current.stress - prevMetrics.stress;
      if (stressSpike > 30) {
        confidence += 25;
        warnings.push({
          metric: 'stress',
          value: current.stress,
          deviation: stressSpike,
          timestamp: new Date(),
        });
      }
    }
    
    return {
      phase: 'aura',
      confidence,
      detectedSymptoms: {
        prodrome: [],
        aura: symptoms,
        headache: [],
        postdrome: [],
      },
      earlyWarningSignals: warnings,
      explanation: `Aura phase detected with ${confidence}% confidence. Sudden changes in last 20-60 minutes.`,
    };
  }
  
  /**
   * Detect Headache or Postdrome Phase
   * Called when user confirms migraine
   */
  private static detectHeadacheOrLater(
    current: HealthMetrics,
    baseline: UserBaseline,
    historical: HealthMetrics[]
  ): PhaseDetectionResult {
    const symptoms: HeadacheSymptom[] = ['throbbing_pain']; // User confirmed
    let confidence = 90; // High confidence since user confirmed
    
    // Look for passive indicators of headache symptoms
    
    // Light sensitivity (inferred from screen brightness behavior - would need to add this metric)
    // For now, assume if stress is very high, likely sensitive to stimuli
    if (current.stress > 70) {
      symptoms.push('light_sensitivity');
      symptoms.push('sound_sensitivity');
    }
    
    // Very low activity suggests worse with movement
    if (current.activityLevel < 0.3) {
      symptoms.push('worse_with_activity');
    }
    
    // High heart rate variability + low activity could indicate nausea
    if (current.heartRate > baseline.avgHeartRate * 1.2 && current.activityLevel < 0.3) {
      symptoms.push('nausea');
    }
    
    return {
      phase: 'headache',
      confidence,
      detectedSymptoms: {
        prodrome: [],
        aura: [],
        headache: symptoms,
        postdrome: [],
      },
      earlyWarningSignals: [],
      explanation: 'User confirmed migraine. Currently in headache phase.',
    };
  }
  
  /**
   * Detect Postdrome Phase (recovery after headache)
   * Called when monitoring after migraine resolves
   */
  static detectPostdrome(
    current: HealthMetrics,
    baseline: UserBaseline,
    timeSinceMigraineResolved: number // minutes
  ): PhaseDetectionResult {
    const symptoms: PostdromeSymptom[] = [];
    let confidence = 70;
    
    // Postdrome typically lasts hours to days
    if (timeSinceMigraineResolved < 60 * 24) { // Within 24 hours
      
      // Still fatigued (low activity, low HRV)
      if (current.hrv < baseline.avgHrv * 0.85) {
        symptoms.push('exhaustion');
        symptoms.push('weakness');
      }
      
      // Still elevated stress/confusion
      if (current.stress > baseline.avgStress * 1.15) {
        symptoms.push('confusion');
        symptoms.push('difficulty_concentrating');
      }
      
      // Mood changes (inferred from phone usage patterns)
      if (current.screenTime > baseline.avgStress * 1.3) {
        symptoms.push('mood_changes');
      }
      
      return {
        phase: 'postdrome',
        confidence,
        detectedSymptoms: {
          prodrome: [],
          aura: [],
          headache: [],
          postdrome: symptoms,
        },
        earlyWarningSignals: [],
        explanation: 'Recovery phase (postdrome) detected. Monitoring for complete resolution.',
      };
    }
    
    // Fully recovered
    return {
      phase: 'postdrome',
      confidence: 0,
      detectedSymptoms: { prodrome: [], aura: [], headache: [], postdrome: [] },
      earlyWarningSignals: [],
      explanation: 'Migraine fully resolved.',
    };
  }
  
  /**
   * Calculate user's baseline metrics from historical data
   * Should be called daily or weekly to update baseline
   */
  static calculateBaseline(historicalData: HealthMetrics[]): UserBaseline {
    if (historicalData.length === 0) {
      return {
        avgHrv: 50,
        avgHeartRate: 70,
        avgStress: 30,
        avgSleep: 75,
      };
    }
    
    const sum = historicalData.reduce(
      (acc, curr) => ({
        hrv: acc.hrv + curr.hrv,
        heartRate: acc.heartRate + curr.heartRate,
        stress: acc.stress + curr.stress,
        sleep: acc.sleep + curr.sleepQuality,
      }),
      { hrv: 0, heartRate: 0, stress: 0, sleep: 0 }
    );
    
    const count = historicalData.length;
    return {
      avgHrv: sum.hrv / count,
      avgHeartRate: sum.heartRate / count,
      avgStress: sum.stress / count,
      avgSleep: sum.sleep / count,
    };
  }
}
