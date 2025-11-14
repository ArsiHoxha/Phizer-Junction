import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StatusBar, Dimensions, SafeAreaView, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LineChart } from 'react-native-gifted-charts';
import { useDataCollection } from '../../contexts/DataCollectionContext';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export default function AnalysisScreen() {
  const { latestData, currentRisk, isCollecting } = useDataCollection();
  const { isDark, colors } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  const [selectedCategory, setSelectedCategory] = useState('health');

  // Historical data for charts
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
        return newData.slice(-20);
      });
    }
  }, [latestData, currentRisk]);

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
    screenTimeToday: 0,
  };

  const sleepData = latestData?.sleep || {
    totalSleepMinutes: 420,
    quality: 75,
    sleepDebt: 0,
    deepSleepMinutes: 120,
  };

  const weatherData = latestData?.weather?.weather || {
    temperature: 20,
    humidity: 50,
    pressure: 1013,
    uvIndex: 3,
    condition: 'clear',
  };

  const calendarData = latestData?.calendar || {
    eventsToday: 0,
    busyHoursToday: 0,
  };

  // Calculate derived values
  const screenTimeHours = Math.round((phoneData.screenTimeMinutes || phoneData.screenTimeToday || 0) / 60 * 10) / 10;
  const sleepHours = Math.round((sleepData.totalSleepMinutes || 0) / 60 * 10) / 10;
  const deepSleepHours = Math.round((sleepData.deepSleepMinutes || 0) / 60 * 10) / 10;
  const qualityScore = sleepData.quality || 0;

  const getMetricChartData = (metric: 'hrv' | 'stress' | 'heartRate') => {
    if (historicalData.length < 2) {
      return [
        { value: 30, label: '1' },
        { value: 35, label: '2' },
        { value: 40, label: '3' },
        { value: 45, label: '4' },
        { value: 50, label: '5' }
      ];
    }

    // Filter data based on selected period
    let dataPoints = historicalData;
    const now = new Date();
    
    if (selectedPeriod === '24h') {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      dataPoints = historicalData.filter(d => new Date(d.timestamp) >= oneDayAgo);
    } else if (selectedPeriod === '7d') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dataPoints = historicalData.filter(d => new Date(d.timestamp) >= sevenDaysAgo);
    } else if (selectedPeriod === '30d') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dataPoints = historicalData.filter(d => new Date(d.timestamp) >= thirtyDaysAgo);
    }

    // Take last 15 points for better visualization
    const displayPoints = dataPoints.slice(-15);
    return displayPoints.map((d, i) => ({ 
      value: d[metric] || 0,
      label: `${i + 1}`
    }));
  };

  const periods = ['24h', '7d', '30d'];
  const categories = [
    { id: 'health', label: 'Health', icon: '❤️' },
    { id: 'activity', label: 'Activity', icon: '🏃' },
    { id: 'environment', label: 'Environment', icon: '🌤️' },
    { id: 'lifestyle', label: 'Lifestyle', icon: '📱' }
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View 
          entering={FadeInUp.duration(800)}
          className="px-6 pt-8 pb-6"
        >
          <Text style={{ color: colors.text }} className="text-3xl font-bold mb-2">
            Detailed Analysis
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-base">
            Track your health metrics over time
          </Text>
        </Animated.View>

        {/* Category Tabs */}
        <View className="px-6 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {categories.map((category, index) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                style={{ 
                  backgroundColor: selectedCategory === category.id ? colors.primary : colors.card,
                  borderColor: colors.border
                }}
                className={`mr-3 px-4 py-3 rounded-xl border ${index === 0 ? 'ml-0' : ''}`}
              >
                <Text style={{ 
                  color: selectedCategory === category.id ? '#fff' : colors.text 
                }} className="text-sm font-semibold">
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Period Selector */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-center space-x-2">
            {periods.map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                style={{
                  backgroundColor: selectedPeriod === period ? colors.primary : 'transparent',
                  borderColor: selectedPeriod === period ? colors.primary : colors.border,
                }}
                className="px-5 py-1.5 rounded-full border"
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: selectedPeriod === period ? '#fff' : colors.textSecondary,
                  }}
                  className="text-xs font-semibold"
                >
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Health Category */}
        {selectedCategory === 'health' && (
          <>
            {/* HRV Chart */}
            <Animated.View 
              entering={FadeInUp.duration(600).delay(100)}
              className="px-6 mb-6"
            >
              <Text style={{ color: colors.text }} className="text-xl font-semibold mb-4">
                Heart Rate Variability (HRV)
              </Text>
              
              {historicalData.length >= 2 ? (
            <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="rounded-2xl border p-4">
              <LineChart
                data={getMetricChartData('hrv')}
                width={280}
                height={200}
                areaChart
                curved
                color={isDark ? '#fff' : '#000'}
                thickness={3}
                startFillColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                endFillColor={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                startOpacity={0.9}
                endOpacity={0.2}
                initialSpacing={15}
                spacing={30}
                hideDataPoints={false}
                dataPointsColor={isDark ? '#fff' : '#000'}
                dataPointsRadius={4}
                dataPointsWidth={4}
                rulesType="solid"
                rulesColor={colors.border}
                showVerticalLines
                verticalLinesColor={colors.border}
                xAxisColor={colors.border}
                yAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                noOfSections={4}
                maxValue={100}
                yAxisOffset={0}
              />
              <View className="mt-4 flex-row justify-between">
                <View>
                  <Text style={{ color: colors.textSecondary }} className="text-xs">Current</Text>
                  <Text style={{ color: colors.text }} className="text-lg font-bold">{Math.round(wearableData.hrv)}ms</Text>
                </View>
                <View>
                  <Text style={{ color: colors.textSecondary }} className="text-xs">Target Range</Text>
                  <Text style={{ color: colors.success }} className="text-lg font-bold">60-80ms</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="rounded-2xl border p-8">
              <Text style={{ color: colors.textSecondary }} className="text-center">
                Collecting data...
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Stress Levels Chart */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(200)}
          className="px-6 mb-6"
        >
          <Text style={{ color: colors.text }} className="text-xl font-semibold mb-4">
            Stress Levels
          </Text>
          
          {historicalData.length >= 2 ? (
            <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="rounded-2xl border p-4">
              <LineChart
                data={getMetricChartData('stress')}
                width={280}
                height={200}
                areaChart
                curved
                color={wearableData.stress > 70 ? '#EF4444' : wearableData.stress > 40 ? '#FBBF24' : '#22C55E'}
                thickness={3}
                startFillColor={wearableData.stress > 70 ? 'rgba(239,68,68,0.3)' : wearableData.stress > 40 ? 'rgba(251,191,36,0.3)' : 'rgba(34,197,94,0.3)'}
                endFillColor={wearableData.stress > 70 ? 'rgba(239,68,68,0.05)' : wearableData.stress > 40 ? 'rgba(251,191,36,0.05)' : 'rgba(34,197,94,0.05)'}
                startOpacity={0.9}
                endOpacity={0.2}
                initialSpacing={15}
                spacing={30}
                hideDataPoints={false}
                dataPointsColor={wearableData.stress > 70 ? '#EF4444' : wearableData.stress > 40 ? '#FBBF24' : '#22C55E'}
                dataPointsRadius={4}
                dataPointsWidth={4}
                rulesType="solid"
                rulesColor={colors.border}
                showVerticalLines
                verticalLinesColor={colors.border}
                xAxisColor={colors.border}
                yAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                noOfSections={4}
                maxValue={100}
                yAxisOffset={0}
              />
              <View className="mt-4 flex-row justify-between">
                <View>
                  <Text style={{ color: colors.textSecondary }} className="text-xs">Current</Text>
                  <Text style={{ color: colors.text }} className="text-lg font-bold">{Math.round(wearableData.stress)}%</Text>
                </View>
                <View>
                  <Text style={{ color: colors.textSecondary }} className="text-xs">Status</Text>
                  <Text 
                    style={{ 
                      color: wearableData.stress > 70 ? '#EF4444' : wearableData.stress > 40 ? '#FBBF24' : '#22C55E' 
                    }} 
                    className="text-lg font-bold"
                  >
                    {wearableData.stress > 70 ? 'High' : wearableData.stress > 40 ? 'Medium' : 'Low'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="rounded-2xl border p-8">
              <Text style={{ color: colors.textSecondary }} className="text-center">
                Collecting data...
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Heart Rate Chart */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(300)}
          className="px-6 mb-6"
        >
          <Text style={{ color: colors.text }} className="text-xl font-semibold mb-4">
            Heart Rate
          </Text>
          
          {historicalData.length >= 2 ? (
            <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="rounded-2xl border p-4">
              <LineChart
                data={getMetricChartData('heartRate')}
                width={280}
                height={200}
                areaChart
                curved
                color="#3B82F6"
                thickness={3}
                startFillColor="rgba(59,130,246,0.3)"
                endFillColor="rgba(59,130,246,0.05)"
                startOpacity={0.9}
                endOpacity={0.2}
                initialSpacing={15}
                spacing={30}
                hideDataPoints={false}
                dataPointsColor="#3B82F6"
                dataPointsRadius={4}
                dataPointsWidth={4}
                rulesType="solid"
                rulesColor={colors.border}
                showVerticalLines
                verticalLinesColor={colors.border}
                xAxisColor={colors.border}
                yAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                noOfSections={4}
                maxValue={150}
                yAxisOffset={40}
              />
              <View className="mt-4 flex-row justify-between">
                <View>
                  <Text style={{ color: colors.textSecondary }} className="text-xs">Current</Text>
                  <Text style={{ color: colors.text }} className="text-lg font-bold">{Math.round(wearableData.heartRate)} bpm</Text>
                </View>
                <View>
                  <Text style={{ color: colors.textSecondary }} className="text-xs">Target Range</Text>
                  <Text style={{ color: '#3B82F6' }} className="text-lg font-bold">60-80 bpm</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="rounded-2xl border p-8">
              <Text style={{ color: colors.textSecondary }} className="text-center">
                Collecting data...
              </Text>
            </View>
          )}
        </Animated.View>
        </>
        )}

        {/* Activity Category */}
        {selectedCategory === 'activity' && (
          <>
            {/* Screen Time Chart */}
            <Animated.View 
              entering={FadeInUp.duration(600).delay(100)}
              className="px-6 mb-6"
            >
              <Text style={{ color: colors.text }} className="text-xl font-semibold mb-4">
                Screen Time Usage
              </Text>
              
              <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="rounded-2xl border p-4">
                <View className="items-center py-8">
                  <Text style={{ color: colors.text }} className="text-6xl font-bold mb-2">
                    {screenTimeHours}h
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-base">
                    Today's Screen Time
                  </Text>
                </View>
                <View className="mt-4 flex-row justify-between border-t pt-4" style={{ borderColor: colors.border }}>
                  <View>
                    <Text style={{ color: colors.textSecondary }} className="text-xs">Activity Level</Text>
                    <Text style={{ color: colors.text }} className="text-lg font-bold capitalize">{phoneData.activityLevel || 'light'}</Text>
                  </View>
                  <View>
                    <Text style={{ color: colors.textSecondary }} className="text-xs">Notifications</Text>
                    <Text style={{ color: colors.warning }} className="text-lg font-bold">{phoneData.notificationCount || 0}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Sleep Quality Chart */}
            <Animated.View 
              entering={FadeInUp.duration(600).delay(200)}
              className="px-6 mb-6"
            >
              <Text style={{ color: colors.text }} className="text-xl font-semibold mb-4">
                Sleep Quality
              </Text>
              
              <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="rounded-2xl border p-4">
                <View className="items-center py-8">
                  <Text style={{ color: colors.text }} className="text-6xl font-bold mb-2">
                    {sleepHours}h
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-base">
                    Last Night's Sleep
                  </Text>
                </View>
                <View className="mt-4 flex-row justify-between border-t pt-4" style={{ borderColor: colors.border }}>
                  <View>
                    <Text style={{ color: colors.textSecondary }} className="text-xs">Quality Score</Text>
                    <Text style={{ color: colors.success }} className="text-lg font-bold">{Math.round(qualityScore)}%</Text>
                  </View>
                  <View>
                    <Text style={{ color: colors.textSecondary }} className="text-xs">Deep Sleep</Text>
                    <Text style={{ color: colors.primary }} className="text-lg font-bold">{deepSleepHours}h</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </>
        )}

        {/* Environment Category */}
        {selectedCategory === 'environment' && (
          <>
            {/* Weather Conditions */}
            <Animated.View 
              entering={FadeInUp.duration(600).delay(100)}
              className="px-6 mb-6"
            >
              <Text style={{ color: colors.text }} className="text-xl font-semibold mb-4">
                Environmental Conditions
              </Text>
              
              <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="rounded-2xl border p-4">
                <View className="items-center py-8">
                  <Text style={{ color: colors.text }} className="text-6xl font-bold mb-2">
                    {Math.round(weatherData.temperature || 20)}°
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-base capitalize">
                    {weatherData.condition || 'Unknown'}
                  </Text>
                </View>
                <View className="mt-4 border-t pt-4" style={{ borderColor: colors.border }}>
                  <View className="flex-row justify-between mb-3">
                    <Text style={{ color: colors.textSecondary }} className="text-sm">Humidity</Text>
                    <Text style={{ color: colors.text }} className="text-sm font-semibold">{Math.round(weatherData.humidity || 0)}%</Text>
                  </View>
                  <View className="flex-row justify-between mb-3">
                    <Text style={{ color: colors.textSecondary }} className="text-sm">Pressure</Text>
                    <Text style={{ color: colors.text }} className="text-sm font-semibold">{Math.round(weatherData.pressure || 1013)} hPa</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text style={{ color: colors.textSecondary }} className="text-sm">UV Index</Text>
                    <Text style={{ color: (weatherData.uvIndex || 0) > 6 ? colors.error : colors.success }} className="text-sm font-semibold">{weatherData.uvIndex || 0}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </>
        )}

        {/* Lifestyle Category */}
        {selectedCategory === 'lifestyle' && (
          <>
            {/* Calendar Stress */}
            <Animated.View 
              entering={FadeInUp.duration(600).delay(100)}
              className="px-6 mb-6"
            >
              <Text style={{ color: colors.text }} className="text-xl font-semibold mb-4">
                Calendar & Stress
              </Text>
              
              <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="rounded-2xl border p-4">
                <View className="items-center py-8">
                  <Text style={{ color: colors.text }} className="text-6xl font-bold mb-2">
                    {calendarData.eventsToday || 0}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-base">
                    Events Today
                  </Text>
                </View>
                <View className="mt-4 flex-row justify-between border-t pt-4" style={{ borderColor: colors.border }}>
                  <View>
                    <Text style={{ color: colors.textSecondary }} className="text-xs">Busy Hours</Text>
                    <Text style={{ color: colors.warning }} className="text-lg font-bold">{calendarData.busyHoursToday || 0}h</Text>
                  </View>
                  <View>
                    <Text style={{ color: colors.textSecondary }} className="text-xs">Free Time</Text>
                    <Text style={{ color: colors.success }} className="text-lg font-bold">{24 - (calendarData.busyHoursToday || 0)}h</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </>
        )}

        {/* Live Data Stream */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(400)}
          className="mx-6 mb-8"
        >
          <Text style={{ color: colors.text }} className="text-xl font-semibold mb-4">
            Live Data Stream
          </Text>
          
          <View className="bg-black rounded-3xl p-6 border border-gray-800">
            <View className="flex-row items-center mb-4">
              <View className={`w-3 h-3 rounded-full ${isCollecting ? 'bg-green-500' : 'bg-gray-400'} mr-2`} />
              <Text className="text-white font-semibold text-lg">
                {isCollecting ? 'Monitoring Active' : 'Monitoring Paused'}
              </Text>
            </View>

            <View className="space-y-3">
              <View className="flex-row justify-between border-b border-gray-800 pb-2">
                <Text className="text-gray-400">Steps Today</Text>
                <Text className="text-white font-semibold">{(wearableData.steps || 0).toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between border-b border-gray-800 pb-2">
                <Text className="text-gray-400">Temperature</Text>
                <Text className="text-white font-semibold">{(weatherData.temperature || 20).toFixed(1)}°C</Text>
              </View>
              <View className="flex-row justify-between border-b border-gray-800 pb-2">
                <Text className="text-gray-400">Humidity</Text>
                <Text className="text-white font-semibold">{Math.round(weatherData.humidity || 0)}%</Text>
              </View>
              <View className="flex-row justify-between border-b border-gray-800 pb-2">
                <Text className="text-gray-400">Barometric Pressure</Text>
                <Text className="text-white font-semibold">{Math.round(weatherData.pressure || 1013)} hPa</Text>
              </View>
              <View className="flex-row justify-between border-b border-gray-800 pb-2">
                <Text className="text-gray-400">UV Index</Text>
                <Text className="text-white font-semibold">{(weatherData.uvIndex || 0).toFixed(1)}</Text>
              </View>
              <View className="flex-row justify-between border-b border-gray-800 pb-2">
                <Text className="text-gray-400">Notifications</Text>
                <Text className="text-white font-semibold">{phoneData.notificationCount || 0}</Text>
              </View>
              <View className="flex-row justify-between border-b border-gray-800 pb-2">
                <Text className="text-gray-400">Screen Time</Text>
                <Text className="text-white font-semibold">{screenTimeHours}h</Text>
              </View>
              <View className="flex-row justify-between border-b border-gray-800 pb-2">
                <Text className="text-gray-400">Calendar Events</Text>
                <Text className="text-white font-semibold">{calendarData.eventsToday || 0}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-400">Activity Level</Text>
                <Text className="text-white font-semibold capitalize">{phoneData.activityLevel || 'light'}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Padding */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
