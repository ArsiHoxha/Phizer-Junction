/*
  Apple Health (HealthKit) service

  Notes:
  - This file uses `react-native-health` (a native module) to access Apple HealthKit.
  - To enable Apple Health features, install the module:
      npm install react-native-health
      npx expo prebuild
      cd ios && pod install
  - Then configure HealthKit in Xcode (see APPLE_HEALTH_SETUP.md for details)

  Usage:
    import AppleHealthService from '../services/appleHealthService';

    async function start() {
      const ok = await AppleHealthService.initHealth();
      if (ok) {
        const metrics = await AppleHealthService.getLatestMetrics();
      }
    }

  Returns: { hrv, heartRate, steps, sleepQuality, activeEnergy, workouts }
*/

import { Platform } from 'react-native';

// Stub service when react-native-health is not installed
const createStubService = () => ({
  initHealth: async (): Promise<boolean> => {
    console.warn('Apple HealthKit module not installed. Install react-native-health to enable this feature.');
    return false;
  },
  getLatestMetrics: async () => {
    return {};
  },
});

// Export stub by default - will be replaced if module is available
let AppleHealthService = createStubService();
let isRealModule = false;

// Try to initialize real service if module exists
try {
  const AppleHealthKit = require('react-native-health').default;
  const PERMS = AppleHealthKit?.Constants?.Permissions;

  if (AppleHealthKit && PERMS) {
    const healthOptions = {
      permissions: {
        read: [
          PERMS.HeartRate,
          PERMS.HeartRateVariability,
          PERMS.StepCount,
          PERMS.SleepAnalysis,
          PERMS.ActiveEnergyBurned,
          PERMS.Workout,
          PERMS.RespiratoryRate,
          PERMS.BloodOxygen,
          PERMS.BodyTemperature,
          PERMS.Weight,
        ],
        write: [],
      },
    };

    AppleHealthService = {
      initHealth: async (): Promise<boolean> => {
        if (Platform.OS !== 'ios') {
          console.warn('Apple HealthKit is only available on iOS devices.');
          return false;
        }

        return new Promise((resolve) => {
          AppleHealthKit.initHealthKit(healthOptions, (err: any) => {
            if (err) {
              // Check if this is the mock module error
              if (err.message && err.message.includes('not installed')) {
                console.warn('Apple Health native module not installed. See APPLE_HEALTH_SETUP.md for setup instructions.');
                resolve(false);
                return;
              }
              console.error('Error initializing HealthKit:', err);
              resolve(false);
              return;
            }
            isRealModule = true;
            resolve(true);
          });
        });
      },

      getLatestMetrics: async () => {
        if (Platform.OS !== 'ios') return {};

        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        try {
          // Heart rate samples
          const hrOptions = { 
            startDate: yesterday.toISOString(), 
            endDate: now.toISOString(), 
            ascending: false, 
            limit: 10 
          };
          
          const hrSamples: any[] = await new Promise((resolve, reject) => {
            AppleHealthKit.getHeartRateSamples(hrOptions, (err: any, results: any) => 
              err ? reject(err) : resolve(results)
            );
          });
          const heartRate = hrSamples && hrSamples.length > 0 ? Math.round(hrSamples[0].value) : undefined;

          // HRV
          let hrv;
          if (AppleHealthKit.getHeartRateVariabilitySamples) {
            const hrvSamples: any[] = await new Promise((resolve, reject) => {
              AppleHealthKit.getHeartRateVariabilitySamples(hrOptions, (err: any, results: any) => 
                err ? reject(err) : resolve(results)
              );
            });
            hrv = hrvSamples && hrvSamples.length > 0 ? Math.round(hrvSamples[0].value) : undefined;
          }

          // Steps
          const steps = await new Promise<number>((resolve, reject) => {
            AppleHealthKit.getStepCount(
              { startDate: yesterday.toISOString(), endDate: now.toISOString() }, 
              (err: any, results: any) => {
                if (err) return reject(err);
                resolve(results?.value ?? 0);
              }
            );
          });

          // Sleep samples
          const sleepSamples: any[] = await new Promise((resolve, reject) => {
            AppleHealthKit.getSleepSamples(
              { startDate: yesterday.toISOString(), endDate: now.toISOString() }, 
              (err: any, results: any) => err ? reject(err) : resolve(results)
            );
          });

          // Calculate sleep quality
          let sleepQuality = undefined;
          if (sleepSamples && sleepSamples.length > 0) {
            let asleep = 0;
            let total = 0;
            for (const s of sleepSamples) {
              const start = new Date(s.startDate).getTime();
              const end = new Date(s.endDate).getTime();
              const dur = Math.max(0, end - start);
              total += dur;
              const category = (s.value || '').toString().toLowerCase();
              if (category.includes('asleep')) {
                asleep += dur;
              }
            }
            if (total > 0) sleepQuality = Math.round((asleep / total) * 100);
          }

          // Active energy
          const activeEnergy: number = await new Promise((resolve) => {
            AppleHealthKit.getActiveEnergyBurned(
              { startDate: yesterday.toISOString(), endDate: now.toISOString() }, 
              (err: any, results: any) => {
                if (err) return resolve(0);
                resolve(Math.round(results?.value ?? 0));
              }
            );
          });

          // Workouts
          const workouts: any[] = await new Promise((resolve) => {
            AppleHealthKit.getSamples({
              startDate: yesterday.toISOString(),
              endDate: now.toISOString(),
              type: 'Workout',
              ascending: false,
              limit: 10,
            }, (err: any, results: any) => {
              if (err) return resolve([]);
              resolve(results || []);
            });
          });

          return {
            heartRate,
            hrv,
            steps,
            sleepQuality,
            activeEnergy,
            workouts,
          };
        } catch (error) {
          console.error('Error fetching HealthKit metrics:', error);
          return {};
        }
      },
    };
  }
} catch (error) {
  console.log('react-native-health not available - Apple Health features will be disabled');
}

export default AppleHealthService;
