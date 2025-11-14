import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Dimensions, SafeAreaView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useDataCollection } from '../../contexts/DataCollectionContext';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const { latestData, currentRisk, isCollecting } = useDataCollection();
  
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

    const dataPoints = historicalData.slice(-7);
    return {
      labels: dataPoints.map((_, i) => `${i + 1}`),
      datasets: [{
        data: dataPoints.map(d => d[metric] || 0)
      }]
    };
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-16 pb-6">
          <Text className="text-3xl font-bold text-black mb-2">
            Migraine Guardian
          </Text>
          <Text className="text-base text-gray-600">
            Thursday, November 14
          </Text>
        </View>

        {/* Risk Index Card */}
        <Animated.View 
          entering={FadeInDown.duration(800)}
          className="mx-6 mb-6"
        >
          <View className="bg-black rounded-3xl p-8">
            <Text className="text-gray-400 text-sm mb-3 tracking-wider">
              MIGRAINE RISK INDEX
            </Text>
            <View className="flex-row items-end mb-4">
              <Text className="text-white text-7xl font-bold">{riskLevel}</Text>
              <Text className="text-white text-3xl font-bold mb-2">%</Text>
            </View>
            <View className="flex-row items-center mb-6">
              <View className={`w-3 h-3 rounded-full ${riskColor} mr-2`} />
              <Text className="text-gray-300 text-lg font-medium">{riskStatus} Risk</Text>
              {isCollecting && (
                <View className="ml-auto">
                  <View className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                </View>
              )}
            </View>

            {/* Real-time Risk Trend Chart */}
            {historicalData.length >= 2 ? (
              <View className="border-t border-gray-800 pt-4">
                <LineChart
                  data={getChartData()}
                  width={width - 100}
                  height={100}
                  chartConfig={{
                    backgroundColor: '#000',
                    backgroundGradientFrom: '#000',
                    backgroundGradientTo: '#000',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
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
          <View className="flex-row bg-gray-100 rounded-full p-1">
            {['today', 'week', 'month'].map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                className={`flex-1 py-2 rounded-full ${
                  selectedPeriod === period ? 'bg-black' : 'bg-transparent'
                }`}
                activeOpacity={0.7}
              >
                <Text className={`text-center text-sm font-semibold capitalize ${
                  selectedPeriod === period ? 'text-white' : 'text-gray-600'
                }`}>
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
          <Text className="text-xl font-semibold text-black mb-4">
            Today's Metrics
          </Text>
          <View className="flex-row flex-wrap -mx-2">
            {metrics.map((metric, index) => (
              <View key={index} className="w-1/2 px-2 mb-3">
                <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <Text className="text-gray-500 text-xs mb-2">{metric.label}</Text>
                  <View className="flex-row items-end mb-1">
                    <Text className="text-black text-2xl font-bold">{metric.value}</Text>
                    <Text className="text-gray-600 text-sm mb-1 ml-1">{metric.unit}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className={`text-xs ${
                      metric.trend === 'down' ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {metric.trend === 'down' ? '↓' : '↑'} {metric.change}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Top Triggers */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(300)}
          className="px-6 mb-6"
        >
          <Text className="text-xl font-semibold text-black mb-4">
            Top Contributing Triggers
          </Text>
          {triggers.map((trigger, index) => (
            <View key={index} className="mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-medium text-black">{trigger.name}</Text>
                <Text className="text-sm font-semibold text-gray-900">{trigger.impact}%</Text>
              </View>
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-black rounded-full"
                  style={{ width: `${trigger.impact}%` }}
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
          <View className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 border border-gray-800">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3">
                <Text className="text-xl">💡</Text>
              </View>
              <Text className="text-white text-lg font-semibold">AI Insight</Text>
            </View>
            <Text className="text-gray-300 text-base leading-6 mb-4">
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
              className="bg-white rounded-full py-3 px-6 self-start"
              activeOpacity={0.8}
            >
              <Text className="text-black font-semibold">View Recommendations</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Detailed Charts Section */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(500)}
          className="px-6 mb-8"
        >
          <Text className="text-xl font-semibold text-black mb-4">
            Detailed Trends
          </Text>
          
          {/* Period Selector */}
          <View className="flex-row mb-4 bg-gray-100 rounded-full p-1">
            {['today', 'week', 'month'].map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                className={`flex-1 py-2 rounded-full ${
                  selectedPeriod === period ? 'bg-black' : 'bg-transparent'
                }`}
              >
                <Text className={`text-center font-medium capitalize ${
                  selectedPeriod === period ? 'text-white' : 'text-gray-600'
                }`}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chart Placeholders */}
          {historicalData.length >= 2 ? (
            <>
              <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                <Text className="text-sm font-semibold text-gray-900 mb-3">
                  Heart Rate Variability (HRV)
                </Text>
                <LineChart
                  data={getMetricChartData('hrv')}
                  width={width - 80}
                  height={150}
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    propsForDots: {
                      r: "3",
                      strokeWidth: "2",
                      stroke: "#000"
                    }
                  }}
                  bezier
                  style={{
                    marginLeft: -10,
                    borderRadius: 16
                  }}
                />
                <Text className="text-xs text-gray-500 mt-2 text-center">
                  Current: {Math.round(wearableData.hrv)}ms | Target: 60-80ms
                </Text>
              </View>

              <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                <Text className="text-sm font-semibold text-gray-900 mb-3">
                  Stress Levels
                </Text>
                <LineChart
                  data={getMetricChartData('stress')}
                  width={width - 80}
                  height={150}
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => {
                      const stress = wearableData.stress;
                      if (stress > 70) return `rgba(239, 68, 68, ${opacity})`; // red
                      if (stress > 40) return `rgba(251, 191, 36, ${opacity})`; // yellow
                      return `rgba(34, 197, 94, ${opacity})`; // green
                    },
                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    propsForDots: {
                      r: "3",
                      strokeWidth: "2",
                      stroke: wearableData.stress > 70 ? "#EF4444" : wearableData.stress > 40 ? "#FBBF24" : "#22C55E"
                    }
                  }}
                  bezier
                  style={{
                    marginLeft: -10,
                    borderRadius: 16
                  }}
                />
                <Text className="text-xs text-gray-500 mt-2 text-center">
                  Current: {Math.round(wearableData.stress)}% | Target: Below 40%
                </Text>
              </View>

              <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
                <Text className="text-sm font-semibold text-gray-900 mb-3">
                  Heart Rate
                </Text>
                <LineChart
                  data={getMetricChartData('heartRate')}
                  width={width - 80}
                  height={150}
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    propsForDots: {
                      r: "3",
                      strokeWidth: "2",
                      stroke: "#3B82F6"
                    }
                  }}
                  bezier
                  style={{
                    marginLeft: -10,
                    borderRadius: 16
                  }}
                />
                <Text className="text-xs text-gray-500 mt-2 text-center">
                  Current: {Math.round(wearableData.heartRate)} bpm | Target: 60-80 bpm
                </Text>
              </View>
            </>
          ) : (
            <View className="bg-white rounded-2xl border border-gray-200 p-8">
              <Text className="text-gray-500 text-center mb-2">
                Building your health profile...
              </Text>
              <Text className="text-gray-400 text-sm text-center">
                Charts will appear once we've collected enough data points
              </Text>
              <View className="mt-4 flex-row justify-center">
                <View className="w-2 h-2 rounded-full bg-gray-400 mx-1 animate-pulse" />
                <View className="w-2 h-2 rounded-full bg-gray-400 mx-1 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <View className="w-2 h-2 rounded-full bg-gray-400 mx-1 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </View>
            </View>
          )}

          {/* Additional Real-time Data */}
          <View className="bg-black rounded-2xl p-6 mt-4">
            <Text className="text-white font-semibold text-lg mb-4">
              Live Data Stream
            </Text>
            <View className="space-y-3">
              <View className="flex-row justify-between border-b border-gray-800 pb-2">
                <Text className="text-gray-400">Steps Today</Text>
                <Text className="text-white font-semibold">{wearableData.steps.toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between border-b border-gray-800 pb-2">
                <Text className="text-gray-400">Temperature</Text>
                <Text className="text-white font-semibold">{weatherData.weather.temperature.toFixed(1)}°C</Text>
              </View>
              <View className="flex-row justify-between border-b border-gray-800 pb-2">
                <Text className="text-gray-400">Humidity</Text>
                <Text className="text-white font-semibold">{Math.round(weatherData.weather.humidity)}%</Text>
              </View>
              <View className="flex-row justify-between border-b border-gray-800 pb-2">
                <Text className="text-gray-400">Barometric Pressure</Text>
                <Text className="text-white font-semibold">{Math.round(weatherData.weather.pressure)} hPa</Text>
              </View>
              <View className="flex-row justify-between border-b border-gray-800 pb-2">
                <Text className="text-gray-400">UV Index</Text>
                <Text className="text-white font-semibold">{weatherData.weather.uvIndex.toFixed(1)}</Text>
              </View>
              <View className="flex-row justify-between border-b border-gray-800 pb-2">
                <Text className="text-gray-400">Notifications</Text>
                <Text className="text-white font-semibold">{phoneData.notificationCount}</Text>
              </View>
              <View className="flex-row justify-between border-b border-gray-800 pb-2">
                <Text className="text-gray-400">Calendar Events</Text>
                <Text className="text-white font-semibold">{calendarData.eventsToday}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-400">Activity Level</Text>
                <Text className="text-white font-semibold capitalize">{phoneData.activityLevel}</Text>
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
