import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Dimensions, SafeAreaView, Modal, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-gifted-charts';
import { CircularProgress } from 'react-native-circular-progress';
import { useDataCollection } from '../../contexts/DataCollectionContext';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { BACKEND_URL } from '../../config/config';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from '../../services/notificationService';
import WidgetDataService from '../../services/widgetDataService';
import { userAPI, setAuthToken } from '../../services/api';
import * as StreakService from '../../services/streakService';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const { latestData, currentRisk, isCollecting, useDataset } = useDataCollection();
  const { isDark, colors } = useTheme();
  const { getToken } = useAuth();
  const { user } = useUser();
  
  // AI Recommendations Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Triggers Modal State
  const [showTriggersModal, setShowTriggersModal] = useState(false);
  
  // Water and Coffee Intake
  const [waterIntake, setWaterIntake] = useState(0); // glasses
  const [coffeeIntake, setCoffeeIntake] = useState(0); // cups
  
  // Historical data for charts (last 7 data points)
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  // User triggers from onboarding
  const [userTriggers, setUserTriggers] = useState<string[]>([]);
  const [loadingTriggers, setLoadingTriggers] = useState(true);

  // Streak tracking
  const [streakData, setStreakData] = useState<StreakService.StreakData | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);

  // Load intake data and request permissions on mount
  useEffect(() => {
    loadIntakeData();
    requestNotificationPermissions();
    loadUserTriggers();
    loadAndRecordStreak();
  }, []);

  // NOTE: Notifications are now handled in DataCollectionContext
  // to ensure they use the most up-to-date risk calculation
  // Removed duplicate notification trigger from dashboard

  // Update widget data when risk changes
  useEffect(() => {
    const updateWidget = async () => {
      try {
        const widgetData = WidgetDataService.formatForWidget(
          currentRisk,
          [], // triggers will be added when we have them
          latestData?.wearable || {}
        );
        await WidgetDataService.updateWidgetData(widgetData);
      } catch (error) {
        console.error('Error updating widget:', error);
      }
    };
    
    if (currentRisk >= 0) {
      updateWidget();
    }
  }, [currentRisk, latestData?.wearable]);

  const requestNotificationPermissions = async () => {
    await NotificationService.requestPermissions();
  };

  const loadUserTriggers = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available');
        setUserTriggers([]);
        return;
      }
      
      const token = await getToken();
      setAuthToken(token);
      
      const userData = await userAPI.getProfile(user.id);
      console.log('User data received:', userData);
      
      if (userData && userData.user && userData.user.triggers) {
        console.log('User triggers:', userData.user.triggers);
        setUserTriggers(userData.user.triggers);
      } else {
        console.log('No triggers found in user data');
        setUserTriggers([]);
      }
    } catch (error: any) {
      // If user doesn't exist (404) or any other error, just set empty triggers
      if (error?.response?.status === 404) {
        console.log('ℹ️ User profile not found (new user) - using empty triggers');
      } else {
        console.error('Error loading user triggers:', error);
      }
      setUserTriggers([]);
    } finally {
      setLoadingTriggers(false);
    }
  };

  const loadAndRecordStreak = async () => {
    try {
      const data = await StreakService.recordAppOpen();
      setStreakData(data);
      console.log('📅 Streak loaded:', data);
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  };

  const loadIntakeData = async () => {
    try {
      const today = new Date().toDateString();
      const savedWater = await AsyncStorage.getItem(`water_${today}`);
      const savedCoffee = await AsyncStorage.getItem(`coffee_${today}`);
      
      if (savedWater) setWaterIntake(parseInt(savedWater));
      if (savedCoffee) setCoffeeIntake(parseInt(savedCoffee));
    } catch (error) {
      console.error('Error loading intake data:', error);
    }
  };

  const saveIntakeData = async (type: 'water' | 'coffee', value: number) => {
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem(`${type}_${today}`, value.toString());
      
      // Send notification reminders
      if (type === 'water' && value < 2) {
        NotificationService.sendReminderNotification('water', value);
      } else if (type === 'coffee' && value >= 3) {
        NotificationService.sendReminderNotification('coffee', value);
      }
    } catch (error) {
      console.error('Error saving intake data:', error);
    }
  };

  const incrementWater = () => {
    const newValue = waterIntake + 1;
    setWaterIntake(newValue);
    saveIntakeData('water', newValue);
  };

  const decrementWater = () => {
    if (waterIntake > 0) {
      const newValue = waterIntake - 1;
      setWaterIntake(newValue);
      saveIntakeData('water', newValue);
    }
  };

  const incrementCoffee = () => {
    const newValue = coffeeIntake + 1;
    setCoffeeIntake(newValue);
    saveIntakeData('coffee', newValue);
  };

  const decrementCoffee = () => {
    if (coffeeIntake > 0) {
      const newValue = coffeeIntake - 1;
      setCoffeeIntake(newValue);
      saveIntakeData('coffee', newValue);
    }
  };

  useEffect(() => {
    if (latestData?.wearable) {
      setHistoricalData(prev => {
        const newData = [...prev, {
          timestamp: new Date(),
          risk: currentRisk,
          hrv: latestData.wearable.hrv,
          heartRate: latestData.wearable.heartRate,
          stress: latestData.wearable.stress,
          sleepQuality: latestData.wearable.sleepQuality,
          screenTime: latestData.phone?.screenTimeMinutes || 0,
          pressure: latestData.weather?.weather?.pressure || 1013,
          temperature: latestData.weather?.weather?.temperature || 20,
          notificationCount: latestData.phone?.notificationCount || 0,
          calendarStress: latestData.calendar?.stressScore || latestData.calendar?.load || 0,
        }];
        // Keep last 20 data points
        return newData.slice(-20);
      });
    }
  }, [latestData, currentRisk]);

  // Trigger metadata for display
  const triggerMetadata: { [key: string]: { name: string; icon: string; color: string } } = {
    stress: { name: 'Stress & Anxiety', icon: 'alert-circle', color: '#EF4444' },
    screen_time: { name: 'Screen Time', icon: 'phone-portrait', color: '#8B5CF6' },
    poor_sleep: { name: 'Poor Sleep', icon: 'moon', color: '#3B82F6' },
    loud_noise: { name: 'Loud Noise', icon: 'volume-high', color: '#F59E0B' },
    weather: { name: 'Weather Changes', icon: 'cloud', color: '#06B6D4' },
    hormones: { name: 'Hormonal Changes', icon: 'fitness', color: '#EC4899' },
    caffeine: { name: 'Caffeine', icon: 'cafe', color: '#78350F' },
    alcohol: { name: 'Alcohol', icon: 'wine', color: '#DC2626' },
    dehydration: { name: 'Dehydration', icon: 'water', color: '#0EA5E9' },
    bright_light: { name: 'Bright Light', icon: 'sunny', color: '#FBBF24' },
    strong_smells: { name: 'Strong Smells', icon: 'flower', color: '#A855F7' },
    physical_activity: { name: 'Physical Activity', icon: 'barbell', color: '#10B981' },
    skipped_meals: { name: 'Skipped Meals', icon: 'restaurant', color: '#F97316' },
    neck_tension: { name: 'Neck/Shoulder Tension', icon: 'body', color: '#6366F1' },
  };

  // Calculate dynamic metrics from real data
  const wearableData = latestData?.wearable || {
    hrv: 65,
    heartRate: 70,
    stress: 45,
    sleepQuality: 75,
    steps: 0,
  };

  const phoneData = latestData?.phone || {
    screenTimeMinutes: 0,
    notificationCount: 0,
    activityLevel: 'light',
  };

  const sleepData = latestData?.sleep || {
    totalSleepMinutes: 420, // 7 hours default
    sleepHours: 7,
    sleepQuality: 75,
    sleepDebt: 0,
  };

  const weatherData = latestData?.weather || {
    weather: {
      temperature: 20,
      humidity: 50,
      pressure: 1013,
      uvIndex: 3,
    },
  };

  const calendarData = latestData?.calendar || {
    eventsToday: 0,
    busyHoursToday: 0,
    stressScore: 0,
    load: 0,
  };

  // DEBUG: Log actual data values
  if (useDataset && latestData) {
    console.log('📊 Dashboard Data Check:', {
      sleep: sleepData.sleepHours || (sleepData.totalSleepMinutes / 60),
      screen: (phoneData.screenTimeMinutes / 60).toFixed(1),
      pressure: weatherData.weather?.pressure,
      calendarStress: calendarData.stressScore || calendarData.load,
      notifications: phoneData.notificationCount,
    });
  }

  const riskLevel = currentRisk;
  const riskStatus = riskLevel < 40 ? 'Low' : riskLevel < 70 ? 'Medium' : 'High';
  const riskColor = riskLevel < 40 ? 'bg-green-500' : riskLevel < 70 ? 'bg-yellow-500' : 'bg-red-500';

  // Dynamic metrics from real data - SHOWS USER'S TRACKED TRIGGERS
  const calculateMetricsCards = () => {
    const metricsCards: any[] = [];
    
    // Helper function to check if value is valid
    const isValidValue = (value: any) => {
      return value !== undefined && value !== null && value !== '' && 
             !isNaN(parseFloat(value.toString())) && parseFloat(value.toString()) !== 0;
    };
    
    // Always show these core metrics first (only if valid)
    if (isValidValue(wearableData.hrv)) {
      metricsCards.push({ 
        label: 'HRV', 
        value: Math.round(wearableData.hrv).toString(), 
        unit: 'ms', 
        trend: wearableData.hrv < 50 ? 'down' : 'up',
        change: wearableData.hrv < 50 ? 'Low' : 'Normal',
        triggerId: 'hrv'
      });
    }
    
    if (isValidValue(sleepData.totalSleepMinutes)) {
      metricsCards.push({ 
        label: 'Sleep', 
        value: (sleepData.totalSleepMinutes / 60).toFixed(1), 
        unit: 'hrs', 
        trend: sleepData.totalSleepMinutes < 420 ? 'down' : 'up',
        change: sleepData.sleepDebt > 2 ? `Debt: ${sleepData.sleepDebt.toFixed(1)}h` : 'Good',
        triggerId: 'lack_of_sleep'
      });
    }
    
    if (isValidValue(wearableData.stress)) {
      metricsCards.push({ 
        label: 'Stress', 
        value: Math.round(wearableData.stress).toString(), 
        unit: '%', 
        trend: wearableData.stress > 50 ? 'up' : 'down',
        change: wearableData.stress > 70 ? 'High' : wearableData.stress > 40 ? 'Medium' : 'Low',
        triggerId: 'stress'
      });
    }
    
    // Add user-selected triggers as metric cards (only if valid)
    if (userTriggers && userTriggers.length > 0) {
      userTriggers.forEach(triggerId => {
        // Skip if already added
        if (metricsCards.find(m => m.triggerId === triggerId)) return;
        
        switch (triggerId) {
          case 'screen_time':
          case 'bright_light':
            const screenMinutes = phoneData.screenTimeMinutes || 0;
            if (screenMinutes > 0) {
              const screenHours = (screenMinutes / 60).toFixed(1);
              metricsCards.push({ 
                label: 'Screen', 
                value: screenHours, 
                unit: 'hrs', 
                trend: screenMinutes > 240 ? 'up' : 'down',
                change: screenMinutes > 300 ? 'High' : 'Normal',
                triggerId: 'screen_time'
              });
            }
            break;
          
          case 'weather_changes':
          case 'barometric_pressure':
            const pressure = weatherData.weather?.pressure;
            if (pressure && pressure !== 1013) { // Only show if not default value
              metricsCards.push({ 
                label: 'Pressure', 
                value: Math.round(pressure).toString(), 
                unit: 'hPa', 
                trend: pressure < 1010 ? 'down' : 'up',
                change: pressure < 1005 ? 'Very Low' : pressure < 1010 ? 'Low' : 'Normal',
                triggerId: 'barometric_pressure'
              });
            }
            const temp = weatherData.weather?.temperature;
            if (temp && temp !== 20) { // Only show if not default value
              metricsCards.push({ 
                label: 'Temp', 
                value: Math.round(temp).toString(), 
                unit: '°C', 
                trend: temp > 25 ? 'up' : temp < 15 ? 'down' : 'neutral',
                change: temp > 28 || temp < 10 ? 'Extreme' : 'Normal',
                triggerId: 'temperature'
              });
            }
            break;
          
          case 'dehydration':
            if (waterIntake > 0) {
              metricsCards.push({ 
                label: 'Water', 
                value: waterIntake.toString(), 
                unit: 'glasses', 
                trend: waterIntake < 6 ? 'down' : 'up',
                change: waterIntake < 4 ? 'Low' : waterIntake < 6 ? 'Moderate' : 'Good',
                triggerId: 'dehydration'
              });
            }
            break;
          
          case 'caffeine':
            if (coffeeIntake > 0) {
              metricsCards.push({ 
                label: 'Caffeine', 
                value: coffeeIntake.toString(), 
                unit: 'cups', 
                trend: coffeeIntake > 3 ? 'up' : 'down',
                change: coffeeIntake > 4 ? 'High' : coffeeIntake > 2 ? 'Moderate' : 'Low',
                triggerId: 'caffeine'
              });
            }
            break;
          
          case 'skipped_meals':
            const calStress = calendarData.stressScore || calendarData.load || 0;
            if (calStress > 0) {
              metricsCards.push({ 
                label: 'Calendar', 
                value: Math.round(calStress).toString(), 
                unit: '% busy', 
                trend: calStress > 60 ? 'up' : 'down',
                change: calStress > 75 ? 'Overload' : calStress > 50 ? 'Busy' : 'Light',
                triggerId: 'calendar'
              });
            }
            break;
          
          case 'loud_noises':
            if (phoneData.notificationCount > 0) {
              metricsCards.push({ 
                label: 'Notifications', 
                value: phoneData.notificationCount.toString(), 
                unit: 'today', 
                trend: phoneData.notificationCount > 80 ? 'up' : 'down',
                change: phoneData.notificationCount > 100 ? 'Excessive' : phoneData.notificationCount > 60 ? 'High' : 'Normal',
                triggerId: 'loud_noises'
              });
            }
            break;
          
          case 'physical_activity':
            const steps = wearableData.steps || 0;
            if (steps > 0) {
              metricsCards.push({ 
                label: 'Steps', 
                value: (steps / 1000).toFixed(1), 
                unit: 'k', 
                trend: steps > 5000 ? 'up' : 'down',
                change: steps < 3000 ? 'Sedentary' : steps < 6000 ? 'Light' : 'Active',
                triggerId: 'physical_activity'
              });
            }
            break;
        }
      });
    }
    
    // Return ALL metrics (not limited)
    return metricsCards;
  };

  const allMetrics = calculateMetricsCards();
  const metrics = allMetrics.slice(0, 4); // Show only 4 on main screen
  const additionalMetrics = allMetrics.slice(4); // Rest for modal/popup

  // Calculate COMPREHENSIVE dynamic triggers - ALL 12+ TRIGGERS WITH VALUES
  const calculateDynamicTriggers = () => {
    const dynamicTriggers: any[] = [];

    // 1. HRV (Heart Rate Variability) - Nervous System Stress
    const hrvValue = Math.round(wearableData.hrv);
    const hrvImpact = hrvValue < 40 ? 95 : hrvValue < 45 ? 85 : hrvValue < 55 ? 65 : 30;
    dynamicTriggers.push({ 
      name: 'HRV (Nervous System)', 
      value: `${hrvValue}ms`,
      impact: hrvImpact,
      active: hrvValue < 55,
      status: hrvValue < 40 ? 'Critical' : hrvValue < 55 ? 'Warning' : 'Normal',
      type: 'core'
    });

    // 2. Stress & Anxiety
    const stressValue = Math.round(wearableData.stress);
    const stressImpact = stressValue > 75 ? 90 : stressValue > 70 ? 80 : stressValue > 50 ? 60 : 20;
    dynamicTriggers.push({ 
      name: 'Stress & Anxiety', 
      value: `${stressValue}%`,
      impact: stressImpact,
      active: stressValue > 50,
      status: stressValue > 75 ? 'Extreme' : stressValue > 50 ? 'High' : 'Normal',
      type: 'core'
    });

    // 3. Sleep Duration
    const sleepHours = sleepData.sleepHours || 7;
    const sleepDurationImpact = sleepHours < 5 ? 85 : sleepHours < 6 ? 70 : sleepHours < 7 ? 50 : 20;
    dynamicTriggers.push({ 
      name: 'Sleep Duration', 
      value: `${sleepHours.toFixed(1)}h`,
      impact: sleepDurationImpact,
      active: sleepHours < 7,
      status: sleepHours < 5 ? 'Severe' : sleepHours < 6 ? 'Poor' : sleepHours < 7 ? 'Low' : 'Good',
      type: 'core'
    });

    // 4. Sleep Quality
    const sleepQuality = wearableData.sleepQuality || 75;
    const sleepQualityImpact = sleepQuality < 50 ? 80 : sleepQuality < 60 ? 70 : sleepQuality < 70 ? 50 : 20;
    dynamicTriggers.push({ 
      name: 'Sleep Quality', 
      value: `${Math.round(sleepQuality)}%`,
      impact: sleepQualityImpact,
      active: sleepQuality < 70,
      status: sleepQuality < 50 ? 'Very Poor' : sleepQuality < 70 ? 'Poor' : 'Good',
      type: 'core'
    });

    // 5. Screen Time / Bright Light Exposure
    const screenMinutes = phoneData.screenTimeMinutes || 180;
    const screenHours = (screenMinutes / 60).toFixed(1);
    const screenImpact = screenMinutes > 420 ? 75 : screenMinutes > 350 ? 60 : screenMinutes > 280 ? 40 : 15;
    dynamicTriggers.push({ 
      name: 'Screen Time / Bright Light', 
      value: `${screenHours}h`,
      impact: screenImpact,
      active: screenMinutes > 280,
      status: screenMinutes > 420 ? 'Excessive' : screenMinutes > 350 ? 'High' : screenMinutes > 280 ? 'Elevated' : 'Normal',
      type: 'environmental'
    });

    // 6. Weather / Barometric Pressure
    const pressure = weatherData.pressure || 1013;
    const pressureImpact = pressure < 1005 ? 75 : pressure < 1008 ? 65 : pressure < 1010 ? 45 : 10;
    dynamicTriggers.push({ 
      name: 'Barometric Pressure', 
      value: `${Math.round(pressure)} hPa`,
      impact: pressureImpact,
      active: pressure < 1010,
      status: pressure < 1005 ? 'Very Low' : pressure < 1010 ? 'Low' : 'Normal',
      type: 'environmental'
    });

    // 7. Calendar Stress / Overwhelming Schedule
    const calendarLoad = calendarData.load || 30;
    const calendarImpact = calendarLoad > 75 ? 70 : calendarLoad > 60 ? 55 : calendarLoad > 50 ? 35 : 10;
    dynamicTriggers.push({ 
      name: 'Schedule Overload', 
      value: `${Math.round(calendarLoad)}% busy`,
      impact: calendarImpact,
      active: calendarLoad > 50,
      status: calendarLoad > 75 ? 'Overwhelming' : calendarLoad > 50 ? 'High' : 'Normal',
      type: 'lifestyle'
    });

    // 8. Dehydration (water intake tracking)
    const waterGlasses = waterIntake || 0;
    const waterImpact = waterGlasses < 2 ? 50 : waterGlasses < 4 ? 30 : waterGlasses < 6 ? 15 : 0;
    dynamicTriggers.push({ 
      name: 'Dehydration Risk', 
      value: `${waterGlasses} glasses`,
      impact: waterImpact,
      active: waterGlasses < 6,
      status: waterGlasses < 2 ? 'Severe' : waterGlasses < 4 ? 'Moderate' : waterGlasses < 6 ? 'Low' : 'Hydrated',
      type: 'lifestyle'
    });

    // 9. Caffeine Intake
    const coffeeCups = coffeeIntake || 0;
    const caffeineImpact = coffeeCups > 4 ? 55 : coffeeCups > 3 ? 40 : coffeeCups > 2 ? 25 : 0;
    dynamicTriggers.push({ 
      name: 'Caffeine Intake', 
      value: `${coffeeCups} cups`,
      impact: caffeineImpact,
      active: coffeeCups > 2,
      status: coffeeCups > 4 ? 'Excessive' : coffeeCups > 2 ? 'High' : 'Moderate',
      type: 'dietary'
    });

    // 10. Notification Overload / Loud Noise
    const notifications = phoneData.notificationCount || 50;
    const notifImpact = notifications > 120 ? 50 : notifications > 80 ? 35 : notifications > 60 ? 20 : 5;
    dynamicTriggers.push({ 
      name: 'Notification Overload', 
      value: `${notifications} today`,
      impact: notifImpact,
      active: notifications > 60,
      status: notifications > 120 ? 'Overwhelming' : notifications > 80 ? 'High' : 'Normal',
      type: 'environmental'
    });

    // 11. Physical Inactivity / Sedentary
    const steps = wearableData.steps || 5000;
    const sedentaryImpact = steps < 2000 ? 45 : steps < 4000 ? 30 : steps < 6000 ? 15 : 0;
    dynamicTriggers.push({ 
      name: 'Physical Inactivity', 
      value: `${Math.round(steps / 1000)}k steps`,
      impact: sedentaryImpact,
      active: steps < 6000,
      status: steps < 2000 ? 'Very Sedentary' : steps < 4000 ? 'Sedentary' : steps < 6000 ? 'Low Activity' : 'Active',
      type: 'lifestyle'
    });

    // 12. Temperature Extreme
    const temp = weatherData.temperature || 20;
    const tempImpact = (temp > 28 || temp < 10) ? 35 : (temp > 25 || temp < 15) ? 20 : 5;
    dynamicTriggers.push({ 
      name: 'Temperature', 
      value: `${Math.round(temp)}°C`,
      impact: tempImpact,
      active: temp > 25 || temp < 15,
      status: (temp > 28 || temp < 10) ? 'Extreme' : (temp > 25 || temp < 15) ? 'Uncomfortable' : 'Comfortable',
      type: 'environmental'
    });

    // 13. Humidity
    const humidity = weatherData.humidity || 60;
    const humidityImpact = (humidity > 80 || humidity < 30) ? 30 : (humidity > 70 || humidity < 40) ? 15 : 0;
    dynamicTriggers.push({ 
      name: 'Humidity', 
      value: `${Math.round(humidity)}%`,
      impact: humidityImpact,
      active: humidity > 70 || humidity < 40,
      status: (humidity > 80 || humidity < 30) ? 'Extreme' : (humidity > 70 || humidity < 40) ? 'Uncomfortable' : 'Normal',
      type: 'environmental'
    });

    // Sort by impact (highest first) and return top 8 for display
    return dynamicTriggers
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 8); // Show top 8 triggers in dashboard
  };

  const topTriggers = latestData ? calculateDynamicTriggers() : [];

  // Prepare chart data
  const getChartData = () => {
    if (historicalData.length < 2) {
      // Not enough data yet, show placeholder
      return {
        labels: ['...', '...', '...', '...', '...'],
        datasets: [{
          data: [30, 35, 40, 45, 50],
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          strokeWidth: 2
        }]
      };
    }

    const dataPoints = historicalData.slice(-7); // Last 7 points
    return {
      labels: dataPoints.map((_, i) => `${i + 1}`),
      datasets: [{
        data: dataPoints.map(d => d.risk),
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        strokeWidth: 3
      }]
    };
  };

  const getMetricChartData = (metric: 'hrv' | 'stress' | 'heartRate') => {
    if (historicalData.length < 2) {
      return {
        labels: ['...', '...', '...', '...', '...'],
        datasets: [{
          data: [30, 35, 40, 45, 50]
        }]
      };
    }

    const dataPoints = historicalData.slice(-10); // Last 10 points
    return {
      labels: dataPoints.map((_, i) => `${i + 1}`),
      datasets: [{
        data: dataPoints.map(d => d[metric])
      }]
    };
  };

  // Generate stacked bar chart data for Risk Index - ALL TRACKED TRIGGERS
  const getStackedBarData = () => {
    if (historicalData.length < 2) {
      return [
        { stacks: [{ value: 20, color: '#3B82F6' }, { value: 15, color: '#EF4444' }, { value: 10, color: '#F59E0B' }], label: '1' },
        { stacks: [{ value: 25, color: '#3B82F6' }, { value: 10, color: '#EF4444' }, { value: 15, color: '#F59E0B' }], label: '2' },
        { stacks: [{ value: 18, color: '#3B82F6' }, { value: 22, color: '#EF4444' }, { value: 12, color: '#F59E0B' }], label: '3' },
        { stacks: [{ value: 30, color: '#3B82F6' }, { value: 12, color: '#EF4444' }, { value: 18, color: '#F59E0B' }], label: '4' },
      ];
    }

    const dataPoints = historicalData.slice(-6); // Last 6 points
    return dataPoints.map((d, i) => {
      const stacks: { value: number; color: string }[] = [];
      
      console.log(`📊 Chart Bar ${i+1} data:`, {
        hrv: d.hrv,
        stress: d.stress,
        sleep: d.sleepQuality,
        screen: d.screenTime,
        pressure: d.pressure,
        temp: d.temperature,
        notifs: d.notificationCount,
        calendar: d.calendarStress
      });
      
      // Core metrics (always included)
      // 1. HRV impact (blue) - Lower HRV = higher impact
      const hrvImpact = Math.max(0, (100 - d.hrv) / 4);
      stacks.push({ value: Math.max(2, Math.round(hrvImpact)), color: '#3B82F6' });
      
      // 2. Stress impact (orange) - Higher stress = higher impact
      const stressImpact = d.stress / 4;
      stacks.push({ value: Math.max(2, Math.round(stressImpact)), color: '#F59E0B' });
      
      // 3. Sleep impact (red) - Poor sleep quality = higher impact
      const sleepImpact = Math.max(0, (100 - d.sleepQuality) / 4);
      stacks.push({ value: Math.max(2, Math.round(sleepImpact)), color: '#EF4444' });
      
      // 4. Screen time impact (purple) - ALWAYS SHOW
      const screenImpact = Math.min(25, (d.screenTime || 0) / 15);
      stacks.push({ value: Math.max(3, Math.round(screenImpact)), color: '#A855F7' });
      
      // 5. Pressure impact (cyan) - ALWAYS SHOW
      const pressure = d.pressure || 1013;
      const pressureImpact = pressure < 1010 ? Math.max(0, (1010 - pressure) * 2) : Math.abs(1013 - pressure) / 2;
      stacks.push({ value: Math.max(3, Math.round(pressureImpact)), color: '#06B6D4' });
      
      // 6. Temperature impact (yellow) - ALWAYS SHOW
      const temp = d.temperature || 20;
      const tempImpact = Math.abs(temp - 20) * 1.5;
      stacks.push({ value: Math.max(2, Math.round(tempImpact)), color: '#FCD34D' });
      
      // 7. Notification impact (pink) - ALWAYS SHOW
      const notifImpact = Math.min(20, (d.notificationCount || 0) / 6);
      stacks.push({ value: Math.max(2, Math.round(notifImpact)), color: '#EC4899' });
      
      // 8. Calendar stress impact (emerald) - ALWAYS SHOW
      const calStress = d.calendarStress || 0;
      const calImpact = calStress > 50 ? (calStress / 5) : (calStress / 10);
      stacks.push({ value: Math.max(2, Math.round(calImpact)), color: '#10B981' });
      
      console.log(`📊 Chart Bar ${i+1} stacks:`, stacks.map(s => `${s.value}(${s.color})`).join(', '));
      
      return {
        stacks,
        label: `${i + 1}`,
      };
    });
  };

  // Get chart legend items - ALL METRICS
  const getChartLegendItems = () => {
    return [
      { color: '#3B82F6', label: 'HRV' },
      { color: '#F59E0B', label: 'Stress' },
      { color: '#EF4444', label: 'Sleep' },
      { color: '#A855F7', label: 'Screen' },
      { color: '#06B6D4', label: 'Pressure' },
      { color: '#FCD34D', label: 'Temp' },
      { color: '#EC4899', label: 'Notifs' },
      { color: '#10B981', label: 'Calendar' }
    ];
  };

  // Generate line chart data for migraine risk over time
  const getLineChartData = () => {
    if (historicalData.length < 2) {
      // Default demo data
      return [
        { value: 35, labelComponent: () => customLabel('10:00') },
        { value: 42, hideDataPoint: true },
        { value: 38, customDataPoint: customDataPoint },
        { value: 45, hideDataPoint: true },
        { value: 52, 
          customDataPoint: customDataPoint,
          showStrip: true,
          stripHeight: 100,
          stripColor: colors.border,
          dataPointLabelComponent: () => (
            <View style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
            }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>52%</Text>
            </View>
          ),
          dataPointLabelShiftY: -65,
          dataPointLabelShiftX: -12,
        },
        { value: 48, hideDataPoint: true },
        { value: 40, customDataPoint: customDataPoint },
        { value: 38, hideDataPoint: true },
        { value: currentRisk, labelComponent: () => customLabel('Now'), customDataPoint: customDataPoint },
      ];
    }

    // Use real historical data
    const dataPoints = historicalData.slice(-7); // Last 7 points
    return dataPoints.map((d, i) => {
      // Calculate risk from metrics (simplified version)
      let risk = 20;
      
      // HRV impact
      if (d.hrv < 40) risk += 25;
      else if (d.hrv < 60) risk += 15;
      
      // Stress impact
      if (d.stress > 70) risk += 25;
      else if (d.stress > 50) risk += 15;
      
      // Sleep impact
      if (d.sleepQuality < 50) risk += 20;
      else if (d.sleepQuality < 70) risk += 10;
      
      // Pressure impact
      const pressure = d.pressure || 1013;
      if (pressure < 1005) risk += 15;
      else if (pressure < 1010) risk += 8;
      
      const riskValue = Math.min(100, Math.max(0, risk));
      
      const isLastPoint = i === dataPoints.length - 1;
      const isMiddleHighlight = i === Math.floor(dataPoints.length / 2);
      
      return {
        value: riskValue,
        ...(i === 0 || isLastPoint ? { 
          labelComponent: () => customLabel(isLastPoint ? 'Now' : `${i + 1}`) 
        } : {}),
        ...(isLastPoint || isMiddleHighlight ? { 
          customDataPoint: customDataPoint,
          ...(isMiddleHighlight && riskValue > 50 ? {
            showStrip: true,
            stripHeight: 100,
            stripColor: colors.border,
            dataPointLabelComponent: () => (
              <View style={{
                backgroundColor: riskValue >= 70 ? '#EF4444' : riskValue >= 40 ? '#F59E0B' : colors.primary,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{riskValue}%</Text>
              </View>
            ),
            dataPointLabelShiftY: -65,
            dataPointLabelShiftX: -12,
          } : {}),
        } : { hideDataPoint: true }),
      };
    });
  };

  // Custom data point for line chart
  const customDataPoint = () => {
    return (
      <View
        style={{
          width: 16,
          height: 16,
          backgroundColor: isDark ? '#FFFFFF' : '#FFFFFF',
          borderWidth: 3,
          borderRadius: 8,
          borderColor: colors.primary,
        }}
      />
    );
  };

  // Custom label for line chart
  const customLabel = (val: string) => {
    return (
      <View style={{ width: 50, marginLeft: -15 }}>
        <Text style={{ 
          color: colors.textSecondary, 
          fontWeight: '600',
          fontSize: 10,
        }}>{val}</Text>
      </View>
    );
  };

  // Fetch AI Analysis
  const fetchAIAnalysis = async () => {
    setLoadingAI(true);
    setShowAIModal(true);

    try {
      const token = await getToken();
      const response = await axios.post(
        `${BACKEND_URL}/api/ai/analyze`,
        {
          wearable: latestData?.wearable,
          phone: latestData?.phone,
          sleep: latestData?.sleep,
          location: latestData?.weather,
          calendar: latestData?.calendar,
          currentRisk,
          // NEW: Include user-selected triggers and their current status
          userTriggers: userTriggers,
          activeTriggers: topTriggers, // Dynamic triggers with real values
          intakeData: {
            water: waterIntake,
            coffee: coffeeIntake,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('🤖 AI Response:', response.data);

      if (response.data.success && response.data.analysis) {
        setAiAnalysis(response.data.analysis);
        
        // Play audio if available
        if (response.data.audio) {
          await playAudio(response.data.audio);
        }
      } else {
        // Fallback: Generate local analysis
        const localAnalysis = generateLocalAnalysis();
        setAiAnalysis(localAnalysis);
      }
    } catch (error: any) {
      console.error('AI Analysis Error:', error);
      console.error('Error details:', error.response?.data);
      
      // Fallback: Generate local analysis instead of showing error
      const localAnalysis = generateLocalAnalysis();
      setAiAnalysis(localAnalysis);
    } finally {
      setLoadingAI(false);
    }
  };

  // Generate local AI-like analysis as fallback
  const generateLocalAnalysis = () => {
    const risk = currentRisk;
    const hrv = wearableData.hrv;
    const stress = wearableData.stress;
    const sleepHours = sleepData.sleepHours || (sleepData.totalSleepMinutes / 60);
    const pressure = weatherData.weather?.pressure || 1013;
    
    let analysis = `🧠 **Migraine Risk Analysis**\n\n`;
    
    // Risk level assessment
    if (risk >= 70) {
      analysis += `⚠️ **HIGH RISK ALERT** (${risk}%)\nYour migraine risk is significantly elevated. Consider taking preventive medication and reducing triggers.\n\n`;
    } else if (risk >= 40) {
      analysis += `🟡 **MODERATE RISK** (${risk}%)\nYour migraine risk is elevated. Monitor your symptoms and avoid known triggers.\n\n`;
    } else {
      analysis += `✅ **LOW RISK** (${risk}%)\nYour migraine risk is currently low. Keep up the good habits!\n\n`;
    }
    
    // Key factors
    analysis += `📊 **Key Factors:**\n\n`;
    
    if (hrv < 45) {
      analysis += `• ❤️ **Low HRV (${Math.round(hrv)}ms)**: Your nervous system is under stress. Try deep breathing exercises or meditation.\n\n`;
    }
    
    if (stress > 60) {
      analysis += `• 😰 **High Stress (${Math.round(stress)}%)**: Elevated stress levels detected. Take breaks and practice relaxation techniques.\n\n`;
    }
    
    if (sleepHours < 6) {
      analysis += `• 😴 **Poor Sleep (${sleepHours.toFixed(1)}h)**: Sleep deprivation is a major migraine trigger. Aim for 7-9 hours tonight.\n\n`;
    }
    
    if (pressure < 1010) {
      analysis += `• 🌧️ **Low Pressure (${Math.round(pressure)} hPa)**: Weather changes can trigger migraines. Stay hydrated and rest if needed.\n\n`;
    }
    
    if (waterIntake < 4) {
      analysis += `• 💧 **Dehydration Risk (${waterIntake} glasses)**: Drink more water! Aim for at least 8 glasses today.\n\n`;
    }
    
    if (coffeeIntake > 3) {
      analysis += `• ☕ **High Caffeine (${coffeeIntake} cups)**: Too much caffeine can trigger migraines. Consider reducing intake.\n\n`;
    }
    
    // Recommendations
    analysis += `💡 **Recommendations:**\n\n`;
    analysis += `1. ${risk > 60 ? 'Take preventive medication if prescribed' : 'Continue monitoring your triggers'}\n`;
    analysis += `2. ${sleepHours < 7 ? 'Prioritize sleep tonight' : 'Maintain good sleep habits'}\n`;
    analysis += `3. ${waterIntake < 6 ? 'Drink 3 more glasses of water' : 'Keep up hydration'}\n`;
    analysis += `4. ${stress > 50 ? 'Practice 10 minutes of meditation' : 'Continue stress management'}\n`;
    
    return analysis;
  };

  // Play audio from base64
  const playAudio = async (audioBase64: string) => {
    try {
      // Unload previous sound if exists
      if (sound) {
        await sound.unloadAsync();
      }

      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Create sound from base64
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mpeg;base64,${audioBase64}` },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlayingAudio(true);

      // Handle playback status
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingAudio(false);
        }
      });
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };

  // Toggle audio playback
  const toggleAudio = async () => {
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (isPlayingAudio) {
          await sound.pauseAsync();
          setIsPlayingAudio(false);
        } else {
          await sound.playAsync();
          setIsPlayingAudio(true);
        }
      }
    } catch (error) {
      console.error('Toggle audio error:', error);
    }
  };

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Calculate risk color and status

  return (
    <View style={{ flex: 1 }}>
      {/* Gradient Background */}
      <LinearGradient
        colors={isDark 
          ? ['#1a1a1a', '#2a2a2a', '#1a1a1a'] 
          : ['#f8f9fa', '#e5e7eb', '#f3f4f6', '#f8f9fa']
        }
        locations={[0, 0.3, 0.7, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header with Gradient Overlay */}
          <View className="px-6 pt-12 pb-4">
            {/* Streak Timeline - Above Title */}
            {streakData && (
              <View className="flex-row justify-between items-center mb-3">
                {StreakService.getLast7Days(streakData).map((day, index) => {
                  const date = new Date(day.date);
                  const dayNum = date.getDate();
                  const isPast = new Date(day.date) < new Date(new Date().setHours(0, 0, 0, 0));
                  const isMissed = isPast && !day.opened;
                  
                  return (
                    <View key={index} className="items-center">
                      <LinearGradient
                        colors={day.opened 
                          ? (day.isToday ? ['#F59E0B', '#D97706'] : ['#10B981', '#059669'])
                          : isMissed 
                            ? ['#EF4444', '#DC2626']
                            : (isDark ? ['#2D2D2D', '#1F1F1F'] : ['#E5E7EB', '#D1D5DB'])
                        }
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: day.isToday ? 2 : 0,
                          borderColor: '#F59E0B',
                        }}
                      >
                        {day.opened || isMissed ? (
                          <Text 
                            style={{ color: '#FFFFFF' }} 
                            className="text-sm font-bold"
                          >
                            {dayNum}
                          </Text>
                        ) : (
                          <Text 
                            style={{ color: isDark ? '#6B7280' : '#9CA3AF' }} 
                            className="text-sm font-semibold"
                          >
                            {dayNum}
                          </Text>
                        )}
                      </LinearGradient>
                      <Text 
                        style={{ color: colors.textSecondary }} 
                        className="text-xs mt-1"
                      >
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })[0]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
            
            {/* Title Row with Streak Counter */}
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-1">
                <Text style={{ color: colors.text }} className="text-3xl font-bold">
                  Migraine Guardian
                </Text>
              </View>
              
              {/* Streak Counter - Top Right */}
              {streakData && streakData.currentStreak > 0 && (
                <TouchableOpacity
                onPress={() => setShowStreakModal(true)}
                style={{
                  backgroundColor: isDark ? '#1a1a1a' : '#FFF7ED',
                  borderWidth: 2,
                  borderColor: '#F59E0B',
                  shadowColor: '#F59E0B',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }}
                className="w-14 h-14 rounded-full items-center justify-center"
              >
                <Ionicons name="flame" size={22} color="#F59E0B" />
                <Text style={{ color: '#F59E0B' }} className="text-xs font-bold">
                  {streakData.currentStreak}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={{ color: colors.textSecondary }} className="text-sm mb-3">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          
        </View>

        {/* Risk Index Card with Gradient */}
        <Animated.View 
          entering={FadeInDown.duration(800)}
          className="mx-6 mb-4"
        >
          <LinearGradient
            colors={
              riskLevel >= 70 
                ? isDark ? ['#2D1B1B', '#1A1A1A'] : ['#FEF2F2', '#FFFFFF']
                : riskLevel >= 40
                ? isDark ? ['#2D2615', '#1A1A1A'] : ['#FFFBEB', '#FFFFFF']
                : isDark ? ['#1B2D1F', '#1A1A1A'] : ['#F0FDF4', '#FFFFFF']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              borderWidth: 1,
              borderColor: isDark ? '#2D2D2D' : '#E5E7EB',
              padding: 24,
              shadowColor: riskLevel >= 70 ? '#EF4444' : riskLevel >= 40 ? '#F59E0B' : '#10B981',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            <Text style={{ 
              color: isDark ? '#9CA3AF' : '#6B7280' 
            }} className="text-xs mb-2 tracking-wider">
              MIGRAINE RISK INDEX
            </Text>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-end">
                <Text style={{ color: isDark ? '#FFFFFF' : '#1F2937' }} className="text-6xl font-bold">{riskLevel}</Text>
                <Text style={{ color: isDark ? '#FFFFFF' : '#1F2937' }} className="text-2xl font-bold mb-1.5">%</Text>
              </View>
              
              {/* Circular Migraine Phase Indicator */}
              <View className="items-center">
                <View style={{ position: 'relative', width: 90, height: 90 }}>
                  <CircularProgress
                    size={90}
                    width={8}
                    fill={riskLevel}
                    tintColor={riskLevel >= 70 ? '#EF4444' : riskLevel >= 40 ? '#F59E0B' : '#10B981'}
                    backgroundColor={isDark ? '#2D2D2D' : '#E5E7EB'}
                    rotation={0}
                    lineCap="round"
                  >
                    {() => (
                      <View className="items-center justify-center">
                        <Text style={{ fontSize: 24 }}>
                          {riskLevel >= 70 ? '🔴' : riskLevel >= 40 ? '🟡' : '🟢'}
                        </Text>
                        <Text 
                          style={{ 
                            color: isDark ? '#FFFFFF' : '#1F2937',
                            fontSize: 9,
                            marginTop: 2,
                          }} 
                          className="font-bold text-center"
                        >
                          {riskLevel >= 70 ? 'Critical' : riskLevel >= 40 ? 'Warning' : 'Safe'}
                        </Text>
                      </View>
                    )}
                  </CircularProgress>
                </View>
              </View>
            </View>
            <View className="flex-row items-center mb-4">
              <View className={`w-2.5 h-2.5 rounded-full ${riskColor} mr-2`} />
              <Text style={{ color: isDark ? '#D1D5DB' : '#4B5563' }} className="text-base font-medium">{riskStatus} Risk</Text>
              {isCollecting && (
                <View className="ml-auto">
                  <View className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                </View>
              )}
            </View>

            {/* Real-time Risk Trend Chart */}
            {historicalData.length >= 2 ? (
              <View style={{ 
                borderTopWidth: 1, 
                borderTopColor: isDark ? '#2D2D2D' : '#E5E7EB',
                paddingTop: 16,
                paddingBottom: 8,
              }}>
                <Text style={{ 
                  color: colors.text, 
                  fontSize: 14,
                  fontWeight: '600',
                  marginBottom: 12,
                  textAlign: 'center',
                }}>
                  Risk Trend Over Time
                </Text>
                
                <LineChart
                  data={getLineChartData()}
                  thickness={4}
                  color={colors.primary}
                  maxValue={100}
                  noOfSections={4}
                  areaChart
                  yAxisTextStyle={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 10 }}
                  curved
                  startFillColor={colors.primary}
                  endFillColor={colors.primary}
                  startOpacity={0.3}
                  endOpacity={0.05}
                  spacing={35}
                  backgroundColor={isDark ? '#1A1A1A' : '#FFFFFF'}
                  rulesColor={isDark ? '#2D2D2D' : '#E5E7EB'}
                  rulesType="solid"
                  initialSpacing={10}
                  yAxisColor={isDark ? '#2D2D2D' : '#E5E7EB'}
                  xAxisColor={isDark ? '#2D2D2D' : '#E5E7EB'}
                  dataPointsHeight={16}
                  dataPointsWidth={16}
                  width={width - 130}
                  height={140}
                  yAxisLabelWidth={30}
                  hideRules={false}
                />
                
                {/* Legend */}
                <View className="flex-row justify-center mt-4 gap-4">
                  <View className="flex-row items-center">
                    <View style={{ backgroundColor: '#10B981' }} className="w-2.5 h-2.5 rounded-full mr-1.5" />
                    <Text style={{ color: colors.textSecondary }} className="text-xs">Low Risk</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View style={{ backgroundColor: '#F59E0B' }} className="w-2.5 h-2.5 rounded-full mr-1.5" />
                    <Text style={{ color: colors.textSecondary }} className="text-xs">Moderate</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View style={{ backgroundColor: '#EF4444' }} className="w-2.5 h-2.5 rounded-full mr-1.5" />
                    <Text style={{ color: colors.textSecondary }} className="text-xs">High Risk</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ 
                borderTopWidth: 1, 
                borderTopColor: isDark ? '#2D2D2D' : '#E5E7EB',
                paddingTop: 16 
              }}>
                <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }} className="text-sm text-center">
                  Collecting data... Check back in a few minutes
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Quick Metrics */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(200)}
          className="px-6 mb-4"
        >
          <View className="flex-row items-center justify-between mb-2.5">
            <Text style={{ color: colors.text }} className="text-lg font-bold">
              Today's Metrics
            </Text>
            {!loadingTriggers && userTriggers.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowTriggersModal(true)}
                style={{ 
                  backgroundColor: isDark ? '#1a1a1a' : '#f3f4f6',
                  borderColor: isDark ? '#2D2D2D' : colors.border,
                }}
                className="flex-row items-center px-3 py-1.5 rounded-full border"
                activeOpacity={0.7}
              >
                <Ionicons name="list" size={14} color={colors.text} />
                <Text style={{ color: colors.text }} className="text-xs font-semibold ml-1.5">
                  {userTriggers.length} Tracked
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View className="flex-row justify-between">
            {metrics.map((metric, index) => {
              // Calculate percentage for circular progress
              let percentage = 0;
              let maxValue = 100;
              
              if (metric.label === 'HRV') {
                maxValue = 100;
                percentage = (parseInt(metric.value) / maxValue) * 100;
              } else if (metric.label === 'Sleep') {
                maxValue = 9; // 9 hours max
                percentage = (parseFloat(metric.value) / maxValue) * 100;
              } else if (metric.label === 'Stress') {
                percentage = 100 - parseInt(metric.value); // Inverse for stress
              } else if (metric.label === 'Screen') {
                maxValue = 8; // 8 hours max
                percentage = Math.max(0, 100 - (parseFloat(metric.value) / maxValue) * 100);
              }

              // Determine color based on metric health
              let progressColor = colors.success;
              if (percentage < 40) progressColor = colors.error;
              else if (percentage < 70) progressColor = colors.warning;

              return (
                <View key={index} className="flex-1 mx-1">
                  <LinearGradient
                    colors={isDark 
                      ? ['#1a1a1a', '#2D2D2D'] 
                      : ['#FFFFFF', '#F9FAFB']
                    }
                    style={{
                      borderRadius: 16,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: isDark ? '#2D2D2D' : colors.border,
                      alignItems: 'center',
                    }}
                  >
                    <CircularProgress
                      size={50}
                      width={5}
                      fill={Math.min(100, Math.max(0, percentage))}
                      tintColor={progressColor}
                      backgroundColor={isDark ? '#1a1a1a' : '#e5e5e5'}
                      rotation={0}
                    >
                      {() => (
                        <View className="items-center">
                          <Text style={{ color: colors.text }} className="text-sm font-bold">{metric.value}</Text>
                        </View>
                      )}
                    </CircularProgress>
                    
                    <Text style={{ color: colors.text }} className="text-[11px] mt-1.5 font-semibold">{metric.label}</Text>
                    
                    <View className="flex-row items-center mt-0.5">
                      <Ionicons 
                        name={metric.trend === 'down' ? 'arrow-down' : 'arrow-up'} 
                        size={10} 
                        color={metric.trend === 'down' ? colors.error : colors.success}
                      />
                      <Text 
                        style={{ color: metric.trend === 'down' ? colors.error : colors.success }} 
                        className="text-[9px] ml-0.5 font-semibold"
                      >
                        {metric.change}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Water & Coffee Intake */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(350)}
          className="px-6 mb-4"
        >
          <Text style={{ color: colors.text }} className="text-lg font-bold mb-2.5">
            Daily Intake Tracker
          </Text>
          
          <View className="flex-row" style={{ gap: 12 }}>
            {/* Water Intake with Gradient */}
            <View className="flex-1">
              <LinearGradient
                colors={isDark 
                  ? ['#1E3A5F', '#1A1A1A'] 
                  : ['#E0F2FE', '#FFFFFF']
                }
                style={{
                  borderRadius: 16,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BAE6FD',
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <View className="items-center mb-2">
                  <Ionicons name="water" size={28} color="#3B82F6" />
                  <Text style={{ color: colors.text }} className="text-xs font-semibold mt-1">Water</Text>
                </View>
                
                <View className="flex-row items-center justify-between mb-2">
                  <TouchableOpacity 
                    onPress={decrementWater}
                    style={{ 
                      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : '#f3f4f6',
                      borderWidth: isDark ? 1 : 0,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    }}
                    className="w-8 h-8 rounded-full items-center justify-center"
                  >
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </TouchableOpacity>
                  
                  <View className="items-center">
                    <Text style={{ color: colors.text }} className="text-2xl font-bold">{waterIntake}</Text>
                    <Text style={{ color: colors.textSecondary }} className="text-[10px]">glasses</Text>
                  </View>
                  
                  <TouchableOpacity 
                    onPress={incrementWater}
                    style={{ backgroundColor: '#3B82F6' }}
                    className="w-8 h-8 rounded-full items-center justify-center"
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <View style={{ 
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f0f9ff',
                  borderWidth: isDark ? 1 : 0,
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                }} className="rounded-lg p-1.5">
                  <Text style={{ color: waterIntake >= 8 ? '#22C55E' : '#3B82F6' }} className="text-[10px] text-center font-medium">
                    {waterIntake >= 8 ? '✓ Goal!' : `Goal: 8`}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Coffee Intake with Gradient */}
            <View className="flex-1">
              <LinearGradient
                colors={isDark 
                  ? ['#3A2817', '#1A1A1A'] 
                  : ['#FEF3C7', '#FFFFFF']
                }
                style={{
                  borderRadius: 16,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(146, 64, 14, 0.3)' : '#FDE68A',
                  shadowColor: '#92400E',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <View className="items-center mb-2">
                  <Ionicons name="cafe" size={28} color="#92400E" />
                  <Text style={{ color: colors.text }} className="text-xs font-semibold mt-1">Coffee</Text>
                </View>
                
                <View className="flex-row items-center justify-between mb-2">
                  <TouchableOpacity 
                    onPress={decrementCoffee}
                    style={{ 
                      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : '#f3f4f6',
                      borderWidth: isDark ? 1 : 0,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    }}
                    className="w-8 h-8 rounded-full items-center justify-center"
                  >
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </TouchableOpacity>
                  
                  <View className="items-center">
                    <Text style={{ color: colors.text }} className="text-2xl font-bold">{coffeeIntake}</Text>
                    <Text style={{ color: colors.textSecondary }} className="text-[10px]">cups</Text>
                  </View>
                  
                  <TouchableOpacity 
                    onPress={incrementCoffee}
                    style={{ backgroundColor: '#92400E' }}
                    className="w-8 h-8 rounded-full items-center justify-center"
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <View style={{ 
                  backgroundColor: isDark ? 'rgba(28, 25, 23, 0.6)' : '#fef3c7',
                  borderWidth: isDark ? 1 : 0,
                  borderColor: isDark ? 'rgba(146, 64, 14, 0.2)' : 'transparent',
                }} className="rounded-lg p-1.5">
                  <Text style={{ color: coffeeIntake >= 3 ? '#EF4444' : '#92400E' }} className="text-[10px] text-center font-medium">
                    {coffeeIntake >= 3 ? '⚠️ High' : `Limit: 2-3`}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Top Contributing Triggers */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(300)}
          className="px-6 mb-6"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text style={{ color: colors.text }} className="text-xl font-semibold">
              Your Tracked Triggers
            </Text>
            <TouchableOpacity onPress={() => setShowTriggersModal(true)}>
              <Text style={{ color: colors.primary }} className="text-sm font-medium">
                See All
              </Text>
            </TouchableOpacity>
          </View>
          
          {topTriggers.length > 0 ? (
            topTriggers.map((trigger: any, index: number) => (
              <View key={index} className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <Text style={{ color: colors.text }} className="text-base font-semibold">
                      {trigger.name}
                    </Text>
                    <Text style={{ color: colors.textSecondary }} className="text-xs mt-0.5">
                      {trigger.value}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text style={{ color: trigger.impact > 70 ? '#EF4444' : trigger.impact > 50 ? '#F59E0B' : colors.primary }} className="text-lg font-bold">
                      {Math.round(trigger.impact)}%
                    </Text>
                    <Text style={{ color: colors.textSecondary }} className="text-[10px]">
                      risk
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: isDark ? '#2a2a2a' : '#e5e5e5' }} className="h-2.5 rounded-full overflow-hidden">
                  <View 
                    style={{ 
                      backgroundColor: trigger.impact > 70 ? '#EF4444' : trigger.impact > 50 ? '#F59E0B' : colors.primary,
                      width: `${trigger.impact}%` 
                    }}
                    className="h-full rounded-full"
                  />
                </View>
              </View>
            ))
          ) : (
            <View style={{ backgroundColor: isDark ? '#1A1A1A' : '#F3F4F6' }} className="rounded-2xl p-4">
              <Text style={{ color: colors.textSecondary }} className="text-sm text-center">
                No active triggers detected. Keep monitoring! 🎯
              </Text>
            </View>
          )}
        </Animated.View>

        {/* AI Tip Card */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(400)}
          className="mx-6 mb-4"
        >
          <View style={{ 
            backgroundColor: colors.card,
          }} className="rounded-3xl p-4 border-2">
            <View className="flex-row items-center mb-3">
              <View style={{ backgroundColor: "black" }} className="w-10 h-10 rounded-2xl items-center justify-center mr-2.5">
                <Ionicons name="sparkles" size={20} color="#fff" />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.text }} className="text-lg font-bold">AI Insights</Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs">Powered by Gemini</Text>
              </View>
            </View>
            <Text style={{ color: colors.text }} className="text-sm leading-5 mb-3">
              {wearableData.hrv < 45 ? 
                `Your HRV is at ${Math.round(wearableData.hrv)}ms (low). Consider reducing stress and getting quality sleep tonight.` :
                wearableData.stress > 70 ?
                `High stress detected (${Math.round(wearableData.stress)}%). Take short breaks and practice deep breathing exercises.` :
                phoneData.screenTimeMinutes > 240 ?
                `Screen time is ${(phoneData.screenTimeMinutes / 60).toFixed(1)} hours today. Consider the 20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds.` :
                sleepData.sleepDebt > 2 ?
                `You have ${sleepData.sleepDebt.toFixed(1)} hours of sleep debt. Prioritize 7-9 hours of sleep tonight.` :
                `Your vitals look good! Keep up with your healthy habits. Stay hydrated and maintain regular breaks.`
              }
            </Text>
            <TouchableOpacity 
              onPress={fetchAIAnalysis}
              style={{ 
                backgroundColor: 'black',
              }}
              className="rounded-2xl py-3 px-5 flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text className="text-white font-bold text-sm">Get Full AI Analysis</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Bottom Padding */}
        <View className="h-6" />
      </ScrollView>

      {/* AI Recommendations Modal */}
      <Modal
        visible={showAIModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAIModal(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ 
            backgroundColor: isDark ? '#000000' : colors.background,
            maxHeight: '85%',
            height: '85%'
          }} className="rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons name="sparkles" size={24} color={colors.primary} />
                <Text style={{ color: colors.text }} className="text-xl font-bold ml-2">
                  AI Health Analysis
                </Text>
              </View>
              <View className="flex-row items-center">
                {sound && (
                  <TouchableOpacity onPress={toggleAudio} className="mr-3">
                    <Ionicons 
                      name={isPlayingAudio ? 'pause-circle' : 'play-circle'} 
                      size={32} 
                      color={colors.primary} 
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => {
                  setShowAIModal(false);
                  if (sound) {
                    sound.stopAsync();
                    setIsPlayingAudio(false);
                  }
                }}>
                  <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={true} 
              className="flex-1 mb-4"
              style={{ maxHeight: '100%' }}
            >
              {loadingAI ? (
                <View className="py-12 items-center">
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ color: colors.textSecondary }} className="mt-4 text-center">
                    Analyzing your health data with Gemini AI...
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="mt-2 text-center text-sm">
                    🎤 Generating voice narration...
                  </Text>
                </View>
              ) : (
                <View>
                  {isPlayingAudio && (
                    <View style={{ backgroundColor: isDark ? '#1a1a1a' : '#f0f9ff' }} className="rounded-xl p-3 mb-4 flex-row items-center">
                      <Ionicons name="volume-high" size={20} color={colors.primary} />
                      <Text style={{ color: colors.primary }} className="ml-2 text-sm font-medium">
                        Playing audio narration...
                      </Text>
                    </View>
                  )}
                  
                  {/* Render formatted AI analysis */}
                  <View className="pb-4">
                    {aiAnalysis.split('\n').map((line, index) => {
                      // Remove asterisks from the line
                      const cleanedLine = line.replace(/\*\*/g, '').replace(/\*/g, '');
                      const trimmedLine = cleanedLine.trim();
                      
                      // Check if line is a section title (ALL CAPS)
                      if (trimmedLine && trimmedLine === trimmedLine.toUpperCase() && !trimmedLine.startsWith('•')) {
                        return (
                          <View key={index} className="mt-4 mb-2">
                            <Text style={{ color: colors.text }} className="text-lg font-bold">
                              {trimmedLine}
                            </Text>
                            <View style={{ backgroundColor: isDark ? '#FFFFFF' : colors.primary, height: 3, width: 40 }} className="mt-1 rounded-full" />
                          </View>
                        );
                      }
                      
                      // Check if line is a bullet point
                      if (trimmedLine.startsWith('•')) {
                        return (
                          <View key={index} className="flex-row mb-2.5 pl-2">
                            <Text style={{ color: isDark ? '#FFFFFF' : colors.primary }} className="text-base mr-2 font-bold">
                              •
                            </Text>
                            <Text style={{ color: colors.text }} className="text-base leading-6 flex-1">
                              {trimmedLine.substring(1).trim()}
                            </Text>
                          </View>
                        );
                      }
                      
                      // Regular text
                      if (trimmedLine) {
                        return (
                          <Text key={index} style={{ color: colors.text }} className="text-base leading-6 mb-2">
                            {trimmedLine}
                          </Text>
                        );
                      }
                      
                      return null;
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={{ 
              backgroundColor: isDark ? '#000000' : colors.background,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: isDark ? '#2D2D2D' : colors.border
            }}>
              <TouchableOpacity
                onPress={() => setShowAIModal(false)}
                style={{ backgroundColor: isDark ? '#FFFFFF' : colors.primary }}
                className="rounded-full py-4"
                activeOpacity={0.8}
              >
                <Text style={{ color: isDark ? '#000000' : '#FFFFFF' }} className="text-center font-semibold">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tracked Triggers Modal */}
      <Modal
        visible={showTriggersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTriggersModal(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ 
            backgroundColor: isDark ? '#000000' : colors.background,
            maxHeight: '75%'
          }} className="rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons name="list-circle" size={28} color={colors.primary} />
                <Text style={{ color: colors.text }} className="text-xl font-bold ml-2">
                  Your Tracked Triggers
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowTriggersModal(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textSecondary }} className="text-sm mb-4">
              Monitoring {userTriggers.length} trigger{userTriggers.length > 1 ? 's' : ''} for your migraine risk prediction
            </Text>

            <ScrollView 
              showsVerticalScrollIndicator={true} 
              style={{ flexGrow: 1, marginBottom: 16 }}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              {(() => {
                console.log('Modal render - userTriggers length:', userTriggers.length);
                console.log('Modal render - userTriggers:', userTriggers);
                return userTriggers.length === 0 ? (
                  <View className="py-12 items-center">
                    <Ionicons name="information-circle-outline" size={48} color={colors.textSecondary} />
                    <Text style={{ color: colors.text }} className="text-base font-semibold mt-4">
                      No Triggers Selected
                    </Text>
                    <Text style={{ color: colors.textSecondary }} className="text-sm mt-2 text-center px-8">
                      You haven't selected any triggers during onboarding yet.
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row flex-wrap justify-between">
                  {userTriggers.map((triggerId, index) => {
                    console.log(`Rendering trigger ${index}:`, triggerId);
                    const trigger = triggerMetadata[triggerId];
                    if (!trigger) {
                      console.log('Trigger metadata not found for:', triggerId);
                      return null;
                    }
                    
                    console.log('Trigger metadata found:', trigger);
                    
                    // Calculate REAL values for each trigger based on current data
                    let value = '...';
                    let percentage = 0;
                    
                    switch (triggerId) {
                      case 'lack_of_sleep':
                      case 'poor_sleep':
                        const hours = sleepData.sleepHours || (sleepData.totalSleepMinutes / 60);
                        value = `${hours.toFixed(1)}h`;
                        percentage = hours < 5 ? 85 : hours < 6 ? 70 : hours < 7 ? 50 : 30;
                        break;
                      
                      case 'stress':
                      case 'high_stress':
                        value = `${Math.round(wearableData.stress)}%`;
                        percentage = wearableData.stress;
                        break;
                      
                      case 'dehydration':
                        value = `${waterIntake} glasses`;
                        percentage = waterIntake < 4 ? 80 : waterIntake < 6 ? 50 : 30;
                        break;
                      
                      case 'caffeine':
                        value = `${coffeeIntake} cups`;
                        percentage = coffeeIntake > 4 ? 85 : coffeeIntake > 2 ? 60 : 30;
                        break;
                      
                      case 'weather_changes':
                      case 'barometric_pressure':
                        const pressure = weatherData.weather?.pressure || 1013;
                        value = `${Math.round(pressure)} hPa`;
                        percentage = pressure < 1005 ? 85 : pressure < 1010 ? 60 : 30;
                        break;
                      
                      case 'bright_light':
                      case 'screen_time':
                        const screenHours = (phoneData.screenTimeMinutes / 60);
                        value = `${screenHours.toFixed(1)}h`;
                        percentage = screenHours > 7 ? 85 : screenHours > 5 ? 60 : 30;
                        break;
                      
                      case 'loud_noises':
                        value = `${phoneData.notificationCount} notifs`;
                        percentage = phoneData.notificationCount > 100 ? 75 : phoneData.notificationCount > 60 ? 50 : 25;
                        break;
                      
                      case 'skipped_meals':
                        const calStress = calendarData.stressScore || calendarData.load || 0;
                        value = `${Math.round(calStress)}% busy`;
                        percentage = calStress > 70 ? 75 : calStress > 50 ? 50 : 25;
                        break;
                      
                      case 'physical_activity':
                        const steps = wearableData.steps || 0;
                        value = `${Math.round(steps / 1000)}k steps`;
                        percentage = steps < 2000 ? 70 : steps < 5000 ? 45 : 25;
                        break;
                      
                      case 'alcohol':
                        value = 'Tracked';
                        percentage = 40;
                        break;
                      
                      case 'hormonal_changes':
                        value = 'Cycle';
                        percentage = 50;
                        break;
                      
                      case 'strong_smells':
                        value = 'Monitor';
                        percentage = 35;
                        break;
                      
                      case 'neck_tension':
                        const hrv = wearableData.hrv || 65;
                        value = `${Math.round(hrv)} ms`;
                        percentage = hrv < 40 ? 85 : hrv < 55 ? 60 : 30;
                        break;
                      
                      default:
                        value = 'Active';
                        percentage = 50;
                    }
                    
                    return (
                      <View key={triggerId} className="w-[23%] mb-3">
                        <View style={{ 
                          backgroundColor: isDark ? '#1a1a1a' : colors.card,
                          borderColor: isDark ? '#2D2D2D' : colors.border,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: isDark ? 0.3 : 0.08,
                          shadowRadius: 2,
                          elevation: 2,
                        }} className="rounded-xl p-2.5 items-center">
                          <CircularProgress
                            size={45}
                            width={4}
                            fill={percentage}
                            tintColor={trigger.color}
                            backgroundColor={isDark ? '#1a1a1a' : '#e5e5e5'}
                            rotation={0}
                          >
                            {() => (
                              <View className="items-center justify-center">
                                <Ionicons 
                                  name={trigger.icon as any}
                                  size={18} 
                                  color={trigger.color}
                                />
                              </View>
                            )}
                          </CircularProgress>
                          
                          <Text 
                            style={{ color: colors.text }} 
                            className="text-[9px] mt-1.5 font-semibold text-center leading-tight"
                            numberOfLines={2}
                          >
                            {trigger.name}
                          </Text>
                          <Text 
                            style={{ color: trigger.color }} 
                            className="text-[8px] mt-0.5 font-bold text-center"
                            numberOfLines={1}
                          >
                            {value}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
                );
              })()}
            </ScrollView>

            <View style={{ 
              backgroundColor: isDark ? '#000000' : colors.background,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: isDark ? '#2D2D2D' : colors.border
            }}>
              <TouchableOpacity
                onPress={() => setShowTriggersModal(false)}
                style={{ backgroundColor: isDark ? '#FFFFFF' : colors.primary }}
                className="rounded-full py-4"
                activeOpacity={0.8}
              >
                <Text style={{ color: isDark ? '#000000' : '#FFFFFF' }} className="text-center font-semibold">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Streak Details Modal */}
      <Modal
        visible={showStreakModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStreakModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View 
            style={{ 
              backgroundColor: isDark ? '#000000' : colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 8,
              maxHeight: '75%',
            }}
            className="px-6 pb-8"
          >
            {/* Handle bar */}
            <View className="items-center py-3">
              <View style={{ backgroundColor: colors.border }} className="w-12 h-1.5 rounded-full" />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {streakData && (
                <>
                  {/* Fire Icon Header */}
                  <View className="items-center py-5">
                    <View
                      style={{
                        backgroundColor: '#FFF7ED',
                        shadowColor: '#F59E0B',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.3,
                        shadowRadius: 12,
                        elevation: 8,
                      }}
                      className="w-28 h-28 rounded-full items-center justify-center mb-4"
                    >
                      <Ionicons name="flame" size={64} color="#F59E0B" />
                    </View>
                    <Text style={{ color: colors.text }} className="text-3xl font-bold mb-2">
                      {streakData.currentStreak} Day Streak!
                    </Text>
                    <Text style={{ color: colors.textSecondary }} className="text-base text-center">
                      {StreakService.getStreakMessage(streakData.currentStreak)}
                    </Text>
                  </View>

                  {/* Stats Cards */}
                  <View className="flex-row space-x-3 mb-5">
                    <View 
                      style={{ backgroundColor: isDark ? '#1a1a1a' : colors.surface }}
                      className="flex-1 rounded-xl p-3.5 items-center"
                    >
                      <Text style={{ color: colors.textSecondary }} className="text-xs mb-1">
                        Current
                      </Text>
                      <Text style={{ color: '#F59E0B' }} className="text-2xl font-bold">
                        {streakData.currentStreak}
                      </Text>
                      <Text style={{ color: colors.textSecondary }} className="text-xs">
                        days
                      </Text>
                    </View>
                    
                    <View 
                      style={{ backgroundColor: isDark ? '#1a1a1a' : colors.surface }}
                      className="flex-1 rounded-xl p-4 items-center"
                    >
                      <Text style={{ color: colors.textSecondary }} className="text-xs mb-1">
                        Longest
                      </Text>
                      <Text style={{ color: '#10B981' }} className="text-2xl font-bold">
                        {streakData.longestStreak}
                      </Text>
                      <Text style={{ color: colors.textSecondary }} className="text-xs">
                        days
                      </Text>
                    </View>
                    
                    <View 
                      style={{ backgroundColor: isDark ? '#1a1a1a' : colors.surface }}
                      className="flex-1 rounded-xl p-4 items-center"
                    >
                      <Text style={{ color: colors.textSecondary }} className="text-xs mb-1">
                        Total
                      </Text>
                      <Text style={{ color: '#3B82F6' }} className="text-2xl font-bold">
                        {streakData.totalDays}
                      </Text>
                      <Text style={{ color: colors.textSecondary }} className="text-xs">
                        days
                      </Text>
                    </View>
                  </View>

                  {/* Calendar View */}
                  <View
                    style={{ 
                      backgroundColor: isDark ? '#1a1a1a' : colors.surface,
                      borderWidth: 1,
                      borderColor: isDark ? '#2D2D2D' : colors.border,
                    }}
                    className="rounded-xl p-4 mb-6"
                  >
                    <Text style={{ color: colors.text }} className="text-lg font-bold mb-4">
                      Last 7 Days
                    </Text>
                    
                    <View className="flex-row justify-between">
                      {StreakService.getLast7Days(streakData).map((day, index) => (
                        <View key={index} className="items-center">
                          <Text 
                            style={{ color: colors.textSecondary }} 
                            className="text-xs mb-2"
                          >
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </Text>
                          <View
                            style={{
                              backgroundColor: day.opened 
                                ? (day.isToday ? '#F59E0B' : '#10B981')
                                : (isDark ? '#2D2D2D' : '#E5E7EB'),
                              borderWidth: day.isToday ? 3 : 0,
                              borderColor: '#F59E0B',
                            }}
                            className="w-12 h-12 rounded-full items-center justify-center"
                          >
                            {day.opened ? (
                              <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                            ) : (
                              <Text style={{ color: colors.textSecondary }} className="text-xl">•</Text>
                            )}
                          </View>
                          <Text 
                            style={{ color: colors.textSecondary }} 
                            className="text-xs mt-1"
                          >
                            {new Date(day.date).getDate()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Benefits */}
                  <View
                    style={{ 
                      backgroundColor: isDark ? '#1a1a1a' : '#EFF6FF',
                      borderLeftWidth: 4,
                      borderLeftColor: '#3B82F6',
                    }}
                    className="rounded-xl p-4 mb-4"
                  >
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="information-circle" size={20} color="#3B82F6" />
                      <Text 
                        style={{ color: isDark ? colors.text : '#1E40AF' }} 
                        className="text-sm font-semibold ml-2"
                      >
                        Why Track Daily?
                      </Text>
                    </View>
                    <Text 
                      style={{ color: isDark ? colors.textSecondary : '#3B82F6' }} 
                      className="text-xs leading-5"
                    >
                      Daily monitoring helps our AI learn your unique patterns better. The more data we collect, the more accurate migraine predictions become!
                    </Text>
                  </View>

                  {/* Milestones */}
                  <View className="mb-6">
                    <Text style={{ color: colors.text }} className="text-lg font-bold mb-3">
                      Milestones
                    </Text>
                    {[
                      { days: 3, emoji: '🌟', title: 'Getting Started', unlocked: streakData.longestStreak >= 3 },
                      { days: 7, emoji: '⭐', title: 'One Week Strong', unlocked: streakData.longestStreak >= 7 },
                      { days: 14, emoji: '💫', title: 'Two Weeks Champion', unlocked: streakData.longestStreak >= 14 },
                      { days: 30, emoji: '🏆', title: 'Monthly Master', unlocked: streakData.longestStreak >= 30 },
                    ].map((milestone, index) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: milestone.unlocked 
                            ? (isDark ? '#1a1a1a' : colors.surface)
                            : (isDark ? '#0a0a0a' : '#F3F4F6'),
                          opacity: milestone.unlocked ? 1 : 0.5,
                          borderWidth: 1,
                          borderColor: milestone.unlocked 
                            ? (isDark ? '#2D2D2D' : colors.border)
                            : 'transparent',
                        }}
                        className="rounded-lg p-3 flex-row items-center mb-2"
                      >
                        <Text className="text-2xl mr-3">{milestone.emoji}</Text>
                        <View className="flex-1">
                          <Text style={{ color: colors.text }} className="text-sm font-semibold">
                            {milestone.title}
                          </Text>
                          <Text style={{ color: colors.textSecondary }} className="text-xs">
                            {milestone.days} days streak
                          </Text>
                        </View>
                        {milestone.unlocked && (
                          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                        )}
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowStreakModal(false)}
              style={{ backgroundColor: '#F59E0B' }}
              className="rounded-full py-4 mt-4"
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFFFF' }} className="text-center font-semibold text-base">
                Keep Going! 🔥
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </View>
  );
}
