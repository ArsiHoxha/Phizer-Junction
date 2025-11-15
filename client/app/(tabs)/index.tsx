import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Dimensions, SafeAreaView, Modal, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { CircularProgress } from 'react-native-circular-progress';
import { useDataCollection } from '../../contexts/DataCollectionContext';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';
import { BACKEND_URL } from '../../config/config';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const { latestData, currentRisk, isCollecting } = useDataCollection();
  const { isDark, colors } = useTheme();
  const { getToken } = useAuth();
  
  // AI Recommendations Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Historical data for charts (last 7 data points)
  const [historicalData, setHistoricalData] = useState<any[]>([]);

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
        }];
        // Keep last 20 data points
        return newData.slice(-20);
      });
    }
  }, [latestData, currentRisk]);

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
    totalSleepMinutes: 0,
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
  };

  const riskLevel = currentRisk;
  const riskStatus = riskLevel < 40 ? 'Low' : riskLevel < 70 ? 'Medium' : 'High';
  const riskColor = riskLevel < 40 ? 'bg-green-500' : riskLevel < 70 ? 'bg-yellow-500' : 'bg-red-500';

  // Dynamic metrics from real data
  const metrics = [
    { 
      label: 'HRV', 
      value: Math.round(wearableData.hrv).toString(), 
      unit: 'ms', 
      trend: wearableData.hrv < 50 ? 'down' : 'up',
      change: wearableData.hrv < 50 ? 'Low' : 'Normal'
    },
    { 
      label: 'Sleep', 
      value: (sleepData.totalSleepMinutes / 60).toFixed(1), 
      unit: 'hrs', 
      trend: sleepData.totalSleepMinutes < 420 ? 'down' : 'up',
      change: sleepData.sleepDebt > 2 ? `Debt: ${sleepData.sleepDebt.toFixed(1)}h` : 'Good'
    },
    { 
      label: 'Stress', 
      value: Math.round(wearableData.stress).toString(), 
      unit: '%', 
      trend: wearableData.stress > 50 ? 'up' : 'down',
      change: wearableData.stress > 70 ? 'High' : wearableData.stress > 40 ? 'Medium' : 'Low'
    },
    { 
      label: 'Screen', 
      value: (phoneData.screenTimeMinutes / 60).toFixed(1), 
      unit: 'hrs', 
      trend: phoneData.screenTimeMinutes > 240 ? 'up' : 'down',
      change: phoneData.screenTimeMinutes > 300 ? 'High' : 'Normal'
    },
  ];

  // Calculate triggers based on real data
  const triggers = [
    { 
      name: 'HRV Drop', 
      impact: wearableData.hrv < 40 ? 90 : wearableData.hrv < 55 ? 60 : 30,
      active: wearableData.hrv < 55
    },
    { 
      name: 'Sleep Debt', 
      impact: Math.min(100, sleepData.sleepDebt * 20),
      active: sleepData.sleepDebt > 2
    },
    { 
      name: 'Stress Level', 
      impact: wearableData.stress > 50 ? wearableData.stress : 0,
      active: wearableData.stress > 50
    },
    { 
      name: 'Screen Time', 
      impact: Math.min(100, (phoneData.screenTimeMinutes / 360) * 100),
      active: phoneData.screenTimeMinutes > 240
    },
    {
      name: 'Calendar Stress',
      impact: calendarData.stressScore || 0,
      active: calendarData.stressScore > 50
    },
    {
      name: 'Weather Change',
      impact: weatherData.weather.pressure < 1000 ? 70 : weatherData.weather.uvIndex > 7 ? 60 : 20,
      active: weatherData.weather.pressure < 1000 || weatherData.weather.uvIndex > 7
    }
  ].sort((a, b) => b.impact - a.impact).slice(0, 4); // Top 4 triggers

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
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setAiAnalysis(response.data.analysis);
        
        // Play audio if available
        if (response.data.audio) {
          await playAudio(response.data.audio);
        }
      } else {
        setAiAnalysis('Unable to generate insights. Please try again later.');
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setAiAnalysis('Failed to connect to AI service. Please check your connection.');
    } finally {
      setLoadingAI(false);
    }
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-16 pb-6">
          <Text style={{ color: colors.text }} className="text-3xl font-bold mb-2">
            Migraine Guardian
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-base">
            Thursday, November 14
          </Text>
        </View>

        {/* Risk Index Card */}
        <Animated.View 
          entering={FadeInDown.duration(800)}
          className="mx-6 mb-6"
        >
          <View style={{ 
            backgroundColor: isDark ? '#000000' : '#1A1A1A',
            borderWidth: 1,
            borderColor: isDark ? '#2D2D2D' : '#3D3D3D'
          }} className="rounded-3xl p-8">
            <Text style={{ 
              color: isDark ? '#9CA3AF' : '#D1D5DB' 
            }} className="text-sm mb-3 tracking-wider">
              MIGRAINE RISK INDEX
            </Text>
            <View className="flex-row items-end mb-4">
              <Text style={{ color: '#FFFFFF' }} className="text-7xl font-bold">{riskLevel}</Text>
              <Text style={{ color: '#FFFFFF' }} className="text-3xl font-bold mb-2">%</Text>
            </View>
            <View className="flex-row items-center mb-6">
              <View className={`w-3 h-3 rounded-full ${riskColor} mr-2`} />
              <Text style={{ color: isDark ? '#D1D5DB' : '#E5E7EB' }} className="text-lg font-medium">{riskStatus} Risk</Text>
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
                borderTopColor: isDark ? '#2D2D2D' : '#3D3D3D',
                paddingTop: 16 
              }}>
                <LineChart
                  data={getChartData()}
                  width={width - 100}
                  height={100}
                  chartConfig={{
                    backgroundColor: isDark ? '#000000' : '#1A1A1A',
                    backgroundGradientFrom: isDark ? '#000000' : '#1A1A1A',
                    backgroundGradientTo: isDark ? '#000000' : '#1A1A1A',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => isDark ? `rgba(156, 163, 175, ${opacity})` : `rgba(209, 213, 219, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    propsForDots: {
                      r: "4",
                      strokeWidth: "2",
                      stroke: "#fff"
                    }
                  }}
                  bezier
                  style={{
                    marginLeft: -20,
                    borderRadius: 16
                  }}
                  withInnerLines={false}
                  withOuterLines={false}
                />
              </View>
            ) : (
              <View className="border-t border-gray-800 pt-4">
                <Text className="text-gray-500 text-sm text-center">
                  Collecting data... Check back in a few minutes
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Period Selector */}
        <View className="px-6 mb-4">
          <View style={{ backgroundColor: isDark ? '#000000' : '#f3f4f6' }} className="flex-row rounded-full p-1">
            {['today', 'week', 'month'].map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                style={{ backgroundColor: selectedPeriod === period ? (isDark ? '#FFFFFF' : '#000000') : 'transparent' }}
                className="flex-1 py-2 rounded-full"
                activeOpacity={0.7}
              >
                <Text style={{ 
                  color: selectedPeriod === period 
                    ? (isDark ? '#000000' : '#FFFFFF') 
                    : (isDark ? '#9CA3AF' : '#6B7280')
                }} className="text-center text-sm font-semibold capitalize">
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Metrics */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(200)}
          className="px-6 mb-6"
        >
          <Text style={{ color: colors.text }} className="text-lg font-bold mb-3">
            Today's Metrics
          </Text>
          
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
                  <View style={{ 
                    backgroundColor: isDark ? '#000000' : colors.card,
                    borderColor: isDark ? '#2D2D2D' : colors.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }} className="rounded-2xl p-3 border items-center">
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
                    
                    <Text style={{ color: colors.text }} className="text-[11px] mt-2 font-semibold">{metric.label}</Text>
                    
                    <View className="flex-row items-center mt-1">
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
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Top Triggers */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(300)}
          className="px-6 mb-6"
        >
          <Text style={{ color: colors.text }} className="text-xl font-semibold mb-4">
            Top Contributing Triggers
          </Text>
          {triggers.map((trigger, index) => (
            <View key={index} className="mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text style={{ color: colors.text }} className="text-base font-medium">{trigger.name}</Text>
                <Text style={{ color: colors.text }} className="text-sm font-semibold">{trigger.impact}%</Text>
              </View>
              <View style={{ backgroundColor: isDark ? '#2a2a2a' : '#e5e5e5' }} className="h-2 rounded-full overflow-hidden">
                <View 
                  style={{ backgroundColor: colors.primary, width: `${trigger.impact}%` }}
                  className="h-full rounded-full"
                />
              </View>
            </View>
          ))}
        </Animated.View>

        {/* AI Tip Card */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(400)}
          className="mx-6 mb-6"
        >
          <View style={{ 
            backgroundColor: colors.card,
          }} className="rounded-3xl p-6 border-2">
            <View className="flex-row items-center mb-6">
              <View style={{ backgroundColor: "black" }} className="w-12 h-12 rounded-2xl items-center justify-center mr-3">
                <Ionicons name="sparkles" size={24} color="#fff" />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.text }} className="text-xl font-bold">AI Insights</Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs">Powered by Gemini</Text>
              </View>
            </View>
            <Text style={{ color: colors.text }} className="text-sm leading-6 mb-5">
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
              className="rounded-2xl py-3.5 px-6 flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text className="text-white font-bold  text-base">Get Full Analysis</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Bottom Padding */}
        <View className="h-8" />
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
    </SafeAreaView>
  );
}
