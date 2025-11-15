/**
 * Dataset Service
 * Manages progression through the realistic health dataset
 * Replaces random data generation with pre-generated medical patterns
 */

import { HEALTH_DATASET, HealthDataPoint, getDataPoint, getNextDataPoint, getCurrentDataPoint, resetDataIndex } from '../data/healthDataset';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DATASET_INDEX_KEY = '@health_dataset_index';
const DATASET_MODE_KEY = '@health_dataset_mode';

export type DatasetMode = 'sequential' | 'time-based' | 'random' | 'disabled';

class DatasetService {
  private currentIndex: number = 0; // Will be set to high-risk in constructor
  private mode: DatasetMode = 'sequential';
  private startTime: Date | null = null;

  constructor() {
    // HACKATHON MODE: Always start at high-risk entry for demo
    this.currentIndex = 0; // Start at beginning (now has high risk)
    this.saveState();
  }

  /**
   * Load saved state from AsyncStorage
   */
  private async loadState() {
    try {
      const savedIndex = await AsyncStorage.getItem(DATASET_INDEX_KEY);
      const savedMode = await AsyncStorage.getItem(DATASET_MODE_KEY) as DatasetMode;
      
      if (savedIndex) {
        this.currentIndex = parseInt(savedIndex, 10);
      }
      
      if (savedMode) {
        this.mode = savedMode;
      }
    } catch (error) {
      console.error('Error loading dataset state:', error);
    }
  }

  /**
   * Save current state to AsyncStorage
   */
  private async saveState() {
    try {
      await AsyncStorage.setItem(DATASET_INDEX_KEY, this.currentIndex.toString());
      await AsyncStorage.setItem(DATASET_MODE_KEY, this.mode);
    } catch (error) {
      console.error('Error saving dataset state:', error);
    }
  }

  /**
   * Set the dataset mode
   */
  public async setMode(mode: DatasetMode) {
    this.mode = mode;
    await this.saveState();
  }

  /**
   * Get current mode
   */
  public getMode(): DatasetMode {
    return this.mode;
  }

  /**
   * Get next data point based on mode
   */
  public async getNext(): Promise<HealthDataPoint | null> {
    if (this.mode === 'disabled') {
      return null;
    }

    let dataPoint: HealthDataPoint | null = null;

    switch (this.mode) {
      case 'sequential':
        // Use our index, not the global one
        dataPoint = getDataPoint(this.currentIndex);
        this.currentIndex = (this.currentIndex + 1) % HEALTH_DATASET.length;
        console.log(`📊 Dataset: Entry #${this.currentIndex}/${HEALTH_DATASET.length}`);
        break;

      case 'time-based':
        // Calculate which data point based on elapsed time
        if (!this.startTime) {
          this.startTime = new Date();
        }
        const minutesElapsed = (Date.now() - this.startTime.getTime()) / (1000 * 60);
        // Progress through dataset: 1 entry per 5 minutes = ~8 hours for 100 entries
        const index = Math.floor(minutesElapsed / 5) % HEALTH_DATASET.length;
        dataPoint = getDataPoint(index);
        this.currentIndex = index;
        break;

      case 'random':
        const randomIndex = Math.floor(Math.random() * HEALTH_DATASET.length);
        dataPoint = getDataPoint(randomIndex);
        this.currentIndex = randomIndex;
        break;
    }

    await this.saveState();
    return dataPoint;
  }

  /**
   * Get current data point without progressing
   */
  public getCurrent(): HealthDataPoint {
    return getDataPoint(this.currentIndex);
  }

  /**
   * Get specific data point by index
   */
  public getByIndex(index: number): HealthDataPoint | null {
    return getDataPoint(index);
  }

  /**
   * Reset to high-risk entry (for hackathon demo)
   */
  public async reset() {
    resetDataIndex();
    this.currentIndex = 0; // Start from beginning (now has high-risk entries)
    this.startTime = null;
    await this.saveState();
  }

  /**
   * Jump to specific index
   */
  public async jumpTo(index: number) {
    if (index < 0 || index >= HEALTH_DATASET.length) {
      throw new Error(`Index ${index} out of bounds (0-${HEALTH_DATASET.length - 1})`);
    }
    this.currentIndex = index;
    await this.saveState();
  }

  /**
   * Get dataset info
   */
  public getInfo() {
    return {
      totalEntries: HEALTH_DATASET.length,
      currentIndex: this.currentIndex,
      mode: this.mode,
      dateRange: {
        start: HEALTH_DATASET[0].timestamp,
        end: HEALTH_DATASET[HEALTH_DATASET.length - 1].timestamp,
      },
      migraineCount: HEALTH_DATASET.filter(d => d.hasMigraine).length,
    };
  }

  /**
   * Convert dataset entry to wearable data format
   */
  public toWearableData(dataPoint: HealthDataPoint) {
    return {
      timestamp: dataPoint.timestamp,
      hrv: dataPoint.hrv,
      heartRate: dataPoint.heartRate,
      stress: dataPoint.stress,
      sleepQuality: dataPoint.sleepQuality,
      steps: dataPoint.steps,
      isSimulated: false, // Dataset is based on realistic patterns, not truly simulated
    };
  }

  /**
   * Convert dataset entry to phone data format
   */
  public toPhoneData(dataPoint: HealthDataPoint) {
    return {
      screenTimeMinutes: dataPoint.screenTimeMinutes,
      notificationCount: dataPoint.notificationCount,
      activityLevel: dataPoint.activityLevel,
      typingSpeed: 45 + Math.random() * 10, // Not in dataset, generate
      typingErrors: Math.floor(Math.random() * 5),
      deviceInfo: {
        battery: 50 + Math.random() * 50,
        brightness: 60 + Math.random() * 30,
      },
    };
  }

  /**
   * Convert dataset entry to weather data format
   */
  public toWeatherData(dataPoint: HealthDataPoint) {
    return {
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
      },
      weather: {
        temperature: dataPoint.temperature,
        humidity: dataPoint.humidity,
        pressure: dataPoint.pressure,
        uvIndex: dataPoint.uvIndex,
        description: dataPoint.pressure < 1010 ? 'Cloudy' : 'Clear',
      },
    };
  }

  /**
   * Convert dataset entry to calendar data format
   */
  public toCalendarData(dataPoint: HealthDataPoint) {
    return {
      eventsToday: dataPoint.calendarEvents,
      busyHoursToday: Math.floor(dataPoint.calendarEvents * 1.5),
      stressScore: dataPoint.calendarStress,
      load: dataPoint.calendarStress, // Add alias for calendar load
      upcomingHighStressPeriods: dataPoint.calendarStress > 60 ? ['Next 3 hours'] : [],
    };
  }

  /**
   * Convert dataset entry to sleep data format
   */
  public toSleepData(dataPoint: HealthDataPoint) {
    // Calculate sleep metrics from dataset
    const sleepMinutes = dataPoint.sleepHours * 60;
    const optimalSleep = 8 * 60; // 8 hours optimal
    const sleepDebt = Math.max(0, (optimalSleep - sleepMinutes) / 60);
    
    // Estimate sleep session times (assume sleep from 11pm to wake)
    const today = new Date();
    const sleepStart = new Date(today);
    sleepStart.setHours(23, 0, 0, 0); // 11 PM
    const sleepEnd = new Date(sleepStart);
    sleepEnd.setHours(23 + dataPoint.sleepHours, 0, 0, 0);
    
    return {
      sleepStartTime: sleepStart.toISOString(),
      sleepEndTime: sleepEnd.toISOString(),
      totalSleepMinutes: sleepMinutes,
      sleepHours: dataPoint.sleepHours,
      sleepQuality: dataPoint.sleepQuality,
      sleepDebt: sleepDebt,
      restlessness: dataPoint.sleepQuality < 60 ? 'High' : dataPoint.sleepQuality < 80 ? 'Medium' : 'Low',
      isInferred: false, // Dataset values are "real"
    };
  }

  /**
   * Check if current data point indicates a migraine
   */
  public hasMigraineTrigger(): boolean {
    const current = this.getCurrent();
    return current.hasMigraine;
  }

  /**
   * Get migraine risk from current data point
   */
  public getCurrentRisk(): number {
    const current = this.getCurrent();
    return current.migraineRisk;
  }
}

// Singleton instance
let instance: DatasetService | null = null;

export function getDatasetService(): DatasetService {
  if (!instance) {
    instance = new DatasetService();
  }
  return instance;
}

export default getDatasetService;
