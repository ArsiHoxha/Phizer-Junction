/**
 * Data Collection Context
 * Orchestrates all passive data collectors and manages background tasks
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { getWearableSimulator } from '../services/collectors/wearable';
import { getPhoneDataCollector } from '../services/collectors/phoneData';
import { getSleepTracker } from '../services/collectors/sleep';
import { getLocationWeatherCollector } from '../services/collectors/location';
import { getCalendarIntegration } from '../services/collectors/calendar';
import { setAuthToken } from '../services/api';
import axios from 'axios';
import { BACKEND_URL } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppleHealthService from '../services/appleHealthService';
import { getDatasetService } from '../services/datasetService';
import { NotificationService } from '../services/notificationService';

const WEARABLE_TASK = 'wearable-data-collection';
const USE_DATASET_KEY = '@use_realistic_dataset';
const LATEST_DATA_KEY = '@latest_health_data';
const CURRENT_RISK_KEY = '@current_migraine_risk';
const LAST_NOTIFICATION_KEY = '@last_notification_time';
const NOTIFIED_RISK_LEVELS_KEY = '@notified_risk_levels';
const PHONE_TASK = 'phone-data-collection';
const WEATHER_TASK = 'weather-data-collection';
const SLEEP_TASK = 'sleep-data-collection';
const CALENDAR_TASK = 'calendar-data-collection';

interface DataCollectionContextType {
  isCollecting: boolean;
  latestData: {
    wearable: any;
    phone: any;
    weather: any;
    sleep: any;
    calendar: any;
  } | null;
  currentRisk: number;
  startCollection: () => Promise<void>;
  stopCollection: () => void;
  requestPermissions: () => Promise<void>;
  useDataset: boolean;
  toggleDataset: () => Promise<void>;
  resetDataset: () => Promise<void>;
}

const DataCollectionContext = createContext<DataCollectionContextType | undefined>(undefined);

export const useDataCollection = () => {
  const context = useContext(DataCollectionContext);
  if (!context) {
    throw new Error('useDataCollection must be used within DataCollectionProvider');
  }
  return context;
};

export const DataCollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken, isSignedIn } = useAuth();
  const [isCollecting, setIsCollecting] = useState(false);
  const [currentRisk, setCurrentRisk] = useState(34);
  const [latestData, setLatestData] = useState<any>(null);
  const [useDataset, setUseDataset] = useState(false);
  
  const wearableInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const phoneInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const weatherInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const calendarInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const appState = useRef(AppState.currentState);
  const lastNotifiedRisk = useRef<number>(-1);

  // Load persisted data on mount
  useEffect(() => {
    loadPersistedData();
  }, []);

  /**
   * Load all persisted data from AsyncStorage
   */
  const loadPersistedData = async () => {
    try {
      // Load dataset preference
      const datasetPref = await AsyncStorage.getItem(USE_DATASET_KEY);
      setUseDataset(datasetPref === 'true');

      // Load latest data
      const savedData = await AsyncStorage.getItem(LATEST_DATA_KEY);
      if (savedData) {
        setLatestData(JSON.parse(savedData));
      }

      // Load current risk
      const savedRisk = await AsyncStorage.getItem(CURRENT_RISK_KEY);
      if (savedRisk) {
        setCurrentRisk(parseInt(savedRisk, 10));
      }

      // Load last notified risk level
      const lastNotified = await AsyncStorage.getItem(NOTIFIED_RISK_LEVELS_KEY);
      if (lastNotified) {
        lastNotifiedRisk.current = parseInt(lastNotified, 10);
      }

      console.log('✅ Loaded persisted health data');
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  };

  /**
   * Persist latest data to AsyncStorage
   */
  const persistLatestData = async (data: any) => {
    try {
      await AsyncStorage.setItem(LATEST_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error persisting latest data:', error);
    }
  };

  /**
   * Persist current risk to AsyncStorage
   */
  const persistCurrentRisk = async (risk: number) => {
    try {
      await AsyncStorage.setItem(CURRENT_RISK_KEY, risk.toString());
    } catch (error) {
      console.error('Error persisting current risk:', error);
    }
  };

  /**
   * Check risk and automatically send notifications
   */
  const checkAndNotify = async (risk: number) => {
    try {
      // Only notify if risk has significantly changed (by 10+ points) or crossed important thresholds
      const riskDifference = Math.abs(risk - lastNotifiedRisk.current);
      const crossedThreshold = 
        (lastNotifiedRisk.current < 30 && risk >= 30) ||
        (lastNotifiedRisk.current < 50 && risk >= 50) ||
        (lastNotifiedRisk.current < 70 && risk >= 70);

      if (riskDifference >= 10 || crossedThreshold) {
        await NotificationService.checkAndNotifyRiskLevel(risk);
        lastNotifiedRisk.current = risk;
        await AsyncStorage.setItem(NOTIFIED_RISK_LEVELS_KEY, risk.toString());
      }
    } catch (error) {
      console.error('Error checking and notifying:', error);
    }
  };

  /**
   * Request all necessary permissions
   */
  const requestPermissions = async () => {
    try {
      const locationCollector = getLocationWeatherCollector();
      await locationCollector.requestPermissions();
      
      const calendarIntegration = getCalendarIntegration();
      await calendarIntegration.requestPermissions();
      
      console.log('✅ Permissions requested');
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  /**
   * Send data to backend
   */
  const sendToBackend = async (endpoint: string, data: any) => {
    try {
      const token = await getToken();
      if (!token) return;
      
      await axios.post(`${BACKEND_URL}${endpoint}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log(`✅ Sent data to ${endpoint}`);
    } catch (error) {
      console.error(`Error sending data to ${endpoint}:`, error);
    }
  };

  /**
   * Collect wearable data (every 5 seconds for real-time updates)
   * Uses realistic dataset OR merges Apple Health data if available
   */
  const collectWearableData = async () => {
    try {
      let mergedData: any;
      let risk: number;

      // Priority: Dataset > Apple Health > Simulator
      if (useDataset) {
        // Use realistic dataset
        const datasetService = getDatasetService();
        const dataPoint = await datasetService.getNext();
        
        if (dataPoint) {
          mergedData = datasetService.toWearableData(dataPoint);
          risk = datasetService.getCurrentRisk();
        } else {
          // Fallback to simulator if dataset disabled
          const simulator = getWearableSimulator();
          mergedData = simulator.getCurrentData();
          risk = simulator.getCurrentRisk();
        }
      } else {
        // Use simulator
        const simulator = getWearableSimulator();
        mergedData = simulator.getCurrentData();
        risk = simulator.getCurrentRisk();
        
        // Check if Apple Health is connected and fetch real data
        if (Platform.OS === 'ios') {
          const appleHealthConnected = await AsyncStorage.getItem('apple_health_connected');
          if (appleHealthConnected === 'true') {
            try {
              const healthMetrics: any = await AppleHealthService.getLatestMetrics();
              // Merge Apple Health data, preferring real data over simulated
              if (healthMetrics.heartRate) mergedData.heartRate = healthMetrics.heartRate;
              if (healthMetrics.hrv) mergedData.hrv = healthMetrics.hrv;
              if (healthMetrics.steps !== undefined) mergedData.steps = healthMetrics.steps;
              if (healthMetrics.sleepQuality) mergedData.sleepQuality = healthMetrics.sleepQuality;
              // Mark as real data when available
              if (healthMetrics.heartRate || healthMetrics.hrv) {
                mergedData.isSimulated = false;
              }
            } catch (error) {
              console.error('Error fetching Apple Health data:', error);
            }
          }
        }
      }
      
      const roundedRisk = Math.round(risk);
      setCurrentRisk(roundedRisk);
      
      const updatedData = { ...latestData, wearable: mergedData };
      setLatestData(updatedData);
      
      // Persist to AsyncStorage
      await persistLatestData(updatedData);
      await persistCurrentRisk(roundedRisk);
      
      // Automatically check and send notifications
      await checkAndNotify(roundedRisk);
      
      // Send to backend every minute (not every 5 seconds to reduce load)
      if (Date.now() % 60000 < 5000) {
        await sendToBackend('/api/metrics/wearable', {
          hrv: mergedData.hrv,
          heartRate: mergedData.heartRate,
          stress: mergedData.stress,
          sleepQuality: mergedData.sleepQuality,
          steps: mergedData.steps,
          isSimulated: mergedData.isSimulated,
        });
      }
    } catch (error) {
      console.error('Error collecting wearable data:', error);
    }
  };

  /**
   * Collect phone data (every 10 minutes)
   */
  const collectPhoneData = async () => {
    try {
      let data: any;

      if (useDataset) {
        // Use dataset
        const datasetService = getDatasetService();
        const dataPoint = datasetService.getCurrent();
        data = datasetService.toPhoneData(dataPoint);
      } else {
        // Use collector
        const collector = getPhoneDataCollector();
        data = await collector.collectData();
      }
      
      const updatedData = { ...latestData, phone: data };
      setLatestData(updatedData);
      await persistLatestData(updatedData);
      
      await sendToBackend('/api/metrics/phone', {
        screenTimeMinutes: data.screenTimeMinutes,
        notificationCount: data.notificationCount,
        activityLevel: data.activityLevel,
        typingSpeed: data.typingSpeed,
        typingErrors: data.typingErrors,
        deviceInfo: data.deviceInfo,
      });
    } catch (error) {
      console.error('Error collecting phone data:', error);
    }
  };

  /**
   * Collect weather data (every hour)
   */
  const collectWeatherData = async () => {
    try {
      let data: any;

      if (useDataset) {
        // Use dataset
        const datasetService = getDatasetService();
        const dataPoint = datasetService.getCurrent();
        data = datasetService.toWeatherData(dataPoint);
      } else {
        // Use collector
        const collector = getLocationWeatherCollector();
        data = await collector.collectData();
      }
      
      const updatedData = { ...latestData, weather: data };
      setLatestData(updatedData);
      await persistLatestData(updatedData);
      
      await sendToBackend('/api/metrics/location', {
        location: data.location,
        weather: data.weather,
      });
    } catch (error) {
      console.error('Error collecting weather data:', error);
    }
  };

  /**
   * Collect sleep data (every 30 minutes during night, check for sleep sessions)
   */
  const collectSleepData = async () => {
    try {
      const tracker = getSleepTracker();
      const data = tracker.collectData();
      
      const updatedData = { ...latestData, sleep: data };
      setLatestData(updatedData);
      await persistLatestData(updatedData);
      
      // Only send complete sleep sessions
      if (data.sleepEndTime) {
        await sendToBackend('/api/metrics/sleep', {
          sleepStartTime: data.sleepStartTime,
          sleepEndTime: data.sleepEndTime,
          totalSleepMinutes: data.totalSleepMinutes,
          sleepQuality: data.sleepQuality,
          sleepDebt: data.sleepDebt,
          restlessness: data.restlessness,
          isInferred: data.isInferred,
        });
      }
    } catch (error) {
      console.error('Error collecting sleep data:', error);
    }
  };

  /**
   * Collect calendar data (every 30 minutes during work hours)
   */
  const collectCalendarData = async () => {
    try {
      let data: any;

      if (useDataset) {
        // Use dataset
        const datasetService = getDatasetService();
        const dataPoint = datasetService.getCurrent();
        data = datasetService.toCalendarData(dataPoint);
      } else {
        // Use collector
        const integration = getCalendarIntegration();
        data = await integration.collectData();
      }
      
      const updatedData = { ...latestData, calendar: data };
      setLatestData(updatedData);
      await persistLatestData(updatedData);
      
      await sendToBackend('/api/metrics/calendar', {
        eventsToday: data.eventsToday,
        busyHoursToday: data.busyHoursToday,
        stressScore: data.stressScore,
        upcomingHighStressPeriods: data.upcomingHighStressPeriods,
      });
    } catch (error) {
      console.error('Error collecting calendar data:', error);
    }
  };

  /**
   * Start all data collection
   */
  const startCollection = async () => {
    if (isCollecting || !isSignedIn) return;
    
    console.log('🚀 Starting passive data collection...');
    setIsCollecting(true);
    
    // Set auth token for API requests
    const token = await getToken();
    if (token) {
      setAuthToken(token);
    }
    
    // Request permissions first
    await requestPermissions();
    
    // Request notification permissions and enable notifications
    await NotificationService.requestPermissions();
    await NotificationService.enableNotifications();
    
    // Start wearable data collection (every 5 seconds)
    wearableInterval.current = setInterval(collectWearableData, 5000);
    
    // Start phone data collection (every 10 minutes)
    phoneInterval.current = setInterval(collectPhoneData, 10 * 60 * 1000);
    collectPhoneData(); // Collect immediately
    
    // Start weather data collection (every hour)
    weatherInterval.current = setInterval(collectWeatherData, 60 * 60 * 1000);
    collectWeatherData(); // Collect immediately
    
    // Start sleep tracking (every 30 minutes)
    sleepInterval.current = setInterval(collectSleepData, 30 * 60 * 1000);
    collectSleepData(); // Collect immediately
    
    // Start calendar data collection (every 30 minutes)
    calendarInterval.current = setInterval(collectCalendarData, 30 * 60 * 1000);
    collectCalendarData(); // Collect immediately
    
    console.log('✅ Data collection started');
  };

  /**
   * Stop all data collection
   */
  const stopCollection = () => {
    console.log('⏹️ Stopping data collection...');
    
    if (wearableInterval.current) clearInterval(wearableInterval.current);
    if (phoneInterval.current) clearInterval(phoneInterval.current);
    if (weatherInterval.current) clearInterval(weatherInterval.current);
    if (sleepInterval.current) clearInterval(sleepInterval.current);
    if (calendarInterval.current) clearInterval(calendarInterval.current);
    
    setIsCollecting(false);
    console.log('✅ Data collection stopped');
  };

  /**
   * Handle app state changes (background/foreground)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
        // Resume collection if it was running
        if (isCollecting && isSignedIn) {
          startCollection();
        }
      } else if (nextAppState === 'background') {
        console.log('App has gone to the background!');
        // Keep collection running in background (iOS limitations apply)
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isCollecting, isSignedIn]);

  /**
   * Auto-start collection when user signs in
   */
  useEffect(() => {
    if (isSignedIn && !isCollecting) {
      startCollection();
    } else if (!isSignedIn && isCollecting) {
      stopCollection();
    }
    
    // Cleanup on unmount
    return () => {
      stopCollection();
    };
  }, [isSignedIn]);

  /**
   * Toggle between dataset and real/simulated data
   */
  const toggleDataset = async () => {
    const newValue = !useDataset;
    setUseDataset(newValue);
    await AsyncStorage.setItem(USE_DATASET_KEY, newValue.toString());
    
    const datasetService = getDatasetService();
    await datasetService.setMode(newValue ? 'sequential' : 'disabled');
    
    console.log(`📊 Dataset mode: ${newValue ? 'ENABLED' : 'DISABLED'}`);
  };

  /**
   * Reset dataset to beginning
   */
  const resetDataset = async () => {
    const datasetService = getDatasetService();
    await datasetService.reset();
    console.log('🔄 Dataset reset to beginning');
  };

  const value: DataCollectionContextType = {
    isCollecting,
    latestData,
    currentRisk,
    startCollection,
    stopCollection,
    requestPermissions,
    useDataset,
    toggleDataset,
    resetDataset,
  };

  return (
    <DataCollectionContext.Provider value={value}>
      {children}
    </DataCollectionContext.Provider>
  );
};
