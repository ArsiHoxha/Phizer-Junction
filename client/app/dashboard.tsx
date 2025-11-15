import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Mock data
  const riskLevel = 34;
  const riskStatus = riskLevel < 40 ? 'Low' : riskLevel < 70 ? 'Medium' : 'High';
  const riskColor = riskLevel < 40 ? 'bg-green-500' : riskLevel < 70 ? 'bg-yellow-500' : 'bg-red-500';

  const metrics = [
    { label: 'HRV', value: '65', unit: 'ms', trend: 'down', change: '-12%' },
    { label: 'Sleep', value: '6.5', unit: 'hrs', trend: 'down', change: '-1.5h' },
    { label: 'Stress', value: 'Medium', unit: '', trend: 'up', change: '+15%' },
    { label: 'Screen', value: '4.2', unit: 'hrs', trend: 'up', change: '+40%' },
  ];

  const triggers = [
    { name: 'Screen Time', impact: 85, icon: '📱' },
    { name: 'Sleep Debt', impact: 72, icon: '😴' },
    { name: 'Stress Level', impact: 68, icon: '😰' },
    { name: 'HRV Drop', impact: 45, icon: '💓' },
  ];

  const chartData = [
    { day: 'Mon', risk: 42 },
    { day: 'Tue', risk: 38 },
    { day: 'Wed', risk: 55 },
    { day: 'Thu', risk: 48 },
    { day: 'Fri', risk: 62 },
    { day: 'Sat', risk: 45 },
    { day: 'Sun', risk: 34 },
  ];

  return (
    <View className="flex-1 bg-white">
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
              MIGRAINE RISK INDEs
            </Text>
            <View className="flex-row items-end mb-4">
              <Text className="text-white text-7xl font-bold">{riskLevel}</Text>
              <Text className="text-white text-3xl font-bold mb-2">%</Text>
            </View>
            <View className="flex-row items-center mb-6">
              <View className={`w-3 h-3 rounded-full ${riskColor} mr-2`} />
              <Text className="text-gray-300 text-lg font-medium">{riskStatus} Risk</Text>
            </View>

            {/* Mini Trend Chart */}
            <View className="flex-row items-end justify-between h-24 border-t border-gray-800 pt-4">
              {chartData.map((item, index) => (
                <View key={index} className="flex-1 items-center mx-1">
                  <View 
                    className={`w-full rounded-t-lg ${
                      index === chartData.length - 1 ? 'bg-white' : 'bg-gray-700'
                    }`}
                    style={{ height: `${item.risk}%` }}
                  />
                  <Text className="text-gray-500 text-xs mt-2">{item.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

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
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">{trigger.icon}</Text>
                  <Text className="text-base font-medium text-black">{trigger.name}</Text>
                </View>
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
              <View className="w-10 bg-black h-10 bg-black rounded-full bg-black items-center justify-center mr-3">
                <Text className="text-xl">💡</Text>
              </View>
              <Text className="text-white text-lg font-semibold">AI Insight</Text>
            </View>
            <Text className="text-gray-300 text-base leading-6 mb-4">
              Your HRV dropped 18% today and screen time exed usual by 40%. Consider taking breaks every 30 minutes and hydrate more frequently.
            </Text>
            <TouchableOpacity 
              className="bg-white rounded-full py-3 px-6 self-start"
              activeOpacity={0.8}
            >
              <Text className="text-black font-semibold">🔊 Play Voice Alert</Text>
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
          <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
            <Text className="text-sm font-semibold text-gray-900 mb-3">Heart Rate Variability (HRV)</Text>
            <View className="h-32 bg-gray-50 rounded-xl items-center justify-center">
              <Text className="text-gray-400">📊 Chart will render here</Text>
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
            <Text className="text-sm font-semibold text-gray-900 mb-3">Sleep Quality</Text>
            <View className="h-32 bg-gray-50 rounded-xl items-center justify-center">
              <Text className="text-gray-400">📊 Chart will render here</Text>
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
            <Text className="text-sm font-semibold text-gray-900 mb-3">Stress Levels</Text>
            <View className="h-32 bg-gray-50 rounded-xl items-center justify-center">
              <Text className="text-gray-400">📊 Chart will render here</Text>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Padding */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
