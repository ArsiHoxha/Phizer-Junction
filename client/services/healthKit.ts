import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';

// Permissions we need for migraine tracking
const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.HeartRateVariability,
      AppleHealthKit.Constants.Permissions.RestingHeartRate,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.MindfulSession, // For stress/meditation
    ],
    write: [], // We only need to read data
  },
};

/**
 * Initialize HealthKit and request permissions
 */
export const initHealthKit = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(permissions, (error: string) => {
      if (error) {
        console.error('[HealthKit] Cannot initialize HealthKit: ', error);
        reject(error);
        return;
      }
      console.log('[HealthKit] Initialized successfully');
      resolve(true);
    });
  });
};

/**
 * Get Heart Rate Variability (HRV) - CRITICAL for migraine prediction
 */
export const getHRV = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    const options = {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
      endDate: new Date().toISOString(),
    };

    AppleHealthKit.getHeartRateVariabilitySamples(
      options,
      (err: Object, results: Array<HealthValue>) => {
        if (err) {
          reject(err);
          return;
        }

        if (results.length === 0) {
          reject(new Error('No HRV data available'));
          return;
        }

        // Get most recent HRV reading
        const latestHRV = results[results.length - 1].value;
        resolve(Math.round(latestHRV));
      }
    );
  });
};

/**
 * Get Heart Rate
 */
export const getHeartRate = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    const options = {
      startDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Last hour
      endDate: new Date().toISOString(),
    };

    AppleHealthKit.getHeartRateSamples(
      options,
      (err: Object, results: Array<HealthValue>) => {
        if (err) {
          reject(err);
          return;
        }

        if (results.length === 0) {
          reject(new Error('No heart rate data available'));
          return;
        }

        // Get average of recent readings
        const avgHeartRate =
          results.reduce((sum, reading) => sum + reading.value, 0) /
          results.length;
        resolve(Math.round(avgHeartRate));
      }
    );
  });
};

/**
 * Get Sleep Analysis - hours and quality
 */
export const getSleepData = (): Promise<{ hours: number; quality: number }> => {
  return new Promise((resolve, reject) => {
    const options = {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
      endDate: new Date().toISOString(),
    };

    AppleHealthKit.getSleepSamples(
      options,
      (err: Object, results: Array<any>) => {
        if (err) {
          reject(err);
          return;
        }

        if (results.length === 0) {
          reject(new Error('No sleep data available'));
          return;
        }

        // Calculate total sleep hours
        let totalSleepMinutes = 0;
        let deepSleepMinutes = 0;

        results.forEach((sample) => {
          const start = new Date(sample.startDate).getTime();
          const end = new Date(sample.endDate).getTime();
          const minutes = (end - start) / (1000 * 60);

          if (sample.value === 'ASLEEP' || sample.value === 'INBED') {
            totalSleepMinutes += minutes;
            
            // Deep/REM sleep = better quality
            if (sample.value === 'ASLEEP') {
              deepSleepMinutes += minutes;
            }
          }
        });

        const hours = totalSleepMinutes / 60;
        // Quality = percentage of deep sleep + bonus for 7-9 hours
        let quality = (deepSleepMinutes / totalSleepMinutes) * 100;
        
        if (hours >= 7 && hours <= 9) {
          quality = Math.min(100, quality + 20);
        }

        resolve({
          hours: Math.round(hours * 10) / 10,
          quality: Math.round(quality),
        });
      }
    );
  });
};

/**
 * Get Steps (activity level indicator)
 */
export const getSteps = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    const options = {
      date: new Date().toISOString(),
    };

    AppleHealthKit.getStepCount(options, (err: Object, results: HealthValue) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(Math.round(results.value));
    });
  });
};

/**
 * Calculate stress level from various metrics
 * Combines: HRV (low = high stress), Heart Rate (high = high stress), Activity
 */
export const calculateStressLevel = async (): Promise<number> => {
  try {
    const hrv = await getHRV();
    const heartRate = await getHeartRate();

    // Low HRV = high stress (inverse relationship)
    // Normal HRV: 50-100ms, Low: <50ms
    const hrvStress = hrv < 30 ? 80 : hrv < 50 ? 60 : 40;

    // High heart rate = stress (resting should be 60-80)
    const hrStress = heartRate > 90 ? 70 : heartRate > 80 ? 50 : 30;

    // Combined stress score (weighted average)
    const stressLevel = Math.round((hrvStress * 0.6 + hrStress * 0.4));

    return Math.min(100, stressLevel);
  } catch (error) {
    console.error('[HealthKit] Error calculating stress:', error);
    throw error;
  }
};

/**
 * Get all metrics at once - used for migraine logging
 */
export const getAllHealthMetrics = async () => {
  try {
    const [hrv, heartRate, sleepData, steps, stress] = await Promise.all([
      getHRV(),
      getHeartRate(),
      getSleepData(),
      getSteps(),
      calculateStressLevel(),
    ]);

    return {
      hrv,
      heartRate,
      sleepHours: sleepData.hours,
      sleepQuality: sleepData.quality,
      steps,
      stress,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[HealthKit] Error fetching metrics:', error);
    throw error;
  }
};
