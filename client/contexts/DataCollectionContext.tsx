/**
 * Data Collection Context
 * Orchestrates all passive data collectors and manages background tasks
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
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

const WEARABLE_TASK = 'wearable-data-collection';
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
  
  const wearableInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const phoneInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const weatherInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const calendarInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const appState = useRef(AppState.currentState);

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
   */
  const collectWearableData = async () => {
    try {
      const simulator = getWearableSimulator();
      const data = simulator.getCurrentData();
      const risk = simulator.getCurrentRisk();
      
      setCurrentRisk(Math.round(risk));
      setLatestData((prev: any) => ({ ...prev, wearable: data }));
      
      // Send to backend every minute (not every 5 seconds to reduce load)
      if (Date.now() % 60000 < 5000) {
        await sendToBackend('/api/metrics/wearable', {
          hrv: data.hrv,
          heartRate: data.heartRate,
          stress: data.stress,
          sleepQuality: data.sleepQuality,
          steps: data.steps,
          isSimulated: data.isSimulated,
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
      const collector = getPhoneDataCollector();
      const data = await collector.collectData();
      
      setLatestData((prev: any) => ({ ...prev, phone: data }));
      
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
      const collector = getLocationWeatherCollector();
      const data = await collector.collectData();
      
      setLatestData((prev: any) => ({ ...prev, weather: data }));
      
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
      
      setLatestData((prev: any) => ({ ...prev, sleep: data }));
      
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
      const integration = getCalendarIntegration();
      const data = await integration.collectData();
      
      setLatestData((prev: any) => ({ ...prev, calendar: data }));
      
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

  const value: DataCollectionContextType = {
    isCollecting,
    latestData,
    currentRisk,
    startCollection,
    stopCollection,
    requestPermissions,
  };

  return (
    <DataCollectionContext.Provider value={value}>
      {children}
    </DataCollectionContext.Provider>
  );
};
