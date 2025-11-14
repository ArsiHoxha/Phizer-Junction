import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';

export default function DashboardIntroScreen({ navigation }: any) {
  const features = [
    {
      icon: '🎯',
      title: 'Migraine Risk Index',
      description: 'Real-time prediction from 0-100% based on your health data',
    },
    {
      icon: '📊',
      title: 'Trend Analytics',
      description: 'Visual charts tracking HRV, sleep, stress, and screen time',
    },
    {
      icon: '⚡',
      title: 'Trigger Insights',
      description: 'AI identifies your top contributing factors each day',
    },
    {
      icon: '💡',
      title: 'Personalized Tips',
      description: 'Smart recommendations to prevent migraines before they start',
    },
    {
      icon: '🔔',
      title: 'Voice Alerts',
      description: 'Get notified when your risk level increases',
    },
  ];

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.duration(800)}
          className="px-8 pt-16 pb-8"
        >
          <Text className="text-4xl font-bold text-black mb-4">
            Your Dashboard
          </Text>
          <Text className="text-base text-gray-600 leading-6">
            Everything you need to stay ahead of migraines
          </Text>
        </Animated.View>

        {/* Preview Card */}
        <Animated.View 
          entering={FadeIn.duration(1000).delay(300)}
          className="mx-8 mb-8 p-8 bg-black rounded-3xl"
        >
          <View className="items-center">
            <Text className="text-gray-400 text-sm mb-2">MIGRAINE RISK INDEX</Text>
            <Text className="text-white text-7xl font-bold mb-2">34%</Text>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-green-400 mr-2" />
              <Text className="text-gray-300 text-base">Low Risk</Text>
            </View>
          </View>

          {/* Mini Chart Visualization */}
          <View className="mt-8 flex-row items-end justify-between h-20">
            {[40, 60, 45, 70, 50, 80, 34].map((height, index) => (
              <View
                key={index}
                className="flex-1 mx-1 bg-gray-700 rounded-t-lg"
                style={{ height: `${height}%` }}
              />
            ))}
          </View>
          <Text className="text-gray-400 text-xs text-center mt-2">Last 7 days</Text>
        </Animated.View>

        {/* Features List */}
        <View className="px-8 mb-8">
          <Text className="text-xl font-semibold text-black mb-6">
            What You'll Get
          </Text>
          {features.map((feature, index) => (
            <Animated.View
              key={index}
              entering={FadeInUp.duration(500).delay(400 + index * 100)}
              className="mb-5 flex-row"
            >
              <View className="w-14 h-14 rounded-2xl bg-gray-100 items-center justify-center mr-4">
                <Text className="text-3xl">{feature.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-black mb-1">
                  {feature.title}
                </Text>
                <Text className="text-sm text-gray-600 leading-5">
                  {feature.description}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* How It Works */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(800)}
          className="mx-8 mb-8 p-6 bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-200"
        >
          <Text className="text-base font-semibold text-black mb-3">
            How It Works
          </Text>
          <View className="space-y-3">
            <View className="flex-row items-start">
              <Text className="text-gray-900 font-bold mr-3">1.</Text>
              <Text className="text-sm text-gray-700 flex-1 leading-5">
                We passively monitor your health metrics 24/7
              </Text>
            </View>
            <View className="flex-row items-start mt-2">
              <Text className="text-gray-900 font-bold mr-3">2.</Text>
              <Text className="text-sm text-gray-700 flex-1 leading-5">
                AI analyzes patterns and predicts migraine risk
              </Text>
            </View>
            <View className="flex-row items-start mt-2">
              <Text className="text-gray-900 font-bold mr-3">3.</Text>
              <Text className="text-sm text-gray-700 flex-1 leading-5">
                You receive personalized tips and alerts to prevent attacks
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Remember Box */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(1000)}
          className="mx-8 mb-8 p-6 bg-black rounded-3xl"
        >
          <Text className="text-white font-semibold text-base mb-2">
            ✨ Remember
          </Text>
          <Text className="text-gray-300 text-sm leading-6">
            Everything happens automatically. Just live your life, and we'll watch over your health.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="px-8 pb-8 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.navigate('Dashboard')}
          className="bg-black rounded-full py-5 mb-3"
          activeOpacity={0.8}
        >
          <Text className="text-white text-center text-lg font-semibold">
            Go to Dashboard
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="py-3"
        >
          <Text className="text-gray-500 text-center">Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
